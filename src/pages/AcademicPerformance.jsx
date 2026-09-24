import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { subjects, studentAverage } from "../data/students.js";

export default function AcademicPerformance({ currentStudent }) {
  const me = currentStudent;
  const chartData = subjects.map((subject) => ({ subject, current: me.grades[subject], previous: me.previousGrades[subject] }));
  const values = Object.values(me.grades);
  const averageChange = studentAverage(me) - Object.values(me.previousGrades).reduce((a, b) => a + b, 0) / subjects.length;

  return (
    <div className="page-enter">
      <div className="page-heading-row"><div><div className="eyebrow">HOW YOU ARE DOING</div><h1>Academic Performance</h1><p className="muted">Current grades compared with the previous recorded values.</p></div><div className={`page-pill ${averageChange >= 0 ? "pill-positive" : "pill-negative"}`}>{averageChange >= 0 ? "+" : ""}{averageChange.toFixed(1)} average change</div></div>

      <div className="grid grid-4">
        <div className="card stat-card hover-card"><div className="stat-label">Average Grade</div><div className="stat-value">{studentAverage(me).toFixed(1)}</div><div className="stat-sub">current average</div></div>
        <div className="card stat-card hover-card"><div className="stat-label">Highest Grade</div><div className="stat-value">{Math.max(...values)}</div><div className="stat-sub">current record</div></div>
        <div className="card stat-card hover-card"><div className="stat-label">Lowest Grade</div><div className="stat-value">{Math.min(...values)}</div><div className="stat-sub">current record</div></div>
        <div className="card stat-card hover-card"><div className="stat-label">Subjects Tracked</div><div className="stat-value">{subjects.length}</div><div className="stat-sub">recorded subjects</div></div>
      </div>

      <div className="card chart-card"><div className="card-heading"><div><h4>Grades by Subject</h4><span className="muted">Previous vs current recorded grades</span></div></div><ResponsiveContainer width="100%" height={280}><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#eee" /><XAxis dataKey="subject" fontSize={12} /><YAxis fontSize={12} domain={[0, 100]} /><Tooltip /><Bar dataKey="previous" fill="#cfd0f5" radius={[6, 6, 0, 0]} name="Previous" /><Bar dataKey="current" fill="#5b5bd6" radius={[6, 6, 0, 0]} name="Current" /></BarChart></ResponsiveContainer></div>

      <div className="card table-card"><div className="card-heading"><div><h4>Grade Detail</h4><span className="muted">Changes are calculated from the recorded grade pairs.</span></div></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Subject</th><th>Previous</th><th>Current</th><th>Change</th></tr></thead><tbody>{subjects.map((subject) => { const change = me.grades[subject] - me.previousGrades[subject]; return <tr key={subject}><td>{subject}</td><td>{me.previousGrades[subject]}</td><td>{me.grades[subject]}</td><td className={change >= 0 ? "positive" : "negative"}>{change >= 0 ? "+" : ""}{change}</td></tr>; })}</tbody></table></div></div>
    </div>
  );
}
