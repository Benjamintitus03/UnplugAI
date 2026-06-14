let active: HTMLElement | null = null;

export function attachTooltip(target: HTMLElement, text: string): void {
  target.addEventListener("mouseenter", () => show(target, text));
  target.addEventListener("mouseleave", hide);
}

function show(anchor: HTMLElement, text: string): void {
  hide();
  const tip = document.createElement("div");
  tip.className = "__unplug-tooltip";
  tip.textContent = text;
  tip.style.cssText = `
    position: fixed;
    background: #0f0f1a;
    color: #c0c0e0;
    font-family: -apple-system, sans-serif;
    font-size: 11px;
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid #2a2a4a;
    pointer-events: none;
    z-index: 2147483647;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  `;
  document.body.appendChild(tip);
  active = tip;

  const rect = anchor.getBoundingClientRect();
  tip.style.left = `${rect.left}px`;
  tip.style.top = `${rect.top - tip.offsetHeight - 6}px`;
}

function hide(): void {
  active?.remove();
  active = null;
}
