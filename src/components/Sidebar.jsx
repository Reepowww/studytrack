const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "⌂" },
  { id: "habits", label: "Study Habits", icon: "◫" },
  { id: "performance", label: "Academic Performance", icon: "◎" },
  { id: "comparison", label: "Student Comparison", icon: "⇄" },
  { id: "analytics", label: "Analytics", icon: "⌁" },
  { id: "recommendations", label: "Recommendations", icon: "✦" },
  { id: "about", label: "About StudyTrack", icon: "i" },
];

export default function Sidebar({ page, setPage, open, setOpen }) {
  return (
    <>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand"><span className="brand-mark">ST</span><span>StudyTrack</span></div>
        <div className="sidebar-label">Workspace</div>
        <nav>{NAV.map((item) => <button key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => { setPage(item.id); setOpen(false); }}><span className="nav-icon">{item.icon}</span><span>{item.label}</span>{page === item.id && <span className="nav-active-dot" />}</button>)}</nav>
        <div className="sidebar-footer"><span className="status-dot" /> Research prototype<br /><small>Mock data · 6 student profiles</small></div>
      </aside>
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}
    </>
  );
}
