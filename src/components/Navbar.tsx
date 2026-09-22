import React from "react";
import { FolderArchive, Terminal, Download, Laptop } from "lucide-react";
import { User } from "firebase/auth";
import { GoogleAuthButton } from "./GoogleAuthButton";

interface NavbarProps {
  onOpenHowItWorks: () => void;
  activeTab: "pack" | "unpack";
  setActiveTab: (tab: "pack" | "unpack") => void;
  user: User | null;
  isGoogleLoading: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenHowItWorks,
  activeTab,
  setActiveTab,
  user,
  isGoogleLoading,
  onSignIn,
  onSignOut,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-zinc-950 font-bold">
            <FolderArchive className="w-5 h-5 text-zinc-950 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">RepoPack</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Text Container
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Public GitHub to self-unpacking text container
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 p-1 bg-zinc-800/80 rounded-xl border border-zinc-700/60">
          <button
            id="tab-pack-repo"
            onClick={() => setActiveTab("pack")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === "pack"
                ? "bg-emerald-500 text-zinc-950 shadow-sm font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Pack Repository
          </button>
          <button
            id="tab-unpack-container"
            onClick={() => setActiveTab("unpack")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === "unpack"
                ? "bg-emerald-500 text-zinc-950 shadow-sm font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Unpack Container
          </button>
        </div>

        {/* Google Auth, Offline Editions & Guide buttons */}
        <div className="flex items-center space-x-2">
          <GoogleAuthButton
            user={user}
            isLoading={isGoogleLoading}
            onSignIn={onSignIn}
            onSignOut={onSignOut}
          />

          <a
            id="btn-offline-html"
            href="/offline/index.html"
            target="_blank"
            rel="noopener noreferrer"
            title="Open Standalone Offline HTML Version (with persistent storage & auto-download)"
            className="hidden lg:flex items-center space-x-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 transition-all"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Offline HTML</span>
          </a>

          <a
            id="btn-offline-py"
            href="/offline/repopack.py"
            download="repopack.py"
            title="Download Standalone Python CLI Script (with interactive menu)"
            className="hidden lg:flex items-center space-x-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Python Menu</span>
          </a>

          <button
            id="btn-how-it-works"
            onClick={onOpenHowItWorks}
            className="flex items-center space-x-1.5 text-xs font-medium text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/70 transition-all cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Unpack Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
};
