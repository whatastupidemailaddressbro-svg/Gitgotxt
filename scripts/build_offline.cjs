const fs = require("fs");
const path = require("path");

const jszipCode = fs.readFileSync("node_modules/jszip/dist/jszip.min.js", "utf8");

const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RepoPack - Standalone Offline Repository Packer</title>
  <style>
    :root {
      --bg: #09090b;
      --card-bg: #121215;
      --card-border: #27272a;
      --card-border-hover: #3f3f46;
      --primary: #10b981;
      --primary-hover: #059669;
      --primary-dim: rgba(16, 185, 129, 0.12);
      --text: #f4f4f5;
      --text-muted: #a1a1aa;
      --danger: #ef4444;
      --danger-dim: rgba(239, 68, 68, 0.12);
      --warning: #f59e0b;
      --warning-dim: rgba(245, 158, 11, 0.12);
      --accent: #38bdf8;
      --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font);
      line-height: 1.5;
      padding: 0;
      margin: 0;
      min-height: 100vh;
    }

    /* Header */
    header {
      border-bottom: 1px solid var(--card-border);
      background: rgba(18, 18, 21, 0.85);
      backdrop-filter: blur(12px);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0.85rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: linear-gradient(135deg, #10b981, #06b6d4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: #09090b;
      font-size: 1.1rem;
    }

    .brand-title {
      font-size: 1.15rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .brand-badge {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
      background: var(--primary-dim);
      color: var(--primary);
      border: 1px solid rgba(16, 185, 129, 0.3);
      margin-left: 0.4rem;
    }

    .storage-pill {
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.75rem;
      background: #18181b;
      border: 1px solid var(--card-border);
      border-radius: 8px;
      color: var(--text-muted);
    }

    .storage-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--primary);
      box-shadow: 0 0 6px var(--primary);
    }

    /* Container */
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 1.5rem;
      padding-bottom: 0.5rem;
    }

    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 0.9rem;
      font-weight: 600;
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .tab-btn:hover {
      color: var(--text);
      background: #18181b;
    }

    .tab-btn.active {
      color: #09090b;
      background: var(--primary);
    }

    /* Cards & Layout */
    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    @media (min-width: 900px) {
      .grid-2 {
        grid-template-columns: 360px 1fr;
      }
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 1.25rem;
    }

    .card-title {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.15s ease;
      text-decoration: none;
      width: 100%;
    }

    .btn-primary {
      background: var(--primary);
      color: #09090b;
    }

    .btn-primary:hover {
      background: var(--primary-hover);
    }

    .btn-secondary {
      background: #1e1e24;
      color: var(--text);
      border-color: var(--card-border);
    }

    .btn-secondary:hover {
      background: #27272a;
      border-color: var(--card-border-hover);
    }

    .btn-danger {
      background: var(--danger-dim);
      color: #f87171;
      border-color: rgba(239, 68, 68, 0.3);
    }

    .btn-danger:hover {
      background: rgba(239, 68, 68, 0.25);
    }

    .btn-download-hero {
      padding: 0.9rem 1.5rem;
      font-size: 1.05rem;
      font-weight: 700;
      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.25);
    }

    /* Input area */
    .dropzone {
      border: 2px dashed var(--card-border);
      border-radius: 10px;
      padding: 1.75rem 1rem;
      text-align: center;
      background: rgba(24, 24, 27, 0.5);
      cursor: pointer;
      transition: all 0.2s;
    }

    .dropzone:hover, .dropzone.dragover {
      border-color: var(--primary);
      background: var(--primary-dim);
    }

    .dropzone-title {
      font-weight: 600;
      font-size: 0.95rem;
      margin-bottom: 0.25rem;
    }

    .dropzone-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* Options form */
    .option-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.6rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 0.85rem;
    }

    .option-row:last-child {
      border-bottom: none;
    }

    .option-label {
      display: flex;
      flex-direction: column;
    }

    .option-desc {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .switch {
      position: relative;
      display: inline-block;
      width: 40px;
      height: 22px;
      flex-shrink: 0;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #27272a;
      transition: .2s;
      border-radius: 22px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 3px;
      bottom: 3px;
      background-color: #fff;
      transition: .2s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: var(--primary);
    }

    input:checked + .slider:before {
      transform: translateX(18px);
      background-color: #09090b;
    }

    /* Stats Banner */
    .stats-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }

    .stat-item {
      background: #18181b;
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 0.75rem;
      text-align: center;
    }

    .stat-val {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text);
      font-family: var(--font-mono);
    }

    .stat-label {
      font-size: 0.7rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Table & Files */
    .file-table-wrapper {
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid var(--card-border);
      border-radius: 8px;
      background: #0d0d10;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;
    }

    th {
      background: #18181b;
      padding: 0.6rem 0.75rem;
      text-align: left;
      font-weight: 600;
      color: var(--text-muted);
      border-bottom: 1px solid var(--card-border);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    td {
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      font-family: var(--font-mono);
    }

    tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }

    .badge-status {
      display: inline-block;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-size: 0.68rem;
      font-weight: 700;
    }

    .badge-included {
      background: var(--primary-dim);
      color: var(--primary);
    }

    .badge-stripped {
      background: rgba(239, 68, 68, 0.1);
      color: #f87171;
    }

    /* Recovery banner */
    .recovery-banner {
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 10px;
      padding: 0.85rem 1.25rem;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .recovery-text {
      font-size: 0.85rem;
    }

    /* Download Receipt Box */
    .download-receipt {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 182, 212, 0.08));
      border: 1px solid rgba(16, 185, 129, 0.35);
      border-radius: 12px;
      padding: 1.5rem;
      margin-top: 1.25rem;
      text-align: center;
    }

    .receipt-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 0.5rem;
    }

    .receipt-cmd {
      background: #09090b;
      border: 1px solid var(--card-border);
      border-radius: 6px;
      padding: 0.5rem 0.75rem;
      font-family: var(--font-mono);
      font-size: 0.8rem;
      color: var(--accent);
      margin: 0.75rem auto;
      max-width: 500px;
      text-align: left;
    }

    .hidden {
      display: none !important;
    }

    input[type="text"], input[type="number"] {
      width: 100%;
      background: #18181b;
      border: 1px solid var(--card-border);
      border-radius: 6px;
      color: var(--text);
      padding: 0.5rem 0.75rem;
      font-size: 0.85rem;
      outline: none;
    }

    input[type="text"]:focus, input[type="number"]:focus {
      border-color: var(--primary);
    }
  </style>
  <script>
    // Embedded JSZip Library (v3.10.1)
    ${jszipCode}
  </script>
