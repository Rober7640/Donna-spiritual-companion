import pg from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

let pool: pg.Pool | null = null;
let db: NodePgDatabase<typeof schema> | null = null;

if (process.env.DATABASE_URL) {
  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });
  db = drizzle(pool, { schema });
} else {
  console.warn("[db] DATABASE_URL not set — running with in-memory storage");
}

/**
 * Test the database connection. Returns true if connected, false otherwise.
 * If the connection fails, resets db/pool to null so the app falls back to MemStorage.
 */
export async function testConnection(): Promise<boolean> {
  if (!pool) return false;
  try {
    const client = await pool.connect();
    client.release();
    console.log("[db] Postgres connected successfully");
    return true;
  } catch (err) {
    console.warn(`[db] Postgres connection failed — falling back to in-memory storage`);
    console.warn(`[db] Error: ${(err as Error).message}`);
    pool = null;
    db = null;
    return false;
  }
}

export { pool, db };
