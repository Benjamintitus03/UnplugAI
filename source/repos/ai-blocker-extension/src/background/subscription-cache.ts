import type { SubscriptionStatus } from "../shared/types/subscription";
import { SUBSCRIPTION_CACHE_TTL_MS } from "../shared/constants";

const STORAGE_KEY = "subscriptionStatus";

export async function getCachedSubscription(): Promise<SubscriptionStatus | null> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const status = result[STORAGE_KEY] as SubscriptionStatus | undefined;
  if (!status) return null;
  if (Date.now() - status.cachedAt > SUBSCRIPTION_CACHE_TTL_MS) return null;
  return status;
}

export async function setCachedSubscription(status: SubscriptionStatus): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEY]: { ...status, cachedAt: Date.now() },
  });
}

export async function getEffectiveTier(): Promise<"free" | "paid"> {
  const status = await getCachedSubscription();
  return status?.tier ?? "free";
}
