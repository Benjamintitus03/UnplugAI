export function createOverlay(target: HTMLElement): void {
  const width = target.offsetWidth || 200;
  const height = target.offsetHeight || 200;

  const wrapper = document.createElement("div");
  wrapper.className = "__unplug-overlay";
  wrapper.style.cssText = `
    position: relative;
    display: inline-block;
    width: ${width}px;
    height: ${height}px;
    vertical-align: middle;
  `;

  const placeholder = document.createElement("div");
  placeholder.style.cssText = `
    width: 100%;
    height: 100%;
    min-height: 60px;
    background: #0f0f1a;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #7070a0;
    font-family: -apple-system, sans-serif;
    font-size: 12px;
    gap: 6px;
    border-radius: 4px;
    border: 1px solid #2a2a4a;
    box-sizing: border-box;
  `;

  const icon = document.createElement("span");
  icon.textContent = "⊘";
  icon.style.cssText = "font-size: 18px; color: #4040a0;";

  const label = document.createElement("span");
  label.textContent = "AI Image Blocked";
  label.style.cssText = "font-size: 11px; color: #6060a0;";

  const revealBtn = document.createElement("button");
  revealBtn.textContent = "Show anyway";
  revealBtn.style.cssText = `
    font-size: 10px;
    padding: 2px 8px;
    background: transparent;
    border: 1px solid #2a2a4a;
    border-radius: 3px;
    color: #5050a0;
    cursor: pointer;
    font-family: inherit;
  `;
  revealBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    wrapper.replaceWith(target);
  });

  placeholder.append(icon, label, revealBtn);
  wrapper.appendChild(placeholder);
  target.replaceWith(wrapper);
}
