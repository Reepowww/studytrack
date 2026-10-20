import { supabase } from "../lib/supabase.js";

export const normalizeCloudSubjectNames = (names) => {
  if (!Array.isArray(names)) {
    throw new TypeError("Subject names must be an array.");
  }

  const seen = new Set();
  return names.reduce((result, value) => {
    if (typeof value !== "string") return result;
    const name = value.trim();
    const key = name.toLocaleLowerCase();
    if (name && !seen.has(key)) {
      seen.add(key);
      result.push(name);
    }
    return result;
  }, []);
};

const validateUserId = (userId) => {
  if (typeof userId !== "string" || !userId.trim() || userId.startsWith("supabase_")) {
    throw new TypeError("A plain Supabase user id is required.");
  }
};

export const createCloudSubjectsApi = (client) => ({
  async loadCloudSubjects(userId) {
    validateUserId(userId);
    const { data, error } = await client
      .from("subjects")
      .select("name")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data || []).map(({ name }) => name);
  },

  async saveCloudSubjects(userId, names) {
    validateUserId(userId);
    const normalizedNames = normalizeCloudSubjectNames(names);
    if (!normalizedNames.length) return;

    const { error: upsertError } = await client
      .from("subjects")
      .upsert(normalizedNames.map((name) => ({ user_id: userId, name })), {
        onConflict: "user_id,name",
      });
    if (upsertError) throw upsertError;

    const excludedNames = `(${normalizedNames.map((name) => JSON.stringify(name)).join(",")})`;
    const { error: deleteError } = await client
      .from("subjects")
      .delete()
      .eq("user_id", userId)
      .not("name", "in", excludedNames);
    if (deleteError) throw deleteError;
  },
});

const cloudSubjectsApi = createCloudSubjectsApi(supabase);

export const loadCloudSubjects = (userId) => cloudSubjectsApi.loadCloudSubjects(userId);
export const saveCloudSubjects = (userId, names) => cloudSubjectsApi.saveCloudSubjects(userId, names);
