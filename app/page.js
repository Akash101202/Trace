"use client";

import { useEffect, useState } from "react";
import Header from "./components/Header";
import Workspace from "./components/Workspace";
import ExecutionPanel from "./components/ExecutionPanel";

import { parseCode } from "./engine/parser";
import { executeProgram } from "./engine/interpreter";

const initialCode = `let x = 10;
x = x + 5;
x = x * 2;`;

const emptyExecution = {
  variables: {},
  events: [],
  snapshots: [],
};

export default function Home() {
  const [code, setCode] = useState(initialCode);
  const [execution, setExecution] = useState(emptyExecution);
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState("");

  function handleRun() {
    try {
      const ast = parseCode(code);
      const result = executeProgram(ast);

      setExecution(result);
      setActiveStep(result.events.length > 0 ? 0 : -1);
      setIsPlaying(result.events.length > 1);
      setError("");
    } catch (err) {
      setExecution(emptyExecution);
      setActiveStep(-1);
      setIsPlaying(false);
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  // Automatically advance through execution snapshots.
  useEffect(() => {
    if (!isPlaying) return;

    if (activeStep >= execution.events.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setActiveStep((current) => current + 1);
    }, 800);

    return () => clearTimeout(timer);
  }, [isPlaying, activeStep, execution.events.length]);

  function handleStep() {
    setIsPlaying(false);

    if (activeStep < execution.events.length - 1) {
      setActiveStep((current) => current + 1);
    }
  }

  function handleTogglePlayback() {
    if (activeStep < execution.events.length - 1) {
      setIsPlaying((playing) => !playing);
    }
  }

  function handleSelectStep(index) {
    setIsPlaying(false);
    setActiveStep(index);
  }

  function handleReset() {
    setIsPlaying(false);
    setExecution(emptyExecution);
    setActiveStep(-1);
    setError("");
  }

  const canStep =
    execution.events.length > 0 && activeStep < execution.events.length - 1;

  return (
    <main className="min-h-screen bg-zinc-950">
      <Header
        onRun={handleRun}
        onStep={handleStep}
        onReset={handleReset}
        onTogglePlayback={handleTogglePlayback}
        canStep={canStep}
        canResume={canStep}
        isPlaying={isPlaying}
      />

      <Workspace
        code={code}
        onChange={setCode}
        execution={execution}
        activeStep={activeStep}
        error={error}
      />

      <ExecutionPanel
        events={execution.events}
        activeStep={activeStep}
        onSelectStep={handleSelectStep}
      />
    </main>
  );
}
