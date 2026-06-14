import { registerAlarms } from "./update-scheduler";
import { checkAndUpdate } from "./blocklist-manager";
import { registerMessageRouter } from "./message-router";
import { BLOCKLIST_CHECK_ALARM, SUBSCRIPTION_REFRESH_ALARM } from "../shared/constants";

chrome.runtime.onInstalled.addListener(async () => {
  await registerAlarms();
  await checkAndUpdate();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === BLOCKLIST_CHECK_ALARM) {
    await checkAndUpdate();
  }
  if (alarm.name === SUBSCRIPTION_REFRESH_ALARM) {
    // TODO Phase 2: refresh subscription status from backend
  }
});

registerMessageRouter();
