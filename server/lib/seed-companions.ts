import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { storage } from "../storage";
import type { InsertCompanion } from "@shared/schema";

const COMPANIONS_DIR = join(process.cwd(), "data", "companions");

/**
 * Load all companion JSON files from data/companions/ and seed them into storage.
 * Works with both MemStorage (dev) and DrizzleStorage (production).
 * Safe to call multiple times — uses upsert via createCompanion.
 */
export async function seedCompanions(): Promise<number> {
  let files: string[];
  try {
    files = await readdir(COMPANIONS_DIR);
  } catch {
    console.warn("[seed] No data/companions/ directory found — skipping seed");
    return 0;
  }

  const jsonFiles = files.filter((f) => f.endsWith(".json"));
  if (jsonFiles.length === 0) {
    console.warn("[seed] No companion JSON files found in data/companions/");
    return 0;
  }

  let count = 0;
  for (const file of jsonFiles) {
    try {
      const raw = await readFile(join(COMPANIONS_DIR, file), "utf-8");
      const data = JSON.parse(raw) as InsertCompanion;

      // Validate required fields
      if (!data.id || !data.displayName || !data.systemPromptIdentity) {
        console.warn(`[seed] Skipping ${file} — missing required fields`);
        continue;
      }

      await storage.createCompanion(data);
      console.log(`[seed] ${data.displayName} loaded from ${file}`);
      count++;
    } catch (err) {
      console.error(`[seed] Failed to load ${file}:`, (err as Error).message);
    }
  }

  return count;
}
