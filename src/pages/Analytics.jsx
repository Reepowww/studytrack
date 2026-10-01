import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from "recharts";
import { studentAverage, avg, correlation, subjects, getSubjectHours } from "../data/students.js";

export default function Analytics({ currentStudent }) {
  const me = currentStudent;
  const subjectHours = getSubjectHours(me.sessions);
  const subjectRows = subjects.map((subject) => {
    const sessions = me.sessions.filter((session) => session.subject === subject);
    return {
      subject,
      sessions: sessions.length,
      hours: Number(((subjectHours[subject] || 0) / 60).toFixed(1)),
      focus: sessions.length ? avg(sessions.map((session) => Number(session.focus || 0))) : null,
      grade: me.grades[subject],
    };
  });
  const hoursVsGrade = subjectRows.map((row) => ({ x: row.hours, y: row.grade, name: row.subject }));
  const freqVsGrade = subjectRows.map((row) => ({ x: row.sessions, y: row.grade, name: row.subject }));
  const focusVsGrade = subjectRows.filter((row) => row.focus !== null)
    .map((row) => ({ x: row.focus, y: row.grade, name: row.subject }));
  const corrHours = correlation(hoursVsGrade.map((d) => d.x), hoursVsGrade.map((d) => d.y));
  const corrFreq = correlation(freqVsGrade.map((d) => d.x), freqVsGrade.map((d) => d.y));
  const corrFocus = correlation(focusVsGrade.map((d) => d.x), focusVsGrade.map((d) => d.y));
  const methodCount = {};
  me.sessions.forEach((session) => { methodCount[session.method] = (methodCount[session.method] || 0) + 1; });
  const mostUsedMethod = Object.entries(methodCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  const sessionFocus = me.sessions.length ? avg(me.sessions.map((session) => Number(session.focus || 0))) : null;

  return (
    <div className="page-enter">
      <div className="page-heading-row">
        <div><div className="eyebrow">ANALYTICS</div><h1>Analytics</h1><p className="muted">Analysis of your own recorded study activity and subject grades.</p></div>
        <div className="page-pill">{me.sessions.length} sessions recorded</div>
      </div>

      <div className="notice-banner"><b>How to read this page:</b> subject-level patterns describe your recorded data. They are monitoring insights, not predictions or proof of cause and effect.</div>

      <div className="grid grid-4">
        <div className="card stat-card hover-card"><div className="stat-label">Avg Study Time</div><div className="stat-value">{avg(me.weeklyHours).toFixed(1)}</div><div className="stat-sub">hours per recorded week</div></div>
        <div className="card stat-card hover-card"><div className="stat-label">Avg Grade</div><div className="stat-value">{studentAverage(me).toFixed(1)}</div><div className="stat-sub">your current subjects</div></div>
        <div className="card stat-card hover-card"><div className="stat-label">Avg Session Focus</div><div className="stat-value">{sessionFocus === null ? "—" : `${sessionFocus.toFixed(1)} / 5`}</div><div className="stat-sub">your recorded sessions</div></div>
        <div className="card stat-card hover-card"><div className="stat-label">Most Used Method</div><div className="stat-value">{mostUsedMethod}</div><div className="stat-sub">from your session logs</div></div>
      </div>

      <div className="card chart-card">
        <div className="card-heading"><div><h4>Study Time vs Subject Grade</h4><span className="muted">Each point represents one of your subjects.</span></div><span className="correlation-badge">r = {corrHours.toFixed(2)}</span></div>
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis type="number" dataKey="x" name="Study Hours" fontSize={12} label={{ value: "Logged study hours", position: "insideBottom", offset: -5, fontSize: 12 }} />
            <YAxis type="number" dataKey="y" name="Subject Grade" fontSize={12} domain={[0, 100]} />
            <ZAxis range={[80, 80]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(value) => Number(value).toFixed(1)} />
            <Scatter data={hoursVsGrade} fill="#5b5bd6" />
          </ScatterChart>
        </ResponsiveContainer>
        <p className="muted">Observed subject-level correlation: <b>r = {corrHours.toFixed(2)}</b>. This describes your records and does not establish a causal effect.</p>
      </div>

      <div className="grid grid-2">
        <div className="card chart-card"><div className="card-heading"><div><h4>Logged Sessions vs Grades</h4><span className="muted">Session count and current grade by subject</span></div><span className="correlation-badge">r = {corrFreq.toFixed(2)}</span></div>
          <ResponsiveContainer width="100%" height={220}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke="#eee" /><XAxis type="number" dataKey="x" name="Sessions" fontSize={12} /><YAxis type="number" dataKey="y" name="Grade" fontSize={12} domain={[0, 100]} /><Tooltip /><Scatter data={freqVsGrade} fill="#8f7ee8" /></ScatterChart></ResponsiveContainer>
        </div>
        <div className="card chart-card"><div className="card-heading"><div><h4>Session Focus vs Grades</h4><span className="muted">Average logged focus and current grade by subject</span></div><span className="correlation-badge">r = {corrFocus.toFixed(2)}</span></div>
          <ResponsiveContainer width="100%" height={220}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke="#eee" /><XAxis type="number" dataKey="x" name="Avg. Focus" fontSize={12} domain={[1, 5]} /><YAxis type="number" dataKey="y" name="Grade" fontSize={12} domain={[0, 100]} /><Tooltip /><Scatter data={focusVsGrade} fill="#f0a35c" /></ScatterChart></ResponsiveContainer>
        </div>
      </div>

      <div className="card table-card">
        <div className="card-heading"><div><h4>Subject Activity Detail</h4><span className="muted">Your logged sessions and current academic records</span></div></div>
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Subject</th><th>Sessions</th><th>Study Hours</th><th>Avg Focus</th><th>Current Grade</th></tr></thead><tbody>{subjectRows.map((row) => <tr key={row.subject}><td>{row.subject}</td><td>{row.sessions}</td><td>{row.hours.toFixed(1)}</td><td>{row.focus === null ? "—" : row.focus.toFixed(1)}</td><td>{row.grade}</td></tr>)}</tbody></table></div>
      </div>
    </div>
  );
}
