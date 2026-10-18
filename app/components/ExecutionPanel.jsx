"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

  if (value === null) {
    return "null";
  }

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

function getTone(type) {
  if (type === "error") return "red";
  if (type === "console-log") return "green";

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

const TONES = {
  gold: {
    border: "border-trace-brand/35",
    active: "border-trace-brand/70 bg-trace-brand/10",
    text: "text-trace-brand",
    dot: "bg-trace-brand",
    surface: "bg-trace-brand/10",
    label: "Value change",
    icon: "↗",
  },
  cyan: {
    border: "border-trace-cyan/30",
    active: "border-trace-cyan/60 bg-trace-cyan/10",
    text: "text-trace-cyan",
    dot: "bg-trace-cyan",
    surface: "bg-trace-cyan/10",
    label: "Control flow",
    icon: "↻",
  },
  violet: {
    border: "border-trace-violet/30",
    active: "border-trace-violet/60 bg-trace-violet/10",
    text: "text-trace-violet",
    dot: "bg-trace-violet",
    surface: "bg-trace-violet/10",
    label: "Function",
    icon: "ƒ",
  },
  green: {
    border: "border-trace-green/30",
    active: "border-trace-green/60 bg-trace-green/10",
    text: "text-trace-green",
    dot: "bg-trace-green",
    surface: "bg-trace-green/10",
    label: "Console output",
    icon: ">_",
  },
  red: {
    border: "border-trace-red/35",
    active: "border-trace-red/65 bg-trace-red/10",
    text: "text-trace-red",
    dot: "bg-trace-red",
    surface: "bg-trace-red/10",
    label: "Error",
    icon: "!",
  },
};

function getTitle(type) {
  const titles = {
    declare: "Variable declared",
    update: "Variable updated",
    "array-update": "Array mutation",
    "object-update": "Object mutation",
    condition: "Condition evaluated",
    branch: "Branch selected",
    "loop-iteration": "Loop iteration",
    "loop-complete": "Loop completed",
    "function-declaration": "Function declared",
    "function-call": "Function call",
    "function-enter": "Function entered",
    "function-return": "Return value",
    "function-exit": "Function completed",
    "console-log": "Console output",
    error: "Execution error",
  };

  return titles[type] ?? "Execution event";
}

function describeEvent(event) {
  switch (event.type) {
    case "declare":
      return `${event.variable} = ${formatValue(event.value)}`;

    case "update":
      return `${event.variable}: ${formatValue(event.oldValue)} → ${formatValue(event.newValue)}`;

    case "array-update":
      return `${event.variable}[${event.index}]: ${formatValue(event.oldValue)} → ${formatValue(event.newValue)}`;

    case "object-update":
      return `${event.variable}.${event.property}: ${formatValue(event.oldValue)} → ${formatValue(event.newValue)}`;

    case "condition":
      return `Condition → ${formatValue(event.result)}`;

    case "branch":
      return `${event.branch} branch selected`;

    case "loop-iteration":
      return `${event.construct} loop · iteration ${event.iteration}`;

    case "loop-complete":
      return `${event.construct} loop completed (${event.iterations} iterations)`;

    case "function-declaration":
      return `function ${event.functionName} declared`;

    case "function-call":
      return `${event.functionName}(${(event.arguments ?? []).map(formatValue).join(", ")}) called`;

    case "function-enter":
      return `Entered ${event.functionName}(${(event.arguments ?? []).map(formatValue).join(", ")})`;

    case "function-return":
      return `${event.functionName} returned ${formatValue(event.value)}`;

    case "function-exit":
      return `${event.functionName}() completed → ${formatValue(event.value)}`;

    case "console-log":
      return (event.arguments ?? []).map(formatValue).join(" ");

    case "error":
      return `Execution failed: ${event.message}`;

    default:
      return "Execution event";
  }
}

function getFilterCategory(type) {
  if (type === "error") return "errors";
  if (type === "console-log") return "console";
  if (type?.startsWith("function-")) return "functions";

  if (
    ["condition", "branch", "loop-iteration", "loop-complete"].includes(type)
  ) {
    return "flow";
  }

  return "values";
}

const FILTERS = [
  { id: "all", label: "All events" },
  { id: "values", label: "Values" },
  { id: "flow", label: "Control flow" },
  { id: "functions", label: "Functions" },
  { id: "console", label: "Console" },
  { id: "errors", label: "Errors" },
];

export default function ExecutionPanel({
  events = [],
  activeStep = -1,
  onSelectStep,
}) {
  const [filter, setFilter] = useState("all");

  const scrollContainerRef = useRef(null);
  const cardRefs = useRef({});

  const counts = useMemo(() => {
    const result = {
      all: events.length,
      values: 0,
      flow: 0,
      functions: 0,
      console: 0,
      errors: 0,
    };

    for (const event of events) {
      result[getFilterCategory(event.type)] += 1;
    }

    return result;
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events
      .map((event, index) => ({ event, index }))
      .filter(({ event }) => {
        return filter === "all" || getFilterCategory(event.type) === filter;
      });
  }, [events, filter]);

  const activeEventVisible = filteredEvents.some(
    ({ index }) => index === activeStep,
  );

  // Bring the active event into view without changing the page's
  // vertical scroll position.
  useEffect(() => {
    if (activeStep < 0 || filter !== "all") return;

    const container = scrollContainerRef.current;
    const card = cardRefs.current[activeStep];

    if (!container || !card) return;

    const containerRect = container.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();

    const isOutside =
      cardRect.left < containerRect.left ||
      cardRect.right > containerRect.right;

    if (!isOutside) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const offset =
      cardRect.left -
      containerRect.left -
      (containerRect.width - cardRect.width) / 2;

    container.scrollTo({
      left: container.scrollLeft + offset,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [activeStep, filter, events.length]);

  return (
    <section className="border-t border-trace-border bg-trace-bg px-3 py-6 sm:px-5 md:px-6">
      <div className="mx-auto max-w-[1800px]">
        {/* Timeline heading */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-trace-cyan/30 bg-trace-cyan/10 text-trace-cyan">
              <svg
                viewBox="0 0 24 24"
                width="19"
                height="19"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 5h16M4 12h16M4 19h16" />
                <circle cx="8" cy="5" r="1.5" fill="currentColor" />
                <circle cx="15" cy="12" r="1.5" fill="currentColor" />
                <circle cx="10" cy="19" r="1.5" fill="currentColor" />
              </svg>
            </div>

            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-trace-cyan">
                Execution history
              </p>

              <h2 className="text-base font-semibold text-trace-text sm:text-lg">
                Timeline
              </h2>

              <p className="mt-1 max-w-lg text-xs leading-5 text-trace-text-muted sm:text-sm">
                Select an event to inspect the recorded program state at that
                step.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-trace-border bg-trace-panel px-3 py-2 text-right">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-trace-text-subtle">
              Current position
            </p>

            <p className="mt-0.5 font-mono text-sm font-semibold text-trace-text">
              {activeStep >= 0 && events.length > 0
                ? `${activeStep + 1} / ${events.length}`
                : `${events.length} events`}
            </p>
          </div>
        </div>

        {/* Event filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {FILTERS.map((item) => {
            const selected = filter === item.id;
            const count = counts[item.id];

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                aria-pressed={selected}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trace-cyan ${
                  selected
                    ? "border-trace-cyan/50 bg-trace-cyan/10 text-trace-cyan"
                    : "border-trace-border bg-trace-panel text-trace-text-muted hover:border-trace-border-strong hover:bg-trace-surface-hover hover:text-trace-text"
                }`}
              >
                {item.label}

                <span
                  className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] ${
                    selected
                      ? "bg-trace-cyan/15 text-trace-cyan"
                      : "bg-trace-surface text-trace-text-subtle"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Current event is hidden by the active filter */}
        {!activeEventVisible && activeStep >= 0 && events.length > 0 && (
          <p className="mb-3 rounded-lg border border-trace-brand/25 bg-trace-brand/5 px-3 py-2 text-xs text-trace-text-muted">
            The current step is hidden by this filter. Choose{" "}
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="font-semibold text-trace-brand underline decoration-trace-brand/40 underline-offset-2 hover:decoration-trace-brand"
            >
              All events
            </button>{" "}
            to return to it.
          </p>
        )}

        {/* Empty states */}
        {events.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-trace-border bg-trace-panel p-8 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-trace-cyan/25 bg-trace-cyan/10 text-trace-cyan">
              <svg
                viewBox="0 0 24 24"
                width="21"
                height="21"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>

            <p className="text-sm font-semibold text-trace-text">
              Your timeline starts here
            </p>

            <p className="mt-2 text-xs leading-5 text-trace-text-muted">
              Run or debug your program to generate execution events.
            </p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-trace-border bg-trace-panel p-8 text-center">
            <p className="text-sm font-medium text-trace-text">
              No{" "}
              {FILTERS.find((item) => item.id === filter)?.label.toLowerCase()}{" "}
              yet
            </p>

            <p className="mt-1 text-xs text-trace-text-muted">
              Try another filter to explore this execution.
            </p>
          </div>
        ) : (
          <>
            {/* Horizontal timeline */}
            <div
              ref={scrollContainerRef}
              className="overflow-x-auto overscroll-x-contain pb-3"
              aria-label="Execution events"
            >
              <div className="flex w-max min-w-full items-stretch gap-3">
                {filteredEvents.map(({ event, index }) => {
                  const isActive = index === activeStep;
                  const tone = TONES[getTone(event.type)];

                  return (
                    <button
                      key={`${index}-${event.type}`}
                      ref={(element) => {
                        if (element) {
                          cardRefs.current[index] = element;
                        } else {
                          delete cardRefs.current[index];
                        }
                      }}
                      type="button"
                      onClick={() => onSelectStep?.(index)}
                      aria-pressed={isActive}
                      aria-label={`Step ${index + 1}: ${getTitle(event.type)}. ${describeEvent(event)}`}
                      className={`group relative flex w-[235px] shrink-0 flex-col overflow-hidden rounded-xl border p-3.5 text-left transition-all duration-200 sm:w-[255px] sm:p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trace-cyan ${
                        isActive
                          ? `${tone.active} shadow-[var(--trace-shadow)]`
                          : `border-trace-border bg-trace-panel hover:${tone.border} hover:bg-trace-panel-raised`
                      }`}
                    >
                      {/* Active indicator */}
                      <div
                        className={`absolute inset-x-0 top-0 h-[3px] transition-opacity ${
                          isActive ? tone.dot : "bg-transparent"
                        }`}
                        aria-hidden="true"
                      />

                      <div className="mb-4 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-lg border ${tone.border} ${tone.surface} text-xs font-bold ${tone.text}`}
                            aria-hidden="true"
                          >
                            {tone.icon}
                          </span>

                          <span className="text-xs font-medium text-trace-text-muted">
                            Step {index + 1}
                          </span>
                        </div>

                        {isActive ? (
                          <span
                            className={`rounded-full border ${tone.border} ${tone.surface} px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${tone.text}`}
                          >
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] text-trace-text-subtle">
                            {event.line != null ? `L${event.line}` : ""}
                          </span>
                        )}
                      </div>

                      <p
                        className={`mb-2 text-[10px] font-bold uppercase tracking-[0.15em] ${tone.text}`}
                      >
                        {getTitle(event.type)}
                      </p>

                      <p className="min-h-12 break-words font-mono text-xs leading-5 text-trace-text sm:text-sm">
                        {describeEvent(event)}
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-2 border-t border-trace-border/70 pt-3">
                        <span className="text-[10px] text-trace-text-subtle">
                          {event.line != null
                            ? `Source line ${event.line}`
                            : "Execution event"}
                        </span>

                        <span
                          className={`text-xs font-semibold transition-transform ${
                            isActive
                              ? tone.text
                              : "text-trace-text-subtle group-hover:translate-x-0.5 group-hover:text-trace-text"
                          }`}
                          aria-hidden="true"
                        >
                          {isActive ? "●" : "→"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-trace-text-subtle">
              <span>
                Showing {filteredEvents.length} of {events.length} events
              </span>

              <span className="hidden sm:inline">
                Select a card to inspect that point in execution
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
