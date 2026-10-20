import { useRef, useState } from "react";
import { MIN_PASSWORD_LENGTH, validateSignUp } from "../data/registration.js";
import { supabase } from "../lib/supabase.js";

const initialValues = { name: "", email: "", password: "", confirmPassword: "" };

export default function SignUp({ onBackToLogin, onSupabaseAuth, authNotice }) {
  const [form, setForm] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [authError, setAuthError] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const validating = useRef(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setUnavailable(false);
    setAuthError("");
    setConfirmationMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (validating.current || submitting) return;
    validating.current = true;
    const nextErrors = validateSignUp(form);
    setErrors(nextErrors);
    setUnavailable(false);
    setAuthError("");
    setConfirmationMessage("");
    if (Object.keys(nextErrors).length) {
      validating.current = false;
      return;
    }
    if (!supabase) {
      setUnavailable(true);
      validating.current = false;
      return;
    }

    setSubmitting(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: { full_name: form.name.trim() },
          emailRedirectTo: new URL(import.meta.env.BASE_URL, window.location.origin).toString(),
        },
      });
      if (signUpError) {
        setAuthError(signUpError.message || "Unable to create your account. Please try again.");
      } else if (data.session && data.user) {
        onSupabaseAuth(data.user);
      } else if (data.user) {
        setConfirmationMessage("Signup request received. Check your email for a confirmation link before logging in.");
      } else {
        setAuthError("The sign-up service returned no account details. Please try again.");
      }
    } catch {
      setAuthError("Unable to reach the sign-up service. Check your connection and try again.");
    } finally {
      validating.current = false;
      setSubmitting(false);
    }
  };

  const errorId = (field) => `signup-${field}-error`;

  return (
    <div className="login-screen signup-screen">
      <div className="login-visual">
        <div className="login-visual-top">
          <div className="brand">
            <span className="brand-mark">ST</span>
            <span>StudyTrack</span>
          </div>
        </div>
        <div className="login-visual-copy">
          <div className="eyebrow">YOUR STUDY JOURNEY</div>
          <h1>Build a clearer picture of how you learn.</h1>
          <p>Organize study sessions, subjects, and academic records in one place.</p>
        </div>
        <div className="signup-visual-note">
          <span className="signup-note-mark" aria-hidden="true">✦</span>
          <div>
            <strong>Designed around your progress</strong>
            <p>Your subjects and goals stay personal to your profile.</p>
          </div>
        </div>
      </div>

      <div className="login-form-side signup-form-side">
        <svg className="signup-atmosphere" viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="signup-piece-fill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity=".2" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity=".07" />
            </linearGradient>
            <linearGradient id="signup-piece-stroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7dd3fc" stopOpacity=".62" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity=".22" />
            </linearGradient>
            <pattern id="signup-grid" width="44" height="44" patternUnits="userSpaceOnUse">
              <path d="M44 0H0V44" fill="none" stroke="#7dd3fc" strokeOpacity=".045" strokeWidth="1" />
            </pattern>
            <filter id="signup-piece-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <rect width="800" height="900" fill="url(#signup-grid)" />
          <g className="signup-orb signup-orb-one"><circle cx="150" cy="180" r="160" fill="#0284c7" fillOpacity=".09" /></g>
          <g className="signup-orb signup-orb-two"><circle cx="680" cy="730" r="210" fill="#0ea5e9" fillOpacity=".07" /></g>
          <g className="signup-piece signup-piece-one" filter="url(#signup-piece-glow)">
            <path d="M82 18H120C115 -3 151 -3 146 18H184Q194 18 194 28V66C215 61 215 97 194 92V130Q194 140 184 140H146C151 161 115 161 120 140H82Q72 140 72 130V92C51 97 51 61 72 66V28Q72 18 82 18Z" fill="url(#signup-piece-fill)" stroke="url(#signup-piece-stroke)" strokeWidth="2" />
          </g>
          <g className="signup-piece signup-piece-two" filter="url(#signup-piece-glow)">
            <path d="M82 18H120C115 -3 151 -3 146 18H184Q194 18 194 28V66C215 61 215 97 194 92V130Q194 140 184 140H146C151 161 115 161 120 140H82Q72 140 72 130V92C51 97 51 61 72 66V28Q72 18 82 18Z" fill="url(#signup-piece-fill)" stroke="url(#signup-piece-stroke)" strokeWidth="2" />
          </g>
          <g className="signup-piece signup-piece-three" filter="url(#signup-piece-glow)">
            <path d="M82 18H120C115 -3 151 -3 146 18H184Q194 18 194 28V66C215 61 215 97 194 92V130Q194 140 184 140H146C151 161 115 161 120 140H82Q72 140 72 130V92C51 97 51 61 72 66V28Q72 18 82 18Z" fill="url(#signup-piece-fill)" stroke="url(#signup-piece-stroke)" strokeWidth="2" />
          </g>
          <g className="signup-particles" fill="#7dd3fc">
            <circle cx="154" cy="392" r="2.5" />
            <circle cx="690" cy="280" r="2" />
            <circle cx="586" cy="600" r="2.5" />
            <circle cx="240" cy="740" r="1.8" />
            <circle cx="730" cy="480" r="1.6" />
          </g>
        </svg>
        <section className="login-card card signup-card" aria-labelledby="signup-title">
          <div className="login-copy">
            <div className="eyebrow">GET STARTED</div>
            <h1 id="signup-title">Create your account</h1>
            <p className="muted">Set up your StudyTrack profile.</p>
          </div>
          {authNotice && <p className="signup-unavailable" role="status">{authNotice}</p>}

          <form className="signup-form" onSubmit={handleSubmit} noValidate>
            <label htmlFor="signup-name">Full name</label>
            <input
              id="signup-name"
              autoComplete="name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? errorId("name") : undefined}
            />
            {errors.name && <p className="signup-field-error" id={errorId("name")} role="alert">{errors.name}</p>}

            <label htmlFor="signup-email">Student email address</label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? errorId("email") : undefined}
            />
            {errors.email && <p className="signup-field-error" id={errorId("email")} role="alert">{errors.email}</p>}

            <label htmlFor="signup-password">Password</label>
            <div className="signup-password-field">
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? errorId("password") : "signup-password-hint"}
              />
              <button
                type="button"
                className="password-visibility"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >{showPassword ? "Hide" : "Show"}</button>
            </div>
            <p className="signup-field-hint" id="signup-password-hint">
              Use at least {MIN_PASSWORD_LENGTH} characters.
            </p>
            {errors.password && <p className="signup-field-error" id={errorId("password")} role="alert">{errors.password}</p>}

            <label htmlFor="signup-confirm-password">Confirm password</label>
            <div className="signup-password-field">
              <input
                id="signup-confirm-password"
                type={showConfirmation ? "text" : "password"}
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(event) => updateField("confirmPassword", event.target.value)}
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? errorId("confirmPassword") : undefined}
              />
              <button
                type="button"
                className="password-visibility"
                aria-label={showConfirmation ? "Hide confirmation" : "Show confirmation"}
                aria-pressed={showConfirmation}
                onClick={() => setShowConfirmation((visible) => !visible)}
              >{showConfirmation ? "Hide" : "Show"}</button>
            </div>
            {errors.confirmPassword && (
              <p className="signup-field-error" id={errorId("confirmPassword")} role="alert">{errors.confirmPassword}</p>
            )}

            {unavailable && (
              <p className="signup-unavailable" role="status">
                Supabase Auth is not configured. Your information was not saved, and no account was created.
              </p>
            )}
            {authError && <p className="signup-field-error" role="alert">{authError}</p>}
            {confirmationMessage && <p className="signup-confirmation" role="status">{confirmationMessage}</p>}
            <button type="submit" className="btn-primary signup-submit" disabled={submitting}>
              {submitting ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="auth-switch signup-login-link">
            Already have an account?{" "}
            <button type="button" className="auth-link" onClick={onBackToLogin}>Log In</button>
          </p>
        </section>
      </div>
    </div>
  );
}
