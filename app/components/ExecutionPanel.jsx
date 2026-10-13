export default function ExecutionPanel({
  events = [],
  activeStep = -1,
  onSelectStep,
}) {
  return (
    <section className="border-t border-zinc-800 bg-zinc-950 px-6 py-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Execution Timeline</h2>
          <p className="text-xs text-zinc-500">
            Select an event to inspect that state
          </p>
        </div>

        <span className="text-xs text-zinc-400">{events.length} events</span>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-zinc-600">
          Run your code to generate an execution timeline.
        </p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {events.map((event, index) => {
            const isActive = index === activeStep;

            const description =
              event.type === "declare"
                ? `${event.variable} = ${event.value}`
                : `${event.variable}: ${event.oldValue} → ${event.newValue}`;

            return (
              <button
                key={index}
                onClick={() => onSelectStep(index)}
                aria-pressed={isActive}
                className={`min-w-48 rounded-lg border p-4 text-left transition-colors ${
                  isActive
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
                }`}
              >
                <p
                  className={`mb-2 text-xs ${
                    isActive ? "text-blue-400" : "text-zinc-500"
                  }`}
                >
                  Step {index + 1} · {event.type}
                </p>

                <p className="text-sm font-medium text-zinc-100">
                  {description}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
