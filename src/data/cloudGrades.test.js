import assert from "node:assert/strict";
import test from "node:test";
import {
  createCloudGradesApi,
  gradeDataSnapshot,
  resolveCloudGradeData,
} from "./cloudGrades.js";

const createMockClient = (responses = []) => {
  const calls = [];
  let responseIndex = 0;

  class Query {
    constructor(table) {
      this.table = table;
    }

    select(columns) { calls.push([this.table, "select", columns]); return this; }
    eq(column, value) { calls.push([this.table, "eq", column, value]); return this; }
    in(column, values) { calls.push([this.table, "in", column, values]); return this; }
    maybeSingle() { calls.push([this.table, "maybeSingle"]); return this; }
    upsert(rows, options) { calls.push([this.table, "upsert", rows, options]); return this; }
    delete() { calls.push([this.table, "delete"]); return this; }
    update(values) { calls.push([this.table, "update", values]); return this; }
    then(resolve, reject) {
      return Promise.resolve(responses[responseIndex++] || { data: [], error: null }).then(resolve, reject);
    }
  }

  return { calls, client: { from: (table) => new Query(table) } };
};

test("loadCloudGrades omits nulls instead of converting them to zero", async () => {
  const { client } = createMockClient([
    {
      data: [{
        grade: null,
        previous_grade: "78",
        target_grade: null,
        subjects: { name: "Mathematics" },
      }],
      error: null,
    },
    {
      data: [
        { period_id: "semester-1-prelim", grade: "0", subjects: { name: "Mathematics" } },
        { period_id: "semester-1-midterm", grade: null, subjects: { name: "Mathematics" } },
      ],
      error: null,
    },
    { data: { term_structure: "dualSemester" }, error: null },
  ]);
  const { loadCloudGrades } = createCloudGradesApi(client);

  assert.deepEqual(await loadCloudGrades("user-123"), {
    grades: {},
    previousGrades: { Mathematics: 78 },
    targets: {},
    periodGrades: { Mathematics: { "semester-1-prelim": 0 } },
    termStructure: "dualSemester",
  });
});

test("cloud grade data takes precedence and empty local data is not an upload candidate", () => {
  const cloud = {
    grades: { Mathematics: 87 },
    previousGrades: {},
    targets: {},
    periodGrades: {},
    termStructure: "dualSemester",
  };
  const local = {
    grades: {},
    previousGrades: {},
    targets: {},
    periodGrades: {},
    termStructure: "trimester",
  };
  const result = resolveCloudGradeData(cloud, local);

  assert.equal(result.data, cloud);
  assert.equal(result.shouldUploadLocal, false);
  assert.equal(resolveCloudGradeData(local, local).shouldUploadLocal, false);
  assert.equal(resolveCloudGradeData(cloud, {
    ...local,
    grades: {},
  }).data, cloud);
  assert.equal(resolveCloudGradeData(cloud, {
    ...local,
    targets: { Mathematics: 90 },
  }).shouldUploadLocal, false);
  assert.notEqual(gradeDataSnapshot(cloud), gradeDataSnapshot(local));
});

test("cloud term structure is retained when neither side has academic entries", () => {
  const result = resolveCloudGradeData({
    grades: {},
    previousGrades: {},
    targets: {},
    periodGrades: {},
    termStructure: "trimester",
  }, {
    grades: {},
    previousGrades: {},
    targets: {},
    periodGrades: {},
    termStructure: "dualSemester",
  });

  assert.equal(result.data.termStructure, "trimester");
  assert.equal(result.shouldUploadLocal, false);
});

test("saveCloudGrades deletes cleared periods only for their subject", async () => {
  const { client, calls } = createMockClient([
    { data: [{ id: 12, name: "Mathematics" }], error: null },
    { data: [], error: null },
    { data: [{ period_id: "semester-1-prelim" }, { period_id: "semester-1-midterm" }], error: null },
    { data: [], error: null },
    { data: null, error: null },
  ]);
  const { saveCloudGrades } = createCloudGradesApi(client);

  await saveCloudGrades("user-123", {
    subjects: ["Mathematics"],
    grades: {},
    previousGrades: {},
    targets: {},
    periodGrades: { Mathematics: { "semester-1-prelim": 88 } },
    termStructure: "dualSemester",
  });

  const deleteIndex = calls.findIndex((call) => call[0] === "period_grades" && call[1] === "delete");
  assert.deepEqual(calls.slice(deleteIndex, deleteIndex + 4), [
    ["period_grades", "delete"],
    ["period_grades", "eq", "user_id", "user-123"],
    ["period_grades", "eq", "subject_id", 12],
    ["period_grades", "in", "period_id", ["semester-1-midterm"]],
  ]);
});

test("saveCloudGrades rejects prefixed ids and invalid grades", async () => {
  const { client } = createMockClient();
  const { saveCloudGrades } = createCloudGradesApi(client);
  await assert.rejects(saveCloudGrades("supabase_user-123", {}), /plain Supabase user id/);

  const invalidClient = createMockClient([
    { data: [{ id: 12, name: "Mathematics" }], error: null },
  ]).client;
  const { saveCloudGrades: saveInvalid } = createCloudGradesApi(invalidClient);
  await assert.rejects(saveInvalid("user-123", {
    subjects: ["Mathematics"],
    grades: { Mathematics: 101 },
    termStructure: "dualSemester",
  }), /between 0 and 100/);
});

test("loadCloudGrades throws query errors", async () => {
  const failure = new Error("grades query failed");
  const { client } = createMockClient([{ data: null, error: failure }]);
  const { loadCloudGrades } = createCloudGradesApi(client);
  await assert.rejects(loadCloudGrades("user-123"), failure);
});
