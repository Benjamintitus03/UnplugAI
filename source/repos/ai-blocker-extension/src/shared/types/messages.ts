import type { ContentType } from "./detection";
import type { SubscriptionStatus } from "./subscription";

export type ExtensionMessage =
  | { type: "DETECT_IMAGE"; imageUrl: string; imageHash: string }
  | { type: "DETECT_TEXT"; textSample: string; pageUrl: string }
  | { type: "STAT_INCREMENT"; contentType: ContentType; domain: string }
  | { type: "CREATE_CHECKOUT" }
  | { type: "GET_SUBSCRIPTION" };

export type SubscriptionResponse = SubscriptionStatus | null;
