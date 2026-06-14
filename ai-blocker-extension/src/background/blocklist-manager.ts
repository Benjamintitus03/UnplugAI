import type { BlocklistManifest, BlocklistRules } from "../shared/types/blocklist";
import { BLOCKLIST_CDN_BASE } from "../shared/constants";
import { buildDNRRules } from "./dnr-rule-builder";

const MANIFEST_KEY = "blocklistManifest";
const RULES_KEY = "blocklistRules";

export async function checkAndUpdate(): Promise<void> {
  try {
    const res = await fetch(`${BLOCKLIST_CDN_BASE}/manifest.json`);
    if (!res.ok) return;
    const remote: BlocklistManifest = await res.json();

    const stored = await chrome.storage.local.get(MANIFEST_KEY);
    const local: BlocklistManifest | undefined = stored[MANIFEST_KEY];
    if (local?.version === remote.version) return;

    await fetchAndApplyRules(remote);
  } catch {
    // Blocklist update is best-effort
  }
}

async function fetchAndApplyRules(manifest: BlocklistManifest): Promise<void> {
  const res = await fetch(`${BLOCKLIST_CDN_BASE}/${manifest.version}/rules.json`);
  if (!res.ok) return;
  const rules: BlocklistRules = await res.json();

  const dnrRules = buildDNRRules(rules);
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((r) => r.id),
    addRules: dnrRules,
  });

  await chrome.storage.local.set({ [MANIFEST_KEY]: manifest, [RULES_KEY]: rules });
}

export async function getCSSSelectors(): Promise<BlocklistRules["cssSelectors"]> {
  const stored = await chrome.storage.local.get(RULES_KEY);
  const rules: BlocklistRules | undefined = stored[RULES_KEY];
  return rules?.cssSelectors ?? [];
}

export async function getURLPatterns(): Promise<string[]> {
  const stored = await chrome.storage.local.get(RULES_KEY);
  const rules: BlocklistRules | undefined = stored[RULES_KEY];
  return rules?.urlPatterns ?? [];
}
