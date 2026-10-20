import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_TERM_STRUCTURE,
  TERM_STRUCTURES,
  completeStudentOnboarding,
  deleteStudentSubject,
  getStudentSubjects,
  hasRecordedSubjectData,
  isValidTargetGrade,
  loadStudentSettings,
  loadStudentOnboarding,
  moveSavedFocusPlans,
  removeSavedFocusPlans,
  renameStudentSubject,
  requiresSubjectDeletionConfirmation,
  restoreStudentTargets,
  saveStudentFocusPlans,
  saveStudentSettings,
  saveStudentOnboardingStep,
  setStudentTarget,
  setStudentPeriodGrade,
  setStudentTermStructure,
  validateSubjectName,
} from "./studentData.js";
import { getStudentSubjectProgress, getTrackedTargetProgress, studentAverage } from "./students.js";
import { buildRecommendations, getPeriodGradeRows } from "./academicInsights.js";

test("legacy demo records produce a deduplicated student subject list", () => {
  const student = {
    grades: { Mathematics: 82, "Robotics ": 90 },
    sessions: [{ subject: "Robotics" }, { subject: "Chemistry" }],
  };
  const subjects = getStudentSubjects(student);
  assert.ok(subjects.includes("Mathematics"));
  assert.ok(subjects.includes("Robotics"));
  assert.ok(subjects.includes("Chemistry"));
  assert.equal(subjects.filter((subject) => subject.toLowerCase() === "robotics").length, 1);
});

test("subject progress without an explicit list derives only the student's own records", () => {
  const progress = getStudentSubjectProgress({
    grades: { "Custom Physics": 81 },
    sessions: [{ subject: "Studio Art" }],
  });
  assert.deepEqual(progress.map(({ subject }) => subject), ["Custom Physics", "Studio Art"]);
});

test("period analytics returns only grades for a valid period in the student's calendar", () => {
  const student = {
    termStructure: "dualSemester",
    subjects: ["Math", "Art"],
    periodGrades: {
      Math: { "semester-1-prelim": 80, "semester-1-midterm": 90 },
      Art: { "semester-1-prelim": "" },
    },
  };
  const result = getPeriodGradeRows(student, "semester-1-prelim");
  assert.deepEqual(result.recordedRows, [{ subject: "Math", grade: 80 }]);
  assert.deepEqual(result.missingSubjects, ["Art"]);
  assert.equal(getPeriodGradeRows(student, "semester-1-midterm").recordedRows[0].grade, 90);
  assert.equal(getPeriodGradeRows(student, "trimester-1").period, null);
});

test("trimester period analytics never mixes semester grades with trimester records", () => {
  const student = {
    termStructure: "trimester",
    subjects: ["Math"],
    periodGrades: {
      Math: { "semester-1-finals": 98, "trimester-1": 72 },
    },
  };
  assert.equal(getPeriodGradeRows(student, "trimester-1").recordedRows[0].grade, 72);
  assert.equal(getPeriodGradeRows(student, "trimester-2").recordedRows[0], undefined);
});

test("period analytics excludes missing and invalid grades while preserving recorded zero", () => {
  const result = getPeriodGradeRows({
    termStructure: "trimester",
    subjects: ["Missing", "Invalid", "Zero", "High"],
    periodGrades: {
      Missing: {},
      Invalid: { "trimester-1": "not a grade" },
      Zero: { "trimester-1": 0 },
      High: { "trimester-1": 101 },
    },
  }, "trimester-1");
  assert.deepEqual(result.recordedRows, [{ subject: "Zero", grade: 0 }]);
  assert.deepEqual(result.missingSubjects, ["Missing", "Invalid", "High"]);
});

test("renaming a subject preserves grades, targets, periods, and session history", () => {
  const student = {
    subjects: ["Algebra"],
    grades: { Algebra: 88 },
    previousGrades: { Algebra: 80 },
    targets: { Algebra: 90 },
    periodGrades: { Algebra: { "semester-1-prelim": 84 } },
    sessions: [{ id: "s1", subject: "Algebra", duration: 60 }],
  };
  const renamed = renameStudentSubject(student, "Algebra", "Advanced Algebra");
  assert.deepEqual(renamed.subjects, ["Advanced Algebra"]);
  assert.equal(renamed.grades["Advanced Algebra"], 88);
  assert.equal(renamed.previousGrades["Advanced Algebra"], 80);
  assert.equal(renamed.targets["Advanced Algebra"], 90);
  assert.equal(renamed.periodGrades["Advanced Algebra"]["semester-1-prelim"], 84);
  assert.equal(renamed.sessions[0].subject, "Advanced Algebra");
});

