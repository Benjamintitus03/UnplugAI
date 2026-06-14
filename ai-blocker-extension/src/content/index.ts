import { ImageScanner } from "./pipeline/image-scanner";
import { TextScanner } from "./pipeline/text-scanner";
import { WidgetRemover } from "./pipeline/widget-remover";
import { ContentMutationObserver } from "./pipeline/mutation-observer";
import type { UserSettings } from "../shared/types/settings";
import { DEFAULT_SETTINGS } from "../shared/types/settings";
import { SETTINGS_STORAGE_KEY } from "../shared/constants";

async function loadSettings(): Promise<UserSettings> {
  const result = await chrome.storage.local.get(SETTINGS_STORAGE_KEY);
  return (result[SETTINGS_STORAGE_KEY] as UserSettings) ?? DEFAULT_SETTINGS;
}

async function main(): Promise<void> {
  const settings = await loadSettings();
  if (!settings.enabled) return;

  // Check allowlist
  const hostname = location.hostname;
  const allowlisted = settings.allowlist.some(
    (entry) => entry.domain === hostname && entry.disableAll,
  );
  if (allowlisted) return;

  const imageScanner = new ImageScanner();
  const widgetRemover = new WidgetRemover();
  const textScanner = new TextScanner();
  const mutationObserver = new ContentMutationObserver(imageScanner, widgetRemover);

  if (settings.widgetBlocking.enabled) {
    widgetRemover.applyOnce();
  }

  if (settings.imageBlocking.enabled) {
    await imageScanner.scanAll();
    mutationObserver.start();
  }

  if (settings.textBlocking.enabled) {
    textScanner.scan();
  }
}

main().catch(console.error);
