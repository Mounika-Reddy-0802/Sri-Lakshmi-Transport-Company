// Multi-tenant isolation, end to end through the real HTTP stack.
//
// This is the test that matters most in the whole suite: it asserts that a
// logged-in user of organization A cannot read organization B's students or
// invoices by any of the routes the API exposes — list, read-by-id, nested
// resource, dashboard, or report.
//
// Fixtures are created here and removed afterwards, so the seeded data is left
// exactly as it was.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import app from "../app";
import { connectToDatabase, disconnectFromDatabase } from "../db";
import { Invoice, Organization, Student, User } from "../models";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "../testing/fixtures";

const PASSWORD = "TenantTest@12345";

const orgAName = "ZZ Test Org A";
const orgBName = "ZZ Test Org B";

type Fixture = {
  orgAId: Types.ObjectId;
  orgBId: Types.ObjectId;
  studentAId: Types.ObjectId;
  studentBId: Types.ObjectId;
  invoiceBId: Types.ObjectId;
};

let fx: Fixture;
let tokenA = "";
let tokenB = "";
let adminToken = "";

async function login(email: string, password: string): Promise<string> {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  expect(res.status, `login ${email}`).toBe(200);
  return res.body.accessToken as string;
}

beforeAll(async () => {
  await connectToDatabase();
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const orgA = await Organization.create({ name: orgAName, type: "School" });
  const orgB = await Organization.create({ name: orgBName, type: "Corporate" });

  const studentA = await Student.create({
    studentCode: "ZZ-A-001",
    name: "Test Child A",
    class: "Grade 1",
    pickupPoint: "Gate A",
    organizationId: orgA._id,
    ratePerKm: 100,
  });
  const studentB = await Student.create({
    studentCode: "ZZ-B-001",
    name: "Test Child B",
    class: "Grade 2",
    pickupPoint: "Gate B",
    organizationId: orgB._id,
    ratePerKm: 100,
  });

  await Invoice.create({
    invoiceNumber: "ZZ-INV-A-1",
    studentId: studentA._id,
    organizationId: orgA._id,
    period: "2026-01",
    amount: 1000,
    status: "pending",
    dueDate: new Date("2026-01-05"),
  });
  const invoiceB = await Invoice.create({
    invoiceNumber: "ZZ-INV-B-1",
    studentId: studentB._id,
    organizationId: orgB._id,
    period: "2026-01",
    amount: 9999,
    status: "pending",
    dueDate: new Date("2026-01-05"),
  });

  await User.create({
    name: "Org A User",
    email: "zz.orga@example.com",
    passwordHash,
    role: "org",
    organizationId: orgA._id,
  });
  await User.create({
    name: "Org B User",
    email: "zz.orgb@example.com",
    passwordHash,
    role: "org",
    organizationId: orgB._id,
  });

  fx = {
    orgAId: orgA._id,
    orgBId: orgB._id,
    studentAId: studentA._id,
    studentBId: studentB._id,
    invoiceBId: invoiceB._id,
  };

  tokenA = await login("zz.orga@example.com", PASSWORD);
  tokenB = await login("zz.orgb@example.com", PASSWORD);
  adminToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
});

afterAll(async () => {
  await Promise.all([
    User.deleteMany({ email: { $in: ["zz.orga@example.com", "zz.orgb@example.com"] } }),
    Invoice.deleteMany({ invoiceNumber: { $in: ["ZZ-INV-A-1", "ZZ-INV-B-1"] } }),
    Student.deleteMany({ studentCode: { $in: ["ZZ-A-001", "ZZ-B-001"] } }),
    Organization.deleteMany({ name: { $in: [orgAName, orgBName] } }),
  ]);
  await disconnectFromDatabase();
});

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe("tenant isolation — students", () => {
  it("org A's student list contains only org A students", async () => {
    const res = await request(app).get("/api/students?limit=100").set(auth(tokenA));

    expect(res.status).toBe(200);
    const codes = res.body.data.map((s: { studentCode: string }) => s.studentCode);
    expect(codes).toContain("ZZ-A-001");
    expect(codes).not.toContain("ZZ-B-001");
  });

  it("org A cannot read org B's student by id", async () => {
    const res = await request(app)
      .get(`/api/students/${fx.studentBId.toString()}`)
      .set(auth(tokenA));

    // 404, not 403 — org A must not learn that this id exists at all.
    expect(res.status).toBe(404);
    expect(JSON.stringify(res.body)).not.toContain("Test Child B");
  });

  it("org A cannot read org B's student invoices", async () => {
    const res = await request(app)
      .get(`/api/students/${fx.studentBId.toString()}/invoices`)
      .set(auth(tokenA));

    expect(res.status).toBe(404);
    expect(JSON.stringify(res.body)).not.toContain("ZZ-INV-B-1");
  });

  it("each org sees its own student and only its own", async () => {
    const a = await request(app).get(`/api/students/${fx.studentAId.toString()}`).set(auth(tokenA));
    const b = await request(app).get(`/api/students/${fx.studentBId.toString()}`).set(auth(tokenB));

    expect(a.status).toBe(200);
    expect(a.body.name).toBe("Test Child A");
    expect(b.status).toBe(200);
    expect(b.body.name).toBe("Test Child B");
  });
});

