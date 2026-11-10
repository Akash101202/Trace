"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import CodeEditor from "./CodeEditor";

const EXAMPLES = [
  {
    id: "variables",
    name: "Variables & arithmetic",
    description:
      "Follow variable values through arithmetic operations and see how each assignment changes the state.",
    code: `let x = 10;
let y = 20;
x = x + y;
y = x * 2;
x = x - 5;`,
  },
  {
    id: "arrays",
    name: "Array mutations",
    description:
      "Watch array cells change and inspect the index being updated.",
    code: `let arr = [5, 2, 8, 4];
arr[0] = 10;
arr[2] = arr[0] + arr[1];
arr[3] = arr[2] * 2;`,
  },
  {
    id: "loops",
    name: "Loop sum",
    description:
      "Watch a loop update its counter and accumulate a running total.",
    code: `let total = 0;
for (let i = 0; i < 4; i++) {
  total = total + i;
}`,
  },
  {
    id: "conditions",
    name: "Conditional branching",
    description: "See which branch is selected when a condition is evaluated.",
    code: `let score = 75;
let bonus = 0;
if (score >= 50) {
  bonus = 10;
} else {
  bonus = 0;
}
score = score + bonus;`,
  },
  {
    id: "functions",
    name: "Function call",
    description:
      "Follow function entry, parameters, return values and completion.",
    code: `function double(n) {
  return n * 2;
}
let result = double(5);`,
  },
];

// Keep these classes literal so Tailwind can reliably detect each tone.
const TONES = {
  gold: {
    border: "border-trace-brand/45",
    surface: "bg-trace-brand/10",
    text: "text-trace-brand",
    dot: "bg-trace-brand",
    ring: "ring-trace-brand/35",
    label: "Value change",
  },
  cyan: {
    border: "border-trace-cyan/40",
    surface: "bg-trace-cyan/10",
    text: "text-trace-cyan",
    dot: "bg-trace-cyan",
    ring: "ring-trace-cyan/35",
    label: "Control flow",
  },
  violet: {
    border: "border-trace-violet/40",
    surface: "bg-trace-violet/10",
    text: "text-trace-violet",
    dot: "bg-trace-violet",
    ring: "ring-trace-violet/35",
    label: "Function",
  },
  green: {
    border: "border-trace-green/40",
    surface: "bg-trace-green/10",
    text: "text-trace-green",
    dot: "bg-trace-green",
    ring: "ring-trace-green/35",
    label: "Console output",
  },
  red: {
    border: "border-trace-red/40",
    surface: "bg-trace-red/10",
    text: "text-trace-red",
    dot: "bg-trace-red",
    ring: "ring-trace-red/35",
    label: "Error",
  },
};

function getTone(type) {
  if (type === "error") return "red";
  if (type === "console-log") return "green";
  if (type?.startsWith("function-")) return "violet";

  if (
    ["condition", "branch", "loop-iteration", "loop-complete"].includes(type)
  ) {
    return "cyan";
  }

  return "gold";
}

function formatValue(value) {
  if (Array.isArray(value)) {
    return `[${value.map(formatValue).join(", ")}]`;
  }

  if (typeof value === "string") return `"${value}"`;
  if (value === undefined) return "undefined";
  if (value === null) return "null";

  if (
    typeof value === "number" &&
    Number.isFinite(value) &&
    !Number.isInteger(value)
  ) {
    return String(Number(value.toFixed(4)));
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "[Object]";
    }
  }

  return String(value);
}

function getEventTitle(event) {
  if (!event) return "";

  const titles = {
    declare: "Variable declared",
    update: "Variable updated",
    "array-update": "Array element updated",
    "object-update": "Object property updated",
    error: "Execution failed",
    "function-declaration": "Function declared",
    "function-call": "Function called",
    "function-enter": "Function entered",
    "function-return": "Return value",
    "function-exit": "Function completed",
    condition: "Condition evaluated",
    branch: "Branch selected",
    "loop-iteration": "Loop iteration",
    "loop-complete": "Loop completed",
    "console-log": "Console output",
  };

  return titles[event.type] ?? "Execution event";
}

