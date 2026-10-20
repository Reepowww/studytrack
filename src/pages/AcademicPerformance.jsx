import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { studentAverage, getStudentSubjectProgress } from "../data/students.js";
import {
  DEFAULT_TERM_STRUCTURE,
  TERM_STRUCTURES,
  deleteStudentSubject,
  getStudentSubjects,
  isRecordedGrade,
  moveSavedFocusPlans,
  requiresSubjectDeletionConfirmation,
  removeSavedFocusPlans,
  renameStudentSubject,
  isValidTargetGrade,
  setStudentTarget,
  setStudentPeriodGrade,
  setStudentTermStructure,
  validateSubjectName,
} from "../data/studentData.js";

const formatSessionDate = (date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const hasGradeValue = isRecordedGrade;

const hasSavedFocusPlan = (studentId, subject) => {
  try {
    const saved = JSON.parse(localStorage.getItem(`studytrack:focus:${studentId}`) || "null");
    const plans = Array.isArray(saved) ? saved : saved ? [saved] : [];
    return plans.some((plan) => plan?.subject === subject);
  } catch {
    return false;
  }
};

export default function AcademicPerformance({ currentStudent, setCurrentStudent, onReplayOnboarding }) {
  const me = currentStudent;
  const subjects = getStudentSubjects(me);
  const grades = me.grades && typeof me.grades === "object" ? me.grades : {};
  const previousGrades = me.previousGrades && typeof me.previousGrades === "object" ? me.previousGrades : {};
  const periodGrades = me.periodGrades && typeof me.periodGrades === "object" ? me.periodGrades : {};
  const currentValues = subjects.map((subject) => grades[subject]).filter(hasGradeValue).map(Number);
  const changeValues = subjects.filter((subject) => hasGradeValue(grades[subject]) && hasGradeValue(previousGrades[subject]))
    .map((subject) => Number(grades[subject]) - Number(previousGrades[subject]));
  const averageChange = changeValues.length
    ? changeValues.reduce((total, change) => total + change, 0) / changeValues.length
    : null;
  const chartData = subjects.filter((subject) => hasGradeValue(grades[subject]) || hasGradeValue(previousGrades[subject]))
    .map((subject) => ({
      subject,
      current: hasGradeValue(grades[subject]) ? Number(grades[subject]) : null,
      previous: hasGradeValue(previousGrades[subject]) ? Number(previousGrades[subject]) : null,
    }));
  const subjectProgress = getStudentSubjectProgress(me);
  const termStructure = TERM_STRUCTURES[me.termStructure] ? me.termStructure : DEFAULT_TERM_STRUCTURE;
  const periods = TERM_STRUCTURES[termStructure].periods;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: subjects[0] || "", grade: "" });
  const [newSubject, setNewSubject] = useState("");
  const [editingSubject, setEditingSubject] = useState(null);
  const [editName, setEditName] = useState("");
  const [subjectError, setSubjectError] = useState("");
  const [focusPlanSaveError, setFocusPlanSaveError] = useState("");
  const [pendingFocusPlanAction, setPendingFocusPlanAction] = useState(null);
  const [gradeError, setGradeError] = useState("");
  const [targetDrafts, setTargetDrafts] = useState({});
  const [targetErrors, setTargetErrors] = useState({});
  const [saveFeedback, setSaveFeedback] = useState("");

  useEffect(() => {
    if (!saveFeedback) return undefined;
    const timeout = window.setTimeout(() => setSaveFeedback(""), 2200);
    return () => window.clearTimeout(timeout);
  }, [saveFeedback]);

  const commitTarget = (subject) => {
    const hasDraft = Object.hasOwn(targetDrafts, subject);
    const rawTarget = hasDraft
      ? targetDrafts[subject]
      : me.targets?.[subject] ?? "";
    if (rawTarget === "" && isValidTargetGrade(me.targets?.[subject]) && hasDraft) {
      setTargetErrors((errors) => ({ ...errors, [subject]: "An empty value is not a target. Use Clear target to remove the saved optional target." }));
      return;
    }
    if (rawTarget === "" && !hasDraft) return;
    if (rawTarget !== "" && !isValidTargetGrade(rawTarget)) {
      setTargetErrors((errors) => ({ ...errors, [subject]: "Enter a target from 0 to 100, or use Clear target to leave it unset." }));
      return;
    }
    setCurrentStudent((student) => setStudentTarget(student, subject, rawTarget));
    setTargetDrafts((drafts) => {
      const next = { ...drafts };
      delete next[subject];
      return next;
    });
    setTargetErrors((errors) => ({ ...errors, [subject]: "" }));
    setSaveFeedback(rawTarget === "" ? "Optional target cleared." : "Target saved.");
  };

  const clearTarget = (subject) => {
    setCurrentStudent((student) => setStudentTarget(student, subject, ""));
    setTargetDrafts((drafts) => {
      const next = { ...drafts };
      delete next[subject];
      return next;
    });
    setTargetErrors((errors) => ({ ...errors, [subject]: "" }));
    setSaveFeedback("Optional target cleared.");
  };

  const updateGrade = (event) => {
    event.preventDefault();
    const grade = Number(form.grade);
    if (!form.subject || form.grade === "" || !Number.isFinite(grade) || grade < 0 || grade > 100) {
      setGradeError("Enter a grade from 0 to 100.");
      return;
    }
    setCurrentStudent((student) => {
      const previousGrade = student.grades?.[form.subject];
      const hasPrevious = hasGradeValue(previousGrade);
      return {
        ...student,
        previousGrades: hasPrevious
          ? { ...(student.previousGrades || {}), [form.subject]: previousGrade }
          : student.previousGrades || {},
        grades: { ...(student.grades || {}), [form.subject]: grade },
      };
    });
    setGradeError("");
    setSaveFeedback("Grade updated in this workspace.");
    setForm({ subject: subjects[0] || "", grade: "" });
    setShowForm(false);
  };

  const addSubject = (event) => {
    event.preventDefault();
    const { name, error } = validateSubjectName(subjects, newSubject);
    if (error) {
      setSubjectError(error);
      return;
    }
    setCurrentStudent((student) => ({
      ...student,
      subjects: [...getStudentSubjects(student), name],
      targets: { ...(student.targets || {}), [name]: "" },
    }));
    setNewSubject("");
    setSubjectError("");
    setSaveFeedback("Subject added.");
  };

  const beginRename = (subject) => {
    setEditingSubject(subject);
    setEditName(subject);
    setSubjectError("");
  };

  const saveRename = (event) => {
    event.preventDefault();
    const { name, error } = validateSubjectName(subjects, editName, editingSubject);
    if (error) {
      setSubjectError(error);
      return;
    }
    if (name !== editingSubject) {
      setCurrentStudent((student) => renameStudentSubject(student, editingSubject, name));
      setSaveFeedback("Subject renamed. Its grades, targets, and sessions were kept.");
      if (!moveSavedFocusPlans(me.id, editingSubject, name)) {
        setFocusPlanSaveError("The subject was renamed, but its saved study-focus plans could not be updated. Retry to finish linking them.");
        setPendingFocusPlanAction({ type: "rename", oldName: editingSubject, newName: name });
      } else {
        setFocusPlanSaveError("");
        setPendingFocusPlanAction(null);
      }
    }
    setEditingSubject(null);
    setEditName("");
  };

  const deleteSubject = (subject) => {
    const hasRecords = requiresSubjectDeletionConfirmation(
      me,
      subject,
      hasSavedFocusPlan(me.id, subject),
    );
    if (hasRecords && !window.confirm(
      `“${subject}” has saved grades, goals, period grades, study sessions, or reminders. Deleting it will permanently remove those related records. Continue?`,
    )) return;
    setCurrentStudent((student) => deleteStudentSubject(student, subject));
    if (!removeSavedFocusPlans(me.id, subject)) {
      setFocusPlanSaveError("The subject was removed, but its saved study-focus plans could not be updated. Retry to finish removing them.");
      setPendingFocusPlanAction({ type: "delete", subject });
    } else {
      setFocusPlanSaveError("");
      setPendingFocusPlanAction(null);
    }
    setSaveFeedback("Subject and its related records were removed.");
  };

  const retryFocusPlanUpdate = () => {
    if (!pendingFocusPlanAction) return;
    const saved = pendingFocusPlanAction.type === "rename"
      ? moveSavedFocusPlans(me.id, pendingFocusPlanAction.oldName, pendingFocusPlanAction.newName)
      : removeSavedFocusPlans(me.id, pendingFocusPlanAction.subject);
    if (!saved) {
      setFocusPlanSaveError("Browser storage is still unavailable. The study-focus change remains pending; retry again when storage is available.");
      return;
    }
    setPendingFocusPlanAction(null);
    setFocusPlanSaveError("");
  };

  const changeTermStructure = (nextStructure) => {
    if (!TERM_STRUCTURES[nextStructure] || nextStructure === termStructure) return;
    const recordedPeriodGrades = Object.values(periodGrades)
      .reduce((total, subjectPeriods) => total + Object.keys(subjectPeriods || {}).length, 0);
    if (recordedPeriodGrades && !window.confirm(
      "Saved period grades will remain under their original period names. This only changes which period fields are shown; it will not convert, delete, duplicate, or calculate any grades. Continue?",
    )) return;
    setCurrentStudent((student) => setStudentTermStructure(student, nextStructure));
    setSaveFeedback("Academic calendar updated. Existing grade records were kept unchanged.");
  };

  const updatePeriodGrade = (subject, period, value) => {
    const grade = value === "" ? "" : Number(value);
    if (value !== "" && (!Number.isFinite(grade) || grade < 0 || grade > 100)) return;
    setCurrentStudent((student) => setStudentPeriodGrade(student, subject, period, value));
    setSaveFeedback(value === "" ? "Period grade cleared." : "Period grade updated.");
  };

  return (
    <div className="page-enter">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow">HOW YOU ARE DOING</div>
          <h1>Academic Performance</h1>
          <p className="muted">Track current grades, personal targets, and independent academic-period records.</p>
        </div>
        {saveFeedback && <p className="save-feedback" role="status" aria-live="polite">{saveFeedback}</p>}
        <div className="academic-actions">
          <button className="btn-secondary-light" onClick={onReplayOnboarding}>Replay setup</button>
          <button className="btn-primary" onClick={() => setShowForm((visible) => !visible)} disabled={!subjects.length}>
            {showForm ? "Cancel" : "Update Grade"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card form-card">
          <div className="card-heading"><div><h4>Update Current Grade</h4><span className="muted">This legacy current-grade entry is separate from period grades below.</span></div></div>
          <form onSubmit={updateGrade}>
            <label htmlFor="current-grade-subject">Subject</label>
            <select id="current-grade-subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })}>
              {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
            </select>
            <label htmlFor="current-grade-value">New Grade (0-100)</label>
            <input id="current-grade-value" type="number" min="0" max="100" step="any" value={form.grade} onChange={(event) => setForm({ ...form, grade: event.target.value })} required />
            {gradeError && <p className="form-error" role="alert">{gradeError}</p>}
            <button type="submit" className="btn-primary form-button">Save Grade</button>
          </form>
        </div>
      )}

      {subjects.length ? (
        <>
          <div className="grid grid-4">
            <div className="card stat-card hover-card"><div className="stat-label">Average Grade</div><div className="stat-value">{currentValues.length ? studentAverage(me).toFixed(1) : "—"}</div><div className="stat-sub">recorded current grades</div></div>
            <div className="card stat-card hover-card"><div className="stat-label">Highest Grade</div><div className="stat-value">{currentValues.length ? Math.max(...currentValues) : "—"}</div><div className="stat-sub">recorded current grade</div></div>
            <div className="card stat-card hover-card"><div className="stat-label">Lowest Grade</div><div className="stat-value">{currentValues.length ? Math.min(...currentValues) : "—"}</div><div className="stat-sub">recorded current grade</div></div>
            <div className="card stat-card hover-card"><div className="stat-label">Subjects Tracked</div><div className="stat-value">{subjects.length}</div><div className="stat-sub">active subjects</div></div>
          </div>
          {averageChange !== null && <div className="page-pill academic-change">{averageChange >= 0 ? "+" : ""}{averageChange.toFixed(1)} average change across subjects with two recorded grades</div>}

          <div className="goal-section-heading"><div><h3>Subject Goals &amp; Progress</h3><p className="muted">Targets are optional personal goals. A missing grade or target is shown as not recorded.</p></div></div>
          <div className="goal-grid">
            {subjectProgress.map((progress) => {
              const hasCurrent = Number.isFinite(progress.currentGrade);
              const hasTarget = Number.isFinite(progress.targetGrade);
              const progressPercent = hasCurrent && hasTarget && progress.targetGrade > 0
                ? Math.min(100, Math.max(0, (progress.currentGrade / progress.targetGrade) * 100))
                : null;
              const gapLabel = !hasTarget || !hasCurrent
                ? "No grade comparison yet"
                : progress.gap > 0 ? `${progress.gap} points below target`
                  : progress.gap < 0 ? `${Math.abs(progress.gap)} points above target` : "At target";
              const statusLabel = progress.status === "recommended" ? "Study Recommended"
                : progress.status === "attention" ? "Needs Attention"
                  : progress.status === "untracked" ? "Goal not set" : "On Track";
              return (
                <article className={`card goal-card goal-${progress.status}`} key={progress.subject}>
                  <div className="goal-card-heading"><h4>{progress.subject}</h4><span className={`goal-status status-${progress.status}`}>{statusLabel}</span></div>
                  <div className="goal-grade-line">
                    <strong>{hasCurrent ? progress.currentGrade : "Not recorded"}</strong>
                    <span>/ {hasTarget ? `${progress.targetGrade} target` : "target not set"}</span>
                    <b>{gapLabel}</b>
                  </div>
                  {progressPercent !== null
                    ? <div className="goal-progress-track" role="progressbar" aria-label={`${progress.subject} grade progress toward target`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progressPercent)}><span style={{ width: `${progressPercent}%` }} /></div>
                    : <p className="goal-no-progress">Add both a current grade and a target to see goal progress.</p>}
                  <div className="goal-activity">
                    <span>{progress.recentSessionCount} {progress.recentSessionCount === 1 ? "session" : "sessions"} in the last 7 days</span>
                    <span>{progress.lastSessionDate ? `Latest: ${formatSessionDate(progress.lastSessionDate)}` : "No subject sessions recorded"}</span>
                  </div>
                  <p className="goal-recommendation">{progress.recommendation}</p>
                  <label htmlFor={`target-${encodeURIComponent(progress.subject)}`}>Optional target grade</label>
                  <input
                    id={`target-${encodeURIComponent(progress.subject)}`}
                    type="text"
                    inputMode="decimal"
                    value={Object.hasOwn(targetDrafts, progress.subject)
                      ? targetDrafts[progress.subject]
                      : me.targets?.[progress.subject] ?? ""}
                    onChange={(event) => {
                      setTargetDrafts((drafts) => ({ ...drafts, [progress.subject]: event.target.value }));
                      setTargetErrors((errors) => ({ ...errors, [progress.subject]: "" }));
                    }}
                    onBlur={() => commitTarget(progress.subject)}
                    aria-invalid={Boolean(targetErrors[progress.subject])}
                    aria-describedby={targetErrors[progress.subject]
                      ? `target-error-${encodeURIComponent(progress.subject)}`
                      : undefined}
                  />
                  <button
                    type="button"
                    className="btn-secondary-light"
                    onClick={() => clearTarget(progress.subject)}
                    disabled={!isValidTargetGrade(me.targets?.[progress.subject])
                      && !Object.hasOwn(targetDrafts, progress.subject)}
                  >Clear target</button>
                  {targetErrors[progress.subject] && <span
                    className="form-error"
                    id={`target-error-${encodeURIComponent(progress.subject)}`}
                    role="alert"
                  >{targetErrors[progress.subject]}</span>}
                </article>
              );
            })}
          </div>

          <div className="card chart-card">
            <div className="card-heading"><div><h4>Current Grades by Subject</h4><span className="muted">Only recorded values are plotted.</span></div></div>
            {chartData.length
              ? <ResponsiveContainer width="100%" height={280}><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#eee" /><XAxis dataKey="subject" fontSize={12} /><YAxis fontSize={12} domain={[0, 100]} /><Tooltip /><Bar dataKey="previous" fill="#cce3f0" radius={[6, 6, 0, 0]} name="Previous" /><Bar dataKey="current" fill="#0ea5e9" radius={[6, 6, 0, 0]} name="Current" /></BarChart></ResponsiveContainer>
              : <p className="empty-state-note">No current grades are recorded yet. Add one with “Update Grade” or enter a period grade below.</p>}
          </div>

          <div className="card period-grade-card">
            <div className="card-heading"><div><h4>Academic Period Grades</h4><span className="muted">Enter or edit each period independently. StudyTrack does not calculate a final grade without school-provided weights.</span></div></div>
            <div className="term-settings">
              <label htmlFor="term-structure">Academic calendar</label>
              <select id="term-structure" value={termStructure} onChange={(event) => changeTermStructure(event.target.value)}>
                {Object.entries(TERM_STRUCTURES).map(([key, structure]) => <option key={key} value={key}>{structure.label}</option>)}
              </select>
              <button type="button" className="btn-secondary-light" onClick={onReplayOnboarding}>Review setup</button>
            </div>
            <p className="term-explanation">{termStructure === "dualSemester"
              ? "Dual Semester has separate Prelim, Midterm, and Finals records for Semester 1 and Semester 2."
              : "Trimester uses three explicitly named trimester records. Semester grades stay saved under their original names and are not relabeled."}</p>
            {Object.values(periodGrades).reduce((total, subjectPeriods) =>
              total + Object.keys(subjectPeriods || {}).filter((periodId) => !periods.some((period) => period.id === periodId)).length, 0) > 0
              && <p className="term-explanation">Some saved grades belong to a different calendar structure. They remain stored and will appear again if you switch back.</p>}
            <div className="table-wrap">
              <table className="data-table period-grade-table">
                <thead><tr><th>Subject</th>{periods.map((period) => <th key={period.id}>{period.label}</th>)}</tr></thead>
                <tbody>{subjects.map((subject) => (
                  <tr key={subject}><th scope="row">{subject}</th>{periods.map((period) => (
                    <td key={period.id}><label className="visually-hidden" htmlFor={`period-${encodeURIComponent(subject)}-${period.id}`}>{subject}, {period.label} grade</label>
                      <input id={`period-${encodeURIComponent(subject)}-${period.id}`} type="number" min="0" max="100" step="any" value={periodGrades[subject]?.[period.id] ?? ""} onChange={(event) => updatePeriodGrade(subject, period.id, event.target.value)} placeholder="—" /></td>
                  ))}</tr>
                ))}</tbody>
              </table>
            </div>
            <p className="term-explanation">Grades are displayed separately. Add official weighting rules only if your school provides them; no weighted overall grade is calculated here.</p>
          </div>
        </>
      ) : (
        <div className="card empty-state academic-empty-state">
          <div className="eyebrow">A FRESH START</div>
          <h2>No subjects yet</h2>
          <p className="muted">Add your own subjects to start tracking grades, goals, and study sessions. Nothing will be pre-filled.</p>
        </div>
      )}

      <section className="card subject-manager" aria-labelledby="subject-manager-title">
        <div className="card-heading"><div><h4 id="subject-manager-title">Manage Subjects</h4><span className="muted">Subjects and related records are saved separately for this demo student on this device.</span></div></div>
        <form className="subject-add-form" onSubmit={addSubject}>
          <label htmlFor="new-subject-name">Add a subject</label>
          <div><input id="new-subject-name" value={newSubject} onChange={(event) => setNewSubject(event.target.value)} placeholder="e.g. Biology" />
            <button type="submit" className="btn-primary">Add Subject</button></div>
        </form>
        {subjectError && <p className="form-error" role="alert">{subjectError}</p>}
        {focusPlanSaveError && <p className="form-error" role="alert">
          {focusPlanSaveError}{" "}
          {pendingFocusPlanAction && <button type="button" className="inline-link" onClick={retryFocusPlanUpdate}>Retry</button>}
        </p>}
        {subjects.length > 0 && <ul className="subject-management-list">
          {subjects.map((subject) => (
            <li key={subject}>
              {editingSubject === subject
                ? <form className="subject-edit-form" onSubmit={saveRename}>
                  <label className="visually-hidden" htmlFor={`rename-${encodeURIComponent(subject)}`}>Rename {subject}</label>
                  <input id={`rename-${encodeURIComponent(subject)}`} value={editName} onChange={(event) => setEditName(event.target.value)} />
                  <button type="submit" className="btn-secondary-light">Save name</button>
                  <button type="button" className="btn-secondary-light" onClick={() => setEditingSubject(null)}>Cancel</button>
                </form>
                : <><span>{subject}</span><div className="subject-actions">
                  <button type="button" className="btn-secondary-light" onClick={() => beginRename(subject)}>Rename</button>
                  <button type="button" className="saved-focus-delete" onClick={() => deleteSubject(subject)}>Delete</button>
                </div></>}
            </li>
          ))}
        </ul>}
      </section>
    </div>
  );
}
