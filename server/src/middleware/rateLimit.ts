// Rate limiting. Global Rules single out /auth and /payments as the endpoints
// that need a tight limit; everything else gets a generous ceiling that only
// catches runaway clients.
import rateLimit, { type Options } from "express-rate-limit";
import { errorBody } from "../http/errors";
import { env } from "../config";

const shared: Partial<Options> = {
  standardHeaders: "draft-7",
  legacyHeaders: false,
  // Tests would otherwise trip the limiter and fail for the wrong reason.
  skip: () => env.NODE_ENV === "test",
  handler: (_req, res) => {
    res
      .status(429)
      .json(errorBody("TOO_MANY_REQUESTS", "Too many requests. Please try again later."));
  },
};

/** Broad limit applied to the whole API. */
export const generalLimiter = rateLimit({
  ...shared,
  windowMs: 15 * 60 * 1000,
  limit: 300,
});

/** Tight limit for credential and payment endpoints. */
export const sensitiveLimiter = rateLimit({
  ...shared,
  windowMs: 15 * 60 * 1000,
  limit: 20,
});
