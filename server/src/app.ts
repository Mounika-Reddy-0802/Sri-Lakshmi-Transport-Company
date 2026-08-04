// The Express application.
//
// This module deliberately does NOT call app.listen(). On Vercel the app is
// invoked as a serverless handler (see api/index.ts); locally src/local.ts
// wraps it in a listener. Everything is mounted under /api because Vercel
// rewrites every path to the /api function while preserving the original URL.
import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config";
import { requestLogger } from "./middleware/logger";
import { generalLimiter, sensitiveLimiter } from "./middleware/rateLimit";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { healthRouter } from "./routes/health";
import { authRouter } from "./routes/auth";

export function createApp(): Express {
  const app = express();

  // Behind Vercel's proxy; required for express-rate-limit to see real client
  // IPs rather than rate-limiting the proxy itself.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN.split(",").map((origin) => origin.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(requestLogger);

  app.use("/api", generalLimiter);
  // Tightened endpoints. The routers land in Phases 3 and 6; the limiter is
  // mounted now so it can never be forgotten later.
  app.use("/api/auth", sensitiveLimiter);
  app.use("/api/payments", sensitiveLimiter);

  app.use("/api", healthRouter);
  app.use("/api", authRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;
