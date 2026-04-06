import type { Companion } from "@shared/schema";
import { storage } from "../storage";

// In-memory cache for companion data (prompt blocks rarely change)
let companionCache: Map<string, Companion> = new Map();
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function ensureCache(): Promise<void> {
  if (Date.now() - cacheLoadedAt < CACHE_TTL_MS && companionCache.size > 0) {
    return;
  }

  const companions = await storage.listCompanions();
  companionCache = new Map(companions.map((c) => [c.id, c]));
  cacheLoadedAt = Date.now();
}

/**
 * Get a companion by ID. Uses in-memory cache to avoid repeated DB calls
 * for system prompt blocks that rarely change.
 */
export async function getCompanion(id: string): Promise<Companion> {
  await ensureCache();

  const cached = companionCache.get(id);
  if (cached) return cached;

  // Cache miss — fetch directly
  const companion = await storage.getCompanion(id);
  if (!companion) {
    throw new Error(`Companion not found: ${id}`);
  }

  companionCache.set(id, companion);
  return companion;
}

/**
 * List all active companions.
 */
export async function listCompanions(): Promise<Companion[]> {
  await ensureCache();
  return Array.from(companionCache.values()).filter((c) => c.status === "active");
}

/**
 * Invalidate the companion cache (e.g., after seeding or updates).
 */
export function invalidateCache(): void {
  companionCache.clear();
  cacheLoadedAt = 0;
}
