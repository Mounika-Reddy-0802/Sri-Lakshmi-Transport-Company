// The single error shape this API speaks: { error: { code, message, details? } }.
// Nothing else may be sent on a failure path, and stack traces never leave the
// process.

export type ErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function errorBody(code: string, message: string, details?: unknown): ErrorBody {
  return { error: details === undefined ? { code, message } : { code, message, details } };
}

/** An error with an HTTP status the client is allowed to see. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  toBody(): ErrorBody {
    return errorBody(this.code, this.message, this.details);
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new ApiError(400, "BAD_REQUEST", message, details);

export const unauthorized = (message = "Authentication required.") =>
  new ApiError(401, "UNAUTHORIZED", message);

export const forbidden = (message = "You do not have access to this resource.") =>
  new ApiError(403, "FORBIDDEN", message);

export const notFound = (message = "Resource not found.") =>
  new ApiError(404, "NOT_FOUND", message);

export const conflict = (message: string, details?: unknown) =>
  new ApiError(409, "CONFLICT", message, details);

export const tooManyRequests = (message = "Too many requests. Please try again later.") =>
  new ApiError(429, "TOO_MANY_REQUESTS", message);

export const serviceUnavailable = (message: string, details?: unknown) =>
  new ApiError(503, "SERVICE_UNAVAILABLE", message, details);
