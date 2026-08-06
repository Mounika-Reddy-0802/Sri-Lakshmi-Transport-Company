// Test fixtures.
//
// The suite used to sign in as the demo accounts the seed created. The seed now
// only creates the administrator — real client logins are entered by hand —
// so tests build the org and parent accounts they need and remove them again.
// That is better isolation anyway: a test no longer breaks because seed data
// changed.
import request from "supertest";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import app from "../app";
import { Organization, Student, User } from "../models";

export const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "sltc.shyam6666@gmail.com";
export const ADMIN_PASSWORD =
  process.env.SEED_ADMIN_PASSWORD ?? process.env.SEED_PASSWORD ?? "Sltc@12345";

/** Everything this module creates is prefixed so cleanup is unambiguous. */
export const FIXTURE_PREFIX = "zzfix";
export const FIXTURE_PASSWORD = "FixturePass@2026";

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

export async function login(email: string, password: string): Promise<string> {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  if (res.status !== 200) {
    throw new Error(`login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.accessToken as string;
}

export const loginAsAdmin = () => login(ADMIN_EMAIL, ADMIN_PASSWORD);

export type TenantFixture = {
  organizationId: Types.ObjectId;
  studentId: Types.ObjectId;
  orgEmail: string;
  studentEmail: string;
};

/**
 * Creates an organization with one student, an org login and a parent login.
 * `key` keeps parallel fixtures from colliding on unique indexes.
 */
export async function createTenant(key: string): Promise<TenantFixture> {
  const passwordHash = await bcrypt.hash(FIXTURE_PASSWORD, 10);

  const organization = await Organization.create({
    name: `${FIXTURE_PREFIX} Org ${key}`,
    type: "School",
  });

  const student = await Student.create({
    studentCode: `${FIXTURE_PREFIX.toUpperCase()}-${key}-1`,
    name: `Fixture Child ${key}`,
    class: "Grade 5",
    pickupPoint: "Fixture Gate",
    organizationId: organization._id,
    ratePerKm: 100,
  });

  const orgEmail = `${FIXTURE_PREFIX}.org.${key.toLowerCase()}@example.com`;
  const studentEmail = `${FIXTURE_PREFIX}.parent.${key.toLowerCase()}@example.com`;

  await User.create({
    name: `Fixture Org ${key}`,
    email: orgEmail,
    passwordHash,
    role: "org",
    organizationId: organization._id,
  });

  await User.create({
    name: `Fixture Parent ${key}`,
    email: studentEmail,
    passwordHash,
    role: "student",
    organizationId: organization._id,
    studentId: student._id,
  });

  return {
    organizationId: organization._id,
    studentId: student._id,
    orgEmail,
    studentEmail,
  };
}

/** Removes everything any fixture in this module created. */
export async function cleanupFixtures(): Promise<void> {
  const rx = new RegExp(`^${FIXTURE_PREFIX}`, "i");
  await Promise.all([
    User.deleteMany({ email: rx }),
    Student.deleteMany({ studentCode: rx }),
    Organization.deleteMany({ name: rx }),
  ]);
}
