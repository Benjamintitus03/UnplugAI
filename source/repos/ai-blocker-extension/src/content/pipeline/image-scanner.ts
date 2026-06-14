import { URLClassifier } from "../detectors/url-classifier";
import { classifyImageElement } from "../detectors/dom-classifier";
import { detectC2PA } from "../detectors/c2pa-detector";
import { createOverlay } from "../ui/overlay";
import type { DetectionResult } from "../../shared/types/detection";
import { C2PA_MAX_IMAGES_PER_PAGE } from "../../shared/constants";

const SCANNED_ATTR = "data-unplug-scanned";

export class ImageScanner {
  private urlClassifier = new URLClassifier();
  private c2paCount = 0;

  loadURLPatterns(patterns: string[]): void {
    this.urlClassifier.loadPatterns(patterns);
  }

  async scanAll(): Promise<void> {
    this.c2paCount = 0;
    const images = document.querySelectorAll<HTMLImageElement>("img");
    for (const img of images) {
      await this.scanImage(img);
    }
  }

  async scanImage(img: HTMLImageElement): Promise<DetectionResult | null> {
    if (img.hasAttribute(SCANNED_ATTR)) return null;
    img.setAttribute(SCANNED_ATTR, "1");

    // Phase 1: URL pattern trie (sync, ~0ms)
    if (img.src && this.urlClassifier.classify(img.src)) {
      const result: DetectionResult = {
        isAI: true,
        confidence: 0.95,
        source: "url-pattern",
        contentType: "image",
        detail: img.src,
      };
      this.block(img);
      return result;
    }

    // Phase 2: DOM heuristics (sync, ~1ms)
    const domResult = classifyImageElement(img);
    if (domResult?.isAI) {
      this.block(img);
      return domResult;
    }

    // Phase 3: C2PA metadata (async, free — limited to 20 images/page)
    if (img.src.startsWith("http") && this.c2paCount < C2PA_MAX_IMAGES_PER_PAGE) {
      this.c2paCount++;
      const c2paResult = await detectC2PA(img.src);
      if (c2paResult?.isAI) {
        this.block(img);
        return c2paResult;
      }
    }

    return null;
  }

  private block(img: HTMLImageElement): void {
    chrome.runtime.sendMessage({
      type: "STAT_INCREMENT",
      contentType: "image",
      domain: location.hostname,
    });
    createOverlay(img);
  }
}
