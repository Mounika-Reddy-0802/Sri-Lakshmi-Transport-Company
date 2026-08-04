// Dashboard aggregates.
//
//   GET /api/dashboard/admin              super-admin overview
//   GET /api/dashboard/organization/:id   one client's view
//
// Every response is shaped to match the frontend's lib/mock-data.ts exactly, so
// Phase 5 swaps the data source without touching a single component.
import { Router, type Request, type Response, type NextFunction } from "express";
import { Types } from "mongoose";
import { connectToDatabase } from "../db";
import { Bus, Invoice, Organization, Reminder, Route, Student } from "../models";
import { forbidden, notFound } from "../http/errors";
import { REMINDER_LABELS, longDate, monthLabel, rupees, rupeesCompact } from "../http/format";
import { canAccessOrganization, requireAdmin, requireAuth } from "../middleware/auth";
import { zodValidate } from "../middleware/validate";
import { idParam } from "./schemas";

export const dashboardRouter = Router();

type PeriodTotals = { _id: string; revenue: number; collected: number };

/** Billed vs collected per period, oldest first. `match` scopes it. */
async function revenueTrend(match: Record<string, unknown>, months = 6) {
  const rows = await Invoice.aggregate<PeriodTotals>([
    { $match: match },
    {
      $group: {
        _id: "$period",
        revenue: { $sum: "$amount" },
        collected: {
          $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]).exec();

  return rows.slice(-months).map((row) => ({
    month: monthLabel(row._id),
    period: row._id,
    revenue: row.revenue,
    collected: row.collected,
  }));
}

// --------------------------------------------------------------- admin view

dashboardRouter.get(
  "/dashboard/admin",
  requireAuth,
  requireAdmin,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      await connectToDatabase();

      const [
        totalBuses,
        activeBuses,
        activeOrganizations,
        totalStudents,
        capacityRows,
        collectedRows,
        outstandingRows,
        trend,
        openReminders,
        busRows,
        organizationRows,
      ] = await Promise.all([
        Bus.countDocuments().exec(),
        Bus.countDocuments({ status: "Active" }).exec(),
        Organization.countDocuments({ isActive: true }).exec(),
        Student.countDocuments({ isActive: true }).exec(),
        Bus.aggregate<{ _id: null; total: number }>([
          { $match: { status: "Active" } },
          { $group: { _id: null, total: { $sum: "$capacity" } } },
        ]).exec(),
        Invoice.aggregate<{ _id: null; total: number; count: number }>([
          { $match: { status: "paid" } },
          { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
        ]).exec(),
        Invoice.aggregate<{ _id: null; total: number; count: number }>([
          { $match: { status: { $in: ["pending", "overdue"] } } },
          { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
        ]).exec(),
        revenueTrend({}),
        Reminder.find({ status: "open" }).sort({ dueDate: 1 }).limit(8).lean().exec(),
        Bus.find()
          .sort({ regNumber: 1 })
          .limit(10)
          .populate("organizationId")
          .populate("routeId")
          .populate("driverId")
          .lean()
          .exec(),
        Organization.find({ isActive: true }).sort({ name: 1 }).lean().exec(),
      ]);

      const seatCapacity = capacityRows[0]?.total ?? 0;
      const collected = collectedRows[0]?.total ?? 0;
      const outstanding = outstandingRows[0]?.total ?? 0;
      const outstandingCount = outstandingRows[0]?.count ?? 0;
      const occupiedPct =
        seatCapacity > 0 ? Math.min(100, Math.round((totalStudents / seatCapacity) * 100)) : 0;

      // Per-organization student / route counts and dues, in three grouped
      // queries rather than one per organization.
      const [studentsByOrg, routesByOrg, duesByOrg] = await Promise.all([
        Student.aggregate<{ _id: Types.ObjectId; count: number }>([
          { $match: { isActive: true } },
          { $group: { _id: "$organizationId", count: { $sum: 1 } } },
        ]).exec(),
        Route.aggregate<{ _id: Types.ObjectId; count: number }>([
          { $match: { isActive: true } },
          { $group: { _id: "$organizationId", count: { $sum: 1 } } },
        ]).exec(),
        Invoice.aggregate<{ _id: Types.ObjectId; total: number }>([
          { $match: { status: { $in: ["pending", "overdue"] } } },
          { $group: { _id: "$organizationId", total: { $sum: "$amount" } } },
        ]).exec(),
      ]);

      const countBy = (rows: { _id: Types.ObjectId; count: number }[]) =>
        new Map(rows.map((r) => [r._id?.toString(), r.count]));
      const studentCounts = countBy(studentsByOrg);
      const routeCounts = countBy(routesByOrg);
      const dues = new Map(duesByOrg.map((r) => [r._id?.toString(), r.total]));

      res.status(200).json({
        // Shape mirrors `adminKpis`.
        kpis: [
          { label: "Total Vehicles", value: String(totalBuses), delta: `${activeBuses} active`, tone: "up" },
          {
            label: "Active Vehicles",
            value: String(activeBuses),
            delta: totalBuses > 0 ? `${Math.round((activeBuses / totalBuses) * 100)}% utilisation` : "—",
            tone: "up",
          },
          { label: "Organizations", value: String(activeOrganizations), delta: "all current", tone: "up" },
          { label: "Students", value: totalStudents.toLocaleString("en-IN"), delta: "active riders", tone: "up" },
          { label: "Collected", value: rupeesCompact(collected), delta: "invoices paid", tone: "up" },
          {
            label: "Pending Collection",
            value: rupeesCompact(outstanding),
            delta: `${outstandingCount} invoice${outstandingCount === 1 ? "" : "s"}`,
            tone: "down",
          },
        ],
        revenueTrend: trend,
        occupancy: [
          { name: "Occupied", value: occupiedPct },
          { name: "Available", value: 100 - occupiedPct },
        ],
        // Shape mirrors `alerts`.
        alerts: openReminders.map((reminder) => ({
          kind: REMINDER_LABELS[reminder.type] ?? reminder.type,
          detail: reminder.detail ?? reminder.title,
          due: longDate(reminder.dueDate),
          ...(reminder.amount ? { amount: rupees(reminder.amount) } : {}),
        })),
        // Shape mirrors the admin `buses` table.
        buses: busRows.map((bus) => {
          const org = bus.organizationId as unknown as { name?: string } | null;
          const route = bus.routeId as unknown as { name?: string } | null;
          const driver = bus.driverId as unknown as { name?: string } | null;
          return {
            reg: bus.regNumber,
            type: bus.type,
            org: org?.name ?? "—",
            route: route?.name ?? "—",
            driver: driver?.name ?? "—",
            status: bus.status,
          };
        }),
        // Shape mirrors the admin `organizations` table.
        organizations: organizationRows.map((org) => {
          const id = org._id.toString();
          const due = dues.get(id) ?? 0;
          return {
            _id: id,
            name: org.name,
            type: org.type,
            students: studentCounts.get(id) ?? 0,
            routes: routeCounts.get(id) ?? 0,
            status: org.isActive ? "Active" : "Inactive",
            dues: rupees(due),
          };
        }),
      });
    } catch (error) {
      next(error);
    }
  },
);

// -------------------------------------------------------- organization view

dashboardRouter.get(
  "/dashboard/organization/:id",
  requireAuth,
  zodValidate({ params: idParam }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await connectToDatabase();
      const id = req.params.id as string;

      // An org user asking for somebody else's dashboard is refused outright.
      if (!canAccessOrganization(req, id)) {
        next(forbidden("You do not have access to this organization."));
        return;
      }

      const organization = await Organization.findById(id).lean().exec();
      if (!organization) {
        next(notFound("No organization with that id."));
        return;
      }

      const organizationId = new Types.ObjectId(id);
      const [buses, activeBuses, routes, students, duesRows, trend, studentRows] = await Promise.all([
        Bus.countDocuments({ organizationId }).exec(),
        Bus.countDocuments({ organizationId, status: "Active" }).exec(),
        Route.countDocuments({ organizationId, isActive: true }).exec(),
        Student.countDocuments({ organizationId, isActive: true }).exec(),
        Invoice.aggregate<{ _id: null; total: number }>([
          { $match: { organizationId, status: { $in: ["pending", "overdue"] } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]).exec(),
        revenueTrend({ organizationId }),
        Student.find({ organizationId, isActive: true })
          .sort({ name: 1 })
          .limit(50)
          .populate("routeId")
          .lean()
          .exec(),
      ]);

      const dues = duesRows[0]?.total ?? 0;

      // Latest invoice status per student, for the roster's fee column.
      const latest = await Invoice.aggregate<{ _id: Types.ObjectId; status: string }>([
        { $match: { organizationId } },
        { $sort: { period: -1 } },
        { $group: { _id: "$studentId", status: { $first: "$status" } } },
      ]).exec();
      const statusByStudent = new Map(latest.map((row) => [row._id.toString(), row.status]));

      const STATUS_LABELS: Record<string, string> = {
        paid: "Paid",
        pending: "Pending",
        overdue: "Overdue",
      };

      res.status(200).json({
        organization: { _id: id, name: organization.name, type: organization.type },
        stats: [
          { label: "Assigned Buses", value: String(buses), delta: `${activeBuses} active` },
          { label: "Routes", value: String(routes), delta: "in service" },
          { label: "Students", value: students.toLocaleString("en-IN"), delta: "active riders" },
          {
            label: "Outstanding Dues",
            value: rupees(dues),
            delta: dues === 0 ? "fully cleared" : "awaiting payment",
          },
        ],
        revenueTrend: trend,
        // Shape mirrors `orgStudents`.
        students: studentRows.map((student) => {
          const route = student.routeId as unknown as { name?: string; code?: string } | null;
          return {
            _id: student._id.toString(),
            id: student.studentCode,
            name: student.name,
            grade: student.class,
            route: route?.name ?? "—",
            pickup: student.pickupPoint,
            status: STATUS_LABELS[statusByStudent.get(student._id.toString()) ?? ""] ?? "—",
          };
        }),
      });
    } catch (error) {
      next(error);
    }
  },
);
