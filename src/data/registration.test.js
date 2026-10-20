import assert from "node:assert/strict";
import test from "node:test";
import { MIN_PASSWORD_LENGTH, validateSignUp } from "./registration.js";

const validDetails = {
  name: "Taylor Student",
  email: "taylor@example.edu",
  password: "correct horse battery",
  confirmPassword: "correct horse battery",
};

test("sign-up validation accepts complete valid details", () => {
  assert.deepEqual(validateSignUp(validDetails), {});
});

test("sign-up validation requires a nonempty trimmed name and valid email", () => {
  assert.equal(validateSignUp({ ...validDetails, name: "  " }).name, "Enter your full name.");
  assert.match(validateSignUp({ ...validDetails, email: "bad-email" }).email, /valid email/);
});

test("sign-up validation enforces password length and matching confirmation", () => {
  assert.equal(MIN_PASSWORD_LENGTH, 12);
  assert.match(validateSignUp({ ...validDetails, password: "short", confirmPassword: "short" }).password, /12 characters/);
  assert.equal(
    validateSignUp({ ...validDetails, confirmPassword: "different" }).confirmPassword,
    "Your passwords do not match.",
  );
});
