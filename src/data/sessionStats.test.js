import test from "node:test";
import assert from "node:assert/strict";
import { averageSessionFocus, recentStudyHours } from "./sessionStats.js";

const today = new Date(2026, 9, 23); // 23 Oct 2026

test("recentStudyHours adds the last 7 days and ignores older or future sessions", () => {
  const sessions = [
    { date: "2026-10-23", duration: 60 },
    { date: "2026-10-17", duration: 30 }, // 7th day back: included
    { date: "2026-10-16", duration: 45 }, // 8th day back: left out
    { date: "2026-10-24", duration: 120 }, // future: left out
  ];
  assert.equal(recentStudyHours(sessions, today), 1.5);
});

test("recentStudyHours returns null with no sessions", () => {
  assert.equal(recentStudyHours([], today), null);
  assert.equal(recentStudyHours(undefined, today), null);
});

test("recentStudyHours returns 0 when sessions exist but none are recent", () => {
  assert.equal(recentStudyHours([{ date: "2026-09-01", duration: 90 }], today), 0);
});

test("recentStudyHours skips bad dates and durations", () => {
  const sessions = [
    { date: "not-a-date", duration: 60 },
    { date: "2026-02-31", duration: 60 },
    { date: "2026-10-22", duration: "abc" },
    { date: "2026-10-22", duration: -10 },
    { date: "2026-10-22", duration: "45" },
  ];
  assert.equal(recentStudyHours(sessions, today), 0.8);
});

test("averageSessionFocus averages valid 1-5 ratings", () => {
  assert.equal(averageSessionFocus([{ focus: 3 }, { focus: "4" }, { focus: 5 }]), 4);
  assert.equal(averageSessionFocus([{ focus: 2 }, { focus: 3 }]), 2.5);
});

test("averageSessionFocus returns null when nothing valid exists", () => {
  assert.equal(averageSessionFocus([]), null);
  assert.equal(averageSessionFocus([{ focus: "" }, { focus: 9 }, {}, null]), null);
});