import React from "react";

interface SavingsGoalCardProps {
  goal: number;
  text: string;
  currency?: string;
  style?: React.CSSProperties;
}

export const SavingsGoalCard: React.FC<SavingsGoalCardProps> = ({ goal, text, currency = "$", style }) => {
  return (

    <div
      style={{
        background: "#29488e",
        borderRadius: 12,
        padding: "1.5rem 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 500,
        fontSize: 24,
        margin: "1.5rem 2rem 1.5rem 2rem",
        ...style
      }}
    >
      <span style={{ fontSize: 22, marginRight: 16 }}>{text}</span>
      <span style={{ fontWeight: 700, fontSize: 26, marginLeft: 8 }}>
        {currency !== "" ? `${currency}${goal.toFixed(2)}` : goal.toFixed(2)}
      </span>
    </div>
  );
};
