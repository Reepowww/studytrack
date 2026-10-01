import { useState } from "react";
import { students } from "../data/students.js";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const match = students.find(
      (s) => s.email === email.trim().toLowerCase() && s.password === password
    );
    if (match) {
      setError("");
      setLoading(true);
      setTimeout(() => onLogin(match), 600);
    } else {
      setError("Incorrect email or password.");
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
          <div className="login-preview-chip">
            <div className="lp-label">Sessions this week</div>
            <div className="login-preview-bars" style={{ marginTop: 8 }}>
              {[40, 65, 30, 80, 55, 90, 60].map((h, i) => (
                <span key={i} style={{ height: `${h}%`, animationDelay: `${i * 0.12}s` }} />
              ))}
            </div>
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
          <div className="login-note">
            <b style={{ color: "var(--text)" }}>Mock credentials</b><br />
            andrey.bael@studytrack.com · andrey123<br />
            bill.griar@studytrack.com · bill123<br />
            cyrus.magbanua@studytrack.com · cyrus123<br />
            justin.laxa@studytrack.com · justin123<br />
            rhenz.indonilla@studytrack.com · rhenz123<br />
            wiley.javier@studytrack.com · wiley123
          </div>
        </div>
      </div>
    </div>
  );
}
