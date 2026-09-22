import React, { useState } from "react";
import {
  FileText,
  Copy,
  Check,
  Download,
  Terminal,
  FileCode2,
  Cpu,
  Layers,
  FileCheck,
} from "lucide-react";
import { PackStats } from "../types";

interface StatsOverviewProps {
  stats: PackStats;
  repoName: string;
  onCopy: () => void;
  onDownloadTxt: () => void;
  onDownloadScript: (type: "py" | "sh") => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  stats,
  repoName,
  onCopy,
  onDownloadTxt,
  onDownloadScript,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyClick = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const formattedBytes =
    stats.totalBytes < 1024 * 1024
      ? `${(stats.totalBytes / 1024).toFixed(1)} KB`
      : `${(stats.totalBytes / (1024 * 1024)).toFixed(2)} MB`;

  const formattedTokens = stats.estimatedTokens.toLocaleString();

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Repo title & stats */}
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              Ready to Export
            </span>
            <span className="text-zinc-500 text-xs">•</span>
            <span className="text-sm font-semibold text-zinc-100 font-mono">
              {repoName}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
            <div>
              <span className="text-[11px] text-zinc-400 block">Restored Files</span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-xl font-bold text-emerald-400">
                  {stats.includedCount}
                </span>
                <span className="text-xs text-zinc-500">
                  / {stats.totalScanned} scanned
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-zinc-400 block">Total Source Lines</span>
              <span className="text-xl font-bold text-zinc-100 block mt-0.5 font-mono">
                {stats.totalLines.toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-zinc-400 block">Container Size</span>
              <span className="text-xl font-bold text-zinc-100 block mt-0.5 font-mono">
                {formattedBytes}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-zinc-400 block">Estimated Tokens</span>
              <span className="text-xl font-bold text-teal-400 block mt-0.5 font-mono">
                ~{formattedTokens}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-2 lg:pt-0">
          <button
            id="btn-copy-container"
            type="button"
            onClick={handleCopyClick}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-md cursor-pointer ${
              copied
                ? "bg-emerald-600 text-white"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300 stroke-[3]" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-zinc-400" />
                <span>Copy Full Container</span>
              </>
            )}
          </button>

          <button
            id="btn-download-txt"
            type="button"
            onClick={onDownloadTxt}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Download .txt Container</span>
          </button>

          <div className="flex items-center space-x-1">
            <button
              id="btn-download-py"
              type="button"
              onClick={() => onDownloadScript("py")}
              title="Download container as a directly executable .py script"
              className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
            >
              <Terminal className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              id="btn-download-sh"
              type="button"
              onClick={() => onDownloadScript("sh")}
              title="Download container as a shell executable"
              className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
            >
              <FileCode2 className="w-4 h-4 text-teal-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
