export const TERM_STRUCTURES = {
  dualSemester: {
    label: "2 semesters · Prelim, Midterm, Finals",
    terms: [
      { id: "semester-1", label: "Semester 1" },
      { id: "semester-2", label: "Semester 2" },
    ],
    periods: [
      { id: "semester-1-prelim", termId: "semester-1", name: "Prelim", label: "Semester 1 · Prelim" },
      { id: "semester-1-midterm", termId: "semester-1", name: "Midterm", label: "Semester 1 · Midterm" },
      { id: "semester-1-finals", termId: "semester-1", name: "Finals", label: "Semester 1 · Finals" },
      { id: "semester-2-prelim", termId: "semester-2", name: "Prelim", label: "Semester 2 · Prelim" },
      { id: "semester-2-midterm", termId: "semester-2", name: "Midterm", label: "Semester 2 · Midterm" },
      { id: "semester-2-finals", termId: "semester-2", name: "Finals", label: "Semester 2 · Finals" },
    ],
  },
  dualSemesterMidFinal: {
    label: "2 semesters · Midterm, Finals",
    terms: [
      { id: "semester-1", label: "Semester 1" },
      { id: "semester-2", label: "Semester 2" },
    ],
    periods: [
      { id: "semester-1-midterm", termId: "semester-1", name: "Midterm", label: "Semester 1 · Midterm" },
      { id: "semester-1-finals", termId: "semester-1", name: "Finals", label: "Semester 1 · Finals" },
      { id: "semester-2-midterm", termId: "semester-2", name: "Midterm", label: "Semester 2 · Midterm" },
      { id: "semester-2-finals", termId: "semester-2", name: "Finals", label: "Semester 2 · Finals" },
    ],
  },
  trimesterThreePeriods: {
    label: "3 terms · Prelim, Midterm, Finals",
    terms: [
      { id: "trimester-1", label: "Term 1" },
      { id: "trimester-2", label: "Term 2" },
      { id: "trimester-3", label: "Term 3" },
    ],
    periods: [
      { id: "trimester-1-prelim", termId: "trimester-1", name: "Prelim", label: "Term 1 · Prelim" },
      { id: "trimester-1-midterm", termId: "trimester-1", name: "Midterm", label: "Term 1 · Midterm" },
      { id: "trimester-1-finals", termId: "trimester-1", name: "Finals", label: "Term 1 · Finals" },
      { id: "trimester-2-prelim", termId: "trimester-2", name: "Prelim", label: "Term 2 · Prelim" },
      { id: "trimester-2-midterm", termId: "trimester-2", name: "Midterm", label: "Term 2 · Midterm" },
      { id: "trimester-2-finals", termId: "trimester-2", name: "Finals", label: "Term 2 · Finals" },
      { id: "trimester-3-prelim", termId: "trimester-3", name: "Prelim", label: "Term 3 · Prelim" },
      { id: "trimester-3-midterm", termId: "trimester-3", name: "Midterm", label: "Term 3 · Midterm" },
      { id: "trimester-3-finals", termId: "trimester-3", name: "Finals", label: "Term 3 · Finals" },
    ],
  },
  trimesterMidFinal: {
    label: "3 terms · Midterm, Finals",
    terms: [
      { id: "trimester-1", label: "Term 1" },
      { id: "trimester-2", label: "Term 2" },
      { id: "trimester-3", label: "Term 3" },
    ],
    periods: [
      { id: "trimester-1-midterm", termId: "trimester-1", name: "Midterm", label: "Term 1 · Midterm" },
      { id: "trimester-1-finals", termId: "trimester-1", name: "Finals", label: "Term 1 · Finals" },
      { id: "trimester-2-midterm", termId: "trimester-2", name: "Midterm", label: "Term 2 · Midterm" },
      { id: "trimester-2-finals", termId: "trimester-2", name: "Finals", label: "Term 2 · Finals" },
      { id: "trimester-3-midterm", termId: "trimester-3", name: "Midterm", label: "Term 3 · Midterm" },
      { id: "trimester-3-finals", termId: "trimester-3", name: "Finals", label: "Term 3 · Finals" },
    ],
  },
  trimester: {
    label: "Legacy · one grade per trimester",
    terms: [
      { id: "trimester-1", label: "Term 1" },
      { id: "trimester-2", label: "Term 2" },
      { id: "trimester-3", label: "Term 3" },
    ],
    periods: [
      { id: "trimester-1", termId: "trimester-1", name: "Term grade", label: "Trimester 1" },
      { id: "trimester-2", termId: "trimester-2", name: "Term grade", label: "Trimester 2" },
      { id: "trimester-3", termId: "trimester-3", name: "Term grade", label: "Trimester 3" },
    ],
  },
};

