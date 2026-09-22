import React, { useState } from "react";
import { X, Copy, Check, FileCode } from "lucide-react";
import { RepoFile } from "../types";

interface FilePreviewModalProps {
  file: RepoFile | null;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!file) return null;

  const handleCopy = () => {
    if (!file.content) return;
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-4xl w-full h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center space-x-2 truncate">
            <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-mono text-xs font-semibold text-zinc-100 truncate">
              {file.path}
            </span>
            <span className="text-zinc-500 text-xs shrink-0">•</span>
            <span className="text-[11px] text-zinc-400 font-mono shrink-0">
              {file.lines} lines ({(file.size / 1024).toFixed(1)} KB)
            </span>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center space-x-1.5 border border-zinc-700 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 p-4 bg-zinc-950 overflow-auto font-mono text-xs leading-relaxed text-zinc-300 select-all whitespace-pre">
          {file.content || "(No text content)"}
        </div>
      </div>
    </div>
  );
};
