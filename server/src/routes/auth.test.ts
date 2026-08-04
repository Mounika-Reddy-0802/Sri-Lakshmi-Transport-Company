// Integration tests for the auth endpoints, run against the seeded database.
// Requires `npm run seed` to have been run at least once.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../app";
import { connectToDatabase, disconnectFromDatabase } from "../db";
import { REFRESH_COOKIE } from "../auth/cookies";

const PASSWORD = process.env.SEED_PASSWORD ?? "Sltc@12345";
const ADMIN = "admin@sltc.co.in";
const ORG = "transport@svkm.example.com";
const STUDENT = "parent.aarav@example.com";

/** Pulls the refresh cookie out of a Set-Cookie header. */
function refreshCookieFrom(headers: Record<string, unknown>): string {
  const raw = headers["set-cookie"];
  const cookies = Array.isArray(raw) ? (raw as string[]) : [];
  const found = cookies.find((c) => c.startsWith(`${REFRESH_COOKIE}=`));
  if (!found) throw new Error("no refresh cookie was set");
  return found.split(";")[0] ?? "";
}

async function login(email: string, password = PASSWORD) {
  return request(app).post("/api/auth/login").send({ email, password });
}

beforeAll(async () => {
  await connectToDatabase();
});

afterAll(async () => {
  await disconnectFromDatabase();
});

describe("POST /api/auth/login", () => {
  it("logs in each seeded role", async () => {
    for (const [email, role] of [
      [ADMIN, "admin"],
      [ORG, "org"],
      [STUDENT, "student"],
    ] as const) {
      const res = await login(email);
      expect(res.status, `${role} login`).toBe(200);
      expect(res.body.accessToken).toBeTypeOf("string");
      expect(res.body.user.role).toBe(role);
      // The hash must never travel to the client.
      expect(JSON.stringify(res.body)).not.toContain("$2a$");
    }
  });

  it("scopes non-admin users to an organization and leaves admin unscoped", async () => {
    const admin = await login(ADMIN);
    expect(admin.body.user.organizationId).toBeUndefined();

    const org = await login(ORG);
    expect(org.body.user.organizationId).toBeTypeOf("string");

    const student = await login(STUDENT);
    expect(student.body.user.studentId).toBeTypeOf("string");
  });

  it("sets an httpOnly refresh cookie", async () => {
    const res = await login(ADMIN);
    const raw = res.headers["set-cookie"] as unknown as string[];
    const cookie = raw.find((c) => c.startsWith(`${REFRESH_COOKIE}=`));
    expect(cookie).toBeDefined();
    expect(cookie).toContain("HttpOnly");
  });

  it("rejects a wrong password with a generic 401", async () => {
    const res = await login(ADMIN, "definitely-not-the-password");
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Invalid email or password.");
  });

  it("gives an unknown email the identical message (no user enumeration)", async () => {
    const unknown = await login("nobody@nowhere.example.com");
    const wrongPassword = await login(ADMIN, "definitely-not-the-password");

    expect(unknown.status).toBe(401);
    expect(unknown.body.error.message).toBe(wrongPassword.body.error.message);
    expect(unknown.body.error.code).toBe(wrongPassword.body.error.code);
  });

  it("rejects a malformed email at the boundary", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "not-an-email", password: "x" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/auth/me", () => {
  it("rejects a missing token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects a garbage token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer not.a.jwt");
    expect(res.status).toBe(401);
  });

  it("rejects a token signed with the wrong secret", async () => {
    // Correct shape, wrong signature — must not be accepted.
    const forged =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
      "eyJzdWIiOiIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAiLCJyb2xlIjoiYWRtaW4ifQ." +
      "Zm9yZ2VkLXNpZ25hdHVyZS1ub3QtdmFsaWQ";
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  it("returns the caller when the token is valid", async () => {
    const { body } = await login(ORG);
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(ORG);
    expect(res.body.role).toBe("org");
    expect(res.body.passwordHash).toBeUndefined();
  });
});

describe("POST /api/auth/refresh", () => {
  it("rotates the refresh token and issues a new access token", async () => {
    const first = await login(ADMIN);
    const firstCookie = refreshCookieFrom(first.headers);

    const refreshed = await request(app).post("/api/auth/refresh").set("Cookie", firstCookie);

    expect(refreshed.status).toBe(200);
    expect(refreshed.body.accessToken).toBeTypeOf("string");

    // Rotation: a different refresh token comes back...
    const secondCookie = refreshCookieFrom(refreshed.headers);
    expect(secondCookie).not.toBe(firstCookie);

    // ...and the rotated one still works.
    const again = await request(app).post("/api/auth/refresh").set("Cookie", secondCookie);
    expect(again.status).toBe(200);
  });

  it("rejects a request with no refresh token", async () => {
    const res = await request(app).post("/api/auth/refresh");
    expect(res.status).toBe(401);
  });

  it("rejects a tampered refresh token", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `${REFRESH_COOKIE}=eyJhbGciOiJIUzI1NiJ9.tampered.signature`);
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("invalidates refresh tokens issued before it", async () => {
    const session = await login(STUDENT);
    const cookie = refreshCookieFrom(session.headers);

    // Works before logout.
    expect((await request(app).post("/api/auth/refresh").set("Cookie", cookie)).status).toBe(200);

    const loggedOut = await request(app).post("/api/auth/logout").set("Cookie", cookie);
    expect(loggedOut.status).toBe(200);

    // The same token must now be refused.
    const after = await request(app).post("/api/auth/refresh").set("Cookie", cookie);
    expect(after.status).toBe(401);
  });
});
