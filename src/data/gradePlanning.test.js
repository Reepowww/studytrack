import assert from "node:assert/strict";
import test from "node:test";
import { calculateTermGwa, getDefaultPeriodWeights, getSubjectGradePlan } from "./gradePlanning.js";

const threePeriods = [
  { id: "prelim" },
  { id: "midterm" },
  { id: "finals" },
];

test("default weights add up to 100 for two and three periods", () => {
  assert.deepEqual(getDefaultPeriodWeights(threePeriods), { prelim: 33.3, midterm: 33.3, finals: 33.4 });
  assert.deepEqual(getDefaultPeriodWeights([{ id: "midterm" }, { id: "finals" }]), { midterm: 50, finals: 50 });
});

test("grade plan estimates the weighted average needed across remaining periods", () => {
  const plan = getSubjectGradePlan({
    subject: "Math",
    termId: "semester-1",
    periods: threePeriods,
    periodGrades: { prelim: 76 },
    gradeSettings: { passingGrade: 75 },
  });
  assert.equal(plan.weightsValid, true);
  assert.ok(Math.abs(plan.requiredAverage - 74.5) < 0.01);
  assert.deepEqual(plan.missingPeriods.map(({ id }) => id), ["midterm", "finals"]);
});

test("grade plan only calculates a final grade after all grades are entered with valid weights", () => {
  const plan = getSubjectGradePlan({
    subject: "Math",
    termId: "semester-1",
    periods: threePeriods,
    periodGrades: { prelim: 76, midterm: 75, finals: 80 },
  });
  assert.equal(plan.finalGrade, 77);
  assert.equal(plan.requiredAverage, null);
});

test("grade plan does not estimate when weights do not total 100", () => {
  const plan = getSubjectGradePlan({
    subject: "Math",
    termId: "semester-1",
    periods: threePeriods,
    periodGrades: { prelim: 76 },
    gradeSettings: {
      weights: { Math: { "semester-1": { prelim: 40, midterm: 40, finals: 40 } } },
    },
  });
  assert.equal(plan.weightsValid, false);
  assert.equal(plan.requiredAverage, null);
});

test("GWA uses final subject grades weighted by units and reports missing subjects", () => {
  const periods = [{ id: "final" }];
  const result = calculateTermGwa({
    subjects: ["Math", "Art"],
    termId: "semester-1",
    periods,
    periodGrades: { Math: { final: 80 }, Art: { final: 90 } },
    gradeSettings: {
      units: { Math: 3, Art: 1 },
      weights: {
        Math: { "semester-1": { final: 100 } },
        Art: { "semester-1": { final: 100 } },
      },
    },
  });
  assert.equal(result.gwa, 82.5);
  assert.deepEqual(result.missing, []);
});
