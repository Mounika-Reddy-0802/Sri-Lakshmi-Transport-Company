// JWT issuing and verification.
//
// Two separate secrets so a leaked access token can never be replayed as a
// refresh token. Access tokens are short-lived and carry the claims the API
// authorises against; refresh tokens carry only what is needed to mint a new
// pair.
import { randomUUID } from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { Types } from "mongoose";
import { env } from "../config";
import type { Role } from "../models";

export type AccessClaims = {
  sub: string;
  role: Role;
  organizationId?: string;
  studentId?: string;
};

export type RefreshClaims = {
  sub: string;
  tokenVersion: number;
  /**
   * Unique per issued token. Without it two refresh tokens minted for the same
   * user in the same second are byte-identical (the payload is otherwise just
   * sub/tokenVersion/iat/exp), which makes rotation a no-op and leaves nothing
   * to key reuse-detection on later.
   */
  jti: string;
};

type TokenSource = {
  _id: Types.ObjectId;
  role: Role;
  organizationId?: Types.ObjectId;
  studentId?: Types.ObjectId;
  tokenVersion: number;
};

export function signAccessToken(user: TokenSource): string {
  const claims: AccessClaims = {
    sub: user._id.toString(),
    role: user.role,
    ...(user.organizationId ? { organizationId: user.organizationId.toString() } : {}),
    ...(user.studentId ? { studentId: user.studentId.toString() } : {}),
  };
  const options: SignOptions = { expiresIn: env.JWT_ACCESS_TTL as SignOptions["expiresIn"] };
  return jwt.sign(claims, env.JWT_ACCESS_SECRET, options);
}

export function signRefreshToken(user: TokenSource): string {
  const claims: RefreshClaims = {
    sub: user._id.toString(),
    tokenVersion: user.tokenVersion,
    jti: randomUUID(),
  };
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_TTL as SignOptions["expiresIn"] };
  return jwt.sign(claims, env.JWT_REFRESH_SECRET, options);
}

/** Throws (JsonWebTokenError / TokenExpiredError) when the token is not valid. */
export function verifyAccessToken(token: string): AccessClaims {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessClaims;
}

export function verifyRefreshToken(token: string): RefreshClaims {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshClaims;
}
