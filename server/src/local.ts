// Local development entry point. Vercel never runs this file — it invokes the
// app directly through api/index.ts.
import { app } from "./app";
import { env } from "./config";
import { connectToDatabase, disconnectFromDatabase } from "./db";

async function main(): Promise<void> {
  // Connect up front so a bad MONGODB_URI fails at boot instead of on the first
  // request.
  await connectToDatabase();
  console.log("connected to MongoDB");

  const server = app.listen(env.PORT, () => {
    console.log(`sltc-api listening on http://localhost:${env.PORT}/api`);
  });

  const shutdown = (signal: string) => {
    console.log(`\n${signal} received, shutting down`);
    server.close(() => {
      void disconnectFromDatabase().then(() => process.exit(0));
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(
    `${JSON.stringify(
      {
        error: {
          code: "STARTUP_FAILED",
          message: "The API could not start.",
          details: message,
        },
      },
      null,
      2,
    )}\n`,
  );
  process.exit(1);
});
