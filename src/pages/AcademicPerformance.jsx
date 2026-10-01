import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { subjects, studentAverage, getSubjectProgress } from "../data/students.js";

const formatSessionDate = (date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function AcademicPerformance({ currentStudent, setCurrentStudent }) {
  const me = currentStudent;
  const chartData = subjects.map((subject) => ({ subject, current: me.grades[subject], previous: me.previousGrades[subject] }));
  const values = Object.values(me.grades);
  const averageChange = studentAverage(me) - Object.values(me.previousGrades).reduce((a, b) => a + b, 0) / subjects.length;
  const subjectProgress = subjects.map((subject) => getSubjectProgress(me, subject));

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: subjects[0], grade: "" });

  const updateTarget = (subject, target) => setCurrentStudent((student) => ({
    ...student,
    targets: { ...student.targets, [subject]: target },
  }));

  const commitTarget = (subject) => {
    const rawTarget = me.targets?.[subject];
    const target = Number(rawTarget);
    updateTarget(subject, rawTarget !== "" && Number.isFinite(target) && target >= 0 && target <= 100
      ? target
      : me.grades[subject]);
  };

  const updateGrade = (event) => {
    event.preventDefault();
    const grade = Number(form.grade);
    if (!form.subject || Number.isNaN(grade) || grade < 0 || grade > 100) return;

    setCurrentStudent((student) => ({
      ...student,
      previousGrades: { ...student.previousGrades, [form.subject]: student.grades[form.subject] },
      grades: { ...student.grades, [form.subject]: grade },
    }));

    setForm({ subject: subjects[0], grade: "" });
    setShowForm(false);
  };

  return (
    <div className="page-enter">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow">HOW YOU ARE DOING</div>
          <h1>Academic Performance</h1>
          <p className="muted">Current grades compared with the previous recorded values.</p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div className={`page-pill ${averageChange >= 0 ? "pill-positive" : "pill-negative"}`}>{averageChange >= 0 ? "+" : ""}{averageChange.toFixed(1)} average change</div>
          <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "Update Grade"}</button>
        </div>
      </div>

      {showForm && (
        <div className="card form-card">
          <div className="card-heading"><div><h4>Update Current Grade</h4><span className="muted">The existing current grade becomes the new "previous" value.</span></div></div>
          <form onSubmit={updateGrade}>
            <label>Subject</label>
            <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
              {subjects.map((subject) => <option key={subject}>{subject}</option>)}
            </select>
            <label>New Grade (0-100)</label>
            <input type="number" min="0" max="100" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
            <button type="submit" className="btn-primary form-button">Save Grade</button>
          </form>
        </div>
      )}

      <div className="grid grid-4">
        <div className="card stat-card hover-card"><div className="stat-label">Average Grade</div><div className="stat-value">{studentAverage(me).toFixed(1)}</div><div className="stat-sub">current average</div></div>
        <div className="card stat-card hover-card"><div className="stat-label">Highest Grade</div><div className="stat-value">{Math.max(...values)}</div><div className="stat-sub">current record</div></div>
        <div className="card stat-card hover-card"><div className="stat-label">Lowest Grade</div><div className="stat-value">{Math.min(...values)}</div><div className="stat-sub">current record</div></div>
        <div className="card stat-card hover-card"><div className="stat-label">Subjects Tracked</div><div className="stat-value">{subjects.length}</div><div className="stat-sub">recorded subjects</div></div>
      </div>

      <div className="goal-section-heading"><div><h3>Subject Goals &amp; Progress</h3><p className="muted">Targets are personal monitoring goals, not predicted outcomes.</p></div></div>
      <div className="goal-grid">
        {subjectProgress.map((progress) => {
          const progressPercent = progress.targetGrade > 0
            ? Math.min(100, Math.max(0, (progress.currentGrade / progress.targetGrade) * 100))
            : 100;
          const gapLabel = progress.gap > 0
            ? `${progress.gap} points below target`
            : progress.gap < 0 ? `${Math.abs(progress.gap)} points above target` : "At target";
          const statusLabel = progress.status === "recommended" ? "Study Recommended"
            : progress.status === "attention" ? "Needs Attention" : "On Track";

          return (
            <article className={`card goal-card goal-${progress.status}`} key={progress.subject}>
              <div className="goal-card-heading">
                <h4>{progress.subject}</h4>
                <span className={`goal-status status-${progress.status}`}>{statusLabel}</span>
              </div>
              <div className="goal-grade-line"><strong>{progress.currentGrade}</strong><span>/ {progress.targetGrade} target</span><b>{gapLabel}</b></div>
              <div className="goal-progress-track" role="progressbar" aria-label={`${progress.subject} grade progress toward target`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progressPercent)}>
                <span style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="goal-activity">
                <span>{progress.recentSessionCount} {progress.recentSessionCount === 1 ? "session" : "sessions"} in the last 7 days</span>
                <span>{progress.lastSessionDate ? `Latest: ${formatSessionDate(progress.lastSessionDate)}` : "No subject sessions recorded"}</span>
              </div>
              <p className="goal-recommendation">{progress.recommendation}</p>
              <label htmlFor={`target-${progress.subject}`}>Target grade</label>
              <input
                id={`target-${progress.subject}`}
                type="number"
                min="0"
                max="100"
                step="1"
                value={me.targets?.[progress.subject] ?? me.grades[progress.subject]}
                onChange={(event) => updateTarget(progress.subject, event.target.value)}
                onBlur={() => commitTarget(progress.subject)}
              />
            </article>
          );
        })}
      </div>

      <div className="card chart-card"><div className="card-heading"><div><h4>Grades by Subject</h4><span className="muted">Previous vs current recorded grades</span></div></div><ResponsiveContainer width="100%" height={280}><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#eee" /><XAxis dataKey="subject" fontSize={12} /><YAxis fontSize={12} domain={[0, 100]} /><Tooltip /><Bar dataKey="previous" fill="#cfd0f5" radius={[6, 6, 0, 0]} name="Previous" /><Bar dataKey="current" fill="#5b5bd6" radius={[6, 6, 0, 0]} name="Current" /></BarChart></ResponsiveContainer></div>

      <div className="card table-card"><div className="card-heading"><div><h4>Grade Detail</h4><span className="muted">Changes are calculated from the recorded grade pairs.</span></div></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Subject</th><th>Previous</th><th>Current</th><th>Change</th></tr></thead><tbody>{subjects.map((subject) => { const change = me.grades[subject] - me.previousGrades[subject]; return <tr key={subject}><td>{subject}</td><td>{me.previousGrades[subject]}</td><td>{me.grades[subject]}</td><td className={change >= 0 ? "positive" : "negative"}>{change >= 0 ? "+" : ""}{change}</td></tr>; })}</tbody></table></div></div>
    </div>
  );
}