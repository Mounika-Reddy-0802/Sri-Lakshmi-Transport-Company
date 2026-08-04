// Unit tests for the RBAC and multi-tenant guards. These are the rules that
// stop one client reading another client's data, so they are tested directly
// rather than only through the endpoints that happen to use them.
import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { Types } from "mongoose";
import type { Request } from "express";
import {
  canAccessOrganization,
  requireAuth,
  requireRole,
  restrictToOwnStudent,
  scopeToTenant,
  type AuthContext,
} from "./auth";
import { errorHandler } from "./error";
import { ApiError } from "../http/errors";

const ORG_A = new Types.ObjectId().toString();
const ORG_B = new Types.ObjectId().toString();
const STUDENT_ID = new Types.ObjectId().toString();

const fakeRequest = (auth?: AuthContext): Request => ({ auth }) as unknown as Request;

/** A throwaway app that injects an identity, so the guards can be tested alone. */
function appWithIdentity(auth: AuthContext | undefined, ...roles: AuthContext["role"][]) {
  const app = express();
  app.get(
    "/admin-only",
    (req, _res, next) => {
      req.auth = auth;
      next();
    },
    requireRole(...roles),
    (_req, res) => res.status(200).json({ ok: true }),
  );
  app.use(errorHandler);
  return app;
}

describe("scopeToTenant", () => {
  it("leaves an admin query untouched", () => {
    const filter = scopeToTenant(fakeRequest({ userId: "u1", role: "admin" }), { status: "Active" });
    expect(filter).toEqual({ status: "Active" });
    expect(filter.organizationId).toBeUndefined();
  });

  it("forces an org caller onto its own organizationId", () => {
    const filter = scopeToTenant(
      fakeRequest({ userId: "u2", role: "org", organizationId: ORG_A }),
      { status: "Active" },
    );
    expect(filter.organizationId?.toString()).toBe(ORG_A);
    expect(filter.status).toBe("Active");
  });

  it("overrides an attacker-supplied organizationId rather than trusting it", () => {
    // The caller asks for org B's data while holding an org A token.
    const filter = scopeToTenant(fakeRequest({ userId: "u3", role: "org", organizationId: ORG_A }), {
      organizationId: new Types.ObjectId(ORG_B),
    });
    expect(filter.organizationId?.toString()).toBe(ORG_A);
    expect(filter.organizationId?.toString()).not.toBe(ORG_B);
  });

  it("scopes a student caller too", () => {
    const filter = scopeToTenant(
      fakeRequest({ userId: "u4", role: "student", organizationId: ORG_A, studentId: STUDENT_ID }),
    );
    expect(filter.organizationId?.toString()).toBe(ORG_A);
  });

  it("refuses rather than widening when a non-admin has no organization", () => {
    expect(() => scopeToTenant(fakeRequest({ userId: "u5", role: "org" }))).toThrowError(ApiError);
  });

  it("refuses an unauthenticated request", () => {
    expect(() => scopeToTenant(fakeRequest(undefined))).toThrowError(ApiError);
  });
});

describe("restrictToOwnStudent", () => {
  it("pins a student caller to their own record", () => {
    const filter = restrictToOwnStudent(
      fakeRequest({ userId: "u6", role: "student", organizationId: ORG_A, studentId: STUDENT_ID }),
    );
    expect(filter.studentId?.toString()).toBe(STUDENT_ID);
  });

  it("does not restrict org or admin callers", () => {
    expect(restrictToOwnStudent(fakeRequest({ userId: "u7", role: "admin" }))).toEqual({});
    expect(
      restrictToOwnStudent(fakeRequest({ userId: "u8", role: "org", organizationId: ORG_A })),
    ).toEqual({});
  });
});

describe("canAccessOrganization", () => {
  it("lets an admin reach any organization", () => {
    expect(canAccessOrganization(fakeRequest({ userId: "u9", role: "admin" }), ORG_B)).toBe(true);
  });

  it("lets an org reach only its own", () => {
    const req = fakeRequest({ userId: "u10", role: "org", organizationId: ORG_A });
    expect(canAccessOrganization(req, ORG_A)).toBe(true);
    expect(canAccessOrganization(req, ORG_B)).toBe(false);
  });

  it("denies an unauthenticated caller", () => {
    expect(canAccessOrganization(fakeRequest(undefined), ORG_A)).toBe(false);
  });
});

describe("requireRole", () => {
  it("allows a matching role", async () => {
    const res = await request(appWithIdentity({ userId: "u11", role: "admin" }, "admin")).get(
      "/admin-only",
    );
    expect(res.status).toBe(200);
  });

  it("rejects an org user from an admin-only route with 403", async () => {
    const res = await request(
      appWithIdentity({ userId: "u12", role: "org", organizationId: ORG_A }, "admin"),
    ).get("/admin-only");

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("rejects a student from an admin-only route with 403", async () => {
    const res = await request(
      appWithIdentity(
        { userId: "u13", role: "student", organizationId: ORG_A, studentId: STUDENT_ID },
        "admin",
      ),
    ).get("/admin-only");
    expect(res.status).toBe(403);
  });

  it("rejects an unauthenticated caller with 401, not 403", async () => {
    const res = await request(appWithIdentity(undefined, "admin")).get("/admin-only");
    expect(res.status).toBe(401);
  });
});

describe("requireAuth", () => {
  it("rejects a request with no Authorization header", async () => {
    const app = express();
    app.get("/private", requireAuth, (_req, res) => res.status(200).json({ ok: true }));
    app.use(errorHandler);

    const res = await request(app).get("/private");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects a non-Bearer Authorization header", async () => {
    const app = express();
    app.get("/private", requireAuth, (_req, res) => res.status(200).json({ ok: true }));
    app.use(errorHandler);

    const res = await request(app).get("/private").set("Authorization", "Basic abc123");
    expect(res.status).toBe(401);
  });
});
