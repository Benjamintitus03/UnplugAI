import { getDB } from "./idb-schema";
import type { DetectionResult } from "../shared/types/detection";
import { DETECTION_CACHE_TTL_DAYS } from "../shared/constants";

const TTL_MS = DETECTION_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;

export async function getCachedResult(hash: string): Promise<DetectionResult | null> {
  const db = await getDB();
  const entry = await db.get("detectionCache", hash);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > TTL_MS) {
    await db.delete("detectionCache", hash);
    return null;
  }
  return entry.result;
}

export async function setCachedResult(
  hash: string,
  url: string,
  result: DetectionResult,
): Promise<void> {
  const db = await getDB();
  await db.put("detectionCache", { hash, url, result, cachedAt: Date.now() });
}

export async function evictExpired(): Promise<void> {
  const db = await getDB();
  const cutoff = Date.now() - TTL_MS;
  const tx = db.transaction("detectionCache", "readwrite");
  const index = tx.store.index("by-cachedAt");
  const range = IDBKeyRange.upperBound(cutoff);
  let cursor = await index.openCursor(range);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}
