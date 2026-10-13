"use client";

import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";

export default function CodeEditor({ code, onChange, activeLine = null }) {
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
        "editor.lineHighlightBackground": "#17140D",
        "editorGutter.background": "#080807",
        "editorWidget.background": "#11110E",
        "editorWidget.border": "#39311E",
        "editorIndentGuide.background1": "#292315",
        "editorIndentGuide.activeBackground1": "#6B5729",
        "scrollbarSlider.background": "#6B572933",
        "scrollbarSlider.hoverBackground": "#8D733066",
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

    const newDecorations = validLine
      ? [
          {
            range: new monaco.Range(activeLine, 1, activeLine, 1),
            options: {
              isWholeLine: true,
              className: "trace-current-line",
              linesDecorationsClassName: "trace-line-marker",
            },
          },
        ]
      : [];

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations,
    );
  }, [activeLine, editorReady]);

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
