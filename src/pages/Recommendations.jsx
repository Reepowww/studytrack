import { useEffect, useState } from "react";
import { buildRecommendations } from "../data/academicInsights.js";
import {
  averageSessionFocus,
  mostCommonSessionMethod,
  recentStudyHours,
  recentStudySessionCount,
} from "../data/sessionStats.js";
import { TERM_STRUCTURES } from "../data/studentData.js";

export default function Recommendations({ currentStudent, setPage }) {
  const periods = TERM_STRUCTURES[currentStudent?.termStructure]?.periods || [];
  const [selectedPeriodId, setSelectedPeriodId] = useState(periods[0]?.id || "");
  const validSelectedPeriodId = periods.some(({ id }) => id === selectedPeriodId)
    ? selectedPeriodId
    : "";
  const { recommendations, records } = buildRecommendations(
    currentStudent || {},
    new Date(),
    validSelectedPeriodId,
  );
  const sessions = Array.isArray(currentStudent?.sessions) ? currentStudent.sessions : [];
  const recentSessionCount = recentStudySessionCount(sessions);
  const recentHours = recentStudyHours(sessions);
  const sessionFocus = averageSessionFocus(sessions);
  const sessionMethod = mostCommonSessionMethod(sessions);
  const profileWeeklyAverage = records.weeklyHours.length ? avg(records.weeklyHours) : null;
  const focusLevel = sessionFocus ?? records.focusLevel;
  const preferredMethod = sessionMethod || records.preferredMethod;

  useEffect(() => {
    if (!periods.some(({ id }) => id === selectedPeriodId)) setSelectedPeriodId(periods[0]?.id || "");
  }, [periods, selectedPeriodId]);

  return (
    <div className="page-enter">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow">YOUR NEXT ACHIEVABLE STEP</div>
          <h1>Suggestions for you</h1>
          <p className="muted">Supportive next steps based on this student's saved records.</p>
        </div>
        <div className="page-pill">Made from your records</div>
      </div>

      <div className="notice-banner rec-welcome">
        <span aria-hidden="true">💙</span>
        <div><b>One step at a time.</b> Each suggestion shows the record behind it. It is okay to have missing entries or choose a different pace.</div>
      </div>

      <div className="card recommendation-period-control">
        <label htmlFor="recommendation-period">Academic period used for grade suggestions</label>
        <select
          id="recommendation-period"
          value={validSelectedPeriodId}
          onChange={(event) => setSelectedPeriodId(event.target.value)}
        >
          {periods.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
        </select>
        <p className="muted">Grade-based suggestions use only the selected period’s manually recorded grades. They do not treat grades from other periods as current.</p>
      </div>

      <div className="recommendation-grid">
        {recommendations.map((recommendation) => (
          <article className={`card rec-card rec-${recommendation.tone}`} key={recommendation.id}>
            <div className="rec-icon" aria-hidden="true">{recommendation.icon}</div>
            <div className="rec-content">
              <div className="rec-type">{recommendation.title}</div>
              <p className="rec-message">{recommendation.text}</p>
              <p className="rec-reason"><b>Why am I seeing this?</b> {recommendation.reason}</p>
              <button className="btn-secondary-light rec-action" onClick={() => setPage(recommendation.page)}>
                {recommendation.action}<span aria-hidden="true">→</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="card snapshot-card">
        <div className="card-heading">
          <div><h4>Your Summary</h4><span className="muted">Summary of your study habits.</span></div>
        </div>
        <p className="muted">Study frequency and time use sessions from the last 7 days. Focus and preferred method summarize all saved sessions with those details.</p>
        <ul className="detail-list">
          <li><span>Study Frequency (last 7 days)</span><b>{recentSessionCount !== null
            ? `${recentSessionCount} ${recentSessionCount === 1 ? "session" : "sessions"}`
            : records.studyFrequency !== null && records.studyFrequency !== ""
              && Number.isFinite(Number(records.studyFrequency))
              ? `${records.studyFrequency}x/week` : "Not recorded"}</b></li>
          <li><span>Study Time (last 7 days)</span><b>{recentHours !== null
            ? `${recentHours.toFixed(1)} hrs`
            : profileWeeklyAverage === null ? "Not recorded" : `${profileWeeklyAverage.toFixed(1)} hrs/week`}</b></li>
          <li><span>Average Focus Level</span><b>{focusLevel !== null && focusLevel !== ""
            && Number.isFinite(Number(focusLevel)) ? `${Number(focusLevel).toFixed(1)} / 5` : "Not recorded"}</b></li>
          <li><span>Most Used Study Method</span><b>{preferredMethod || "Not recorded"}</b></li>
        </ul>
      </div>
    </div>
  );
}
