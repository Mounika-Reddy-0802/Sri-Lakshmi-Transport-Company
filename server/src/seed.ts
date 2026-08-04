// Idempotent seed for the SLTC database.
//
//   npm run seed            upsert everything (safe to re-run any number of times)
//   npm run seed -- --fresh drop the seeded collections first, then re-seed
//
// Every document is upserted on a natural key (email, regNumber, route code,
// studentCode, studentId+period), so running this twice produces exactly the
// same database as running it once — no duplicates, no drift.
//
// Organizations, vehicles, drivers and clients are the real ones from the SLTC
// company profile (mirrored in the frontend's lib/mock-data.ts). Financial
// figures are illustrative demo data.
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
  type BusStatus,
  type InvoiceStatus,
  type OrganizationType,
  type ReminderType,
} from "./models";

const FRESH = process.argv.includes("--fresh");
const FORCE = process.argv.includes("--force");

// Dev credentials. Override with SEED_PASSWORD when seeding anything shared.
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "Sltc@12345";

const date = (iso: string): Date => new Date(`${iso}T00:00:00.000Z`);

// ---------------------------------------------------------------- source data

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

const drivers = [
  { name: "R. Suresh", phone: "+91 81793 14684", licenceNumber: "TS02320210001", licenceExpiry: date("2026-06-30") },
  { name: "M. Iqbal", phone: "+91 70757 14684", licenceNumber: "TS02320210002", licenceExpiry: date("2027-03-14") },
  { name: "K. Prasad", phone: "+91 90000 11221", licenceNumber: "TS02320210003", licenceExpiry: date("2027-11-02") },
  { name: "D. Mohan", phone: "+91 90000 11222", licenceNumber: "TS02320210004", licenceExpiry: date("2028-01-19") },
  { name: "S. Babu", phone: "+91 90000 11223", licenceNumber: "TS02320210005", licenceExpiry: date("2027-08-27") },
  { name: "P. Ramesh", phone: "+91 90000 11224", licenceNumber: "TS02320210006", licenceExpiry: date("2028-05-06") },
  { name: "V. Naresh", phone: "+91 90000 11225", licenceNumber: "TS02320210007", licenceExpiry: date("2027-12-11") },
];

const routes = [
  { code: "SCH-A", name: "Jadcherla School Route A", org: "SVKM's School", distanceKm: 14, points: [
    { name: "Lake View Gate", pickupTime: "7:45 AM", dropTime: "3:55 PM" },
    { name: "Park Avenue", pickupTime: "7:55 AM", dropTime: "4:05 PM" },
  ] },
  { code: "SCH-B", name: "Jadcherla School Route B", org: "SVKM's School", distanceKm: 11, points: [
    { name: "North Junction", pickupTime: "7:40 AM", dropTime: "3:50 PM" },
    { name: "Temple Road", pickupTime: "7:50 AM", dropTime: "4:00 PM" },
  ] },
  { code: "PHR-1", name: "Jadcherla Pharma Staff", org: "Aurobindo Pharma", distanceKm: 26, points: [
    { name: "Jadcherla Bus Stand", pickupTime: "6:30 AM" },
    { name: "TSIIC Gate 2", pickupTime: "6:55 AM" },
  ] },
  { code: "UNI-1", name: "NMIMS Campus Shuttle", org: "NMIMS University", distanceKm: 18, points: [
    { name: "Jadcherla Town", pickupTime: "8:00 AM" },
  ] },
  { code: "AMZ-1", name: "RGI Airport Shuttle", org: "Amazon", distanceKm: 22, points: [
    { name: "Shamshabad Circle", pickupTime: "5:45 AM" },
  ] },
  { code: "ARJ-1", name: "Mahabubnagar Plant", org: "Amara Raja", distanceKm: 31, points: [
    { name: "Bhootpur Cross", pickupTime: "6:15 AM" },
  ] },
  { code: "AAP-1", name: "Shameerpet Staff", org: "AAP Pharma Technologies", distanceKm: 24, points: [
    { name: "Shameerpet Lake", pickupTime: "7:10 AM" },
  ] },
];