test("renaming a subject also preserves its saved study-focus plans", () => {
  const values = new Map([["studytrack:focus:student-1", JSON.stringify([
    { id: "f1", subject: "Algebra", topic: "Fractions", date: "2026-10-21" },
    { id: "f2", subject: "Writing", topic: "Essay", date: "2026-10-22" },
  ])]]);
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
  const student = {
    id: "student-1",
    subjects: ["Algebra"],
    grades: { Algebra: 88 },
    targets: { Algebra: 90 },
    periodGrades: { Algebra: { "semester-1-prelim": 84 } },
    sessions: [{ id: "s1", subject: "Algebra", duration: 60 }],
  };
  const renamed = renameStudentSubject(student, "Algebra", "Advanced Algebra");
  assert.equal(moveSavedFocusPlans(student.id, "Algebra", "Advanced Algebra"), true);
  assert.equal(renamed.grades["Advanced Algebra"], 88);
  assert.equal(renamed.targets["Advanced Algebra"], 90);
  assert.equal(renamed.periodGrades["Advanced Algebra"]["semester-1-prelim"], 84);
  assert.equal(renamed.sessions[0].subject, "Advanced Algebra");
  assert.deepEqual(JSON.parse(values.get("studytrack:focus:student-1")).map(({ subject }) => subject), [
    "Advanced Algebra",
    "Writing",
  ]);
});

test("deleting a subject removes only its saved study-focus plans after confirmation", () => {
  const values = new Map([["studytrack:focus:student-1", JSON.stringify([
    { id: "f1", subject: "Biology", topic: "Cells", date: "2026-10-21" },
    { id: "f2", subject: "Art", topic: "Sketching", date: "2026-10-22" },
  ])]]);
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
  const student = { id: "student-1", subjects: ["Biology", "Art"], grades: { Biology: 72 } };
  assert.equal(requiresSubjectDeletionConfirmation(student, "Biology", true), true);
  const deleted = deleteStudentSubject(student, "Biology");
  assert.equal(removeSavedFocusPlans(student.id, "Biology"), true);
  assert.deepEqual(deleted.subjects, ["Art"]);
  assert.deepEqual(JSON.parse(values.get("studytrack:focus:student-1")), [
    { id: "f2", subject: "Art", topic: "Sketching", date: "2026-10-22" },
  ]);
});

test("deleting a subject removes its records only after the caller chooses deletion", () => {
  const student = {
    subjects: ["Biology", "Art"],
    grades: { Biology: 0, Art: 91 },
    sessions: [{ subject: "Biology" }, { subject: "Art" }],
  };
  assert.equal(hasRecordedSubjectData(student, "Biology"), true);
  const deleted = deleteStudentSubject(student, "Biology");
  assert.deepEqual(deleted.subjects, ["Art"]);
  assert.deepEqual(deleted.grades, { Art: 91 });
  assert.deepEqual(deleted.sessions, [{ subject: "Art" }]);
});

test("recorded data and saved focus plans both require deletion confirmation", () => {
  const student = { subjects: ["Biology"], grades: { Biology: 0 }, sessions: [] };
  assert.equal(requiresSubjectDeletionConfirmation(student, "Biology"), true);
  assert.equal(requiresSubjectDeletionConfirmation({ subjects: ["Art"] }, "Art"), false);
  assert.equal(requiresSubjectDeletionConfirmation({ subjects: ["Art"] }, "Art", true), true);
});

test("subject names reject empty values and case-insensitive duplicates", () => {
  assert.equal(validateSubjectName(["Biology"], "   ").error, "Enter a subject name.");
  assert.ok(validateSubjectName(["Biology"], " biology ").error);
  assert.deepEqual(validateSubjectName(["Biology"], "  Advanced Biology  "), {
    name: "Advanced Biology",
    error: "",
  });
  assert.deepEqual(validateSubjectName(["Biology"], " biology ", "Biology"), {
    name: "biology",
    error: "",
  });
});

