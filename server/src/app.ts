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
import { portalRouter } from "./routes/portal";
import { dashboardRouter } from "./routes/dashboard";
import { reportsRouter } from "./routes/reports";
import { paymentsRouter } from "./routes/payments";
import { resourcesRouter } from "./routes/index";

const stripTrailingSlash = (value: string): string => value.trim().replace(/\/+$/, "");

/** CLIENT_ORIGIN may list several origins, comma separated. */
const allowedOrigins = env.CLIENT_ORIGIN.split(",")
  .map(stripTrailingSlash)
  .filter((origin) => origin.length > 0);

export function createApp(): Express {
  const app = express();

  // Behind Vercel's proxy; required for express-rate-limit to see real client
  // IPs rather than rate-limiting the proxy itself.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(helmet());
  app.use(
    cors({
      // Compared after stripping any trailing slash on both sides. A browser
      // never sends one in the Origin header, but it is very easy to paste
      // "https://app.example.com/" into a dashboard env var — and the mismatch
      // then shows up only as a silent CORS failure in production.
      origin: (origin, callback) => {
        // No Origin header: same-origin navigations, curl, health checks.
        if (!origin) {
          callback(null, true);
          return;
        }
        callback(null, allowedOrigins.includes(stripTrailingSlash(origin)));
      },
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
  // Mounted before the generic resource routers so the enriched
  // GET /students/:id wins over the collection handler.
  app.use("/api", portalRouter);
  app.use("/api", dashboardRouter);
  app.use("/api", reportsRouter);
  app.use("/api", paymentsRouter);
  app.use("/api", resourcesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;
