import {
  avg,
  getStudentSubjectProgress,
  getStudyStreak,
  parseSessionDate,
} from "./students.js";
import {
  getStudentSubjects,
  isRecordedGrade,
  isValidTargetGrade,
  TERM_STRUCTURES,
} from "./studentData.js";

export const isValidAcademicGrade = (value) =>
  isRecordedGrade(value) && Number(value) >= 0 && Number(value) <= 100;

export const getPeriodGradeRows = (student = {}, periodId) => {
  const structure = TERM_STRUCTURES[student.termStructure];
  const period = structure?.periods.find(({ id }) => id === periodId) || null;
  if (!period) return { period: null, rows: [], recordedRows: [], missingSubjects: [] };

  const periodGrades = student.periodGrades && typeof student.periodGrades === "object"
    ? student.periodGrades
    : {};
  const rows = getStudentSubjects(student).map((subject) => {
    const value = periodGrades[subject]?.[period.id];
    return {
      subject,
      grade: isValidAcademicGrade(value) ? Number(value) : null,
    };
  });
  return {
    period,
    rows,
    recordedRows: rows.filter(({ grade }) => grade !== null),
    missingSubjects: rows.filter(({ grade }) => grade === null).map(({ subject }) => subject),
  };
};

const toScoreMap = (scores) => Object.fromEntries(
  Object.entries(scores && typeof scores === "object" && !Array.isArray(scores) ? scores : {})
    .filter(([, value]) => isValidAcademicGrade(value))
    .map(([subject, value]) => [subject, Number(value)]),
);

const daysBetween = (later, earlier) => {
  const laterUtc = Date.UTC(later.getFullYear(), later.getMonth(), later.getDate());
  const earlierUtc = Date.UTC(earlier.getFullYear(), earlier.getMonth(), earlier.getDate());
  return Math.floor((laterUtc - earlierUtc) / (24 * 60 * 60 * 1000));
};

