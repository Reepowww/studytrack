import test from "node:test";
import assert from "node:assert/strict";
import {
  EMAIL_PREFERENCES_KEY,
  getUpcomingFocusPlans,
  loadEmailPreferences,
  saveEmailPreferences,
} from "./emailNotifications.js";

test("upcoming focus plans preserve valid dates and exclude expired or invalid plans", () => {
  const result = getUpcomingFocusPlans([
    { subject: "Math", topic: "Practice", date: "2026-11-07" },
    { subject: "Art", topic: "Review", date: "2026-11-06" },
    { subject: "History", topic: "Read", date: "2026-11-05" },
    { subject: "Science", topic: "Lab", date: "2026-02-31" },
  ], new Date("2026-11-06T15:00:00"));

  assert.deepEqual(result.map(({ subject }) => subject), ["Art", "Math"]);
});

test("email reminder preferences are opt-in and account-scoped", () => {
  const values = new Map();
  const originalStorage = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };

  try {
    assert.deepEqual(loadEmailPreferences("student-1"), { remindersEnabled: false, storageError: false });
    assert.equal(saveEmailPreferences("student-1", { remindersEnabled: true }), true);
    assert.deepEqual(loadEmailPreferences("student-1"), { remindersEnabled: true, storageError: false });
    assert.deepEqual(loadEmailPreferences("student-2"), { remindersEnabled: false, storageError: false });
    assert.ok(values.has(`${EMAIL_PREFERENCES_KEY}student-1`));
  } finally {
    if (originalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = originalStorage;
  }
});

test("email reminder preference storage failures are reported", () => {
  const originalStorage = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: () => { throw new Error("storage unavailable"); },
    setItem: () => { throw new Error("storage unavailable"); },
  };

  try {
    assert.deepEqual(loadEmailPreferences("student-1"), {
      remindersEnabled: false,
      storageError: true,
    });
    assert.equal(saveEmailPreferences("student-1", { remindersEnabled: true }), false);
  } finally {
    if (originalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = originalStorage;
  }
});
