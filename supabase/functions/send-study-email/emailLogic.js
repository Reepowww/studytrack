const hasOnlyKeys = (value, allowedKeys) =>
  Object.keys(value).every((key) => allowedKeys.includes(key));

const cleanString = (value, maximumLength) =>
  typeof value === "string"
  && value.trim().length > 0
  && value.trim().length <= maximumLength
  && !/[\u0000-\u001f\u007f]/.test(value)
    ? value.trim()
    : null;

const isGrade = (value) => typeof value === "number"
  && Number.isFinite(value)
  && value >= 0
  && value <= 100;

const isValidDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const gradeValue = (value) => {
  if ((typeof value !== "number" && typeof value !== "string") || !String(value).trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 100 ? number : null;
};

export const validateEmailRequest = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  if (value.type === "get_preferences" && hasOnlyKeys(value, ["type"])) {
    return { type: "get_preferences" };
  }

  if (value.type === "set_preferences"
    && hasOnlyKeys(value, ["type", "remindersEnabled"])
    && typeof value.remindersEnabled === "boolean") {
    return { type: "set_preferences", remindersEnabled: value.remindersEnabled };
  }

  if (value.type === "test" && hasOnlyKeys(value, ["type"])) {
    return { type: "test" };
  }

  if (["weak_subject", "ten_day", "study_checkin"].includes(value.type)
    && hasOnlyKeys(value, ["type"])) {
    return { type: value.type };
  }

  if (value.type === "focus"
    && hasOnlyKeys(value, ["type", "subject", "topic", "date"])) {
    const subject = cleanString(value.subject, 100);
    const topic = cleanString(value.topic, 2_000);
    if (!subject || !topic || !isValidDate(value.date)) return null;
    return { type: "focus", subject, topic, date: value.date };
  }

  return null;
};

export const requiresReminderOptIn = (type) =>
  ["weak_subject", "ten_day", "study_checkin", "focus"].includes(type);

export const normalizeAcademicRows = (rows) => (Array.isArray(rows) ? rows : [])
  .flatMap((row) => {
    const relation = Array.isArray(row?.subjects) ? row.subjects[0] : row?.subjects;
    const subject = cleanString(relation?.name, 100);
    const grade = gradeValue(row?.grade);
    if (!subject || grade === null) return [];

    const previousGrade = gradeValue(row.previous_grade);
    const targetGrade = gradeValue(row.target_grade);
    return [{
      subject,
      grade,
      ...(previousGrade === null ? {} : { previousGrade }),
      ...(targetGrade === null ? {} : { targetGrade }),
    }];
  })
  .sort((a, b) => a.grade - b.grade || a.subject.localeCompare(b.subject));

const gradeDetails = (entry) => [
  `Current recorded grade: ${entry.grade}`,
  ...(entry.previousGrade === undefined ? [] : [`Previous recorded grade: ${entry.previousGrade}`]),
  ...(entry.targetGrade === undefined ? [] : [`Saved target grade: ${entry.targetGrade}`]),
];

export const createAcademicEmail = (type, records) => {
  if (!records.length) return null;

  if (type === "weak_subject") {
    const weakest = records[0];
    return {
      subject: `A gentle study check-in: ${weakest.subject}`,
      sections: [{
        heading: `A subject to revisit: ${weakest.subject}`,
        lines: [
          ...gradeDetails(weakest),
          `Consider a short, focused review of ${weakest.subject}, such as revisiting one topic and trying a practice question.`,
        ],
      }],
    };
  }

  if (type === "study_checkin") {
    const belowTarget = records.filter((entry) => (
      entry.targetGrade !== undefined && entry.grade < entry.targetGrade
    ));
    const selected = belowTarget.length ? belowTarget.slice(0, 3) : records.slice(0, 1);
    return {
      subject: "A personalized StudyTrack check-in",
      sections: [{
        heading: belowTarget.length ? "A supportive study check-in" : "Keep building your study plan",
        lines: selected.flatMap((entry) => [
          ...gradeDetails(entry),
          `Consider a manageable review session for ${entry.subject} and one small next step toward your academic goals.`,
        ]),
      }],
    };
  }

  if (type === "ten_day") {
    return {
      subject: "Your 10-day StudyTrack check-in",
      sections: [{
        heading: "A gentle check-in on your study goals",
        lines: [
          "Here are subjects with the lowest current grades among your recorded results. This is a relative study cue, not a judgment.",
          ...records.slice(0, 3).flatMap((entry) => [
            `${entry.subject} - ${gradeDetails(entry).join("; ")}`,
            `Try a focused review of ${entry.subject}, then choose one small next step for your next study session.`,
          ]),
        ],
      }],
    };
  }

  return null;
};

export const parseAllowedOrigins = (value) => {
  if (typeof value !== "string" || !value.trim()) return [];
  return [...new Set(value.split(",").map((origin) => origin.trim()).filter((origin) => {
    try {
      const parsed = new URL(origin);
      return (parsed.protocol === "https:" || parsed.protocol === "http:")
        && parsed.origin === origin
        && (parsed.protocol === "https:" || ["localhost", "127.0.0.1"].includes(parsed.hostname));
    } catch {
      return false;
    }
  }))];
};