const buses: Array<{
  regNumber: string;
  type: string;
  capacity: number;
  isAc: boolean;
  org: string;
  route: string;
  driver: string;
  status: BusStatus;
  insurance: string;
  fitness: string;
  permit: string;
  puc: string;
}> = [
  { regNumber: "TS-09-AB-2231", type: "44 Seater", capacity: 44, isAc: false, org: "Aurobindo Pharma", route: "PHR-1", driver: "R. Suresh", status: "Active", insurance: "2026-06-22", fitness: "2027-02-10", permit: "2027-04-01", puc: "2026-10-15" },
  { regNumber: "TS-26-CD-1180", type: "40 Seater", capacity: 40, isAc: true, org: "Amara Raja", route: "ARJ-1", driver: "M. Iqbal", status: "Active", insurance: "2027-01-08", fitness: "2026-07-14", permit: "2027-05-20", puc: "2026-11-30" },
  { regNumber: "TS-10-EF-7745", type: "22 Seater", capacity: 22, isAc: true, org: "NMIMS University", route: "UNI-1", driver: "K. Prasad", status: "Active", insurance: "2027-03-19", fitness: "2027-06-05", permit: "2027-09-12", puc: "2026-12-22" },
  { regNumber: "TS-22-GH-9012", type: "17 Seater", capacity: 17, isAc: true, org: "Amazon", route: "AMZ-1", driver: "D. Mohan", status: "Maintenance", insurance: "2027-05-11", fitness: "2027-08-23", permit: "2028-01-04", puc: "2027-01-09" },
  { regNumber: "TS-28-IJ-3344", type: "38 Seater", capacity: 38, isAc: false, org: "AAP Pharma Technologies", route: "AAP-1", driver: "S. Babu", status: "Active", insurance: "2027-07-02", fitness: "2027-10-17", permit: "2028-02-28", puc: "2027-03-16" },
  { regNumber: "TS-11-KL-5567", type: "36 Seater", capacity: 36, isAc: false, org: "SVKM's School", route: "SCH-A", driver: "P. Ramesh", status: "Active", insurance: "2027-04-25", fitness: "2027-09-08", permit: "2028-03-15", puc: "2027-02-01" },
  { regNumber: "TS-11-MN-7788", type: "22 Seater", capacity: 22, isAc: false, org: "SVKM's School", route: "SCH-B", driver: "V. Naresh", status: "Active", insurance: "2027-06-30", fitness: "2027-11-21", permit: "2028-04-09", puc: "2027-04-18" },
];

const RATE_PER_KM = 220;

const students = [
  { studentCode: "SV-1042", name: "Aarav Menon", class: "Grade 7-B", route: "SCH-A", pickupPoint: "Lake View Gate", parent: { name: "Rohit Menon", phone: "+91 98490 10042", email: "parent.aarav@example.com" } },
  { studentCode: "SV-1043", name: "Diya Sharma", class: "Grade 5-A", route: "SCH-A", pickupPoint: "Park Avenue", parent: { name: "Neha Sharma", phone: "+91 98490 10043", email: "parent.diya@example.com" } },
  { studentCode: "SV-1044", name: "Kabir Rao", class: "Grade 9-C", route: "SCH-B", pickupPoint: "North Junction", parent: { name: "Anil Rao", phone: "+91 98490 10044", email: "parent.kabir@example.com" } },
  { studentCode: "SV-1045", name: "Anaya Iyer", class: "Grade 6-B", route: "SCH-B", pickupPoint: "Temple Road", parent: { name: "Lakshmi Iyer", phone: "+91 98490 10045", email: "parent.anaya@example.com" } },
];

// Billing history per student: matches the fee status shown in the org portal.
const invoicePlan: Record<string, Array<{ period: string; status: InvoiceStatus }>> = {
  "SV-1042": [
    { period: "2026-05", status: "paid" },
    { period: "2026-06", status: "paid" },
    { period: "2026-07", status: "pending" },
  ],
  "SV-1043": [
    { period: "2026-05", status: "paid" },
    { period: "2026-06", status: "paid" },
    { period: "2026-07", status: "pending" },
  ],
  "SV-1044": [
    { period: "2026-05", status: "paid" },
    { period: "2026-06", status: "pending" },
    { period: "2026-07", status: "pending" },
  ],
  "SV-1045": [
    { period: "2026-05", status: "overdue" },
    { period: "2026-06", status: "overdue" },
    { period: "2026-07", status: "pending" },
  ],
};

