import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { subjects, methods, averageSessionDuration, getMostStudiedSubject, sessionHours } from "../data/students.js";

export default function StudyHabits({ currentStudent, setCurrentStudent }) {
  const [form, setForm] = useState({ subject: subjects[0], duration: 60, method: methods[0], focus: 3 });
  const sessions = currentStudent.sessions;

  const methodData = useMemo(() => {
    const counts = {};
    sessions.forEach((session) => (counts[session.method] = (counts[session.method] || 0) + 1));
    return Object.entries(counts).map(([method, count]) => ({ method, count }));
  }, [sessions]);

  const avgFocus = sessions.length ? sessions.reduce((total, session) => total + Number(session.focus), 0) / sessions.length : 0;
  const mostStudied = getMostStudiedSubject(sessions);

  const addSession = (event) => {
    event.preventDefault();
    const duration = Number(form.duration);
    const focus = Number(form.focus);
    if (!duration || duration < 5 || focus < 1 || focus > 5) return;

    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const newSession = { date: today, ...form, duration, focus };
    setCurrentStudent((student) => ({ ...student, sessions: [newSession, ...student.sessions] }));
    setForm({ subject: subjects[0], duration: 60, method: methods[0], focus: 3 });
  };

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
        <div className="card form-card">
          <div className="card-heading"><div><h4>Log a Study Session</h4><span className="muted">Add a real session to update your snapshot.</span></div></div>
          <form onSubmit={addSession}>
            <label>Subject</label>
            <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>{subjects.map((subject) => <option key={subject}>{subject}</option>)}</select>
            <label>Duration (min)</label>
            <input type="number" min="5" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            <label>Method</label>
            <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>{methods.map((method) => <option key={method}>{method}</option>)}</select>
            <label>Focus Level (1-5)</label>
            <input type="number" min="1" max="5" value={form.focus} onChange={(e) => setForm({ ...form, focus: e.target.value })} />
            <button type="submit" className="btn-primary form-button">Add Session</button>
          </form>
        </div>

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
            <thead><tr><th>Date</th><th>Subject</th><th>Duration</th><th>Method</th><th>Focus</th></tr></thead>
            <tbody>
              {sessions.map((session, index) => (
                <tr key={`${session.date}-${index}`}>
                  <td>{session.date}</td><td>{session.subject}</td><td>{session.duration} min</td><td>{session.method}</td>
                  <td><span className="focus-stars" aria-label={`${session.focus} out of 5`}>{
                    "★".repeat(session.focus) + "☆".repeat(5 - session.focus)
                  }</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
