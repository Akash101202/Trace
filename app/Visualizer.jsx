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

    const timer = setTimeout(() => {
      const last = execution.events.length - 1;
      const next = Math.min(activeStep + 1, last);
      setActiveStep(next);
      if (next >= last) setIsPlaying(false);
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

  function handleStepBack() {
    setIsPlaying(false);
    setActiveStep((current) => Math.max(0, current - 1));
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

  const canBack = debugMode && activeStep > 0;

  // Keyboard: arrows step, Space plays, Ctrl+Enter runs, Ctrl+Shift+Enter debugs.
  useEffect(() => {
    function onKeyDown(event) {
      const typing =
        event.target instanceof HTMLElement &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName) ||
          event.target.closest(".monaco-editor"));
      const mod = event.ctrlKey || event.metaKey;

      if (mod && event.key === "Enter") {
        if (typing) return; // the editor dispatches its own event
        event.preventDefault();
        handleExecute(event.shiftKey ? "debug" : "run");
        return;
      }
      if (typing || mod || event.altKey || !debugMode) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        handleStep();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        handleStepBack();
      } else if (event.key === " " && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault();
        handleTogglePlayback();
      }
    }
    function onEditorExecute(event) {
      handleExecute(event.detail);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("trace-execute", onEditorExecute);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("trace-execute", onEditorExecute);
    };
  });

  const canPlay =
    debugMode &&
    execution.events.length > 0 &&
    activeStep < execution.events.length - 1;

  return (
    <main className="min-h-dvh bg-trace-bg">
      <Header
        onRun={handleRun}
        onDebug={handleDebug}
        onStep={handleStep}
        onStepBack={handleStepBack}
        canBack={canBack}
        onReset={handleReset}
        onTogglePlayback={handleTogglePlayback}
        canStep={canStep}
        canPlay={canPlay}
        isPlaying={isPlaying}
        debugMode={debugMode}
      />

      {/* Editor + state on the left; every step in the sidebar. */}
      <div className="mx-auto grid w-full max-w-[1920px] grid-cols-1 gap-4 p-3 sm:p-4 xl:h-[calc(100dvh-65px)] xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-5 xl:p-5">
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
      </div>
    </main>
  );
}
