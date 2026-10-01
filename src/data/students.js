// Centralized mock data. Swap this file for API calls later.

export const subjects = ["Mathematics", "Programming", "Data Science", "English", "Science"];

export const methods = [
  "Practice Problems",
  "Reading",
  "Flashcards",
  "Note-taking",
  "Group Study",
  "Video Lessons",
  "Coding Practice",
];

export const students = [
  {
    id: 1,
    name: "Andrey Bael",
    email: "andrey.bael@studytrack.com",
    password: "andrey123",
    weeklyHours: [11, 13, 10, 14, 16, 14, 17],
    studyFrequency: 5,
    preferredMethod: "Practice Problems",
    focusLevel: 4.2,
    grades: { Mathematics: 88, Programming: 91, "Data Science": 84, English: 82, Science: 80 },
    previousGrades: { Mathematics: 83, Programming: 86, "Data Science": 79, English: 80, Science: 77 },
    sessions: [
      { date: "Oct 14", subject: "Mathematics", duration: 90, method: "Practice Problems", focus: 5 },
      { date: "Oct 13", subject: "Programming", duration: 110, method: "Coding Practice", focus: 4 },
      { date: "Oct 11", subject: "Data Science", duration: 75, method: "Note-taking", focus: 4 },
      { date: "Oct 10", subject: "English", duration: 50, method: "Reading", focus: 4 },
      { date: "Oct 8", subject: "Science", duration: 60, method: "Practice Problems", focus: 4 },
    ],
  },
  {
    id: 2,
    name: "Bill Gedrick Griar",
    email: "bill.griar@studytrack.com",
    password: "bill123",
    weeklyHours: [7, 6, 8, 7, 9, 8, 10],
    studyFrequency: 4,
    preferredMethod: "Video Lessons",
    focusLevel: 3.4,
    grades: { Mathematics: 76, Programming: 79, "Data Science": 73, English: 81, Science: 74 },
    previousGrades: { Mathematics: 74, Programming: 77, "Data Science": 70, English: 79, Science: 72 },
    sessions: [
      { date: "Oct 14", subject: "English", duration: 55, method: "Reading", focus: 3 },
      { date: "Oct 12", subject: "Programming", duration: 70, method: "Video Lessons", focus: 4 },
      { date: "Oct 10", subject: "Science", duration: 50, method: "Video Lessons", focus: 3 },
      { date: "Oct 8", subject: "Mathematics", duration: 45, method: "Practice Problems", focus: 3 },
    ],
  },
  {
    id: 3,
    name: "Cyrus Magbanua",
    email: "cyrus.magbanua@studytrack.com",
    password: "cyrus123",
    weeklyHours: [17, 19, 18, 21, 20, 19, 22],
    studyFrequency: 6,
    preferredMethod: "Coding Practice",
    focusLevel: 4.7,
    grades: { Mathematics: 93, Programming: 96, "Data Science": 92, English: 87, Science: 90 },
    previousGrades: { Mathematics: 89, Programming: 91, "Data Science": 88, English: 85, Science: 86 },
    sessions: [
      { date: "Oct 14", subject: "Programming", duration: 150, method: "Coding Practice", focus: 5 },
      { date: "Oct 13", subject: "Data Science", duration: 100, method: "Note-taking", focus: 5 },
      { date: "Oct 12", subject: "Mathematics", duration: 90, method: "Practice Problems", focus: 5 },
      { date: "Oct 11", subject: "Science", duration: 80, method: "Coding Practice", focus: 4 },
      { date: "Oct 10", subject: "English", duration: 60, method: "Reading", focus: 4 },
    ],
  },
  {
    id: 4,
    name: "Justin Laxa",
    email: "justin.laxa@studytrack.com",
    password: "justin123",
    weeklyHours: [5, 6, 5, 7, 6, 5, 7],
    studyFrequency: 3,
    preferredMethod: "Reading",
    focusLevel: 2.8,
    grades: { Mathematics: 68, Programming: 72, "Data Science": 65, English: 75, Science: 70 },
    previousGrades: { Mathematics: 70, Programming: 73, "Data Science": 67, English: 74, Science: 71 },
    sessions: [
      { date: "Oct 13", subject: "English", duration: 50, method: "Reading", focus: 3 },
      { date: "Oct 11", subject: "Mathematics", duration: 40, method: "Reading", focus: 2 },
      { date: "Oct 8", subject: "Science", duration: 35, method: "Video Lessons", focus: 3 },
    ],
  },
  {
    id: 5,
    name: "Rhenz Indonilla",
    email: "rhenz.indonilla@studytrack.com",
    password: "rhenz123",
    weeklyHours: [13, 12, 14, 13, 15, 13, 14],
    studyFrequency: 5,
    preferredMethod: "Flashcards",
    focusLevel: 3.9,
    grades: { Mathematics: 85, Programming: 82, "Data Science": 87, English: 88, Science: 83 },
    previousGrades: { Mathematics: 81, Programming: 80, "Data Science": 83, English: 85, Science: 80 },
    sessions: [
      { date: "Oct 14", subject: "Data Science", duration: 85, method: "Flashcards", focus: 4 },
      { date: "Oct 13", subject: "English", duration: 65, method: "Group Study", focus: 4 },
      { date: "Oct 12", subject: "Mathematics", duration: 70, method: "Practice Problems", focus: 4 },
      { date: "Oct 10", subject: "Programming", duration: 80, method: "Flashcards", focus: 4 },
      { date: "Oct 8", subject: "Science", duration: 60, method: "Flashcards", focus: 4 },
    ],
  },
  {
    id: 6,
    name: "Wiley Javier",
    email: "wiley.javier@studytrack.com",
    password: "wiley123",
    weeklyHours: [9, 10, 9, 11, 10, 9, 11],
    studyFrequency: 4,
    preferredMethod: "Group Study",
    focusLevel: 3.5,
    grades: { Mathematics: 80, Programming: 77, "Data Science": 78, English: 84, Science: 79 },
    previousGrades: { Mathematics: 78, Programming: 76, "Data Science": 75, English: 82, Science: 77 },
    sessions: [
      { date: "Oct 14", subject: "English", duration: 65, method: "Group Study", focus: 4 },
      { date: "Oct 12", subject: "Mathematics", duration: 60, method: "Practice Problems", focus: 3 },
      { date: "Oct 10", subject: "Programming", duration: 55, method: "Group Study", focus: 3 },
      { date: "Oct 8", subject: "Data Science", duration: 50, method: "Note-taking", focus: 4 },
    ],
  },
];

