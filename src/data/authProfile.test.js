import assert from "node:assert/strict";
import test from "node:test";
import { createAuthenticatedStudent } from "./authProfile.js";

test("authenticated student profile starts without fabricated academic records", () => {
  assert.deepEqual(createAuthenticatedStudent({
    id: "user-123",
    email: "student@example.edu",
    user_metadata: { full_name: "  Taylor Student  " },
  }), {
    id: "supabase_user-123",
    name: "Taylor Student",
    email: "student@example.edu",
    subjects: [],
    grades: {},
    sessions: [],
  });
});

test("authenticated student profile has a usable fallback display name", () => {
  assert.equal(createAuthenticatedStudent({
    id: "user-456",
    email: "student@example.edu",
  }).name, "student");
});

test("authenticated student profile rejects missing user identity", () => {
  assert.throws(() => createAuthenticatedStudent(null), /valid Supabase user/);
});
