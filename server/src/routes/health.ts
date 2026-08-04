// GET /api/health — liveness plus a real database round-trip.
//
// A health check that only proves Express is awake is close to useless, so this
// one connects (or reuses the cached connection) and pings Atlas. If the
// database is unreachable it answers 503 in the standard error envelope rather
// than a misleading 200.
import { Router, type Request, type Response, type NextFunction } from "express";
import mongoose from "mongoose";
import { connectToDatabase, connectionState } from "../db";
import { errorBody } from "../http/errors";

export const healthRouter = Router();

healthRouter.get("/health", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await connectToDatabase();
    await mongoose.connection.db?.admin().ping();

    res.status(200).json({
      ok: true,
      service: "sltc-api",
      database: {
        status: connectionState(),
        name: mongoose.connection.name,
      },
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.name.startsWith("Mongo")) {
      res
        .status(503)
        .json(
          errorBody(
            "DATABASE_UNAVAILABLE",
            "The API is running but cannot reach the database.",
            { status: connectionState() },
          ),
        );
      return;
    }
    next(error);
  }
});
