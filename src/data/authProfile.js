export const createAuthenticatedStudent = (user) => {
  if (!user || typeof user.id !== "string" || !user.id) {
    throw new TypeError("A valid Supabase user is required.");
  }

  const metadata = user.user_metadata && typeof user.user_metadata === "object"
    ? user.user_metadata
    : {};
  const displayName = typeof metadata.full_name === "string" ? metadata.full_name.trim() : "";
  const email = typeof user.email === "string" ? user.email : "";

  return {
    id: `supabase_${user.id}`,
    name: displayName || email.split("@")[0] || "Student",
    email,
    subjects: [],
    grades: {},
    sessions: [],
  };
};
