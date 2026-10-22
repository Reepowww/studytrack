import { supabase } from "../lib/supabase.js";

const HABIT_FIELDS = ["weeklyHours", "studyFrequency", "focusLevel", "preferredMethod"];

const validateUserId = (userId) => {
  if (typeof userId !== "string" || !userId.trim() || userId.startsWith("supabase_")) {
    throw new TypeError("A plain Supabase user id is required.");
  }
};

const cleanSessions = (sessions) => (Array.isArray(sessions) ? sessions : [])
  .filter((session) => session && typeof session === "object");

export const pickHabits = (source) => Object.fromEntries(
  HABIT_FIELDS
    .filter((key) => source?.[key] !== undefined && source?.[key] !== null && source?.[key] !== "")
    .map((key) => [key, source[key]]),
);

export const studyDataSnapshot = (student) => JSON.stringify({
  sessions: cleanSessions(student?.sessions),
  habits: pickHabits(student),
});

export const createCloudStudyApi = (client) => ({
  // Returns null when the cloud has no row, or only an empty one,
  // so the caller keeps local data and uploads it (same idea as grades).
  async loadCloudStudy(userId) {
    validateUserId(userId);
    if (!client) throw new Error("Supabase is not configured.");
    const { data, error } = await client
      .from("student_study_data")
      .select("sessions, habits")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const sessions = cleanSessions(data.sessions);
    const habits = data.habits && typeof data.habits === "object" && !Array.isArray(data.habits)
      ? data.habits
      : {};
    if (!sessions.length && !Object.keys(habits).length) return null;
    return { sessions, habits };
  },

  async saveCloudStudy(userId, student) {
    validateUserId(userId);
    if (!client) throw new Error("Supabase is not configured.");
    const { error } = await client.from("student_study_data").upsert({
      user_id: userId,
      sessions: cleanSessions(student?.sessions),
      habits: pickHabits(student),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) throw error;
  },
});

const cloudStudyApi = createCloudStudyApi(supabase);

export const loadCloudStudy = (userId) => cloudStudyApi.loadCloudStudy(userId);
export const saveCloudStudy = (userId, student) => cloudStudyApi.saveCloudStudy(userId, student);