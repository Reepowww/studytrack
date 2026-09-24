import { useState } from "react";
import { students } from "../data/students.js";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const match = students.find(
      (s) => s.email === email.trim().toLowerCase() && s.password === password
    );
    if (match) {
      setError("");
      onLogin(match);
    } else {
      setError("Incorrect email or password.");
    }
  };

  return (
    <div className="login-screen">
      <div className="login-glow" />
      <div className="login-card card">
        <div className="login-brand">
          <span className="brand-mark">ST</span>
          <div><b>StudyTrack</b><span>Student research prototype</span></div>
        </div>
        <div className="login-copy">
          <div className="eyebrow">STUDY • TRACK • UNDERSTAND</div>
          <h1>Keep your study data in one place.</h1>
          <p className="muted">Record study habits, review academic performance, and explore patterns in your data.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input type="email" placeholder="yourname@studytrack.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label>Password</label>
          <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p style={{ color: "var(--danger)", fontSize: 12, margin: "8px 0 0" }}>{error}</p>}
          <button type="submit" className="btn-primary login-button">Log In</button>
        </form>
        <div className="login-note" style={{ marginTop: 18 }}>
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
  );
}