export const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
export const studentAverage = (s) => avg(Object.values(s.grades));
export const studentTotalWeeklyHours = (s) => s.weeklyHours.reduce((a, b) => a + b, 0);
export const sessionHours = (sessions) => sessions.reduce((total, session) => total + Number(session.duration || 0), 0) / 60;
export const averageSessionDuration = (sessions) => avg(sessions.map((session) => Number(session.duration || 0)));

export const getMostStudiedSubject = (sessions) => {
  if (!sessions.length) return "—";
  const totals = {};
  sessions.forEach((session) => {
    totals[session.subject] = (totals[session.subject] || 0) + Number(session.duration || 0);
  });
  return Object.entries(totals).sort((a, b) => b[1] - a[1])[0][0];
};

export const getSubjectHours = (sessions) => {
  const totals = {};
  sessions.forEach((session) => {
    totals[session.subject] = (totals[session.subject] || 0) + Number(session.duration || 0);
  });
  return totals;
};

const parseSessionDate = (date) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split("-").map(Number);
    const parsed = new Date(year, month - 1, day);
    return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day
      ? parsed
      : null;
  }
  const match = date.match(/^([A-Za-z]{3}) (\d{1,2})$/);
  if (!match) return null;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months.indexOf(match[1]);
  if (month < 0) return null;
  const day = Number(match[2]);
  const parsed = new Date(2024, month, day);
  return parsed.getMonth() === month && parsed.getDate() === day ? parsed : null;
};

const calendarDayDifference = (later, earlier) => {
  const laterUtc = Date.UTC(later.getFullYear(), later.getMonth(), later.getDate());
  const earlierUtc = Date.UTC(earlier.getFullYear(), earlier.getMonth(), earlier.getDate());
  return Math.floor((laterUtc - earlierUtc) / (1000 * 60 * 60 * 24));
};

