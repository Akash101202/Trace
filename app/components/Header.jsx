"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { useTraceTheme } from "./ThemeProvider";

const PATHS = {
  reset: (
    <>
      <path d="M3 11a9 9 0 1 1 2.6 6.4" />
      <path d="M3 4v7h7" />
    </>
  ),
  play: <path d="M7 4.8v14.4a1 1 0 0 0 1.5.86l11.6-7.2a1 1 0 0 0 0-1.72L8.5 3.94A1 1 0 0 0 7 4.8Z" fill="currentColor" stroke="none" />,
  pause: (
    <>
      <rect x="6" y="4" width="4" height="16" rx="1.4" fill="currentColor" stroke="none" />
      <rect x="14" y="4" width="4" height="16" rx="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  next: (
    <>
      <path d="M5 5.6v12.8a.9.9 0 0 0 1.4.76l9.4-6.4a.9.9 0 0 0 0-1.52L6.4 4.84A.9.9 0 0 0 5 5.6Z" fill="currentColor" stroke="none" />
      <rect x="17.5" y="5" width="2.4" height="14" rx="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  back: (
    <>
      <path d="M19 5.6v12.8a.9.9 0 0 1-1.4.76l-9.4-6.4a.9.9 0 0 1 0-1.52l9.4-6.4A.9.9 0 0 1 19 5.6Z" fill="currentColor" stroke="none" />
      <rect x="4.1" y="5" width="2.4" height="14" rx="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  debug: (
    <>
      <path d="M9 8 7 6M15 8l2-2M8 13H4M20 13h-4M8 18l-2 2M16 18l2 2" />
      <rect x="8" y="7" width="8" height="12" rx="4" />
      <path d="M12 4v3M10 4h4" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
    </>
  ),
  moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />,
};

function Icon({ name, size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

const segment =
  "trace-press flex h-9 w-10 items-center justify-center rounded-full text-trace-text " +
  "hover:bg-trace-surface-hover disabled:pointer-events-none disabled:opacity-30";

export default function Header({
  onRun,
  onDebug,
  onStep,
  onStepBack,
  onReset,
  onTogglePlayback,
  canStep,
  canBack,
  canPlay,
  isPlaying,
  debugMode,
  stepLabel,
}) {
  const { theme, toggleTheme } = useTraceTheme();
  const isDark = theme === "dark";
  const transportRef = useRef(null);

  // Playback controls spring in when debugging starts.
  useEffect(() => {
    if (!debugMode || !transportRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = animate(transportRef.current, {
      opacity: [0, 1],
      scale: [0.9, 1],
      duration: 520,
      ease: "outBack(1.8)",
    });
    return () => animation.revert();
  }, [debugMode]);

  return (
    <header className="trace-glass sticky top-0 z-30 border-b border-trace-border/70">
      <div className="trace-signature h-[3px]" aria-hidden="true" />
      <div className="mx-auto flex h-[61px] w-full max-w-[1920px] items-center gap-3 px-3 sm:px-5">
        {/* Brand */}
        <div className="flex min-w-0 shrink-0 items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#F5D76E] to-[#A47B19] text-[17px] font-black text-[#211907] shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.5)]">
            T
          </div>
          <h1 className="hidden font-display text-[18px] font-bold tracking-[0.06em] text-trace-text sm:block">
            TRACE
          </h1>
        </div>

        {/* Playback (debug mode) */}
        <div className="flex flex-1 justify-center">
          {debugMode && (
            <div ref={transportRef} className="flex items-center gap-2">
              <div
                role="group"
                aria-label="Playback"
                className="flex items-center gap-0.5 rounded-full bg-trace-surface p-[3px] shadow-[inset_0_0_0_0.5px_var(--trace-border-strong)]"
              >
                <button type="button" onClick={onStepBack} disabled={!canBack || isPlaying} className={segment} aria-label="Previous step" title="Previous step (←)">
                  <Icon name="back" size={15} />
                </button>
                <button
                  type="button"
                  onClick={onTogglePlayback}
                  disabled={!canPlay && !isPlaying}
                  className={`${segment} w-11 bg-trace-panel shadow-[0_1px_3px_rgba(0,0,0,0.15)] hover:bg-trace-panel`}
                  aria-label={isPlaying ? "Pause playback" : "Play playback"}
                  title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                >
                  <Icon name={isPlaying ? "pause" : "play"} size={16} />
                </button>
                <button type="button" onClick={onStep} disabled={!canStep || isPlaying} className={segment} aria-label="Next execution step" title="Next step (→)">
                  <Icon name="next" size={15} />
                </button>
              </div>
              {stepLabel && (
                <span className="hidden font-mono text-[13px] tabular-nums text-trace-text-subtle md:inline">
                  {stepLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onReset}
            className="trace-press flex h-9 w-9 items-center justify-center rounded-full text-trace-text-muted hover:bg-trace-surface hover:text-trace-text"
            aria-label="Reset execution"
            title="Reset execution"
          >
            <Icon name="reset" size={17} />
          </button>

          <button
            type="button"
            onClick={onDebug}
            aria-pressed={debugMode}
            className={`trace-press flex h-9 items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold sm:px-4 ${
              debugMode
                ? "bg-trace-violet/25 text-trace-violet ring-1 ring-inset ring-trace-violet shadow-[0_2px_10px_-2px_var(--trace-violet)]"
                : "bg-trace-violet/12 text-trace-violet ring-1 ring-inset ring-trace-violet/35 hover:bg-trace-violet/20"
            }`}
            aria-label="Run with Debug"
            title="Step through from the start (Ctrl+Shift+Enter)"
          >
            <Icon name="debug" size={16} />
            <span className="hidden sm:inline">Debug</span>
          </button>

          <button
            type="button"
            onClick={onRun}
            className="trace-press flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-b from-[#F5D76E] to-trace-brand px-3.5 text-[14px] font-semibold text-trace-brand-ink shadow-[0_2px_12px_-3px_var(--trace-brand)] hover:brightness-105 sm:px-5"
            aria-label="Run program"
            title="Run (Ctrl+Enter)"
          >
            <Icon name="play" size={14} />
            <span className="hidden sm:inline">Run</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="trace-press ml-0.5 flex h-9 w-9 items-center justify-center rounded-full text-trace-text-muted hover:bg-trace-surface hover:text-trace-text"
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
          >
            <Icon name={isDark ? "sun" : "moon"} size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}
