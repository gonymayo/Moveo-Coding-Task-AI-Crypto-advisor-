import { useState } from "react";

const BASE = (import.meta.env.VITE_API_ROOT || "").replace(/\/$/, "");

export default function VoteButtons({ section }) {
  const [vote, setVote] = useState(0); // 0=none, 1=up, -1=down

  const handleVote = async (val) => {
    setVote(val);
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(`${BASE}/api/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ section, value: val }),
      });
    } catch (err) {
      console.error("vote failed", err);
    }
  };

  return (
    <div className="buttons">
      <button
        className={`vote ${vote === 1 ? "active-up" : ""}`}
        onClick={() => handleVote(1)}
      >
        👍
      </button>
      <button
        className={`vote ${vote === -1 ? "active-down" : ""}`}
        onClick={() => handleVote(-1)}
      >
        👎
      </button>
    </div>
  );
}
