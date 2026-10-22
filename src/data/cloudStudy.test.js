import assert from "node:assert/strict";
import test from "node:test";
import {
  createCloudStudyApi,
  pickHabits,
  rowToSession,
  sessionToRow,
  studyDataSnapshot,
} from "./cloudStudy.js";

const createMockClient = (responses = []) => {
  const calls = [];
  let responseIndex = 0;

  class Query {
    constructor(table) { this.table = table; }
    select(columns) { calls.push([this.table, "select", columns]); return this; }
    eq(column, value) { calls.push([this.table, "eq", column, value]); return this; }
    in(column, values) { calls.push([this.table, "in", column, values]); return this; }
    order(column, options) { calls.push([this.table, "order", column, options]); return this; }
    upsert(rows, options) { calls.push([this.table, "upsert", rows, options]); return this; }
    delete() { calls.push([this.table, "delete"]); return this; }
    then(resolve, reject) {
      return Promise.resolve(responses[responseIndex++] || { data: [], error: null }).then(resolve, reject);
    }
  }

  return { calls, client: { from: (table) => new Query(table) } };
};

const session = {
  id: "1729-abc", date: "2026-10-20", subject: "Mathematics",
  duration: 45, method: "Practice Problems", focus: 4,
};
const row = {
  client_id: "1729-abc", session_date: "2026-10-20", subject: "Mathematics",
  duration_minutes: 45, method: "Practice Problems", focus: 4,
};

test("sessionToRow converts an app session to a database row", () => {
  assert.deepEqual(sessionToRow("user-123", session), { user_id: "user-123", ...row });
});

test("sessionToRow keeps optional fields null and skips unusable sessions", () => {
  assert.deepEqual(
    sessionToRow("user-123", { id: "x", subject: " Science ", duration: "30.4", date: "Oct 14", method: "", focus: 9 }),
    {
      user_id: "user-123", client_id: "x", session_date: null, subject: "Science",
      duration_minutes: 30, method: null, focus: null,
    },
  );
  assert.equal(sessionToRow("user-123", { subject: "Math", duration: 30 }), null); // no id
  assert.equal(sessionToRow("user-123", { id: "x", duration: 30 }), null); // no subject
  assert.equal(sessionToRow("user-123", { id: "x", subject: "Math", duration: 0 }), null);
  assert.equal(sessionToRow("user-123", { id: "x", subject: "Math", duration: "abc" }), null);
});

test("rowToSession converts a database row back to an app session", () => {
  assert.deepEqual(rowToSession(row), session);
  assert.deepEqual(
    rowToSession({ client_id: "y", session_date: null, subject: "Art", duration_minutes: "20", method: null, focus: null }),
    { id: "y", date: "", subject: "Art", duration: 20, method: "", focus: "" },
  );
});

test("loadCloudStudy queries the user's rows newest first and maps them", async () => {
  const { client, calls } = createMockClient([{ data: [row], error: null }]);
  const { loadCloudStudy } = createCloudStudyApi(client);

  assert.deepEqual(await loadCloudStudy("user-123"), { sessions: [session], habits: {} });
  assert.deepEqual(calls, [
    ["study_sessions", "select", "client_id,session_date,subject,duration_minutes,method,focus"],
    ["study_sessions", "eq", "user_id", "user-123"],
    ["study_sessions", "order", "session_date", { ascending: false, nullsFirst: false }],
    ["study_sessions", "order", "created_at", { ascending: false }],
  ]);
});

test("loadCloudStudy returns null when the cloud has no sessions", async () => {
  const { client } = createMockClient([{ data: [], error: null }]);
  assert.equal(await createCloudStudyApi(client).loadCloudStudy("user-123"), null);
});

test("loadCloudStudy throws Supabase errors so the caller keeps local data", async () => {
  const failure = new Error("relation \"study_sessions\" does not exist");
  const { client } = createMockClient([{ data: null, error: failure }]);
  await assert.rejects(() => createCloudStudyApi(client).loadCloudStudy("user-123"), failure);
});

test("cloud study calls reject prefixed ids and a missing client", async () => {
  const api = createCloudStudyApi(createMockClient().client);
  await assert.rejects(() => api.loadCloudStudy("supabase_user-123"), TypeError);
  await assert.rejects(() => api.saveCloudStudy("", {}), TypeError);
  await assert.rejects(() => createCloudStudyApi(null).loadCloudStudy("user-123"), /not configured/);
});

test("saveCloudStudy upserts sessions and deletes ones removed in the app", async () => {
  const { client, calls } = createMockClient([
    { error: null },
    { data: [{ client_id: "1729-abc" }, { client_id: "old-1" }, { client_id: "old-2" }], error: null },
    { error: null },
  ]);
  const { saveCloudStudy } = createCloudStudyApi(client);

  await saveCloudStudy("user-123", { sessions: [session, session, { subject: "no id", duration: 10 }, null] });

  assert.deepEqual(calls, [
    ["study_sessions", "upsert", [{ user_id: "user-123", ...row }], { onConflict: "user_id,client_id" }],
    ["study_sessions", "select", "client_id"],
    ["study_sessions", "eq", "user_id", "user-123"],
    ["study_sessions", "delete"],
    ["study_sessions", "eq", "user_id", "user-123"],
    ["study_sessions", "in", "client_id", ["old-1", "old-2"]],
  ]);
});

test("saveCloudStudy with no sessions only deletes what exists in the cloud", async () => {
  const { client, calls } = createMockClient([
    { data: [{ client_id: "old-1" }], error: null },
    { error: null },
  ]);
  await createCloudStudyApi(client).saveCloudStudy("user-123", { sessions: [] });

  assert.ok(!calls.some(([, op]) => op === "upsert"));
  assert.deepEqual(calls.at(-1), ["study_sessions", "in", "client_id", ["old-1"]]);
});

test("saveCloudStudy skips the delete when nothing was removed", async () => {
  const { client, calls } = createMockClient([
    { error: null },
    { data: [{ client_id: "1729-abc" }], error: null },
  ]);
  await createCloudStudyApi(client).saveCloudStudy("user-123", { sessions: [session] });
  assert.ok(!calls.some(([, op]) => op === "delete"));
});

test("saveCloudStudy throws when Supabase rejects a write", async () => {
  const failure = new Error("row violates row-level security policy");
  const { client } = createMockClient([{ error: failure }]);
  await assert.rejects(() => createCloudStudyApi(client).saveCloudStudy("user-123", { sessions: [session] }), failure);
});

test("studyDataSnapshot tracks sessions only; pickHabits stays for App.jsx", () => {
  assert.equal(
    studyDataSnapshot({ sessions: [session], focusLevel: 1 }),
    studyDataSnapshot({ sessions: [session], focusLevel: 5 }),
  );
  assert.notEqual(studyDataSnapshot({ sessions: [session] }), studyDataSnapshot({ sessions: [] }));
  assert.deepEqual(pickHabits({ focusLevel: 0, preferredMethod: "", name: "x" }), { focusLevel: 0 });
});