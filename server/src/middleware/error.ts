// Central error handling. Every failure leaves the API through here so the
// response shape is identical no matter what threw.
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { ApiError, errorBody } from "../http/errors";
import { isProduction } from "../config";

/** Anything that reaches the API without a matching route. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json(errorBody("NOT_FOUND", `No route matches ${req.method} ${req.path}.`));
}

function isJsonSyntaxError(error: unknown): boolean {
  // express.json() rejects malformed bodies with a SyntaxError carrying a
  // `body` property and status 400.
  return (
    error instanceof SyntaxError &&
    "body" in error &&
    "status" in error &&
    (error as { status?: number }).status === 400
  );
}

// Express identifies the error handler by its four-parameter signature, so
// `_next` must stay even though it is never called.
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ApiError) {
    res.status(error.status).json(error.toBody());
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json(
      errorBody(
        "VALIDATION_ERROR",
        "Request validation failed.",
        error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      ),
    );
    return;
  }

  if (isJsonSyntaxError(error)) {
    res.status(400).json(errorBody("INVALID_JSON", "Request body is not valid JSON."));
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json(
      errorBody(
        "VALIDATION_ERROR",
        "Document validation failed.",
        Object.values(error.errors).map((e) => ({ path: e.path, message: e.message })),
      ),
    );
    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json(errorBody("INVALID_ID", `'${String(error.value)}' is not a valid id.`));
    return;
  }

  // Unexpected. Log it server-side in full, tell the client nothing useful to
  // an attacker.
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[error] ${req.method} ${req.originalUrl} —`, error);

  res
    .status(500)
    .json(
      errorBody(
        "INTERNAL_ERROR",
        isProduction ? "Something went wrong." : message,
      ),
    );
}
