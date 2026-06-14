export interface SubscriptionStatus {
  tier: "free" | "paid";
  quotaUsed: number;
  quotaLimit: number;
  renewsAt?: string;
  cachedAt: number;
}
