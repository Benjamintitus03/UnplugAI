import React from "react";

interface Props {
  children: React.ReactNode;
  featureName: string;
  isPaid: boolean;
}

export default function PremiumGate({ children, featureName, isPaid }: Props) {
  if (isPaid) return <>{children}</>;

  return (
    <div
      style={{
        background: "#161628",
        border: "1px dashed #2a2a50",
        borderRadius: 8,
        padding: 20,
        textAlign: "center",
        color: "#7070a0",
        fontSize: 12,
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 8 }}>🔒</div>
      <div style={{ marginBottom: 4, color: "#a0a0c0", fontWeight: 600 }}>
        {featureName}
      </div>
      <div>Available on Unplug Pro</div>
    </div>
  );
}
