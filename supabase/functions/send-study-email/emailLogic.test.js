import test from "node:test";
import assert from "node:assert/strict";
import {
  createAcademicEmail,
  describeProviderNetworkFailure,
  describeProviderRejection,
  normalizeApiKey,
  normalizeAcademicRows,
  parseAllowedOrigins,
  requiresReminderOptIn,
  validateEmailRequest,
} from "./emailLogic.js";

test("email request validation accepts only supported request shapes", () => {
  assert.deepEqual(validateEmailRequest({ type: "get_preferences" }), { type: "get_preferences" });
  assert.deepEqual(validateEmailRequest({
    type: "set_preferences",
    remindersEnabled: true,
  }), { type: "set_preferences", remindersEnabled: true });
  assert.deepEqual(validateEmailRequest({ type: "ten_day" }), { type: "ten_day" });
  assert.deepEqual(validateEmailRequest({
    type: "focus",
    subject: "Biology",
    topic: "Cell review",
    date: "2026-11-07",
  }), {
    type: "focus",
    subject: "Biology",
    topic: "Cell review",
    date: "2026-11-07",
  });
});

test("email request validation rejects arbitrary recipients and client-supplied academic data", () => {
  assert.equal(validateEmailRequest({ type: "test", to: "other@example.com" }), null);
  assert.equal(validateEmailRequest({
    type: "weak_subject",
    subject: "Spoofed grade",
    grade: 1,
  }), null);
  assert.equal(validateEmailRequest({
    type: "ten_day",
    subjects: [{ subject: "Spoofed grade", grade: 1 }],
  }), null);
  assert.equal(validateEmailRequest({
    type: "focus",
    subject: "Biology",
    topic: "Review",
    date: "2026-02-31",
  }), null);
});

test("academic row normalization accepts existing join shapes and rejects invalid grades", () => {
  assert.deepEqual(normalizeAcademicRows([
    {
      grade: "72",
      previous_grade: 65,
      target_grade: 80,
      subjects: [{ name: "Biology" }],
    },
    {
      grade: 0,
      previous_grade: null,
      target_grade: 0,
      subjects: { name: "Mathematics" },
    },
    { grade: 101, subjects: { name: "Invalid" } },
    { grade: 80, subjects: { name: "" } },
  ]), [
    { subject: "Mathematics", grade: 0, targetGrade: 0 },
    { subject: "Biology", grade: 72, previousGrade: 65, targetGrade: 80 },
  ]);
});

test("academic reminder content is derived only from normalized server records", () => {
  const rows = normalizeAcademicRows([
    { grade: 88, previous_grade: 80, target_grade: 90, subjects: { name: "Art" } },
    { grade: 64, previous_grade: 70, target_grade: 82, subjects: { name: "Biology" } },
  ]);
  const weak = createAcademicEmail("weak_subject", rows);
  const tenDay = createAcademicEmail("ten_day", rows);
  const checkIn = createAcademicEmail("study_checkin", rows);

  assert.equal(weak.subject, "A gentle study check-in: Biology");
  assert.match(weak.sections[0].lines.join(" "), /Current recorded grade: 64/);
  assert.match(weak.sections[0].lines.join(" "), /Previous recorded grade: 70/);
  assert.match(weak.sections[0].lines.join(" "), /Saved target grade: 82/);
  assert.match(tenDay.sections[0].lines.join(" "), /Art - Current recorded grade: 88/);
  assert.match(checkIn.sections[0].lines.join(" "), /Biology/);
  assert.equal(createAcademicEmail("weak_subject", []), null);
});

test("allowed origins require exact HTTPS origins or local development hosts", () => {
  assert.deepEqual(parseAllowedOrigins(
    "https://studytrack.example,https://studytrack.example/path,http://localhost:5173,http://example.com",
  ), ["https://studytrack.example", "http://localhost:5173"]);
});

test("study reminders require opt-in while the explicit test message does not", () => {
  for (const type of ["weak_subject", "ten_day", "study_checkin", "focus"]) {
    assert.equal(requiresReminderOptIn(type), true);
  }
  assert.equal(requiresReminderOptIn("test"), false);
});

test("network failure on a test email does not mention a reserved claim", () => {
  const failure = describeProviderNetworkFailure(new TypeError("fetch failed"), false);
  assert.equal(failure.code, "provider_unreachable");
  assert.doesNotMatch(failure.error, /10-day/);
});

test("provider timeouts mention a reserved claim only when one exists", () => {
  const failure = describeProviderNetworkFailure(
    Object.assign(new Error("timed out"), { name: "TimeoutError" }),
    true,
  );
  assert.equal(failure.code, "provider_timeout");
  assert.match(failure.error, /10-day claim remains reserved/);
});

test("provider rejection omits Resend's free-text message and validates error names", () => {
  const rejection = describeProviderRejection(403, {
    name: "validation_error",
    message: "Account owner owner@example.com must verify the sender.",
  });
  assert.equal(rejection.providerStatus, 403);
  assert.equal(rejection.providerError, "validation_error");
  assert.doesNotMatch(JSON.stringify(rejection), /owner@example\.com/);
  assert.equal(describeProviderRejection(403, { name: "INVALID_NAME" }).providerError, "unknown_error");
  assert.equal(describeProviderRejection(403, { name: "bad name" }).providerError, "unknown_error");
});

test("API keys are trimmed and reject unusable formats", () => {
  assert.equal(normalizeApiKey("  re_12345678\r\n"), "re_12345678");
  for (const value of [
    '"re_12345678"',
    "'re_12345678'",
    "re_1234 5678",
    "re_12345é",
    "",
    undefined,
  ]) {
    assert.equal(normalizeApiKey(value), null);
  }
});
