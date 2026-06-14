import React, { useState } from "react";
import Dashboard from "./components/Dashboard";
import Settings from "./components/Settings";
import Account from "./components/Account";

type Tab = "dashboard" | "settings" | "account";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">⊘</span>
          <span className="logo-text">Unplug</span>
        </div>
      </header>

      <main className="content">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "settings" && <Settings />}
        {activeTab === "account" && <Account />}
      </main>

      <nav className="tab-bar">
        <button
          className={`tab ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          Stats
        </button>
        <button
          className={`tab ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </button>
        <button
          className={`tab ${activeTab === "account" ? "active" : ""}`}
          onClick={() => setActiveTab("account")}
        >
          Account
        </button>
      </nav>
    </div>
  );
}