function getEventDescription(event) {
  if (!event) return "";

  switch (event.type) {
    case "declare":
      return `${event.variable} = ${formatValue(event.value)}`;

    case "update":
      return `${event.variable}: ${formatValue(event.oldValue)} → ${formatValue(event.newValue)}`;

    case "array-update":
      return `${event.variable}[${event.index}]: ${formatValue(event.oldValue)} → ${formatValue(event.newValue)}`;

    case "object-update":
      return `${event.variable}.${event.property}: ${formatValue(event.oldValue)} → ${formatValue(event.newValue)}`;

    case "error":
      return `Execution stopped: ${event.message}`;

    case "function-declaration":
      return `function ${event.functionName} declared`;

    case "function-call":
      return `${event.functionName}(${(event.arguments ?? []).map(formatValue).join(", ")}) called`;

    case "function-enter":
      return `Entering ${event.functionName}(${(event.arguments ?? []).map(formatValue).join(", ")})`;

    case "function-return":
      return `${event.functionName} returned ${formatValue(event.value)}`;

    case "function-exit":
      return `${event.functionName}() completed → ${formatValue(event.value)}`;

    case "condition":
      return `Condition evaluated → ${event.result}`;

    case "branch":
      return `${event.branch} branch selected`;

    case "loop-iteration":
      return `${event.construct} loop · iteration ${event.iteration}`;

    case "loop-complete":
      return `${event.construct} loop completed after ${event.iterations} iterations`;

    case "console-log":
      return (event.arguments ?? []).map(formatValue).join(" ");

    default:
      return "Execution event";
  }
}

function getEventTransition(event) {
  if (!event) return null;

  if (["update", "array-update", "object-update"].includes(event.type)) {
    let target = event.variable;

    if (event.type === "array-update") {
      target = `${event.variable}[${event.index}]`;
    }

    if (event.type === "object-update") {
      target = `${event.variable}.${event.property}`;
    }

    return {
      target,
      before: event.oldValue,
      after: event.newValue,
      hasBefore: true,
    };
  }

  if (event.type === "declare") {
    return {
      target: event.variable,
      after: event.value,
      hasBefore: false,
    };
  }

  if (event.type === "function-return" || event.type === "function-exit") {
    return {
      target: `${event.functionName}() return value`,
      after: event.value,
      hasBefore: false,
    };
  }

  return null;
}

function EventGlyph({ type }) {
  const glyph =
    type === "error"
      ? "!"
      : type === "console-log"
        ? ">_"
        : type?.startsWith("function-")
          ? "ƒ"
          : ["condition", "branch", "loop-iteration", "loop-complete"].includes(
                type,
              )
            ? "↻"
            : type === "array-update" || type === "object-update"
              ? "◇"
              : "↗";

  return <span aria-hidden="true">{glyph}</span>;
}

function SectionHeading({ title, trailing }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
      <h3 className="font-display text-[17px] font-semibold tracking-[-0.015em] text-trace-text">
        {title}
      </h3>
      {trailing}
    </div>
  );
}

// macOS-style window controls, used on the editor card.
function WindowDots() {
  return (
    <span className="flex items-center gap-[7px]" aria-hidden="true">
      <span className="h-3 w-3 rounded-full bg-[#FF5F57] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.15)]" />
      <span className="h-3 w-3 rounded-full bg-[#FEBC2E] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.15)]" />
      <span className="h-3 w-3 rounded-full bg-[#28C840] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.15)]" />
    </span>
  );
}

