import React, { useState } from "react";
import { Github, ArrowRight, Loader2, Upload, FileCode, CheckCircle, AlertCircle } from "lucide-react";

interface RepoInputProps {
  onFetchRepo: (url: string, branch?: string) => Promise<void>;
  onLocalZipSelect: (file: File) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

const PRESET_REPOS = [
  { name: "developit/mitt", label: "mitt (micro pub/sub, ~5 files)" },
  { name: "sindresorhus/is", label: "is (type check library)" },
  { name: "chalk/chalk", label: "chalk (terminal styling)" },
  { name: "expressjs/express", label: "express (web framework)" },
];

export const RepoInput: React.FC<RepoInputProps> = ({
  onFetchRepo,
  onLocalZipSelect,
  isLoading,
  error,
}) => {
  const [url, setUrl] = useState("https://github.com/developit/mitt");
  const [branch, setBranch] = useState("");
  const [showAdvancedBranch, setShowAdvancedBranch] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onFetchRepo(url.trim(), branch.trim() || undefined);
  };

  const handleSelectPreset = (presetName: string) => {
    setUrl(`https://github.com/${presetName}`);
    onFetchRepo(`https://github.com/${presetName}`);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".zip")) {
        onLocalZipSelect(file);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onLocalZipSelect(e.target.files[0]);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 flex items-center space-x-2">
            <Github className="w-5 h-5 text-emerald-400" />
            <span>Public GitHub Repository</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Enter any public GitHub URL or <code className="text-zinc-300">owner/repo</code> identifier.
          </p>
        </div>

        {/* Local ZIP Alternative toggle */}
        <label
          htmlFor="zip-upload-input"
          className="inline-flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer bg-zinc-800/80 hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700/60 transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-emerald-400" />
          <span>Or pack a local .ZIP repo</span>
          <input
            id="zip-upload-input"
            type="file"
            accept=".zip"
            className="hidden"
            onChange={handleFileInput}
          />
        </label>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
              <Github className="w-4 h-4" />
            </div>
            <input
              id="input-github-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. https://github.com/expressjs/express or chalk/chalk"
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-mono"
              required
            />
          </div>

          {showAdvancedBranch && (
            <div className="w-full sm:w-44">
              <input
                id="input-branch"
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="Branch / tag (opt)"
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-mono"
              />
            </div>
          )}

          <button
            id="btn-fetch-repo"
            type="submit"
            disabled={isLoading || !url.trim()}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-zinc-950 font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer min-w-[140px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                <span>Packing Repo...</span>
              </>
            ) : (
              <>
                <span>Fetch & Pack</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </div>

        {/* Quick presets and Branch toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-zinc-500 font-medium">Try popular examples:</span>
            {PRESET_REPOS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                id={`btn-preset-${preset.name.replace("/", "-")}`}
                onClick={() => handleSelectPreset(preset.name)}
                className="px-2.5 py-1 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg border border-zinc-700/50 transition-colors font-mono cursor-pointer"
              >
                {preset.name}
              </button>
            ))}
          </div>

          <button
            type="button"
            id="btn-toggle-branch-option"
            onClick={() => setShowAdvancedBranch(!showAdvancedBranch)}
            className="text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
          >
            {showAdvancedBranch ? "Hide custom branch" : "+ Specify branch / tag"}
          </button>
        </div>
      </form>

      {/* Error alert if any */}
      {error && (
        <div className="mt-4 p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-red-300">Failed to fetch repository: </span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Drag & Drop Zip Area (Hidden or Drop Zone) */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`mt-3 border border-dashed rounded-xl p-3 text-center transition-colors ${
          dragActive
            ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
            : "border-zinc-800/80 bg-zinc-950/30 text-zinc-500"
        }`}
      >
        <span className="text-[11px]">
          Tip: You can also drag and drop any GitHub source <strong className="text-zinc-400">.ZIP archive</strong> anywhere onto this box to pack offline.
        </span>
      </div>
    </div>
  );
};
