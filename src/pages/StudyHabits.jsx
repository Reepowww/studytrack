import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { methods, averageSessionDuration, getMostStudiedSubject, sessionHours } from "../data/students.js";
import { getStudentSubjects } from "../data/studentData.js";
import { formatStudyTimerElapsed, getStudyTimerElapsedMs, restoreStudyTimer } from "../data/studyTimer.js";

const formatSessionDate = (date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function StudyHabits({ currentStudent, setCurrentStudent, setPage }) {
  const subjects = getStudentSubjects(currentStudent);
  const defaultSubject = subjects[0] || "";
  const [form, setForm] = useState({ subject: defaultSubject, duration: 60, method: methods[0], focus: 3 });
  const timerStorageKey = `studytrack:timer:${currentStudent.id}`;
  const [timer, setTimer] = useState(() => {
    try {
      return restoreStudyTimer(JSON.parse(localStorage.getItem(timerStorageKey) || "null"));
    } catch {
      return null;
    }
  });
  const [timerNow, setTimerNow] = useState(Date.now);
  const [timerMessage, setTimerMessage] = useState("");
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [deleteSessionId, setDeleteSessionId] = useState(null);
  const [saveMessage, setSaveMessage] = useState("");
  const sessions = Array.isArray(currentStudent.sessions)
    ? currentStudent.sessions.filter((session) => session && typeof session === "object")
    : [];
  const isEditing = editingSessionId !== null;

  useEffect(() => {
    if (form.subject !== defaultSubject && !subjects.includes(form.subject) && !isEditing) {
      setForm((current) => ({ ...current, subject: defaultSubject }));
    }
  }, [subjects, defaultSubject, form.subject, isEditing]);

  const methodData = useMemo(() => {
    const counts = {};
    sessions.forEach((session) => {
      if (typeof session.method === "string" && session.method.trim()) {
        counts[session.method] = (counts[session.method] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([method, count]) => ({ method, count }));
  }, [sessions]);

  const focusValues = sessions.map((session) => Number(session?.focus))
    .filter((focus, index) => Number.isFinite(focus) && focus >= 1 && focus <= 5
      && sessions[index]?.focus !== "");
  const hasDurationData = sessions.some((session) => session.duration !== null
    && session.duration !== undefined && session.duration !== ""
    && Number.isFinite(Number(session.duration)) && Number(session.duration) > 0);
  const avgFocus = focusValues.length ? focusValues.reduce((total, focus) => total + focus, 0) / focusValues.length : null;
  const mostStudied = getMostStudiedSubject(sessions);
  const timerElapsedMs = timer ? getStudyTimerElapsedMs(timer, timerNow) : 0;

  useEffect(() => {
    if (!timer) return undefined;
    try {
      localStorage.setItem(timerStorageKey, JSON.stringify(timer));
    } catch {
      setTimerMessage("Timer storage is unavailable. Keep this tab open or your timer may be lost.");
    }
    return undefined;
  }, [timer, timerStorageKey]);

  useEffect(() => {
    if (timer?.recovered) {
      setTimerMessage("An unfinished timer was restored as paused. Resume it or finish and save the session.");
      setTimer((current) => current ? { ...current, recovered: false } : current);
    }
  }, [timer?.recovered]);

  useEffect(() => {
    if (!timer || timer.status !== "running") return undefined;
    const updateTimer = () => {
      const now = Date.now();
      setTimerNow(now);
      try {
        localStorage.setItem(timerStorageKey, JSON.stringify({
          ...timer,
          accumulatedMs: getStudyTimerElapsedMs(timer, now),
          runningSince: now,
        }));
      } catch {
        setTimerMessage("Timer storage is unavailable. Keep this tab open or your timer may be lost.");
      }
    };
    const interval = window.setInterval(updateTimer, 1000);
    window.addEventListener("focus", updateTimer);
    document.addEventListener("visibilitychange", updateTimer);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", updateTimer);
      document.removeEventListener("visibilitychange", updateTimer);
    };
  }, [timer, timerStorageKey]);

  useEffect(() => {
    const restoreOnPageShow = () => {
      try {
        const savedTimer = restoreStudyTimer(JSON.parse(localStorage.getItem(timerStorageKey) || "null"));
        if (savedTimer?.status === "paused") {
          setTimer(savedTimer);
          setTimerNow(Date.now());
        }
      } catch {
        setTimerMessage("Could not restore the timer from browser storage.");
      }
    };
    window.addEventListener("pageshow", restoreOnPageShow);
    return () => window.removeEventListener("pageshow", restoreOnPageShow);
  }, [timerStorageKey]);

  useEffect(() => {
    if (!timer || timer.status !== "running") return undefined;
    const pauseOnPageExit = () => {
      const now = Date.now();
      const pausedTimer = {
        ...timer,
        status: "paused",
        accumulatedMs: getStudyTimerElapsedMs(timer, now),
        runningSince: null,
        recovered: false,
      };
      try {
        localStorage.setItem(timerStorageKey, JSON.stringify(pausedTimer));
      } catch {
        setTimerMessage("Timer storage is unavailable. The timer may not be recoverable if you close this page.");
      }
    };
    window.addEventListener("pagehide", pauseOnPageExit);
    return () => window.removeEventListener("pagehide", pauseOnPageExit);
  }, [timer, timerStorageKey]);

  const startTimer = () => {
    const focus = Number(form.focus);
    if (!form.subject || !subjects.includes(form.subject)
      || !methods.includes(form.method) || !Number.isFinite(focus) || focus < 1 || focus > 5) return;
    const now = Date.now();
    setTimer({
      subject: form.subject,
      method: form.method,
      focus,
      status: "running",
      accumulatedMs: 0,
      runningSince: now,
      startedAt: now,
      recovered: false,
    });
    setTimerNow(Date.now());
    setTimerMessage("");
  };

  const pauseTimer = () => {
    if (!timer || timer.status !== "running") return;
    const now = Date.now();
    setTimer({
      ...timer,
      status: "paused",
      accumulatedMs: getStudyTimerElapsedMs(timer, now),
      runningSince: null,
      recovered: false,
    });
    setTimerNow(now);
  };

  const resumeTimer = () => {
    if (!timer || timer.status !== "paused") return;
    setTimer({ ...timer, status: "running", runningSince: Date.now(), recovered: false });
    setTimerNow(Date.now());
    setTimerMessage("");
  };

  const finishTimer = () => {
    if (!timer) return;
    if (!subjects.includes(timer.subject)) {
      setTimerMessage("This timer's subject was removed. Delete the timer and choose an available subject.");
      return;
    }
    const duration = Math.max(1, Math.round(getStudyTimerElapsedMs(timer) / 60_000));
    const startedAt = new Date(timer.startedAt || Date.now());
    const today = `${startedAt.getFullYear()}-${String(startedAt.getMonth() + 1).padStart(2, "0")}-${String(startedAt.getDate()).padStart(2, "0")}`;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newSession = {
      id,
      date: today,
      subject: timer.subject,
      duration,
      method: timer.method,
      focus: timer.focus,
    };
    try {
      localStorage.removeItem(timerStorageKey);
    } catch {
      setTimerMessage("Could not clear the timer from browser storage, so the session was not saved. Please retry.");
      return;
    }
    setCurrentStudent((student) => ({
      ...student,
      sessions: [newSession, ...(Array.isArray(student.sessions) ? student.sessions : [])],
    }));
    setTimerMessage(`Study session saved: ${timer.subject}, ${duration} min.`);
    setTimer(null);
  };

  const discardTimer = () => {
    try {
      localStorage.removeItem(timerStorageKey);
      setTimerMessage("Timer discarded without saving a study session.");
    } catch {
      setTimerMessage("Could not clear the timer from browser storage.");
      return;
    }
    setTimer(null);
  };

  const saveSession = (event) => {
    event.preventDefault();
    const duration = Number(form.duration);
    const focus = Number(form.focus);
    if (!form.subject || !subjects.includes(form.subject) || !duration || duration < 5 || focus < 1 || focus > 5) return;

    if (editingSessionId !== null) {
      setCurrentStudent((student) => ({
        ...student,
        sessions: (Array.isArray(student.sessions) ? student.sessions : []).map((session) => session?.id === editingSessionId
          ? { ...session, ...form, duration, focus }
          : session),
      }));
      setEditingSessionId(null);
      setForm({ subject: defaultSubject, duration: 60, method: methods[0], focus: 3 });
      setSaveMessage("Study session updated.");
      return;
    }

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newSession = { id, date: today, ...form, duration, focus };
    setCurrentStudent((student) => ({ ...student, sessions: [newSession, ...(Array.isArray(student.sessions) ? student.sessions : [])] }));
    setForm({ subject: defaultSubject, duration: 60, method: methods[0], focus: 3 });
    setSaveMessage("Study session saved.");
  };

  const editSession = (session) => {
    setEditingSessionId(session.id);
    setForm({
      subject: session.subject,
      duration: session.duration,
      method: session.method,
      focus: session.focus,
      date: session.date || "",
    });
  };

  const cancelEditing = () => {
    setEditingSessionId(null);
    setForm({ subject: defaultSubject, duration: 60, method: methods[0], focus: 3 });
  };

  useEffect(() => {
    if (!isEditing) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") cancelEditing();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isEditing]);

  const deleteSession = () => {
    if (deleteSessionId === null) return;
    setCurrentStudent((student) => ({
      ...student,
      sessions: (Array.isArray(student.sessions) ? student.sessions : []).filter((session) => session?.id !== deleteSessionId),
    }));
    setDeleteSessionId(null);
  };

  const renderSessionForm = (editing) => (
    <form onSubmit={saveSession}>
      {editing && (
        <>
          <label htmlFor="session-date">Date</label>
          <input id="session-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
        </>
      )}
      <label htmlFor="session-subject">Subject</label>
      <select id="session-subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required disabled={!subjects.length}>
        {subjects.length ? subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>) : <option value="">Add a subject first</option>}
      </select>
      <label htmlFor="session-duration">Duration (min)</label>
      <input id="session-duration" type="number" min="5" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} required />
      <label htmlFor="session-method">Method</label>
      <select id="session-method" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>{methods.map((method) => <option key={method}>{method}</option>)}</select>
      <label htmlFor="session-focus">Focus Level (1-5)</label>
      <input id="session-focus" type="number" min="1" max="5" value={form.focus} onChange={(e) => setForm({ ...form, focus: e.target.value })} required />
      <div className={editing ? "session-edit-actions" : undefined}>
        <button type="submit" className="btn-primary form-button">{editing ? "Save Changes" : "Add Session"}</button>
        {editing && <button type="button" className="btn-secondary-light form-button" onClick={cancelEditing}>Cancel</button>}
      </div>
    </form>
  );

  return (
    <div className="page-enter">
      <div className="page-heading-row">
        <div><div className="eyebrow">HOW YOU STUDY</div><h1>Study Habits</h1><p className="muted">Record sessions and review the study behaviors currently in your data.</p></div>
        <div className="page-pill">{sessions.length} sessions logged</div>
      </div>

      <div className="card study-timer-card">
        <div className="card-heading">
          <div><h4>Study Timer</h4><span className="muted">Track a study session and save it to your log when you finish.</span></div>
          <span className="chart-badge">{timer?.status === "running" ? "running" : timer?.status === "paused" ? "paused" : "ready"}</span>
        </div>
        <div className="study-timer-controls">
          <div className="study-timer-subject">
            <label htmlFor="study-timer-subject">Subject</label>
            <select
              id="study-timer-subject"
              value={timer?.subject || form.subject}
              onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
              disabled={Boolean(timer) || !subjects.length}
            >
              {subjects.length ? subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>) : <option value="">Add a subject first</option>}
            </select>
          </div>
          <div className="study-timer-subject">
            <label htmlFor="study-timer-method">Study method</label>
            <select
              id="study-timer-method"
              value={timer?.method || form.method}
              onChange={(event) => setForm((current) => ({ ...current, method: event.target.value }))}
              disabled={Boolean(timer)}
            >
              {methods.map((method) => <option key={method} value={method}>{method}</option>)}
            </select>
          </div>
          <div className="study-timer-subject study-timer-focus">
            <label htmlFor="study-timer-focus">Focus (1-5)</label>
            <input
              id="study-timer-focus"
              type="number"
              min="1"
              max="5"
              value={timer?.focus ?? form.focus}
              onChange={(event) => setForm((current) => ({ ...current, focus: event.target.value }))}
              disabled={Boolean(timer)}
            />
          </div>
          <output className="study-timer-display" aria-label="Elapsed study time" aria-live="off">
            {formatStudyTimerElapsed(timerElapsedMs)}
          </output>
          <div className="study-timer-actions">
            {!timer && <button type="button" className="btn-primary" onClick={startTimer} disabled={!subjects.length}>Start</button>}
            {timer?.status === "running" && <button type="button" className="btn-secondary-light" onClick={pauseTimer}>Pause</button>}
            {timer?.status === "paused" && <button type="button" className="btn-primary" onClick={resumeTimer}>Resume</button>}
            {timer && <button type="button" className="btn-primary" onClick={finishTimer}>Stop &amp; Save</button>}
            {timer && <button type="button" className="saved-focus-delete" onClick={discardTimer}>Discard</button>}
          </div>
        </div>
        {timerMessage && <p className={/^(Could not|This timer|Timer storage)/.test(timerMessage) ? "form-error" : "save-feedback"} role={/^(Could not|This timer|Timer storage)/.test(timerMessage) ? "alert" : "status"}>{timerMessage}</p>}
        <p className="study-timer-note">Time is counted only while the timer is running. Leaving or reloading the page pauses it; resume or save it when you return. Durations are rounded to the nearest minute.</p>
      </div>

      <div className="grid grid-4">
        <div className="card stat-card hover-card"><div className="stat-label">Total Sessions</div><div className="stat-value">{sessions.length}</div><div className="stat-sub">recorded</div></div>
        <div className="card stat-card hover-card"><div className="stat-label">Logged Study Time</div><div className="stat-value">{hasDurationData ? `${sessionHours(sessions).toFixed(1)} hrs` : "—"}</div><div className="stat-sub">from sessions</div></div>
        <div className="card stat-card hover-card"><div className="stat-label">Avg. Focus</div><div className="stat-value">{avgFocus === null ? "—" : `${avgFocus.toFixed(1)} / 5`}</div><div className="stat-sub">session ratings</div></div>
        <div className="card stat-card hover-card"><div className="stat-label">Most Studied</div><div className="stat-value">{mostStudied}</div><div className="stat-sub">by logged minutes</div></div>
      </div>

      <div className="grid grid-2">
        {!isEditing && (
          <div className="card form-card">
            <div className="card-heading"><div><h4>Log a Study Session</h4><span className="muted">Add a real session to update your study summary.</span></div></div>
            {subjects.length ? renderSessionForm(false) : <div className="empty-state-note">Add a subject before logging a session. <button type="button" className="inline-link" onClick={() => setPage?.("performance")}>Manage subjects</button></div>}
          </div>
        )}
        <div className="card chart-card">
          <div className="card-heading"><div><h4>Study Method Frequency</h4><span className="muted">How often each method appears in your logs</span></div></div>
          {methodData.length ? <ResponsiveContainer width="100%" height={260}>
            <BarChart data={methodData} layout="vertical" margin={{ left: 12, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis type="number" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="method" fontSize={11} width={110} />
              <Tooltip />
              <Bar dataKey="count" fill="#5b5bd6" radius={[0, 7, 7, 0]} />
            </BarChart>
          </ResponsiveContainer> : <p className="empty-state-note">Log a study session to see your study methods here.</p>}
        </div>
      </div>
      {saveMessage && <p className="save-feedback" role="status" aria-live="polite">{saveMessage}</p>}

      <div className="card table-card">
        <div className="card-heading"><div><h4>Study Sessions</h4><span className="muted">Newest logged sessions appear first.</span></div><span className="chart-badge">live</span></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Subject</th><th>Duration</th><th>Method</th><th>Focus</th><th>Actions</th></tr></thead>
            <tbody>
              {sessions.map((session, index) => (
                <tr key={session.id || `${session.date}-${index}`}>
                  <td>{typeof session.date === "string" ? formatSessionDate(session.date) : "—"}</td><td>{session.subject || "—"}</td>
                  <td>{session.duration !== null && session.duration !== undefined && session.duration !== ""
                    && Number.isFinite(Number(session.duration)) ? `${session.duration} min` : "—"}</td><td>{session.method || "—"}</td>
                  <td>{Number.isInteger(Number(session.focus)) && Number(session.focus) >= 1 && Number(session.focus) <= 5
                    ? <span className="focus-stars" aria-label={`${session.focus} out of 5`}>{"★".repeat(Number(session.focus)) + "☆".repeat(5 - Number(session.focus))}</span>
                    : "—"}</td>
                  <td>
                    {session.id && (
                      <div className="reminder-dialog-actions">
                        <button type="button" className="btn-secondary-light" onClick={() => editSession(session)}>Edit</button>
                        <button type="button" className="saved-focus-delete" onClick={() => setDeleteSessionId(session.id)}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {isEditing && createPortal(
        <div className="reminder-overlay session-edit-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) cancelEditing(); }}>
          <section className="reminder-dialog session-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-session-title">
            <div className="reminder-dialog-topline">
              <div>
                <h3 id="edit-session-title">Edit Study Session</h3>
                <span className="muted">Update the values for this session.</span>
              </div>
              <button type="button" className="reminder-close session-edit-close" onClick={cancelEditing} aria-label="Close edit dialog">×</button>
            </div>
            {renderSessionForm(true)}
          </section>
        </div>,
        document.body,
      )}
      {deleteSessionId !== null && (
        <div className="reminder-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteSessionId(null); }}>
          <section className="reminder-dialog delete-focus-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-session-title">
            <h3 id="delete-session-title">Are you sure you want to delete this entry?</h3>
            <div className="reminder-dialog-actions">
              <button type="button" className="btn-secondary-light" onClick={() => setDeleteSessionId(null)}>Cancel</button>
              <button type="button" className="saved-focus-delete-confirm" onClick={deleteSession}>Delete</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
