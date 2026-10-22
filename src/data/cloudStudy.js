import { supabase } from "../lib/supabase.js";

// Study sessions are stored one row per session in public.study_sessions.
// Study habits (weeklyHours, focusLevel, ...) are NOT synced yet; they stay local.
const HABIT_FIELDS = ["weeklyHours", "studyFrequency", "focusLevel", "preferredMethod"];
const SESSION_COLUMNS = "client_id,session_date,subject,duration_minutes,method,focus";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const validateUserId = (userId) => {
  if (typeof userId !== "string" || !userId.trim() || userId.startsWith("supabase_")) {
    throw new TypeError("A plain Supabase user id is required.");
  }
};

const cleanSessions = (sessions) => (Array.isArray(sessions) ? sessions : [])
  .filter((session) => session && typeof session === "object");

// Kept so App.jsx keeps working unchanged. Habits are local-only for now.
export const pickHabits = (source) => Object.fromEntries(
  HABIT_FIELDS
    .filter((key) => source?.[key] !== undefined && source?.[key] !== null && source?.[key] !== "")
    .map((key) => [key, source[key]]),
);

// Only sessions are compared, so editing local-only habits never triggers a cloud save.
export const studyDataSnapshot = (student) => JSON.stringify({
  sessions: cleanSessions(student?.sessions),
});

// App session -> database row. Returns null for sessions that cannot be stored
// (no id, no subject, or no valid duration); those stay local only.
export const sessionToRow = (userId, session) => {
  const clientId = typeof session?.id === "string" || typeof session?.id === "number"
    ? String(session.id).trim()
    : "";
  const subject = typeof session?.subject === "string" ? session.subject.trim() : "";
  const duration = Math.round(Number(session?.duration));
  if (!clientId || !subject || !Number.isFinite(duration) || duration <= 0) return null;

  const focus = Number(session.focus);
  return {
    user_id: userId,
    client_id: clientId,
    session_date: typeof session.date === "string" && DATE_PATTERN.test(session.date) ? session.date : null,
    subject,
    duration_minutes: duration,
    method: typeof session.method === "string" && session.method.trim() ? session.method : null,
    focus: Number.isInteger(focus) && focus >= 1 && focus <= 5 ? focus : null,
  };
};

// Database row -> App session.
export const rowToSession = (row) => ({
  id: row.client_id,
  date: row.session_date || "",
  subject: row.subject,
  duration: Number(row.duration_minutes),
  method: row.method || "",
  focus: row.focus === null || row.focus === undefined ? "" : Number(row.focus),
});

export const createCloudStudyApi = (client) => ({
  // Returns null when the cloud has no sessions, so the caller keeps local data and uploads it.
  async loadCloudStudy(userId) {
    validateUserId(userId);
    if (!client) throw new Error("Supabase is not configured.");
    const { data, error } = await client
      .from("study_sessions")
      .select(SESSION_COLUMNS)
      .eq("user_id", userId)
      .order("session_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    const sessions = (data || []).filter((row) => row?.client_id).map(rowToSession);
    return sessions.length ? { sessions, habits: {} } : null;
  },

  // Makes the cloud match the app: upserts current sessions, deletes removed ones.
  async saveCloudStudy(userId, student) {
    validateUserId(userId);
    if (!client) throw new Error("Supabase is not configured.");

    const rows = [];
    const seen = new Set();
    for (const session of cleanSessions(student?.sessions)) {
      const row = sessionToRow(userId, session);
      if (row && !seen.has(row.client_id)) {
        seen.add(row.client_id);
        rows.push(row);
      }
    }

    if (rows.length) {
      const { error } = await client.from("study_sessions")
        .upsert(rows, { onConflict: "user_id,client_id" });
      if (error) throw error;
    }

    const { data: existing, error: existingError } = await client
      .from("study_sessions")
      .select("client_id")
      .eq("user_id", userId);
    if (existingError) throw existingError;

    const removed = (existing || [])
      .map(({ client_id }) => client_id)
      .filter((clientId) => !seen.has(clientId));
    if (removed.length) {
      const { error } = await client.from("study_sessions")
        .delete()
        .eq("user_id", userId)
        .in("client_id", removed);
      if (error) throw error;
    }
  },
});

const cloudStudyApi = createCloudStudyApi(supabase);

export const loadCloudStudy = (userId) => cloudStudyApi.loadCloudStudy(userId);
export const saveCloudStudy = (userId, student) => cloudStudyApi.saveCloudStudy(userId, student);