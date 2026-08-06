// Admin-only user management.
//
// Until this existed, the only accounts in the system were the three the seed
// created — you could add an organization through the portal and then have no
// way to give it a login. This is what makes onboarding a real client possible.
//
// Rules enforced here rather than trusted to the caller:
//   - only an admin may reach any of it
//   - an admin account must NOT be scoped to an organization; org and student
//     accounts MUST be (otherwise tenant scoping has nothing to filter on)
//   - a student account must point at a student record
//   - you cannot delete, deactivate, or demote your own account (lock-out guard)
//   - passwordHash never leaves the server
import { Router, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { connectToDatabase } from "../db";
import { Organization, Student, User, type Role, type UserDoc } from "../models";
import { badRequest, conflict, notFound } from "../http/errors";
import { paginate } from "../http/list";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { zodValidate } from "../middleware/validate";
import { idParam, userCreate, userListQuery, userUpdate } from "./schemas";

export const usersRouter = Router();

const BCRYPT_ROUNDS = 12;

/** Everything the API is willing to say about a user. Never the hash. */
function present(user: UserDoc & { organizationId?: unknown }) {
  const org = user.organizationId as { _id?: unknown; name?: string } | undefined;
  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: org?._id ? String(org._id) : (user.organizationId?.toString() ?? null),
    organizationName: org?.name ?? null,
    studentId: user.studentId?.toString() ?? null,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt,
  };
}

/**
 * Checks the role/scope invariant. Returns an error message, or null when the
 * combination is valid.
 */
async function validateScope(
  role: Role,
  organizationId?: string,
  studentId?: string,
): Promise<string | null> {
  if (role === "admin") {
    if (organizationId) return "An admin account must not be tied to an organization.";
    return null;
  }

  if (!organizationId) return `A '${role}' account must belong to an organization.`;
  if (!(await Organization.exists({ _id: organizationId }))) {
    return "That organization does not exist.";
  }

  if (role === "student") {
    if (!studentId) return "A student account must be linked to a student record.";
    const student = await Student.findById(studentId).lean().exec();
    if (!student) return "That student record does not exist.";
    // A parent login pointed at a child in a different school would read across
    // the tenant boundary on every request.
    if (student.organizationId.toString() !== organizationId) {
      return "That student belongs to a different organization.";
    }
  }

  return null;
}

usersRouter.get(
  "/users",
  requireAuth,
  requireAdmin,
  zodValidate({ query: userListQuery }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await connectToDatabase();
      const { page, limit, q, role } = req.query as unknown as {
        page: number;
        limit: number;
        q?: string;
        role?: Role;
      };

      const filter: Record<string, unknown> = {};
      if (role) filter.role = role;
      if (q) {
        const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = [{ name: rx }, { email: rx }];
      }

      const result = await paginate(User, filter, {
        page,
        limit,
        sort: { createdAt: -1 },
        populate: ["organizationId"],
      });

      res.status(200).json({
        ...result,
        data: result.data.map((user) => present(user as UserDoc)),
      });
    } catch (error) {
      next(error);
    }
  },
);

usersRouter.post(
  "/users",
  requireAuth,
  requireAdmin,
  zodValidate({ body: userCreate }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await connectToDatabase();
      const body = req.body as {
        name: string;
        email: string;
        password: string;
        role: Role;
        organizationId?: string;
        studentId?: string;
        isActive?: boolean;
      };

      const scopeError = await validateScope(body.role, body.organizationId, body.studentId);
      if (scopeError) {
        next(badRequest(scopeError));
        return;
      }

      if (await User.exists({ email: body.email })) {
        next(conflict("An account with that email already exists."));
        return;
      }

      const created = await User.create({
        name: body.name,
        email: body.email,
        passwordHash: await bcrypt.hash(body.password, BCRYPT_ROUNDS),
        role: body.role,
        ...(body.organizationId ? { organizationId: new Types.ObjectId(body.organizationId) } : {}),
        ...(body.studentId ? { studentId: new Types.ObjectId(body.studentId) } : {}),
        isActive: body.isActive ?? true,
      });

      res.status(201).json(present(created.toObject() as UserDoc));
    } catch (error) {
      next(error);
    }
  },
);

usersRouter.patch(
  "/users/:id",
  requireAuth,
  requireAdmin,
  zodValidate({ params: idParam, body: userUpdate }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await connectToDatabase();
      const id = req.params.id as string;
      const body = req.body as Partial<{
        name: string;
        email: string;
        password: string;
        role: Role;
        organizationId: string;
        studentId: string;
        isActive: boolean;
      }>;

      const existing = await User.findById(id).exec();
      if (!existing) {
        next(notFound("No user with that id."));
        return;
      }

      const isSelf = req.auth?.userId === id;
      // Removing your own admin rights or access mid-session locks you out of
      // the only account that can undo it.
      if (isSelf && body.isActive === false) {
        next(badRequest("You cannot deactivate your own account."));
        return;
      }
      if (isSelf && body.role && body.role !== existing.role) {
        next(badRequest("You cannot change your own role."));
        return;
      }

      const role = body.role ?? existing.role;
      const organizationId =
        body.organizationId ?? existing.organizationId?.toString() ?? undefined;
      const studentId = body.studentId ?? existing.studentId?.toString() ?? undefined;

      const scopeError = await validateScope(role, organizationId, studentId);
      if (scopeError) {
        next(badRequest(scopeError));
        return;
      }

      if (body.email && body.email !== existing.email) {
        if (await User.exists({ email: body.email })) {
          next(conflict("An account with that email already exists."));
          return;
        }
        existing.email = body.email;
      }

      if (body.name) existing.name = body.name;
      if (body.isActive !== undefined) existing.isActive = body.isActive;
      if (body.password) {
        existing.passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
        // Changing the password must invalidate sessions opened with the old
        // one, which is exactly what bumping tokenVersion does.
        existing.tokenVersion += 1;
      }

      existing.role = role;
      existing.organizationId = organizationId ? new Types.ObjectId(organizationId) : undefined;
      existing.studentId = studentId ? new Types.ObjectId(studentId) : undefined;

      await existing.save();
      res.status(200).json(present(existing.toObject() as UserDoc));
    } catch (error) {
      next(error);
    }
  },
);

usersRouter.delete(
  "/users/:id",
  requireAuth,
  requireAdmin,
  zodValidate({ params: idParam }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await connectToDatabase();
      const id = req.params.id as string;

      if (req.auth?.userId === id) {
        next(badRequest("You cannot delete your own account."));
        return;
      }

      // Refuse to remove the last admin — otherwise nobody can administer
      // anything and the only fix is editing the database by hand.
      const target = await User.findById(id).exec();
      if (!target) {
        next(notFound("No user with that id."));
        return;
      }
      if (target.role === "admin" && (await User.countDocuments({ role: "admin" })) <= 1) {
        next(badRequest("This is the only admin account — create another before deleting it."));
        return;
      }

      await User.deleteOne({ _id: id }).exec();
      res.status(200).json({ ok: true, id });
    } catch (error) {
      next(error);
    }
  },
);
