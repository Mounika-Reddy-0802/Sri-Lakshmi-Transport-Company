// User management is how accounts — and therefore access — are created, so the
// guards around it are tested directly.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { Types } from "mongoose";
import app from "../app";
import { connectToDatabase, disconnectFromDatabase } from "../db";
import { Organization, Student, User } from "../models";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  FIXTURE_PASSWORD,
  cleanupFixtures,
  createTenant,
} from "../testing/fixtures";

const NEW_PASSWORD = "ZzTestUser@2026";

let adminToken = "";
let orgToken = "";
let orgAId: Types.ObjectId;
let orgBId: Types.ObjectId;
let studentBId: Types.ObjectId;
const created: string[] = [];

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

async function login(email: string, password: string) {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body.accessToken as string;
}

beforeAll(async () => {
  await connectToDatabase();

  const orgA = await Organization.create({ name: "ZZ Users Org A", type: "School" });
  const orgB = await Organization.create({ name: "ZZ Users Org B", type: "Corporate" });
  const studentB = await Student.create({
    studentCode: "ZZ-U-B-1",
    name: "ZZ Child B",
    class: "Grade 3",
    pickupPoint: "Gate",
    organizationId: orgB._id,
    ratePerKm: 100,
  });

  orgAId = orgA._id;
  orgBId = orgB._id;
  studentBId = studentB._id;

  adminToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  // An org account to prove /users is closed to non-admins.
  await cleanupFixtures();
  const tenant = await createTenant("Users");
  orgToken = await login(tenant.orgEmail, FIXTURE_PASSWORD);
});

afterAll(async () => {
  await cleanupFixtures();
  await Promise.all([
    User.deleteMany({ email: /^zzuser/i }),
    Student.deleteMany({ studentCode: "ZZ-U-B-1" }),
    Organization.deleteMany({ name: { $in: ["ZZ Users Org A", "ZZ Users Org B"] } }),
  ]);
  await disconnectFromDatabase();
});

describe("access control", () => {
  it("refuses an unauthenticated caller", async () => {
    expect((await request(app).get("/api/users")).status).toBe(401);
  });

  it("refuses an organization user", async () => {
    expect((await request(app).get("/api/users").set(auth(orgToken))).status).toBe(403);
    const res = await request(app)
      .post("/api/users")
      .set(auth(orgToken))
      .send({ name: "Nope", email: "zzuser.nope@example.com", password: NEW_PASSWORD, role: "admin" });
    expect(res.status).toBe(403);
    expect(await User.exists({ email: "zzuser.nope@example.com" })).toBeNull();
  });

  it("lets an admin list users without ever exposing a hash", async () => {
    const res = await request(app).get("/api/users?limit=50").set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(JSON.stringify(res.body)).not.toContain("$2a$");
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
  });
});

