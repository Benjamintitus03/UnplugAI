export interface BlocklistManifest {
  version: string;
  ruleCount: number;
  cssSelectorCount: number;
  checksumSha256: string;
  tier: "free" | "paid";
}

export interface CSSSelector {
  id: string;
  selector: string;
  action: "remove" | "hide";
  domains?: string[];
}

export interface BlocklistRules {
  dnrRules: chrome.declarativeNetRequest.Rule[];
  cssSelectors: CSSSelector[];
  urlPatterns: string[];
}
