// Boundary validation. Global Rules: every request body, param and query is
// parsed by Zod before a handler sees it, and invalid input is rejected with
// 400 — never coerced, never trusted.
import type { NextFunction, Request, Response } from "express";
import { z, type ZodTypeAny } from "zod";

export type RequestSchemas = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

/**
 * Validates the parts of a request described by `schemas`. Parsed (and
 * therefore coerced/defaulted) values replace the raw ones, so handlers work
 * with typed data.
 */
export function zodValidate(schemas: RequestSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) {
        // req.query has only a getter in Express 5-style setups; assigning to a
        // separate field keeps this working across versions.
        Object.defineProperty(req, "query", {
          value: schemas.query.parse(req.query),
          writable: true,
          configurable: true,
        });
      }
      if (schemas.body) req.body = schemas.body.parse(req.body);
      next();
    } catch (error) {
      // ZodError is translated into the standard envelope by errorHandler.
      next(error);
    }
  };
}

/** Shared pagination query, used by every list endpoint from Phase 4 on. */
export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof paginationQuery>;

/** A MongoDB ObjectId, as it arrives in a URL parameter. */
export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "must be a 24-character MongoDB id");
