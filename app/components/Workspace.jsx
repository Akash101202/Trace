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

const TONES = {
  gold: {
    border: "border-[#6B5729]",
    surface: "bg-[#211B0D]",
    text: "text-[#D4AF37]",
    dot: "bg-[#D4AF37]",
  },
  cyan: {
    border: "border-[#245561]",
    surface: "bg-[#0D191D]",
    text: "text-[#77CFE0]",
    dot: "bg-[#4DD0E1]",
  },
  violet: {
    border: "border-[#50427F]",
    surface: "bg-[#171326]",
    text: "text-[#B7A7FF]",
    dot: "bg-[#8B7CFF]",
  },
  red: {
    border: "border-red-500/40",
    surface: "bg-red-500/10",
    text: "text-red-400",
    dot: "bg-red-400",
  },
};

function getTone(type) {
  if (type === "error") return "red";

  if (type?.startsWith("function-")) {
    return "violet";
  }

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

  if (typeof value === "string") {
    return `"${value}"`;
  }

  if (value === undefined) {
    return "undefined";
  }

  if (
    typeof value === "number" &&
    Number.isFinite(value) &&
    !Number.isInteger(value)
  ) {
    return String(Number(value.toFixed(4)));
  }

  if (value !== null && typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function getEventTitle(event) {
  if (!event) return "";

  const titles = {
    declare: "Variable declared",
    update: "Variable updated",
    "array-update": "Array element updated",
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

    case "error":
      return `Execution stopped: ${event.message}`;

    case "function-declaration":
      return `function ${event.functionName} declared`;

    case "function-call":
      return `${event.functionName}(${(event.arguments ?? [])
        .map(formatValue)
        .join(", ")}) called`;

    case "function-enter":
      return `Entering ${event.functionName}(${(event.arguments ?? [])
        .map(formatValue)
        .join(", ")})`;

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

  const events = execution.events ?? [];
  const latestEvent = activeStep >= 0 ? events[activeStep] : null;

  const currentVariables =
    activeStep >= 0 ? (execution.snapshots?.[activeStep] ?? {}) : {};

  const variables = Object.entries(currentVariables);
  const eventTone = TONES[getTone(error ? "error" : latestEvent?.type)];

  // Visualization chrome remains cyan, independent of event type.
  const panelTone = error ? TONES.red : TONES.cyan;
  const isArrayUpdate = latestEvent?.type === "array-update";

  const selectedProblem = EXAMPLES.find(
    (example) => example.id === selectedExample,
  );

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

  // Anime.js animates the affected variable or array cell.
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
      scale: [0.94, 1.04, 1],
      translateY: [6, -2, 0],
      duration: 480,
      ease: "outExpo",
    });

    return () => animation.pause();
  }, [
    activeStep,
    latestEvent?.type,
    latestEvent?.variable,
    latestEvent?.index,
  ]);

  return (
    <section
      ref={workspaceRef}
      className="grid min-h-[600px] grid-cols-1 gap-5 bg-[#080807] p-4 md:p-6 lg:grid-cols-2"
    >
      {/* LEFT: Problem and editor — gold accent */}
      <div className="flex flex-col gap-5">
        <div className="rounded-2xl border border-[#302819] bg-gradient-to-br from-[#15130E] to-[#0D0C09] p-5 transition-colors hover:border-[#574622]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold tracking-wide text-[#F5F0E1]">
              Problem
            </h2>

            <span className="rounded-lg border border-[#574622] bg-[#211B0D] px-3 py-1.5 text-xs font-medium text-[#D4AF37]">
              JavaScript
            </span>
          </div>

          <label
            htmlFor="trace-example"
            className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#95886A]"
          >
            Explore an example
          </label>

          <select
            id="trace-example"
            value={selectedExample}
            onChange={handleExampleSelect}
            className="w-full rounded-xl border border-[#39311E] bg-[#0A0907] px-3 py-3 text-sm text-[#E8DEC4] outline-none transition focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20"
          >
            <option value="">Choose an example…</option>

            {EXAMPLES.map((example) => (
              <option key={example.id} value={example.id}>
                {example.name}
              </option>
            ))}
          </select>

          <p className="mt-3 text-sm leading-7 text-[#B6A780]">
            {selectedProblem?.description ??
              "Explore a sample program or write your own JavaScript in the editor below."}
          </p>
        </div>

        {/* Code editor */}
        <div className="flex min-h-[400px] flex-1 flex-col overflow-hidden rounded-2xl border border-[#39311E] bg-[#0D0C09] shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between border-b border-[#302819] bg-[#11110E] px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-[#F5F0E1]">
                Code Editor
              </h2>
              <p className="mt-1 text-xs text-[#81765A]">main.js</p>
            </div>

            <span className="flex items-center gap-2 text-xs text-[#95886A]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
              JavaScript
            </span>
          </div>

          <div className="flex min-h-0 flex-1 bg-[#080807]">
            <CodeEditor
              code={code}
              onChange={handleCodeChange}
              activeLine={errorInfo?.line ?? latestEvent?.line ?? null}
              activeEventType={error ? "error" : (latestEvent?.type ?? "")}
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

      {/* RIGHT: Visualization — cyan-blue accent */}
      <div className="flex min-h-[400px] flex-col overflow-hidden rounded-2xl border border-[#245561]/80 bg-[#0A0E10] shadow-[0_8px_35px_rgba(77,208,225,0.04)] transition-colors hover:border-[#4DD0E1]/60">
        {/* Cyan header */}
        <div className="flex items-center justify-between border-b border-[#245561]/70 bg-gradient-to-r from-[#0D191D] to-[#11110E] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#245561] bg-[#10252A] text-[#4DD0E1]">
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
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-[#E8F9FC]">
                Visualization
              </h2>
              <p className="mt-0.5 text-xs text-[#77AEB8]">
                Live program state
              </p>
            </div>
          </div>

          <span
            className={`flex items-center gap-2 rounded-full border ${panelTone.border} ${panelTone.surface} px-3 py-1.5 text-xs ${panelTone.text}`}
          >
            <span className={`h-2 w-2 rounded-full ${panelTone.dot}`} />

            {error
              ? "Error"
              : activeStep >= 0
                ? `Step ${activeStep + 1} / ${events.length}`
                : "Ready"}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-auto p-5">
          {/* Error Inspector */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-400" />

                <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
                  {errorInfo?.kind === "syntax"
                    ? "Syntax Error"
                    : errorInfo?.kind === "unsupported"
                      ? "Unsupported Syntax"
                      : "Execution Error"}
                </p>
              </div>

              <p className="break-words text-sm leading-6 text-red-200">
                {errorInfo?.message ?? error}
              </p>

              {errorInfo?.line != null && (
                <p className="mt-3 border-t border-red-500/20 pt-3 text-xs text-red-300">
                  Line {errorInfo.line}
                  {errorInfo.column != null
                    ? `, Column ${errorInfo.column}`
                    : ""}
                </p>
              )}

              {events.length > 0 && (
                <p className="mt-2 text-xs leading-5 text-[#B6A780]">
                  Earlier execution history is available in the timeline.
                </p>
              )}
            </div>
          )}

          {/* Variables & Data */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-wide text-[#E8F9FC]">
                Variables & Data
              </h3>

              <span className="text-xs text-[#77AEB8]">
                {variables.length} tracked
              </span>
            </div>

            {variables.length === 0 ? (
              <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-[#245561]/70 bg-[#0B1215] p-6 text-center">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-[#245561] bg-[#10252A] text-[#4DD0E1]">
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

                <p className="text-sm text-[#D4E9EC]">
                  Nothing to visualize yet
                </p>

                <p className="mt-2 text-xs text-[#77AEB8]">
                  Run your program to inspect its state.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {variables.map(([name, value]) => {
                  const isArray = Array.isArray(value);

                  const isObject =
                    value !== null &&
                    typeof value === "object" &&
                    !Array.isArray(value);

                  const isVariableChange =
                    ["declare", "update"].includes(latestEvent?.type) &&
                    latestEvent?.variable === name;

                  const isArrayDeclaration =
                    isArray &&
                    latestEvent?.type === "declare" &&
                    latestEvent?.variable === name;

                  const isActiveVariable = !isArray && isVariableChange;

                  return (
                    <div
                      key={
                        isActiveVariable || isArrayDeclaration
                          ? `${name}-${activeStep}`
                          : name
                      }
                      className={`group relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ${
                        isActiveVariable || isArrayDeclaration
                          ? "trace-value-changed border-[#D4AF37] bg-gradient-to-br from-[#29210E] to-[#11100B]"
                          : "border-[#245561]/60 bg-gradient-to-br from-[#0D171A] to-[#0B1012] hover:border-[#4DD0E1]/60"
                      }`}
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md border border-[#6B5729] bg-[#211B0D] px-2 py-1 font-mono text-sm font-semibold text-[#F5D76E]">
                            {name}
                          </span>

                          <span className="text-xs text-[#77AEB8]">
                            {isArray ? "Array" : typeof value}
                          </span>
                        </div>

                        {isArray && (
                          <span className="text-xs text-[#77AEB8]">
                            {value.length} items
                          </span>
                        )}
                      </div>

                      {/* Array visualization */}

                      {/* Array and object visualization */}
                      {isArray ? (
                        value.length === 0 ? (
                          <p className="text-sm text-[#77AEB8]">Empty array</p>
                        ) : (
                          <div className="overflow-x-auto pb-1">
                            <div className="flex w-max gap-2">
                              {value.map((item, index) => {
                                const isActiveCell =
                                  isArrayUpdate &&
                                  latestEvent.variable === name &&
                                  latestEvent.index === index;

                                return (
                                  <div
                                    key={`${name}-${index}`}
                                    className="flex flex-col items-center gap-2"
                                  >
                                    <div
                                      className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border px-1 font-mono text-sm font-semibold sm:h-[72px] sm:w-[72px] ${
                                        isActiveCell
                                          ? "trace-value-changed border-[#D4AF37] bg-[#211B0D] text-[#F5D76E]"
                                          : "border-[#245561]/70 bg-[#080D0F] text-[#E8DEC4]"
                                      }`}
                                      title={formatValue(item)}
                                    >
                                      <span className="truncate">
                                        {formatValue(item)}
                                      </span>
                                    </div>

                                    <span
                                      className={`text-xs ${
                                        isActiveCell
                                          ? "font-semibold text-[#D4AF37]"
                                          : "text-[#77AEB8]"
                                      }`}
                                    >
                                      [{index}]
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )
                      ) : isObject ? (
                        <div className="space-y-2">
                          {Object.entries(value).map(
                            ([property, propertyValue]) => (
                              <div
                                key={property}
                                className="flex items-start justify-between gap-4 rounded-lg border border-[#245561]/50 bg-[#080D0F] px-3 py-2.5"
                              >
                                <span className="shrink-0 font-mono text-xs text-[#77CFE0]">
                                  {property}
                                </span>

                                <span
                                  className="break-all text-right font-mono text-sm text-[#F5D76E]"
                                  title={formatValue(propertyValue)}
                                >
                                  {formatValue(propertyValue)}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <span className="break-all text-3xl font-semibold tracking-tight text-[#F5D76E]">
                            {formatValue(value)}
                          </span>

                          <span className="shrink-0 text-[10px] uppercase tracking-widest text-[#77AEB8]">
                            Current value
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Current execution event — event-specific color */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-wide text-[#E8F9FC]">
                Current Execution Event
              </h3>

              {latestEvent && (
                <span className="text-xs text-[#77AEB8]">
                  #{activeStep + 1}
                </span>
              )}
            </div>

            <div
              className={`rounded-xl border ${
                latestEvent ? eventTone.border : "border-[#245561]/60"
              } bg-[#080D0F] p-4 transition-colors`}
            >
              {!latestEvent ? (
                <p className="text-sm text-[#77AEB8]">
                  Run your program to see execution events.
                </p>
              ) : (
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${eventTone.border} ${eventTone.surface}`}
                  >
                    <span className={`text-base ${eventTone.text}`}>
                      {latestEvent.type === "error"
                        ? "!"
                        : latestEvent.type?.startsWith("function-")
                          ? "ƒ"
                          : [
                                "condition",
                                "branch",
                                "loop-iteration",
                                "loop-complete",
                              ].includes(latestEvent.type)
                            ? "↻"
                            : "↗"}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`mb-2 text-xs font-semibold uppercase tracking-widest ${eventTone.text}`}
                    >
                      {getEventTitle(latestEvent)}
                    </p>

                    <p className="break-words font-mono text-sm leading-6 text-[#F5F0E1]">
                      {getEventDescription(latestEvent)}
                    </p>

                    {(latestEvent.line ?? errorInfo?.line) != null && (
                      <p className="mt-3 text-xs text-[#77AEB8]">
                        Source line {latestEvent.line ?? errorInfo.line}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Execution summary — blue-black cards */}
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-[#E8F9FC]">
              Execution Summary
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#245561]/60 bg-[#0D171A] p-4">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg border border-[#245561]/70 bg-[#10252A] text-[#4DD0E1]">
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

                <p className="text-xs text-[#77AEB8]">Total events</p>

                <p className="mt-2 text-2xl font-semibold text-[#E8F9FC]">
                  {events.length}
                </p>
              </div>

              <div className="rounded-xl border border-[#245561]/60 bg-[#0D171A] p-4">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg border border-[#245561]/70 bg-[#10252A] text-[#4DD0E1]">
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

                <p className="text-xs text-[#77AEB8]">Tracked variables</p>

                <p className="mt-2 text-2xl font-semibold text-[#E8F9FC]">
                  {variables.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cyan-accent footer */}
        <div className="flex items-center justify-between border-t border-[#245561]/60 bg-[#0D191D]/80 px-5 py-3">
          <span className="text-xs tracking-wide text-[#77AEB8]">
            TRACE ENGINE
          </span>

          <span
            className={`flex items-center gap-2 text-xs ${
              error ? TONES.red.text : TONES.cyan.text
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                error ? TONES.red.dot : TONES.cyan.dot
              }`}
            />

            {error ? "Execution failed" : "Trace ready"}
          </span>
        </div>
      </div>
    </section>
  );
}
