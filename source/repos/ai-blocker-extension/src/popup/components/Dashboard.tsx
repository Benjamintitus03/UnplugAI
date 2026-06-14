import React, { useEffect, useState } from "react";
import type { DaySummary } from "../../shared/types/stats";
import { EMPTY_SUMMARY } from "../../shared/types/stats";
import { STATS_STORAGE_KEY, STATS_DATE_STORAGE_KEY, SETTINGS_STORAGE_KEY } from "../../shared/constants";

export default function Dashboard() {
  const [today, setToday] = useState<DaySummary>(EMPTY_SUMMARY);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const date = new Date().toISOString().slice(0, 10);
    chrome.storage.local.get(
      [STATS_STORAGE_KEY, STATS_DATE_STORAGE_KEY, SETTINGS_STORAGE_KEY],
      (result) => {
        const statsDate = result[STATS_DATE_STORAGE_KEY];
        if (statsDate === date && result[STATS_STORAGE_KEY]) {
          setToday(result[STATS_STORAGE_KEY] as DaySummary);
        }
        const settings = result[SETTINGS_STORAGE_KEY];
        if (settings?.enabled !== undefined) setEnabled(settings.enabled);
      },
    );
  }, []);

  const toggleEnabled = () => {
    const next = !enabled;
    setEnabled(next);
    chrome.storage.local.get(SETTINGS_STORAGE_KEY, (result) => {
      const current = result[SETTINGS_STORAGE_KEY] ?? {};
      chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: { ...current, enabled: next } });
    });
  };

  return (
    <div>
      <div className="master-toggle">
        <span className="toggle-label">
          Blocking {enabled ? "active" : "paused"}
        </span>
        <button
          className={`toggle-switch ${enabled ? "on" : ""}`}
          onClick={toggleEnabled}
          aria-label="Toggle blocking"
        />
      </div>

      <div className="total-card">
        <span className="total-label">Blocked today</span>
        <span className="total-value">{today.total}</span>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{today.images}</div>
          <div className="stat-label">AI Images</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{today.widgets}</div>
          <div className="stat-label">AI Widgets</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{today.networkRequests}</div>
          <div className="stat-label">API Requests</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{today.text}</div>
          <div className="stat-label">AI Text</div>
        </div>
      </div>
    </div>
  );
}
