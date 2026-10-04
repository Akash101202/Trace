"use client";

import CodeEditor from "./CodeEditor";

export default function Workspace({ code, onChange }) {
  return (
    <section className="grid min-h-[600px] grid-cols-2 gap-4 bg-zinc-950 p-4">
      {/* Left side */}
      <div className="flex flex-col gap-4">
        {/* Problem */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Problem</h2>

            <span className="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-400">
              Array
            </span>
          </div>

          <p className="text-sm leading-6 text-zinc-400">
            Given an array, modify the values and observe how the program
            changes the data during execution.
          </p>
        </div>

        {/* Code editor */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <div className="border-b border-zinc-800 px-5 py-3">
            <h2 className="text-sm font-semibold">Code</h2>
          </div>

          <div className="flex min-h-0 flex-1 bg-zinc-950">
            <CodeEditor code={code} onChange={onChange} />
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
          <h2 className="text-sm font-semibold">Visualization</h2>

          <span className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Step 2
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
          <p className="text-sm text-zinc-500">Current array state</p>

          <div className="flex gap-3">
            {[10, 2, 8].map((value, index) => (
              <div key={index} className="text-center">
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-xl border text-2xl font-bold ${
                    index === 0
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-zinc-700 bg-zinc-950"
                  }`}
                >
                  {value}
                </div>

                <p className="mt-2 text-xs text-zinc-600">index {index}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs text-zinc-400">
            arr[0] changed <span className="text-zinc-200">5 → 10</span>
          </div>
        </div>
      </div>
    </section>
  );
}
