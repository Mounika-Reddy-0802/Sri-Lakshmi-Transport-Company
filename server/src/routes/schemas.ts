// Zod schemas for every resource endpoint. Global Rules: validate at the
// boundary, reject invalid input with 400, never let an unvalidated value reach
// a query or a model.
import { z } from "zod";
import {
  BUS_STATUSES,
  INVOICE_STATUSES,
  ORGANIZATION_TYPES,
  REMINDER_STATUSES,
  REMINDER_TYPES,
  ROLES,
} from "../models";
import { objectIdSchema, paginationQuery } from "../middleware/validate";

export const idParam = z.object({ id: objectIdSchema });

/** Every list endpoint accepts page/limit plus a free-text q. */
export const listQuery = paginationQuery.extend({
  q: z.string().trim().min(1).max(120).optional(),
});

const complianceItem = z.object({
  number: z.string().trim().optional(),
  expiryDate: z.coerce.date().optional(),
  documentUrl: z.string().trim().url().optional(),
});

const storedDocument = z.object({
  kind: z.string().trim().min(1),
  number: z.string().trim().optional(),
  url: z.string().trim().url().optional(),
  issuedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
});

// ------------------------------------------------------------- organizations

export const organizationCreate = z.object({
  name: z.string().trim().min(2).max(160),
  type: z.enum(ORGANIZATION_TYPES),
  location: z.string().trim().max(200).optional(),
  clientSince: z.string().trim().max(60).optional(),
  contactName: z.string().trim().max(120).optional(),
  contactEmail: z.string().trim().email().optional(),
  contactPhone: z.string().trim().max(30).optional(),
  gstNumber: z.string().trim().max(20).optional(),
  documents: z.array(storedDocument).optional(),
  isActive: z.boolean().optional(),
});
export const organizationUpdate = organizationCreate.partial();

// -------------------------------------------------------------------- buses

export const busCreate = z.object({
  regNumber: z.string().trim().min(4).max(20),
  type: z.string().trim().min(1).max(40),
  capacity: z.number().int().min(1).max(100),
  isAc: z.boolean().optional(),
  organizationId: objectIdSchema.optional(),
  routeId: objectIdSchema.optional(),
  driverId: objectIdSchema.optional(),
  status: z.enum(BUS_STATUSES).optional(),
  insurance: complianceItem.optional(),
  permit: complianceItem.optional(),
  fitness: complianceItem.optional(),
  puc: complianceItem.optional(),
});
export const busUpdate = busCreate.partial();

// ------------------------------------------------------------------ drivers

export const driverCreate = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(30),
  licenceNumber: z.string().trim().min(4).max(30),
  licenceExpiry: z.coerce.date(),
  aadhaar: z.string().trim().max(20).optional(),
  organizationId: objectIdSchema.optional(),
  documents: z.array(storedDocument).optional(),
  isActive: z.boolean().optional(),
});
export const driverUpdate = driverCreate.partial();

// ------------------------------------------------------------------- routes

const pickupPoint = z.object({
  name: z.string().trim().min(1).max(120),
  pickupTime: z.string().trim().max(20).optional(),
  dropTime: z.string().trim().max(20).optional(),
  distanceKm: z.number().min(0).optional(),
});

export const routeCreate = z.object({
  code: z.string().trim().min(2).max(20),
  name: z.string().trim().min(2).max(160),
  distanceKm: z.number().min(0).max(1000),
  pickupPoints: z.array(pickupPoint).optional(),
  organizationId: objectIdSchema,
  busId: objectIdSchema.optional(),
  driverId: objectIdSchema.optional(),
  isActive: z.boolean().optional(),
});
export const routeUpdate = routeCreate.partial();

// ----------------------------------------------------------------- students

export const studentCreate = z.object({
  studentCode: z.string().trim().min(2).max(30),
  name: z.string().trim().min(2).max(120),
  class: z.string().trim().min(1).max(40),
  parent: z
    .object({
      name: z.string().trim().max(120).optional(),
      phone: z.string().trim().max(30).optional(),
      email: z.string().trim().email().optional(),
    })
    .optional(),
  pickupPoint: z.string().trim().min(1).max(160),
  routeId: objectIdSchema.optional(),
  organizationId: objectIdSchema,
  ratePerKm: z.number().min(0).max(10000),
  isActive: z.boolean().optional(),
});
export const studentUpdate = studentCreate.partial();

// ----------------------------------------------------------------- invoices

export const invoiceCreate = z.object({
  invoiceNumber: z.string().trim().min(3).max(40),
  studentId: objectIdSchema,
  organizationId: objectIdSchema,
  period: z.string().regex(/^\d{4}-\d{2}$/, "must be formatted as YYYY-MM"),
  amount: z.number().min(0),
  status: z.enum(INVOICE_STATUSES).optional(),
  dueDate: z.coerce.date(),
});
export const invoiceUpdate = invoiceCreate.partial();

export const invoiceListQuery = listQuery.extend({
  status: z.enum(INVOICE_STATUSES).optional(),
  period: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
});

// ---------------------------------------------------------------- reminders

export const reminderCreate = z.object({
  type: z.enum(REMINDER_TYPES),
  title: z.string().trim().min(2).max(160),
  detail: z.string().trim().max(400).optional(),
  dueDate: z.coerce.date(),
  amount: z.number().min(0).optional(),
  status: z.enum(REMINDER_STATUSES).optional(),
  busId: objectIdSchema.optional(),
  driverId: objectIdSchema.optional(),
  organizationId: objectIdSchema.optional(),
});
export const reminderUpdate = reminderCreate.partial();

// ------------------------------------------------------------------ reports

export const reportQuery = z.object({
  months: z.coerce.number().int().min(1).max(24).default(6),
});

// -------------------------------------------------------------------- users

// Passwords are only ever accepted here; they are hashed in the router and the
// hash is never selected back out (User.passwordHash has select: false).
const passwordSchema = z
  .string()
  .min(8, "must be at least 8 characters")
  .max(200, "is too long");

export const userCreate = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email("must be a valid email address"),
  password: passwordSchema,
  role: z.enum(ROLES),
  organizationId: objectIdSchema.optional(),
  studentId: objectIdSchema.optional(),
  isActive: z.boolean().optional(),
});

export const userUpdate = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().toLowerCase().email("must be a valid email address").optional(),
  password: passwordSchema.optional(),
  role: z.enum(ROLES).optional(),
  organizationId: objectIdSchema.optional(),
  studentId: objectIdSchema.optional(),
  isActive: z.boolean().optional(),
});

export const userListQuery = listQuery.extend({
  role: z.enum(ROLES).optional(),
});

// ----------------------------------------------------------------- payments

export const paymentOrderBody = z.object({
  invoiceId: objectIdSchema,
});

// Field names are Razorpay's, exactly as its checkout handler returns them.
export const paymentVerifyBody = z.object({
  invoiceId: objectIdSchema,
  razorpay_order_id: z.string().trim().min(1),
  razorpay_payment_id: z.string().trim().min(1),
  razorpay_signature: z.string().trim().min(1),
});