test("target restoration never derives a goal from grades and only accepts valid saved values", () => {
  const student = {
    subjects: ["Missing", "Malformed", "Out of range", "Saved", "Zero"],
    grades: { Missing: 91, Malformed: 82, "Out of range": 70, Saved: 88, Zero: 0 },
  };
  assert.deepEqual(restoreStudentTargets(student), {
    Missing: "",
    Malformed: "",
    "Out of range": "",
    Saved: "",
    Zero: "",
  });
  assert.deepEqual(restoreStudentTargets(student, {
    Malformed: "not-a-grade",
    "Out of range": 101,
    Saved: "88",
    Zero: 0,
  }), {
    Missing: "",
    Malformed: "",
    "Out of range": "",
    Saved: 88,
    Zero: 0,
  });
});

test("target validation accepts zero, rejects invalid values, and allows intentional clearing", () => {
  assert.equal(isValidTargetGrade(0), true);
  assert.equal(isValidTargetGrade("0"), true);
  assert.equal(isValidTargetGrade(""), false);
  assert.equal(isValidTargetGrade("NaN"), false);
  assert.equal(isValidTargetGrade(Infinity), false);
  assert.equal(isValidTargetGrade(-1), false);
  assert.equal(isValidTargetGrade(101), false);
  assert.deepEqual(setStudentTarget({ targets: { Algebra: 90 } }, "Algebra", ""), {
    targets: { Algebra: "" },
  });
  assert.deepEqual(setStudentTarget({ targets: {} }, "Art", "0").targets, { Art: 0 });
  assert.throws(() => setStudentTarget({ targets: {} }, "Art", "not-a-grade"), RangeError);
  assert.throws(() => setStudentTarget({ targets: {} }, "Art", 101), RangeError);
});

test("recommendations do not claim target progress when no valid target exists", () => {
  const noTargetProgress = getStudentSubjectProgress({
    subjects: ["Algebra"],
    grades: { Algebra: 88 },
    targets: { Algebra: "" },
    sessions: [],
  });
  assert.equal(noTargetProgress[0].status, "untracked");
  assert.equal(Number.isFinite(noTargetProgress[0].targetGrade), false);
  assert.equal(Number.isFinite(noTargetProgress[0].gap), false);
  assert.deepEqual(getTrackedTargetProgress(noTargetProgress), []);

  const invalidTargetProgress = getStudentSubjectProgress({
    subjects: ["Algebra"],
    grades: { Algebra: 88 },
    targets: { Algebra: 101 },
    sessions: [],
  });
  assert.equal(invalidTargetProgress[0].status, "untracked");
  assert.equal(Number.isFinite(invalidTargetProgress[0].targetGrade), false);
  assert.deepEqual(getTrackedTargetProgress(invalidTargetProgress), []);
});

test("a saved zero target is valid and participates in goal progress", () => {
  const restored = restoreStudentTargets({
    subjects: ["Algebra"],
    grades: { Algebra: 0 },
  }, { Algebra: 0 });
  assert.equal(restored.Algebra, 0);
  const progress = getStudentSubjectProgress({
    subjects: ["Algebra"],
    grades: { Algebra: 0 },
    targets: restored,
    sessions: [],
  });
  assert.equal(progress[0].targetGrade, 0);
  assert.equal(progress[0].status, "on-track");
});

test("recommendations explain actual target values and handle zero targets", () => {
  const below = buildRecommendations({
    subjects: ["Math"],
    grades: { Math: 72 },
    targets: { Math: 80 },
    sessions: [],
  }, new Date("2026-10-20T00:00:00"));
  const belowTarget = below.recommendations.find(({ id }) => id === "target-next-step");
  assert.match(belowTarget.reason, /Math.*72.*80.*8 points/);

  const metZero = buildRecommendations({
    subjects: ["Math"],
    grades: { Math: 0 },
    targets: { Math: 0 },
    sessions: [],
  }, new Date("2026-10-20T00:00:00"));
  const achieved = metZero.recommendations.find(({ id }) => id === "targets-met");
  assert.match(achieved.reason, /Math: recorded grade 0, target 0/);
});

