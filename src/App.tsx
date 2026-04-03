import Editor from "@monaco-editor/react";
import {
  CircleHelp,
  Download,
  RotateCcw,
  Upload,
  BrushCleaning,
} from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";
import { ReactFlowProvider, type Edge } from "reactflow";
import "reactflow/dist/style.css";
import { FlowViewport } from "./components/FlowViewport";
import { HelpSidebar } from "./components/HelpSidebar";
import { IconButton } from "./components/IconButton";
import { EDITOR_MODEL_URI } from "./constants/editorSchema";
import { useResizableSplit } from "./hooks/useResizableSplit";
import { configureMonaco, handleEditorMount } from "./lib/editorConfig";
import { starterSchema, useSchemaStore } from "./store/useSchemaStore";

function Workspace() {
  const { source, nodes, edges, error, collections, setSource, updateNodes } =
    useSchemaStore();
  const [helpOpen, setHelpOpen] = useState(false);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const { editorWidth, containerRef, startResize } = useResizableSplit();

  const highlightedFieldPaths = selectedEdgeId
    ? edges.find((edge) => edge.id === selectedEdgeId)?.data
    : null;

  const renderedNodes = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      activeFieldKeys: highlightedFieldPaths
        ? [
            highlightedFieldPaths.sourceFieldKey,
            highlightedFieldPaths.targetFieldKey,
          ]
        : [],
    },
  }));

  const renderedEdges = edges.map((edge): Edge => {
    const isSelected = edge.id === selectedEdgeId;
    const sourceNode = nodes.find((node) => node.id === edge.source);
    const targetNode = nodes.find((node) => node.id === edge.target);
    const sourceOnLeft =
      sourceNode && targetNode
        ? sourceNode.position.x > targetNode.position.x
        : false;

    return {
      ...edge,
      animated: isSelected,
      label: undefined,
      sourceHandle: `${sourceOnLeft ? "source-left" : "source-right"}-${edge.data?.sourceFieldPath}`,
      targetHandle: `${sourceOnLeft ? "target-right" : "target-left"}-${edge.data?.targetFieldPath}`,
      style: {
        stroke: isSelected ? "#67e8f9" : "#94a3b8",
        strokeWidth: isSelected ? 1.6 : 1.15,
      },
      zIndex: 0,
    };
  });

  const handleExport = () => {
    const blob = new Blob([source], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "schema.mongoml";
    link.click();

    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const content = await file.text();
    setSource(content);
    event.target.value = "";
  };

  const handleBeautify = () => {
    try {
      const parsed = JSON.parse(source);
      setSource(JSON.stringify(parsed, null, 2));
    } catch {
      // Keep current content unchanged when JSON is invalid.
    }
  };

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#2b2b2b] text-slate-100">
      <header className="flex h-14 items-center justify-between border-b border-[#343942] bg-[#1f232a] px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2f81f7] text-lg font-semibold text-white shadow-lg shadow-[#2f81f7]/20">
            M
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              Mongo Schema Diagrams
            </p>
            <p className="text-xs text-slate-400">
              Interactive MongoDB document modeling
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <IconButton
            label="Import .mongoml file"
            onClick={() => importInputRef.current?.click()}
            icon={<Upload className="h-4 w-4" />}
          />
          <IconButton
            label="Save as .mongoml"
            onClick={handleExport}
            icon={<Download className="h-4 w-4" />}
          />
          <IconButton
            label="Beautify schema"
            onClick={handleBeautify}
            icon={<BrushCleaning className="h-4 w-4" />}
          />
          <IconButton
            label="Reset sample"
            onClick={() => setSource(starterSchema)}
            icon={<RotateCcw className="h-4 w-4" />}
          />
          <IconButton
            label={helpOpen ? "Close help" : "Open help"}
            onClick={() => setHelpOpen((value) => !value)}
            icon={<CircleHelp className="h-4 w-4" />}
          />
        </div>
        <input
          ref={importInputRef}
          type="file"
          accept=".mongoml,.json,application/json,text/plain"
          className="hidden"
          onChange={(event) => {
            void handleImport(event);
          }}
        />
      </header>

      <section className="flex h-[calc(100vh-5.5rem)] min-h-0 flex-1 overflow-hidden">
        <div ref={containerRef} className="flex min-w-0 flex-1 overflow-hidden">
          <div
            className="min-w-0 border-r border-[#343942] bg-[#1f1f1f]"
            style={{ width: `${editorWidth}%` }}
          >
            <div className="h-full">
              <Editor
                height="100%"
                defaultLanguage="json"
                theme="mongoml-dark"
                path={EDITOR_MODEL_URI}
                value={source}
                onChange={(value) => setSource(value ?? "")}
                beforeMount={configureMonaco}
                onMount={handleEditorMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: "on",
                  lineNumbersMinChars: 3,
                  padding: { top: 18, bottom: 18 },
                  scrollBeyondLastLine: false,
                  overviewRulerBorder: false,
                  quickSuggestions: {
                    other: true,
                    comments: false,
                    strings: true,
                  },
                  suggestOnTriggerCharacters: true,
                  acceptSuggestionOnCommitCharacter: true,
                  tabCompletion: "on",
                  snippetSuggestions: "top",
                  wordBasedSuggestions: "currentDocument",
                }}
              />
            </div>
          </div>

          <div className="relative hidden w-4 shrink-0 bg-[#2b2b2b] lg:block">
            <button
              type="button"
              aria-label="Resize panes"
              className="absolute inset-y-0 left-1/2 w-4 -translate-x-1/2 cursor-col-resize"
              onPointerDown={startResize}
            >
              <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[#343942]" />
              <span className="absolute left-1/2 top-1/2 flex h-12 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#3b4048] bg-[#323843] text-slate-400 shadow-lg">
                <span className="text-sm">⋮</span>
              </span>
            </button>
          </div>

          <div className="min-w-0 flex-1 bg-[#4a4a58]">
            <div className="h-full bg-[radial-gradient(circle,_rgba(200,200,210,0.18)_1px,transparent_1px)] bg-[size:12px_12px]">
              <FlowViewport
                nodes={renderedNodes}
                edges={renderedEdges}
                updateNodes={updateNodes}
                setSelectedEdgeId={setSelectedEdgeId}
              />
            </div>
          </div>
        </div>

        <HelpSidebar isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
      </section>

      <footer
        className={`flex h-8 items-center justify-between border-t px-4 text-[11px] ${
          error
            ? "border-[#7b3035] bg-[#5b2329] text-[#ffd3d6]"
            : "border-[#343942] bg-[#1f232a] text-slate-400"
        }`}
      >
        <div className="flex items-center gap-4 overflow-hidden">
          <span className="truncate">
            {error ? "Schema error" : "Schema valid"}
          </span>
          <span>{collections.length} collections</span>
          <span>{edges.length} relationships</span>
          {selectedEdgeId && <span>Relationship focused</span>}
        </div>
        <div className="flex items-center gap-4">
          <span>{error ?? "Live sync enabled"}</span>
        </div>
      </footer>
    </main>
  );
}

function App() {
  return (
    <ReactFlowProvider>
      <Workspace />
    </ReactFlowProvider>
  );
}

export default App;
