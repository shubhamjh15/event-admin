import mongoose from "mongoose";

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null; seeded?: Promise<void> };
const g = globalThis as unknown as { __mongo?: Cache };
const cache: Cache = g.__mongo ?? (g.__mongo = { conn: null, promise: null });

async function resolveUri(): Promise<string> {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_MEMORY_DB) {
    throw new Error("MONGODB_URI is not set");
  }
  // Local development without a database: spin up an in-memory MongoDB.
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const server = await MongoMemoryServer.create();
  console.log("[db] Using in-memory MongoDB (set MONGODB_URI to persist data)");
  return server.getUri("lit-concierge");
}

export async function dbConnect() {
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = resolveUri().then((uri) => mongoose.connect(uri, { bufferCommands: false, serverSelectionTimeoutMS: 10000 }));
  }
  try {
    cache.conn = await cache.promise;
  } catch (e) {
    // Don't cache a failed connection — the next request retries.
    cache.promise = null;
    throw e;
  }
  if (!cache.seeded) {
    cache.seeded = import("./seed").then((m) => m.seedIfEmpty()).catch((e) => {
      cache.seeded = undefined;
      throw e;
    });
  }
  await cache.seeded;
  return cache.conn;
}
