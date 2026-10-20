import { useState } from "react";
import { students } from "../data/students.js";
import { supabase } from "../lib/supabase.js";

export default function Login({ onLogin, onSignUp, onSupabaseAuth, authNotice }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const match = students.find(
      (s) => s.email === email.trim().toLowerCase() && s.password === password
    );
    if (match) {
      setError("");
      setLoading(true);
      setTimeout(() => onLogin(match), 600);
      return;
    }

    if (!supabase) {
      setError("Supabase Auth is not configured. Demo account login is still available.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(signInError.message || "Unable to sign in. Check your details and try again.");
      } else if (data.user) {
        onSupabaseAuth(data.user);
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } catch {
      setError("Unable to reach the sign-in service. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      {/* Left: theme / motion showcase panel */}
      <div className="login-visual">
        <div className="login-visual-top">
          <div className="brand">
            <span className="brand-mark">ST</span>
            <span>StudyTrack</span>
          </div>
        </div>

        <div className="login-visual-copy">
          <div className="eyebrow">STUDY • TRACK • UNDERSTAND</div>
          <h1>See your study habits and grades in one clear view.</h1>
          <p>
            StudyTrack turns logged sessions and grades into simple insights —
            so you know exactly what's working and what needs attention.
          </p>
        </div>

        <div className="login-preview">
          <p className="login-preview-caption">Decorative sample illustration · not student data</p>
          <div className="login-preview-row">
            <div className="login-preview-chip">
              <div className="lp-label">Weekly Hours</div>
              <div className="lp-value">14.5 hrs</div>
            </div>
            <div className="login-preview-chip" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div className="lp-label">Study Streak</div>
                <div className="lp-value">6 days</div>
              </div>
              <div className="login-preview-gauge"><span>93%</span></div>
            </div>
          </div>
          <div className="login-preview-chip login-graph-panel">
            <div className="lp-label">Illustrative progress trend</div>
            <svg
              className="login-progress-graph"
              viewBox="0 0 600 150"
              preserveAspectRatio="none"
              role="img"
              aria-label="Decorative rising line illustration, not student data"
            >
              <defs>
                <linearGradient id="progress-line-gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
                <linearGradient id="progress-area-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity=".24" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path className="login-graph-grid" d="M0 30H600 M0 75H600 M0 120H600" />
              <path
                className="login-graph-area"
                d="M0 124 C45 118 57 105 96 108 S154 92 192 96 S245 70 288 81 S350 58 384 65 S445 38 480 49 S550 23 600 18 L600 150 L0 150 Z"
              />
              <path
                className="login-graph-glow"
                d="M0 124 C45 118 57 105 96 108 S154 92 192 96 S245 70 288 81 S350 58 384 65 S445 38 480 49 S550 23 600 18"
              />
              <path
                className="login-graph-line"
                pathLength="1"
                d="M0 124 C45 118 57 105 96 108 S154 92 192 96 S245 70 288 81 S350 58 384 65 S445 38 480 49 S550 23 600 18"
              />
              <circle className="login-graph-endpoint" r="5">
                <animateMotion
                  dur="4.42s"
                  repeatCount="indefinite"
                  path="M0 124 C45 118 57 105 96 108 S154 92 192 96 S245 70 288 81 S350 58 384 65 S445 38 480 49 S550 23 600 18"
                />
              </circle>
            </svg>
            <p className="login-graph-disclaimer">Decorative illustration only · not actual student progress</p>
          </div>
        </div>
      </div>

      {/* Right: login form (interaction pattern from reference 1) */}
      <div className="login-form-side">
        <div className="login-card card">
          <div className="login-copy">
            <div className="eyebrow">Welcome back</div>
            <h1>Log in to StudyTrack</h1>
            <p className="muted">Enter your credentials to view your dashboard.</p>
          </div>
          {authNotice && <p className="login-error" role="status">{authNotice}</p>}
          <form onSubmit={handleSubmit}>
            <label>Email</label>
            <input
              type="email"
              placeholder="yourname@studytrack.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="btn-primary login-button" disabled={loading}>
              {loading && <span className="spinner" />}
              {loading ? "Logging in…" : "Log In"}
            </button>
          </form>
          <p className="auth-switch">
            New to StudyTrack?{" "}
            <button type="button" className="auth-link" onClick={onSignUp}>Sign Up</button>
          </p>
        </div>
      </div>
    </div>
  );
}
