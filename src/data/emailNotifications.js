export const EMAIL_PREFERENCES_KEY = "studytrack:email-preferences:";

const localDateString = (date) => (
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
);

const isValidDateInput = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export const getUpcomingFocusPlans = (plans, now = new Date()) => {
  const today = localDateString(now);
  return (Array.isArray(plans) ? plans : [])
    .filter((plan) => (
      typeof plan?.subject === "string"
      && plan.subject.trim()
      && typeof plan?.topic === "string"
      && plan.topic.trim()
      && isValidDateInput(plan.date)
      && plan.date >= today
    ))
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const loadEmailPreferences = (studentId) => {
  try {
    const saved = JSON.parse(localStorage.getItem(`${EMAIL_PREFERENCES_KEY}${studentId}`) || "null");
    return { remindersEnabled: saved?.remindersEnabled === true, storageError: false };
  } catch {
    return { remindersEnabled: false, storageError: true };
  }
};

export const saveEmailPreferences = (studentId, preferences) => {
  try {
    localStorage.setItem(`${EMAIL_PREFERENCES_KEY}${studentId}`, JSON.stringify({
      remindersEnabled: preferences?.remindersEnabled === true,
    }));
  } catch {
    return false;
  }
  return true;
};