const reminders: Array<{
  type: ReminderType;
  title: string;
  detail: string;
  dueDate: string;
  amount?: number;
  bus?: string;
  driver?: string;
}> = [
  { type: "insurance", title: "Insurance renewal", detail: "Bus TS-09-AB-2231 insurance expires", dueDate: "2026-06-22", bus: "TS-09-AB-2231" },
  { type: "licence", title: "Driver licence expiry", detail: "R. Suresh — DL expiry approaching", dueDate: "2026-06-30", driver: "R. Suresh" },
  { type: "emi", title: "Vehicle loan EMI", detail: "Vehicle loan EMI for 3 buses due", dueDate: "2026-07-05", amount: 246000 },
  { type: "tax", title: "Quarterly road tax", detail: "Quarterly road tax — 7 vehicles", dueDate: "2026-07-10", amount: 112000 },
  { type: "fitness", title: "Fitness renewal", detail: "Bus TS-26-CD-1180 fitness renewal", dueDate: "2026-07-14", bus: "TS-26-CD-1180" },
];

// --------------------------------------------------------------------- helpers

const upsertOptions = {
  upsert: true,
  new: true,
  setDefaultsOnInsert: true,
  runValidators: true,
} as const;

function periodDue(period: string): Date {
  return date(`${period}-05`);
}

function invoiceNumber(period: string, studentCode: string): string {
  return `INV-${period.replace("-", "")}-${studentCode}`;
}

// ------------------------------------------------------------------ the seed

