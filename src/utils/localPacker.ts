import JSZip from "jszip";
import { RepoFile, PackConfig } from "../types";

const BINARY_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "ico", "bmp", "tiff", "psd", "avif",
  "zip", "tar", "gz", "bz2", "xz", "7z", "rar", "tgz",
  "exe", "bin", "dll", "so", "dylib", "wasm", "o", "obj", "class", "jar", "war", "pyc", "pyo",
  "pdf", "docx", "xlsx", "pptx", "odt",
  "mp3", "mp4", "wav", "ogg", "mov", "avi", "flac", "webm", "mkv",
  "woff", "woff2", "ttf", "eot", "otf",
  "db", "sqlite", "sqlite3", "dat", "iso"
]);

const SKIP_DIRECTORIES = new Set([
  "node_modules", "dist", "build", "out", "target", "vendor",
  "__pycache__", ".pytest_cache", ".cache", "coverage", ".nyc_output",
  "bower_components", "Pods"
]);

function isBinaryUint8Array(uint8Array: Uint8Array): boolean {
  const lengthToCheck = Math.min(uint8Array.length, 8000);
  if (lengthToCheck === 0) return false;
  let nonPrintable = 0;
  for (let i = 0; i < lengthToCheck; i++) {
    const code = uint8Array[i];
    if (code === 0) return true;
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
      nonPrintable++;
    }
  }
  return nonPrintable / lengthToCheck > 0.3;
}

export async function processZipFile(
  file: File | Blob,
  config: PackConfig,
  onProgress?: (percent: number, step: number, detail: string) => void
): Promise<RepoFile[]> {
  onProgress?.(15, 2, "Reading and decompressing archive...");
  const zip = await JSZip.loadAsync(file);
  const entries = Object.keys(zip.files);

  onProgress?.(35, 3, `Scanning ${entries.length} archive entries...`);

  // Detect common root prefix
  let rootPrefix = "";
  if (entries.length > 0) {
    const firstEntry = entries[0];
    const slashIdx = firstEntry.indexOf("/");
    if (slashIdx !== -1) {
      const potentialRoot = firstEntry.substring(0, slashIdx + 1);
      const allMatch = entries.every(
        (e) => e.startsWith(potentialRoot) || e === potentialRoot.slice(0, -1)
      );
      if (allMatch) {
        rootPrefix = potentialRoot;
      }
    }
  }

  const results: RepoFile[] = [];
  const validFiles = Object.entries(zip.files).filter(([, f]) => !f.dir);
  let processedCount = 0;

  for (const [entryPath, zipEntry] of validFiles) {
    processedCount++;
    if (processedCount % 5 === 0 || processedCount === validFiles.length) {
      const pct = 35 + Math.round((processedCount / validFiles.length) * 55);
      onProgress?.(pct, 4, `Inspecting and filtering (${processedCount}/${validFiles.length}) files...`);
    }

    let relPath = entryPath;
    if (rootPrefix && relPath.startsWith(rootPrefix)) {
      relPath = relPath.substring(rootPrefix.length);
    }
    if (!relPath) continue;

    const segments = relPath.split("/");
    const fileName = segments[segments.length - 1];
    const extension = fileName.includes(".")
      ? fileName.split(".").pop()?.toLowerCase() || ""
      : "";

    // 1. Dotfiles/dotfolders
    if (config.stripDotFiles && segments.some((seg) => seg.startsWith("."))) {
      results.push({
        path: relPath,
        size: 0,
        lines: 0,
        status: "skipped",
        skipReason: "Dotfile or dotfolder (starts with .)",
      });
      continue;
    }

    // 2. Vendor/build directories
    if (config.stripVendorDirs && segments.some((seg) => SKIP_DIRECTORIES.has(seg))) {
      results.push({
        path: relPath,
        size: 0,
        lines: 0,
        status: "skipped",
        skipReason: "Vendor / build directory",
      });
      continue;
    }

    // 3. Lockfiles
    if (
      config.stripLockfiles &&
      (fileName === "package-lock.json" ||
        fileName === "yarn.lock" ||
        fileName === "pnpm-lock.yaml" ||
        fileName === "Cargo.lock")
    ) {
      results.push({
        path: relPath,
        size: 0,
        lines: 0,
        status: "skipped",
        skipReason: "Dependency lockfile",
      });
      continue;
    }

    // 4. Binary extension
    if (config.stripBinaries && BINARY_EXTENSIONS.has(extension)) {
      results.push({
        path: relPath,
        size: 0,
        lines: 0,
        status: "skipped",
        skipReason: `Binary file extension (.${extension})`,
      });
      continue;
    }

    const uint8 = await zipEntry.async("uint8array");

    // Size limit check
    const sizeKb = uint8.length / 1024;
    if (config.maxFileSizeKb && sizeKb > config.maxFileSizeKb) {
      results.push({
        path: relPath,
        size: uint8.length,
        lines: 0,
        status: "skipped",
        skipReason: `Exceeds ${config.maxFileSizeKb}KB limit (${Math.round(sizeKb)}KB)`,
      });
      continue;
    }

    // Binary byte check
    if (config.stripBinaries && isBinaryUint8Array(uint8)) {
      results.push({
        path: relPath,
        size: uint8.length,
        lines: 0,
        status: "skipped",
        skipReason: "Binary data detected (contains null bytes)",
      });
      continue;
    }

    const decoder = new TextDecoder("utf-8");
    const textContent = decoder.decode(uint8);
    const lineCount = textContent.length > 0 ? textContent.split(/\r\n|\r|\n/).length : 0;

    results.push({
      path: relPath,
      size: uint8.length,
      lines: lineCount,
      content: textContent,
      status: "included",
      isSelected: true,
    });
  }

  results.sort((a, b) => a.path.localeCompare(b.path));
  return results;
}
