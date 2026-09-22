import React, { useState, useEffect } from "react";
import {
  Github,
  ArrowRight,
  Loader2,
  Upload,
  FileCode,
  CheckCircle,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  Trash2,
  Lock,
  ShieldCheck,
} from "lucide-react";

interface RepoInputProps {
  onFetchRepo: (url: string, branch?: string, githubToken?: string) => Promise<void>;
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

const STORAGE_TOKEN_KEY = "repopack_github_token";

export const RepoInput: React.FC<RepoInputProps> = ({
  onFetchRepo,
  onLocalZipSelect,
  isLoading,
  error,
}) => {
  const [url, setUrl] = useState("https://github.com/developit/mitt");
  const [branch, setBranch] = useState("");
  const [showAdvancedBranch, setShowAdvancedBranch] = useState(false);
  const [showTokenPanel, setShowTokenPanel] = useState(false);
  const [githubToken, setGithubToken] = useState("");
  const [rememberToken, setRememberToken] = useState(true);
  const [showTokenText, setShowTokenText] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Load saved token from browser storage on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(STORAGE_TOKEN_KEY);
      if (savedToken) {
        setGithubToken(savedToken);
      }
    } catch (e) {
      console.warn("Could not read from localStorage:", e);
    }
  }, []);

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setGithubToken(val);
    if (rememberToken) {
      try {
        if (val.trim()) {
          localStorage.setItem(STORAGE_TOKEN_KEY, val.trim());
        } else {
          localStorage.removeItem(STORAGE_TOKEN_KEY);
        }
      } catch (err) {
        console.warn("Could not save token to localStorage:", err);
      }
    }
  };

  const handleRememberToggle = (checked: boolean) => {
    setRememberToken(checked);
    try {
      if (checked && githubToken.trim()) {
        localStorage.setItem(STORAGE_TOKEN_KEY, githubToken.trim());
      } else if (!checked) {
        localStorage.removeItem(STORAGE_TOKEN_KEY);
      }
    } catch (err) {
      console.warn("Could not modify localStorage token:", err);
    }
  };

  const handleClearToken = () => {
    setGithubToken("");
    try {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    } catch (err) {
      console.warn("Could not remove token from localStorage:", err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onFetchRepo(url.trim(), branch.trim() || undefined, githubToken.trim() || undefined);
  };

  const handleSelectPreset = (presetName: string) => {
    setUrl(`https://github.com/${presetName}`);
    onFetchRepo(`https://github.com/${presetName}`, undefined, githubToken.trim() || undefined);
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

  const hasTokenStored = Boolean(githubToken.trim());

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 flex items-center space-x-2">
            <Github className="w-5 h-5 text-emerald-400" />
            <span>GitHub Repository</span>
            {hasTokenStored && (
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center space-x-1">
                <Lock className="w-2.5 h-2.5" />
                <span>Private Repos Enabled</span>
              </span>
            )}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Enter any public or private GitHub repository URL or <code className="text-zinc-300">owner/repo</code> identifier.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* GitHub Token configuration toggle */}
          <button
            id="btn-toggle-token-panel"
            type="button"
            onClick={() => setShowTokenPanel(!showTokenPanel)}
            className={`inline-flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              hasTokenStored
                ? "bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                : "bg-zinc-800/80 hover:bg-zinc-800 border-zinc-700/60 text-zinc-300 hover:text-zinc-100"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{hasTokenStored ? "Private Token Active" : "Private Repo Token"}</span>
          </button>

          {/* Local ZIP Alternative toggle */}
          <label
            htmlFor="zip-upload-input"
            className="inline-flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer bg-zinc-800/80 hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700/60 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pack local .ZIP</span>
            <input
              id="zip-upload-input"
              type="file"
              accept=".zip"
              className="hidden"
              onChange={handleFileInput}
            />
          </label>
        </div>
      </div>

      {/* GitHub Token / Private Repo Drawer */}
      {showTokenPanel && (
        <div className="mb-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-200">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>GitHub Personal Access Token (for Private Repositories & API limits)</span>
            </div>
            {hasTokenStored && (
              <button
                type="button"
                onClick={handleClearToken}
                className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center space-x-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Stored Token</span>
              </button>
            )}
          </div>

          <div className="relative">
            <input
              id="input-github-token"
              type={showTokenText ? "text" : "password"}
              value={githubToken}
              onChange={handleTokenChange}
              placeholder="ghp_... or github_pat_..."
              className="w-full pl-3 pr-10 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={() => setShowTokenText(!showTokenText)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              {showTokenText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-zinc-400 gap-2">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                id="checkbox-remember-token"
                type="checkbox"
                checked={rememberToken}
                onChange={(e) => handleRememberToggle(e.target.checked)}
                className="rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900"
              />
              <span>Keep token saved in browser's local persistent storage for future sessions</span>
            </label>

            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline inline-flex items-center space-x-1"
            >
              <span>Create GitHub Token (needs 'repo' scope) ↗</span>
            </a>
          </div>
        </div>
      )}

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
              placeholder="e.g. https://github.com/owner/private-repo or expressjs/express"
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
