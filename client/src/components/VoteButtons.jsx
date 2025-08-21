import { useState } from "react";
import { api } from "../api";

export default function VoteButtons({ section }) {
  const [vote, setVote] = useState(0); // 0=ללא, 1=up, -1=down

  const handleVote = async (val) => {
    setVote(val);
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await api.vote(section, val);
    } catch (err) {
      console.error("vote failed", err);
    }
  };

  return (
    <div className="buttons">
      <button className={`vote ${vote === 1 ? "active-up" : ""}`} onClick={() => handleVote(1)}>👍</button>
      <button className={`vote ${vote === -1 ? "active-down" : ""}`} onClick={() => handleVote(-1)}>👎</button>
    </div>
  );
}
