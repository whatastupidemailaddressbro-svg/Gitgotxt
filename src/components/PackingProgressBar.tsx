import React, { useEffect, useState } from "react";
import { PackingProgress } from "../types";
import {
  Loader2,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  FolderTree,
  Filter,
  FileCode2,
  Download,
  Github,
  HardDrive,
} from "lucide-react";

interface PackingProgressBarProps {
  progress: PackingProgress;
}

const STEPS = [
  { id: 1, label: "Connect", icon: Github },
  { id: 2, label: "Download", icon: Download },
  { id: 3, label: "Scan ZIP", icon: FolderTree },
  { id: 4, label: "Filter Rules", icon: Filter },
  { id: 5, label: "Assemble", icon: FileCode2 },
];

export const PackingProgressBar: React.FC<PackingProgressBarProps> = ({ progress }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!progress.active) {
      setElapsed(0);
      return;
    }

    const start = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 100) / 10);
    }, 100);

    return () => clearInterval(timer);
  }, [progress.active]);

  if (!progress.active) return null;

  const boundedPercent = Math.min(100, Math.max(0, Math.round(progress.percent)));

  return (
    <div
      id="packing-progress-container"
      className="w-full bg-zinc-900 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden animate-fade-in mb-6"
    >
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header section with active spinner, title, and elapsed time */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-bold text-zinc-100 tracking-tight">
                {progress.title || "Processing Repository Container"}
              </h4>
              {progress.repoName && (
                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[11px] font-mono text-zinc-300 border border-zinc-700">
                  {progress.repoName}
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-400/90 font-medium">
              {progress.detail || "Working on extraction and formatting..."}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-end sm:self-center">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-zinc-950/80 border border-zinc-800 text-xs font-mono text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>{elapsed.toFixed(1)}s</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-white font-mono">
              {boundedPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Primary Progress Bar */}
      <div className="relative z-10 w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 p-0.5 mb-4">
        <div
          id="packing-progress-fill"
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 rounded-full transition-all duration-300 ease-out relative"
          style={{ width: `${boundedPercent}%` }}
        >
          {/* Shimmer animation highlight */}
          <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
        </div>
      </div>

      {/* Step Pipeline Badges */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 border-t border-zinc-800/80 text-[11px]">
        {STEPS.map((stepItem) => {
          const isDone = progress.step > stepItem.id;
          const isCurrent = progress.step === stepItem.id;
          const IconComponent = stepItem.icon;

          return (
            <div
              key={stepItem.id}
              className={`flex items-center space-x-1.5 p-1.5 rounded-lg transition-all ${
                isCurrent
                  ? "bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 font-semibold"
                  : isDone
                  ? "text-zinc-300 bg-zinc-800/40 border border-zinc-800"
                  : "text-zinc-500 opacity-60"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin flex-shrink-0" />
              ) : (
                <IconComponent className="w-3.5 h-3.5 flex-shrink-0" />
              )}
              <span className="truncate">{stepItem.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
