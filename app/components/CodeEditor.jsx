"use client";

import Editor from "@monaco-editor/react";

export default function CodeEditor({ code, onChange }) {
  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language="javascript"
        theme="vs-dark"
        value={code}
        onChange={(value) => onChange(value ?? "")}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          padding: { top: 16 },
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
