// Study numbers calculated from the sessions a student has logged.
// Used by the Dashboard when an account has no recorded weekly hours / focus level
// (real accounts have no screen that sets them; only the demo students do).

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const parseLocalDate = (value) => {
  if (typeof value !== "string" || !DATE_ONLY.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
};

// Hours studied in the last `days` days (today plus the days before it).
// Returns null when there are no sessions at all, so the card can show "—".
export const recentStudyHours = (sessions, today = new Date(), days = 7) => {
  const list = Array.isArray(sessions) ? sessions : [];
  if (!list.length) return null;
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));
  let minutes = 0;
  list.forEach((session) => {
    const date = parseLocalDate(session?.date);
    const duration = Number(session?.duration);
    if (!date || date < start || date > end) return;
    if (Number.isFinite(duration) && duration > 0) minutes += duration;
  });
  return Math.round((minutes / 60) * 10) / 10;
};

// Average of the 1-5 focus ratings across all sessions, or null if there are none.
export const averageSessionFocus = (sessions) => {
  const ratings = (Array.isArray(sessions) ? sessions : [])
    .map((session) => Number(session?.focus))
    .filter((focus) => Number.isFinite(focus) && focus >= 1 && focus <= 5);
  if (!ratings.length) return null;
  return ratings.reduce((total, focus) => total + focus, 0) / ratings.length;
};