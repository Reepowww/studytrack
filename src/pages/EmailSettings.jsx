import { useEffect, useMemo, useState } from "react";
import {
  getUpcomingFocusPlans,
  loadEmailPreferences,
  saveEmailPreferences,
} from "../data/emailNotifications.js";
import { loadStudentFocusPlans } from "../data/studentData.js";
import { supabase } from "../lib/supabase.js";

const getFunctionErrorMessage = async (error) => {
  const response = error?.context;
  if (response && typeof response.clone === "function") {
    try {
      const body = await response.clone().json();
      if (typeof body?.error === "string" && body.error.trim()) return body.error;
    } catch {
      // The SDK's message remains available when the function response is not JSON.
    }
  }
  return error?.message || "The email request failed. Please try again.";
};

const invokeEmailFunction = async (body) => {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.functions.invoke("send-study-email", { body });
  if (error) throw new Error(await getFunctionErrorMessage(error));
  if (!data || typeof data !== "object") {
    throw new Error("The email service returned an invalid response.");
  }
  return data;
};

export default function EmailSettings({ currentStudent, canSendEmail }) {
  const [preferences, setPreferences] = useState(() => loadEmailPreferences(currentStudent.id));
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [preferenceSaving, setPreferenceSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [pendingType, setPendingType] = useState("");
  const focusPlans = useMemo(
    () => loadStudentFocusPlans(currentStudent.id),
    [currentStudent.id],
  );
  const upcomingFocusPlans = getUpcomingFocusPlans(focusPlans);

  useEffect(() => {
    let active = true;
    setPreferencesLoaded(false);
    if (!canSendEmail || !supabase) {
      setPreferences({ remindersEnabled: false, storageError: false });
      setPreferencesLoaded(true);
      return () => { active = false; };
    }

    invokeEmailFunction({ type: "get_preferences" })
      .then((data) => {
        if (!active) return;
        if (typeof data.remindersEnabled !== "boolean") {
          throw new Error("The email service returned an invalid reminder preference.");
        }
        const cached = saveEmailPreferences(currentStudent.id, data);
        setPreferences({ remindersEnabled: data.remindersEnabled, storageError: !cached });
        setPreferencesLoaded(true);
      })
      .catch(async (error) => {
        if (!active) return;
        setPreferences({ remindersEnabled: false, storageError: false });
        setPreferencesLoaded(true);
        setStatus({
          type: "error",
          message: `The server-side reminder preference could not be loaded. Sending reminders is disabled. ${error instanceof Error ? error.message : await getFunctionErrorMessage(error)}`,
        });
      });

    return () => { active = false; };
  }, [canSendEmail, currentStudent.id]);

  const updatePreference = async (event) => {
    const remindersEnabled = event.target.checked;
    if (!canSendEmail || !preferencesLoaded || preferenceSaving) return;
    setPreferenceSaving(true);
    setStatus({ type: "loading", message: "Saving your reminder preference…" });
    try {
      const data = await invokeEmailFunction({
        type: "set_preferences",
        remindersEnabled,
      });
      if (data.remindersEnabled !== remindersEnabled) {
        throw new Error("The server did not confirm the requested reminder preference.");
      }
      const cached = saveEmailPreferences(currentStudent.id, data);
      setPreferences({ remindersEnabled, storageError: !cached });
      setStatus(cached
        ? {
          type: "success",
          message: remindersEnabled
            ? "Email reminders are enabled for this account."
            : "Email reminders are disabled for this account.",
        }
        : {
          type: "warning",
          message: "The server saved your preference, but this browser could not update its local cache.",
        });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "The reminder preference could not be saved.",
      });
    } finally {
      setPreferenceSaving(false);
    }
  };

  const sendEmail = async (type, payload = {}) => {
    if (!canSendEmail || !supabase || pendingType || preferenceSaving || !preferencesLoaded) return;
    if (type !== "test" && !preferences.remindersEnabled) {
      setStatus({ type: "error", message: "Enable email reminders before sending a study reminder." });
      return;
    }

    setPendingType(type);
    setStatus({ type: "loading", message: "Sending your email request…" });
    try {
      const data = await invokeEmailFunction({ type, ...payload });
      if (data.accepted !== true || typeof data.id !== "string" || !data.id) {
        throw new Error("The email provider did not confirm acceptance. No success was reported.");
      }
      if (type === "ten_day" && data.cooldownRecorded !== true) {
        setStatus({
          type: "warning",
          message: `Resend accepted this email (ID: ${data.id}), but the server could not confirm the 10-day cooldown. ${typeof data.message === "string" ? data.message : ""}`,
        });
        return;
      }
      setStatus({
        type: "success",
        message: `Resend accepted your email request (ID: ${data.id}). This confirms provider acceptance, not inbox delivery.`,
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "The email request failed. Please try again.",
      });
    } finally {
      setPendingType("");
    }
  };

  const sendFocusReminder = (plan) => {
    void sendEmail("focus", {
      subject: plan.subject,
      topic: plan.topic,
      date: plan.date,
    });
  };

  return (
    <div className="page-enter">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow">Email</div>
          <h1>Email reminders</h1>
          <p className="muted">Manage your preference and request a personalized email when you choose.</p>
        </div>
      </div>

      <div className="notice-banner">
        Emails are sent only after you choose an action. StudyTrack does not send scheduled reminders; study sessions and focus plans are stored in this browser.
      </div>

      {!canSendEmail && (
        <div className="notice-banner" role="status">
          Email delivery is available only for a signed-in Supabase account. Demo profiles remain local and cannot send email.
        </div>
      )}

      <section className="card email-preference-card" aria-labelledby="email-preference-title">
        <div className="card-heading">
          <div>
            <h4 id="email-preference-title">Notification preference</h4>
            <span className="muted">Stored and enforced server-side for this account. This does not enable automatic scheduling.</span>
          </div>
        </div>
        <label className="email-toggle">
          <input
            type="checkbox"
            checked={preferences.remindersEnabled}
            onChange={updatePreference}
            disabled={!canSendEmail || !preferencesLoaded || preferenceSaving}
          />
          <span>Enable user-triggered study reminder emails</span>
        </label>
        {!preferencesLoaded && canSendEmail && (
          <p className="email-delivery-status" role="status">Loading your server-side preference…</p>
        )}
        {preferences.storageError && (
          <p className="email-warning" role="status">The server preference is active, but its local browser cache could not be saved.</p>
        )}
      </section>

      <div className="grid grid-2 email-action-grid">
        <section className="card" aria-labelledby="study-checkin-title">
          <div className="card-heading">
            <div>
              <h4 id="study-checkin-title">Personalized academic check-in</h4>
              <span className="muted">Uses current, previous, and target grades read from your authenticated Supabase records.</span>
            </div>
          </div>
          <p className="email-data-summary">
            Study sessions and streaks are local to this browser and are not included in this server-generated email.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => void sendEmail("study_checkin")}
            disabled={!canSendEmail || !preferencesLoaded || !preferences.remindersEnabled || preferenceSaving || Boolean(pendingType)}
          >{pendingType === "study_checkin" ? "Sending…" : "Send Personalized Check-In"}</button>
        </section>

        <section className="card" aria-labelledby="test-email-title">
          <div className="card-heading">
            <div>
              <h4 id="test-email-title">Test email</h4>
              <span className="muted">Sends a formatted test message to the authenticated account email.</span>
            </div>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => void sendEmail("test")}
            disabled={!canSendEmail || !preferencesLoaded || Boolean(pendingType) || preferenceSaving}
          >{pendingType === "test" ? "Sending…" : "Send Test Email"}</button>
        </section>

        <section className="card" aria-labelledby="weak-subject-title">
          <div className="card-heading">
            <div>
              <h4 id="weak-subject-title">Subject to review</h4>
              <span className="muted">The server selects the lowest valid current grade from your saved Supabase records.</span>
            </div>
          </div>
          <p className="email-data-summary">Grade details in the email are read server-side; client-submitted academic values are ignored.</p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => void sendEmail("weak_subject")}
            disabled={!canSendEmail || !preferencesLoaded || !preferences.remindersEnabled || preferenceSaving || Boolean(pendingType)}
          >{pendingType === "weak_subject" ? "Sending…" : "Send Subject Reminder"}</button>
        </section>
      </div>

      <section className="card" aria-labelledby="focus-email-title">
        <div className="card-heading">
          <div>
            <h4 id="focus-email-title">Upcoming study focus</h4>
            <span className="muted">Choose a saved focus target to send its subject, topic, and date.</span>
          </div>
        </div>
        {upcomingFocusPlans.length ? (
          <div className="saved-focus-list">
            {upcomingFocusPlans.map((plan) => (
              <div className="saved-focus" key={plan.id || `${plan.subject}-${plan.topic}-${plan.date}`}>
                <span><b>{plan.subject}:</b> {plan.topic}</span>
                <span>{plan.date}</span>
                <button
                  type="button"
                  className="btn-secondary-light"
                  onClick={() => sendFocusReminder(plan)}
                  disabled={!canSendEmail || !preferencesLoaded || !preferences.remindersEnabled || preferenceSaving || Boolean(pendingType)}
                >{pendingType === "focus" ? "Sending…" : "Send reminder"}</button>
              </div>
            ))}
          </div>
        ) : <p className="email-data-summary">No upcoming study-focus dates are saved on this browser.</p>}
      </section>

      <section className="card" aria-labelledby="ten-day-email-title">
        <div className="card-heading">
          <div>
            <h4 id="ten-day-email-title">10-day study check-in</h4>
            <span className="muted">The server uses your lowest recorded current grades and enforces a 10-day account-wide cooldown.</span>
          </div>
        </div>
        <p className="email-data-summary">The reminder is generated from Supabase academic records; localStorage is not used for duplicate prevention.</p>
        <button
          type="button"
          className="btn-primary"
          onClick={() => void sendEmail("ten_day")}
          disabled={!canSendEmail || !preferencesLoaded || !preferences.remindersEnabled || preferenceSaving || Boolean(pendingType)}
        >{pendingType === "ten_day" ? "Sending…" : "Send 10-Day Check-In"}</button>
      </section>

      {status && (
        <p
          className={status.type === "success" ? "save-feedback"
            : status.type === "loading" ? "email-delivery-status"
              : status.type === "warning" ? "email-warning" : "form-error"}
          role={status.type === "error" ? "alert" : "status"}
          aria-live="polite"
        >{status.message}</p>
      )}
    </div>
  );
}
