export default function Header({
  onRun,
  onStep,
  onReset,
  onTogglePlayback,
  canStep,
  canResume,
  isPlaying,
}) {
  const secondaryButton =
    "rounded-lg border border-[#39311E] bg-[#11110E] px-3.5 py-2.5 text-sm text-[#D6CCB3] transition duration-200 hover:border-[#8D7330] hover:bg-[#1C1911] disabled:cursor-not-allowed disabled:opacity-35";

  return (
    <header className="sticky top-0 z-30 border-b border-[#302819] bg-[#080807]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#F5D76E] to-[#A47B19] text-xl font-black text-[#080807] shadow-lg shadow-[#D4AF37]/10">
            T
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-[0.2em] text-[#F5F0E1]">
              TRACE
            </h1>
            <p className="mt-0.5 text-xs tracking-wide text-[#95886A]">
              See your code execute.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button onClick={onReset} className={secondaryButton}>
            Reset
          </button>

          {(isPlaying || canResume) && (
            <button onClick={onTogglePlayback} className={secondaryButton}>
              {isPlaying ? "Ⅱ Pause" : "▶ Resume"}
            </button>
          )}

          <button
            onClick={onStep}
            disabled={!canStep}
            className={secondaryButton}
          >
            Step →
          </button>

          <button
            onClick={onRun}
            className="rounded-lg bg-gradient-to-r from-[#F5D76E] to-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#0A0906] shadow-md shadow-[#D4AF37]/10 transition hover:brightness-110 active:scale-[0.98]"
          >
            ▶ Run
          </button>
        </div>
      </div>
    </header>
  );
}
