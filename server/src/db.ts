// Mongoose connection, cached across invocations.
//
// On Vercel each serverless invocation may reuse a warm Node process. Opening a
// new connection per request would exhaust the Atlas connection limit fast, so
// the connection (and the in-flight promise) is stashed on globalThis and
// reused. The promise is cached too — otherwise concurrent cold requests each
// start their own handshake.
import mongoose from "mongoose";
import { env, isProduction } from "./config";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var __sltcMongoose: MongooseCache | undefined;
}

const cache: MongooseCache = globalThis.__sltcMongoose ?? { conn: null, promise: null };
globalThis.__sltcMongoose = cache;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    mongoose.set("strictQuery", true);
    cache.promise = mongoose.connect(env.MONGODB_URI, {
      // Fail fast rather than hanging a request for 30s when Atlas is
      // unreachable (usually a missing IP access list entry).
      serverSelectionTimeoutMS: 10_000,
      // Serverless: keep the pool small, many concurrent lambdas each hold one.
      maxPoolSize: 10,
      autoIndex: !isProduction,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    // Clear the failed promise so the next request retries instead of
    // permanently resolving to the same rejection.
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}

export type ConnectionState =
  | "disconnected"
  | "connected"
  | "connecting"
  | "disconnecting"
  | "uninitialized";

// Mongoose reports 0-3, plus 99 for "uninitialized" — a map rather than an
// array so the sparse 99 is covered.
const READY_STATES: Record<number, ConnectionState> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
  99: "uninitialized",
};

export function connectionState(): ConnectionState {
  return READY_STATES[mongoose.connection.readyState] ?? "disconnected";
}

export async function disconnectFromDatabase(): Promise<void> {
  if (!cache.conn) return;
  await mongoose.disconnect();
  cache.conn = null;
  cache.promise = null;
}
