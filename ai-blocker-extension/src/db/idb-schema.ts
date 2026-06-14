import { openDB, IDBPDatabase, DBSchema } from "idb";
import type { DetectionResult, ContentType } from "../shared/types/detection";

const DB_NAME = "ai-blocker";
const DB_VERSION = 1;

interface AiBlockerDB extends DBSchema {
  detectionCache: {
    key: string;
    value: {
      hash: string;
      url: string;
      result: DetectionResult;
      cachedAt: number;
    };
    indexes: { "by-cachedAt": number };
  };
  stats: {
    key: string;
    value: {
      id: string;
      domain: string;
      contentType: ContentType;
      date: string;
      count: number;
    };
    indexes: { "by-date": string; "by-domain": string };
  };
}

let _db: IDBPDatabase<AiBlockerDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<AiBlockerDB>> {
  if (_db) return _db;
  _db = await openDB<AiBlockerDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const cache = db.createObjectStore("detectionCache", { keyPath: "hash" });
      cache.createIndex("by-cachedAt", "cachedAt");

      const stats = db.createObjectStore("stats", { keyPath: "id" });
      stats.createIndex("by-date", "date");
      stats.createIndex("by-domain", "domain");
    },
  });
  return _db;
}