describe("creating accounts", () => {
  it("creates an organization login that can actually sign in", async () => {
    const res = await request(app)
      .post("/api/users")
      .set(auth(adminToken))
      .send({
        name: "ZZ Org A Admin",
        email: "zzuser.orga@example.com",
        password: NEW_PASSWORD,
        role: "org",
        organizationId: orgAId.toString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.role).toBe("org");
    expect(res.body.passwordHash).toBeUndefined();
    created.push(res.body._id);

    // The whole point: the new account works.
    const token = await login("zzuser.orga@example.com", NEW_PASSWORD);
    expect(token).toBeTypeOf("string");

    const me = await request(app).get("/api/auth/me").set(auth(token));
    expect(me.status).toBe(200);
    expect(me.body.organizationId).toBe(orgAId.toString());
  });

  it("rejects a duplicate email with 409", async () => {
    const res = await request(app)
      .post("/api/users")
      .set(auth(adminToken))
      .send({
        name: "Duplicate",
        email: "zzuser.orga@example.com",
        password: NEW_PASSWORD,
        role: "org",
        organizationId: orgAId.toString(),
      });
    expect(res.status).toBe(409);
  });

  it("rejects a short password at the boundary", async () => {
    const res = await request(app)
      .post("/api/users")
      .set(auth(adminToken))
      .send({ name: "Short", email: "zzuser.short@example.com", password: "abc", role: "admin" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("refuses an org account with no organization — it would escape tenant scoping", async () => {
    const res = await request(app)
      .post("/api/users")
      .set(auth(adminToken))
      .send({ name: "Unscoped", email: "zzuser.unscoped@example.com", password: NEW_PASSWORD, role: "org" });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain("must belong to an organization");
  });

  it("refuses an admin account tied to an organization", async () => {
    const res = await request(app)
      .post("/api/users")
      .set(auth(adminToken))
      .send({
        name: "Scoped admin",
        email: "zzuser.scopedadmin@example.com",
        password: NEW_PASSWORD,
        role: "admin",
        organizationId: orgAId.toString(),
      });
    expect(res.status).toBe(400);
  });

  it("refuses a parent login pointed at another organization's child", async () => {
    // Org A parent, org B child — would read across the tenant boundary.
    const res = await request(app)
      .post("/api/users")
      .set(auth(adminToken))
      .send({
        name: "Cross tenant parent",
        email: "zzuser.cross@example.com",
        password: NEW_PASSWORD,
        role: "student",
        organizationId: orgAId.toString(),
        studentId: studentBId.toString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain("different organization");
    expect(await User.exists({ email: "zzuser.cross@example.com" })).toBeNull();
  });

  it("allows a parent login for a child in the same organization", async () => {
    const res = await request(app)
      .post("/api/users")
      .set(auth(adminToken))
      .send({
        name: "ZZ Parent B",
        email: "zzuser.parentb@example.com",
        password: NEW_PASSWORD,
        role: "student",
        organizationId: orgBId.toString(),
        studentId: studentBId.toString(),
      });
    expect(res.status).toBe(201);
    created.push(res.body._id);
  });
});

describe("updating accounts", () => {
  it("changing the password invalidates existing sessions", async () => {
    const token = await login("zzuser.orga@example.com", NEW_PASSWORD);
    const session = await request(app).post("/api/auth/login").send({
      email: "zzuser.orga@example.com",
      password: NEW_PASSWORD,
    });
    const cookie = (session.headers["set-cookie"] as unknown as string[])[0]?.split(";")[0] ?? "";

    // Refresh works before the change.
    expect((await request(app).post("/api/auth/refresh").set("Cookie", cookie)).status).toBe(200);

    const id = created[0] as string;
    const res = await request(app)
      .patch(`/api/users/${id}`)
      .set(auth(adminToken))
      .send({ password: "AnotherPassword@2026" });
    expect(res.status).toBe(200);

    // ...and not after it.
    expect((await request(app).post("/api/auth/refresh").set("Cookie", cookie)).status).toBe(401);
    expect(token).toBeTypeOf("string");

    // The new password is the one that works now.
    const after = await request(app).post("/api/auth/login").send({
      email: "zzuser.orga@example.com",
      password: "AnotherPassword@2026",
    });
    expect(after.status).toBe(200);
  });

  it("stops an admin deactivating their own account", async () => {
    const me = await request(app).get("/api/auth/me").set(auth(adminToken));
    const res = await request(app)
      .patch(`/api/users/${me.body.id}`)
      .set(auth(adminToken))
      .send({ isActive: false });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain("your own account");
  });

  it("stops an admin changing their own role", async () => {
    const me = await request(app).get("/api/auth/me").set(auth(adminToken));
    const res = await request(app)
      .patch(`/api/users/${me.body.id}`)
      .set(auth(adminToken))
      .send({ role: "org", organizationId: orgAId.toString() });
    expect(res.status).toBe(400);
  });
});

describe("deleting accounts", () => {
  it("stops an admin deleting themselves", async () => {
    const me = await request(app).get("/api/auth/me").set(auth(adminToken));
    const res = await request(app).delete(`/api/users/${me.body.id}`).set(auth(adminToken));
    expect(res.status).toBe(400);
    expect(await User.exists({ _id: me.body.id })).not.toBeNull();
  });

  it("deletes another account", async () => {
    const id = created[1] as string;
    const res = await request(app).delete(`/api/users/${id}`).set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(await User.exists({ _id: id })).toBeNull();
  });

  it("404s on an unknown id", async () => {
    const res = await request(app)
      .delete(`/api/users/${new Types.ObjectId().toString()}`)
      .set(auth(adminToken));
    expect(res.status).toBe(404);
  });
});
