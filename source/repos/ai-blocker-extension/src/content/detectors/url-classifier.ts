const BUILTIN_PATTERNS: string[] = [
  "*.openai.com/images/*",
  "images.openai.com/*",
  "*.midjourney.com/attachments/*",
  "cdn.midjourney.com/*",
  "*.stability.ai/*",
  "images.craiyon.com/*",
  "image.pollinations.ai/*",
  "*.adobe.com/firefly/*",
  "firefly.adobe.com/*",
  "bing.com/images/create/*",
  "*.bing.com/images/create/*",
];

export class URLClassifier {
  private patterns: string[] = [...BUILTIN_PATTERNS];

  loadPatterns(patterns: string[]): void {
    this.patterns = [...BUILTIN_PATTERNS, ...patterns];
  }

  classify(url: string): boolean {
    return this.patterns.some((p) => matchGlob(p, url));
  }
}

function matchGlob(pattern: string, url: string): boolean {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  try {
    return new RegExp(`^https?://${escaped}`, "i").test(url);
  } catch {
    return false;
  }
}
