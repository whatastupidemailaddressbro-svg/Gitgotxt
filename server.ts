import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import JSZip from "jszip";

const app = express();
const PORT = 3000;

// Support json payloads and raw buffers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Standard binary file extensions to skip
const BINARY_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "ico", "bmp", "tiff", "psd", "avif",
  "zip", "tar", "gz", "bz2", "xz", "7z", "rar", "tgz",
  "exe", "bin", "dll", "so", "dylib", "wasm", "o", "obj", "class", "jar", "war", "pyc", "pyo",
  "pdf", "docx", "xlsx", "pptx", "odt",
  "mp3", "mp4", "wav", "ogg", "mov", "avi", "flac", "webm", "mkv",
  "woff", "woff2", "ttf", "eot", "otf",
  "db", "sqlite", "sqlite3", "dat", "iso"
]);

// Vendor / build directory names to skip when doing upload
const SKIP_DIRECTORIES = new Set([
  "node_modules", "dist", "build", "out", "target", "vendor",
  "__pycache__", ".pytest_cache", ".cache", "coverage", ".nyc_output",
  "bower_components", "Pods"
]);

function isBinaryBuffer(buffer: Buffer): boolean {
  // Check for null bytes or high non-text byte ratio in first 8000 bytes
  const lengthToCheck = Math.min(buffer.length, 8000);
  if (lengthToCheck === 0) return false;
  let nonPrintable = 0;
  for (let i = 0; i < lengthToCheck; i++) {
    const code = buffer[i];
    if (code === 0) return true; // Null byte indicates binary
    // printable ASCII, tab, newline, carriage return, or UTF-8 lead bytes
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
      nonPrintable++;
    }
  }
  return nonPrintable / lengthToCheck > 0.3;
}

export interface PackOptions {
  stripDotFiles?: boolean;
  stripBinaries?: boolean;
  stripVendorDirs?: boolean;
  stripLockfiles?: boolean;
  maxFileSizeKb?: number;
  unpackerType?: "python" | "bash" | "node";
}

// API Health
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve offline standalone tools directory
app.use("/offline", express.static(path.join(process.cwd(), "offline")));

// Parse GitHub URL helper
function parseGithubUrl(rawInput: string) {
  let cleaned = rawInput.trim();
  // Strip git@github.com: or https://github.com/
  cleaned = cleaned.replace(/^git@github\.com:/, "").replace(/^https?:\/\/github\.com\//, "");
  // Strip trailing .git
  cleaned = cleaned.replace(/\.git$/, "");
  // Split segments
  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length < 2) {
    throw new Error("Invalid GitHub repository format. Expected 'owner/repo' or 'https://github.com/owner/repo'");
  }
  const owner = parts[0];
  const repo = parts[1];
  let branch: string | undefined = undefined;
  let subpath: string | undefined = undefined;

  // Handle tree/branch or blob/branch urls: e.g. owner/repo/tree/main/src
  if (parts[2] === "tree" || parts[2] === "blob") {
    if (parts[3]) {
      branch = parts[3];
      if (parts.length > 4) {
        subpath = parts.slice(4).join("/");
      }
    }
  }

  return { owner, repo, branch, subpath };
}

