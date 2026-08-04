// Registers the six core resources (plus reminders, which the admin portal's
// alert panel needs) on one router.
//
// Each entry declares its own scope function. Note that none of them can be
// omitted: createResourceRouter defaults to the standard tenant scope, so the
// worst a careless addition can do is over-restrict, never over-share.
import { Router, type Request } from "express";
import { Types, type FilterQuery } from "mongoose";
import { Bus, Driver, Invoice, Organization, Reminder, Route, Student } from "../models";
import type { BusDoc, DriverDoc, InvoiceDoc, OrganizationDoc, ReminderDoc, RouteDoc, StudentDoc } from "../models";
import { forbidden } from "../http/errors";
import { scopeToTenant } from "../middleware/auth";
import { createResourceRouter } from "./resources";
import {
  busCreate,
  busUpdate,
  driverCreate,
  driverUpdate,
  invoiceCreate,
  invoiceListQuery,
  invoiceUpdate,
  organizationCreate,
  organizationUpdate,
  reminderCreate,
  reminderUpdate,
  routeCreate,
  routeUpdate,
  studentCreate,
  studentUpdate,
} from "./schemas";

export const resourcesRouter = Router();

/** Organizations are scoped by _id, not organizationId. */
function organizationScope(req: Request): FilterQuery<OrganizationDoc> {
  const auth = req.auth;
  if (!auth) throw forbidden("Authentication required.");
  if (auth.role === "admin") return {};
  if (!auth.organizationId) throw forbidden("This account is not linked to an organization.");
  return { _id: new Types.ObjectId(auth.organizationId) };
}

/** A student user may only ever see their own student record. */
function studentScope(req: Request): FilterQuery<StudentDoc> {
  const base = scopeToTenant(req) as FilterQuery<StudentDoc>;
  const auth = req.auth;
  if (auth?.role === "student") {
    if (!auth.studentId) throw forbidden("This account is not linked to a student record.");
    return { ...base, _id: new Types.ObjectId(auth.studentId) };
  }
  return base;
}

/** ...and only their own invoices. */
function invoiceScope(req: Request): FilterQuery<InvoiceDoc> {
  const base = scopeToTenant(req) as FilterQuery<InvoiceDoc>;
  const auth = req.auth;
  if (auth?.role === "student") {
    if (!auth.studentId) throw forbidden("This account is not linked to a student record.");
    return { ...base, studentId: new Types.ObjectId(auth.studentId) };
  }
  return base;
}

resourcesRouter.use(
  createResourceRouter<OrganizationDoc>({
    path: "organizations",
    model: Organization,
    createSchema: organizationCreate,
    updateSchema: organizationUpdate,
    searchFields: ["name", "location", "type"],
    sort: { name: 1 },
    scope: organizationScope,
  }),
);

resourcesRouter.use(
  createResourceRouter<BusDoc>({
    path: "buses",
    model: Bus,
    createSchema: busCreate,
    updateSchema: busUpdate,
    searchFields: ["regNumber", "type"],
    sort: { regNumber: 1 },
    populate: ["organizationId", "routeId", "driverId"],
    filterFields: ["status"],
  }),
);

resourcesRouter.use(
  createResourceRouter<DriverDoc>({
    path: "drivers",
    model: Driver,
    createSchema: driverCreate,
    updateSchema: driverUpdate,
    searchFields: ["name", "phone", "licenceNumber"],
    sort: { name: 1 },
  }),
);

resourcesRouter.use(
  createResourceRouter<RouteDoc>({
    path: "routes",
    model: Route,
    createSchema: routeCreate,
    updateSchema: routeUpdate,
    searchFields: ["code", "name"],
    sort: { code: 1 },
    populate: ["busId", "driverId"],
  }),
);

resourcesRouter.use(
  createResourceRouter<StudentDoc>({
    path: "students",
    model: Student,
    createSchema: studentCreate,
    updateSchema: studentUpdate,
    searchFields: ["name", "studentCode", "class", "pickupPoint"],
    sort: { name: 1 },
    populate: ["routeId"],
    scope: studentScope,
    // GET /students/:id is served by the enriched handler in portal.ts.
    excludeGetOne: true,
  }),
);

resourcesRouter.use(
  createResourceRouter<InvoiceDoc>({
    path: "invoices",
    model: Invoice,
    createSchema: invoiceCreate,
    updateSchema: invoiceUpdate,
    querySchema: invoiceListQuery,
    searchFields: ["invoiceNumber", "period"],
    sort: { dueDate: -1 },
    populate: ["studentId"],
    scope: invoiceScope,
    filterFields: ["status", "period"],
  }),
);

resourcesRouter.use(
  createResourceRouter<ReminderDoc>({
    path: "reminders",
    model: Reminder,
    createSchema: reminderCreate,
    updateSchema: reminderUpdate,
    searchFields: ["title", "detail"],
    sort: { dueDate: 1 },
    filterFields: ["status", "type"],
  }),
);
