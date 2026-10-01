import { studentAverage, avg, getStudentSubjectProgress } from "../data/students.js";

function buildRecommendations(student) {
  const recs = [];
  const averageWeeklyHours = avg(student.weeklyHours);
  const currentAverage = studentAverage(student);
  const previousAverage = avg(Object.values(student.previousGrades));

  // Rule 1 from the research objectives: low study frequency.
  if (student.studyFrequency <= 3) {
    recs.push({ type: "Frequency", text: "Your recorded study frequency is at or below the 3-session weekly threshold. Consider building a more consistent study schedule." });
  }

  // Rule 2 from the research objectives: high hours while grades decline.
  if (averageWeeklyHours >= 12 && currentAverage < previousAverage) {
    recs.push({ type: "Study Effectiveness", text: "Your recorded study time is relatively high while your current academic average is lower than the previous average. Reviewing study effectiveness may be more useful than simply adding more hours." });
  }

  const weakestSubject = Object.entries(student.grades).sort((a, b) => a[1] - b[1])[0];
  recs.push({ type: "Subject", text: `${weakestSubject[0]} currently has your lowest recorded grade at ${weakestSubject[1]}. Reviewing your sessions for this subject may help identify a study pattern worth monitoring.` });

  const improved = Object.keys(student.grades).filter((subject) => student.grades[subject] > student.previousGrades[subject]);
  if (improved.length) {
    recs.push({ type: "Trend", text: `Your current grades are higher than the previous records in ${improved.join(", ")}. Continue monitoring whether this pattern remains consistent over time.` });
  }

  getStudentSubjectProgress(student).forEach((progress) => {
    const type = progress.status === "recommended" ? "Study Recommended"
      : progress.status === "attention" ? "Needs Attention" : "On Track";
    recs.push({ type, subject: progress.subject, text: progress.recommendation });
  });

  return recs;
}

export default function Recommendations({ currentStudent }) {
  const me = currentStudent;
  const recs = buildRecommendations(me);

  return (
    <div className="page-enter">
      <div className="page-heading-row"><div><div className="eyebrow">WHAT TO CHECK NEXT</div><h1>Recommendations</h1><p className="muted">Rule-based suggestions generated from your recorded study and academic data.</p></div><div className="page-pill">Informational only</div></div>
      <div className="notice-banner"><b>Reminder:</b> these suggestions identify patterns in the recorded data. They are not guarantees of improved performance.</div>

      <div className="recommendation-grid">
        {recs.map((recommendation, index) => (
          <div className="card rec-card hover-card" key={`${recommendation.type}-${index}`}>
            <div className="rec-number">{String(index + 1).padStart(2, "0")}</div>
            <div><div className="rec-type">{recommendation.type}</div><p>{recommendation.text}</p></div>
          </div>
        ))}
      </div>

      <div className="card snapshot-card"><div className="card-heading"><div><h4>Your Snapshot</h4><span className="muted">The values used by the recommendation rules.</span></div></div><ul className="detail-list"><li><span>Academic Average</span><b>{studentAverage(me).toFixed(1)}</b></li><li><span>Study Frequency</span><b>{me.studyFrequency}x/week</b></li><li><span>Average Weekly Study Time</span><b>{avg(me.weeklyHours).toFixed(1)} hrs</b></li><li><span>Focus Level</span><b>{me.focusLevel.toFixed(1)} / 5</b></li><li><span>Preferred Method</span><b>{me.preferredMethod}</b></li></ul></div>
    </div>
  );
}
