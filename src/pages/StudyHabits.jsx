import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { subjects, methods, averageSessionDuration, getMostStudiedSubject, sessionHours } from "../data/students.js";

const formatSessionDate = (date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function StudyHabits({ currentStudent, setCurrentStudent }) {
  const [form, setForm] = useState({ subject: subjects[0], duration: 60, method: methods[0], focus: 3 });
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [deleteSessionId, setDeleteSessionId] = useState(null);
  const sessions = currentStudent.sessions;
  const isEditing = editingSessionId !== null;

  const methodData = useMemo(() => {
    const counts = {};
    sessions.forEach((session) => (counts[session.method] = (counts[session.method] || 0) + 1));
    return Object.entries(counts).map(([method, count]) => ({ method, count }));
  }, [sessions]);

  const avgFocus = sessions.length ? sessions.reduce((total, session) => total + Number(session.focus), 0) / sessions.length : 0;
  const mostStudied = getMostStudiedSubject(sessions);

  const saveSession = (event) => {
    event.preventDefault();
    const duration = Number(form.duration);
    const focus = Number(form.focus);
    if (!duration || duration < 5 || focus < 1 || focus > 5) return;

    if (editingSessionId !== null) {
      setCurrentStudent((student) => ({
        ...student,
        sessions: student.sessions.map((session) => session.id === editingSessionId
          ? { ...session, ...form, duration, focus }
          : session),
      }));
      setEditingSessionId(null);
      setForm({ subject: subjects[0], duration: 60, method: methods[0], focus: 3 });
      return;
    }

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newSession = { id, date: today, ...form, duration, focus };
    setCurrentStudent((student) => ({ ...student, sessions: [newSession, ...student.sessions] }));
    setForm({ subject: subjects[0], duration: 60, method: methods[0], focus: 3 });
  };

  const editSession = (session) => {
    setEditingSessionId(session.id);
    setForm({
      subject: session.subject,
      duration: session.duration,
      method: session.method,
      focus: session.focus,
      date: session.date,
    });
  };

  const cancelEditing = () => {
    setEditingSessionId(null);
    setForm({ subject: subjects[0], duration: 60, method: methods[0], focus: 3 });
  };

  useEffect(() => {
    if (!isEditing) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") cancelEditing();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isEditing]);

  const deleteSession = () => {
    if (deleteSessionId === null) return;
    setCurrentStudent((student) => ({
      ...student,
      sessions: student.sessions.filter((session) => session.id !== deleteSessionId),
    }));
    setDeleteSessionId(null);
  };

  const renderSessionForm = (editing) => (
    <form onSubmit={saveSession}>
      {editing && (
        <>
          <label htmlFor="session-date">Date</label>
          <input id="session-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
        </>
      )}
      <label htmlFor="session-subject">Subject</label>
      <select id="session-subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>{subjects.map((subject) => <option key={subject}>{subject}</option>)}</select>
      <label htmlFor="session-duration">Duration (min)</label>
      <input id="session-duration" type="number" min="5" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
      <label htmlFor="session-method">Method</label>
      <select id="session-method" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>{methods.map((method) => <option key={method}>{method}</option>)}</select>
      <label htmlFor="session-focus">Focus Level (1-5)</label>
      <input id="session-focus" type="number" min="1" max="5" value={form.focus} onChange={(e) => setForm({ ...form, focus: e.target.value })} />
      <div className={editing ? "session-edit-actions" : undefined}>
        <button type="submit" className="btn-primary form-button">{editing ? "Save Changes" : "Add Session"}</button>
        {editing && <button type="button" className="btn-secondary-light form-button" onClick={cancelEditing}>Cancel</button>}
      </div>
    </form>
  );

  return (
    <div className="page-enter">
      <div className="page-heading-row">
        <div><div className="eyebrow">HOW YOU STUDY</div><h1>Study Habits</h1><p className="muted">Record sessions and review the study behaviors currently in your data.</p></div>
        <div className="page-pill">{sessions.length} sessions logged</div>
      </div>

      <div className="grid grid-4">
        <div className="card stat-card hover-card"><div className="stat-label">Total Sessions</div><div className="stat-value">{sessions.length}</div><div className="stat-sub">recorded</div></div>
        <div className="card stat-card hover-card"><div className="stat-label">Logged Study Time</div><div className="stat-value">{sessionHours(sessions).toFixed(1)} hrs</div><div className="stat-sub">from sessions</div></div>
        <div className="card stat-card hover-card"><div className="stat-label">Avg. Focus</div><div className="stat-value">{avgFocus.toFixed(1)} / 5</div><div className="stat-sub">session ratings</div></div>
        <div className="card stat-card hover-card"><div className="stat-label">Most Studied</div><div className="stat-value">{mostStudied}</div><div className="stat-sub">by logged minutes</div></div>
      </div>

      <div className="grid grid-2">
        {!isEditing && (
          <div className="card form-card">
            <div className="card-heading"><div><h4>Log a Study Session</h4><span className="muted">Add a real session to update your snapshot.</span></div></div>
            {renderSessionForm(false)}
          </div>
        )}
        <div className="card chart-card">
          <div className="card-heading"><div><h4>Study Method Frequency</h4><span className="muted">How often each method appears in your logs</span></div></div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={methodData} layout="vertical" margin={{ left: 12, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis type="number" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="method" fontSize={11} width={110} />
              <Tooltip />
              <Bar dataKey="count" fill="#5b5bd6" radius={[0, 7, 7, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card table-card">
        <div className="card-heading"><div><h4>Study Sessions</h4><span className="muted">Newest logged sessions appear first.</span></div><span className="chart-badge">live</span></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Subject</th><th>Duration</th><th>Method</th><th>Focus</th><th>Actions</th></tr></thead>
            <tbody>
              {sessions.map((session, index) => (
                <tr key={session.id || `${session.date}-${index}`}>
                  <td>{formatSessionDate(session.date)}</td><td>{session.subject}</td><td>{session.duration} min</td><td>{session.method}</td>
                  <td><span className="focus-stars" aria-label={`${session.focus} out of 5`}>{
                    "★".repeat(session.focus) + "☆".repeat(5 - session.focus)
                  }</span></td>
                  <td>
                    {session.id && (
                      <div className="reminder-dialog-actions">
                        <button type="button" className="btn-secondary-light" onClick={() => editSession(session)}>Edit</button>
                        <button type="button" className="saved-focus-delete" onClick={() => setDeleteSessionId(session.id)}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {isEditing && createPortal(
        <div className="reminder-overlay session-edit-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) cancelEditing(); }}>
          <section className="reminder-dialog session-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-session-title">
            <div className="reminder-dialog-topline">
              <div>
                <h3 id="edit-session-title">Edit Study Session</h3>
                <span className="muted">Update the values for this session.</span>
              </div>
              <button type="button" className="reminder-close session-edit-close" onClick={cancelEditing} aria-label="Close edit dialog">×</button>
            </div>
            {renderSessionForm(true)}
          </section>
        </div>,
        document.body,
      )}
      {deleteSessionId !== null && (
        <div className="reminder-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteSessionId(null); }}>
          <section className="reminder-dialog delete-focus-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-session-title">
            <h3 id="delete-session-title">Are you sure you want to delete this entry?</h3>
            <div className="reminder-dialog-actions">
              <button type="button" className="btn-secondary-light" onClick={() => setDeleteSessionId(null)}>Cancel</button>
              <button type="button" className="saved-focus-delete-confirm" onClick={deleteSession}>Delete</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
