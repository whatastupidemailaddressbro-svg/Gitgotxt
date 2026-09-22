/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { User } from "firebase/auth";
import { Navbar } from "./components/Navbar";
import { RepoInput } from "./components/RepoInput";
import { FilterSettings } from "./components/FilterSettings";
import { StatsOverview } from "./components/StatsOverview";
import { FileTreeView } from "./components/FileTreeView";
import { ContainerViewer } from "./components/ContainerViewer";
import { UnpackView } from "./components/UnpackView";
import { HowItWorksModal } from "./components/HowItWorksModal";
import { FilePreviewModal } from "./components/FilePreviewModal";
import { SaveDestinationModal } from "./components/SaveDestinationModal";
import { PackingProgressBar } from "./components/PackingProgressBar";
import { RepoFile, RepoMeta, PackConfig, PackingProgress } from "./types";
import { buildTextContainer } from "./utils/packer";
import { processZipFile } from "./utils/localPacker";
import { initAuth, googleSignIn, googleSignOut, getAccessToken } from "./services/firebaseAuth";
import { Sparkles, Terminal, FileCode2, Layers } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"pack" | "unpack">("pack");
  const [repoMeta, setRepoMeta] = useState<RepoMeta | null>(null);
  const [files, setFiles] = useState<RepoFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"output" | "files">("output");
  const [previewFile, setPreviewFile] = useState<RepoFile | null>(null);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Active Packing Progress Bar State
  const [packingProgress, setPackingProgress] = useState<PackingProgress>({
    active: false,
    percent: 0,
    title: "",
    step: 1,
    totalSteps: 5,
    detail: "",
  });

  // Google Workspace Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
      }
    } catch (err) {
      console.error("Google sign in failed:", err);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await googleSignOut();
    setUser(null);
    setAccessToken(null);
  };

  // Configuration options
  const [config, setConfig] = useState<PackConfig>({
    stripDotFiles: true,
    stripBinaries: true,
    stripVendorDirs: true,
    stripLockfiles: true,
    maxFileSizeKb: 500,
    unpackerScriptType: "python",
    customIgnorePatterns: "",
  });

  // Calculate packed container
  const packResult = useMemo(() => {
    if (files.length === 0 || !repoMeta) return null;
    return buildTextContainer(
      repoMeta.fullRepoName,
      files,
      config.unpackerScriptType
    );
  }, [files, repoMeta, config.unpackerScriptType]);

  // Fetch repository from GitHub backend
  const handleFetchRepo = async (url: string, branch?: string, githubToken?: string) => {
    setIsLoading(true);
    setError(null);

    const initialRepoName = url.replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "");
    setPackingProgress({
      active: true,
      percent: 15,
      title: "Connecting to GitHub",
      step: 1,
      totalSteps: 5,
      detail: `Resolving repository archive for '${initialRepoName}'...`,
      sourceType: "github",
      repoName: initialRepoName,
    });

    // Staged progression indicators while downloading and processing
    const t1 = setTimeout(() => {
      setPackingProgress((prev) => ({
        ...prev,
        percent: 36,
        step: 2,
        title: "Downloading Repository Archive",
        detail: "Retrieving repository zipball archive from GitHub...",
      }));
    }, 700);

    const t2 = setTimeout(() => {
      setPackingProgress((prev) => ({
        ...prev,
        percent: 60,
        step: 3,
        title: "Decompressing & Scanning Tree",
        detail: "Unpacking archive files and cataloging hierarchy...",
      }));
    }, 1800);

    const t3 = setTimeout(() => {
      setPackingProgress((prev) => ({
        ...prev,
        percent: 80,
        step: 4,
        title: "Applying Stripping & Filtering Rules",
        detail: "Excluding dotfiles, binaries, vendor modules, and lockfiles...",
      }));
    }, 3000);

    const t4 = setTimeout(() => {
      setPackingProgress((prev) => ({
        ...prev,
        percent: 94,
        step: 5,
        title: "Assembling Text Container",
        detail: "Building line-for-line file blocks, ASCII tree, and unpacker...",
      }));
    }, 4500);

    // If no explicit token passed, check local storage
    const effectiveToken = githubToken || (typeof localStorage !== "undefined" ? localStorage.getItem("repopack_github_token") || undefined : undefined);

    try {
      const response = await fetch("/api/fetch-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          branch,
          githubToken: effectiveToken,
          options: config,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch repository");
      }

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);

      setPackingProgress({
        active: true,
        percent: 100,
        step: 5,
        title: "Repository Container Ready",
        totalSteps: 5,
        detail: `Successfully processed ${data.files.length} files.`,
        sourceType: "github",
        repoName: data.repo.fullRepoName,
      });

      setTimeout(() => {
        setPackingProgress((prev) => ({ ...prev, active: false }));
      }, 700);

      setRepoMeta(data.repo);
      setFiles(data.files);
      setActiveView("output");
    } catch (err: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      setPackingProgress((prev) => ({ ...prev, active: false }));
      setError(err.message || "Failed to connect or fetch repository.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle local zip file processing
  const handleLocalZipSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);
    const cleanRepoName = file.name.replace(/\.zip$/i, "");

    setPackingProgress({
      active: true,
      percent: 10,
      title: "Reading Local ZIP Archive",
      step: 1,
      totalSteps: 5,
      detail: `Loading '${file.name}' (${(file.size / 1024).toFixed(1)} KB)...`,
      sourceType: "local",
      repoName: cleanRepoName,
    });

    try {
      const processedFiles = await processZipFile(file, config, (pct, step, detail) => {
        setPackingProgress((prev) => ({
          ...prev,
          percent: pct,
          step,
          title: step === 2 ? "Decompressing Files" : step === 3 ? "Scanning Archive" : "Applying Filters",
          detail,
        }));
      });

      setPackingProgress({
        active: true,
        percent: 100,
        step: 5,
        title: "Repository Container Ready",
        totalSteps: 5,
        detail: `Successfully parsed ${processedFiles.length} files from archive.`,
        sourceType: "local",
        repoName: cleanRepoName,
      });

      setTimeout(() => {
        setPackingProgress((prev) => ({ ...prev, active: false }));
      }, 700);

      setRepoMeta({
        owner: "local",
        repo: cleanRepoName,
        branch: "archive",
        fullRepoName: cleanRepoName,
      });
      setFiles(processedFiles);
      setActiveView("output");
    } catch (err: any) {
      setPackingProgress((prev) => ({ ...prev, active: false }));
      setError(`Error processing local ZIP: ${err.message || String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle file inclusion
  const handleToggleFile = (filePath: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.path === filePath ? { ...f, isSelected: f.isSelected === false ? true : false } : f
      )
    );
  };

  // Copy container text
  const handleCopyContainer = () => {
    if (!packResult) return;
    navigator.clipboard.writeText(packResult.containerText);
  };

  // Download .txt container file
  const handleDownloadTxt = () => {
    if (!packResult || !repoMeta) return;
    const blob = new Blob([packResult.containerText], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = repoMeta.fullRepoName.replace(/[/\\?%*:|"<>]/g, "_");
    a.href = url;
    a.download = `${safeName}_container.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download executable .py or .sh
  const handleDownloadScript = (type: "py" | "sh") => {
    if (!packResult || !repoMeta) return;
    const blob = new Blob([packResult.containerText], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = repoMeta.fullRepoName.replace(/[/\\?%*:|"<>]/g, "_");
    a.href = url;
    a.download = `${safeName}_container.${type}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        user={user}
        isGoogleLoading={isGoogleLoading}
        onSignIn={handleGoogleSignIn}
        onSignOut={handleGoogleSignOut}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab === "pack" ? (
          <>
            {/* Top Row: GitHub Input and Rules */}
            <div className="space-y-4">
              <RepoInput
                onFetchRepo={handleFetchRepo}
                onLocalZipSelect={handleLocalZipSelect}
                isLoading={isLoading}
                error={error}
              />

              {/* Active Packing Progress Bar */}
              <PackingProgressBar progress={packingProgress} />

              <FilterSettings
                config={config}
                onChange={setConfig}
                disabled={isLoading}
              />
            </div>

            {/* If repository is loaded, display Stats and Output */}
            {packResult && repoMeta ? (
              <div className="space-y-5 animate-fade-in">
                {/* Stats and Action Bar */}
                <StatsOverview
                  stats={packResult.stats}
                  repoName={repoMeta.fullRepoName}
                  onCopy={handleCopyContainer}
                  onDownloadTxt={handleDownloadTxt}
                  onDownloadScript={handleDownloadScript}
                  onOpenSaveModal={() => setIsSaveModalOpen(true)}
                />

                {/* View Switcher for the Output Container vs File Tree */}
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <button
                      id="view-tab-container-text"
                      type="button"
                      onClick={() => setActiveView("output")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                        activeView === "output"
                          ? "bg-zinc-800 text-emerald-400 border border-zinc-700 shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Text Container Output ({packResult.stats.includedCount} files)</span>
                    </button>

                    <button
                      id="view-tab-file-inspector"
                      type="button"
                      onClick={() => setActiveView("files")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                        activeView === "files"
                          ? "bg-zinc-800 text-emerald-400 border border-zinc-700 shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>File Inspector & Tree ({files.length} total)</span>
                    </button>
                  </div>

                  <span className="text-xs text-zinc-500 hidden sm:inline font-mono">
                    Output format: Self-unpacking text file
                  </span>
                </div>

                {/* Active View: Container or File Tree */}
                {activeView === "output" ? (
                  <ContainerViewer
                    containerText={packResult.containerText}
                    onCopy={handleCopyContainer}
                    onDownloadTxt={handleDownloadTxt}
                    onOpenSaveModal={() => setIsSaveModalOpen(true)}
                  />
                ) : (
                  <FileTreeView
                    files={files}
                    asciiTree={packResult.asciiTree}
                    onToggleFile={handleToggleFile}
                    onPreviewFile={(f) => setPreviewFile(f)}
                  />
                )}
              </div>
            ) : (
              /* Empty state placeholder */
              !isLoading && (
                <div className="border border-zinc-800/80 rounded-2xl p-8 bg-zinc-900/40 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 mx-auto flex items-center justify-center text-emerald-400">
                    <Terminal className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-200">
                    Enter a public GitHub repository above to generate a text container
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-lg mx-auto leading-relaxed">
                    RepoPack strips all dotfiles, images, binaries, and vendor folders, then organizes the remaining source code into a clean, line-for-line text container prefixed with the directory tree and a self-extracting unpack script.
                  </p>
                </div>
              )
            )}
          </>
        ) : (
          /* Unpack Tab: allows pasting/opening any container and dumping it back into files */
          <UnpackView onPreviewFile={(f) => setPreviewFile(f as RepoFile)} />
        )}
      </main>

      {/* File Preview Drawer / Modal */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />

      {/* Save / Export Destination Modal */}
      {packResult && repoMeta && (
        <SaveDestinationModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          repoName={repoMeta.fullRepoName}
          containerText={packResult.containerText}
          asciiTree={packResult.asciiTree}
          user={user}
          accessToken={accessToken}
          onSignIn={handleGoogleSignIn}
          onSignOut={handleGoogleSignOut}
          onDownloadTxt={handleDownloadTxt}
        />
      )}

      {/* How It Works & Unpack Instructions Modal */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />
    </div>
  );
}
