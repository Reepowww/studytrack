import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { subjects } from "../data/students.js";

const addDaysToDateInput = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const formatFocusDate = (date) => {
  if (!date) return "Choose a date";
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const readFocusPlan = (studentId) => {
  try {
    const saved = JSON.parse(localStorage.getItem(`studytrack:focus:${studentId}`) || "null");
    return saved?.subject && saved?.topic && saved?.date ? saved : null;
  } catch {
    return null;
  }
};

export default function SmartStudyReminders({ currentStudent, streak }) {
  const gradeEntries = Object.entries(currentStudent.grades || {})
    .filter(([, grade]) => grade !== "" && grade !== null && Number.isFinite(Number(grade)))
    .sort((a, b) => Number(a[1]) - Number(b[1]));
  const hasGradeData = gradeEntries.length > 0;
  const weakestSubject = gradeEntries[0]?.[0] || subjects[0];
  const storageKey = `studytrack:focus:${currentStudent.id}`;
  const [focusPlan, setFocusPlan] = useState(() => readFocusPlan(currentStudent.id));
  const [form, setForm] = useState({
    subject: weakestSubject,
    topic: "Review key concepts",
    date: addDaysToDateInput(3),
  });
  const [reminder, setReminder] = useState(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  useEffect(() => {
    if (!reminder) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setReminder(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [reminder]);

  const saveFocusPlan = (event) => {
    event.preventDefault();
    const plan = { ...form, topic: form.topic.trim() };
    setFocusPlan(plan);
    try {
      localStorage.setItem(storageKey, JSON.stringify(plan));
    } catch {
      // Keep the focus plan available for this session when storage is unavailable.
    }
  };

  const openReminder = (type, plan = focusPlan) => {
    setShowEmailPreview(false);
    setReminder({ type, plan });
  };

  const activeFocusPlan = reminder?.plan || focusPlan || form;
  const emailSubject = reminder?.type === "streak"
    ? `StudyTrack Reminder: Review ${weakestSubject}`
    : `StudyTrack Reminder: ${activeFocusPlan.subject} study focus`;

  return (
    <>
      <section className="card reminder-card" aria-labelledby="smart-reminders-title">
        <div className="card-heading">
          <div>
            <div className="insight-kicker">Demo Controls</div>
            <h4 id="smart-reminders-title">Smart Study Reminders</h4>
            <span className="muted">Try both reminder scenarios without waiting for a date or streak.</span>
          </div>
          <span className="chart-badge">frontend demo</span>
        </div>

        <div className="reminder-status-row">
          <span className="reminder-status">Recorded streak: <b>{streak} {streak === 1 ? "day" : "days"}</b></span>
          <span className="reminder-status">Lowest recorded grade: <b>{hasGradeData ? `${weakestSubject} (${gradeEntries[0][1]})` : `${weakestSubject} (demo fallback)`}</b></span>
        </div>

        <div className="reminder-actions">
          <button type="button" className="btn-primary" onClick={() => openReminder("streak")}>
            Test 10-Day Streak Reminder
          </button>
          <button type="button" className="btn-secondary-light" onClick={() => openReminder("focus", focusPlan || form)}>
            Test Study Focus Reminder
          </button>
        </div>

        <form className="reminder-form" onSubmit={saveFocusPlan}>
          <div className="reminder-form-heading">
            <div><h4>Plan a Study Focus</h4><p className="muted">Set a subject, topic, and target date for the demo reminder.</p></div>
            {focusPlan && <span className="chart-badge">saved on this device</span>}
          </div>
          <div className="reminder-fields">
            <div>
              <label htmlFor="reminder-subject">Subject</label>
              <select id="reminder-subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })}>
                {subjects.map((subject) => <option key={subject}>{subject}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="reminder-topic">Study topic / focus</label>
              <input id="reminder-topic" value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} required />
            </div>
            <div>
              <label htmlFor="reminder-date">Target study date</label>
              <input id="reminder-date" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required />
            </div>
          </div>
          <button type="submit" className="btn-primary reminder-save-button">Save Study Focus</button>
        </form>

        {focusPlan && (
          <div className="saved-focus" aria-live="polite">
            <span><b>{focusPlan.subject}:</b> {focusPlan.topic}</span>
            <span>{formatFocusDate(focusPlan.date)}</span>
          </div>
        )}
        <p className="reminder-demo-note">Test buttons simulate the reminder immediately. No email is sent.</p>
      </section>

      {reminder && createPortal(
        <div className="reminder-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setReminder(null); }}>
          <section className="reminder-dialog" role="dialog" aria-modal="true" aria-labelledby="reminder-dialog-title">
            <div className="reminder-dialog-topline">
              <span className="reminder-demo-label">StudyTrack Demo Reminder</span>
              <button type="button" className="reminder-close" onClick={() => setReminder(null)} aria-label="Close reminder">Close</button>
            </div>
            {reminder.type === "streak" ? (
              <>
                <h3 id="reminder-dialog-title">Keep your study streak going</h3>
                <div className="reminder-message">
                  <p>You've maintained a 10-day study streak!</p>
                  <p>Based on your recorded academic performance, <b>{weakestSubject}</b> may need additional attention{hasGradeData ? ` (current grade: ${gradeEntries[0][1]}).` : "."}</p>
                  <p>Consider spending some study time reviewing {weakestSubject} today.</p>
                </div>
              </>
            ) : (
              <>
                <h3 id="reminder-dialog-title">Upcoming Study Focus</h3>
                <div className="reminder-message">
                  <p>You planned to study <b>{activeFocusPlan.subject}: {activeFocusPlan.topic}</b>.</p>
                  <p>Your scheduled study date is <b>{formatFocusDate(activeFocusPlan.date)}</b> and is approaching.</p>
                  <p>Don't forget to review this topic.</p>
                </div>
              </>
            )}
            <div className="reminder-dialog-actions">
              <button type="button" className="btn-primary" onClick={() => setShowEmailPreview((shown) => !shown)}>
                {showEmailPreview ? "Hide Email Preview" : "Email Preview"}
              </button>
              <button type="button" className="btn-secondary-light" onClick={() => setReminder(null)}>Done</button>
            </div>
            {showEmailPreview && (
              <div className="email-preview" aria-label="Email preview, not sent">
                <div className="email-preview-label">Email Preview · Not Sent</div>
                <div><b>To:</b> {currentStudent.email}</div>
                <div><b>Subject:</b> {emailSubject}</div>
                <div className="email-preview-body">
                  {reminder.type === "streak" ? (
                    <>
                      <p>You've maintained a 10-day study streak!</p>
                      <p>Based on your recorded academic performance, {weakestSubject} may need additional study time.</p>
                      <p>Keep up your study streak and continue working toward your academic goals.</p>
                    </>
                  ) : (
                    <>
                      <p>Your planned study focus is approaching.</p>
                      <p>Review {activeFocusPlan.subject}: {activeFocusPlan.topic} on {formatFocusDate(activeFocusPlan.date)}.</p>
                      <p>Keep working toward your academic goals.</p>
                    </>
                  )}
                </div>
                <p className="email-preview-disclaimer">Visual prototype only. This message has not been sent.</p>
              </div>
            )}
          </section>
        </div>
      , document.body)}
    </>
  );
}