export const DEFAULT_TERM_STRUCTURE = "dualSemester";

export const isRecordedGrade = (value) =>
  (typeof value === "number" && Number.isFinite(value))
  || (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)));

export const isValidTargetGrade = (value) =>
  isRecordedGrade(value) && Number(value) >= 0 && Number(value) <= 100;

export const restoreStudentTargets = (student, savedTargets = {}) => {
  const targets = savedTargets && typeof savedTargets === "object" && !Array.isArray(savedTargets)
    ? savedTargets
    : {};
  return Object.fromEntries(getStudentSubjects(student).map((subject) => [
    subject,
    isValidTargetGrade(targets[subject]) ? Number(targets[subject]) : "",
  ]));
};

export const setStudentTarget = (student, subject, value) => {
  const cleared = value === "";
  if (!cleared && !isValidTargetGrade(value)) {
    throw new RangeError("Targets must be between 0 and 100, or empty to clear the optional target.");
  }
  return {
    ...student,
    targets: {
      ...(student.targets || {}),
      [subject]: cleared ? "" : Number(value),
    },
  };
};

export const validateSubjectName = (subjects, candidate, currentName = null) => {
  const name = typeof candidate === "string" ? candidate.trim() : "";
  if (!name) return { name, error: "Enter a subject name." };
  if ((Array.isArray(subjects) ? subjects : []).some((subject) =>
    typeof subject === "string"
      && subject !== currentName
      && subject.trim().toLocaleLowerCase() === name.toLocaleLowerCase())) {
    return { name, error: "That subject already exists. Names are matched without regard to capitalization or surrounding spaces." };
  }
  return { name, error: "" };
};

export const loadStudentOnboarding = (studentId) => {
  try {
    const rawStep = Number(localStorage.getItem(`studytrack:onboarding:step:${studentId}`));
    return {
      complete: localStorage.getItem(`studytrack:onboarding:complete:${studentId}`) === "true",
      step: Number.isInteger(rawStep) && rawStep >= 0 && rawStep <= 3 ? rawStep : 0,
    };
  } catch {
    return { complete: false, step: 0 };
  }
};

export const saveStudentOnboardingStep = (studentId, step) => {
  if (!Number.isInteger(step) || step < 0 || step > 3) return false;
  try {
    localStorage.setItem(`studytrack:onboarding:step:${studentId}`, String(step));
  } catch {
    return false;
  }
  return true;
};

export const completeStudentOnboarding = (studentId) => {
  try {
    localStorage.setItem(`studytrack:onboarding:complete:${studentId}`, "true");
    localStorage.removeItem(`studytrack:onboarding:step:${studentId}`);
  } catch {
    return false;
  }
  return true;
};

const uniqueNames = (values) => {
  if (!Array.isArray(values)) return [];
  const names = [];
  const seen = new Set();
  values.forEach((value) => {
    if (typeof value !== "string") return;
    const name = value.trim();
    const key = name.toLocaleLowerCase();
    if (name && !seen.has(key)) {
      seen.add(key);
      names.push(name);
    }
  });
  return names;
};

export const getStudentSubjects = (student = {}) => {
  const grades = student.grades && typeof student.grades === "object" ? Object.keys(student.grades) : [];
  const sessions = Array.isArray(student.sessions) ? student.sessions.map((session) => session?.subject) : [];
  const targets = student.targets && typeof student.targets === "object" ? Object.keys(student.targets) : [];
  const periodGrades = student.periodGrades && typeof student.periodGrades === "object"
    ? Object.keys(student.periodGrades)
    : [];
  return uniqueNames(Array.isArray(student.subjects)
    ? student.subjects
    : [...grades, ...sessions, ...targets, ...periodGrades]);
};