// Endpoint to fetch and inspect repository details before or during packing
app.post("/api/fetch-repo", async (req, res) => {
  try {
    const { url, branch: customBranch, options = {} } = req.body;
    if (!url) {
      return res.status(400).json({ error: "Repository URL is required" });
    }

    const { owner, repo, branch: urlBranch, subpath } = parseGithubUrl(url);
    const targetBranch = customBranch || urlBranch;

    // Fetch archive from GitHub
    // Try download URLs:
    // 1. codeload.github.com/{owner}/{repo}/zip/refs/heads/{branch} or zipball API
    const candidateUrls: string[] = [];
    if (targetBranch) {
      candidateUrls.push(
        `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/${targetBranch}`,
        `https://codeload.github.com/${owner}/${repo}/zip/refs/tags/${targetBranch}`,
        `https://api.github.com/repos/${owner}/${repo}/zipball/${targetBranch}`
      );
    } else {
      // Default branch: try main, master, or default zipball redirect
      candidateUrls.push(
        `https://api.github.com/repos/${owner}/${repo}/zipball`,
        `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/main`,
        `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/master`
      );
    }

    let zipBuffer: Buffer | null = null;
    let fetchError = "";

    for (const downloadUrl of candidateUrls) {
      try {
        const response = await fetch(downloadUrl, {
          headers: {
            "User-Agent": "RepoPack-Container-Tool",
            Accept: "application/vnd.github.v3+json, application/zip, */*"
          },
          redirect: "follow"
        });

        if (response.ok) {
          const arrayBuf = await response.arrayBuffer();
          zipBuffer = Buffer.from(arrayBuf);
          break;
        } else {
          fetchError = `GitHub responded with status ${response.status}: ${response.statusText}`;
        }
      } catch (err: any) {
        fetchError = err.message || String(err);
      }
    }

    if (!zipBuffer || zipBuffer.length === 0) {
      return res.status(404).json({
        error: `Could not download repository archive from GitHub. ${fetchError || "Please check if the repository is public and the branch exists."}`
      });
    }

    // Process ZIP with JSZip
    const zip = await JSZip.loadAsync(zipBuffer);
    
    // GitHub zip archives have a root folder like "repo-name-commit-hash/"
    // Detect and strip the common root prefix
    const entries = Object.keys(zip.files);
    let rootPrefix = "";
    if (entries.length > 0) {
      const firstEntry = entries[0];
      const slashIdx = firstEntry.indexOf("/");
      if (slashIdx !== -1) {
        const potentialRoot = firstEntry.substring(0, slashIdx + 1);
        const allMatch = entries.every(e => e.startsWith(potentialRoot) || e === potentialRoot.slice(0, -1));
        if (allMatch) {
          rootPrefix = potentialRoot;
        }
      }
    }

    const {
      stripDotFiles = true,
      stripBinaries = true,
      stripVendorDirs = true,
      stripLockfiles = true,
      maxFileSizeKb = 500
    } = options as PackOptions;

    interface ProcessedFile {
      path: string;
      size: number;
      lines: number;
      content?: string;
      status: "included" | "skipped";
      skipReason?: string;
    }

    const processedFiles: ProcessedFile[] = [];

    for (const [entryPath, file] of Object.entries(zip.files)) {
      if (file.dir) continue;

      let relativePath = entryPath;
      if (rootPrefix && relativePath.startsWith(rootPrefix)) {
        relativePath = relativePath.substring(rootPrefix.length);
      }

      if (!relativePath) continue;

      // Check subpath filter if specified in tree URL
      if (subpath && !relativePath.startsWith(subpath)) {
        continue;
      }

      const pathSegments = relativePath.split("/");
      const fileName = pathSegments[pathSegments.length - 1];
      const extension = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() || "" : "";

      // 1. Check dotfiles / dotfolders rule: "including anything with a dot in front of it"
      if (stripDotFiles && pathSegments.some(seg => seg.startsWith("."))) {
        processedFiles.push({
          path: relativePath,
          size: 0,
          lines: 0,
          status: "skipped",
          skipReason: "Dotfile or dotfolder (starts with .)"
        });
        continue;
      }

      // 2. Check vendor / build directories rule: "normally skipped when doing a GitHub upload"
      if (stripVendorDirs && pathSegments.some(seg => SKIP_DIRECTORIES.has(seg))) {
        processedFiles.push({
          path: relativePath,
          size: 0,
          lines: 0,
          status: "skipped",
          skipReason: "Vendor / build directory"
        });
        continue;
      }

      // 3. Check lockfiles
      if (stripLockfiles && (fileName === "package-lock.json" || fileName === "yarn.lock" || fileName === "pnpm-lock.yaml" || fileName === "Cargo.lock" || fileName === "composer.lock")) {
        processedFiles.push({
          path: relativePath,
          size: 0,
          lines: 0,
          status: "skipped",
          skipReason: "Dependency lockfile"
        });
        continue;
      }

      // 4. Check known binary extensions
      if (stripBinaries && BINARY_EXTENSIONS.has(extension)) {
        processedFiles.push({
          path: relativePath,
          size: 0,
          lines: 0,
          status: "skipped",
          skipReason: `Binary file extension (.${extension})`
        });
        continue;
      }

      // Read content buffer
      const buffer = await file.async("nodebuffer");

      // Check file size threshold
      const sizeKb = buffer.length / 1024;
      if (maxFileSizeKb && sizeKb > maxFileSizeKb) {
        processedFiles.push({
          path: relativePath,
          size: buffer.length,
          lines: 0,
          status: "skipped",
          skipReason: `File size exceeds ${maxFileSizeKb}KB (${Math.round(sizeKb)}KB)`
        });
        continue;
      }

      // 5. Binary content inspection (null bytes, high unprintable ratio)
      if (stripBinaries && isBinaryBuffer(buffer)) {
        processedFiles.push({
          path: relativePath,
          size: buffer.length,
          lines: 0,
          status: "skipped",
          skipReason: "Binary data detected (contains null bytes or non-text content)"
        });
        continue;
      }

      // Text file is accepted! Read line for line
      const textContent = buffer.toString("utf-8");
      // Count lines
      const lineCount = textContent.length > 0 ? textContent.split(/\r\n|\r|\n/).length : 0;

      processedFiles.push({
        path: relativePath,
        size: buffer.length,
        lines: lineCount,
        content: textContent,
        status: "included"
      });
    }

    // Sort files alphabetically by path
    processedFiles.sort((a, b) => a.path.localeCompare(b.path));

    const includedFiles = processedFiles.filter(f => f.status === "included");
    const skippedFiles = processedFiles.filter(f => f.status === "skipped");

    const totalLines = includedFiles.reduce((acc, f) => acc + f.lines, 0);
    const totalBytes = includedFiles.reduce((acc, f) => acc + f.size, 0);

    return res.json({
      repo: {
        owner,
        repo,
        branch: targetBranch || "default",
        fullRepoName: `${owner}/${repo}`
      },
      stats: {
        totalScanned: processedFiles.length,
        includedCount: includedFiles.length,
        skippedCount: skippedFiles.length,
        totalLines,
        totalBytes
      },
      files: processedFiles
    });
  } catch (error: any) {
    console.error("Error in /api/fetch-repo:", error);
    return res.status(500).json({ error: error.message || "Failed to process repository" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
