// Minimal request logger: method, path, status, duration.
//
// Deliberately logs no headers, body or query values — those carry tokens,
// passwords and personal data, and Global Rules forbid logging secrets.
import type { NextFunction, Request, Response } from "express";
import { env } from "../config";

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  if (env.NODE_ENV === "test") {
    next();
    return;
  }

  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const ms = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`);
  });

  next();
}
