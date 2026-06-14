import React, { useEffect, useState } from "react";
import type { UserSettings } from "../../shared/types/settings";
import { DEFAULT_SETTINGS } from "../../shared/types/settings";
import { SETTINGS_STORAGE_KEY } from "../../shared/constants";

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    chrome.storage.local.get(SETTINGS_STORAGE_KEY, (result) => {
      if (result[SETTINGS_STORAGE_KEY]) {
        setSettings(result[SETTINGS_STORAGE_KEY] as UserSettings);
      }
    });
  }, []);

  const save = (next: UserSettings) => {
    setSettings(next);
    chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: next });
  };

  const toggle = (
    key: keyof Pick<
      UserSettings,
      "imageBlocking" | "textBlocking" | "widgetBlocking" | "networkBlocking"
    >,
  ) => {
    save({ ...settings, [key]: { ...settings[key], enabled: !settings[key].enabled } });
  };

  return (
    <div>
      <div className="settings-group">
        <div className="settings-title">Detection</div>
        <SettingRow
          name="Image blocking"
          desc="Replace AI-generated images with a placeholder"
          enabled={settings.imageBlocking.enabled}
          onToggle={() => toggle("imageBlocking")}
        />
        <SettingRow
          name="Widget removal"
          desc="Remove AI chatbot widgets (Intercom, Drift…)"
          enabled={settings.widgetBlocking.enabled}
          onToggle={() => toggle("widgetBlocking")}
        />
        <SettingRow
          name="Network blocking"
          desc="Block requests to AI service APIs"
          enabled={settings.networkBlocking.enabled}
          onToggle={() => toggle("networkBlocking")}
        />
      </div>
      <div className="settings-group">
        <div className="settings-title">Pro features</div>
        <SettingRow
          name="AI text detection"
          desc="Flag AI-written content on pages"
          enabled={settings.textBlocking.enabled}
          onToggle={() => toggle("textBlocking")}
          badge="Pro"
        />
      </div>
    </div>
  );
}

function SettingRow({
  name,
  desc,
  enabled,
  onToggle,
  badge,
}: {
  name: string;
  desc: string;
  enabled: boolean;
  onToggle: () => void;
  badge?: string;
}) {
  return (
    <div className="setting-row">
      <div style={{ flex: 1 }}>
        <div className="setting-name">
          {name}
          {badge && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 9,
                color: "#5050a0",
                background: "#1a1a38",
                padding: "1px 5px",
                borderRadius: 4,
                textTransform: "uppercase",
                letterSpacing: "0.4px",
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <div className="setting-desc">{desc}</div>
      </div>
      <button
        className={`toggle-switch ${enabled ? "on" : ""}`}
        onClick={onToggle}
        aria-label={`Toggle ${name}`}
      />
    </div>
  );
}
