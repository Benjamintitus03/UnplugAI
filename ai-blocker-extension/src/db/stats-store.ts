import type { DaySummary } from "../shared/types/stats";
import type { ContentType } from "../shared/types/detection";
import { EMPTY_SUMMARY } from "../shared/types/stats";
import { STATS_STORAGE_KEY, STATS_DATE_STORAGE_KEY } from "../shared/constants";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function incrementStats(contentType: ContentType): Promise<void> {
  const date = today();
  const result = await chrome.storage.local.get([STATS_STORAGE_KEY, STATS_DATE_STORAGE_KEY]);
  let stats: DaySummary = result[STATS_STORAGE_KEY] ?? { ...EMPTY_SUMMARY };

  if (result[STATS_DATE_STORAGE_KEY] !== date) {
    stats = { ...EMPTY_SUMMARY };
  }

  stats.total += 1;
  if (contentType === "image") stats.images += 1;
  else if (contentType === "text") stats.text += 1;
  else if (contentType === "widget") stats.widgets += 1;
  else if (contentType === "network-request") stats.networkRequests += 1;

  await chrome.storage.local.set({
    [STATS_STORAGE_KEY]: stats,
    [STATS_DATE_STORAGE_KEY]: date,
  });
}

export async function getStats(): Promise<DaySummary> {
  const date = today();
  const result = await chrome.storage.local.get([STATS_STORAGE_KEY, STATS_DATE_STORAGE_KEY]);
  if (result[STATS_DATE_STORAGE_KEY] !== date) return { ...EMPTY_SUMMARY };
  return result[STATS_STORAGE_KEY] ?? { ...EMPTY_SUMMARY };
}
