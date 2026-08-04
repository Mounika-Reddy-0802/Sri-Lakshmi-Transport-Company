// Authentication, role checks, and the multi-tenant scoping helper.
//
// Global Rules: "Non-admin requests are always filtered by the caller's
// organizationId. A student only sees their own records. Write a helper and use
// it — never query a collection unscoped in a request handler." That helper is
// scopeToTenant(), at the bottom of this file.
import type { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import { forbidden, unauthorized } from "../http/errors";
import { verifyAccessToken } from "../auth/tokens";
import type { Role } from "../models";

export type AuthContext = {
  userId: string;
  role: Role;
  organizationId?: string;
  studentId?: string;
};

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthContext;
  }
}

function bearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

/** Rejects the request unless it carries a valid, unexpired access token. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = bearerToken(req);
  if (!token) {
    next(unauthorized("Authentication required."));
    return;
  }

  try {
    const claims = verifyAccessToken(token);
    req.auth = {
      userId: claims.sub,
      role: claims.role,
      ...(claims.organizationId ? { organizationId: claims.organizationId } : {}),
      ...(claims.studentId ? { studentId: claims.studentId } : {}),
    };
    next();
  } catch (error) {
    // Distinguish expired from malformed so the frontend knows to refresh
    // rather than to log the user out. Neither message reveals anything.
    const expired = error instanceof Error && error.name === "TokenExpiredError";
    next(unauthorized(expired ? "Access token has expired." : "Invalid access token."));
  }
}

/** Requires the caller to hold one of `roles`. Use after requireAuth. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(unauthorized("Authentication required."));
      return;
    }
    if (!roles.includes(req.auth.role)) {
      next(forbidden("You do not have access to this resource."));
      return;
    }
    next();
  };
}

export const requireAdmin = requireRole("admin");

/**
 * Narrows a Mongoose filter to what the caller is allowed to see.
 *
 * - admin   → unchanged, sees everything
 * - org     → forced to its own organizationId
 * - student → forced to its own organizationId as well, and callers that hold
 *             per-student data should additionally pass through
 *             restrictToOwnStudent().
 *
 * An org/student token without an organizationId is treated as a hard failure
 * rather than silently widening the query.
 */
export function scopeToTenant<T extends Record<string, unknown>>(
  req: Request,
  filter: T = {} as T,
): T & { organizationId?: Types.ObjectId } {
  const auth = req.auth;
  if (!auth) throw unauthorized("Authentication required.");
  if (auth.role === "admin") return filter;

  if (!auth.organizationId) {
    throw forbidden("This account is not linked to an organization.");
  }

  return { ...filter, organizationId: new Types.ObjectId(auth.organizationId) };
}

/**
 * Further narrows a filter to a single student for `student` callers, so a
 * parent cannot read another child's records even inside their own school.
 */
export function restrictToOwnStudent<T extends Record<string, unknown>>(
  req: Request,
  filter: T = {} as T,
): T & { _id?: Types.ObjectId; studentId?: Types.ObjectId } {
  const auth = req.auth;
  if (!auth) throw unauthorized("Authentication required.");
  if (auth.role !== "student") return filter;

  if (!auth.studentId) {
    throw forbidden("This account is not linked to a student record.");
  }
  return { ...filter, studentId: new Types.ObjectId(auth.studentId) };
}

/** True when the caller may act on the given organization. */
export function canAccessOrganization(req: Request, organizationId: string): boolean {
  const auth = req.auth;
  if (!auth) return false;
  if (auth.role === "admin") return true;
  return auth.organizationId === organizationId;
}
