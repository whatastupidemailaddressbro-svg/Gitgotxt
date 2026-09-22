import React, { useState } from "react";
import { SlidersHorizontal, Check, Info, ChevronDown, ChevronUp } from "lucide-react";
import { PackConfig, UnpackerType } from "../types";

interface FilterSettingsProps {
  config: PackConfig;
  onChange: (newConfig: PackConfig) => void;
  disabled?: boolean;
}

export const FilterSettings: React.FC<FilterSettingsProps> = ({
  config,
  onChange,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = (key: keyof PackConfig) => {
    if (disabled) return;
    onChange({
      ...config,
      [key]: !config[key],
    });
  };

  const handleScriptTypeChange = (type: UnpackerType) => {
    if (disabled) return;
    onChange({
      ...config,
      unpackerScriptType: type,
    });
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-zinc-800 text-emerald-400">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">
              Packing Rules & Self-Unpack Config
            </h3>
            <p className="text-xs text-zinc-400">
              Enforcing dotfile exclusion, binary stripping, and self-extracting header.
            </p>
          </div>
        </div>

        <button
          id="btn-toggle-filter-settings"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-1 text-xs text-zinc-400 hover:text-zinc-200 px-2.5 py-1 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <span>{isOpen ? "Collapse options" : "Customize rules"}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Pill summary when collapsed */}
      {!isOpen && (
        <div className="flex flex-wrap gap-2 mt-3 text-[11px]">
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            <Check className="w-3 h-3 stroke-[3]" />
            <span>Dotfiles stripped (.git, .github, .env)</span>
          </span>
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            <Check className="w-3 h-3 stroke-[3]" />
            <span>Binary files stripped</span>
          </span>
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            <Check className="w-3 h-3 stroke-[3]" />
            <span>Vendor dirs excluded</span>
          </span>
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-medium font-mono">
            Unpacker: {config.unpackerScriptType.toUpperCase()} 3
          </span>
        </div>
      )}

      {/* Expanded config details */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-zinc-800 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Dotfiles Rule */}
            <label className="flex items-start space-x-2.5 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors">
              <input
                id="checkbox-strip-dotfiles"
                type="checkbox"
                checked={config.stripDotFiles}
                onChange={() => toggle("stripDotFiles")}
                disabled={disabled}
                className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-500 bg-zinc-900 border-zinc-700"
              />
              <div>
                <span className="font-semibold text-zinc-200">
                  Strip all dotfiles & dotfolders
                </span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Excludes anything starting with a dot (<code className="text-emerald-400">.git</code>, <code className="text-emerald-400">.github</code>, <code className="text-emerald-400">.env</code>, <code className="text-emerald-400">.DS_Store</code>, etc.).
                </p>
              </div>
            </label>

            {/* Binary Files Rule */}
            <label className="flex items-start space-x-2.5 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors">
              <input
                id="checkbox-strip-binaries"
                type="checkbox"
                checked={config.stripBinaries}
                onChange={() => toggle("stripBinaries")}
                disabled={disabled}
                className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-500 bg-zinc-900 border-zinc-700"
              />
              <div>
                <span className="font-semibold text-zinc-200">
                  Strip all binary files
                </span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Filters images, archives, audio, video, compiled binaries, fonts, and inspects for null-bytes.
                </p>
              </div>
            </label>

            {/* Vendor / Build Dirs */}
            <label className="flex items-start space-x-2.5 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors">
              <input
                id="checkbox-strip-vendor-dirs"
                type="checkbox"
                checked={config.stripVendorDirs}
                onChange={() => toggle("stripVendorDirs")}
                disabled={disabled}
                className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-500 bg-zinc-900 border-zinc-700"
              />
              <div>
                <span className="font-semibold text-zinc-200">
                  Strip build & vendor artifacts
                </span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Excludes <code className="text-zinc-300">node_modules</code>, <code className="text-zinc-300">dist</code>, <code className="text-zinc-300">build</code>, <code className="text-zinc-300">vendor</code>, <code className="text-zinc-300">__pycache__</code>.
                </p>
              </div>
            </label>

            {/* Lockfiles */}
            <label className="flex items-start space-x-2.5 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors">
              <input
                id="checkbox-strip-lockfiles"
                type="checkbox"
                checked={config.stripLockfiles}
                onChange={() => toggle("stripLockfiles")}
                disabled={disabled}
                className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-500 bg-zinc-900 border-zinc-700"
              />
              <div>
                <span className="font-semibold text-zinc-200">
                  Strip dependency lockfiles
                </span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Excludes <code className="text-zinc-300">package-lock.json</code>, <code className="text-zinc-300">yarn.lock</code>, <code className="text-zinc-300">pnpm-lock.yaml</code>.
                </p>
              </div>
            </label>
          </div>

          {/* Script Type & File Size */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/80">
            <div>
              <span className="font-semibold text-zinc-200 block mb-1">
                Embedded Unpack Script at Top of File:
              </span>
              <div className="flex items-center space-x-1.5">
                {(["python", "bash", "node"] as UnpackerType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    id={`btn-unpacker-type-${type}`}
                    onClick={() => handleScriptTypeChange(type)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                      config.unpackerScriptType === type
                        ? "bg-emerald-500 text-zinc-950 font-bold shadow-sm"
                        : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {type === "python" ? "Python 3 (Universal)" : type === "bash" ? "Bash Shell" : "Node.js"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="input-max-filesize" className="font-semibold text-zinc-200 block mb-1">
                Max Individual File Size (KB):
              </label>
              <input
                id="input-max-filesize"
                type="number"
                min="50"
                max="5000"
                step="50"
                value={config.maxFileSizeKb}
                onChange={(e) =>
                  onChange({ ...config, maxFileSizeKb: Number(e.target.value) || 500 })
                }
                className="w-28 px-2.5 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
