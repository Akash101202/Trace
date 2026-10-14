"use client";

function getTone(type) {
  if (type === "error") return "red";
  if (type?.startsWith("function-")) return "violet";

  if (
    ["condition", "branch", "loop-iteration", "loop-complete"].includes(type)
  ) {
    return "cyan";
  }

  return "gold";
}

const TONES = {
  gold: {
    border: "border-[#6B5729]",
    active: "border-[#D4AF37] bg-[#211B0D]",
    text: "text-[#D4AF37]",
    dot: "bg-[#D4AF37]",
  },
  cyan: {
    border: "border-[#245561]",
    active: "border-[#4DD0E1] bg-[#0D191D]",
    text: "text-[#77CFE0]",
    dot: "bg-[#4DD0E1]",
  },
  violet: {
    border: "border-[#50427F]",
    active: "border-[#8B7CFF] bg-[#171326]",
    text: "text-[#B7A7FF]",
    dot: "bg-[#8B7CFF]",
  },
  red: {
    border: "border-red-500/40",
    active: "border-red-400 bg-red-500/10",
    text: "text-red-400",
    dot: "bg-red-400",
  },
};

function describeEvent(event) {
  switch (event.type) {
    case "declare":
      return `${event.variable} = ${Array.isArray(event.value) ? `[${event.value.join(", ")}]` : event.value}`;

    case "update":
      return `${event.variable}: ${event.oldValue} → ${event.newValue}`;

    case "array-update":
      return `${event.variable}[${event.index}]: ${event.oldValue} → ${event.newValue}`;

    case "condition":
      return `Condition → ${event.result}`;

    case "branch":
      return `${event.branch} branch selected`;

    case "loop-iteration":
      return `${event.construct} loop · iteration ${event.iteration}`;

    case "loop-complete":
      return `${event.construct} loop completed (${event.iterations} iterations)`;

    case "function-declaration":
      return `function ${event.functionName} declared`;

    case "function-call":
      return `${event.functionName}(${(event.arguments ?? []).join(", ")}) called`;

    case "function-enter":
      return `Entered ${event.functionName}()`;

    case "function-return":
      return `${event.functionName} returned ${event.value}`;

    case "function-exit":
      return `${event.functionName}() completed`;

    case "error":
      return `Execution failed: ${event.message}`;

    default:
      return "Execution event";
  }
}

function getTitle(type) {
  const titles = {
    declare: "Declaration",
    update: "Variable update",
    "array-update": "Array mutation",
    condition: "Condition",
    branch: "Branch",
    "loop-iteration": "Loop iteration",
    "loop-complete": "Loop completed",
    "function-declaration": "Function declared",
    "function-call": "Function call",
    "function-enter": "Function entered",
    "function-return": "Return value",
    "function-exit": "Function completed",
    error: "Execution error",
  };

  return titles[type] ?? "Execution event";
}

export default function ExecutionPanel({
  events = [],
  activeStep = -1,
  onSelectStep,
}) {
  return (
    <section className="border-t border-[#302819] bg-[#080807] px-4 py-6 md:px-6">
      <div className="mx-auto max-w-[1700px]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#F5F0E1]">
              Execution Timeline
            </h2>
            <p className="mt-1 text-xs text-[#81765A]">
              Select any event to inspect its recorded state.
            </p>
          </div>

          <span className="rounded-full border border-[#39311E] bg-[#11110E] px-3 py-1.5 text-xs text-[#B6A780]">
            {events.length > 0 && activeStep >= 0
              ? `${activeStep + 1} / ${events.length} steps`
              : `${events.length} events`}
          </span>
        </div>

        {events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#39311E] bg-[#0D0C09] p-8 text-center">
            <p className="text-sm text-[#C7B995]">
              Your execution history will appear here.
            </p>
            <p className="mt-2 text-xs text-[#81765A]">
              Run your program to generate events.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-3">
            <div className="flex w-max min-w-full gap-3">
              {events.map((event, index) => {
                const isActive = index === activeStep;
                const tone = TONES[getTone(event.type)];

                return (
                  <button
                    key={`${index}-${event.type}`}
                    onClick={() => onSelectStep(index)}
                    aria-pressed={isActive}
                    className={`group relative flex w-56 shrink-0 flex-col rounded-xl border p-4 text-left transition-all duration-200 ${
                      isActive
                        ? `${tone.active} shadow-lg`
                        : `border-[#302819] bg-[#0D0C09] hover:${tone.border} hover:bg-[#11110E]`
                    }`}
                  >
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
                        <span className="text-xs text-[#B6A780]">
                          Step {index + 1}
                        </span>
                      </span>

                      {isActive && (
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider ${tone.text}`}
                        >
                          Active
                        </span>
                      )}
                    </div>

                    <p
                      className={`mb-2 text-xs font-semibold uppercase tracking-wider ${tone.text}`}
                    >
                      {getTitle(event.type)}
                    </p>

                    <p className="break-words font-mono text-sm leading-6 text-[#E8DEC4]">
                      {describeEvent(event)}
                    </p>

                    {event.line != null && (
                      <p className="mt-3 text-xs text-[#81765A]">
                        Line {event.line}
                      </p>
                    )}

                    <div
                      className={`mt-4 h-0.5 w-full rounded-full transition-colors ${
                        isActive ? tone.dot : "bg-[#302819]"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
