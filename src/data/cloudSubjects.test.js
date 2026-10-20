import assert from "node:assert/strict";
import test from "node:test";
import {
  createCloudSubjectsApi,
  normalizeCloudSubjectNames,
} from "./cloudSubjects.js";

const createMockClient = ({ selectedRows = [], upsertError = null, deleteError = null } = {}) => {
  const calls = [];
  let queryMode = "";
  const query = {
    select(columns) {
      calls.push(["select", columns]);
      queryMode = "select";
      return this;
    },
    upsert(rows, options) {
      calls.push(["upsert", rows, options]);
      queryMode = "upsert";
      return Promise.resolve({ error: upsertError });
    },
    delete() {
      calls.push(["delete"]);
      queryMode = "delete";
      return this;
    },
    eq(column, value) {
      calls.push(["eq", column, value]);
      return this;
    },
    order(column, options) {
      calls.push(["order", column, options]);
      return Promise.resolve({ data: selectedRows, error: null });
    },
    not(column, operator, value) {
      calls.push(["not", column, operator, value]);
      return Promise.resolve({ error: deleteError });
    },
    then(resolve, reject) {
      return Promise.resolve({
        data: queryMode === "select" ? selectedRows : undefined,
        error: queryMode === "select" ? null : upsertError,
      }).then(resolve, reject);
    },
  };

  return {
    calls,
    client: { from: (table) => {
      calls.push(["from", table]);
      return query;
    } },
  };
};

test("cloud subject names are trimmed, case-insensitively de-duplicated, and non-empty", () => {
  assert.deepEqual(
    normalizeCloudSubjectNames([" Mathematics ", "", "mathematics", null, "Science"]),
    ["Mathematics", "Science"],
  );
});

test("loadCloudSubjects selects names for the given user in creation order", async () => {
  const { client, calls } = createMockClient({
    selectedRows: [{ name: "Mathematics" }, { name: "Science" }],
  });
  const { loadCloudSubjects } = createCloudSubjectsApi(client);

  assert.deepEqual(await loadCloudSubjects("user-123"), ["Mathematics", "Science"]);
  assert.deepEqual(calls, [
    ["from", "subjects"],
    ["select", "name"],
    ["eq", "user_id", "user-123"],
    ["order", "created_at", { ascending: true }],
  ]);
});

test("loadCloudSubjects throws Supabase errors", async () => {
  const expectedError = new Error("select failed");
  const { client } = createMockClient();
  client.from = () => ({
    select: () => ({
      eq: () => ({
        order: async () => ({ data: null, error: expectedError }),
      }),
    }),
  });
  const { loadCloudSubjects } = createCloudSubjectsApi(client);

  await assert.rejects(loadCloudSubjects("user-123"), expectedError);
});

test("saveCloudSubjects upserts normalized names and deletes the user's other rows", async () => {
  const { client, calls } = createMockClient();
  const { saveCloudSubjects } = createCloudSubjectsApi(client);

  await saveCloudSubjects("user-123", [" Mathematics ", "Science", "Mathematics", ""]);
  assert.deepEqual(calls, [
    ["from", "subjects"],
    ["upsert", [
      { user_id: "user-123", name: "Mathematics" },
      { user_id: "user-123", name: "Science" },
    ], { onConflict: "user_id,name" }],
    ["from", "subjects"],
    ["delete"],
    ["eq", "user_id", "user-123"],
    ["not", "name", "in", '("Mathematics","Science")'],
  ]);
});

test("saveCloudSubjects does not upsert or delete when the list is empty", async () => {
  const { client, calls } = createMockClient();
  const { saveCloudSubjects } = createCloudSubjectsApi(client);

  await saveCloudSubjects("user-123", [" ", ""]);
  assert.deepEqual(calls, []);
});

test("saveCloudSubjects throws upsert and delete errors", async () => {
  const upsertFailure = new Error("upsert failed");
  const { client: upsertClient } = createMockClient({ upsertError: upsertFailure });
  const { saveCloudSubjects: saveAfterUpsertFailure } = createCloudSubjectsApi(upsertClient);
  await assert.rejects(saveAfterUpsertFailure("user-123", ["Mathematics"]), upsertFailure);

  const deleteFailure = new Error("delete failed");
  const { client: deleteClient } = createMockClient({ deleteError: deleteFailure });
  const { saveCloudSubjects: saveAfterDeleteFailure } = createCloudSubjectsApi(deleteClient);
  await assert.rejects(saveAfterDeleteFailure("user-123", ["Mathematics"]), deleteFailure);
});

test("cloud subject functions reject prefixed student IDs", async () => {
  const { client } = createMockClient();
  const { loadCloudSubjects, saveCloudSubjects } = createCloudSubjectsApi(client);

  await assert.rejects(loadCloudSubjects("supabase_user-123"), /plain Supabase user id/);
  await assert.rejects(saveCloudSubjects("supabase_user-123", ["Mathematics"]), /plain Supabase user id/);
});
