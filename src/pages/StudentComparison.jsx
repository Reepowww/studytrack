import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { students, studentAverage, avg } from "../data/students.js";

export default function StudentComparison({ currentStudent }) {
  const defaultA = currentStudent?.id ?? 1;
  const defaultB = students.find((s) => s.id !== defaultA)?.id ?? 2;
  const [aId, setAId] = useState(defaultA);
  const [bId, setBId] = useState(defaultB);

  const a = students.find((s) => s.id === aId);
  const b = students.find((s) => s.id === bId);

  const handleAChange = (newId) => {
    setAId(newId);
    if (newId === bId) setBId(students.find((s) => s.id !== newId).id);
  };
  const handleBChange = (newId) => {
    setBId(newId);
    if (newId === aId) setAId(students.find((s) => s.id !== newId).id);
  };

  const chartData = [
    { metric: "Weekly Hours", A: Number(avg(a.weeklyHours).toFixed(1)), B: Number(avg(b.weeklyHours).toFixed(1)) },
    { metric: "Avg Grade", A: Number(studentAverage(a).toFixed(1)), B: Number(studentAverage(b).toFixed(1)) },
    { metric: "Focus", A: a.focusLevel, B: b.focusLevel },
    { metric: "Frequency", A: a.studyFrequency, B: b.studyFrequency },
  ];

  const initials = (name) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="page-enter">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow">RECORDED SAMPLE</div>
          <h1>Student Comparison</h1>
          <p className="muted">Compare two profiles side by side.</p>
        </div>
        <div className="page-pill">Descriptive only</div>
      </div>

      <div className="grid grid-2">
        <div className="card selector-card">
          <label>Student A</label>
          <select value={aId} onChange={(e) => handleAChange(Number(e.target.value))}>
            {students.filter((s) => s.id !== bId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="card selector-card">
          <label>Student B</label>
          <select value={bId} onChange={(e) => handleBChange(Number(e.target.value))}>
            {students.filter((s) => s.id !== aId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-2">
        {[a, b].map((student) => (
          <div className="card comparison-card" key={student.id}>
            <div className="comparison-name">
              <span className="avatar">{initials(student.name)}</span>
              <h4>{student.name}</h4>
            </div>
            <ul className="detail-list">
              <li><span>Avg Weekly Hours</span><b>{avg(student.weeklyHours).toFixed(1)}</b></li>
              <li><span>Study Frequency</span><b>{student.studyFrequency}x/week</b></li>
              <li><span>Preferred Method</span><b>{student.preferredMethod}</b></li>
              <li><span>Focus Level</span><b>{student.focusLevel.toFixed(1)} / 5</b></li>
              <li><span>Academic Average</span><b>{studentAverage(student).toFixed(1)}</b></li>
            </ul>
          </div>
        ))}
      </div>

      <div className="card chart-card">
        <div className="card-heading">
          <div><h4>{a.name} vs {b.name}</h4><span className="muted">Side-by-side recorded values</span></div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="metric" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Legend />
            <Bar dataKey="A" name={a.name} fill="#5b5bd6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="B" name={b.name} fill="#f0a35c" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
