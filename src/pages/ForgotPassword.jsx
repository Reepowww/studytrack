import { useState } from "react";
import { supabase } from "../lib/supabase.js";

export default function ForgotPassword({ onBackToLogin }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [pending, setPending] = useState(false);

  const sendReset = async (event) => {
    event.preventDefault();
    if (!supabase) {
      setMessage({ type: "error", text: "Password reset is unavailable because Supabase Auth is not configured." });
      return;
    }
    setPending(true);
    setMessage(null);
    try {
      const redirectTo = new URL(import.meta.env.BASE_URL, window.location.origin).toString();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) throw error;
      setMessage({
        type: "success",
        text: "If an account exists for that email, password reset instructions have been sent.",
      });
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Could not send reset instructions. Please try again." });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-form-side">
        <section className="login-card card">
          <div className="login-copy">
            <div className="eyebrow">ACCOUNT RECOVERY</div>
            <h1>Reset your password</h1>
            <p className="muted">Enter the email address on your StudyTrack account. We’ll send a recovery link if it exists.</p>
          </div>
          <form onSubmit={sendReset}>
            <label htmlFor="reset-email">Email</label>
            <input id="reset-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            {message && <p className={message.type === "error" ? "login-error" : "save-feedback"} role={message.type === "error" ? "alert" : "status"}>{message.text}</p>}
            <button type="submit" className="btn-primary login-button" disabled={pending}>{pending ? "Sending…" : "Send reset link"}</button>
          </form>
          <p className="auth-switch"><button type="button" className="auth-link" onClick={onBackToLogin}>Back to Log In</button></p>
        </section>
      </div>
    </div>
  );
}
