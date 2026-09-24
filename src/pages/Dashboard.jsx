import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import StatCard from "../components/StatCard.jsx";
import {
  students, studentAverage, sampleSummary, subjects, avg, averageSessionDuration,
  getMostStudiedSubject, getSubjectHours, getStudyStreak,
} from "../data/students.js";

export default function Dashboard({ currentStudent }) {
  const me = currentStudent;
  const summary = sampleSummary(students);
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
              <Line type="monotone" dataKey="hours" stroke="#4a4ab8" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
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
              <Bar dataKey="hours" fill="#7b7bd4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card insight-card">
        <div className="insight-kicker">Group Note</div>
        <h4>Sample average</h4>
        <p style={{ fontSize: 13, margin: 0 }}>
          Across all 6 recorded profiles, average weekly study time is <b>{summary.avgHours.toFixed(1)} hrs</b> and
          average grade is <b>{summary.avgGrade.toFixed(1)}</b>. Your lowest subject is <b>{weakestSubject[0]}</b> — check your logged sessions there.
        </p>
      </div>
    </div>
  );
}
