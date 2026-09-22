import React from "react";
import { X, Terminal, FileText, CheckCircle2, Shield, FolderTree, Play } from "lucide-react";

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-zinc-200 text-xs">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-white">
              Container Specification & Self-Unpacking Guide
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 leading-relaxed">
          <div>
            <h4 className="font-semibold text-zinc-100 text-sm mb-1.5 flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>What is a RepoPack Text Container?</span>
            </h4>
            <p className="text-zinc-400">
              A single self-contained text file that packages an entire repository line for line. It acts as both human-readable documentation, an ideal prompt/context format for LLMs, and an executable self-extracting archive.
            </p>
          </div>

          <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
            <h5 className="font-semibold text-zinc-200 flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Strict Stripping & Filtering Rules Enforced:</span>
            </h5>
            <ul className="space-y-1.5 text-zinc-400 pl-4 list-disc">
              <li>
                <strong className="text-zinc-200">Dotfiles & Dotfolders:</strong> Anything with a dot in front of it is stripped (<code className="text-emerald-400">.git</code>, <code className="text-emerald-400">.github</code>, <code className="text-emerald-400">.env</code>, <code className="text-emerald-400">.DS_Store</code>, etc.).
              </li>
              <li>
                <strong className="text-zinc-200">Binary Files:</strong> Images, audio, video, archives, compiled binaries (<code className="text-emerald-400">.wasm</code>, <code className="text-emerald-400">.exe</code>, <code className="text-emerald-400">.dll</code>), fonts, and files with null bytes are completely omitted.
              </li>
              <li>
                <strong className="text-zinc-200">Vendor & Build Artifacts:</strong> <code className="text-zinc-300">node_modules</code>, <code className="text-zinc-300">dist</code>, <code className="text-zinc-300">build</code>, <code className="text-zinc-300">target</code>, <code className="text-zinc-300">__pycache__</code>, and lockfiles are removed.
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-100 text-sm mb-2 flex items-center space-x-1.5">
              <FolderTree className="w-4 h-4 text-emerald-400" />
              <span>Container Layout Structure</span>
            </h4>
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 font-mono text-[11px] text-zinc-400 space-y-1">
              <div>1. <span className="text-emerald-400">#!/usr/bin/env python3</span> (Self-extracting unpacker script + instructions)</div>
              <div>2. <span className="text-teal-400">DIRECTORY STRUCTURE</span> (Full ASCII tree of all included files)</div>
              <div>3. <span className="text-blue-400">FILE: path/to/file.ext</span> (Marked separation headers)</div>
              <div>4. <span className="text-zinc-300">&lt;line-for-line file content&gt;</span></div>
              <div>5. <span className="text-blue-400">END FILE: path/to/file.ext</span></div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-100 text-sm mb-2 flex items-center space-x-1.5">
              <Play className="w-4 h-4 text-emerald-400" />
              <span>How to Dump the Container Back into Files</span>
            </h4>
            <div className="space-y-2">
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <span className="font-semibold text-zinc-200 block mb-1">Method 1: Direct Bash execution (macOS / Linux / WSL)</span>
                <p className="text-zinc-400 mb-2">
                  Because the text container has a universal self-extracting header, you can run it directly with bash:
                </p>
                <div className="p-2 bg-zinc-900 rounded font-mono text-emerald-400 select-all">
                  bash repo_container.txt ./my_restored_repo
                </div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <span className="font-semibold text-zinc-200 block mb-1">Method 2: Direct Python 3 execution</span>
                <div className="p-2 bg-zinc-900 rounded font-mono text-emerald-400 select-all">
                  python3 - &lt; repo_container.txt
                </div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <span className="font-semibold text-zinc-200 block mb-1">Method 3: Built-in Web Unpacker & Standalone Tools</span>
                <p className="text-zinc-400">
                  Switch to the "Unpack Container" tab in this web app to drop the container and download as a <strong className="text-zinc-200">.ZIP</strong> archive. You can also use the standalone <strong className="text-emerald-400">offline/index.html</strong> (with persistent IndexedDB recovery and direct file download) or run <strong className="text-cyan-400">python3 offline/repopack.py</strong> with its interactive user menu.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-zinc-800 bg-zinc-900/90 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs rounded-xl cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
