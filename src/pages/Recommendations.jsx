import {
  avg, getStudentSubjectProgress, getStudyStreak, parseSessionDate,
} from "../data/students.js";

const toScoreMap = (scores) => Object.fromEntries(
  Object.entries(scores && typeof scores === "object" ? scores : {})
    .filter(([, value]) => value !== null && value !== "" && Number.isFinite(Number(value)))
    .map(([subject, value]) => [subject, Number(value)]),
);

function buildRecommendations(student = {}, now = new Date()) {
  const source = student && typeof student === "object" ? student : {};
  const records = {
    ...source,
    grades: toScoreMap(source.grades),
    previousGrades: toScoreMap(source.previousGrades),
    targets: source.targets && typeof source.targets === "object" ? source.targets : {},
    sessions: Array.isArray(source.sessions)
      ? source.sessions.filter((session) => session && typeof session.subject === "string"
        && session.subject.trim() && parseSessionDate(session.date, now))
      : [],
    weeklyHours: Array.isArray(source.weeklyHours)
      ? source.weeklyHours.filter((hours) => hours !== null && hours !== ""
        && Number.isFinite(Number(hours))).map(Number)
      : [],
  };
  const recommendations = [];
  const progress = getStudentSubjectProgress(records, now);
  const recentEffort = progress.filter(({ recentSessionCount }) => recentSessionCount > 0);
  const latestHours = Number(records.weeklyHours[records.weeklyHours.length - 1]);
  const previousHours = Number(records.weeklyHours[records.weeklyHours.length - 2]);
  const weeklyActivityDecreased = records.weeklyHours.length > 1
    && Number.isFinite(latestHours)
    && Number.isFinite(previousHours)
    && latestHours < previousHours;

  if (records.sessions.length) {
    const recentSessionCount = recentEffort.reduce((total, subject) => total + subject.recentSessionCount, 0);
    const effortSubjects = recentEffort.map(({ subject }) => subject);
    recommendations.push({
      id: "sessions",
      icon: "✓",
      tone: "encouragement",
      title: recentSessionCount ? "Your effort matters" : "Every session counts",
      text: recentSessionCount
        ? `Great job! You've recorded ${recentSessionCount} recent ${recentSessionCount === 1 ? "session" : "sessions"} in ${effortSubjects.join(", ")}. Grades can take time to reflect steady work, so give yourself credit for showing up.`
        : `You've logged ${records.sessions.length} study ${records.sessions.length === 1 ? "session" : "sessions"}. Each one is a real step in your learning, whether or not grades change right away.`,
      reason: recentSessionCount
        ? "These subject sessions were logged within the last seven days."
        : "Based on the study sessions in your record.",
      action: "Log a Study Session",
      page: "habits",
    });
  }

  const streak = getStudyStreak(records.sessions, now);
  if (streak > 1) {
    recommendations.push({
      id: "streak",
      icon: "✦",
      tone: "achievement",
      title: "A consistency win",
      text: `Your logged sessions include a ${streak}-day study streak. You're building a strong habit—every session counts!`,
      reason: "Your recorded study dates include sessions on consecutive days.",
      action: "View Study Habits",
      page: "habits",
    });
  }

  const targetSubjects = progress.filter(({ currentGrade, targetGrade }) =>
    Number.isFinite(currentGrade) && Number.isFinite(targetGrade) && currentGrade >= targetGrade);
  if (targetSubjects.length) {
    const names = targetSubjects.map(({ subject }) => subject);
    const subjectLabel = names.length > 2
      ? `${names.slice(0, 2).join(", ")} and ${names.length - 2} more`
      : names.join(" and ");
    recommendations.push({
      id: "targets",
      icon: "★",
      tone: "achievement",
      title: "A goal worth celebrating",
      text: names.length === 1 && targetSubjects[0].currentGrade === targetSubjects[0].targetGrade
        ? `You did it! You've reached your ${names[0]} target grade. Keep up the great work!`
        : `Your current grades meet or exceed the targets for ${subjectLabel}. That's progress worth recognizing!`,
      reason: `Your recorded grades meet or are above the saved target${targetSubjects.length === 1 ? "" : "s"} in ${names.join(", ")}.`,
      action: "Review Your Goals",
      page: "performance",
    });
  }

  const improvedSubjects = Object.entries(records.grades)
    .filter(([subject, grade]) => Number.isFinite(Number(grade))
      && Number.isFinite(Number(records.previousGrades[subject]))
      && Number(grade) > Number(records.previousGrades[subject]))
    .map(([subject, grade]) => ({
      subject,
      change: Number(grade) - Number(records.previousGrades[subject]),
    }));
  if (improvedSubjects.length) {
    const names = improvedSubjects.map(({ subject }) => subject);
    recommendations.push({
      id: "improvement",
      icon: "↗",
      tone: "achievement",
      title: "You're making progress",
      text: `Your recorded grade is higher than the previous one in ${names.join(", ")}. Keep noticing the small steps that are working.`,
      reason: improvedSubjects.map(({ subject, change }) =>
        `${subject} is up ${change} point${change === 1 ? "" : "s"}`).join("; ") + " compared with the previous record.",
      action: "Review Your Grades",
      page: "performance",
    });
  }

  const belowTarget = progress
    .filter(({ gap }) => Number.isFinite(gap) && gap > 0)
    .sort((a, b) => b.gap - a.gap);
  if (belowTarget.length) {
    const focus = belowTarget[0];
    recommendations.push({
      id: "focus-one",
      icon: "◎",
      tone: "next-step",
      title: belowTarget.length > 1 ? "One step at a time" : "A manageable next step",
      text: belowTarget.length > 1
        ? `You don't have to improve everything at once. ${belowTarget.length} subjects are below their targets; let's start with ${focus.subject} and one topic today.`
        : `There's room to grow in ${focus.subject}, and that's okay. Pick one topic and spend a short study session reviewing it—you've got this!`,
      reason: belowTarget.length > 1
        ? `${focus.subject} is currently ${focus.gap} points below its target, the largest recorded gap.`
        : `Your ${focus.subject} grade is ${focus.gap} points below its target of ${focus.targetGrade}.`,
      action: belowTarget.length > 1 ? "Review Subject Goals" : "Review Subject",
      page: "performance",
    });
  }

  if (weeklyActivityDecreased) {
    recommendations.push({
      id: "weekly-activity",
      icon: "☀",
      tone: "next-step",
      title: "Ease back into your rhythm",
      text: "It looks like your latest study week was a little lighter. That's okay—every small step counts. Try one short session when it fits your schedule.",
      reason: `Your latest recorded week was ${latestHours} hours, compared with ${previousHours} hours the week before.`,
      action: "Log a Study Session",
      page: "habits",
    });
  }

  const recordedDaysSinceSession = progress
    .map(({ daysSinceLastSession }) => daysSinceLastSession)
    .filter(Number.isFinite);
  if (records.sessions.length && !weeklyActivityDecreased
    && recordedDaysSinceSession.length && Math.min(...recordedDaysSinceSession) > 14) {
    recommendations.push({
      id: "welcome-back",
      icon: "☀",
      tone: "encouragement",
      title: "Welcome back",
      text: "Welcome back! Start small and ease yourself into your routine. One focused session is a great place to begin.",
      reason: `Your latest dated subject study session was ${Math.min(...recordedDaysSinceSession)} days ago.`,
      action: "Log a Study Session",
      page: "habits",
    });
  }

  if (!recommendations.length) {
    recommendations.push({
      id: "keep-going",
      icon: "✦",
      tone: "encouragement",
      title: records.sessions.length || Object.keys(records.grades).length
        ? "Keep going at your own pace"
        : "A fresh start, at your pace",
      text: "Every small step counts. When you're ready, log a study session or review your goals to choose a next step that feels manageable.",
      reason: records.sessions.length || Object.keys(records.grades).length
        ? "There isn't a specific change in your recorded grades or study activity to call out right now."
        : "There are no study sessions or grades recorded yet.",
      action: "View Study Habits",
      page: "habits",
    });
  }

  return { recommendations, records };
}