export const loadStudentSettings = (student) => {
  const id = student?.id;
  const legacySubjects = getStudentSubjects(student);
  if (id === undefined || id === null) {
    return { ...student, subjects: legacySubjects, termStructure: DEFAULT_TERM_STRUCTURE, periodGrades: {} };
  }
  const readJson = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch {
      return null;
    }
  };
  const readString = (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const savedRecords = readJson(`studytrack:records:${id}`);
  const savedSubjects = readJson(`studytrack:subjects:${id}`);
  const savedTerm = readString(`studytrack:term:${id}`);
  const savedPeriods = readJson(`studytrack:period-grades:${id}`);
  const savedGradeSettings = readJson(`studytrack:grade-settings:${id}`);
  const validTerm = Object.hasOwn(TERM_STRUCTURES, savedTerm) ? savedTerm : DEFAULT_TERM_STRUCTURE;
  const records = savedRecords && typeof savedRecords === "object" && !Array.isArray(savedRecords)
    ? {
      ...(savedRecords.grades && typeof savedRecords.grades === "object" && !Array.isArray(savedRecords.grades)
        ? { grades: savedRecords.grades } : {}),
      ...(savedRecords.previousGrades && typeof savedRecords.previousGrades === "object" && !Array.isArray(savedRecords.previousGrades)
        ? { previousGrades: savedRecords.previousGrades } : {}),
      ...(Array.isArray(savedRecords.sessions) ? { sessions: savedRecords.sessions } : {}),
      ...(Array.isArray(savedRecords.weeklyHours) ? { weeklyHours: savedRecords.weeklyHours } : {}),
      ...(isRecordedGrade(savedRecords.studyFrequency) ? { studyFrequency: Number(savedRecords.studyFrequency) } : {}),
      ...(isRecordedGrade(savedRecords.focusLevel) ? { focusLevel: Number(savedRecords.focusLevel) } : {}),
      ...(typeof savedRecords.preferredMethod === "string" ? { preferredMethod: savedRecords.preferredMethod } : {}),
    }
    : {};
  const loaded = {
    ...student,
    ...records,
    ...(savedGradeSettings && typeof savedGradeSettings === "object" && !Array.isArray(savedGradeSettings)
      ? { gradeSettings: savedGradeSettings }
      : {}),
  };
  return {
    ...loaded,
    subjects: Array.isArray(savedSubjects) ? uniqueNames(savedSubjects) : getStudentSubjects(loaded),
    termStructure: validTerm,
    periodGrades: savedPeriods && typeof savedPeriods === "object" && !Array.isArray(savedPeriods)
      ? savedPeriods
      : {},
  };
};

export const saveStudentSettings = (student) => {
  try {
    localStorage.setItem(`studytrack:records:${student.id}`, JSON.stringify({
      grades: student.grades || {},
      previousGrades: student.previousGrades || {},
      sessions: Array.isArray(student.sessions) ? student.sessions : [],
      weeklyHours: Array.isArray(student.weeklyHours) ? student.weeklyHours : [],
      studyFrequency: student.studyFrequency ?? null,
      focusLevel: student.focusLevel ?? null,
      preferredMethod: student.preferredMethod ?? "",
    }));
    localStorage.setItem(`studytrack:subjects:${student.id}`, JSON.stringify(getStudentSubjects(student)));
    const termStructure = Object.hasOwn(TERM_STRUCTURES, student.termStructure)
      ? student.termStructure
      : DEFAULT_TERM_STRUCTURE;
    localStorage.setItem(`studytrack:term:${student.id}`, termStructure);
    localStorage.setItem(`studytrack:period-grades:${student.id}`, JSON.stringify(student.periodGrades || {}));
    localStorage.setItem(`studytrack:grade-settings:${student.id}`, JSON.stringify(student.gradeSettings || {}));
  } catch {
    return false;
  }
  return true;
};

export const hasRecordedSubjectData = (student, subject) => {
  const hasNumericValue = (record) => {
    if (!Object.hasOwn(record && typeof record === "object" ? record : {}, subject)) return false;
    return isRecordedGrade(record[subject]);
  };
  const periodValues = student?.periodGrades?.[subject];
  return hasNumericValue(student?.grades)
    || hasNumericValue(student?.previousGrades)
    || hasNumericValue(student?.targets)
    || (periodValues && typeof periodValues === "object"
      && Object.values(periodValues).some((value) => value !== null && value !== undefined
        && isRecordedGrade(value)))
    || (Array.isArray(student?.sessions) && student.sessions.some((session) => session?.subject === subject));
};

export const requiresSubjectDeletionConfirmation = (student, subject, hasFocusPlan = false) =>
  hasRecordedSubjectData(student, subject) || hasFocusPlan;

