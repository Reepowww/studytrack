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

export const sampleSummary = (data = students) => {
  const avgHours = avg(data.map((s) => avg(s.weeklyHours)));
  const avgGrade = avg(data.map((s) => studentAverage(s)));
  const avgFocus = avg(data.map((s) => s.focusLevel));
  const methodCount = {};
  data.forEach((s) => (methodCount[s.preferredMethod] = (methodCount[s.preferredMethod] || 0) + 1));
  const mostCommonMethod = Object.entries(methodCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  return { avgHours, avgGrade, avgFocus, mostCommonMethod };
};

export const methodPerformance = (data = students) => {
  const groups = {};
  data.forEach((student) => {
    const method = student.preferredMethod;
    if (!groups[method]) groups[method] = [];
    groups[method].push(studentAverage(student));
  });

  return Object.entries(groups).map(([method, grades]) => ({
    method,
    students: grades.length,
    averageGrade: avg(grades),
  }));
};

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
  const days = [...new Set(sessions.map((s) => s.date))].sort((a, b) => new Date(b + " 2024") - new Date(a + " 2024"));
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1] + " 2024");
    const curr = new Date(days[i] + " 2024");
    const diff = (prev - curr) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
};