export default function Recommendations({ currentStudent, setPage }) {
  const { recommendations, records } = buildRecommendations(currentStudent || {});
  const gradeValues = Object.values(records.grades).map(Number).filter(Number.isFinite);
  const average = gradeValues.length
    ? avg(gradeValues)
    : null;
  const weeklyAverage = avg(records.weeklyHours.map(Number).filter(Number.isFinite));

  return (
    <div className="page-enter">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow">YOUR NEXT ACHIEVABLE STEP</div>
          <h1>Suggestions for you</h1>
          <p className="muted">A little encouragement, based on your study sessions and academic progress.</p>
        </div>
        <div className="page-pill">Made from your records</div>
      </div>

      <div className="notice-banner rec-welcome">
        <span aria-hidden="true">💙</span>
        <div><b>You're doing your best, one step at a time.</b> These suggestions highlight what your records show and offer a practical next step—without expecting you to do everything at once.</div>
      </div>

      <div className="recommendation-grid">
        {recommendations.map((recommendation) => (
          <article className={`card rec-card rec-${recommendation.tone}`} key={recommendation.id}>
            <div className="rec-icon" aria-hidden="true">{recommendation.icon}</div>
            <div className="rec-content">
              <div className="rec-type">{recommendation.title}</div>
              <p className="rec-message">{recommendation.text}</p>
              <p className="rec-reason">{recommendation.reason}</p>
              <button className="btn-secondary-light rec-action" onClick={() => setPage(recommendation.page)}>
                {recommendation.action}<span aria-hidden="true">→</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="card snapshot-card">
        <div className="card-heading">
          <div><h4>Your Snapshot</h4><span className="muted">The recorded values behind these suggestions.</span></div>
        </div>
        <ul className="detail-list">
          <li><span>Academic Average</span><b>{average === null ? "—" : average.toFixed(1)}</b></li>
          <li><span>Study Frequency</span><b>{records.studyFrequency !== null && records.studyFrequency !== ""
            && Number.isFinite(Number(records.studyFrequency)) ? `${records.studyFrequency}x/week` : "—"}</b></li>
          <li><span>Average Weekly Study Time</span><b>{weeklyAverage.toFixed(1)} hrs</b></li>
          <li><span>Focus Level</span><b>{records.focusLevel !== null && records.focusLevel !== ""
            && Number.isFinite(Number(records.focusLevel)) ? `${Number(records.focusLevel).toFixed(1)} / 5` : "—"}</b></li>
          <li><span>Preferred Method</span><b>{records.preferredMethod || "—"}</b></li>
        </ul>
      </div>
    </div>
  );
}
