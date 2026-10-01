import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import StatCard from "../components/StatCard.jsx";
import {
  studentAverage, subjects, avg, averageSessionDuration,
  getMostStudiedSubject, getSubjectHours, getStudyStreak, getStudentSubjectProgress,
} from "../data/students.js";

export default function Dashboard({ currentStudent, setPage }) {
  const me = currentStudent;
  const weekData = me.weeklyHours.map((hours, i) => ({ week: `W${i + 1}`, hours }));
  const subjectHours = subjects.map((subject) => ({
    subject: subject.length > 10 ? subject.split(" ")[0] : subject,
    hours: Number(((getSubjectHours(me.sessions)[subject] || 0) / 60).toFixed(1)),
  }));
  const averageDuration = averageSessionDuration(me.sessions);
  const topSubject = Object.entries(me.grades).sort((a, b) => b[1] - a[1])[0];
  const weakestSubject = Object.entries(me.grades).sort((a, b) => a[1] - b[1])[0];
  const latestWeek = me.weeklyHours[me.weeklyHours.length - 1];
  const streak = getStudyStreak(me.sessions);
  const subjectProgress = getStudentSubjectProgress(me);
  const needsAttention = subjectProgress.filter((progress) => progress.status !== "on-track");
  const focusSubjects = [...subjectProgress]
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
        <StatCard label="Hours This Week" value={`${latestWeek} hrs`} sub="latest week" />
        <StatCard label="Sessions Logged" value={me.sessions.length} sub="total recorded" />
        <StatCard label="Avg. Session" value={`${Math.round(averageDuration)} min`} sub="per session" />
        <StatCard label="Most Studied" value={getMostStudiedSubject(me.sessions)} sub="by time logged" />
      </div>

      <div className="section-title">Academic</div>
      <div className="grid grid-4">
        <StatCard label="Overall Average" value={studentAverage(me).toFixed(1)} sub="current grades" />
        <StatCard label="Highest" value={topSubject[0]} sub={`grade: ${topSubject[1]}`} />
        <StatCard label="Needs Work" value={weakestSubject[0]} sub={`grade: ${weakestSubject[1]}`} />
        <StatCard label="Focus Rating" value={`${me.focusLevel.toFixed(1)} / 5`} sub="self-rated avg" />
      </div>

      <div className="goal-focus-heading">
        <div><div className="section-title">Study Goals &amp; Recommendations</div><h3>Your Study Focus</h3></div>
        <button className="btn-primary" onClick={() => setPage?.("performance")}>Manage goals</button>
      </div>
      <div className="goal-focus-list">
        {focusSubjects.map((progress) => {
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
        })}
      </div>

      <div className="grid grid-2">
        <div className="card chart-card">
          <div className="card-heading">
            <div><h4>Weekly Study Hours</h4><span className="muted">Last 7 weeks</span></div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="week" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="hours" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card chart-card">
          <div className="card-heading">
            <div><h4>Hours by Subject</h4><span className="muted">From logged sessions</span></div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={subjectHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="subject" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Bar dataKey="hours" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card insight-card">
        <div className="insight-kicker">Personal Note</div>
        <h4>{needsAttention.length ? "Subjects to monitor" : "Goals currently on track"}</h4>
        <p style={{ fontSize: 13, margin: 0 }}>
          {needsAttention.length
            ? `${needsAttention.length} of your ${subjectProgress.length} subjects could use monitoring. ${needsAttention[0].subject}: ${needsAttention[0].recommendation}`
            : "Your recorded subject grades meet their targets, and each has study activity in the last 7 days."}
        </p>
      </div>
    </div>
  );
}