</head>
<body>

  <!-- Header -->
  <header>
    <div class="header-inner">
      <div class="brand">
        <div class="brand-icon">RP</div>
        <div>
          <span class="brand-title">RepoPack</span>
          <span class="brand-badge">Offline Edition</span>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <div class="storage-pill" id="storage-status-pill">
          <div class="storage-dot"></div>
          <span id="storage-status-text">Persistent Storage: Ready</span>
        </div>
        <button class="btn btn-secondary" style="width: auto; padding: 0.35rem 0.65rem; font-size: 0.75rem;" onclick="clearPersistentStorage()">
          Clear Storage
        </button>
      </div>
    </div>
  </header>

  <div class="container">

    <!-- Work-in-Progress Storage Recovery Banner -->
    <div id="recovery-banner" class="recovery-banner hidden">
      <div class="recovery-text">
        <strong>Session Restored:</strong> Found <span id="recovery-count">0</span> files from your last work-in-progress session saved in persistent browser storage.
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button class="btn btn-primary" style="width: auto; padding: 0.35rem 0.75rem; font-size: 0.75rem;" onclick="triggerContainerDownload()">
          Download Container Now
        </button>
        <button class="btn btn-danger" style="width: auto; padding: 0.35rem 0.75rem; font-size: 0.75rem;" onclick="clearPersistentStorage()">
          Dismiss / Discard
        </button>
      </div>
    </div>

    <!-- Tab navigation -->
    <div class="tabs">
      <button class="tab-btn active" id="tab-pack" onclick="switchTab('pack')">Pack Repository</button>
      <button class="tab-btn" id="tab-unpack" onclick="switchTab('unpack')">Unpack Container</button>
    </div>

    <!-- TAB 1: PACK REPOSITORY -->
    <div id="view-pack">
      <div class="grid grid-2">
        
        <!-- Left Column: Ingestion & Filter Controls -->
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          
          <!-- Source Ingestion Card -->
          <div class="card">
            <h3 class="card-title">1. Select Repository Source</h3>
            
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <!-- Local Folder Picker -->
              <input type="file" id="folder-input" webkitdirectory directory multiple class="hidden" onchange="handleFolderSelect(this.files)">
              <button class="btn btn-primary" onclick="document.getElementById('folder-input').click()">
                Select Local Directory / Folder
              </button>

              <!-- Local ZIP Archive -->
              <input type="file" id="zip-input" accept=".zip" class="hidden" onchange="handleZipSelect(this.files[0])">
              <div class="dropzone" id="zip-dropzone" onclick="document.getElementById('zip-input').click()">
                <div class="dropzone-title">Drop .ZIP archive here</div>
                <div class="dropzone-sub">or click to browse local ZIP file</div>
              </div>

              <!-- Optional GitHub Ingestion -->
              <div style="margin-top: 0.5rem; padding-top: 0.75rem; border-top: 1px solid var(--card-border);">
                <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.4rem;">Or load public GitHub repository:</div>
                <div style="display: flex; gap: 0.4rem;">
                  <input type="text" id="github-url" placeholder="e.g. expressjs/express">
                  <button class="btn btn-secondary" style="width: auto; white-space: nowrap;" onclick="fetchGithubRepo()">
                    Fetch
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Filter Configuration Card -->
          <div class="card">
            <h3 class="card-title">2. Filtering & Stripping Rules</h3>
            <div style="display: flex; flex-direction: column;">
              
              <div class="option-row">
                <div class="option-label">
                  <span>Strip Dotfiles & Folders</span>
                  <span class="option-desc">Filters .git, .github, .env, .vscode, etc.</span>
                </div>
                <label class="switch">
                  <input type="checkbox" id="opt-dotfiles" checked onchange="saveOptionsAndReapply()">
                  <span class="slider"></span>
                </label>
              </div>

              <div class="option-row">
                <div class="option-label">
                  <span>Strip Binary & Compiled Files</span>
                  <span class="option-desc">Images, media, fonts, bytecode, executables</span>
                </div>
                <label class="switch">
                  <input type="checkbox" id="opt-binaries" checked onchange="saveOptionsAndReapply()">
                  <span class="slider"></span>
                </label>
              </div>

              <div class="option-row">
                <div class="option-label">
                  <span>Strip Vendor & Build Folders</span>
                  <span class="option-desc">node_modules, dist, build, __pycache__, vendor</span>
                </div>
                <label class="switch">
                  <input type="checkbox" id="opt-vendor" checked onchange="saveOptionsAndReapply()">
                  <span class="slider"></span>
                </label>
              </div>

              <div class="option-row">
                <div class="option-label">
                  <span>Strip Dependency Lockfiles</span>
                  <span class="option-desc">package-lock.json, yarn.lock, bun.lock, etc.</span>
                </div>
                <label class="switch">
                  <input type="checkbox" id="opt-lockfiles" checked onchange="saveOptionsAndReapply()">
                  <span class="slider"></span>
                </label>
              </div>

              <div class="option-row">
                <div class="option-label">
                  <span>Max File Size (KB)</span>
                  <span class="option-desc">Exclude files larger than this threshold</span>
                </div>
                <input type="number" id="opt-maxsize" value="500" style="width: 80px; text-align: right;" onchange="saveOptionsAndReapply()">
              </div>

            </div>
          </div>

        </div>

        <!-- Right Column: Staging & Download Action -->
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          
          <!-- Download Action Card -->
          <div class="card" style="border-color: rgba(16, 185, 129, 0.4);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <h3 class="card-title" style="margin-bottom: 0;">3. Generate & Download Container</h3>
              <span id="repo-label" style="font-size: 0.8rem; font-family: var(--font-mono); color: var(--accent);"></span>
            </div>
            
            <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem;">
              Initiates an immediate file download of the packed repository text container. Includes directory tree, strict line delimiters, and self-extracting header script.
            </p>

            <button id="btn-download-container" class="btn btn-primary btn-download-hero" onclick="triggerContainerDownload()" disabled>
              Pack & Download Container (.txt)
            </button>

            <!-- Download Confirmation Receipt -->
            <div id="download-receipt" class="download-receipt hidden">
              <div class="receipt-title">Download Initiated!</div>
              <p style="font-size: 0.82rem; color: var(--text-muted);" id="receipt-desc">
                Your container file has been saved to your downloads folder.
              </p>
              <div class="receipt-cmd" id="receipt-cmd">
                bash &lt;container.txt&gt; ./restored_folder
              </div>
              <div style="display: flex; gap: 0.5rem; justify-content: center; margin-top: 0.75rem;">
                <button class="btn btn-secondary" style="width: auto; font-size: 0.8rem;" onclick="triggerContainerDownload()">
                  Download Again
                </button>
              </div>
            </div>
          </div>

          <!-- Staged Repository Stats -->
          <div class="stats-bar">
            <div class="stat-item">
              <div class="stat-val" id="stat-scanned">0</div>
              <div class="stat-label">Total Scanned</div>
            </div>
            <div class="stat-item">
              <div class="stat-val" id="stat-included" style="color: var(--primary);">0</div>
              <div class="stat-label">Included</div>
            </div>
            <div class="stat-item">
              <div class="stat-val" id="stat-stripped" style="color: #f87171;">0</div>
              <div class="stat-label">Stripped</div>
            </div>
            <div class="stat-item">
              <div class="stat-val" id="stat-lines">0</div>
              <div class="stat-label">Code Lines</div>
            </div>
            <div class="stat-item">
              <div class="stat-val" id="stat-size">0 KB</div>
              <div class="stat-label">Included Size</div>
            </div>
          </div>

          <!-- Staged Files Inspector -->
          <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <h4 style="font-size: 0.9rem; font-weight: 600;">Staged Files (Stored in Browser Storage)</h4>
              <input type="text" id="file-search" placeholder="Filter files..." style="width: 180px; padding: 0.3rem 0.5rem; font-size: 0.75rem;" oninput="renderFilesTable()">
            </div>

            <div class="file-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style="width: 40px; text-align: center;">Inc</th>
                    <th>Relative File Path</th>
                    <th style="width: 80px;">Size</th>
                    <th style="width: 70px;">Lines</th>
                    <th style="width: 130px;">Status / Reason</th>
                  </tr>
                </thead>
                <tbody id="files-tbody">
                  <tr>
                    <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                      No files loaded. Select a local folder or drop a .zip archive to begin.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>

    <!-- TAB 2: UNPACK CONTAINER -->
    <div id="view-unpack" class="hidden">
      <div style="max-width: 650px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem;">
        
        <div class="card">
          <h3 class="card-title">Unpack Existing Container File</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem;">
            Upload any RepoPack text container file (.txt). This will parse all marked file sections and immediately initiate a download of the restored project as a .ZIP archive.
          </p>

          <input type="file" id="unpack-input" accept=".txt,.sh" class="hidden" onchange="handleContainerFile(this.files[0])">
          <div class="dropzone" id="unpack-dropzone" onclick="document.getElementById('unpack-input').click()">
            <div class="dropzone-title">Drop container .txt file here</div>
            <div class="dropzone-sub">or click to browse container file</div>
          </div>

          <div id="unpack-status" class="hidden" style="margin-top: 1.25rem;">
            <div class="stat-item" style="margin-bottom: 1rem;">
              <div class="stat-val" id="unpack-count">0</div>
              <div class="stat-label">Files Detected in Container</div>
            </div>

            <button class="btn btn-primary btn-download-hero" onclick="triggerUnpackZipDownload()">
              Unpack & Download Restored ZIP (.zip)
            </button>
          </div>
        </div>

      </div>
    </div>

  </div>

  <script>
    // =========================================================================
    // INDEXEDDB PERSISTENCE ENGINE (File In-Between Storage & Recovery)
    // =========================================================================
    const DB_NAME = "RepoPackOfflineDB";
    const DB_VERSION = 1;
    let dbInstance = null;

    function openDatabase() {
      return new Promise((resolve, reject) => {
        if (dbInstance) return resolve(dbInstance);
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains("files_store")) {
            db.createObjectStore("files_store", { keyPath: "path" });
          }
          if (!db.objectStoreNames.contains("meta_store")) {
            db.createObjectStore("meta_store", { keyPath: "id" });
          }
        };
        req.onsuccess = (e) => {
          dbInstance = e.target.result;
          resolve(dbInstance);
        };
        req.onerror = (e) => reject(e);
      });
    }

    async function persistSessionToDB(repoName, files, options) {
      try {
        const db = await openDatabase();
        const tx = db.transaction(["files_store", "meta_store"], "readwrite");
        const fileStore = tx.objectStore("files_store");
        const metaStore = tx.objectStore("meta_store");

        // Clear existing files and insert current
        await new Promise((res, rej) => {
          const clearReq = fileStore.clear();
          clearReq.onsuccess = () => res();
          clearReq.onerror = rej;
        });

        for (const file of files) {
          fileStore.put({
            path: file.path,
            name: file.name,
            size: file.size,
            lines: file.lines,
            content: file.content,
            status: file.status,
            skipReason: file.skipReason,
            forcedInclude: file.forcedInclude || false
          });
        }

        metaStore.put({
          id: "current_session",
          repoName: repoName,
          totalFiles: files.length,
          lastUpdated: new Date().toISOString(),
          options: options
        });

        updateStorageStatusBadge(files.length);
      } catch (err) {
        console.error("IndexedDB persist failed:", err);
      }
    }

    async function loadSessionFromDB() {
      try {
        const db = await openDatabase();
        const tx = db.transaction(["files_store", "meta_store"], "readonly");
        const fileStore = tx.objectStore("files_store");
        const metaStore = tx.objectStore("meta_store");

        const meta = await new Promise((res) => {
          const req = metaStore.get("current_session");
          req.onsuccess = () => res(req.result);
          req.onerror = () => res(null);
        });

        if (!meta) return null;

        const files = await new Promise((res) => {
          const req = fileStore.getAll();
          req.onsuccess = () => res(req.result || []);
          req.onerror = () => res([]);
        });

        return { meta, files };
      } catch (err) {
        console.error("IndexedDB load failed:", err);
        return null;
      }
    }

    async function clearPersistentStorage() {
      try {
        const db = await openDatabase();
        const tx = db.transaction(["files_store", "meta_store"], "readwrite");
        tx.objectStore("files_store").clear();
        tx.objectStore("meta_store").clear();
        stagedFiles = [];
        currentRepoName = "repository";
        document.getElementById("recovery-banner").classList.add("hidden");
        document.getElementById("btn-download-container").disabled = true;
        document.getElementById("download-receipt").classList.add("hidden");
        document.getElementById("repo-label").textContent = "";
        updateStats();
        renderFilesTable();
        updateStorageStatusBadge(0);
      } catch (err) {
        console.error("Clear storage failed:", err);
      }
    }

    function updateStorageStatusBadge(count) {
      const textEl = document.getElementById("storage-status-text");
      if (count > 0) {
        textEl.textContent = "Persistent Storage: Active (" + count + " files cached)";
      } else {
        textEl.textContent = "Persistent Storage: Empty";
      }
    }

    // =========================================================================
    // REPOSITORY FILTERING RULES & CONSTANTS
    // =========================================================================
    const BINARY_EXTS = new Set([
      "png", "jpg", "jpeg", "gif", "webp", "ico", "bmp", "tiff", "psd", "avif",
      "zip", "tar", "gz", "bz2", "xz", "7z", "rar", "tgz",
      "exe", "bin", "dll", "so", "dylib", "wasm", "o", "obj", "class", "jar", "war", "pyc", "pyo",
      "pdf", "docx", "xlsx", "pptx", "odt",
      "mp3", "mp4", "wav", "ogg", "mov", "avi", "flac", "webm", "mkv",
      "woff", "woff2", "ttf", "eot", "otf",
      "db", "sqlite", "sqlite3", "dat", "iso"
    ]);

    const VENDOR_DIRS = new Set([
      "node_modules", "dist", "build", "out", "target", "vendor",
      "__pycache__", ".pytest_cache", ".cache", "coverage", ".nyc_output",
      "bower_components", "Pods"
    ]);

    const LOCKFILES = new Set([
      "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lock", "bun.lockb",
      "composer.lock", "Cargo.lock", "Gemfile.lock", "poetry.lock", "Pipfile.lock"
    ]);

    let stagedFiles = [];
    let currentRepoName = "repository";
    let unpackedFiles = [];

    function getActiveOptions() {
      return {
        stripDotFiles: document.getElementById("opt-dotfiles").checked,
        stripBinaries: document.getElementById("opt-binaries").checked,
        stripVendorDirs: document.getElementById("opt-vendor").checked,
        stripLockfiles: document.getElementById("opt-lockfiles").checked,
        maxFileSizeKb: parseInt(document.getElementById("opt-maxsize").value, 10) || 500
      };
    }

    function evaluateFileFilter(relPath, size, content, options) {
      const parts = relPath.replace(/\\\\/g, "/").split("/");
      const filename = parts[parts.length - 1];
      const ext = filename.includes(".") ? filename.split(".").pop().toLowerCase() : "";

      // 1. Dotfiles/folders
      if (options.stripDotFiles) {
        for (const part of parts) {
          if (part.startsWith(".")) {
            return { include: false, reason: "Dotfile/folder: '" + part + "'" };
          }
        }
      }

      // 2. Vendor directories
      if (options.stripVendorDirs) {
        for (let i = 0; i < parts.length - 1; i++) {
          if (VENDOR_DIRS.has(parts[i].toLowerCase())) {
            return { include: false, reason: "Vendor directory: '" + parts[i] + "'" };
          }
        }
      }

      // 3. Lockfiles
      if (options.stripLockfiles && LOCKFILES.has(filename.toLowerCase())) {
        return { include: false, reason: "Dependency lockfile: '" + filename + "'" };
      }

      // 4. Binaries by extension
      if (options.stripBinaries && BINARY_EXTS.has(ext)) {
        return { include: false, reason: "Binary file extension: '." + ext + "'" };
      }

      // 5. Check null bytes
      if (options.stripBinaries && content && content.includes("\\0")) {
        return { include: false, reason: "Binary content detected (null byte)" };
      }

      // 6. Max file size
      const maxBytes = options.maxFileSizeKb * 1024;
      if (size > maxBytes) {
        return { include: false, reason: "Size (" + Math.round(size/1024) + " KB) exceeds " + options.maxFileSizeKb + " KB limit" };
      }

      return { include: true, reason: "Passed all filters" };
    }

    function applyFiltersToStaged() {
      const opts = getActiveOptions();
      for (const file of stagedFiles) {
        if (file.forcedInclude) {
          file.status = "included";
          file.skipReason = "Manually included";
        } else {
          const evalResult = evaluateFileFilter(file.path, file.size, file.content, opts);
          file.status = evalResult.include ? "included" : "skipped";
          file.skipReason = evalResult.reason;
        }
      }
    }

    function saveOptionsAndReapply() {
      applyFiltersToStaged();
      updateStats();
      renderFilesTable();
      persistSessionToDB(currentRepoName, stagedFiles, getActiveOptions());
    }

    // =========================================================================
    // SOURCE INGESTION HANDLERS
    // =========================================================================
    async function handleFolderSelect(fileList) {
      if (!fileList || fileList.length === 0) return;
      
      const filesArr = Array.from(fileList);
      // Infer repo name from first path
      const firstPath = filesArr[0].webkitRelativePath || filesArr[0].name;
      const rootFolder = firstPath.split("/")[0] || "local_repository";
      currentRepoName = rootFolder;
      document.getElementById("repo-label").textContent = rootFolder;

      stagedFiles = [];
      const opts = getActiveOptions();

      for (const f of filesArr) {
        const fullRel = f.webkitRelativePath || f.name;
        // Strip the root directory segment if multiple files selected under one folder
        const parts = fullRel.split("/");
        const relPath = parts.length > 1 ? parts.slice(1).join("/") : fullRel;
        
        let content = "";
        let lines = 0;
        const isBinExt = BINARY_EXTS.has((f.name.split(".").pop() || "").toLowerCase());
        
        if (!isBinExt && f.size < 2 * 1024 * 1024) {
          try {
            content = await f.text();
            lines = content ? content.split(/\\r?\\n/).length : 0;
          } catch(e) {
            content = "";
          }
        }

        const filterRes = evaluateFileFilter(relPath, f.size, content, opts);

        stagedFiles.push({
          path: relPath,
          name: f.name,
          size: f.size,
          lines: lines,
          content: content,
          status: filterRes.include ? "included" : "skipped",
          skipReason: filterRes.reason,
          forcedInclude: false
        });
      }

      stagedFiles.sort((a, b) => a.path.localeCompare(b.path));
      document.getElementById("btn-download-container").disabled = false;
      document.getElementById("download-receipt").classList.add("hidden");
      updateStats();
      renderFilesTable();
      await persistSessionToDB(currentRepoName, stagedFiles, opts);
    }

    async function handleZipSelect(zipFile) {
      if (!zipFile) return;
      currentRepoName = zipFile.name.replace(/\\.zip$/i, "").replace(/-main|-master/i, "");
      document.getElementById("repo-label").textContent = currentRepoName;

      try {
        const zip = await JSZip.loadAsync(zipFile);
        const entries = Object.keys(zip.files);
        
        // Check for common prefix
        let commonPrefix = "";
        const fileNames = entries.filter(name => !zip.files[name].dir);
        if (fileNames.length > 0) {
          const firstParts = fileNames[0].split("/");
          if (firstParts.length > 1) {
            const candidate = firstParts[0] + "/";
            if (fileNames.every(name => name.startsWith(candidate))) {
              commonPrefix = candidate;
            }
          }
        }

        stagedFiles = [];
        const opts = getActiveOptions();

        for (const name of entries) {
          const entry = zip.files[name];
          if (entry.dir) continue;

          let relPath = name;
          if (commonPrefix && relPath.startsWith(commonPrefix)) {
            relPath = relPath.substring(commonPrefix.length);
          }

          const filename = relPath.split("/").pop();
          const isBinExt = BINARY_EXTS.has((filename.split(".").pop() || "").toLowerCase());
          
          let content = "";
          let lines = 0;
          if (!isBinExt) {
            try {
              content = await entry.async("text");
              lines = content ? content.split(/\\r?\\n/).length : 0;
            } catch (err) {
              content = "";
            }
          }

          const filterRes = evaluateFileFilter(relPath, content.length, content, opts);

          stagedFiles.push({
            path: relPath,
            name: filename,
            size: content.length || 0,
            lines: lines,
            content: content,
            status: filterRes.include ? "included" : "skipped",
            skipReason: filterRes.reason,
            forcedInclude: false
          });
        }

        stagedFiles.sort((a, b) => a.path.localeCompare(b.path));
        document.getElementById("btn-download-container").disabled = false;
        document.getElementById("download-receipt").classList.add("hidden");
        updateStats();
        renderFilesTable();
        await persistSessionToDB(currentRepoName, stagedFiles, opts);
      } catch (err) {
        alert("Failed to parse ZIP archive: " + err.message);
      }
    }

    async function fetchGithubRepo() {
      const raw = document.getElementById("github-url").value.trim();
      if (!raw) return alert("Please enter a GitHub repository (e.g. owner/repo)");

      const cleaned = raw.replace(/^https?:\\/\\/github\\.com\\//, "").replace(/\\.git$/, "");
      const parts = cleaned.split("/").filter(Boolean);
      if (parts.length < 2) return alert("Invalid format. Use 'owner/repo'");

      const owner = parts[0];
      const repo = parts[1];
      const branch = parts[3] || "main";
      currentRepoName = owner + "_" + repo;
      document.getElementById("repo-label").textContent = currentRepoName;

      // In browser, try downloading zipball via GitHub public zipball endpoint
      const zipUrl = "https://api.github.com/repos/" + owner + "/" + repo + "/zipball/" + branch;
      try {
        const resp = await fetch(zipUrl);
        if (!resp.ok) throw new Error("HTTP " + resp.status + " " + resp.statusText);
        const blob = await resp.blob();
        await handleZipSelect(blob);
      } catch (err) {
        alert("Could not fetch repository archive directly (CORS or rate limit): " + err.message + "\\nTip: Download the .zip from GitHub and drop it here for 100% offline parsing!");
      }
    }

    // Drag and Drop
    const zipDropzone = document.getElementById("zip-dropzone");
    zipDropzone.addEventListener("dragover", (e) => { e.preventDefault(); zipDropzone.classList.add("dragover"); });
    zipDropzone.addEventListener("dragleave", () => zipDropzone.classList.remove("dragover"));
    zipDropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      zipDropzone.classList.remove("dragover");
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleZipSelect(e.dataTransfer.files[0]);
      }
    });

    // =========================================================================
    // UI RENDERING & STATS
    // =========================================================================
    function updateStats() {
      const scanned = stagedFiles.length;
      const included = stagedFiles.filter(f => f.status === "included");
      const stripped = stagedFiles.filter(f => f.status === "skipped");
      const totalLines = included.reduce((acc, f) => acc + f.lines, 0);
      const totalSize = included.reduce((acc, f) => acc + f.size, 0);

      document.getElementById("stat-scanned").textContent = scanned;
      document.getElementById("stat-included").textContent = included.length;
      document.getElementById("stat-stripped").textContent = stripped.length;
      document.getElementById("stat-lines").textContent = totalLines.toLocaleString();
      document.getElementById("stat-size").textContent = (totalSize / 1024).toFixed(1) + " KB";
    }

    function renderFilesTable() {
      const tbody = document.getElementById("files-tbody");
      const query = (document.getElementById("file-search").value || "").toLowerCase();

      const filtered = stagedFiles.filter(f => f.path.toLowerCase().includes(query));

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">' + 
          (stagedFiles.length === 0 ? "No files staged." : "No files matching '" + query + "'") + 
          '</td></tr>';
        return;
      }

      let html = "";
      for (let i = 0; i < filtered.length; i++) {
        const file = filtered[i];
        const isInc = file.status === "included";
        html += '<tr>' +
          '<td style="text-align: center;">' +
            '<input type="checkbox" ' + (isInc ? "checked" : "") + ' onchange="toggleFileInclusion(\\'' + encodeURIComponent(file.path) + '\\', this.checked)">' +
          '</td>' +
          '<td style="color: ' + (isInc ? "var(--text)" : "var(--text-muted)") + ';">' + escapeHtml(file.path) + '</td>' +
          '<td>' + (file.size < 1024 ? file.size + ' B' : Math.round(file.size/1024) + ' KB') + '</td>' +
          '<td>' + (isInc ? file.lines : '-') + '</td>' +
          '<td>' +
            (isInc 
              ? '<span class="badge-status badge-included">INCLUDED</span>' 
              : '<span class="badge-status badge-stripped" title="' + escapeHtml(file.skipReason) + '">STRIPPED</span>') +
          '</td>' +
        '</tr>';
      }
      tbody.innerHTML = html;
    }

    function toggleFileInclusion(encodedPath, checked) {
      const path = decodeURIComponent(encodedPath);
      const f = stagedFiles.find(item => item.path === path);
      if (f) {
        f.forcedInclude = checked;
        f.status = checked ? "included" : "skipped";
        f.skipReason = checked ? "Manually included" : "Manually excluded";
        updateStats();
        renderFilesTable();
        persistSessionToDB(currentRepoName, stagedFiles, getActiveOptions());
      }
    }

    function escapeHtml(str) {
      if (!str) return "";
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    // =========================================================================
    // CONTAINER GENERATION & AUTOMATIC DOWNLOAD (Browser initiates download!)
    // =========================================================================
    function generateAsciiTree(paths) {
      if (!paths || paths.length === 0) return ".\\n└── (empty repository)\\n";
      const tree = {};
      for (const p of paths.slice().sort()) {
        const parts = p.split("/");
        let curr = tree;
        for (const part of parts) {
          if (!curr[part]) curr[part] = {};
          curr = curr[part];
        }
      }
      const lines = ["."];
      function walk(node, prefix = "") {
        const keys = Object.keys(node).sort();
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const isLast = i === keys.length - 1;
          const marker = isLast ? "└── " : "├── ";
          const childPrefix = isLast ? "    " : "│   ";
          lines.push(prefix + marker + key);
          walk(node[key], prefix + childPrefix);
        }
      }
      walk(tree);
      return lines.join("\\n");
    }

    function buildSelfExtractingHeader(repoName, fileCount, lineCount) {
      const sep = "=".repeat(80);
      const now = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
      return "#!/usr/bin/env bash\\n" +
        "# " + sep + "\\n" +
        "# REPO CONTAINER: " + repoName + "\\n" +
        "# Generated by RepoPack (Offline Web Edition) on: " + now + "\\n" +
        "# Files: " + fileCount + " | Total Lines: " + lineCount + "\\n" +
        "# " + sep + "\\n" +
        "# SELF-INSTRUCTIONS TO UNPACK THIS CONTAINER BACK INTO FILES:\\n" +
        "#\\n" +
        "# Method 1 (Direct Execution with Bash on Linux / macOS / WSL):\\n" +
        "#     bash <this_file> [target_directory]\\n" +
        "#     Example: bash container.txt ./my_restored_repo\\n" +
        "#\\n" +
        "# Method 2 (Using Python 3):\\n" +
        "#     python3 - < <this_file>\\n" +
        "#\\n" +
        "# Method 3 (RepoPack Web or Python Unpacker):\\n" +
        "#     Open RepoPack HTML or repopack.py to view or download as .ZIP!\\n" +
        "# " + sep + "\\n\\n" +
        "if [ -n \\"$BASH_VERSION\\" ] || [ -n \\"$ZSH_VERSION\\" ] || [ -n \\"$SH_VERSION\\" ] || [ -f \\"$0\\" ]; then\\n" +
        "    python3 -c '\\n" +
        "import sys, os, re\\n\\n" +
        "src = sys.argv[1]\\n" +
        "dest = sys.argv[2] if len(sys.argv) > 2 else \\".\\"\\n\\n" +
        "if src == \\"-\\" or not os.path.isfile(src):\\n" +
        "    text = sys.stdin.read()\\n" +
        "else:\\n" +
        "    with open(src, \\"r\\", encoding=\\"utf-8\\", errors=\\"replace\\") as f:\\n" +
        "        text = f.read()\\n\\n" +
        "pattern = re.compile(\\n" +
        "    r\\"^={80}\\\\r?\\\\nFILE:\\\\s*([^\\\\r\\\\n]+)\\\\r?\\\\n(?:LINES:[^\\\\r\\\\n]*\\\\r?\\\\n)?={80}\\\\r?\\\\n([\\\\s\\\\S]*?)\\\\r?\\\\n-{80}\\\\r?\\\\nEND FILE:\\\\s*\\\\1\\\\r?\\\\n={80}\\",\\n" +
        "    re.M\\n" +
        ")\\n\\n" +
        "matches = list(pattern.finditer(text))\\n" +
        "if not matches:\\n" +
        "    print(\\"[-] No marked files found in container.\\")\\n" +
        "    sys.exit(1)\\n\\n" +
        "print(f\\"[*] Restoring {len(matches)} files into \\\\\\x27{dest}\\\\\\x27...\\")\\n" +
        "for m in matches:\\n" +
        "    rel = m.group(1).strip()\\n" +
        "    dest_path = os.path.join(dest, rel)\\n" +
        "    os.makedirs(os.path.dirname(dest_path), exist_ok=True)\\n" +
        "    with open(dest_path, \\"w\\", encoding=\\"utf-8\\") as out:\\n" +
        "        out.write(m.group(2))\\n" +
        "    print(f\\"  + {rel}\\")\\n\\n" +
        "print(f\\"\\\\n[OK] Successfully restored {len(matches)} files into \\\\\\x27{dest}\\\\\\x27.\\")\\n" +
        "' \\"$0\\" \\"" + "$" + "{1:-.}\\"\\n" +
        "    exit 0\\n" +
        "fi\\n";
    }

    function triggerContainerDownload() {
      const included = stagedFiles.filter(f => f.status === "included");
      if (included.length === 0) {
        return alert("No files are currently marked for inclusion.");
      }

      const sepHeavy = "=".repeat(80);
      const sepLight = "-".repeat(80);
      const totalLines = included.reduce((acc, f) => acc + f.lines, 0);

      const header = buildSelfExtractingHeader(currentRepoName, included.length, totalLines);
      const tree = generateAsciiTree(included.map(f => f.path));

      const chunks = [];
      chunks.push(header);
      chunks.push("\\n");
      chunks.push(sepHeavy + "\\n");
      chunks.push("DIRECTORY STRUCTURE\\n");
      chunks.push(sepHeavy + "\\n");
      chunks.push(tree + "\\n");
      chunks.push(sepHeavy + "\\n\\n");

      for (const file of included) {
        chunks.push(sepHeavy + "\\n");
        chunks.push("FILE: " + file.path + "\\n");
        chunks.push("LINES: " + file.lines + " | SIZE: " + file.size + " bytes\\n");
        chunks.push(sepHeavy + "\\n");
        chunks.push(file.content);
        if (!file.content.endsWith("\\n")) {
          chunks.push("\\n");
        }
        chunks.push(sepLight + "\\n");
        chunks.push("END FILE: " + file.path + "\\n");
        chunks.push(sepHeavy + "\\n\\n");
      }

      const fullContainerText = chunks.join("");
      const blob = new Blob([fullContainerText], { type: "text/plain;charset=utf-8" });
      const downloadFilename = (currentRepoName || "repository") + "_container.txt";

      // Trigger immediate browser download rather than displaying on screen
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      // Show receipt card
      const receipt = document.getElementById("download-receipt");
      receipt.classList.remove("hidden");
      document.getElementById("receipt-desc").textContent = "Downloaded '" + downloadFilename + "' (" + (blob.size / 1024).toFixed(1) + " KB, " + included.length + " files, " + totalLines.toLocaleString() + " lines).";
      document.getElementById("receipt-cmd").textContent = "bash " + downloadFilename + " ./restored_" + (currentRepoName || "repo");
    }

    // =========================================================================
    // UNPACK CONTAINER SECTION
    // =========================================================================
    async function handleContainerFile(file) {
      if (!file) return;
      try {
        const text = await file.text();
        const pattern = /^={80}\\r?\\nFILE:\\s*([^\\r\\n]+)\\r?\\n(?:LINES:[^\\r\\n]*\\r?\\n)?={80}\\r?\\n([\\s\\S]*?)\\r?\\n-{80}\\r?\\nEND FILE:\\s*\\1\\r?\\n={80}/gm;
        
        unpackedFiles = [];
        let match;
        while ((match = pattern.exec(text)) !== null) {
          unpackedFiles.push({
            path: match[1].trim(),
            content: match[2]
          });
        }

        if (unpackedFiles.length === 0) {
          alert("No valid marked file blocks found in container file.");
          return;
        }

        document.getElementById("unpack-status").classList.remove("hidden");
        document.getElementById("unpack-count").textContent = unpackedFiles.length;
      } catch (err) {
        alert("Failed to read container file: " + err.message);
      }
    }

    const unpackDropzone = document.getElementById("unpack-dropzone");
    unpackDropzone.addEventListener("dragover", (e) => { e.preventDefault(); unpackDropzone.classList.add("dragover"); });
    unpackDropzone.addEventListener("dragleave", () => unpackDropzone.classList.remove("dragover"));
    unpackDropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      unpackDropzone.classList.remove("dragover");
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleContainerFile(e.dataTransfer.files[0]);
      }
    });

    async function triggerUnpackZipDownload() {
      if (!unpackedFiles || unpackedFiles.length === 0) {
        return alert("No files to download.");
      }

      const zip = new JSZip();
      for (const f of unpackedFiles) {
        zip.file(f.path, f.content);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const downloadName = "unpacked_repository.zip";
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }

    // Tabs
    function switchTab(tab) {
      if (tab === "pack") {
        document.getElementById("view-pack").classList.remove("hidden");
        document.getElementById("view-unpack").classList.add("hidden");
        document.getElementById("tab-pack").classList.add("active");
        document.getElementById("tab-unpack").classList.remove("active");
      } else {
        document.getElementById("view-pack").classList.add("hidden");
        document.getElementById("view-unpack").classList.remove("hidden");
        document.getElementById("tab-pack").classList.remove("active");
        document.getElementById("tab-unpack").classList.add("active");
      }
    }

    // =========================================================================
    // INITIALIZATION & SESSION RESTORATION FROM INDEXEDDB
    // =========================================================================
    window.addEventListener("DOMContentLoaded", async () => {
      const session = await loadSessionFromDB();
      if (session && session.files && session.files.length > 0) {
        stagedFiles = session.files;
        currentRepoName = session.meta.repoName || "repository";
        document.getElementById("repo-label").textContent = currentRepoName;
        document.getElementById("btn-download-container").disabled = false;
        
        // Restore options if present
        if (session.meta.options) {
          const o = session.meta.options;
          if (o.stripDotFiles !== undefined) document.getElementById("opt-dotfiles").checked = o.stripDotFiles;
          if (o.stripBinaries !== undefined) document.getElementById("opt-binaries").checked = o.stripBinaries;
          if (o.stripVendorDirs !== undefined) document.getElementById("opt-vendor").checked = o.stripVendorDirs;
          if (o.stripLockfiles !== undefined) document.getElementById("opt-lockfiles").checked = o.stripLockfiles;
          if (o.maxFileSizeKb !== undefined) document.getElementById("opt-maxsize").value = o.maxFileSizeKb;
        }

        updateStats();
        renderFilesTable();
        updateStorageStatusBadge(stagedFiles.length);

        document.getElementById("recovery-count").textContent = stagedFiles.length;
        document.getElementById("recovery-banner").classList.remove("hidden");
      } else {
        updateStorageStatusBadge(0);
      }
    });
  </script>
</body>
</html>
`;

fs.writeFileSync("offline/index.html", htmlTemplate, "utf8");
fs.writeFileSync("public/offline/index.html", htmlTemplate, "utf8");
fs.copyFileSync("offline/repopack.py", "public/offline/repopack.py");

console.log("Successfully built offline/index.html and updated public/offline assets!");
