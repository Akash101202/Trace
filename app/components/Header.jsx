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
  const secondaryButton =
    "rounded-xl border border-[#302819] bg-[#11110E] px-3 py-2.5 text-sm text-[#C7B995] transition hover:border-[#574622] hover:bg-[#19160F] disabled:cursor-not-allowed disabled:opacity-35";

  return (
    <header className="sticky top-0 z-30 border-b border-[#302819] bg-[#080807]/95 backdrop-blur-xl">
      <div
        className="h-[3px]"
        style={{
          background:
            "linear-gradient(90deg, #8D7330 0%, #F5D76E 32%, #4DD0E1 70%, #8B7CFF 100%)",
        }}
      />

      <div className="mx-auto flex max-w-[1700px] flex-wrap items-center justify-between gap-4 px-4 py-3 md:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#F5D76E] to-[#A47B19] text-xl font-black text-[#080807] shadow-lg shadow-[#D4AF37]/10">
            T
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-[0.2em] text-[#F5F0E1]">
                TRACE
              </h1>
              {debugMode && (
                <span className="rounded-full border border-[#7560C9]/40 bg-[#171326] px-2 py-0.5 text-[9px] font-semibold tracking-wider text-[#B7A7FF]">
                  DEBUG
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-[#95886A]">
              See your code execute.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={onReset} className={secondaryButton}>
            Reset
          </button>

          {debugMode && (
            <>
              <button
                onClick={onTogglePlayback}
                disabled={!canPlay}
                className={`${secondaryButton} border-[#7560C9]/40 text-[#B7A7FF] hover:border-[#8B7CFF] hover:bg-[#171326]`}
              >
                {isPlaying ? "Ⅱ Pause" : "▶ Play"}
              </button>

              <button
                onClick={onStep}
                disabled={!canStep || isPlaying}
                className={`${secondaryButton} border-[#245561] text-[#77CFE0] hover:border-[#4DD0E1] hover:bg-[#0D191D]`}
              >
                Next Step →
              </button>
            </>
          )}

          <button
            onClick={onDebug}
            className={`rounded-xl border px-3.5 py-2.5 text-sm font-medium transition ${
              debugMode
                ? "border-[#8B7CFF] bg-[#211B39] text-[#CEC4FF]"
                : "border-[#7560C9]/50 bg-[#171326] text-[#B7A7FF] hover:border-[#8B7CFF] hover:bg-[#211B39]"
            }`}
          >
            ◉ Run with Debug
          </button>

          <button
            onClick={onRun}
            className="rounded-xl bg-gradient-to-r from-[#F5D76E] to-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#080807] shadow-md shadow-[#D4AF37]/10 transition hover:brightness-110 active:scale-[0.98]"
          >
            ▶ Run
          </button>
        </div>
      </div>
    </header>
  );
}
