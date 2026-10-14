"use client";

import { useEffect, useState } from "react";
import Header from "./components/Header";
import Workspace from "./components/Workspace";
import ExecutionPanel from "./components/ExecutionPanel";

import { parseCode } from "./engine/parser";
import { executeProgram } from "./engine/interpreter";

const initialCode = `let arr = [5, 2, 8];
arr[0] = 10;
arr[1] = arr[0] + 3;`;

const emptyExecution = {
  variables: {},
  events: [],
  snapshots: [],
};

export default function Home() {
  const [code, setCode] = useState(initialCode);
  const [execution, setExecution] = useState(emptyExecution);
  const [activeStep, setActiveStep] = useState(-1);
  const [executionMode, setExecutionMode] = useState("run");
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState("");
  const [errorInfo, setErrorInfo] = useState(null);

  const debugMode = executionMode === "debug";

  function handleExecute(mode) {
    setIsPlaying(false);
    setExecutionMode(mode);

    try {
      const ast = parseCode(code);
      const result = executeProgram(ast);

      setExecution(result);
      setError("");
      setErrorInfo(null);

      if (mode === "debug") {
        // Begin at the first event and wait for user input.
        setActiveStep(result.events.length > 0 ? 0 : -1);
      } else {
        // Normal Run shows the final state immediately.
        setActiveStep(result.events.length > 0 ? result.events.length - 1 : -1);
      }
    } catch (caughtError) {
      const traceInfo = caughtError?.traceInfo;

      const message =
        caughtError instanceof Error
          ? caughtError.message
          : String(caughtError);

      const line =
        traceInfo?.line ??
        caughtError?.traceLine ??
        caughtError?.loc?.line ??
        null;

      const column =
        traceInfo?.column ??
        (caughtError?.loc?.column != null
          ? caughtError.loc.column + 1
          : (caughtError?.traceColumn ?? null));

      const kind = traceInfo?.kind ?? (caughtError?.loc ? "syntax" : "runtime");

      setError(message);
      setErrorInfo({ kind, message, line, column });

      if (traceInfo) {
        const events = [
          ...traceInfo.events,
          {
            type: "error",
            message,
            kind,
            line,
            column,
          },
        ];

        const snapshots = [...traceInfo.snapshots, traceInfo.variables ?? {}];

        setExecution({
          variables: traceInfo.variables ?? {},
          events,
          snapshots,
        });

        setActiveStep(
          mode === "debug" && traceInfo.events.length > 0
            ? 0
            : events.length - 1,
        );
      } else {
        // Parsing failed before execution began.
        setExecution(emptyExecution);
        setActiveStep(-1);
      }
    }
  }

  function handleRun() {
    handleExecute("run");
  }

  function handleDebug() {
    handleExecute("debug");
  }

  // Automatic playback is available in Debug mode.
  useEffect(() => {
    if (!isPlaying || !debugMode) return;

    if (activeStep >= execution.events.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setActiveStep((current) => current + 1);
    }, 800);

    return () => clearTimeout(timer);
  }, [isPlaying, debugMode, activeStep, execution.events.length]);

  function handleStep() {
    setIsPlaying(false);

    if (activeStep < execution.events.length - 1) {
      setActiveStep((current) => current + 1);
    }
  }

  function handleTogglePlayback() {
    if (activeStep >= execution.events.length - 1) return;

    setIsPlaying((playing) => !playing);
  }

  function handleSelectStep(index) {
    setIsPlaying(false);
    setActiveStep(index);
  }

  function handleReset() {
    setIsPlaying(false);
    setExecution(emptyExecution);
    setActiveStep(-1);
    setExecutionMode("run");
    setError("");
    setErrorInfo(null);
  }

  const canStep =
    debugMode &&
    execution.events.length > 0 &&
    activeStep < execution.events.length - 1;

  const canPlay =
    debugMode &&
    execution.events.length > 0 &&
    activeStep < execution.events.length - 1;

  return (
    <main className="min-h-screen bg-[#080807]">
      <Header
        onRun={handleRun}
        onDebug={handleDebug}
        onStep={handleStep}
        onReset={handleReset}
        onTogglePlayback={handleTogglePlayback}
        canStep={canStep}
        canPlay={canPlay}
        isPlaying={isPlaying}
        debugMode={debugMode}
      />

      <Workspace
        code={code}
        onChange={setCode}
        execution={execution}
        activeStep={activeStep}
        error={error}
        errorInfo={errorInfo}
      />

      <ExecutionPanel
        events={execution.events}
        activeStep={activeStep}
        onSelectStep={handleSelectStep}
      />
    </main>
  );
}
