export default function Header({ run }) {
  return (
    <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6 py-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">TRACE</h1>
        <p className="text-xs text-zinc-500">Interactive code visualizer</p>
      </div>

      <div className="flex items-center gap-2">
        <button className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm hover:bg-zinc-800">
          Reset
        </button>

        <button className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm hover:bg-zinc-800">
          Step
        </button>

        <button
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
          onClick={run}
        >
          Run ▶
        </button>
      </div>
    </header>
  );
}
