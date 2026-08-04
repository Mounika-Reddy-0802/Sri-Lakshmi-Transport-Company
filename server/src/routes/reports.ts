// Read-only financial reports.
//
//   GET /api/reports/revenue   billed vs collected per period
//   GET /api/reports/routes    revenue attributed to each route
//   GET /api/reports/pending   outstanding invoices, worst first
//
// All three are tenant-scoped: an org sees only its own numbers, an admin sees
// everything. Students have no business here, so they are refused.
import { Router, type Request, type Response, type NextFunction } from "express";
import { Types } from "mongoose";
import { connectToDatabase } from "../db";
import { Invoice } from "../models";
import { monthLabel } from "../http/format";
import { requireAuth, requireRole, scopeToTenant } from "../middleware/auth";
import { zodValidate } from "../middleware/validate";
import { listQuery, reportQuery } from "./schemas";

export const reportsRouter = Router();

const adminOrOrg = requireRole("admin", "org");

reportsRouter.get(
  "/reports/revenue",
  requireAuth,
  adminOrOrg,
  zodValidate({ query: reportQuery }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await connectToDatabase();
      const { months } = req.query as unknown as { months: number };

      const rows = await Invoice.aggregate<{ _id: string; revenue: number; collected: number; count: number }>([
        { $match: scopeToTenant(req) },
        {
          $group: {
            _id: "$period",
            revenue: { $sum: "$amount" },
            collected: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0] } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]).exec();

      const data = rows.slice(-months).map((row) => ({
        month: monthLabel(row._id),
        period: row._id,
        revenue: row.revenue,
        collected: row.collected,
        outstanding: row.revenue - row.collected,
        invoices: row.count,
      }));

      res.status(200).json({
        data,
        totals: {
          revenue: data.reduce((sum, r) => sum + r.revenue, 0),
          collected: data.reduce((sum, r) => sum + r.collected, 0),
          outstanding: data.reduce((sum, r) => sum + r.outstanding, 0),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

reportsRouter.get(
  "/reports/routes",
  requireAuth,
  adminOrOrg,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await connectToDatabase();

      // invoice -> student -> route, then group by route.
      const rows = await Invoice.aggregate<{ _id: Types.ObjectId | null; route: string; revenue: number }>([
        { $match: scopeToTenant(req) },
        {
          $lookup: {
            from: "students",
            localField: "studentId",
            foreignField: "_id",
            as: "student",
          },
        },
        { $unwind: "$student" },
        {
          $lookup: {
            from: "routes",
            localField: "student.routeId",
            foreignField: "_id",
            as: "route",
          },
        },
        { $unwind: { path: "$route", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$route._id",
            route: { $first: { $ifNull: ["$route.name", "Unassigned"] } },
            revenue: { $sum: "$amount" },
          },
        },
        { $sort: { revenue: -1 } },
      ]).exec();

      // Shape mirrors `routeRevenue` in lib/mock-data.ts.
      res.status(200).json({
        data: rows.map((row) => ({ route: row.route, revenue: row.revenue })),
      });
    } catch (error) {
      next(error);
    }
  },
);

reportsRouter.get(
  "/reports/pending",
  requireAuth,
  adminOrOrg,
  zodValidate({ query: listQuery }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await connectToDatabase();
      const { page, limit } = req.query as unknown as { page: number; limit: number };

      const filter = {
        ...scopeToTenant(req),
        status: { $in: ["pending", "overdue"] },
      };

      const [invoices, total, totalsRows] = await Promise.all([
        Invoice.find(filter)
          .sort({ dueDate: 1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate("studentId")
          .lean()
          .exec(),
        Invoice.countDocuments(filter).exec(),
        Invoice.aggregate<{ _id: string; total: number; count: number }>([
          { $match: filter },
          { $group: { _id: "$status", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        ]).exec(),
      ]);

      res.status(200).json({
        data: invoices.map((invoice) => {
          const student = invoice.studentId as unknown as {
            name?: string;
            studentCode?: string;
          } | null;
          return {
            _id: invoice._id.toString(),
            invoiceNumber: invoice.invoiceNumber,
            student: student?.name ?? "—",
            studentCode: student?.studentCode ?? "—",
            period: invoice.period,
            amount: invoice.amount,
            status: invoice.status,
            dueDate: invoice.dueDate,
          };
        }),
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
        summary: totalsRows.map((row) => ({
          status: row._id,
          amount: row.total,
          count: row.count,
        })),
      });
    } catch (error) {
      next(error);
    }
  },
);
