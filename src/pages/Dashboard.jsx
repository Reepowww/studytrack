import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import StatCard from "../components/StatCard.jsx";
import SmartStudyReminders from "../components/SmartStudyReminders.jsx";
import {
  studentAverage, avg, averageSessionDuration,
  getMostStudiedSubject, getSubjectHours, getStudyStreak, getStudentSubjectProgress,
} from "../data/students.js";
import { getStudentSubjects, isRecordedGrade } from "../data/studentData.js";
import { averageSessionFocus, recentStudyHours } from "../data/sessionStats.js";

export default function Dashboard({ currentStudent, setPage }) {
  const me = currentStudent;
  const subjects = getStudentSubjects(me);
  const sessions = Array.isArray(me.sessions) ? me.sessions : [];
  const weeklyHours = Array.isArray(me.weeklyHours) ? me.weeklyHours : [];
  const grades = Object.entries(me.grades || {})
    .filter(([, grade]) => isRecordedGrade(grade));
  const validWeeks = weeklyHours.filter(isRecordedGrade).map(Number);
  const weekData = validWeeks.map((hours, i) => ({ week: `W${i + 1}`, hours }));
  const subjectMinutes = getSubjectHours(sessions);
  const subjectHours = subjects.map((subject) => ({
    subject: subject.length > 10 ? subject.split(" ")[0] : subject,
    hours: Number(((subjectMinutes[subject] || 0) / 60).toFixed(1)),
  }));
  const averageDuration = averageSessionDuration(sessions);
  const topSubject = [...grades].sort((a, b) => Number(b[1]) - Number(a[1]))[0];
  const weakestSubject = [...grades].sort((a, b) => Number(a[1]) - Number(b[1]))[0];
  const latestWeek = validWeeks[validWeeks.length - 1];
  const hasRecordedWeek = isRecordedGrade(latestWeek);
  const sessionHours = hasRecordedWeek ? null : recentStudyHours(sessions);
  const recordedFocus = me.focusLevel !== null && me.focusLevel !== undefined && me.focusLevel !== ""
    && Number.isFinite(Number(me.focusLevel)) ? Number(me.focusLevel) : null;
  const focusRating = recordedFocus ?? averageSessionFocus(sessions);
  const streak = getStudyStreak(sessions);
  const subjectProgress = getStudentSubjectProgress(me);
  const needsAttention = subjectProgress.filter((progress) => ["recommended", "attention"].includes(progress.status));
  const focusSubjects = [...subjectProgress]
    .filter((progress) => progress.status !== "untracked")
    .sort((a, b) => ({ recommended: 2, attention: 1, "on-track": 0 }[b.status] - { recommended: 2, attention: 1, "on-track": 0 }[a.status]))
    .slice(0, 3);

  return (
    <div className="page-enter">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">Dashboard</div>
          <h1>Welcome back, {me.name.split(" ")[0]} 👋</h1>
          <p className="muted">Here's your study activity and academic performance overview.</p>
        </div>
        <div className="streak-badge">🔥 {streak}-day streak</div>
      </div>

      <div className="section-title">Study Overview</div>
      <div className="grid grid-4">
        <StatCard label="Hours This Week" value={hasRecordedWeek ? `${latestWeek} hrs` : sessionHours !== null ? `${sessionHours} hrs` : "—"} sub={!hasRecordedWeek && sessionHours !== null ? "last 7 days of sessions" : "latest recorded week"} />
        <StatCard label="Sessions Logged" value={sessions.length} sub="total recorded" />
        <StatCard label="Avg. Session" value={sessions.length ? `${Math.round(averageDuration)} min` : "—"} sub="per session" />
        <StatCard label="Most Studied" value={getMostStudiedSubject(sessions)} sub="by time logged" />
      </div>

      <div className="section-title">Academic</div>
      <div className="grid grid-4">
        <StatCard label="Overall Average" value={grades.length ? studentAverage(me).toFixed(1) : "—"} sub="recorded current grades" />
        <StatCard label="Highest" value={topSubject?.[0] || "—"} sub={topSubject ? `grade: ${topSubject[1]}` : "no grade recorded"} />
        <StatCard label="Needs Work" value={weakestSubject?.[0] || "—"} sub={weakestSubject ? `grade: ${weakestSubject[1]}` : "no grade recorded"} />
        <StatCard label="Focus Rating" value={focusRating !== null ? `${focusRating.toFixed(1)} / 5` : "—"} sub={recordedFocus === null && focusRating !== null ? "avg of session ratings" : "self-rated avg"} />
      </div>

      <div className="goal-focus-heading">
        <div><div className="section-title">Study Goals &amp; Recommendations</div><h3>Your Study Focus</h3></div>
        <button className="btn-primary" onClick={() => setPage?.("performance")}>Manage goals</button>
      </div>
      <div className="goal-focus-list">
        {focusSubjects.length ? focusSubjects.map((progress) => {
          const statusLabel = progress.status === "recommended" ? "Study Recommended"
            : progress.status === "attention" ? "Needs Attention" : "On Track";
          return (
            <div className={`goal-focus-item goal-${progress.status}`} key={progress.subject}>
              <div className="goal-focus-main">
                <strong>{progress.subject}</strong>
                <span>{progress.currentGrade} / {progress.targetGrade} target</span>
              </div>
              <span className={`goal-status status-${progress.status}`}>{statusLabel}</span>
              <p>{progress.recommendation}</p>
            </div>
          );
        }) : <div className="empty-state-note">Add a current grade and optional target to see subject-specific study suggestions.</div>}
      </div>

      <SmartStudyReminders currentStudent={me} streak={streak} />

      <div className="grid grid-2">
        <div className="card chart-card">
          <div className="card-heading">
            <div><h4>Weekly Study Hours</h4><span className="muted">Last 7 weeks</span></div>
          </div>
          {weekData.length ? <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="week" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="hours" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer> : <p className="empty-state-note">No weekly study-hour records are available yet.</p>}
        </div>
        <div className="card chart-card">
          <div className="card-heading">
            <div><h4>Hours by Subject</h4><span className="muted">From logged sessions</span></div>
          </div>
          {subjects.length ? <ResponsiveContainer width="100%" height={220}>
            <BarChart data={subjectHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="subject" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Bar dataKey="hours" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer> : <p className="empty-state-note">Add a subject to organize study sessions.</p>}
        </div>
      </div>

      <div className="card insight-card">
        <div className="insight-kicker">Personal Note</div>
        <h4>{needsAttention.length ? "Subjects to monitor" : "Goals currently on track"}</h4>
        <p style={{ fontSize: 13, margin: 0 }}>
          {needsAttention.length
            ? `${needsAttention.length} of your ${subjectProgress.length} subjects could use monitoring. ${needsAttention[0].subject}: ${needsAttention[0].recommendation}`
            : focusSubjects.length
              ? "Your recorded subject grades meet their saved targets. Keep logging sessions if you want activity to appear here."
              : "Add subjects, grades, or study sessions to build a personal overview from your own records."}
        </p>
      </div>
    </div>
  );
}