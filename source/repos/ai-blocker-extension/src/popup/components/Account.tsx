import React, { useEffect, useState } from "react";
import type { SubscriptionStatus } from "../../shared/types/subscription";

export default function Account() {
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_SUBSCRIPTION" }, (response) => {
      if (response) setSub(response as SubscriptionStatus);
    });
  }, []);

  const tier = sub?.tier ?? "free";

  const openCheckout = () => {
    chrome.runtime.sendMessage({ type: "CREATE_CHECKOUT" });
  };

  return (
    <div>
      <div className="account-tier">
        <div className="tier-badge">{tier === "paid" ? "Pro" : "Free"}</div>
        <div className="tier-name">
          {tier === "paid" ? "Unplug Pro" : "Unplug Free"}
        </div>
        <div className="tier-desc">
          {tier === "paid"
            ? `${sub?.quotaUsed ?? 0} / ${sub?.quotaLimit ?? 0} cloud detections this month`
            : "Local blocking only — no account needed"}
        </div>
      </div>

      {tier === "free" && (
        <>
          <button className="upgrade-btn" onClick={openCheckout}>
            Upgrade to Pro — $4.99/mo
          </button>
          <ul className="feature-list">
            <li>
              <span className="feature-check">✓</span>
              Image blocking + widget removal
            </li>
            <li>
              <span className="feature-check">✓</span>
              Network request blocking
            </li>
            <li>
              <span className="feature-check">✓</span>
              C2PA metadata detection
            </li>
            <li>
              <span className="feature-lock">🔒</span>
              Cloud ML image detection
            </li>
            <li>
              <span className="feature-lock">🔒</span>
              AI text detection
            </li>
            <li>
              <span className="feature-lock">🔒</span>
              Settings sync across devices
            </li>
          </ul>
        </>
      )}

      {tier === "paid" && (
        <button
          className="upgrade-btn"
          style={{ background: "#1e1e3a" }}
          onClick={openCheckout}
        >
          Manage subscription
        </button>
      )}
    </div>
  );
}