test("recommendations describe missing period grades without implying poor performance", () => {
  const result = buildRecommendations({
    termStructure: "trimester",
    subjects: ["History"],
    grades: {},
    periodGrades: { History: { "trimester-1": "" } },
    sessions: [],
  }, new Date("2026-10-20T00:00:00"), "trimester-1");
  const missing = result.recommendations.find(({ id }) => id === "period-records-missing");
  assert.ok(missing);
  assert.match(missing.text, /No grade is recorded/);
  assert.doesNotMatch(missing.text, /fail|poor|low grade/i);
  assert.match(missing.reason, /does not indicate a low grade/);
});

test("students with no records receive an honest no-data recommendation", () => {
  const result = buildRecommendations({
    id: "empty",
    subjects: [],
    grades: {},
    sessions: [],
    weeklyHours: [],
  }, new Date("2026-10-20T00:00:00"));
  assert.equal(result.recommendations.length, 1);
  assert.equal(result.recommendations[0].id, "keep-going");
  assert.match(result.recommendations[0].reason, /no valid current grades or dated sessions/);
});

test("recommendations are isolated to the supplied student's grades and sessions", () => {
  const first = buildRecommendations({
    id: "first",
    subjects: ["Math"],
    grades: { Math: 70 },
    targets: { Math: 90 },
    sessions: [],
  }, new Date("2026-10-20T00:00:00"));
  const second = buildRecommendations({
    id: "second",
    subjects: ["Art"],
    grades: { Art: 95 },
    targets: { Art: 80 },
    sessions: [],
  }, new Date("2026-10-20T00:00:00"));
  assert.ok(first.recommendations.some(({ reason }) => reason.includes("Math")));
  assert.ok(first.recommendations.every(({ reason, text }) => !`${reason} ${text}`.includes("Art")));
  assert.ok(second.recommendations.some(({ reason }) => reason.includes("Art")));
  assert.ok(second.recommendations.every(({ reason, text }) => !`${reason} ${text}`.includes("Math")));
});

test("improvement recommendations require valid previous-grade evidence", () => {
  const result = buildRecommendations({
    subjects: ["Math"],
    grades: { Math: 90 },
    previousGrades: { Math: "missing" },
    targets: {},
    sessions: [],
  }, new Date("2026-10-20T00:00:00"));
  assert.equal(result.recommendations.some(({ id }) => id === "recorded-improvement"), false);
});

test("each data-driven recommendation provides specific evidence and IDs are unique", () => {
  const result = buildRecommendations({
    subjects: ["Math"],
    grades: { Math: 72 },
    targets: { Math: 80 },
    previousGrades: { Math: 68 },
    sessions: [
      { date: "2026-10-19", subject: "Math", duration: 40 },
      { date: "2026-10-20", subject: "Math", duration: 30 },
    ],
  }, new Date("2026-10-20T00:00:00"));
  assert.equal(new Set(result.recommendations.map(({ id }) => id)).size, result.recommendations.length);
  assert.ok(result.recommendations.every(({ reason }) => typeof reason === "string" && reason.length > 0));
  assert.ok(result.recommendations.some(({ reason }) => reason.includes("2 valid, dated sessions")));
});

test("changing an analytics period leaves the saved period records unchanged", () => {
  const student = {
    termStructure: "dualSemester",
    subjects: ["Math"],
    periodGrades: { Math: { "semester-1-prelim": 0, "semester-2-finals": 95 } },
  };
  const before = structuredClone(student.periodGrades);
  getPeriodGradeRows(student, "semester-1-prelim");
  getPeriodGradeRows(student, "semester-2-finals");
  assert.deepEqual(student.periodGrades, before);
});

test("term structures define explicit periods without converting saved values", () => {
  assert.equal(TERM_STRUCTURES.dualSemester.periods.length, 6);
  assert.equal(TERM_STRUCTURES.trimester.periods.length, 3);
  assert.ok(TERM_STRUCTURES.dualSemester.periods.some(({ id }) => id.endsWith("-prelim")));
  assert.ok(TERM_STRUCTURES.dualSemester.periods.some(({ id }) => id.endsWith("-midterm")));
  assert.ok(TERM_STRUCTURES.dualSemester.periods.some(({ id }) => id.endsWith("-finals")));
  assert.notEqual(TERM_STRUCTURES.trimester.periods[0].id, TERM_STRUCTURES.dualSemester.periods[0].id);
});

