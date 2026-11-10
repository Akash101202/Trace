"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate, stagger } from "animejs";

function formatValue(value) {
  if (Array.isArray(value)) return `[${value.map(formatValue).join(", ")}]`;
  if (typeof value === "string") return `"${value}"`;
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "number" && Number.isFinite(value) && !Number.isInteger(value)) {
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

function getFilterCategory(type) {
  if (type === "error") return "errors";
  if (type === "console-log") return "console";
  if (type?.startsWith("function-")) return "functions";
  if (["condition", "branch", "loop-iteration", "loop-complete"].includes(type)) return "flow";
  return "values";
}

// Literal class names so Tailwind can detect them.
const TONES = {
  values: { text: "text-trace-brand", fill: "bg-trace-brand", tint: "bg-trace-brand/12", ring: "ring-trace-brand/45" },
  flow: { text: "text-trace-cyan", fill: "bg-trace-cyan", tint: "bg-trace-cyan/12", ring: "ring-trace-cyan/45" },
  functions: { text: "text-trace-violet", fill: "bg-trace-violet", tint: "bg-trace-violet/12", ring: "ring-trace-violet/45" },
  console: { text: "text-trace-green", fill: "bg-trace-green", tint: "bg-trace-green/12", ring: "ring-trace-green/45" },
  errors: { text: "text-trace-red", fill: "bg-trace-red", tint: "bg-trace-red/12", ring: "ring-trace-red/45" },
};

function getTitle(type) {
  const titles = {
    declare: "Variable declared",
    update: "Variable updated",
    "array-update": "Array updated",
    "object-update": "Object updated",
    condition: "Condition checked",
    branch: "Branch taken",
    "loop-iteration": "Loop iteration",
    "loop-complete": "Loop finished",
    "function-declaration": "Function declared",
    "function-call": "Function called",
    "function-enter": "Entered function",
    "function-return": "Returned",
    "function-exit": "Function finished",
    "console-log": "Console output",
    error: "Error",
  };
  return titles[type] ?? "Execution event";
}

// Short body for a step: a before → after pair where there is one.
function describe(event) {
  const args = (event.arguments ?? []).map(formatValue).join(", ");
  switch (event.type) {
    case "declare":
      return { target: event.variable, after: formatValue(event.value) };
    case "update":
      return { target: event.variable, before: formatValue(event.oldValue), after: formatValue(event.newValue) };
    case "array-update":
      return { target: `${event.variable}[${event.index}]`, before: formatValue(event.oldValue), after: formatValue(event.newValue) };
    case "object-update":
      return { target: `${event.variable}.${event.property}`, before: formatValue(event.oldValue), after: formatValue(event.newValue) };
    case "condition":
      return { text: `Condition is ${formatValue(event.result)}` };
    case "branch":
      return { text: `${event.branch} branch runs` };
    case "loop-iteration":
      return { text: `${event.construct} loop, pass ${event.iteration}` };
    case "loop-complete":
      return { text: `${event.construct} loop ran ${event.iterations} ${event.iterations === 1 ? "time" : "times"}` };
    case "function-declaration":
      return { text: `function ${event.functionName}()` };
    case "function-call":
      return { text: `${event.functionName}(${args})` };
    case "function-enter":
      return { text: `Inside ${event.functionName}(${args})` };
    case "function-return":
    case "function-exit":
      return { target: `${event.functionName}()`, after: formatValue(event.value) };
    case "console-log":
      return { text: args };
    case "error":
      return { text: event.message };
    default:
      return { text: "Execution event" };
  }
}

function plainLabel(event) {
  const body = describe(event);
  if (body.text) return body.text;
  return body.before != null ? `${body.target} from ${body.before} to ${body.after}` : `${body.target} = ${body.after}`;
}

const FILTERS = [
  { id: "all", label: "All" },
  { id: "values", label: "Values" },
  { id: "flow", label: "Flow" },
  { id: "functions", label: "Calls" },
  { id: "console", label: "Output" },
  { id: "errors", label: "Errors" },
];

function StepRow({ event, index, active, played, onSelect, setRef }) {
  const category = getFilterCategory(event.type);
  const tone = TONES[category];
  const body = describe(event);

  return (
    <li className="trace-step relative pl-11">
      {/* Timeline rail node */}
      <span
        className={`absolute left-[7px] top-2.5 z-10 flex h-[26px] w-[26px] items-center justify-center rounded-full text-[11.5px] font-semibold tabular-nums transition-[transform,box-shadow] duration-300 ${
          played ? `${tone.fill} text-[color:var(--trace-on-tone)]` : "bg-trace-surface text-trace-text-subtle"
        } ${active ? "scale-110 shadow-[0_0_0_4px_var(--trace-panel),0_4px_14px_-2px_rgba(0,0,0,0.35)]" : "shadow-[0_0_0_3px_var(--trace-panel)]"}`}
        aria-hidden="true"
      >
        {index + 1}
      </span>

      <button
        ref={setRef}
        type="button"
        onClick={() => onSelect?.(index)}
        aria-current={active ? "step" : undefined}
        aria-label={`Step ${index + 1}: ${getTitle(event.type)}. ${plainLabel(event)}`}
        className={`trace-press group w-full rounded-[14px] px-3 py-2 text-left ${
          active
            ? `${tone.tint} ring-1 ring-inset ${tone.ring} shadow-[var(--trace-shadow)]`
            : played
              ? "hover:bg-trace-surface"
              : "opacity-55 hover:bg-trace-surface hover:opacity-100"
        }`}
      >
        <span className="flex items-baseline justify-between gap-2">
          <span className={`text-[13.5px] font-semibold ${active || played ? tone.text : "text-trace-text-muted"}`}>
            {getTitle(event.type)}
          </span>
          {event.line != null && (
            <span className="shrink-0 text-[12px] tabular-nums text-trace-text-subtle">Line {event.line}</span>
          )}
        </span>

        <span className="mt-0.5 block break-words font-mono text-[13px] leading-5 text-trace-text">
          {body.text ?? (
            <>
              <span className="text-trace-text-muted">{body.target}</span>
              {body.before != null ? (
                <>
                  {" "}
                  <span className="text-trace-text-subtle line-through decoration-trace-text-subtle/50">{body.before}</span>
                  <span className="mx-1.5 text-trace-text-subtle">→</span>
                </>
              ) : (
                <span className="mx-1.5 text-trace-text-subtle">=</span>
              )}
              <span className={`font-semibold ${active ? tone.text : ""}`}>{body.after}</span>
            </>
          )}
        </span>
      </button>
    </li>
  );
}

export default function ExecutionPanel({ events = [], activeStep = -1, onSelectStep }) {
  const [filter, setFilter] = useState("all");
  const listRef = useRef(null);
  const scrollRef = useRef(null);
  const cardRefs = useRef({});

  const counts = useMemo(() => {
    const result = { all: events.length, values: 0, flow: 0, functions: 0, console: 0, errors: 0 };
    for (const event of events) result[getFilterCategory(event.type)] += 1;
    return result;
  }, [events]);

  const filteredEvents = useMemo(
    () =>
      events
        .map((event, index) => ({ event, index }))
        .filter(({ event }) => filter === "all" || getFilterCategory(event.type) === filter),
    [events, filter],
  );

  const progress = events.length && activeStep >= 0 ? ((activeStep + 1) / events.length) * 100 : 0;

  // A fresh run cascades the steps in from the top.
  useEffect(() => {
    if (!listRef.current || !events.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rows = listRef.current.querySelectorAll(".trace-step");
    const animation = animate(rows, {
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 480,
      delay: stagger(Math.min(28, 600 / rows.length)),
      ease: "out(3)",
    });
    return () => animation.revert();
  }, [events, filter]);

  // Keep the active step in view inside the list.
  useEffect(() => {
    const container = scrollRef.current;
    const card = cardRefs.current[activeStep];
    if (!container || !card) return;
    const c = container.getBoundingClientRect();
    const r = card.getBoundingClientRect();
    if (r.top < c.top + 8 || r.bottom > c.bottom - 8) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      container.scrollTo({
        top: container.scrollTop + (r.top - c.top) - c.height / 2 + r.height / 2,
        behavior: reduced ? "auto" : "smooth",
      });
    }
  }, [activeStep, filter, events.length]);

  const activeHidden =
    activeStep >= 0 && events.length > 0 && !filteredEvents.some(({ index }) => index === activeStep);

  return (
    <aside aria-label="Execution steps" className="trace-card trace-card--duo flex min-h-[420px] min-w-0 flex-col overflow-hidden xl:min-h-0">
      <header className="shrink-0 border-b border-trace-border px-4 pb-3 pt-4">
        <div className="flex items-baseline justify-between gap-3 px-1">
          <h2 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-trace-text">Steps</h2>
          <span className="text-[13px] tabular-nums text-trace-text-subtle">
            {events.length === 0
              ? "No run yet"
              : activeStep >= 0
                ? `${activeStep + 1} of ${events.length}`
                : `${events.length} steps`}
          </span>
        </div>

        {/* Progress through the run */}
        <div className="mx-1 mt-3 h-1 overflow-hidden rounded-full bg-trace-surface">
          <div
            className="trace-signature h-full rounded-full transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Segmented filter */}
        <div
          role="radiogroup"
          aria-label="Filter steps"
          className="mt-3 flex gap-0.5 rounded-[10px] bg-trace-surface p-[3px]"
        >
          {FILTERS.map((item) => {
            const selected = filter === item.id;
            const empty = item.id !== "all" && counts[item.id] === 0;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={empty}
                onClick={() => setFilter(item.id)}
                title={item.id === "all" ? `${counts.all} steps` : `${counts[item.id]} ${item.label.toLowerCase()} steps`}
                className={`trace-press flex h-7 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-[7px] px-1.5 text-[12px] font-medium disabled:opacity-35 ${
                  selected
                    ? "bg-trace-panel text-trace-text shadow-[0_1px_3px_rgba(0,0,0,0.12),0_0_0_0.5px_rgba(0,0,0,0.04)]"
                    : "text-trace-text-muted hover:text-trace-text"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {activeHidden && (
          <p className="mb-3 rounded-xl bg-trace-surface px-3 py-2.5 text-[13px] text-trace-text-muted">
            The current step is hidden by this filter.{" "}
            <button type="button" onClick={() => setFilter("all")} className="font-semibold text-trace-accent">
              Show all
            </button>
          </p>
        )}

        {events.length === 0 ? (
          <div className="flex h-full min-h-60 flex-col items-center justify-center px-6 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-trace-surface text-trace-text-subtle">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M8 6h12M8 12h12M8 18h12" />
                <circle cx="4" cy="6" r="1" fill="currentColor" />
                <circle cx="4" cy="12" r="1" fill="currentColor" />
                <circle cx="4" cy="18" r="1" fill="currentColor" />
              </svg>
            </span>
            <p className="text-[15px] font-semibold text-trace-text">Every step appears here</p>
            <p className="mt-1.5 text-[13px] leading-5 text-trace-text-muted">
              Run or debug your program to see each change, branch and call in order.
            </p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <p className="px-3 py-10 text-center text-[13px] text-trace-text-muted">No steps of this kind.</p>
        ) : (
          <ol ref={listRef} className="relative space-y-0.5">
            {/* Rail connecting the step nodes */}
            <span className="absolute bottom-5 left-[19px] top-5 w-[2px] rounded-full bg-trace-surface" aria-hidden="true" />
            {filteredEvents.map(({ event, index }) => (
              <StepRow
                key={`${index}-${event.type}`}
                event={event}
                index={index}
                active={index === activeStep}
                played={index <= activeStep}
                onSelect={onSelectStep}
                setRef={(element) => {
                  if (element) cardRefs.current[index] = element;
                  else delete cardRefs.current[index];
                }}
              />
            ))}
          </ol>
        )}
      </div>
    </aside>
  );
}