describe("tenant isolation — invoices", () => {
  it("org A's invoice list excludes org B invoices", async () => {
    const res = await request(app).get("/api/invoices?limit=100").set(auth(tokenA));

    expect(res.status).toBe(200);
    const numbers = res.body.data.map((i: { invoiceNumber: string }) => i.invoiceNumber);
    expect(numbers).toContain("ZZ-INV-A-1");
    expect(numbers).not.toContain("ZZ-INV-B-1");
  });

  it("org A cannot read org B's invoice by id", async () => {
    const res = await request(app)
      .get(`/api/invoices/${fx.invoiceBId.toString()}`)
      .set(auth(tokenA));
    expect(res.status).toBe(404);
  });

  it("a forged organizationId query parameter does not widen the scope", async () => {
    // The caller explicitly asks for org B's data while holding an org A token.
    const res = await request(app)
      .get(`/api/invoices?limit=100&organizationId=${fx.orgBId.toString()}`)
      .set(auth(tokenA));

    expect(res.status).toBe(200);
    const numbers = res.body.data.map((i: { invoiceNumber: string }) => i.invoiceNumber);
    expect(numbers).not.toContain("ZZ-INV-B-1");
  });
});

describe("tenant isolation — organizations and dashboards", () => {
  it("org A sees only itself in the organization list", async () => {
    const res = await request(app).get("/api/organizations?limit=100").set(auth(tokenA));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe(orgAName);
  });

  it("org A is refused org B's dashboard", async () => {
    const res = await request(app)
      .get(`/api/dashboard/organization/${fx.orgBId.toString()}`)
      .set(auth(tokenA));

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("org A can load its own dashboard", async () => {
    const res = await request(app)
      .get(`/api/dashboard/organization/${fx.orgAId.toString()}`)
      .set(auth(tokenA));

    expect(res.status).toBe(200);
    expect(res.body.organization.name).toBe(orgAName);
    expect(JSON.stringify(res.body)).not.toContain("Test Child B");
  });

  it("org users are refused the admin dashboard", async () => {
    const res = await request(app).get("/api/dashboard/admin").set(auth(tokenA));
    expect(res.status).toBe(403);
  });

  it("the admin dashboard works for an admin", async () => {
    const res = await request(app).get("/api/dashboard/admin").set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.kpis)).toBe(true);
    expect(Array.isArray(res.body.revenueTrend)).toBe(true);
  });
});

describe("tenant isolation — reports", () => {
  it("org A's revenue report excludes org B amounts", async () => {
    const res = await request(app).get("/api/reports/revenue").set(auth(tokenA));

    expect(res.status).toBe(200);
    // Org B's only invoice is 9999; it must not appear in org A's totals.
    expect(res.body.totals.revenue).not.toBe(9999);
    const jan = res.body.data.find((r: { period: string }) => r.period === "2026-01");
    expect(jan?.revenue).toBe(1000);
  });

  it("org A's pending report lists only its own invoices", async () => {
    const res = await request(app).get("/api/reports/pending?limit=100").set(auth(tokenA));

    expect(res.status).toBe(200);
    const numbers = res.body.data.map((i: { invoiceNumber: string }) => i.invoiceNumber);
    expect(numbers).toContain("ZZ-INV-A-1");
    expect(numbers).not.toContain("ZZ-INV-B-1");
  });
});

describe("write access", () => {
  it("an org user cannot create a student", async () => {
    const res = await request(app)
      .post("/api/students")
      .set(auth(tokenA))
      .send({
        studentCode: "ZZ-HACK-1",
        name: "Should Not Exist",
        class: "Grade 3",
        pickupPoint: "Nowhere",
        organizationId: fx.orgAId.toString(),
        ratePerKm: 100,
      });

    expect(res.status).toBe(403);
    expect(await Student.countDocuments({ studentCode: "ZZ-HACK-1" })).toBe(0);
  });

  it("an org user cannot delete another org's student", async () => {
    const res = await request(app)
      .delete(`/api/students/${fx.studentBId.toString()}`)
      .set(auth(tokenA));

    expect(res.status).toBe(403);
    expect(await Student.countDocuments({ _id: fx.studentBId })).toBe(1);
  });

  it("unauthenticated requests are rejected everywhere", async () => {
    for (const path of [
      "/api/students",
      "/api/invoices",
      "/api/buses",
      "/api/dashboard/admin",
      "/api/reports/revenue",
    ]) {
      const res = await request(app).get(path);
      expect(res.status, path).toBe(401);
    }
  });
});

describe("validation and pagination", () => {
  it("rejects a non-ObjectId path parameter with 400", async () => {
    const res = await request(app).get("/api/students/not-an-id").set(auth(tokenA));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects an out-of-range limit", async () => {
    const res = await request(app).get("/api/students?limit=5000").set(auth(tokenA));
    expect(res.status).toBe(400);
  });

  it("returns the documented list envelope", async () => {
    const res = await request(app).get("/api/students?page=1&limit=1").set(auth(tokenA));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("page", 1);
    expect(res.body).toHaveProperty("limit", 1);
    expect(res.body).toHaveProperty("total");
    expect(res.body.data.length).toBeLessThanOrEqual(1);
  });
});