export default function Workspace({
  code,
  onChange,
  execution = { variables: {}, events: [], snapshots: [] },
  activeStep = -1,
  error = "",
  errorInfo = null,
}) {
  const workspaceRef = useRef(null);

  const [selectedExample, setSelectedExample] = useState("");
  const [expandedVariables, setExpandedVariables] = useState(() => new Set());

  const events = execution.events ?? [];

  const latestEvent = activeStep >= 0 ? events[activeStep] : null;

  const currentVariables =
    activeStep >= 0 ? (execution.snapshots?.[activeStep] ?? {}) : {};

  const variables = Object.entries(currentVariables);

  const eventTone = TONES[getTone(error ? "error" : latestEvent?.type)];

  const panelTone = error ? TONES.red : TONES.cyan;

  const selectedProblem = EXAMPLES.find(
    (example) => example.id === selectedExample,
  );

  const visibleConsoleEvents = events
    .slice(0, Math.max(0, activeStep + 1))
    .filter((event) => event.type === "console-log");

  const transition = getEventTransition(latestEvent);

  function handleExampleSelect(id) {

    setSelectedExample(id);

    const example = EXAMPLES.find((item) => item.id === id);

    if (example) {
      onChange(example.code);
    }
  }

  function handleCodeChange(nextCode) {
    if (selectedProblem && nextCode !== selectedProblem.code) {
      setSelectedExample("");
    }

    onChange(nextCode);
  }

  function toggleExpanded(name) {
    setExpandedVariables((previous) => {
      const next = new Set(previous);

      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }

      return next;
    });
  }

  // Animate only the value affected by the active trace event.
  useEffect(() => {
    if (activeStep < 0 || !latestEvent) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const root = workspaceRef.current;
    if (!root) return;

    const animations = [];
    const card = root.querySelector(".trace-event-card");
    const after = root.querySelector(".trace-after");
    const changed = root.querySelectorAll(".trace-value-changed");

    // The event card settles in; the new value springs into place.
    if (card) {
      animations.push(
        animate(card, {
          opacity: [0.4, 1],
          translateY: [6, 0],
          duration: 420,
          ease: "out(4)",
        }),
      );
    }
    if (after) {
      animations.push(
        animate(after, {
          scale: [0.86, 1],
          opacity: [0, 1],
          duration: 640,
          delay: 90,
          ease: "outElastic(1, .7)",
        }),
      );
    }
    if (changed.length) {
      animations.push(
        animate(changed, {
          scale: [0.92, 1],
          duration: 700,
          ease: "outElastic(1, .6)",
        }),
      );
    }

    return () => animations.forEach((animation) => animation.revert());
  }, [
    activeStep,
    latestEvent?.type,
    latestEvent?.variable,
    latestEvent?.index,
    latestEvent?.property,
  ]);

  return (
    <section
      ref={workspaceRef}
      className="grid min-w-0 grid-cols-1 gap-4 lg:h-[calc(100dvh-96px)] lg:min-h-[640px] lg:grid-cols-[minmax(0,1.04fr)_minmax(0,1fr)] xl:h-full xl:min-h-0 xl:gap-5"
    >
      {/* LEFT: example selection + editor */}
      <div className="flex min-h-[600px] min-w-0 flex-col gap-4 lg:min-h-0 xl:gap-5">
        <section className="trace-card trace-card--gold p-4 sm:p-5">
          <div className="mb-3.5 flex items-start justify-between gap-3 px-1">
            <div className="min-w-0">
              <h2 className="font-display text-[22px] font-semibold leading-tight tracking-[-0.02em] text-trace-text">
                {selectedProblem?.name ?? "Explore a program"}
              </h2>
              <p className="mt-1 text-[14px] leading-5 text-trace-text-muted">
                {selectedProblem?.description ??
                  "Pick an example, or write your own JavaScript below."}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-trace-brand/10 px-2.5 py-1 text-[12px] font-semibold text-trace-brand ring-1 ring-inset ring-trace-brand/30">
              JavaScript
            </span>
          </div>

          <div
            role="radiogroup"
            aria-label="Examples"
            className="flex flex-wrap gap-2"
          >
            {EXAMPLES.map((example) => {
              const selected = example.id === selectedExample;
              return (
                <button
                  key={example.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => handleExampleSelect(example.id)}
                  className={`trace-press h-9 shrink-0 rounded-full px-3.5 text-[14px] font-medium ${
                    selected
                      ? "bg-gradient-to-b from-[#F5D76E] to-trace-brand text-trace-brand-ink shadow-[0_2px_10px_-3px_var(--trace-brand)]"
                      : "bg-trace-surface text-trace-text ring-1 ring-inset ring-trace-border hover:bg-trace-surface-hover"
                  }`}
                >
                  {example.name}
                </button>
              );
            })}
          </div>
        </section>

        {/* Code editor */}
        <section className="trace-card flex min-h-[420px] min-w-0 flex-1 flex-col overflow-hidden lg:min-h-0">
          <div className="relative flex h-11 shrink-0 items-center border-b border-trace-border px-4">
            <WindowDots />
            <p className="absolute left-1/2 -translate-x-1/2 text-[13px] font-medium text-trace-text-muted">
              main.js
            </p>
            <span className="ml-auto text-[12px] tabular-nums text-trace-text-subtle">
              {code.split("\n").length} lines
            </span>
          </div>

          <div className="min-h-0 flex-1 bg-trace-panel">
            <CodeEditor
              code={code}
              onChange={handleCodeChange}
              activeLine={errorInfo?.line ?? latestEvent?.line ?? null}
              activeEventType={error ? "error" : (latestEvent?.type ?? "")}
            />
          </div>

          <div className="hidden shrink-0 items-center gap-4 border-t border-trace-border px-4 py-2.5 text-[12px] text-trace-text-subtle sm:flex">
            <span>
              <kbd>⌃</kbd> <kbd>↵</kbd> Run
            </span>
            <span>
              <kbd>⌃</kbd> <kbd>⇧</kbd> <kbd>↵</kbd> Debug
            </span>
            <span className="ml-auto">
              <kbd>←</kbd> <kbd>→</kbd> Step
            </span>
          </div>
        </section>
      </div>

      {/* RIGHT: event inspector + live state */}
      <section className="trace-card trace-card--blue flex min-h-[600px] min-w-0 flex-col overflow-hidden lg:min-h-0">
        <header className="trace-card-header-blue relative flex items-center justify-between gap-3 border-b border-trace-border px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-trace-cyan to-trace-violet text-[color:var(--trace-on-tone)] shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.35)]">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </div>

            <div className="min-w-0">
              <h2 className="font-display text-[17px] font-semibold tracking-[-0.015em] text-trace-text">
                Program state
              </h2>

              <p className="text-[13px] text-trace-text-muted">
                {activeStep >= 0
                  ? "Inspect what happened"
                  : "Run a program to start tracing"}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex shrink-0 items-center gap-2 rounded-full ${panelTone.surface} px-3 py-1.5 text-[13px] font-semibold tabular-nums ring-1 ring-inset ${panelTone.ring} ${panelTone.text}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${panelTone.dot}`}
              aria-hidden="true"
            />

            {error
              ? "Error"
              : activeStep >= 0
                ? `Step ${activeStep + 1} of ${events.length}`
                : "Ready"}
          </span>
        </header>

        <div className="min-h-0 flex-1 space-y-7 overflow-y-auto p-4 sm:p-5">
          {/* Active event inspector */}
          <section aria-labelledby="trace-current-event">
            <SectionHeading
              title="What just happened"
              trailing={
                latestEvent && (
                  <span
                    className={`rounded-full ${eventTone.surface} px-2.5 py-1 text-[12px] font-semibold ${eventTone.text}`}
                  >
                    {eventTone.label}
                  </span>
                )
              }
            />

            <div
              className={`trace-event-card rounded-2xl ${
                latestEvent ? `${eventTone.surface} ring-1 ring-inset ${eventTone.ring}` : "bg-trace-surface"
              } p-4`}
            >
              {!latestEvent ? (
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-trace-cyan/30 bg-trace-cyan/10 text-trace-cyan">
                    <svg
                      viewBox="0 0 24 24"
                      width="17"
                      height="17"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-trace-text">
                      Ready to trace
                    </p>

                    <p className="mt-1 text-xs leading-5 text-trace-text-muted">
                      Run the program to inspect each event, source line and
                      value transition.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${eventTone.dot} text-[17px] font-bold text-[color:var(--trace-on-tone)] shadow-[0_4px_12px_-4px_rgba(0,0,0,0.35)]`}
                  >
                    <EventGlyph type={latestEvent.type} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h4
                        id="trace-current-event"
                        className={`text-[17px] font-semibold tracking-[-0.01em] ${eventTone.text}`}
                      >
                        {getEventTitle(latestEvent)}
                      </h4>


                    </div>

                    {transition ? (
                      <div className="mt-3 rounded-xl bg-trace-panel p-3 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                        <p
                          className="mb-2 truncate font-mono text-xs font-semibold text-trace-text"
                          title={transition.target}
                        >
                          {transition.target}
                        </p>

                        <div className="flex items-center gap-2">
                          {transition.hasBefore && (
                            <div className="min-w-0 flex-1 rounded-lg bg-trace-surface px-3 py-2">
                              <p className="mb-0.5 text-[12px] text-trace-text-subtle">
                                Before
                              </p>

                              <p className="break-all font-mono text-[17px] text-trace-text-muted line-through decoration-trace-text-subtle/50">
                                {formatValue(transition.before)}
                              </p>
                            </div>
                          )}

                          <span
                            className={`shrink-0 ${eventTone.text}`}
                            aria-label={
                              transition.hasBefore
                                ? "changes to"
                                : "initial value"
                            }
                          >
                            {transition.hasBefore ? "→" : "↳"}
                          </span>

                          <div className="trace-after min-w-0 flex-1 rounded-lg bg-trace-green/12 px-3 py-2 ring-1 ring-inset ring-trace-green/30">
                            <p className="mb-0.5 text-[12px] font-medium text-trace-green">
                              After
                            </p>

                            <p className="break-all font-mono text-[20px] font-semibold text-trace-text">
                              {formatValue(transition.after)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 break-words font-mono text-[15px] leading-6 text-trace-text">
                        {getEventDescription(latestEvent)}
                      </p>
                    )}

                    {(latestEvent.line ?? errorInfo?.line) != null && (
                      <p className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-trace-text-subtle">
                        <svg
                          viewBox="0 0 24 24"
                          width="13"
                          height="13"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M8 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3M8 2h8v4H8z" />
                        </svg>
                        Source line {latestEvent.line ?? errorInfo.line}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Error inspector */}
          {error && (
            <section
              aria-labelledby="trace-error-heading"
              className="rounded-2xl bg-trace-red/10 p-4 ring-1 ring-inset ring-trace-red/30"
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-lg bg-trace-red/15 text-xs font-black text-trace-red"
                  aria-hidden="true"
                >
                  !
                </span>

                <h3
                  id="trace-error-heading"
                  className="text-[15px] font-semibold text-trace-red"
                >
                  {errorInfo?.kind === "syntax"
                    ? "Syntax error"
                    : errorInfo?.kind === "unsupported"
                      ? "Unsupported syntax"
                      : "Execution error"}
                </h3>
              </div>

              <p className="break-words text-sm leading-6 text-trace-text">
                {errorInfo?.message ?? error}
              </p>

              {errorInfo?.line != null && (
                <p className="mt-2 border-t border-trace-red/20 pt-2 text-xs text-trace-text-muted">
                  Line {errorInfo.line}
                  {errorInfo.column != null
                    ? `, column ${errorInfo.column}`
                    : ""}
                </p>
              )}

              {events.length > 0 && (
                <p className="mt-2 text-xs text-trace-text-muted">
                  Earlier execution history is still available in the timeline.
                </p>
              )}
            </section>
          )}

          {/* Compact, expandable variable inspection */}
          <section aria-labelledby="trace-variables-heading">
            <SectionHeading
              title="Variables"
              trailing={
                <span className="rounded-full bg-trace-surface px-2.5 py-1 text-[12px] font-medium tabular-nums text-trace-text-muted">
                  {variables.length} tracked
                </span>
              }
            />

            {variables.length === 0 ? (
              <div className="flex min-h-28 flex-col items-center justify-center rounded-2xl border border-dashed border-trace-border bg-trace-panel-raised p-5 text-center">
                <span
                  className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl border border-trace-cyan/25 bg-trace-cyan/10 text-trace-cyan"
                  aria-hidden="true"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 8v8M8 12h8" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </span>

                <p className="text-sm font-medium text-trace-text">
                  Nothing to visualize yet
                </p>

                <p className="mt-1 text-xs text-trace-text-muted">
                  Run your program to inspect its state.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {variables.map(([name, value]) => {
                  const isArray = Array.isArray(value);

                  const isObject =
                    value !== null && typeof value === "object" && !isArray;

                  const isArrayUpdate =
                    latestEvent?.type === "array-update" &&
                    latestEvent.variable === name;

                  const isObjectUpdate =
                    latestEvent?.type === "object-update" &&
                    latestEvent.variable === name;

                  const isVariableChange =
                    ["declare", "update"].includes(latestEvent?.type) &&
                    latestEvent?.variable === name;

                  const isDeclaration =
                    latestEvent?.type === "declare" &&
                    latestEvent?.variable === name;

                  const isActive =
                    isVariableChange ||
                    isDeclaration ||
                    isArrayUpdate ||
                    isObjectUpdate;

                  const isExpanded = expandedVariables.has(name);
                  const isStructured = isArray || isObject;

                  const longCollection =
                    (isArray && value.length > 8) ||
                    (isObject && Object.keys(value).length > 4);

                  const entries = isObject ? Object.entries(value) : [];

                  const visibleArray =
                    isArray && !isExpanded ? value.slice(0, 8) : value;

                  const visibleObject =
                    isObject && !isExpanded ? entries.slice(0, 4) : entries;

                  return (
                    <article
                      key={isActive ? `${name}-${activeStep}` : name}
                      className={`group relative min-w-0 overflow-hidden rounded-2xl p-3.5 transition-[background-color,box-shadow] duration-300 ${
                        isActive
                          ? "trace-value-changed bg-gradient-to-br from-trace-brand/15 to-trace-panel-raised ring-1 ring-inset ring-trace-brand/50"
                          : "bg-trace-panel-raised ring-1 ring-inset ring-trace-border"
                      } ${isStructured ? "sm:col-span-2" : ""}`}
                    >

                      <div className="mb-2.5 flex min-w-0 items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className={`max-w-[70%] truncate font-mono text-[14px] font-semibold ${
                              isActive ? "text-trace-brand" : "text-trace-text"
                            }`}
                            title={name}
                          >
                            {name}
                          </span>

                          <span className="truncate text-[12px] text-trace-text-subtle">
                            {isArray
                              ? "Array"
                              : isObject
                                ? "Object"
                                : typeof value}
                          </span>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          {isActive && (
                            <span
                              className="h-1.5 w-1.5 rounded-full bg-trace-brand"
                              title="Changed at this step"
                              aria-label="Changed at this step"
                            />
                          )}

                          {isArray && (
                            <span className="text-[12px] text-trace-text-subtle">
                              {value.length} items
                            </span>
                          )}

                          {isObject && (
                            <span className="text-[12px] text-trace-text-subtle">
                              {entries.length} keys
                            </span>
                          )}
                        </div>
                      </div>

                      {isArray ? (
                        value.length === 0 ? (
                          <p className="rounded-xl bg-trace-panel px-3 py-2 text-[13px] text-trace-text-muted">
                            Empty array
                          </p>
                        ) : (
                          <>
                            <div className="overflow-x-auto pb-1">
                              <div className="flex w-max gap-2">
                                {visibleArray.map((item, index) => {
                                  const activeCell =
                                    isArrayUpdate &&
                                    latestEvent.index === index;

                                  return (
                                    <div
                                      key={`${name}-${index}`}
                                      className="flex w-[62px] flex-col items-center gap-1.5"
                                    >
                                      <div
                                        className={`flex h-12 w-full items-center justify-center overflow-hidden rounded-xl px-1.5 font-mono text-[15px] font-semibold transition-colors ${
                                          activeCell
                                            ? "trace-value-changed bg-trace-brand text-trace-brand-ink shadow-[0_4px_14px_-4px_var(--trace-brand)]"
                                            : "bg-trace-panel text-trace-text shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                                        }`}
                                        title={formatValue(item)}
                                      >
                                        <span className="truncate">
                                          {formatValue(item)}
                                        </span>
                                      </div>

                                      <span
                                        className={`font-mono text-[11px] ${
                                          activeCell
                                            ? "font-bold text-trace-brand"
                                            : "text-trace-text-subtle"
                                        }`}
                                      >
                                        [{index}]
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {longCollection && (
                              <button
                                type="button"
                                onClick={() => toggleExpanded(name)}
                                className="mt-2 text-[11px] font-semibold text-trace-cyan hover:underline"
                              >
                                {isExpanded
                                  ? "Show fewer items ↑"
                                  : `Show all ${value.length} items ↓`}
                              </button>
                            )}
                          </>
                        )
                      ) : isObject ? (
                        <>
                          {entries.length === 0 ? (
                            <p className="rounded-xl bg-trace-panel px-3 py-2 text-[13px] text-trace-text-muted">
                              Empty object
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                              {visibleObject.map(
                                ([property, propertyValue]) => {
                                  const activeProperty =
                                    isObjectUpdate &&
                                    latestEvent.property === property;

                                  return (
                                    <div
                                      key={property}
                                      className={`flex min-w-0 items-start justify-between gap-3 rounded-xl px-3 py-2 ${
                                        activeProperty
                                          ? "bg-trace-brand/15 ring-1 ring-inset ring-trace-brand/40"
                                          : "bg-trace-panel"
                                      }`}
                                    >
                                      <span
                                        className="min-w-0 truncate font-mono text-[11px] text-trace-cyan"
                                        title={property}
                                      >
                                        {property}
                                      </span>

                                      <span
                                        className={`max-w-[65%] break-all text-right font-mono text-xs ${
                                          activeProperty
                                            ? "font-semibold text-trace-brand"
                                            : "text-trace-text"
                                        }`}
                                        title={formatValue(propertyValue)}
                                      >
                                        {formatValue(propertyValue)}
                                      </span>
                                    </div>
                                  );
                                },
                              )}
                            </div>
                          )}

                          {longCollection && (
                            <button
                              type="button"
                              onClick={() => toggleExpanded(name)}
                              className="mt-2 text-[11px] font-semibold text-trace-cyan hover:underline"
                            >
                              {isExpanded
                                ? "Show fewer properties ↑"
                                : `Show all ${entries.length} properties ↓`}
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="flex items-end justify-between gap-3">
                          <span
                            className={`min-w-0 break-all font-mono text-[28px] font-semibold leading-none tracking-tight ${
                              isActive ? "text-trace-brand" : "text-trace-text"
                            }`}
                          >
                            {formatValue(value)}
                          </span>

                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Dedicated console view, derived from existing trace events */}
          <section aria-labelledby="trace-console-heading">
            <SectionHeading
              title="Console"
              trailing={
                <span className="rounded-full bg-trace-surface px-2.5 py-1 text-[12px] font-medium tabular-nums text-trace-text-muted">
                  {visibleConsoleEvents.length}{" "}
                  {visibleConsoleEvents.length === 1 ? "message" : "messages"}
                </span>
              }
            />

            <div className="overflow-hidden rounded-2xl bg-trace-bg-soft ring-1 ring-inset ring-trace-border">
              <div className="max-h-44 min-h-[64px] overflow-y-auto px-4 py-3 font-mono text-[13px]">
                {visibleConsoleEvents.length === 0 ? (
                  <p className="text-trace-text-subtle">
                    <span className="mr-2 text-trace-green" aria-hidden="true">
                      ›
                    </span>
                    Console output will appear here when your code calls
                    console.log().
                  </p>
                ) : (
                  <ol className="space-y-2">
                    {visibleConsoleEvents.map((event, index) => (
                      <li
                        key={`${event.line ?? "log"}-${index}`}
                        className="flex items-start gap-2"
                      >
                        <span
                          className="mt-px shrink-0 select-none text-trace-green"
                          aria-hidden="true"
                        >
                          ›
                        </span>

                        <span className="min-w-0 break-words whitespace-pre-wrap text-trace-text">
                          {getEventDescription(event)}
                        </span>

                        {event.line != null && (
                          <span className="ml-auto shrink-0 text-[10px] text-trace-text-subtle">
                            L{event.line}
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </section>

          {/* Compact execution summary */}
          <section aria-labelledby="trace-summary-heading">
            <SectionHeading title="Summary" />

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-gradient-to-br from-trace-cyan/10 to-transparent p-3.5 ring-1 ring-inset ring-trace-cyan/25">
                <span
                  className="mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-trace-cyan text-[color:var(--trace-on-tone)]"
                  aria-hidden="true"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="15"
                    height="15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                  </svg>
                </span>

                <p className="text-[13px] leading-4 text-trace-text-muted">
                  Events
                </p>

                <p className="mt-1 font-display text-[28px] font-semibold leading-none tracking-tight tabular-nums text-trace-text">
                  {events.length}
                </p>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-trace-violet/10 to-transparent p-3.5 ring-1 ring-inset ring-trace-violet/25">
                <span
                  className="mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-trace-violet text-[color:var(--trace-on-tone)]"
                  aria-hidden="true"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="15"
                    height="15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 5h16M4 12h16M4 19h16" />
                    <circle cx="8" cy="5" r="1" />
                    <circle cx="13" cy="12" r="1" />
                    <circle cx="7" cy="19" r="1" />
                  </svg>
                </span>

                <p className="text-[13px] leading-4 text-trace-text-muted">
                  Variables
                </p>

                <p className="mt-1 font-display text-[28px] font-semibold leading-none tracking-tight tabular-nums text-trace-text">
                  {variables.length}
                </p>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-trace-green/10 to-transparent p-3.5 ring-1 ring-inset ring-trace-green/25">
                <span
                  className="mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-trace-green text-[color:var(--trace-on-tone)]"
                  aria-hidden="true"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="15"
                    height="15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 5h8M8 9h8M6 3h12a2 2 0 0 1 2 2v14l-8-4-8 4V5a2 2 0 0 1 2-2Z" />
                  </svg>
                </span>

                <p className="text-[13px] leading-4 text-trace-text-muted">
                  Console logs
                </p>

                <p className="mt-1 font-display text-[28px] font-semibold leading-none tracking-tight tabular-nums text-trace-text">
                  {visibleConsoleEvents.length}
                </p>
              </div>
            </div>
          </section>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-trace-border px-4 py-2.5 sm:px-5">
          <span className="text-[12px] text-trace-text-subtle">
            TRACE engine
          </span>

          <span
            className={`inline-flex items-center gap-2 text-[12px] font-medium ${
              error ? "text-trace-red" : "text-trace-green"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                error ? "bg-trace-red" : "bg-trace-green"
              }`}
              aria-hidden="true"
            />

            {error
              ? "Execution failed"
              : activeStep >= 0
                ? "Trace available"
                : "Ready to run"}
          </span>
        </footer>
      </section>
    </section>
  );
}
