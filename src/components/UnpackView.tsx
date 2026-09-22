import React, { useState } from "react";
import {
  Upload,
  FileText,
  FolderArchive,
  Download,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Terminal,
  Eye,
  RefreshCw,
} from "lucide-react";
import { parseContainerText, downloadFilesAsZip } from "../utils/unpacker";
import { UnpackedFile } from "../types";

interface UnpackViewProps {
  onPreviewFile?: (file: { path: string; content: string; lines: number; size: number }) => void;
}

export const UnpackView: React.FC<UnpackViewProps> = ({ onPreviewFile }) => {
  const [inputText, setInputText] = useState("");
  const [unpackedFiles, setUnpackedFiles] = useState<UnpackedFile[]>([]);
  const [repoName, setRepoName] = useState<string | undefined>();
  const [asciiTree, setAsciiTree] = useState<string | undefined>();
  const [hasExtracted, setHasExtracted] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<UnpackedFile | null>(null);

  const handleExtract = () => {
    if (!inputText.trim()) return;
    const result = parseContainerText(inputText);
    setUnpackedFiles(result.files);
    setRepoName(result.repoName);
    setAsciiTree(result.asciiTree);
    setHasExtracted(true);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setInputText(text);
      const result = parseContainerText(text);
      setUnpackedFiles(result.files);
      setRepoName(result.repoName);
      setAsciiTree(result.asciiTree);
      setHasExtracted(true);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDownloadZip = async () => {
    if (unpackedFiles.length === 0) return;
    const cleanName = repoName ? `${repoName.replace(/[/\\?%*:|"<>]/g, "_")}-restored.zip` : "unpacked-repo.zip";
    await downloadFilesAsZip(unpackedFiles, cleanName);
  };

  return (
    <div className="space-y-6">
      {/* Intro box */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-100 flex items-center space-x-2">
              <FolderArchive className="w-5 h-5 text-emerald-400" />
              <span>Container Unpacker & Validator</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Paste or drop any RepoPack text container here to restore, inspect, and export all original files.
            </p>
          </div>

          <label
            htmlFor="container-file-upload"
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 cursor-pointer transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Open .txt Container File</span>
            <input
              id="container-file-upload"
              type="file"
              accept=".txt,.py,.sh"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
          </label>
        </div>

        {/* Drop zone / Text area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-3 transition-colors ${
            dragActive
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-zinc-800 bg-zinc-950/60"
          }`}
        >
          <textarea
            id="textarea-container-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste the text container contents here, or drop a container .txt file..."
            rows={5}
            className="w-full bg-transparent text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none font-mono resize-y"
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            Supports any container with standard <code className="text-zinc-400">=== FILE: path ===</code> markers.
          </span>

          <button
            id="btn-unpack-container"
            type="button"
            onClick={handleExtract}
            disabled={!inputText.trim()}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-zinc-950 font-semibold text-xs rounded-xl transition-all cursor-pointer"
          >
            Extract Files
          </button>
        </div>
      </div>

      {/* Extraction Results */}
      {hasExtracted && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
            <div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-semibold text-zinc-100">
                  {unpackedFiles.length} Files Successfully Unpacked
                </h3>
                {repoName && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    {repoName}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                All files extracted faithfully with original line breaks and paths intact.
              </p>
            </div>

            {unpackedFiles.length > 0 && (
              <button
                id="btn-download-unpacked-zip"
                type="button"
                onClick={handleDownloadZip}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Download as .ZIP Archive</span>
              </button>
            )}
          </div>

          {unpackedFiles.length === 0 ? (
            <div className="py-8 text-center text-zinc-400 text-xs">
              <AlertCircle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p>No valid file separators found in the provided text.</p>
              <p className="text-zinc-500 text-[11px] mt-1">
                Make sure the text contains the <code className="text-zinc-300">=== FILE: path ===</code> structure.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* File list */}
              <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/60 max-h-[400px] overflow-y-auto font-mono text-xs">
                <div className="p-2.5 bg-zinc-900 border-b border-zinc-800 font-sans text-xs font-semibold text-zinc-300">
                  Extracted Files ({unpackedFiles.length})
                </div>
                <div className="divide-y divide-zinc-850 p-1">
                  {unpackedFiles.map((file) => (
                    <button
                      key={file.path}
                      type="button"
                      onClick={() => setSelectedFileForPreview(file)}
                      className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                        selectedFileForPreview?.path === file.path
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : "hover:bg-zinc-800/60 text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="truncate">{file.path}</span>
                      </div>
                      <div className="text-[11px] text-zinc-500 shrink-0 ml-2">
                        {file.lines} lines
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview Box */}
              <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950 flex flex-col max-h-[400px]">
                <div className="p-2.5 bg-zinc-900 border-b border-zinc-800 text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span className="truncate font-mono">
                    {selectedFileForPreview ? selectedFileForPreview.path : "Select a file to inspect"}
                  </span>
                  {selectedFileForPreview && (
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {selectedFileForPreview.lines} lines • {(selectedFileForPreview.size / 1024).toFixed(1)} KB
                    </span>
                  )}
                </div>
                <div className="flex-1 p-3 overflow-auto font-mono text-[11px] text-zinc-300 whitespace-pre">
                  {selectedFileForPreview
                    ? selectedFileForPreview.content
                    : "Click any file on the left to preview its content line for line."}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
