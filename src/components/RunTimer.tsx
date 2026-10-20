"use client";

import { useEffect, useState } from "react";
import { durationText, formatElapsed, nowLocal } from "@/lib/format";
import type { Run } from "@/lib/types";

/** A run can be timed if it hasn't been started yet, or its timer is running now. */
export function canTime(run: Run): boolean {
  return run.timerStartedAt != null || (!run.startTrip && !run.endTrip);
}

/** Returns the run with its timer started, or stopped and its trip times filled in. */
export function toggleTimer(run: Run, now = new Date()): Run {
  if (run.timerStartedAt == null) {
    return { ...run, timerStartedAt: now.getTime(), startTrip: nowLocal(now), endTrip: null };
  }
  const ms = now.getTime() - run.timerStartedAt;
  return {
    ...run,
    timerStartedAt: undefined,
    endTrip: nowLocal(now),
    durationText: durationText(ms),
    durationMinutes: ms / 60000,
    totalHours: Math.round((ms / 3600000) * 100) / 100,
  };
}

/** Elapsed time that re-renders every second while the run is in progress. */
export function LiveElapsed({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return <span className="tabular-nums">{formatElapsed(now - startedAt)}</span>;
}

/** One button that starts the run timer, then ends it. Demo only: nothing is saved. */
export function RunTimerButton({
  run,
  onToggle,
  size = "md",
}: {
  run: Run;
  onToggle: (run: Run) => void;
  size?: "sm" | "md";
}) {
  const running = run.timerStartedAt != null;
  const pad = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation(); // don't expand/collapse the table row
        onToggle(run);
      }}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg font-semibold shadow-sm ${pad} ${
        running ? "bg-red-600 text-white hover:bg-red-700" : "bg-emerald-600 text-white hover:bg-emerald-700"
      }`}
    >
      {running ? (
        <>
          <span className="h-2 w-2 animate-pulse rounded-sm bg-white" aria-hidden />
          End run · <LiveElapsed startedAt={run.timerStartedAt!} />
        </>
      ) : (
        <>
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
            <path d="M1 0.5v9l8-4.5z" fill="currentColor" />
          </svg>
          Start run
        </>
      )}
    </button>
  );
}
