import type { CSSSelector } from "../../shared/types/blocklist";

const BUILTIN_SELECTORS: CSSSelector[] = [
  { id: "intercom", selector: "#intercom-container, .intercom-lightweight-app", action: "remove" },
  { id: "drift", selector: "#drift-widget, #drift-frame-container", action: "remove" },
  { id: "chatbase", selector: "iframe[src*='chatbase.co']", action: "remove" },
  { id: "tidio", selector: "#tidio-chat, iframe[title='Tidio Chat']", action: "remove" },
  { id: "crisp", selector: ".crisp-client, #crisp-chatbox", action: "remove" },
  { id: "hubspot", selector: "#hubspot-messages-iframe-container", action: "remove" },
  { id: "zendesk", selector: "iframe[title='Messaging window']", action: "remove" },
  { id: "freshchat", selector: "#fc_frame", action: "remove" },
];

export class WidgetRemover {
  private extraSelectors: CSSSelector[] = [];

  loadSelectors(selectors: CSSSelector[]): void {
    this.extraSelectors = selectors;
  }

  applyOnce(): void {
    this.removeMatching();
  }

  private removeMatching(): void {
    const all = [...BUILTIN_SELECTORS, ...this.extraSelectors];
    for (const { selector, action } of all) {
      try {
        const elements = document.querySelectorAll<HTMLElement>(selector);
        for (const el of elements) {
          if (action === "remove") {
            el.remove();
          } else {
            el.style.display = "none";
          }
        }
      } catch {
        // Bad selector — skip
      }
    }
  }
}
