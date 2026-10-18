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
    label: "Value change",
  },
  cyan: {
    border: "border-trace-cyan/40",
    surface: "bg-trace-cyan/10",
    text: "text-trace-cyan",
    dot: "bg-trace-cyan",
    label: "Control flow",
  },
  violet: {
    border: "border-trace-violet/40",
    surface: "bg-trace-violet/10",
    text: "text-trace-violet",
    dot: "bg-trace-violet",
    label: "Function",
  },
  green: {
    border: "border-trace-green/40",
    surface: "bg-trace-green/10",
    text: "text-trace-green",
    dot: "bg-trace-green",
    label: "Console output",
  },
  red: {
    border: "border-trace-red/40",
    surface: "bg-trace-red/10",
    text: "text-trace-red",
    dot: "bg-trace-red",
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

function SectionHeading({ eyebrow, title, trailing }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div>
        {eyebrow && (
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-trace-text-subtle">
            {eyebrow}
          </p>
        )}

        <h3 className="text-sm font-semibold tracking-wide text-trace-text">
          {title}
        </h3>
      </div>

      {trailing}
    </div>
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

  function handleExampleSelect(event) {
    const id = event.target.value;

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

    const targets = workspaceRef.current?.querySelectorAll(
      ".trace-value-changed",
    );

    if (!targets?.length) return;

    const animation = animate(targets, {
      scale: [0.96, 1.025, 1],
      translateY: [4, -1, 0],
      duration: 420,
      ease: "outExpo",
    });

    return () => animation.pause();
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
      className="grid min-h-[calc(100vh-76px)] grid-cols-1 gap-4 bg-trace-bg p-3 sm:p-4 lg:h-[calc(100vh-76px)] lg:min-h-[680px] lg:grid-cols-[minmax(0,1.04fr)_minmax(0,1fr)] lg:overflow-hidden xl:gap-5 xl:p-5"
    >
      {/* LEFT: example selection + editor */}
      <div className="flex min-h-[650px] min-w-0 flex-col gap-3 lg:min-h-0">
        <section className="relative overflow-hidden rounded-2xl border border-trace-brand/25 bg-gradient-to-br from-trace-brand/10 via-trace-panel to-trace-panel p-4 shadow-sm sm:p-5">
          <div
            aria-hidden="true"
            className="absolute right-0 top-0 h-24 w-24 rounded-full bg-trace-brand/10 blur-3xl"
          />

          <div className="relative">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-trace-brand/30 bg-trace-brand/10 text-trace-brand">
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m8 5-5 7 5 7M16 5l5 7-5 7M14 3l-4 18" />
                  </svg>
                </span>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-trace-brand">
                    Workspace
                  </p>

                  <h2 className="text-sm font-semibold text-trace-text sm:text-base">
                    {selectedProblem?.name ?? "Explore a program"}
                  </h2>
                </div>
              </div>

              <span className="rounded-lg border border-trace-brand/30 bg-trace-brand/10 px-2.5 py-1.5 text-xs font-semibold text-trace-brand">
                JavaScript
              </span>
            </div>

            <label
              htmlFor="trace-example"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-trace-text-subtle"
            >
              Start with an example
            </label>

            <select
              id="trace-example"
              value={selectedExample}
              onChange={handleExampleSelect}
              className="w-full rounded-xl border border-trace-border bg-trace-bg-soft px-3.5 py-3 text-sm text-trace-text outline-none transition focus:border-trace-brand focus:ring-2 focus:ring-trace-brand/20"
            >
              <option value="">Choose an example…</option>

              {EXAMPLES.map((example) => (
                <option key={example.id} value={example.id}>
                  {example.name}
                </option>
              ))}
            </select>

            <p className="mt-2.5 text-xs leading-5 text-trace-text-muted sm:text-sm">
              {selectedProblem?.description ??
                "Pick a concept to explore, or write your own supported JavaScript in the editor below."}
            </p>
          </div>
        </section>

        {/* Code editor */}
        <section className="flex min-h-[440px] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-trace-border bg-trace-panel shadow-[var(--trace-shadow)] lg:min-h-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-trace-border bg-trace-panel-raised px-4 py-3 sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-trace-cyan/10 text-trace-cyan">
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
                  <path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />
                </svg>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-trace-text">
                  Code editor
                </h2>

                <p className="mt-0.5 text-[11px] text-trace-text-subtle">
                  main.js
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-trace-cyan/25 bg-trace-cyan/10 px-2.5 py-1.5 text-[11px] font-medium text-trace-cyan">
              <span
                className="h-1.5 w-1.5 rounded-full bg-trace-cyan"
                aria-hidden="true"
              />
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

          <div className="flex items-center justify-between gap-3 border-t border-trace-border bg-trace-panel-raised px-4 py-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-trace-text-subtle">
              TRACE editor
            </span>

            <span className="text-[10px] text-trace-text-subtle">
              JavaScript · Monaco
            </span>
          </div>
        </section>
      </div>

      {/* RIGHT: event inspector + live state */}
      <section className="flex min-h-[600px] min-w-0 flex-col overflow-hidden rounded-2xl border border-trace-cyan/30 bg-trace-panel shadow-[var(--trace-shadow)] lg:min-h-0">
        <header className="relative flex items-center justify-between gap-3 overflow-hidden border-b border-trace-border bg-gradient-to-r from-trace-cyan/10 via-trace-panel-raised to-trace-violet/10 px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-trace-cyan/35 bg-trace-cyan/10 text-trace-cyan">
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
              <h2 className="text-sm font-semibold text-trace-text">
                Program state
              </h2>

              <p className="mt-0.5 text-xs text-trace-text-muted">
                {activeStep >= 0
                  ? "Inspect what happened"
                  : "Run a program to start tracing"}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border ${panelTone.border} ${panelTone.surface} px-2.5 py-1.5 text-[10px] font-semibold tracking-wide ${panelTone.text}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${panelTone.dot}`}
              aria-hidden="true"
            />

            {error
              ? "ERROR"
              : activeStep >= 0
                ? `STEP ${activeStep + 1} / ${events.length}`
                : "READY"}
          </span>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-3 sm:p-4">
          {/* Active event inspector */}
          <section aria-labelledby="trace-current-event">
            <SectionHeading
              eyebrow="Execution inspector"
              title="What just happened?"
              trailing={
                latestEvent && (
                  <span
                    className={`rounded-md border ${eventTone.border} ${eventTone.surface} px-2 py-1 text-[10px] font-semibold ${eventTone.text}`}
                  >
                    {eventTone.label}
                  </span>
                )
              }
            />

            <div
              className={`rounded-xl border ${
                latestEvent ? eventTone.border : "border-trace-border"
              } ${
                latestEvent ? eventTone.surface : "bg-trace-panel-raised"
              } p-3.5 sm:p-4`}
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
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${eventTone.border} bg-trace-panel text-base font-bold ${eventTone.text}`}
                  >
                    <EventGlyph type={latestEvent.type} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h4
                        id="trace-current-event"
                        className={`text-sm font-semibold ${eventTone.text}`}
                      >
                        {getEventTitle(latestEvent)}
                      </h4>

                      <span className="rounded-md border border-trace-border bg-trace-panel/70 px-2 py-1 font-mono text-[10px] text-trace-text-subtle">
                        #{activeStep + 1}
                      </span>
                    </div>

                    {transition ? (
                      <div className="mt-3 rounded-lg border border-trace-border/80 bg-trace-panel/75 p-3">
                        <p
                          className="mb-2 truncate font-mono text-xs font-semibold text-trace-text"
                          title={transition.target}
                        >
                          {transition.target}
                        </p>

                        <div className="flex items-center gap-2">
                          {transition.hasBefore && (
                            <div className="min-w-0 flex-1 rounded-lg border border-trace-border bg-trace-bg-soft px-2.5 py-2">
                              <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-trace-text-subtle">
                                Before
                              </p>

                              <p className="break-all font-mono text-sm text-trace-text-muted">
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

                          <div className="min-w-0 flex-1 rounded-lg border border-trace-green/30 bg-trace-green/10 px-2.5 py-2">
                            <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-trace-green">
                              After
                            </p>

                            <p className="break-all font-mono text-sm font-semibold text-trace-text">
                              {formatValue(transition.after)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 break-words font-mono text-sm leading-6 text-trace-text">
                        {getEventDescription(latestEvent)}
                      </p>
                    )}

                    {(latestEvent.line ?? errorInfo?.line) != null && (
                      <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-trace-text-subtle">
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
              className="rounded-xl border border-trace-red/35 bg-trace-red/10 p-3.5 sm:p-4"
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
                  className="text-xs font-bold uppercase tracking-[0.14em] text-trace-red"
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
              eyebrow="Memory"
              title="Variables & data"
              trailing={
                <span className="rounded-full border border-trace-cyan/25 bg-trace-cyan/10 px-2.5 py-1 text-[10px] font-semibold text-trace-cyan">
                  {variables.length} tracked
                </span>
              }
            />

            {variables.length === 0 ? (
              <div className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed border-trace-border bg-trace-panel-raised p-5 text-center">
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
                      className={`group relative min-w-0 overflow-hidden rounded-xl border p-3 transition-colors duration-200 ${
                        isActive
                          ? "trace-value-changed border-trace-brand/70 bg-gradient-to-br from-trace-brand/12 to-trace-panel-raised"
                          : "border-trace-border bg-trace-panel-raised hover:border-trace-border-strong"
                      } ${isStructured ? "sm:col-span-2" : ""}`}
                    >
                      {isActive && (
                        <span
                          className="absolute inset-y-0 left-0 w-[3px] bg-trace-brand"
                          aria-hidden="true"
                        />
                      )}

                      <div className="mb-2.5 flex min-w-0 items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className={`max-w-[70%] truncate rounded-md border px-2 py-1 font-mono text-xs font-semibold ${
                              isActive
                                ? "border-trace-brand/35 bg-trace-brand/10 text-trace-brand"
                                : "border-trace-border bg-trace-surface text-trace-text"
                            }`}
                            title={name}
                          >
                            {name}
                          </span>

                          <span className="truncate text-[10px] text-trace-text-subtle">
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
                            <span className="text-[10px] text-trace-text-subtle">
                              {value.length} items
                            </span>
                          )}

                          {isObject && (
                            <span className="text-[10px] text-trace-text-subtle">
                              {entries.length} keys
                            </span>
                          )}
                        </div>
                      </div>

                      {isArray ? (
                        value.length === 0 ? (
                          <p className="rounded-lg bg-trace-bg-soft px-3 py-2 text-xs italic text-trace-text-muted">
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
                                        className={`flex h-12 w-full items-center justify-center overflow-hidden rounded-lg border px-1.5 font-mono text-xs font-semibold transition-colors ${
                                          activeCell
                                            ? "trace-value-changed border-trace-brand bg-trace-brand/15 text-trace-brand"
                                            : "border-trace-border bg-trace-bg-soft text-trace-text"
                                        }`}
                                        title={formatValue(item)}
                                      >
                                        <span className="truncate">
                                          {formatValue(item)}
                                        </span>
                                      </div>

                                      <span
                                        className={`font-mono text-[10px] ${
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
                            <p className="rounded-lg bg-trace-bg-soft px-3 py-2 text-xs italic text-trace-text-muted">
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
                                      className={`flex min-w-0 items-start justify-between gap-3 rounded-lg border px-2.5 py-2 ${
                                        activeProperty
                                          ? "border-trace-brand/50 bg-trace-brand/10"
                                          : "border-trace-border/80 bg-trace-bg-soft"
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
                            className={`min-w-0 break-all font-mono text-xl font-semibold tracking-tight sm:text-2xl ${
                              isActive ? "text-trace-brand" : "text-trace-text"
                            }`}
                          >
                            {formatValue(value)}
                          </span>

                          <span className="shrink-0 pb-0.5 text-[9px] font-semibold uppercase tracking-[0.13em] text-trace-text-subtle">
                            Current
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
              eyebrow="Output"
              title="Console"
              trailing={
                <span className="rounded-full border border-trace-green/25 bg-trace-green/10 px-2.5 py-1 text-[10px] font-semibold text-trace-green">
                  {visibleConsoleEvents.length}{" "}
                  {visibleConsoleEvents.length === 1 ? "message" : "messages"}
                </span>
              }
            />

            <div className="overflow-hidden rounded-xl border border-trace-border bg-trace-bg-soft">
              <div className="flex items-center gap-1.5 border-b border-trace-border bg-trace-panel-raised px-3 py-2">
                <span
                  className="h-2 w-2 rounded-full bg-trace-red"
                  aria-hidden="true"
                />
                <span
                  className="h-2 w-2 rounded-full bg-trace-brand"
                  aria-hidden="true"
                />
                <span
                  className="h-2 w-2 rounded-full bg-trace-green"
                  aria-hidden="true"
                />
                <span className="ml-2 text-[10px] font-medium text-trace-text-subtle">
                  stdout
                </span>
              </div>

              <div className="max-h-40 min-h-[68px] overflow-y-auto p-3 font-mono text-xs">
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
            <SectionHeading eyebrow="At a glance" title="Execution summary" />

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-trace-cyan/25 bg-trace-cyan/5 p-3">
                <span
                  className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-trace-cyan/10 text-trace-cyan"
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

                <p className="text-[10px] leading-4 text-trace-text-muted">
                  Events
                </p>

                <p className="mt-1 text-xl font-semibold tabular-nums text-trace-text">
                  {events.length}
                </p>
              </div>

              <div className="rounded-xl border border-trace-violet/25 bg-trace-violet/5 p-3">
                <span
                  className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-trace-violet/10 text-trace-violet"
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

                <p className="text-[10px] leading-4 text-trace-text-muted">
                  Variables
                </p>

                <p className="mt-1 text-xl font-semibold tabular-nums text-trace-text">
                  {variables.length}
                </p>
              </div>

              <div className="rounded-xl border border-trace-green/25 bg-trace-green/5 p-3">
                <span
                  className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-trace-green/10 text-trace-green"
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

                <p className="text-[10px] leading-4 text-trace-text-muted">
                  Console logs
                </p>

                <p className="mt-1 text-xl font-semibold tabular-nums text-trace-text">
                  {visibleConsoleEvents.length}
                </p>
              </div>
            </div>
          </section>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-trace-border bg-trace-panel-raised px-4 py-2.5 sm:px-5">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-trace-text-subtle">
            TRACE engine
          </span>

          <span
            className={`inline-flex items-center gap-2 text-[11px] font-medium ${
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
