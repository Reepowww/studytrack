export const getStudyTimerElapsedMs = (timer, now = Date.now()) => {
  const accumulatedMs = Number.isFinite(timer?.accumulatedMs) && timer.accumulatedMs > 0
    ? timer.accumulatedMs
    : 0;
  if (timer?.status !== "running" || !Number.isFinite(timer.runningSince)) return accumulatedMs;
  return accumulatedMs + Math.max(0, now - timer.runningSince);
};

export const restoreStudyTimer = (savedTimer) => {
  if (!savedTimer || typeof savedTimer !== "object"
    || typeof savedTimer.subject !== "string" || !savedTimer.subject
    || !["running", "paused"].includes(savedTimer.status)
    || !Number.isFinite(savedTimer.accumulatedMs) || savedTimer.accumulatedMs < 0
    || (savedTimer.status === "running" && !Number.isFinite(savedTimer.runningSince))) {
    return null;
  }

  if (savedTimer.status === "running") {
    return {
      ...savedTimer,
      status: "paused",
      runningSince: null,
      recovered: true,
    };
  }
  return { ...savedTimer, recovered: false };
};

export const formatStudyTimerElapsed = (elapsedMs) => {
  const totalSeconds = Math.floor(Math.max(0, elapsedMs) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
};
