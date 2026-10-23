import { useState } from "react";
import { MIN_PASSWORD_LENGTH } from "../data/registration.js";
import { supabase } from "../lib/supabase.js";

const ACCOUNT_EMAIL_REDIRECT = () =>
  new URL(import.meta.env.BASE_URL, window.location.origin).toString();

export default function Account({ currentStudent, authProvider, setCurrentStudent, onLogout }) {
  const isAuthenticated = authProvider === "supabase";
  const [name, setName] = useState(currentStudent.name || "");
  const [nameMessage, setNameMessage] = useState(null);
  const [email, setEmail] = useState(currentStudent.email || "");
  const [emailMessage, setEmailMessage] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [pending, setPending] = useState("");

  const saveName = async (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameMessage({ type: "error", text: "Enter a display name." });
      return;
    }
    if (!isAuthenticated || !supabase) {
      setNameMessage({ type: "error", text: "Display name changes require a signed-in StudyTrack account." });
      return;
    }
    setPending("name");
    setNameMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: trimmedName } });
      if (error) throw error;
      setCurrentStudent((student) => ({ ...student, name: trimmedName }));
      setName(trimmedName);
      setNameMessage({ type: "success", text: "Display name updated." });
    } catch (error) {
      setNameMessage({ type: "error", text: error.message || "Could not update your display name. Try again." });
    } finally {
      setPending("");
    }
  };

  const requestEmailChange = async (event) => {
    event.preventDefault();
    const nextEmail = email.trim();
    if (!nextEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      setEmailMessage({ type: "error", text: "Enter a valid email address." });
      return;
    }
    if (nextEmail.toLowerCase() === (currentStudent.email || "").toLowerCase()) {
      setEmailMessage({ type: "error", text: "Enter an email address different from your current one." });
      return;
    }
    if (!isAuthenticated || !supabase) {
      setEmailMessage({ type: "error", text: "Email changes require a signed-in StudyTrack account." });
      return;
    }
    setPending("email");
    setEmailMessage(null);
    try {
      const { error } = await supabase.auth.updateUser(
        { email: nextEmail },
        { emailRedirectTo: ACCOUNT_EMAIL_REDIRECT() },
      );
      if (error) throw error;
      setEmailMessage({
        type: "success",
        text: "Confirmation instructions were sent. Your account email will change after the required confirmation is complete.",
      });
    } catch (error) {
      setEmailMessage({ type: "error", text: error.message || "Could not request an email change. Try again." });
    } finally {
      setPending("");
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordMessage({ type: "error", text: `Use at least ${MIN_PASSWORD_LENGTH} characters.` });
      return;
    }
    if (password !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "The passwords do not match." });
      return;
    }
    if (!isAuthenticated || !supabase) {
      setPasswordMessage({ type: "error", text: "Password changes require a signed-in StudyTrack account." });
      return;
    }
    setPending("password");
    setPasswordMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setConfirmPassword("");
      setPasswordMessage({ type: "success", text: "Password updated." });
    } catch (error) {
      setPasswordMessage({ type: "error", text: error.message || "Could not update your password. Try again." });
    } finally {
      setPending("");
    }
  };

  const sendPasswordReset = async () => {
    if (!currentStudent.email || !supabase) {
      setPasswordMessage({ type: "error", text: "Password reset is unavailable because Supabase Auth is not configured." });
      return;
    }
    setPending("reset");
    setPasswordMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(currentStudent.email, {
        redirectTo: ACCOUNT_EMAIL_REDIRECT(),
      });
      if (error) throw error;
      setPasswordMessage({
        type: "success",
        text: `If an account exists for ${currentStudent.email}, password reset instructions have been sent.`,
      });
    } catch (error) {
      setPasswordMessage({ type: "error", text: error.message || "Could not send password reset instructions. Try again." });
    } finally {
      setPending("");
    }
  };

  return (
    <div className="page-enter">
      <div className="page-heading-row">
        <div><div className="eyebrow">PROFILE &amp; SECURITY</div><h1>Account</h1><p className="muted">Manage your profile and sign-in details.</p></div>
        <div className="page-pill">{isAuthenticated ? "StudyTrack account" : "Demo profile"}</div>
      </div>

      {!isAuthenticated && (
        <div className="notice-banner">
          <b>This is a demo profile.</b> Demo profiles are local examples and don’t have real email addresses or passwords to change. Create or sign in to a StudyTrack account to manage those details.
        </div>
      )}

      <section className="card account-section">
        <div className="card-heading"><div><h4>Profile</h4><span className="muted">Your name shown in StudyTrack.</span></div></div>
        <form className="account-form" onSubmit={saveName}>
          <label htmlFor="account-name">Display name</label>
          <input id="account-name" value={name} onChange={(event) => setName(event.target.value)} disabled={!isAuthenticated || pending === "name"} maxLength={100} required />
          <button type="submit" className="btn-primary" disabled={!isAuthenticated || Boolean(pending)}>Save name</button>
        </form>
        {nameMessage && <p className={nameMessage.type === "error" ? "form-error" : "save-feedback"} role={nameMessage.type === "error" ? "alert" : "status"}>{nameMessage.text}</p>}
      </section>

      <section className="card account-section">
        <div className="card-heading"><div><h4>Email address</h4><span className="muted">Changing your email requires confirmation through Supabase Auth.</span></div></div>
        <form className="account-form" onSubmit={requestEmailChange}>
          <label htmlFor="account-current-email">Current email</label>
          <input id="account-current-email" type="email" value={currentStudent.email || ""} readOnly />
          <label htmlFor="account-new-email">New email</label>
          <input id="account-new-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={!isAuthenticated || pending === "email"} required />
          <button type="submit" className="btn-primary" disabled={!isAuthenticated || Boolean(pending)}>Request email change</button>
        </form>
        {emailMessage && <p className={emailMessage.type === "error" ? "form-error" : "save-feedback"} role={emailMessage.type === "error" ? "alert" : "status"}>{emailMessage.text}</p>}
      </section>

      <section className="card account-section">
        <div className="card-heading"><div><h4>Password</h4><span className="muted">Use at least {MIN_PASSWORD_LENGTH} characters for a new password.</span></div></div>
        <form className="account-form" onSubmit={changePassword}>
          <label htmlFor="account-new-password">New password</label>
          <input id="account-new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={MIN_PASSWORD_LENGTH} disabled={!isAuthenticated || pending === "password"} required />
          <label htmlFor="account-confirm-password">Confirm new password</label>
          <input id="account-confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={MIN_PASSWORD_LENGTH} disabled={!isAuthenticated || pending === "password"} required />
          <div className="account-actions">
            <button type="submit" className="btn-primary" disabled={!isAuthenticated || Boolean(pending)}>{pending === "password" ? "Updating…" : "Update password"}</button>
            <button type="button" className="btn-secondary-light" onClick={sendPasswordReset} disabled={!isAuthenticated || Boolean(pending)}>{pending === "reset" ? "Sending…" : "Send password reset email"}</button>
          </div>
        </form>
        {passwordMessage && <p className={passwordMessage.type === "error" ? "form-error" : "save-feedback"} role={passwordMessage.type === "error" ? "alert" : "status"}>{passwordMessage.text}</p>}
      </section>

      <section className="card account-section">
        <div className="card-heading"><div><h4>Where your data is saved</h4><span className="muted">StudyTrack uses different storage for account and demo profiles.</span></div></div>
        {isAuthenticated ? (
          <ul className="account-data-list">
            <li>Subjects, grades, targets, academic periods, and study sessions sync to your Supabase account.</li>
            <li>Timer state, focus reminders, onboarding progress, and some habit summaries are stored in this browser and may not follow you to another device.</li>
          </ul>
        ) : (
          <p className="muted">Demo profile data is stored in this browser only and does not sync to an online account.</p>
        )}
      </section>

      <section className="card account-section account-signout">
        <div><h4>Sign out</h4><p className="muted">You can sign back in at any time.</p></div>
        <button type="button" className="btn-secondary" onClick={onLogout}>Log Out</button>
      </section>
    </div>
  );
}
