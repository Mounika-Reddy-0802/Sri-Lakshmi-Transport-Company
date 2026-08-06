// Seed for the SLTC database.
//
//   npm run seed             upsert the baseline (safe to re-run any number of times)
//   npm run seed -- --fresh  clear the operational collections first, then seed
//
// What this seeds, deliberately, is ONLY what is genuinely known:
//
//   - the eight real client organizations from the SLTC company profile
//   - one administrator account, on the real company email
//
// It does NOT invent buses, drivers, routes, students, invoices or reminders.
// Those are real operational records and are entered through the admin portal;
// fabricating them produced dashboards that looked convincing and were wrong.
// Organization and parent logins are created from Admin -> Users, against the
// email addresses those clients actually use.
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { env } from "./config";
import { connectToDatabase, disconnectFromDatabase } from "./db";
import {
  Bus,
  Driver,
  Invoice,
  Organization,
  Reminder,
  Route,
  Student,
  User,
  type OrganizationType,
} from "./models";

const FRESH = process.argv.includes("--fresh");
const FORCE = process.argv.includes("--force");

// The administrator sign-in. The password is only a starting point — change it
// from Admin -> Users on first sign-in, which also signs out any old session.
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "sltc.shyam6666@gmail.com";
const ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? "SLTC Operations";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? process.env.SEED_PASSWORD ?? "Sltc@12345";

// ---------------------------------------------------------------- source data

/** The real client list from the company profile — same names the site shows. */
const organizations: Array<{
  name: string;
  type: OrganizationType;
  location: string;
  clientSince: string;
  isActive: boolean;
}> = [
  { name: "Amazon", type: "Corporate", location: "Near RGI Airport", clientSince: "2021", isActive: true },
  { name: "Aurobindo Pharma", type: "Pharma", location: "TSIIC, Jadcherla", clientSince: "2022", isActive: true },
  { name: "NMIMS University", type: "University", location: "TSIIC, Jadcherla", clientSince: "2021 – Present", isActive: true },
  { name: "SVKM's School", type: "School", location: "TSIIC, Jadcherla", clientSince: "2021 – Present", isActive: true },
  { name: "Amara Raja", type: "Corporate", location: "Bhootpur, Mahabubnagar", clientSince: "2024 – Present", isActive: true },
  { name: "Trow Nutrition", type: "Corporate", location: "TSIIC, Jadcherla", clientSince: "2021 – 2024", isActive: false },
  { name: "AAP Pharma Technologies", type: "Pharma", location: "Shameerpet", clientSince: "2024 – Present", isActive: true },
  { name: "Shuttle Services Pvt Ltd", type: "Corporate", location: "Kondapur", clientSince: "2020", isActive: true },
];

const upsertOptions = {
  new: true,
  upsert: true,
  setDefaultsOnInsert: true,
  runValidators: true,
} as const;

async function seed(): Promise<void> {
  if (env.NODE_ENV === "production" && !FORCE) {
    throw new Error(
      "Refusing to seed a production database. Re-run with --force if that is genuinely what you want.",
    );
  }
  if (FRESH && env.NODE_ENV === "production") {
    throw new Error("Refusing to clear collections while NODE_ENV=production.");
  }

  await connectToDatabase();
  console.log(`seeding ${mongoose.connection.name} (NODE_ENV=${env.NODE_ENV})\n`);

  if (FRESH) {
    // Operational records only. Organizations and the admin account are
    // upserted below, so they survive either way.
    console.log("--fresh: clearing operational collections");
    const removed = await Promise.all([
      Bus.deleteMany({}),
      Driver.deleteMany({}),
      Route.deleteMany({}),
      Student.deleteMany({}),
      Invoice.deleteMany({}),
      Reminder.deleteMany({}),
      // Every login except the administrator; client logins are created by hand.
      User.deleteMany({ email: { $ne: ADMIN_EMAIL } }),
    ]);
    const labels = ["buses", "drivers", "routes", "students", "invoices", "reminders", "non-admin users"];
    removed.forEach((result, i) => {
      if (result.deletedCount > 0) console.log(`  removed ${result.deletedCount} ${labels[i]}`);
    });
    console.log("");
  }

  // Organizations ----------------------------------------------------------
  for (const org of organizations) {
    await Organization.findOneAndUpdate({ name: org.name }, { $set: org }, upsertOptions);
  }

  // Administrator ----------------------------------------------------------
  // Upserted on email so re-running never resets a password that has been
  // changed since — only a brand-new account gets the starting password.
  const existingAdmin = await User.findOne({ email: ADMIN_EMAIL }).exec();
  if (existingAdmin) {
    existingAdmin.name = ADMIN_NAME;
    existingAdmin.role = "admin";
    existingAdmin.organizationId = undefined;
    existingAdmin.isActive = true;
    await existingAdmin.save();
  } else {
    await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
      role: "admin",
      isActive: true,
    });
  }

  // Report -----------------------------------------------------------------
  const counts = {
    organizations: await Organization.countDocuments(),
    users: await User.countDocuments(),
    buses: await Bus.countDocuments(),
    drivers: await Driver.countDocuments(),
    routes: await Route.countDocuments(),
    students: await Student.countDocuments(),
    invoices: await Invoice.countDocuments(),
    reminders: await Reminder.countDocuments(),
  };

  console.log("database now holds:");
  for (const [label, value] of Object.entries(counts)) {
    console.log(`  ${label.padEnd(14)} ${value}`);
  }

  console.log("\nadministrator sign-in:");
  console.log(`  email     ${ADMIN_EMAIL}`);
  if (existingAdmin) {
    console.log("  password  unchanged (account already existed)");
  } else {
    console.log(`  password  ${ADMIN_PASSWORD}   <- change this from Admin -> Users`);
  }

  console.log("\nNext: sign in and add your real buses, drivers, routes and students,");
  console.log("then create each client's login from Admin -> Users.");
}

seed()
  .then(async () => {
    await disconnectFromDatabase();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error("seed failed:", error instanceof Error ? error.message : error);
    await disconnectFromDatabase();
    process.exit(1);
  });
