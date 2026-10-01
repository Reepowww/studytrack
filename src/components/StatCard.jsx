const ICONS = {
  hours: "⏱", session: "◫", avg: "∿", subject: "📘", most: "📘",
  average: "◎", overall: "◎", highest: "▲", needs: "▼", focus: "★",
};

function pickIcon(label = "") {
  const l = label.toLowerCase();
  const key = Object.keys(ICONS).find((k) => l.includes(k));
  return ICONS[key] || "●";
}

export default function StatCard({ label, value, sub, icon }) {
  return (
    <div className="card stat-card hover-card">
      <div className="stat-icon">{icon || pickIcon(label)}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value" title={value}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