export const getSubjectProgress = (student, subject, now = new Date()) => {
  const currentGrade = Number(student.grades[subject]);
  const storedTarget = Number(student.targets?.[subject]);
  const targetGrade = Number.isFinite(storedTarget) && student.targets?.[subject] !== ""
    ? storedTarget
    : currentGrade;
  const recentSessions = student.sessions
    .filter((session) => session.subject === subject)
    .map((session) => ({ session, date: parseSessionDate(session.date) }))
    .filter(({ date }) => date && calendarDayDifference(now, date) >= 0)
    .sort((a, b) => b.date - a.date);
  const daysSinceLastSession = recentSessions.length
    ? calendarDayDifference(now, recentSessions[0].date)
    : null;
  const recentSessionCount = recentSessions.filter(({ date }) => calendarDayDifference(now, date) <= 7).length;
  const gap = targetGrade - currentGrade;
  const hasLongInactivity = daysSinceLastSession === null || daysSinceLastSession > 14;
  const hasStaleActivity = daysSinceLastSession === null || daysSinceLastSession > 7;
  let status;
  let recommendation;

  if (gap <= 0) {
    status = "on-track";
    const gradeProgress = gap < 0
      ? `Your current grade is ${Math.abs(gap)} points above your target of ${targetGrade}`
      : "Your current grade is meeting your target";
    if (hasStaleActivity) {
      const activityReason = daysSinceLastSession === null
        ? `you haven't recorded a ${subject} study session yet`
        : `you haven't recorded a recent study session for ${subject}; your latest was ${daysSinceLastSession} days ago`;
      recommendation = `${gradeProgress}, but ${activityReason}. Consider logging your study activity to keep your progress visible.`;
    } else {
      recommendation = `${gradeProgress}, and you have recorded ${subject} study activity in the last 7 days.`;
    }
  } else if (gap >= 10 || hasLongInactivity) {
    status = "recommended";
    if (gap >= 10 && hasLongInactivity) {
      const inactivityReason = daysSinceLastSession === null
        ? `no ${subject} study session has been recorded yet`
        : `your latest ${subject} session was ${daysSinceLastSession} days ago`;
      recommendation = `Your current grade is ${gap} points below your target, and ${inactivityReason} Consider setting aside time to review ${subject}.`;
    } else if (gap >= 10) {
      recommendation = `Your current grade is ${gap} points below your target of ${targetGrade}. Consider scheduling a study session for ${subject}.`;
    } else {
      recommendation = `Your current grade is ${gap} points below your target, and your latest ${subject} session was ${daysSinceLastSession === null ? "never recorded" : `${daysSinceLastSession} days ago`}. Consider setting aside time to review ${subject}.`;
    }
  } else {
    status = "attention";
    if (gap > 0 && hasStaleActivity) {
      const activityReason = daysSinceLastSession === null
        ? `no ${subject} study session has been recorded yet`
        : `your latest ${subject} session was ${daysSinceLastSession} days ago`;
      recommendation = `Your current grade is ${gap} points below your target, and ${activityReason}. Consider scheduling another study session.`;
    } else if (gap > 0) {
      recommendation = `Your current grade is ${gap} points below your target of ${targetGrade}. Consider scheduling a study session for ${subject}.`;
    }
  }

  return {
    subject,
    currentGrade,
    targetGrade,
    gap,
    daysSinceLastSession,
    lastSessionDate: recentSessions[0]?.session.date || null,
    recentSessionCount,
    status,
    recommendation,
  };
};

export const getStudentSubjectProgress = (student, now = new Date()) =>
  subjects.map((subject) => getSubjectProgress(student, subject, now));

export const correlation = (xs, ys) => {
  const n = xs.length;
  if (!n) return 0;
  const mx = avg(xs), my = avg(ys);
  const num = xs.reduce((sum, x, i) => sum + (x - mx) * (ys[i] - my), 0);
  const denX = Math.sqrt(xs.reduce((sum, x) => sum + (x - mx) ** 2, 0));
  const denY = Math.sqrt(ys.reduce((sum, y) => sum + (y - my) ** 2, 0));
  return denX && denY ? num / (denX * denY) : 0;
};

export const getStudyStreak = (sessions) => {
  if (!sessions.length) return 0;
  const days = [...new Set(sessions.map((session) => session.date))]
    .map(parseSessionDate)
    .filter(Boolean)
    .sort((a, b) => b - a);
  if (!days.length) return 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = calendarDayDifference(days[i - 1], days[i]);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
};
