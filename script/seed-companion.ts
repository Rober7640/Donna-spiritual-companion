import "dotenv/config";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { db } from "../server/db";
import { companions } from "../shared/schema";
import type { InsertCompanion } from "../shared/schema";

const COMPANIONS_DIR = join(process.cwd(), "data", "companions");

/**
 * Seed all companions from data/companions/*.json into Postgres.
 * Uses upsert — safe to run multiple times.
 */
async function seed() {
  if (!db) {
    console.error("DATABASE_URL is required for production seeding.");
    process.exit(1);
  }

  const files = await readdir(COMPANIONS_DIR);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));

  if (jsonFiles.length === 0) {
    console.error("No companion JSON files found in data/companions/");
    process.exit(1);
  }

  console.log(`Seeding ${jsonFiles.length} companion(s)...`);

  for (const file of jsonFiles) {
    const raw = await readFile(join(COMPANIONS_DIR, file), "utf-8");
    const data = JSON.parse(raw) as InsertCompanion;

    await db
      .insert(companions)
      .values(data)
      .onConflictDoUpdate({
        target: companions.id,
        set: {
          displayName: data.displayName,
          tagline: data.tagline,
          bio: data.bio,
          faithLane: data.faithLane,
          status: data.status,
          systemPromptIdentity: data.systemPromptIdentity,
          systemPromptMethod: data.systemPromptMethod,
          systemPromptTheology: data.systemPromptTheology,
          systemPromptRules: data.systemPromptRules,
          sortOrder: data.sortOrder,
        },
      });

    console.log(`  ${data.displayName} (${data.id}) — seeded from ${file}`);
  }

  console.log("Done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
