import {
  BLOCKLIST_CHECK_ALARM,
  BLOCKLIST_CHECK_INTERVAL_HOURS,
  SUBSCRIPTION_REFRESH_ALARM,
  SUBSCRIPTION_REFRESH_INTERVAL_HOURS,
} from "../shared/constants";

export async function registerAlarms(): Promise<void> {
  const existing = await chrome.alarms.getAll();
  const names = new Set(existing.map((a) => a.name));

  if (!names.has(BLOCKLIST_CHECK_ALARM)) {
    chrome.alarms.create(BLOCKLIST_CHECK_ALARM, {
      periodInMinutes: BLOCKLIST_CHECK_INTERVAL_HOURS * 60,
    });
  }

  if (!names.has(SUBSCRIPTION_REFRESH_ALARM)) {
    chrome.alarms.create(SUBSCRIPTION_REFRESH_ALARM, {
      periodInMinutes: SUBSCRIPTION_REFRESH_INTERVAL_HOURS * 60,
    });
  }
}
