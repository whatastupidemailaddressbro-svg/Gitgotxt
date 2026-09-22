/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { RepoInput } from "./components/RepoInput";
import { FilterSettings } from "./components/FilterSettings";
import { StatsOverview } from "./components/StatsOverview";
import { FileTreeView } from "./components/FileTreeView";
import { ContainerViewer } from "./components/ContainerViewer";
import { UnpackView } from "./components/UnpackView";
import { HowItWorksModal } from "./components/HowItWorksModal";
import { FilePreviewModal } from "./components/FilePreviewModal";
import { RepoFile, RepoMeta, PackConfig } from "./types";
import { buildTextContainer } from "./utils/packer";
import { processZipFile } from "./utils/localPacker";
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
  const handleFetchRepo = async (url: string, branch?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/fetch-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          branch,
          options: config,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch repository");
      }

      setRepoMeta(data.repo);
      setFiles(data.files);
      setActiveView("output");
    } catch (err: any) {
      setError(err.message || "Failed to connect or fetch repository.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle local zip file processing
  const handleLocalZipSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const processedFiles = await processZipFile(file, config);
      const cleanRepoName = file.name.replace(/\.zip$/i, "");
      setRepoMeta({
        owner: "local",
        repo: cleanRepoName,
        branch: "archive",
        fullRepoName: cleanRepoName,
      });
      setFiles(processedFiles);
      setActiveView("output");
    } catch (err: any) {
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

      {/* How It Works & Unpack Instructions Modal */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />
    </div>
  );
}
