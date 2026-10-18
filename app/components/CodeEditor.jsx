"use client";

import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { useTraceTheme } from "./ThemeProvider";

function getLineTone(type) {
  // Keep execution cyan; make errors red.
  return type === "error" ? "red" : "cyan";
}

function defineTraceThemes(monaco) {
  // =======================================================
  // DARK THEME — deep navy with vibrant syntax colors
  // =======================================================
  monaco.editor.defineTheme("trace-dark", {
    base: "vs-dark",
    inherit: true,

    rules: [
      { token: "keyword", foreground: "C4A7FF", fontStyle: "bold" },
      { token: "number", foreground: "FFD479" },
      { token: "string", foreground: "91E6B3" },
      { token: "comment", foreground: "8190A8", fontStyle: "italic" },
      { token: "identifier", foreground: "E3ECF8" },
      { token: "type.identifier", foreground: "65DFF0" },
      { token: "delimiter", foreground: "A9BAD2" },
      { token: "operator", foreground: "FF9ECF" },
      { token: "function", foreground: "8ED9FF" },
      { token: "variable", foreground: "E3ECF8" },
      { token: "string.key.json", foreground: "8ED9FF" },
    ],

    colors: {
      "editor.background": "#101826",
      "editor.foreground": "#E3ECF8",

      "editorLineNumber.foreground": "#667790",
      "editorLineNumber.activeForeground": "#FFD479",

      "editorCursor.foreground": "#FFD479",
      "editor.selectionBackground": "#4B608755",
      "editor.inactiveSelectionBackground": "#4B608733",

      "editor.lineHighlightBackground": "#172235",
      "editor.lineHighlightBorder": "#00000000",

      "editorLineNumber.border": "#00000000",
      "editorIndentGuide.background1": "#28364B",
      "editorIndentGuide.activeBackground1": "#48D8EF",

      "editorGutter.background": "#101826",
      "editorOverviewRuler.border": "#00000000",

      "editorWidget.background": "#141F30",
      "editorWidget.border": "#354660",

      "editorSuggestWidget.background": "#141F30",
      "editorSuggestWidget.border": "#354660",
      "editorSuggestWidget.selectedBackground": "#263951",
      "editorSuggestWidget.highlightForeground": "#48D8EF",

      "editorBracketMatch.background": "#48D8EF22",
      "editorBracketMatch.border": "#48D8EF",

      "scrollbarSlider.background": "#52647A55",
      "scrollbarSlider.hoverBackground": "#7189A666",
      "scrollbarSlider.activeBackground": "#48D8EF77",
    },
  });

  // =======================================================
  // LIGHT THEME — soft paper-like white with clear syntax
  // =======================================================
  monaco.editor.defineTheme("trace-light", {
    base: "vs",
    inherit: true,

    rules: [
      { token: "keyword", foreground: "7540C8", fontStyle: "bold" },
      { token: "number", foreground: "A85A10" },
      { token: "string", foreground: "087D5B" },
      { token: "comment", foreground: "77859A", fontStyle: "italic" },
      { token: "identifier", foreground: "263247" },
      { token: "type.identifier", foreground: "007F9F" },
      { token: "delimiter", foreground: "526176" },
      { token: "operator", foreground: "BE185D" },
      { token: "function", foreground: "0969A7" },
      { token: "variable", foreground: "263247" },
      { token: "string.key.json", foreground: "0969A7" },
    ],

    colors: {
      "editor.background": "#F9FBFF",
      "editor.foreground": "#263247",

      "editorLineNumber.foreground": "#92A0B3",
      "editorLineNumber.activeForeground": "#966900",

      "editorCursor.foreground": "#966900",
      "editor.selectionBackground": "#C5D8F055",
      "editor.inactiveSelectionBackground": "#C5D8F033",

      "editor.lineHighlightBackground": "#EDF3FC",
      "editor.lineHighlightBorder": "#00000000",

      "editorLineNumber.border": "#00000000",
      "editorIndentGuide.background1": "#DCE5F0",
      "editorIndentGuide.activeBackground1": "#007F9F",

      "editorGutter.background": "#F9FBFF",
      "editorOverviewRuler.border": "#00000000",

      "editorWidget.background": "#FFFFFF",
      "editorWidget.border": "#D6E0ED",

      "editorSuggestWidget.background": "#FFFFFF",
      "editorSuggestWidget.border": "#D6E0ED",
      "editorSuggestWidget.selectedBackground": "#E5EEF9",
      "editorSuggestWidget.highlightForeground": "#007F9F",

      "editorBracketMatch.background": "#007F9F18",
      "editorBracketMatch.border": "#007F9F",

      "scrollbarSlider.background": "#BAC8DA88",
      "scrollbarSlider.hoverBackground": "#8FA3BC99",
      "scrollbarSlider.activeBackground": "#007F9F77",
    },
  });
}

export default function CodeEditor({
  code,
  onChange,
  activeLine = null,
  activeEventType = "",
}) {
  const { theme } = useTraceTheme();

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  const [editorReady, setEditorReady] = useState(false);

  function handleBeforeMount(monaco) {
    defineTraceThemes(monaco);
  }

  function handleEditorMount(editor, monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Set the correct theme immediately when the editor mounts.
    monaco.editor.setTheme(theme === "light" ? "trace-light" : "trace-dark");

    setEditorReady(true);
  }

  // Keep Monaco synchronized with the application theme.
  useEffect(() => {
    const monaco = monacoRef.current;

    if (!monaco || !editorReady) return;

    monaco.editor.setTheme(theme === "light" ? "trace-light" : "trace-dark");
  }, [theme, editorReady]);

  // Highlight the active execution line without losing decorations.
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (!editor || !monaco || !editorReady) return;

    const validLine =
      Number.isInteger(activeLine) &&
      activeLine > 0 &&
      activeLine <= editor.getModel()?.getLineCount();

    const tone = getLineTone(activeEventType);

    const nextDecorations = validLine
      ? [
          {
            range: new monaco.Range(activeLine, 1, activeLine, 1),
            options: {
              isWholeLine: true,
              className: `trace-current-line trace-tone-${tone}`,
              linesDecorationsClassName: `trace-line-marker trace-marker-${tone}`,
            },
          },
        ]
      : [];

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      nextDecorations,
    );

    if (validLine) {
      editor.revealLineInCenterIfOutsideViewport(activeLine);
    }
  }, [activeLine, activeEventType, editorReady]);

  return (
    <div className="h-full w-full overflow-hidden bg-trace-panel">
      <Editor
        height="100%"
        language="javascript"
        theme={theme === "light" ? "trace-light" : "trace-dark"}
        beforeMount={handleBeforeMount}
        onMount={handleEditorMount}
        value={code}
        onChange={(value) => onChange(value ?? "")}
        options={{
          minimap: { enabled: false },

          fontSize: 14,
          lineHeight: 24,
          fontFamily:
            'var(--font-geist-mono), "SFMono-Regular", Consolas, monospace',
          fontLigatures: true,

          padding: { top: 18, bottom: 18 },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: "on",

          renderLineHighlight: "all",
          renderWhitespace: "selection",
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          roundedSelection: true,

          bracketPairColorization: { enabled: true },
          guides: {
            indentation: true,
            highlightActiveIndentation: true,
            bracketPairs: true,
          },

          stickyScroll: { enabled: true },
          folding: true,
          showFoldingControls: "always",
          matchBrackets: "always",

          accessibilitySupport: "auto",
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
            useShadows: false,
          },
        }}
      />
    </div>
  );
}
