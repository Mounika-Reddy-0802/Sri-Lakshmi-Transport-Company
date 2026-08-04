// POST /api/auth/login | /refresh | /logout   ·   GET /api/auth/me
//
// Security notes:
// - Every failure path answers with the same generic message and a 401, so the
//   endpoint cannot be used to enumerate which email addresses exist.
// - The password comparison runs even when the user is not found, so response
//   timing does not leak existence either.
// - The refresh token is rotated on every use and returned only as an httpOnly
//   cookie; the access token is returned in the body for the client to hold in
//   memory.
import { Router, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectToDatabase } from "../db";
import { User } from "../models";
import { env } from "../config";
import { unauthorized } from "../http/errors";
import { zodValidate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../auth/tokens";
import { REFRESH_COOKIE, clearRefreshCookie, setRefreshCookie, ttlToMs } from "../auth/cookies";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("must be a valid email address"),
  password: z.string().min(1, "is required"),
});

// A bcrypt hash of a value nobody knows, compared against when the email does
// not exist so that both branches cost the same time.
const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEe.7Ll1D9pNSXKzhZ1lYq6Vc0Q5B0nGZm2";

const GENERIC_LOGIN_FAILURE = "Invalid email or password.";

authRouter.post(
  "/auth/login",
  zodValidate({ body: loginSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await connectToDatabase();
      const { email, password } = req.body as z.infer<typeof loginSchema>;

      const user = await User.findOne({ email }).select("+passwordHash");
      const matches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

      if (!user || !matches || !user.isActive) {
        next(unauthorized(GENERIC_LOGIN_FAILURE));
        return;
      }

      user.lastLoginAt = new Date();
      await user.save();

      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(user);
      setRefreshCookie(res, refreshToken, ttlToMs(env.JWT_REFRESH_TTL));

      res.status(200).json({
        accessToken,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId?.toString(),
          studentId: user.studentId?.toString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

authRouter.post("/auth/refresh", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await connectToDatabase();

    // Cookie first; the body fallback exists for non-browser clients.
    const cookies = req.cookies as Record<string, string> | undefined;
    const body = req.body as { refreshToken?: string } | undefined;
    const token = cookies?.[REFRESH_COOKIE] ?? body?.refreshToken;

    if (!token) {
      next(unauthorized("No refresh token supplied."));
      return;
    }

    let claims;
    try {
      claims = verifyRefreshToken(token);
    } catch {
      clearRefreshCookie(res);
      next(unauthorized("Refresh token is invalid or has expired."));
      return;
    }

    const user = await User.findById(claims.sub);

    // tokenVersion mismatch means the user logged out after this token was
    // issued, so it must not be honoured.
    if (!user || !user.isActive || user.tokenVersion !== claims.tokenVersion) {
      clearRefreshCookie(res);
      next(unauthorized("Refresh token is no longer valid."));
      return;
    }

    // Rotation: a fresh refresh token on every use.
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    setRefreshCookie(res, refreshToken, ttlToMs(env.JWT_REFRESH_TTL));

    res.status(200).json({ accessToken });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/auth/logout", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cookies = req.cookies as Record<string, string> | undefined;
    const token = cookies?.[REFRESH_COOKIE];

    if (token) {
      try {
        const claims = verifyRefreshToken(token);
        await connectToDatabase();
        // Invalidates every refresh token this user holds, on any device.
        await User.updateOne({ _id: claims.sub }, { $inc: { tokenVersion: 1 } });
      } catch {
        // An unreadable token is already useless — logging out is still a
        // success from the client's point of view.
      }
    }

    clearRefreshCookie(res);
    res.status(200).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

authRouter.get(
  "/auth/me",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await connectToDatabase();
      const user = await User.findById(req.auth?.userId);

      if (!user || !user.isActive) {
        next(unauthorized("This account is no longer active."));
        return;
      }

      res.status(200).json({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId?.toString(),
        studentId: user.studentId?.toString(),
        lastLoginAt: user.lastLoginAt,
      });
    } catch (error) {
      next(error);
    }
  },
);
