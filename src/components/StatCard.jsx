export default function StatCard({ label, value, sub }) {
  return (
    <div className="card stat-card hover-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" title={value}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
