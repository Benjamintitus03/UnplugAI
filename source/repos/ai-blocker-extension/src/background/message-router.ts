import type { ExtensionMessage } from "../shared/types/messages";
import { getCachedSubscription } from "./subscription-cache";
import { incrementStats } from "../db/stats-store";

export function registerMessageRouter(): void {
  chrome.runtime.onMessage.addListener(
    (message: ExtensionMessage, _sender, sendResponse) => {
      handleMessage(message)
        .then(sendResponse)
        .catch((err) => {
          console.error("[Unplug] message handler error:", err);
          sendResponse(null);
        });
      return true;
    },
  );
}

async function handleMessage(message: ExtensionMessage): Promise<unknown> {
  switch (message.type) {
    case "GET_SUBSCRIPTION":
      return getCachedSubscription();

    case "STAT_INCREMENT":
      await incrementStats(message.contentType);
      return;

    case "CREATE_CHECKOUT":
      // TODO Phase 2: open Stripe checkout tab
      return;

    case "DETECT_IMAGE":
    case "DETECT_TEXT":
      // TODO Phase 3: cloud ML fallback
      return null;

    default:
      return;
  }
}
