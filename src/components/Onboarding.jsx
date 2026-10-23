import { useEffect, useState } from "react";
import {
  DEFAULT_TERM_STRUCTURE,
  isValidTargetGrade,
  saveStudentOnboardingStep,
  setStudentTarget,
  setStudentTermStructure,
  TERM_STRUCTURES,
  validateSubjectName,
} from "../data/studentData.js";

export default function Onboarding({ student, setStudent, onComplete, onSkip }) {
  const [step, setStep] = useState(student.onboardingStep || 0);
  const [newSubject, setNewSubject] = useState("");
  const [storageWarning, setStorageWarning] = useState("");
  const [subjectError, setSubjectError] = useState("");
  const [targetDrafts, setTargetDrafts] = useState({});
  const [targetErrors, setTargetErrors] = useState({});
  const subjects = Array.isArray(student.subjects) ? student.subjects : [];
  const termStructure = TERM_STRUCTURES[student.termStructure] ? student.termStructure : DEFAULT_TERM_STRUCTURE;

  useEffect(() => {
    setStudent((current) => ({ ...current, onboardingStep: step }));
    setStorageWarning(saveStudentOnboardingStep(student.id, step)
      ? ""
      : "Your setup progress cannot be saved in this browser. You can still finish this session.");
  }, [setStudent, step, student.id]);

  const addSubject = (event) => {
    event.preventDefault();
    const { name, error } = validateSubjectName(subjects, newSubject);
    if (error) {
      setSubjectError(error);
      return;
    }
    setSubjectError("");
    setStudent((current) => ({
      ...current,
      subjects: [...(current.subjects || []), name],
      targets: { ...(current.targets || {}), [name]: "" },
    }));
    setNewSubject("");
  };

  const updateTermStructure = (nextStructure) => {
    if (nextStructure === termStructure) return;
    const savedPeriodCount = Object.values(student.periodGrades || {})
      .reduce((total, grades) => total + Object.keys(grades || {}).length, 0);
    if (savedPeriodCount && !window.confirm(
      "Your saved period grades will be kept under their original period names. Changing the calendar only changes which periods are shown; it will not convert, delete, or calculate grades. Continue?",
    )) return;
    setStudent((current) => setStudentTermStructure(current, nextStructure));
  };

  const commitTarget = (subject) => {
    const hasDraft = Object.hasOwn(targetDrafts, subject);
    const value = hasDraft
      ? targetDrafts[subject]
      : student.targets?.[subject] ?? "";
    if (value === "" && isValidTargetGrade(student.targets?.[subject]) && hasDraft) {
      setTargetErrors((errors) => ({ ...errors, [subject]: "An empty value is not a target. Use Clear target to remove the saved optional target." }));
      return;
    }
    if (value === "" && !hasDraft) return;
    if (value !== "" && !isValidTargetGrade(value)) {
      setTargetErrors((errors) => ({ ...errors, [subject]: "Enter a target from 0 to 100, or use Clear target to leave it unset." }));
      return;
    }
    setStudent((current) => setStudentTarget(current, subject, value));
    setTargetDrafts((drafts) => {
      const next = { ...drafts };
      delete next[subject];
      return next;
    });
    setTargetErrors((errors) => ({ ...errors, [subject]: "" }));
  };

  const clearTarget = (subject) => {
    setStudent((current) => setStudentTarget(current, subject, ""));
    setTargetDrafts((drafts) => {
      const next = { ...drafts };
      delete next[subject];
      return next;
    });
    setTargetErrors((errors) => ({ ...errors, [subject]: "" }));
  };

  const next = () => setStep((current) => Math.min(3, current + 1));
  const back = () => setStep((current) => Math.max(0, current - 1));
  const finish = () => {
    const invalidTargets = Object.entries(targetDrafts)
      .filter(([subject, value]) => value === ""
        ? isValidTargetGrade(student.targets?.[subject])
        : !isValidTargetGrade(value));
    if (invalidTargets.length) {
      setTargetErrors((errors) => ({
        ...errors,
        ...Object.fromEntries(invalidTargets.map(([subject]) => [
          subject,
          "Enter a target from 0 to 100, or use Clear target to leave it unset.",
        ])),
      }));
      return;
    }
    if (Object.keys(targetDrafts).length) {
      setStudent((current) => Object.entries(targetDrafts).reduce(
        (updated, [subject, value]) => setStudentTarget(updated, subject, value),
        current,
      ));
    }
    onComplete();
  };

  return (
    <div className="onboarding-overlay" role="presentation">
      <section className="onboarding-dialog card" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <div className="onboarding-progress" aria-label={`Step ${step + 1} of 4`}>
          <span style={{ width: `${((step + 1) / 4) * 100}%` }} />
        </div>
        <div className="onboarding-step-label">GETTING STARTED · STEP {step + 1} OF 4</div>
        {storageWarning && <p className="form-error" role="alert">{storageWarning}</p>}
        {step === 0 && (
          <>
            <h2 id="onboarding-title">Welcome to StudyTrack</h2>
            <p className="muted">Make this space fit your subjects and school calendar. You can skip any setup and change these choices later.</p>
          </>
        )}
        {step === 1 && (
          <>
            <h2 id="onboarding-title">Choose your academic calendar</h2>
            <p className="muted">Choose the terms and grading periods your school uses. You can enter grades manually and configure optional estimates later.</p>
            <label htmlFor="onboarding-term">Academic calendar</label>
            <select id="onboarding-term" value={termStructure} onChange={(event) => updateTermStructure(event.target.value)}>
              {Object.entries(TERM_STRUCTURES).map(([key, structure]) => <option key={key} value={key}>{structure.label}</option>)}
            </select>
          </>
        )}
        {step === 2 && (
          <>
            <h2 id="onboarding-title">Add your subjects</h2>
            <p className="muted">Add one or more subjects now, or continue with none. Your saved records will not be replaced.</p>
            <form className="onboarding-add-subject" onSubmit={addSubject}>
              <label htmlFor="onboarding-subject">Subject name</label>
              <div><input id="onboarding-subject" value={newSubject} onChange={(event) => setNewSubject(event.target.value)} placeholder="e.g. Biology" />
                <button type="submit" className="btn-secondary-light">Add Subject</button></div>
            </form>
            {subjectError && <p className="form-error" role="alert">{subjectError}</p>}
            {subjects.length > 0
              ? <ul className="onboarding-subject-list">{subjects.map((subject) => <li key={subject}>{subject}</li>)}</ul>
              : <p className="onboarding-empty-note">No subjects yet. You can add them later from Academic Performance.</p>}
          </>
        )}
        {step === 3 && (
          <>
            <h2 id="onboarding-title">Set optional target grades</h2>
            <p className="muted">Targets are personal goals, not grades or predictions. Leave them blank if you prefer.</p>
            {subjects.length
              ? <div className="onboarding-target-list">{subjects.map((subject) => (
                <div key={subject} className="onboarding-target">
                  <label htmlFor={`onboarding-target-${encodeURIComponent(subject)}`}>{subject}</label>
                  <input
                    id={`onboarding-target-${encodeURIComponent(subject)}`}
                    aria-label={`${subject} target grade`}
                    type="text"
                    inputMode="decimal"
                    placeholder="Optional"
                    value={Object.hasOwn(targetDrafts, subject)
                      ? targetDrafts[subject]
                      : student.targets?.[subject] ?? ""}
                    onChange={(event) => {
                      setTargetDrafts((drafts) => ({ ...drafts, [subject]: event.target.value }));
                      setTargetErrors((errors) => ({ ...errors, [subject]: "" }));
                    }}
                    onBlur={() => commitTarget(subject)}
                    aria-invalid={Boolean(targetErrors[subject])}
                    aria-describedby={targetErrors[subject]
                      ? `onboarding-target-error-${encodeURIComponent(subject)}`
                      : undefined}
                  />
                  {targetErrors[subject] && <span
                    className="form-error"
                    id={`onboarding-target-error-${encodeURIComponent(subject)}`}
                    role="alert"
                  >{targetErrors[subject]}</span>}
                  <button
                  type="button"
                  className="btn-secondary-light"
                  onClick={() => clearTarget(subject)}
                  disabled={!isValidTargetGrade(student.targets?.[subject])
                    && !Object.hasOwn(targetDrafts, subject)}
                  >Clear target</button>
                </div>
              ))}</div>
              : <p className="onboarding-empty-note">You can add subjects and set targets later.</p>}
          </>
        )}
        <div className="onboarding-actions">
          <button type="button" className="btn-secondary-light" onClick={onSkip}>Skip setup</button>
          <div>
            {step > 0 && <button type="button" className="btn-secondary-light" onClick={back}>Back</button>}
            {step < 3
              ? <button type="button" className="btn-primary" onClick={next}>Next</button>
              : <button type="button" className="btn-primary" onClick={finish}>Finish and open Dashboard</button>}
          </div>
        </div>
      </section>
    </div>
  );
}
