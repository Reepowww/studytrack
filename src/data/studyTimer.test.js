import assert from "node:assert/strict";
import test from "node:test";
import {
  formatStudyTimerElapsed,
  getStudyTimerElapsedMs,
  restoreStudyTimer,
} from "./studyTimer.js";

test("elapsed time adds the current running interval to paused time", () => {
  assert.equal(getStudyTimerElapsedMs({
    status: "running",
    accumulatedMs: 5_000,
    runningSince: 10_000,
  }, 17_500), 12_500);
});

test("paused timer elapsed time remains fixed", () => {
  assert.equal(getStudyTimerElapsedMs({
    status: "paused",
    accumulatedMs: 12_500,
    runningSince: null,
  }, 99_000), 12_500);
});

test("restores an interrupted running timer as paused", () => {
  assert.deepEqual(restoreStudyTimer({
    subject: "Math",
    status: "running",
    accumulatedMs: 12_500,
    runningSince: 10_000,
  }), {
    subject: "Math",
    status: "paused",
    accumulatedMs: 12_500,
    runningSince: null,
    recovered: true,
  });
});

test("rejects invalid saved timers", () => {
  assert.equal(restoreStudyTimer(null), null);
  assert.equal(restoreStudyTimer({ subject: "", status: "paused", accumulatedMs: 0 }), null);
  assert.equal(restoreStudyTimer({
    subject: "Math",
    status: "running",
    accumulatedMs: 0,
    runningSince: NaN,
  }), null);
});

test("formats elapsed time as hours, minutes, and seconds", () => {
  assert.equal(formatStudyTimerElapsed(3_661_000), "01:01:01");
});