const renameSubjectGradeSettings = (settings, oldName, newName) => {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return settings || {};
  const next = { ...settings };
  for (const key of ["weights", "units"]) {
    if (next[key] && typeof next[key] === "object" && !Array.isArray(next[key])) {
      next[key] = { ...next[key] };
      if (Object.hasOwn(next[key], oldName)) {
        if (!Object.hasOwn(next[key], newName)) next[key][newName] = next[key][oldName];
        delete next[key][oldName];
      }
    }
  }
  return next;
};

const removeSubjectGradeSettings = (settings, subject) => {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return settings || {};
  const next = { ...settings };
  for (const key of ["weights", "units"]) {
    if (next[key] && typeof next[key] === "object" && !Array.isArray(next[key])) {
      next[key] = { ...next[key] };
      delete next[key][subject];
    }
  }
  return next;
};

export const renameStudentSubject = (student, oldName, newName) => {
  const renameKey = (record) => {
    if (!record || typeof record !== "object" || Array.isArray(record)) return record || {};
    const next = { ...record };
    if (Object.hasOwn(next, oldName)) {
      if (!Object.hasOwn(next, newName)) next[newName] = next[oldName];
      delete next[oldName];
    }
    return next;
  };
  return {
    ...student,
    subjects: getStudentSubjects(student).map((subject) => subject === oldName ? newName : subject),
    grades: renameKey(student.grades),
    previousGrades: renameKey(student.previousGrades),
    targets: renameKey(student.targets),
    periodGrades: renameKey(student.periodGrades),
    gradeSettings: renameSubjectGradeSettings(student.gradeSettings, oldName, newName),
    sessions: (Array.isArray(student.sessions) ? student.sessions : []).map((session) =>
      session?.subject === oldName ? { ...session, subject: newName } : session),
  };
};

export const deleteStudentSubject = (student, subject) => {
  const removeKey = (record) => {
    if (!record || typeof record !== "object" || Array.isArray(record)) return record || {};
    const next = { ...record };
    delete next[subject];
    return next;
  };
  return {
    ...student,
    subjects: getStudentSubjects(student).filter((name) => name !== subject),
    grades: removeKey(student.grades),
    previousGrades: removeKey(student.previousGrades),
    targets: removeKey(student.targets),
    periodGrades: removeKey(student.periodGrades),
    gradeSettings: removeSubjectGradeSettings(student.gradeSettings, subject),
    sessions: (Array.isArray(student.sessions) ? student.sessions : [])
      .filter((session) => session?.subject !== subject),
  };
};

export const setStudentPeriodGrade = (student, subject, period, value) => {
  const empty = value === "" || value === null || value === undefined
    || (typeof value === "string" && value.trim() === "");
  if (!empty) {
    const grade = Number(value);
    if (!Number.isFinite(grade) || grade < 0 || grade > 100) {
      throw new RangeError("Period grades must be between 0 and 100.");
    }
  }
  const nextPeriods = { ...(student.periodGrades?.[subject] || {}) };
  if (empty) delete nextPeriods[period];
  else nextPeriods[period] = Number(value);
  const periodGrades = { ...(student.periodGrades || {}) };
  if (Object.keys(nextPeriods).length) periodGrades[subject] = nextPeriods;
  else delete periodGrades[subject];
  return { ...student, periodGrades };
};

export const setStudentTermStructure = (student, termStructure) => {
  if (!Object.hasOwn(TERM_STRUCTURES, termStructure)) {
    throw new RangeError("Choose a supported academic calendar.");
  }
  return { ...student, termStructure };
};

export const saveStudentFocusPlans = (studentId, plans) => {
  try {
    localStorage.setItem(`studytrack:focus:${studentId}`, JSON.stringify(Array.isArray(plans) ? plans : []));
  } catch {
    return false;
  }
  return true;
};

export const moveSavedFocusPlans = (studentId, oldName, newName) => {
  try {
    const key = `studytrack:focus:${studentId}`;
    const saved = JSON.parse(localStorage.getItem(key) || "null");
    const plans = Array.isArray(saved) ? saved : saved ? [saved] : [];
    const renamed = plans.map((plan) => plan?.subject === oldName ? { ...plan, subject: newName } : plan);
    return saveStudentFocusPlans(studentId, renamed);
  } catch {
    return false;
  }
};

export const removeSavedFocusPlans = (studentId, subject) => {
  try {
    const key = `studytrack:focus:${studentId}`;
    const saved = JSON.parse(localStorage.getItem(key) || "null");
    const plans = Array.isArray(saved) ? saved : saved ? [saved] : [];
    return saveStudentFocusPlans(studentId, plans.filter((plan) => plan?.subject !== subject));
  } catch {
    return false;
  }
};
