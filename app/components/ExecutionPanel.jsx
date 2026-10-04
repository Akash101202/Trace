export default function ExecutionPanel() {
  return (
    <section className="border-t border-zinc-800 bg-zinc-950 px-6 py-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Execution Timeline</h2>
          <p className="text-xs text-zinc-500">
            Step through the program execution
          </p>
        </div>

        <span className="text-xs text-zinc-500">2 / 4</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-3 w-3 rounded-full bg-zinc-600" />
        <div className="h-px flex-1 bg-zinc-800" />

        <div className="h-3 w-3 rounded-full bg-blue-500" />
        <div className="h-px flex-1 bg-zinc-800" />

        <div className="h-3 w-3 rounded-full bg-zinc-700" />
        <div className="h-px flex-1 bg-zinc-800" />

        <div className="h-3 w-3 rounded-full bg-zinc-700" />
      </div>

      <div className="mt-3 flex justify-between text-xs text-zinc-600">
        <span>Create array</span>
        <span className="text-blue-400">Update index 0</span>
        <span>Update index 1</span>
        <span>Complete</span>
      </div>
    </section>
  );
}
