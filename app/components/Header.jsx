"use client";

import { useTraceTheme } from "./ThemeProvider";

function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    reset: (
      <>
        <path d="M3 11a9 9 0 1 1 2.6 6.4" />
        <path d="M3 4v7h7" />
      </>
    ),
    play: <path d="m8 5 12 7-12 7z" fill="currentColor" stroke="none" />,
    pause: (
      <>
        <rect
          x="6"
          y="4"
          width="4"
          height="16"
          rx="1"
          fill="currentColor"
          stroke="none"
        />
        <rect
          x="14"
          y="4"
          width="4"
          height="16"
          rx="1"
          fill="currentColor"
          stroke="none"
        />
      </>
    ),
    next: (
      <>
        <path d="m5 5 11 7-11 7z" fill="currentColor" stroke="none" />
        <path d="M19 5v14" strokeWidth="2.5" />
      </>
    ),
    debug: (
      <>
        <path d="M9 8 7 6M15 8l2-2M8 13H4M20 13h-4M8 18l-2 2M16 18l2 2" />
        <rect x="8" y="7" width="8" height="12" rx="4" />
        <path d="M12 4v3M10 4h4" />
        <circle cx="10.5" cy="11" r=".5" fill="currentColor" />
        <circle cx="13.5" cy="11" r=".5" fill="currentColor" />
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

  return <svg {...common}>{paths[name]}</svg>;
}

export default function Header({
  onRun,
  onDebug,
  onStep,
  onReset,
  onTogglePlayback,
  canStep,
  canPlay,
  isPlaying,
  debugMode,
}) {
  const { theme, toggleTheme } = useTraceTheme();
  const isDark = theme === "dark";

  const iconButton =
    "flex h-10 w-10 items-center justify-center rounded-xl border " +
    "transition-all duration-200 active:scale-95 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trace-cyan " +
    "disabled:cursor-not-allowed disabled:opacity-35";

  const neutral =
    `${iconButton} border-trace-border bg-trace-panel ` +
    "text-trace-text-muted hover:border-trace-border-strong " +
    "hover:bg-trace-surface-hover hover:text-trace-text";

  return (
    <header className="sticky top-0 z-30 border-b border-trace-border bg-trace-bg/95 backdrop-blur-xl">
      {/* TRACE signature gradient */}
      <div
        className="h-[3px]"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(90deg, #bd941f 0%, #f5d76e 27%, #48d8ef 65%, #ad98ff 100%)",
        }}
      />

      <div className="mx-auto flex min-h-[64px] w-full max-w-[1800px] items-center justify-between gap-3 px-3 py-2 sm:px-5 md:px-6">
        {/* Brand */}
        <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#F5D76E] to-[#A47B19] text-xl font-black text-[#211907] shadow-md shadow-trace-brand/15">
            T
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold tracking-[0.18em] text-trace-text sm:text-xl">
              TRACE
            </h1>

            {debugMode && (
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-trace-violet/40 bg-trace-violet/10 text-trace-violet"
                title="Debug mode"
                aria-label="Debug mode active"
              >
                <Icon name="debug" size={15} />
              </span>
            )}
          </div>
        </div>

        {/* Icon-only media-player controls */}
        <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
          {/* Reset */}
          <button
            type="button"
            onClick={onReset}
            className={neutral}
            aria-label="Reset execution"
            title="Reset execution"
          >
            <Icon name="reset" />
          </button>

          {/* Playback controls — shown in debug mode */}
          {debugMode && (
            <>
              <span
                className="mx-0.5 hidden h-7 w-px bg-trace-border sm:block"
                aria-hidden="true"
              />

              <button
                type="button"
                onClick={onTogglePlayback}
                disabled={!canPlay}
                className={`${iconButton} border-trace-violet/35 bg-trace-violet/10 text-trace-violet hover:border-trace-violet hover:bg-trace-violet/20`}
                aria-label={isPlaying ? "Pause playback" : "Play playback"}
                title={isPlaying ? "Pause playback" : "Play playback"}
              >
                <Icon name={isPlaying ? "pause" : "play"} size={19} />
              </button>

              <button
                type="button"
                onClick={onStep}
                disabled={!canStep || isPlaying}
                className={`${iconButton} border-trace-cyan/35 bg-trace-cyan/10 text-trace-cyan hover:border-trace-cyan hover:bg-trace-cyan/20`}
                aria-label="Next execution step"
                title="Next step"
              >
                <Icon name="next" size={18} />
              </button>
            </>
          )}

          <span
            className="mx-0.5 hidden h-7 w-px bg-trace-border sm:block"
            aria-hidden="true"
          />

          {/* Debug */}
          <button
            type="button"
            onClick={onDebug}
            aria-pressed={debugMode}
            className={`${iconButton} ${
              debugMode
                ? "border-trace-violet bg-trace-violet/20 text-trace-violet"
                : "border-trace-violet/35 bg-trace-violet/10 text-trace-violet hover:border-trace-violet hover:bg-trace-violet/20"
            }`}
            aria-label="Run with Debug"
            title="Run with Debug"
          >
            <Icon name="debug" size={19} />
          </button>

          {/* Run */}
          <button
            type="button"
            onClick={onRun}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-trace-brand text-trace-brand-ink shadow-md shadow-trace-brand/15 transition-all hover:brightness-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trace-brand"
            aria-label="Run program"
            title="Run program"
          >
            <Icon name="play" size={19} />
          </button>

          <span
            className="mx-0.5 hidden h-7 w-px bg-trace-border sm:block"
            aria-hidden="true"
          />

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={neutral}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
          >
            <Icon name={isDark ? "sun" : "moon"} size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