const shortDate = (date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const buildRecommendations = (student = {}, now = new Date(), selectedPeriodId = "") => {
  const source = student && typeof student === "object" ? student : {};
  const sourceTargets = source.targets && typeof source.targets === "object" && !Array.isArray(source.targets)
    ? source.targets
    : {};
  const records = {
    ...source,
    grades: toScoreMap(source.grades),
    previousGrades: toScoreMap(source.previousGrades),
    subjects: getStudentSubjects(source),
    targets: Object.fromEntries(Object.entries(sourceTargets)
      .filter(([, value]) => isValidTargetGrade(value))
      .map(([subject, value]) => [subject, Number(value)])),
    sessions: (Array.isArray(source.sessions) ? source.sessions : [])
      .map((session) => ({ session, date: parseSessionDate(session?.date, now) }))
      .filter(({ session, date }) => session
        && typeof session.subject === "string"
        && session.subject.trim()
        && date
        && daysBetween(now, date) >= 0),
    weeklyHours: (Array.isArray(source.weeklyHours) ? source.weeklyHours : [])
      .filter((hours) => hours !== null && hours !== ""
        && Number.isFinite(Number(hours)) && Number(hours) >= 0)
      .map(Number),
  };
  const recommendations = [];
  const sessions = records.sessions;
  const recentSessions = sessions.filter(({ date }) => daysBetween(now, date) <= 7);
  const progress = getStudentSubjectProgress({
    ...records,
    sessions: sessions.map(({ session }) => session),
  }, now);
  const targetProgress = progress.filter(({ currentGrade, targetGrade }) =>
    Number.isFinite(currentGrade) && Number.isFinite(targetGrade));
  const periodResult = getPeriodGradeRows(source, selectedPeriodId);

  if (sessions.length) {
    if (recentSessions.length) {
      const subjects = [...new Set(recentSessions.map(({ session }) => session.subject))];
      recommendations.push({
        id: "recent-sessions",
        icon: "✓",
        tone: "encouragement",
        title: "Your recent effort counts",
        text: `You logged ${recentSessions.length} ${recentSessions.length === 1 ? "study session" : "study sessions"} in the last 7 days${subjects.length ? `, including ${subjects.join(", ")}` : ""}. Keep choosing a manageable next step.`,
        reason: `Evidence: ${recentSessions.length} valid, dated session${recentSessions.length === 1 ? "" : "s"} from ${shortDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6))} through ${shortDate(now)}.`,
        action: "Review Study Habits",
        page: "habits",
      });
    } else {
      const latest = sessions.reduce((mostRecent, item) => item.date > mostRecent.date ? item : mostRecent);
      const daysSince = daysBetween(now, latest.date);
      if (daysSince > 7) {
        recommendations.push({
          id: "recent-sessions",
          icon: "☀",
          tone: "next-step",
          title: "A small session can restart your rhythm",
          text: "If it fits your schedule, try one short study session. You can build from there at your own pace.",
          reason: `Evidence: no valid dated session in the last 7 days; the latest recorded session was ${shortDate(latest.date)} (${daysSince} days ago).`,
          action: "Log a Study Session",
          page: "habits",
        });
      }
    }
  }

  const streak = getStudyStreak(sessions.map(({ session }) => session), now);
  if (streak > 1) {
    recommendations.push({
      id: "streak",
      icon: "✦",
      tone: "achievement",
      title: "A consistency win",
      text: `Your dated session records show a ${streak}-day streak. That consistency is worth recognizing.`,
      reason: `Evidence: valid session dates appear on ${streak} consecutive calendar days.`,
      action: "View Study Habits",
      page: "habits",
    });
  }

  const metTargets = targetProgress.filter(({ currentGrade, targetGrade }) => currentGrade >= targetGrade);
  if (metTargets.length) {
    const evidence = metTargets.map(({ subject, currentGrade, targetGrade }) =>
      `${subject}: recorded grade ${currentGrade}, target ${targetGrade}`).join("; ");
    recommendations.push({
      id: "targets-met",
      icon: "★",
      tone: "achievement",
      title: "A goal worth recognizing",
      text: `Your recorded grade meets or exceeds the saved target in ${metTargets.map(({ subject }) => subject).join(", ")}.`,
      reason: `Evidence: ${evidence}.`,
      action: "Review Your Goals",
      page: "performance",
    });
  }

  const belowTargets = targetProgress
    .filter(({ gap }) => Number.isFinite(gap) && gap > 0)
    .sort((a, b) => b.gap - a.gap);
  if (belowTargets.length) {
    const focus = belowTargets[0];
    recommendations.push({
      id: "target-next-step",
      icon: "◎",
      tone: "next-step",
      title: "One achievable next step",
      text: `If helpful, choose one topic in ${focus.subject} to review in a short session. A target is a guide, not a measure of your ability.`,
      reason: `Evidence: ${focus.subject} has a recorded grade of ${focus.currentGrade} and a saved target of ${focus.targetGrade}, a difference of ${focus.gap} points.`,
      action: "Review Subject Goals",
      page: "performance",
    });
  }

  const improvedSubjects = Object.entries(records.grades)
    .filter(([subject, grade]) => Number.isFinite(records.previousGrades[subject])
      && grade > records.previousGrades[subject])
    .map(([subject, grade]) => ({
      subject,
      currentGrade: grade,
      previousGrade: records.previousGrades[subject],
      change: grade - records.previousGrades[subject],
    }));
  if (improvedSubjects.length) {
    const focus = improvedSubjects[0];
    recommendations.push({
      id: "recorded-improvement",
      icon: "↗",
      tone: "achievement",
      title: "A positive change in your records",
      text: `Your recorded ${focus.subject} grade is higher than its previous saved value. Notice what feels useful in your study routine.`,
      reason: `Evidence: ${focus.subject} changed from ${focus.previousGrade} to ${focus.currentGrade} (+${focus.change} points) in the saved current/previous grade records.`,
      action: "Review Your Grades",
      page: "performance",
    });
  }

  if (periodResult.period && periodResult.missingSubjects.length) {
    recommendations.push({
      id: "period-records-missing",
      icon: "○",
      tone: "next-step",
      title: "Period grades can be filled in when available",
      text: `No grade is recorded for ${periodResult.period.label} in ${periodResult.missingSubjects.join(", ")}. If this period applies to you and the grades are available, you can add them.`,
      reason: `Evidence: the selected ${periodResult.period.label} period has no valid saved grade for ${periodResult.missingSubjects.join(", ")}. This does not indicate a low grade.`,
      action: "Review Academic Performance",
      page: "performance",
    });
  }

  if (!recommendations.length) {
    const hasAnyRecords = Object.keys(records.grades).length > 0
      || sessions.length > 0
      || (Array.isArray(source.weeklyHours) && source.weeklyHours.some((value) =>
        value !== "" && value !== null && Number.isFinite(Number(value)) && Number(value) >= 0));
    recommendations.push({
      id: "keep-going",
      icon: "✦",
      tone: "encouragement",
      title: hasAnyRecords ? "Keep going at your own pace" : "A fresh start, at your pace",
      text: hasAnyRecords
        ? "Your saved records do not show a specific next step right now. You can review your subjects or log another session whenever it suits you."
        : "There are no valid grades or dated study sessions to use for a personalized suggestion yet. Add a record whenever you are ready.",
      reason: hasAnyRecords
        ? "Evidence: the available valid records do not meet another recommendation rule."
        : "Evidence: no valid current grades or dated sessions are saved for this student.",
      action: hasAnyRecords ? "Review Study Habits" : "Add a Study Record",
      page: hasAnyRecords ? "habits" : "performance",
    });
  }

  return { recommendations, records, period: periodResult.period };
};