test("period grades edit independently and calendar changes leave historical periods intact", () => {
  const student = {
    termStructure: "dualSemester",
    periodGrades: {
      History: { "semester-1-prelim": 81, "semester-1-finals": 90 },
    },
  };
  const edited = setStudentPeriodGrade(student, "History", "semester-1-prelim", 85);
  const changedCalendar = setStudentTermStructure(edited, "trimester");
  assert.deepEqual(changedCalendar.periodGrades.History, {
    "semester-1-prelim": 85,
    "semester-1-finals": 90,
  });
  assert.equal(changedCalendar.termStructure, "trimester");
  assert.deepEqual(setStudentTermStructure(changedCalendar, "dualSemester").periodGrades, changedCalendar.periodGrades);
  assert.deepEqual(setStudentPeriodGrade(changedCalendar, "History", "semester-1-prelim", "").periodGrades.History, {
    "semester-1-finals": 90,
  });
  assert.throws(() => setStudentPeriodGrade(student, "History", "semester-1-prelim", 101), RangeError);
});

test("empty and malformed grades stay missing instead of becoming zero", () => {
  assert.equal(studentAverage({ grades: { A: "", B: null, C: "unknown" } }), null);
  assert.equal(studentAverage({ grades: { A: " " } }), null);
  const progress = getStudentSubjectProgress({
    subjects: ["New Subject"],
    grades: {},
    sessions: [],
  });
  assert.equal(progress[0].status, "untracked");
  assert.equal(Number.isNaN(progress[0].currentGrade), true);
});

test("settings persist separately for each student and tolerate malformed storage", () => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
  const first = {
    id: "one",
    subjects: ["Writing"],
    termStructure: "trimester",
    periodGrades: { Writing: { "trimester-2": 92 } },
    grades: { Writing: 88 },
    sessions: [{ id: "session-1", subject: "Writing", duration: 45 }],
  };
  const second = { id: "two", grades: {}, sessions: [] };
  assert.equal(saveStudentSettings(first), true);
  assert.deepEqual(loadStudentSettings(first).periodGrades, first.periodGrades);
  assert.equal(loadStudentSettings(first).termStructure, "trimester");
  assert.equal(loadStudentSettings(first).grades.Writing, 88);
  assert.equal(loadStudentSettings(first).sessions[0].duration, 45);
  assert.deepEqual(loadStudentSettings(second).subjects, []);
  assert.deepEqual(loadStudentSettings(second).grades, {});
  values.set("studytrack:subjects:broken", "{");
  values.set("studytrack:period-grades:broken", "{");
  assert.equal(loadStudentSettings({ id: "broken", grades: { Physics: 77 } }).termStructure, DEFAULT_TERM_STRUCTURE);
  assert.deepEqual(loadStudentSettings({ id: "broken", grades: { Physics: 77 } }).subjects, ["Physics"]);
});

test("focus-plan persistence reports storage failures for retry handling", () => {
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => { throw new Error("quota exceeded"); },
  };
  assert.equal(saveStudentFocusPlans("student-1", [{ subject: "Biology" }]), false);
  assert.equal(moveSavedFocusPlans("student-1", "Biology", "Life Science"), false);
});

test("onboarding progress is saved and completed separately per student", () => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
  assert.equal(saveStudentOnboardingStep("alpha", 2), true);
  assert.deepEqual(loadStudentOnboarding("alpha"), { complete: false, step: 2 });
  assert.deepEqual(loadStudentOnboarding("beta"), { complete: false, step: 0 });
  assert.equal(saveStudentOnboardingStep("alpha", 9), false);
  assert.equal(completeStudentOnboarding("alpha"), true);
  assert.deepEqual(loadStudentOnboarding("alpha"), { complete: true, step: 0 });
  assert.deepEqual(loadStudentOnboarding("beta"), { complete: false, step: 0 });
});
