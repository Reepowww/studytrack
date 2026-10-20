const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 12;

export const validateSignUp = ({ name = "", email = "", password = "", confirmPassword = "" } = {}) => {
  const errors = {};
  const trimmedName = typeof name === "string" ? name.trim() : "";
  const normalizedEmail = typeof email === "string" ? email.trim() : "";

  if (!trimmedName) errors.name = "Enter your full name.";
  if (!normalizedEmail) {
    errors.email = "Enter your student email address.";
  } else if (!EMAIL_PATTERN.test(normalizedEmail)) {
    errors.email = "Enter a valid email address, such as name@example.edu.";
  }
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`;
  }
  if (confirmPassword !== password) errors.confirmPassword = "Your passwords do not match.";

  return errors;
};
