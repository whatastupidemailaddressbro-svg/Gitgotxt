import React, { useState } from "react";
import {
  Folder,
  FileText,
  FileCode,
  CheckCircle2,
  XCircle,
  Search,
  Eye,
  CheckSquare,
  Square,
  FileCheck,
  AlertTriangle,
} from "lucide-react";
import { RepoFile } from "../types";

interface FileTreeViewProps {
  files: RepoFile[];
  asciiTree: string;
  onToggleFile: (path: string) => void;
  onPreviewFile: (file: RepoFile) => void;
}

export const FileTreeView: React.FC<FileTreeViewProps> = ({
  files,
  asciiTree,
  onToggleFile,
  onPreviewFile,
}) => {
  const [activeTab, setActiveTab] = useState<"tree" | "included" | "skipped">("included");
  const [search, setSearch] = useState("");

  const filteredFiles = files.filter((f) =>
    f.path.toLowerCase().includes(search.toLowerCase())
  );

  const includedFiles = filteredFiles.filter((f) => f.status === "included");
  const skippedFiles = filteredFiles.filter((f) => f.status === "skipped");

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[520px]">
      {/* Header and Subtabs */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <button
            id="tab-view-included"
            type="button"
            onClick={() => setActiveTab("included")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
              activeTab === "included"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Included ({files.filter((f) => f.status === "included").length})</span>
          </button>

          <button
            id="tab-view-skipped"
            type="button"
            onClick={() => setActiveTab("skipped")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
              activeTab === "skipped"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Stripped / Skipped ({files.filter((f) => f.status === "skipped").length})</span>
          </button>

          <button
            id="tab-view-ascii-tree"
            type="button"
            onClick={() => setActiveTab("tree")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
              activeTab === "tree"
                ? "bg-zinc-800 text-zinc-100 border border-zinc-700 font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Folder className="w-3.5 h-3.5 text-zinc-400" />
            <span>ASCII Tree</span>
          </button>
        </div>

        {/* Search input */}
        {activeTab !== "tree" && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input
              id="input-search-files"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter file paths..."
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            />
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
        {activeTab === "tree" && (
          <div className="p-3 bg-zinc-950 rounded-xl text-zinc-300 overflow-x-auto whitespace-pre font-mono leading-relaxed select-text">
            {asciiTree}
          </div>
        )}

        {activeTab === "included" && (
          <div className="space-y-1">
            {includedFiles.length === 0 ? (
              <div className="py-12 text-center text-zinc-500">
                No included files matching search filter.
              </div>
            ) : (
              includedFiles.map((file) => {
                const isSelected = file.isSelected !== false;
                return (
                  <div
                    key={file.path}
                    className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                      isSelected
                        ? "bg-zinc-950/60 hover:bg-zinc-800/60 border border-zinc-800/80"
                        : "opacity-40 bg-zinc-950/20 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => onToggleFile(file.path)}
                        className="text-zinc-400 hover:text-emerald-400 cursor-pointer shrink-0"
                        title={isSelected ? "Exclude from container" : "Include in container"}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-600" />
                        )}
                      </button>

                      <FileCode className="w-4 h-4 text-emerald-400/80 shrink-0" />
                      <span className="truncate text-zinc-200 select-all font-medium">
                        {file.path}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 ml-2">
                      <span className="text-[11px] text-zinc-400">
                        {file.lines} lines
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                      <button
                        type="button"
                        onClick={() => onPreviewFile(file)}
                        className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title="Quick preview line-for-line content"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "skipped" && (
          <div className="space-y-1">
            {skippedFiles.length === 0 ? (
              <div className="py-12 text-center text-zinc-500">
                No files were skipped.
              </div>
            ) : (
              skippedFiles.map((file) => (
                <div
                  key={file.path}
                  className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/40 border border-zinc-800/40 text-zinc-400"
                >
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <XCircle className="w-4 h-4 text-amber-500/70 shrink-0" />
                    <span className="truncate text-zinc-300 font-mono">
                      {file.path}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 ml-2">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 font-sans">
                      {file.skipReason || "Skipped by filter"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="p-2.5 border-t border-zinc-800 bg-zinc-950/50 text-[11px] text-zinc-400 flex items-center justify-between">
        <span>
          Showing {activeTab === "included" ? includedFiles.length : skippedFiles.length} files
        </span>
        <span className="text-zinc-500">
          Uncheck to manually omit any file from final export
        </span>
      </div>
    </div>
  );
};
