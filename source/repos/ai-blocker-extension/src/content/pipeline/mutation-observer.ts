import type { ImageScanner } from "./image-scanner";
import type { WidgetRemover } from "./widget-remover";

export class ContentMutationObserver {
  private observer: MutationObserver;

  constructor(
    private imageScanner: ImageScanner,
    private widgetRemover: WidgetRemover,
  ) {
    this.observer = new MutationObserver((mutations) =>
      this.handleMutations(mutations),
    );
  }

  start(): void {
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  stop(): void {
    this.observer.disconnect();
  }

  private handleMutations(mutations: MutationRecord[]): void {
    let hasNewNodes = false;

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        hasNewNodes = true;
        const el = node as Element;

        // Scan any images that just appeared
        const imgs =
          el.tagName === "IMG"
            ? [el as HTMLImageElement]
            : Array.from(el.querySelectorAll<HTMLImageElement>("img"));

        for (const img of imgs) {
          this.imageScanner.scanImage(img);
        }
      }
    }

    // Re-run widget removal whenever new DOM nodes arrive
    if (hasNewNodes) {
      this.widgetRemover.applyOnce();
    }
  }
}