async function seed(): Promise<void> {
  if (env.NODE_ENV === "production" && !FORCE) {
    throw new Error(
      "Refusing to seed a production database. Re-run with --force if that is genuinely what you want.",
    );
  }
  if (FRESH && env.NODE_ENV === "production") {
    throw new Error("Refusing to wipe collections while NODE_ENV=production.");
  }

  await connectToDatabase();
  console.log(`seeding ${mongoose.connection.name} (NODE_ENV=${env.NODE_ENV})\n`);

  if (FRESH) {
    console.log("--fresh: dropping seeded collections");
    await Promise.all([
      Organization.deleteMany({}),
      User.deleteMany({}),
      Driver.deleteMany({}),
      Route.deleteMany({}),
      Bus.deleteMany({}),
      Student.deleteMany({}),
      Invoice.deleteMany({}),
      Reminder.deleteMany({}),
    ]);
  }

  // Organizations ----------------------------------------------------------
  const orgIdByName = new Map<string, mongoose.Types.ObjectId>();
  for (const org of organizations) {
    const doc = await Organization.findOneAndUpdate(
      { name: org.name },
      { $set: org },
      upsertOptions,
    );
    orgIdByName.set(org.name, doc._id);
  }

  // Drivers ----------------------------------------------------------------
  const driverIdByName = new Map<string, mongoose.Types.ObjectId>();
  for (const driver of drivers) {
    const doc = await Driver.findOneAndUpdate(
      { licenceNumber: driver.licenceNumber },
      { $set: driver },
      upsertOptions,
    );
    driverIdByName.set(driver.name, doc._id);
  }

  // Routes -----------------------------------------------------------------
  const routeIdByCode = new Map<string, mongoose.Types.ObjectId>();
  for (const route of routes) {
    const organizationId = orgIdByName.get(route.org);
    if (!organizationId) throw new Error(`Unknown organization '${route.org}' on route ${route.code}`);

    const doc = await Route.findOneAndUpdate(
      { code: route.code },
      {
        $set: {
          name: route.name,
          distanceKm: route.distanceKm,
          pickupPoints: route.points,
          organizationId,
        },
      },
      upsertOptions,
    );
    routeIdByCode.set(route.code, doc._id);
  }

  // Buses, then the reciprocal links back onto routes -----------------------
  const busIdByReg = new Map<string, mongoose.Types.ObjectId>();
  for (const bus of buses) {
    const organizationId = orgIdByName.get(bus.org);
    const routeId = routeIdByCode.get(bus.route);
    const driverId = driverIdByName.get(bus.driver);
    if (!organizationId || !routeId || !driverId) {
      throw new Error(`Unresolved reference on bus ${bus.regNumber}`);
    }

    const doc = await Bus.findOneAndUpdate(
      { regNumber: bus.regNumber },
      {
        $set: {
          type: bus.type,
          capacity: bus.capacity,
          isAc: bus.isAc,
          status: bus.status,
          organizationId,
          routeId,
          driverId,
          insurance: { expiryDate: date(bus.insurance) },
          fitness: { expiryDate: date(bus.fitness) },
          permit: { expiryDate: date(bus.permit) },
          puc: { expiryDate: date(bus.puc) },
        },
      },
      upsertOptions,
    );
    busIdByReg.set(bus.regNumber, doc._id);

    await Route.updateOne({ _id: routeId }, { $set: { busId: doc._id, driverId } });
  }

  // Students ---------------------------------------------------------------
  const studentIdByCode = new Map<string, mongoose.Types.ObjectId>();
  const school = orgIdByName.get("SVKM's School");
  if (!school) throw new Error("SVKM's School was not seeded");

  for (const student of students) {
    const routeId = routeIdByCode.get(student.route);
    if (!routeId) throw new Error(`Unknown route '${student.route}' for ${student.studentCode}`);

    const doc = await Student.findOneAndUpdate(
      { studentCode: student.studentCode },
      {
        $set: {
          name: student.name,
          class: student.class,
          parent: student.parent,
          pickupPoint: student.pickupPoint,
          routeId,
          organizationId: school,
          ratePerKm: RATE_PER_KM,
        },
      },
      upsertOptions,
    );
    studentIdByCode.set(student.studentCode, doc._id);
  }

  // Invoices — amount is distance x rate per km, as in the student portal ----
  for (const student of students) {
    const studentId = studentIdByCode.get(student.studentCode);
    const routeDef = routes.find((r) => r.code === student.route);
    if (!studentId || !routeDef) throw new Error(`Cannot bill ${student.studentCode}`);

    const amount = routeDef.distanceKm * RATE_PER_KM;
    const plan = invoicePlan[student.studentCode] ?? [];

    for (const entry of plan) {
      await Invoice.findOneAndUpdate(
        { studentId, period: entry.period },
        {
          $set: {
            invoiceNumber: invoiceNumber(entry.period, student.studentCode),
            organizationId: school,
            amount,
            status: entry.status,
            dueDate: periodDue(entry.period),
            ...(entry.status === "paid" ? { paidAt: periodDue(entry.period) } : {}),
          },
        },
        upsertOptions,
      );
    }
  }

  // Reminders --------------------------------------------------------------
  for (const reminder of reminders) {
    await Reminder.findOneAndUpdate(
      { type: reminder.type, title: reminder.title, dueDate: date(reminder.dueDate) },
      {
        $set: {
          detail: reminder.detail,
          amount: reminder.amount,
          status: "open",
          busId: reminder.bus ? busIdByReg.get(reminder.bus) : undefined,
          driverId: reminder.driver ? driverIdByName.get(reminder.driver) : undefined,
        },
      },
      upsertOptions,
    );
  }

  // Users — one per role ----------------------------------------------------
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);
  const aarav = studentIdByCode.get("SV-1042");

  const seededUsers = [
    { name: "SLTC Operations", email: "admin@sltc.co.in", role: "admin" as const },
    {
      name: "SVKM's School Transport",
      email: "transport@svkm.example.com",
      role: "org" as const,
      organizationId: school,
    },
    {
      name: "Rohit Menon",
      email: "parent.aarav@example.com",
      role: "student" as const,
      organizationId: school,
      studentId: aarav,
    },
  ];

  for (const user of seededUsers) {
    // Created through the model (not findOneAndUpdate) so the pre-validate hook
    // that enforces tenant scoping actually runs.
    const existing = await User.findOne({ email: user.email });
    if (existing) {
      existing.set({ ...user, passwordHash, isActive: true });
      await existing.save();
    } else {
      await User.create({ ...user, passwordHash, isActive: true });
    }
  }

  // Counts -----------------------------------------------------------------
  const counts = {
    organizations: await Organization.countDocuments(),
    users: await User.countDocuments(),
    drivers: await Driver.countDocuments(),
    routes: await Route.countDocuments(),
    buses: await Bus.countDocuments(),
    students: await Student.countDocuments(),
    invoices: await Invoice.countDocuments(),
    reminders: await Reminder.countDocuments(),
  };

  console.log("seeded:");
  for (const [collection, count] of Object.entries(counts)) {
    console.log(`  ${collection.padEnd(14)} ${count}`);
  }

  console.log("\nlogins (all share the same password):");
  for (const user of seededUsers) {
    console.log(`  ${user.role.padEnd(8)} ${user.email}`);
  }
  console.log(`  password  ${SEED_PASSWORD}`);
}

seed()
  .then(async () => {
    await disconnectFromDatabase();
    console.log("\ndone");
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error("\nseed failed:", error instanceof Error ? error.message : error);
    await disconnectFromDatabase().catch(() => undefined);
    process.exit(1);
  });
