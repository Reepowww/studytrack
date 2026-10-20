import { useEffect, useState } from "react";
import { avg } from "../data/students.js";
import { buildRecommendations } from "../data/academicInsights.js";
import { TERM_STRUCTURES } from "../data/studentData.js";

export default function Recommendations({ currentStudent, setPage }) {
  const periods = TERM_STRUCTURES[currentStudent?.termStructure]?.periods || [];
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const validSelectedPeriodId = periods.some(({ id }) => id === selectedPeriodId)
    ? selectedPeriodId
    : "";
  const { recommendations, records } = buildRecommendations(
    currentStudent || {},
    new Date(),
    validSelectedPeriodId,
  );
  const gradeValues = Object.values(records.grades);
  const average = gradeValues.length ? avg(gradeValues) : null;
  const weeklyAverage = records.weeklyHours.length ? avg(records.weeklyHours) : null;

  useEffect(() => {
    if (!periods.some(({ id }) => id === selectedPeriodId)) setSelectedPeriodId("");
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
        <label htmlFor="recommendation-period">Optional academic period for missing-grade reminders</label>
        <select
          id="recommendation-period"
          value={validSelectedPeriodId}
          onChange={(event) => setSelectedPeriodId(event.target.value)}
        >
          <option value="">Don't include period records</option>
          {periods.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
        </select>
        <p className="muted">Period grades are separate from current grades. Choose a period only if you want suggestions about its missing entries.</p>
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
          <div><h4>Your Snapshot</h4><span className="muted">Valid recorded values for this student only.</span></div>
        </div>
        <ul className="detail-list">
          <li><span>Academic Average (recorded current grades)</span><b>{average === null ? "—" : average.toFixed(1)}</b></li>
          <li><span>Study Frequency</span><b>{records.studyFrequency !== null && records.studyFrequency !== ""
            && Number.isFinite(Number(records.studyFrequency)) ? `${records.studyFrequency}x/week` : "—"}</b></li>
          <li><span>Average Weekly Study Time</span><b>{weeklyAverage === null ? "—" : `${weeklyAverage.toFixed(1)} hrs`}</b></li>
          <li><span>Focus Level</span><b>{records.focusLevel !== null && records.focusLevel !== ""
            && Number.isFinite(Number(records.focusLevel)) ? `${Number(records.focusLevel).toFixed(1)} / 5` : "—"}</b></li>
          <li><span>Preferred Method</span><b>{records.preferredMethod || "—"}</b></li>
        </ul>
      </div>
    </div>
  );
}
