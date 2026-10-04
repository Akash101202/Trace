"use client";
import ExecutionPanel from "./components/ExecutionPanel";
import Header from "./components/Header";
import Workspace from "./components/Workspace";
import { useState } from "react";
import { execute } from "./engine/executor";

export default function Home() {
  const [code, setCode] = useState(`let arr = [5, 2, 8];

arr[0] = 10;
arr[1] = arr[0] + 3;`);

  function handleRun() {
    const result = execute("return 2 + 3");
    console.log(result);
  }

  return (
    <main className="min-h-screen border-2 border-dotted">
      <Header run={handleRun} />
      <Workspace code={code} onChange={setCode} />
      <ExecutionPanel />
    </main>
  );
}
