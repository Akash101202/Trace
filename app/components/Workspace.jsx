"use client";

import CodeEditor from "./CodeEditor";

export default function Workspace({
  code,
  onChange,
  execution = { variables: {}, events: [], snapshots: [] },
  activeStep = -1,
  error = "",
}) {
  const currentVariables =
    activeStep >= 0 ? (execution.snapshots?.[activeStep] ?? {}) : {};

  const variables = Object.entries(currentVariables);
  const events = execution.events ?? [];
  const latestEvent = activeStep >= 0 ? events[activeStep] : null;

  return (
    <section className="grid min-h-[600px] grid-cols-1 gap-5 bg-[#080807] p-4 md:p-6 lg:grid-cols-2">
      {/* Left side */}
      <div className="flex flex-col gap-5">
        {/* Problem */}
        <div className="rounded-2xl border border-[#302819] bg-gradient-to-br from-[#15130E] to-[#0D0C09] p-5 transition-colors hover:border-[#574622]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#574622] bg-[#211B0D] text-[#D4AF37]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 6h13M8 12h13M8 18h13" />
                  <path d="M3 6h.01M3 12h.01M3 18h.01" />
                </svg>
              </div>

              <h2 className="font-semibold tracking-wide text-[#F5F0E1]">
                Problem
              </h2>
            </div>

            <span className="rounded-lg border border-[#574622] bg-[#211B0D] px-3 py-1.5 text-xs font-medium text-[#D4AF37]">
              JavaScript
            </span>
          </div>

          <p className="text-sm leading-7 text-[#B6A780]">
            Write JavaScript code and observe how variables change during
            execution. Follow each step to understand what your program is
            doing.
          </p>
        </div>

        {/* Code editor */}
        <div className="flex min-h-[400px] flex-1 flex-col overflow-hidden rounded-2xl border border-[#39311E] bg-[#0D0C09] shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between border-b border-[#302819] bg-[#11110E] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#211B0D] text-[#D4AF37]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m16 18 6-6-6-6M8 6l-6 6 6 6M14 4l-4 16" />
                </svg>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-[#F5F0E1]">
                  Code Editor
                </h2>
                <p className="mt-0.5 text-xs text-[#81765A]">main.js</p>
              </div>
            </div>

            <span className="flex items-center gap-2 text-xs text-[#95886A]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
              JavaScript
            </span>
          </div>

          <div className="flex min-h-0 flex-1 bg-[#080807]">
            <CodeEditor
              code={code}
              onChange={onChange}
              activeLine={latestEvent?.line ?? null}
            />
          </div>

          <div className="flex items-center justify-between border-t border-[#302819] bg-[#0D0C09] px-4 py-2.5">
            <span className="text-xs text-[#81765A]">TRACE Editor</span>
            <span className="text-xs text-[#81765A]">
              {code.split("\n").length} lines
            </span>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex min-h-[400px] flex-col overflow-hidden rounded-2xl border border-[#39311E] bg-[#0D0C09] shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
        {/* Visualization header */}
        <div className="flex items-center justify-between border-b border-[#302819] bg-[#11110E] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#211B0D] text-[#D4AF37]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-[#F5F0E1]">
                Visualization
              </h2>
              <p className="mt-0.5 text-xs text-[#81765A]">
                Live program state
              </p>
            </div>
          </div>

          <span className="flex items-center gap-2 rounded-full border border-[#39311E] bg-[#18150E] px-3 py-1.5 text-xs text-[#B6A780]">
            <span
              className={`h-2 w-2 rounded-full ${
                error
                  ? "bg-red-500"
                  : activeStep >= 0
                    ? "bg-[#D4AF37] shadow-[0_0_8px_#D4AF3766]"
                    : "bg-[#625638]"
              }`}
            />

            {error
              ? "Error"
              : activeStep >= 0
                ? `Step ${activeStep + 1} / ${events.length}`
                : "Ready"}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-auto p-5">
          {/* Error message */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-400">
                Execution Error
              </p>
              <p className="break-words text-sm leading-6 text-red-300">
                {error}
              </p>
            </div>
          )}

          {/* Variable state */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-wide text-[#E8DEC4]">
                Variable State
              </h3>
              <span className="text-xs text-[#81765A]">
                {variables.length} tracked
              </span>
            </div>

            {variables.length === 0 ? (
              <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-[#39311E] bg-[#0A0907] p-6 text-center">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-[#39311E] bg-[#17140D] text-[#8D7330]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 8v8M8 12h8" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </div>

                <p className="text-sm text-[#C7B995]">
                  No variables to display
                </p>
                <p className="mt-2 text-xs leading-5 text-[#81765A]">
                  Run your code to see variables come to life.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {variables.map(([name, value]) => (
                  <div
                    key={name}
                    className="group relative overflow-hidden rounded-xl border border-[#6B5729] bg-gradient-to-br from-[#211B0D] to-[#11100B] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37] hover:shadow-[0_8px_25px_#D4AF3710]"
                  >
                    <div className="absolute right-0 top-0 h-16 w-16 translate-x-5 -translate-y-5 rounded-full bg-[#D4AF37]/5 blur-xl transition-colors group-hover:bg-[#D4AF37]/10" />

                    <div className="relative">
                      <p className="text-xs font-medium uppercase tracking-wider text-[#B6A06A]">
                        {name}
                      </p>

                      <p className="mt-3 break-all text-3xl font-semibold tracking-tight text-[#F5D76E]">
                        {String(value)}
                      </p>

                      <div className="mt-3 h-px w-full bg-gradient-to-r from-[#8D7330]/70 to-transparent" />
                      <p className="mt-2 text-[10px] uppercase tracking-widest text-[#81765A]">
                        Current value
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current execution event */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-wide text-[#E8DEC4]">
                Current Execution Event
              </h3>
              {latestEvent && (
                <span className="text-xs text-[#95886A]">
                  #{activeStep + 1}
                </span>
              )}
            </div>

            <div className="rounded-xl border border-[#39311E] bg-[#080807] p-4">
              {!latestEvent ? (
                <div className="flex items-center gap-3 py-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#17140D] text-[#8D7330]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>

                  <div>
                    <p className="text-sm text-[#C7B995]">
                      Waiting for execution
                    </p>
                    <p className="mt-1 text-xs text-[#81765A]">
                      Your next event will appear here.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#6B5729] bg-[#211B0D] text-[#D4AF37]">
                    {latestEvent.type === "declare" ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 7h16M4 12h10M4 17h13" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M7 7h10v10M17 7 7 17" />
                      </svg>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
                      {latestEvent.type === "declare"
                        ? "Variable declared"
                        : "Variable updated"}
                    </p>

                    <p className="break-words font-mono text-sm leading-6 text-[#F5F0E1]">
                      {latestEvent.type === "declare"
                        ? `${latestEvent.variable} = ${latestEvent.value}`
                        : `${latestEvent.variable}: ${latestEvent.oldValue} → ${latestEvent.newValue}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Execution summary */}
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-[#E8DEC4]">
              Execution Summary
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#302819] bg-[#11110E] p-4">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#211B0D] text-[#B89B43]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                  </svg>
                </div>

                <p className="text-xs text-[#95886A]">Total events</p>
                <p className="mt-1 text-2xl font-semibold text-[#F5F0E1]">
                  {events.length}
                </p>
              </div>

              <div className="rounded-xl border border-[#302819] bg-[#11110E] p-4">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#211B0D] text-[#B89B43]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="M7 8h4M7 12h10M7 16h7" />
                  </svg>
                </div>

                <p className="text-xs text-[#95886A]">Tracked variables</p>
                <p className="mt-1 text-2xl font-semibold text-[#F5F0E1]">
                  {variables.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel footer */}
        <div className="flex items-center justify-between border-t border-[#302819] bg-[#11110E]/70 px-5 py-3">
          <span className="text-xs tracking-wide text-[#81765A]">
            TRACE ENGINE
          </span>
          <span className="flex items-center gap-2 text-xs text-[#B6A780]">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                error ? "bg-red-500" : "bg-[#D4AF37]"
              }`}
            />
            {error ? "Execution failed" : "Ready"}
          </span>
        </div>
      </div>
    </section>
  );
}
