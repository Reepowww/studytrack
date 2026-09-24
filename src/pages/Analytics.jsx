import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from "recharts";
import { students, studentAverage, avg, correlation, sampleSummary, methodPerformance } from "../data/students.js";

export default function Analytics() {
  const summary = sampleSummary(students);
  const hoursVsGrade = students.map((student) => ({ x: avg(student.weeklyHours), y: studentAverage(student), name: student.name }));
  const freqVsGrade = students.map((student) => ({ x: student.studyFrequency, y: studentAverage(student), name: student.name }));
  const focusVsGrade = students.map((student) => ({ x: student.focusLevel, y: studentAverage(student), name: student.name }));
  const corrHours = correlation(hoursVsGrade.map((d) => d.x), hoursVsGrade.map((d) => d.y));
  const corrFreq = correlation(freqVsGrade.map((d) => d.x), freqVsGrade.map((d) => d.y));
  const corrFocus = correlation(focusVsGrade.map((d) => d.x), focusVsGrade.map((d) => d.y));
  const methodData = methodPerformance(students);

  return (
    <div className="page-enter">
      <div className="page-heading-row">
        <div><div className="eyebrow">ANALYTICS</div><h1>Analytics</h1><p className="muted">Exploratory analysis of the six-student sample and its recorded patterns.</p></div>
        <div className="page-pill">n = {students.length} students</div>
      </div>

      <div className="notice-banner"><b>How to read this page:</b> correlations and group averages describe patterns in the recorded sample. They do not establish causation.</div>

      <div className="grid grid-4">
        <div className="card stat-card hover-card"><div className="stat-label">Avg Study Time</div><div className="stat-value">{summary.avgHours.toFixed(1)}</div><div className="stat-sub">hours per recorded week</div></div>
        <div className="card stat-card hover-card"><div className="stat-label">Avg Grade</div><div className="stat-value">{summary.avgGrade.toFixed(1)}</div><div className="stat-sub">sample academic average</div></div>
        <div className="card stat-card hover-card"><div className="stat-label">Avg Focus</div><div className="stat-value">{summary.avgFocus.toFixed(1)} / 5</div><div className="stat-sub">recorded focus level</div></div>
        <div className="card stat-card hover-card"><div className="stat-label">Common Method</div><div className="stat-value">{summary.mostCommonMethod}</div><div className="stat-sub">preferred by most students</div></div>
      </div>

      <div className="card chart-card">
        <div className="card-heading"><div><h4>Study Time vs Academic Average</h4><span className="muted">Each point represents one student profile.</span></div><span className="correlation-badge">r = {corrHours.toFixed(2)}</span></div>
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis type="number" dataKey="x" name="Study Hours" fontSize={12} label={{ value: "Average weekly study hours", position: "insideBottom", offset: -5, fontSize: 12 }} />
            <YAxis type="number" dataKey="y" name="Average Grade" fontSize={12} domain={[50, 100]} />
            <ZAxis range={[80, 80]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(value) => Number(value).toFixed(1)} />
            <Scatter data={hoursVsGrade} fill="#5b5bd6" />
          </ScatterChart>
        </ResponsiveContainer>
        <p className="muted">Observed correlation in this sample: <b>r = {corrHours.toFixed(2)}</b>. This is a description of the recorded data, not a causal effect.</p>
      </div>

      <div className="grid grid-2">
        <div className="card chart-card"><div className="card-heading"><div><h4>Study Frequency vs Grades</h4><span className="muted">Recorded sessions per week vs academic average</span></div><span className="correlation-badge">r = {corrFreq.toFixed(2)}</span></div>
          <ResponsiveContainer width="100%" height={220}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke="#eee" /><XAxis type="number" dataKey="x" name="Sessions/week" fontSize={12} /><YAxis type="number" dataKey="y" name="Average" fontSize={12} domain={[50, 100]} /><Tooltip /><Scatter data={freqVsGrade} fill="#8f7ee8" /></ScatterChart></ResponsiveContainer>
        </div>
        <div className="card chart-card"><div className="card-heading"><div><h4>Focus Level vs Grades</h4><span className="muted">Recorded focus rating vs academic average</span></div><span className="correlation-badge">r = {corrFocus.toFixed(2)}</span></div>
          <ResponsiveContainer width="100%" height={220}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke="#eee" /><XAxis type="number" dataKey="x" name="Focus" fontSize={12} domain={[1, 5]} /><YAxis type="number" dataKey="y" name="Average" fontSize={12} domain={[50, 100]} /><Tooltip /><Scatter data={focusVsGrade} fill="#f0a35c" /></ScatterChart></ResponsiveContainer>
        </div>
      </div>

      <div className="card table-card">
        <div className="card-heading"><div><h4>Preferred Method and Academic Average</h4><span className="muted">Students are grouped by their recorded preferred method.</span></div></div>
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Preferred Method</th><th>Students</th><th>Average Grade</th></tr></thead><tbody>{methodData.map((row) => <tr key={row.method}><td>{row.method}</td><td>{row.students}</td><td>{row.averageGrade.toFixed(1)}</td></tr>)}</tbody></table></div>
        <p className="muted">Group averages show an observed sample pattern. They should not be interpreted as proof that a method directly improves or lowers grades.</p>
      </div>
    </div>
  );
}
