import { useEffect, useState } from "react";
import {
  BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis,
} from "recharts";
import { avg, correlation, getSubjectHours, parseSessionDate } from "../data/students.js";
import { getStudentSubjects, isRecordedGrade } from "../data/studentData.js";
import { getPeriodGradeRows, isValidAcademicGrade } from "../data/academicInsights.js";
import { DEFAULT_TERM_STRUCTURE, TERM_STRUCTURES } from "../data/studentData.js";

const hasGradeValue = isValidAcademicGrade;

const SubjectScatterTooltip = ({ active, payload, xLabel, yLabel }) => {
  if (!active || !payload?.length) return null;
  const { name, x, y } = payload[0].payload;
  return (
    <div className="recharts-default-tooltip subject-scatter-tooltip">
      <p className="subject-scatter-tooltip-name">{name}</p>
      <p>{xLabel}: {Number(x).toFixed(1)}</p>
      <p>{yLabel}: {Number(y).toFixed(1)}</p>
    </div>
  );
};

export default function Analytics({ currentStudent, setPage }) {
  const me = currentStudent;
  const termStructure = TERM_STRUCTURES[me.termStructure] ? me.termStructure : DEFAULT_TERM_STRUCTURE;
  const periods = TERM_STRUCTURES[termStructure].periods;
  const [selectedPeriodId, setSelectedPeriodId] = useState(periods[0]?.id || "");
  const activePeriodId = periods.some(({ id }) => id === selectedPeriodId)
    ? selectedPeriodId
    : "";
  const periodGrades = getPeriodGradeRows(me, activePeriodId);
  const subjects = getStudentSubjects(me);
  const sessions = Array.isArray(me.sessions)
    ? me.sessions.filter((session) => session && typeof session === "object"
      && typeof session.subject === "string" && session.subject.trim()
      && parseSessionDate(session.date))
    : [];
  const grades = me.grades && typeof me.grades === "object" && !Array.isArray(me.grades) ? me.grades : {};
  const weeklyHours = Array.isArray(me.weeklyHours) ? me.weeklyHours : [];
  const subjectHours = getSubjectHours(sessions.filter((session) =>
    session.duration !== "" && Number.isFinite(Number(session.duration)) && Number(session.duration) > 0));
  const subjectRows = subjects.map((subject) => {
    const subjectSessions = sessions.filter((session) => session?.subject === subject);
    return {
      subject,
      sessions: subjectSessions.length,
      hours: Number(((subjectHours[subject] || 0) / 60).toFixed(1)),
      focus: subjectSessions.some((session) => Number.isFinite(Number(session.focus))
        && session.focus !== "" && Number(session.focus) >= 1 && Number(session.focus) <= 5)
        ? avg(subjectSessions.map((session) => Number(session.focus))
          .filter((focus) => Number.isFinite(focus) && focus >= 1 && focus <= 5))
        : null,
      grade: grades[subject],
    };
  });
  const gradeRows = subjectRows.filter((row) => hasGradeValue(row.grade));
  const currentGradeAverage = gradeRows.length
    ? avg(gradeRows.map(({ grade }) => Number(grade)))
    : null;
  const hoursVsGrade = gradeRows.map((row) => ({ x: row.hours, y: Number(row.grade), name: row.subject }));
  const freqVsGrade = gradeRows.map((row) => ({ x: row.sessions, y: Number(row.grade), name: row.subject }));
  const focusVsGrade = subjectRows.filter((row) => row.focus !== null)
    .filter((row) => hasGradeValue(row.grade))
    .map((row) => ({ x: row.focus, y: Number(row.grade), name: row.subject }));
  const corrHours = correlation(hoursVsGrade.map((d) => d.x), hoursVsGrade.map((d) => d.y));
  const corrFreq = correlation(freqVsGrade.map((d) => d.x), freqVsGrade.map((d) => d.y));
  const corrFocus = correlation(focusVsGrade.map((d) => d.x), focusVsGrade.map((d) => d.y));
  const methodCount = {};
  sessions.forEach((session) => {
    if (typeof session?.method === "string" && session.method.trim()) {
      methodCount[session.method] = (methodCount[session.method] || 0) + 1;
    }
  });
  const mostUsedMethod = Object.entries(methodCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  const focusValues = sessions.map((session) => Number(session?.focus))
    .filter((focus, index) => Number.isFinite(focus) && focus >= 1 && focus <= 5
      && sessions[index]?.focus !== "");
  const sessionFocus = focusValues.length ? avg(focusValues) : null;

  useEffect(() => {
    if (!periods.some(({ id }) => id === selectedPeriodId)) {
      setSelectedPeriodId(periods[0]?.id || "");
    }
  }, [periods, selectedPeriodId]);

  return (
    <div className="page-enter">
      <div className="page-heading-row">
        <div><div className="eyebrow">ANALYTICS</div><h1>Analytics</h1><p className="muted">Analysis of your own recorded study activity and subject grades.</p></div>
        <div className="page-pill">{sessions.length} sessions recorded</div>
      </div>

      <div className="notice-banner"><b>How to read this page:</b> selected-period grades are shown separately below. Study sessions do not store an academic-period ID, so activity summaries use all saved sessions and are not presented as period-specific or directly comparable to period grades.</div>

      {!subjects.length && !sessions.length && !gradeRows.length && (
        <div className="card empty-state">
          <span className="empty-state-icon" aria-hidden="true">⌁</span>
          <h2>Your analytics will grow with your records</h2>
          <p className="muted">There are no saved subjects, grades, or study sessions to analyze yet.</p>
          <button className="btn-primary" onClick={() => setPage?.("performance")}>Add subjects or grades</button>
        </div>
      )}

      <div className="card chart-card">
        <div className="card-heading">
          <div>
            <h4>Academic Period Grades</h4>
            <span className="muted">One selected period at a time; no cross-period average or final grade is calculated.</span>
          </div>
          <label htmlFor="analytics-period">Academic period</label>
          <select
            id="analytics-period"
            value={activePeriodId}
            onChange={(event) => setSelectedPeriodId(event.target.value)}
          >
            {periods.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
          </select>
        </div>
        {periodGrades.period ? (
          <>
            <p className="muted">
              {periodGrades.recordedRows.length} of {periodGrades.rows.length} subject grades recorded for {periodGrades.period.label}.
              {" "}Unrecorded entries are shown as missing, not zero.
            </p>
            {periodGrades.recordedRows.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={periodGrades.recordedRows} margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="subject" fontSize={11} interval={0} />
                  <YAxis fontSize={11} domain={[0, 100]} unit=" points" />
                  <Tooltip formatter={(value) => [`${value} points`, "Recorded grade"]} />
                  <Bar dataKey="grade" fill="#0ea5e9" radius={[5, 5, 0, 0]} isAnimationActive />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="empty-state-note">No valid grades are recorded for this period. Add a period grade in Academic Performance when one is available.</p>
            )}
            {periodGrades.rows.length > 0 && (
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Subject</th><th>{periodGrades.period.label} grade</th></tr></thead>
                  <tbody>{periodGrades.rows.map(({ subject, grade }) => (
                    <tr key={subject}><td>{subject}</td><td>{grade === null ? "Not recorded" : grade}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </>
        ) : <p className="empty-state-note">Choose an academic calendar with available periods.</p>}
      </div>

      <div className="grid grid-4">
        <div className="card stat-card hover-card"><div className="stat-label">Avg Study Time</div><div className="stat-value">{weeklyHours.some((value) => isRecordedGrade(value) && Number(value) >= 0) ? avg(weeklyHours.filter((value) => isRecordedGrade(value) && Number(value) >= 0).map(Number)).toFixed(1) : "—"}</div><div className="stat-sub">hours per recorded week</div></div>
        <div className="card stat-card hover-card"><div className="stat-label">Avg Current Grade</div><div className="stat-value">{currentGradeAverage === null ? "—" : currentGradeAverage.toFixed(1)}</div><div className="stat-sub">valid recorded current grades only</div></div>
        <div className="card stat-card hover-card"><div className="stat-label">Avg Session Focus</div><div className="stat-value">{sessionFocus === null ? "—" : `${sessionFocus.toFixed(1)} / 5`}</div><div className="stat-sub">your recorded sessions</div></div>
        <div className="card stat-card hover-card"><div className="stat-label">Most Used Method</div><div className="stat-value">{mostUsedMethod}</div><div className="stat-sub">from your session logs</div></div>
      </div>

      <div className="card chart-card">
        <div className="card-heading"><div><h4>All Logged Study Time vs Current Grade</h4><span className="muted">All dated sessions compared descriptively with the overall current grade; these aren’t matched to a specific academic period.</span></div><span className="correlation-badge">{hoursVsGrade.length > 1 ? `r = ${corrHours.toFixed(2)}` : "r = —"}</span></div>
        {hoursVsGrade.length ? <ResponsiveContainer width="100%" height={280}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis type="number" dataKey="x" name="Study Hours" fontSize={12} label={{ value: "Logged study hours", position: "insideBottom", offset: -5, fontSize: 12 }} />
            <YAxis type="number" dataKey="y" name="Subject Grade" fontSize={12} domain={[0, 100]} />
            <ZAxis range={[80, 80]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<SubjectScatterTooltip xLabel="Study hours" yLabel="Grade" />} />
            <Scatter data={hoursVsGrade} fill="#5b5bd6" />
          </ScatterChart>
        </ResponsiveContainer> : <p className="empty-state-note">Add current grades for subjects to compare them with logged study time.</p>}
        {hoursVsGrade.length > 1 && <p className="muted">Observed subject-level correlation: <b>r = {corrHours.toFixed(2)}</b>. This describes your records and does not establish a causal effect.</p>}
      </div>

      <div className="grid grid-2">
      <div className="card chart-card"><div className="card-heading"><div><h4>All Logged Sessions vs Current Grade</h4><span className="muted">Session count and current grade by subject; records are not period-aligned.</span></div><span className="correlation-badge">{freqVsGrade.length > 1 ? `r = ${corrFreq.toFixed(2)}` : "r = —"}</span></div>
          {freqVsGrade.length ? <ResponsiveContainer width="100%" height={220}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke="#eee" /><XAxis type="number" dataKey="x" name="Sessions" fontSize={12} /><YAxis type="number" dataKey="y" name="Grade" fontSize={12} domain={[0, 100]} /><Tooltip content={<SubjectScatterTooltip xLabel="Sessions" yLabel="Grade" />} /><Scatter data={freqVsGrade} fill="#0ea5e9" /></ScatterChart></ResponsiveContainer> : <p className="empty-state-note">Add recorded grades to compare them with logged sessions.</p>}
        </div>
        <div className="card chart-card"><div className="card-heading"><div><h4>Session Focus vs Current Grade</h4><span className="muted">Average logged focus and current grade by subject; records are not period-aligned.</span></div><span className="correlation-badge">{focusVsGrade.length > 1 ? `r = ${corrFocus.toFixed(2)}` : "r = —"}</span></div>
          {focusVsGrade.length ? <ResponsiveContainer width="100%" height={220}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke="#eee" /><XAxis type="number" dataKey="x" name="Avg. Focus" fontSize={12} domain={[1, 5]} /><YAxis type="number" dataKey="y" name="Grade" fontSize={12} domain={[0, 100]} /><Tooltip content={<SubjectScatterTooltip xLabel="Avg. focus" yLabel="Grade" />} /><Scatter data={focusVsGrade} fill="#38bdf8" /></ScatterChart></ResponsiveContainer> : <p className="empty-state-note">Record study-session focus and a grade to compare these values.</p>}
        </div>
      </div>

      <div className="card table-card">
        <div className="card-heading"><div><h4>Subject Activity Detail</h4><span className="muted">Your logged sessions and current academic records</span></div></div>
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Subject</th><th>Sessions</th><th>Study Hours</th><th>Avg Focus</th><th>Current Grade</th></tr></thead><tbody>{subjectRows.map((row) => <tr key={row.subject}><td>{row.subject}</td><td>{row.sessions}</td><td>{row.hours.toFixed(1)}</td><td>{row.focus === null ? "—" : row.focus.toFixed(1)}</td><td>{hasGradeValue(row.grade) ? row.grade : "—"}</td></tr>)}</tbody></table></div>
      </div>
    </div>
  );
}
