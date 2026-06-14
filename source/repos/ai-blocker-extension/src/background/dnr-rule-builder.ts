import type { BlocklistRules } from "../shared/types/blocklist";

export function buildDNRRules(
  rules: BlocklistRules,
): chrome.declarativeNetRequest.Rule[] {
  // Rules are already in Chrome DNR format from the blocklist compiler.
  return rules.dnrRules;
}
