"use client";

import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";

function getLineTone(type) {
  // The execution pointer is cyan in every mode.
  // Errors remain red for visibility.
  return type === "error" ? "red" : "cyan";
}
export default function CodeEditor({
  code,
  onChange,
  activeLine = null,
  activeEventType = "",
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const [editorReady, setEditorReady] = useState(false);

  function handleBeforeMount(monaco) {
    monaco.editor.defineTheme("trace-gold", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "D4AF37" },
        { token: "number", foreground: "F5D76E" },
        { token: "string", foreground: "A8B875" },
        {
          token: "comment",
          foreground: "81765A",
          fontStyle: "italic",
        },
        { token: "identifier", foreground: "E8DEC4" },
        { token: "type.identifier", foreground: "E5C46B" },
        { token: "delimiter", foreground: "B6A780" },
        { token: "operator", foreground: "D4AF37" },
      ],
      colors: {
        "editor.background": "#080807",
        "editor.foreground": "#F5F0E1",
        "editorLineNumber.foreground": "#625638",
        "editorLineNumber.activeForeground": "#D4AF37",
        "editorCursor.foreground": "#F5D76E",
        "editor.selectionBackground": "#6B572955",
        "editor.inactiveSelectionBackground": "#6B572930",
        "editor.lineHighlightBackground": "#11110E",
        "editorLineNumber.border": "#00000000",
        "editorIndentGuide.background1": "#292315",
        "editorIndentGuide.activeBackground1": "#6B5729",
        "editorWidget.background": "#11110E",
        "editorWidget.border": "#39311E",
        "editorSuggestWidget.background": "#11110E",
        "editorSuggestWidget.border": "#39311E",
        "editorSuggestWidget.selectedBackground": "#302819",
        "editorGutter.background": "#080807",
        "editorOverviewRuler.border": "#00000000",
        "scrollbarSlider.background": "#6B572933",
        "scrollbarSlider.hoverBackground": "#8D733066",
        "scrollbarSlider.activeBackground": "#D4AF3744",
      },
    });
  }

  function handleEditorMount(editor, monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setEditorReady(true);
  }

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (!editor || !monaco) return;

    const validLine = Number.isInteger(activeLine) && activeLine > 0;

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

    // Keep the active execution line in view.
    if (validLine) {
      editor.revealLineInCenterIfOutsideViewport(activeLine);
    }
  }, [activeLine, activeEventType, editorReady]);

  return (
    <div className="h-full w-full overflow-hidden">
      <Editor
        height="100%"
        language="javascript"
        theme="trace-gold"
        beforeMount={handleBeforeMount}
        onMount={handleEditorMount}
        value={code}
        onChange={(value) => onChange(value ?? "")}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineHeight: 24,
          fontFamily: "JetBrains Mono, Fira Code, monospace",
          fontLigatures: true,
          padding: { top: 20, bottom: 20 },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: "on",
          renderLineHighlight: "all",
          smoothScrolling: true,
          cursorBlinking: "smooth",
          roundedSelection: true,
          bracketPairColorization: { enabled: true },
          guides: {
            indentation: true,
            highlightActiveIndentation: true,
          },
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
      />
    </div>
  );
}
