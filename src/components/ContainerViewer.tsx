import React, { useState } from "react";
import { Copy, Check, FileText, Download, Code2, Search, ArrowDown } from "lucide-react";

interface ContainerViewerProps {
  containerText: string;
  onCopy: () => void;
  onDownloadTxt: () => void;
}

export const ContainerViewer: React.FC<ContainerViewerProps> = ({
  containerText,
  onCopy,
  onDownloadTxt,
}) => {
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = containerText.split("\n").length;
  const sizeKb = (containerText.length / 1024).toFixed(1);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[520px]">
      {/* Header */}
      <div className="p-3.5 border-b border-zinc-800 bg-zinc-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-zinc-100">
            Self-Contained Text File Output
          </span>
          <span className="text-zinc-500 text-xs">•</span>
          <span className="text-[11px] font-mono text-zinc-400">
            {lineCount.toLocaleString()} lines ({sizeKb} KB)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="btn-viewer-copy"
            type="button"
            onClick={handleCopy}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer ${
              copied
                ? "bg-emerald-600 text-white"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300 stroke-[3]" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          <button
            id="btn-viewer-download"
            type="button"
            onClick={onDownloadTxt}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Save .txt</span>
          </button>
        </div>
      </div>

      {/* Editor / Text view */}
      <div className="flex-1 p-3 bg-zinc-950 overflow-auto font-mono text-[12px] leading-relaxed text-zinc-300 select-all whitespace-pre">
        {containerText}
      </div>

      {/* Footer bar */}
      <div className="p-2.5 border-t border-zinc-800 bg-zinc-950/60 text-[11px] text-zinc-400 flex items-center justify-between">
        <span className="flex items-center space-x-1 text-emerald-400">
          <Code2 className="w-3.5 h-3.5" />
          <span>Embedded Python 3 Self-Extractor + ASCII Directory Tree + Delimited Files</span>
        </span>
        <span className="text-zinc-500 hidden sm:inline">
          Directly runnable: <code className="text-zinc-300">python3 container.txt</code>
        </span>
      </div>
    </div>
  );
};
