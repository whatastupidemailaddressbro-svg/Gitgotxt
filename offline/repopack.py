#!/usr/bin/env python3
"""
================================================================================
RepoPack - Standalone Repository to Text Container (Offline Python Edition)
================================================================================
Converts any local directory, .zip archive, or public GitHub repository into a 
single, self-unpacking text container file. Also unpacks container files back
into files and directories.

Zero external dependencies - uses Python 3 standard library only.
"""

import os
import sys
import re
import json
import shutil
import zipfile
import tempfile
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path

# ==============================================================================
# DEFAULT CONFIGURATION & FILTER CONSTANTS
# ==============================================================================

SEPARATOR_HEAVY = "=" * 80
SEPARATOR_LIGHT = "-" * 80

DEFAULT_BINARY_EXTENSIONS = {
    "png", "jpg", "jpeg", "gif", "webp", "ico", "bmp", "tiff", "psd", "avif",
    "zip", "tar", "gz", "bz2", "xz", "7z", "rar", "tgz",
    "exe", "bin", "dll", "so", "dylib", "wasm", "o", "obj", "class", "jar", "war", "pyc", "pyo",
    "pdf", "docx", "xlsx", "pptx", "odt",
    "mp3", "mp4", "wav", "ogg", "mov", "avi", "flac", "webm", "mkv",
    "woff", "woff2", "ttf", "eot", "otf",
    "db", "sqlite", "sqlite3", "dat", "iso"
}

DEFAULT_SKIP_DIRECTORIES = {
    "node_modules", "dist", "build", "out", "target", "vendor",
    "__pycache__", ".pytest_cache", ".cache", "coverage", ".nyc_output",
    "bower_components", "Pods", ".git", ".github", ".vscode", ".idea"
}

DEFAULT_LOCKFILES = {
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lock", "bun.lockb",
    "composer.lock", "Cargo.lock", "Gemfile.lock", "poetry.lock", "Pipfile.lock"
}

class PackConfig:
    def __init__(self):
        self.strip_dotfiles = True
        self.strip_binaries = True
        self.strip_vendor_dirs = True
        self.strip_lockfiles = True
        self.max_file_size_kb = 500

    def display(self):
        print("\n" + SEPARATOR_LIGHT)
        print(" CURRENT FILTER CONFIGURATION:")
        print(SEPARATOR_LIGHT)
        print(f" [1] Strip Dotfiles & Dotdirectories: {'ENABLED' if self.strip_dotfiles else 'DISABLED'}")
        print(f" [2] Strip Binary Files:              {'ENABLED' if self.strip_binaries else 'DISABLED'}")
        print(f" [3] Strip Vendor & Build Dirs:       {'ENABLED' if self.strip_vendor_dirs else 'DISABLED'}")
        print(f" [4] Strip Dependency Lockfiles:      {'ENABLED' if self.strip_lockfiles else 'DISABLED'}")
        print(f" [5] Max File Size Threshold:         {self.max_file_size_kb} KB")
        print(SEPARATOR_LIGHT + "\n")


# ==============================================================================
# FILTERING & INSPECTION UTILITIES
# ==============================================================================

def is_binary_bytes(sample_bytes: bytes) -> bool:
    """Check if byte sample contains null bytes or high non-printable byte ratio."""
    if not sample_bytes:
        return False
    check_len = min(len(sample_bytes), 8000)
    chunk = sample_bytes[:check_len]
    if b"\x00" in chunk:
        return True
    non_printable = 0
    for byte in chunk:
        # printable ASCII, tab, LF, CR, or UTF-8 lead/continuation
        if byte < 32 and byte not in (9, 10, 13):
            non_printable += 1
    return (non_printable / check_len) > 0.30

def check_file_filter(rel_path: str, file_size: int, sample_bytes: bytes, config: PackConfig):
    """
    Returns (should_include: bool, reason: str)
    """
    norm_path = rel_path.replace("\\", "/").strip("/")
    parts = norm_path.split("/")
    filename = parts[-1]
    ext = filename.split(".")[-1].lower() if "." in filename else ""

    # Check dotfiles/directories
    if config.strip_dotfiles:
        for part in parts:
            if part.startswith("."):
                return False, f"Dotfile or dotfolder: '{part}'"

    # Check vendor directories
    if config.strip_vendor_dirs:
        for part in parts[:-1]:
            if part.lower() in DEFAULT_SKIP_DIRECTORIES:
                return False, f"Vendor or build directory: '{part}'"

    # Check lockfiles
    if config.strip_lockfiles:
        if filename.lower() in DEFAULT_LOCKFILES:
            return False, f"Dependency lockfile: '{filename}'"

    # Check binary extensions
    if config.strip_binaries:
        if ext in DEFAULT_BINARY_EXTENSIONS:
            return False, f"Binary file extension: '.{ext}'"
        if is_binary_bytes(sample_bytes):
            return False, "Detected binary content (null bytes / non-text)"

    # Check max file size
    max_bytes = config.max_file_size_kb * 1024
    if file_size > max_bytes:
        return False, f"File size ({file_size / 1024:.1f} KB) exceeds {config.max_file_size_kb} KB limit"

    return True, "Passed all filters"


# ==============================================================================
# CONTAINER BUILDER & UNPACKER
# ==============================================================================

def generate_ascii_tree(file_paths: list) -> str:
    """Build a clean ASCII directory tree from a sorted list of relative paths."""
    if not file_paths:
        return ".\n└── (empty repository)\n"

    tree = {}
    for path in sorted(file_paths):
        parts = path.replace("\\", "/").strip("/").split("/")
        curr = tree
        for part in parts:
            if part not in curr:
                curr[part] = {}
            curr = curr[part]

    lines = ["."]

    def render_branch(node: dict, prefix: str = ""):
        keys = sorted(node.keys())
        for idx, key in enumerate(keys):
            is_last = (idx == len(keys) - 1)
            marker = "└── " if is_last else "├── "
            child_prefix = "    " if is_last else "│   "
            lines.append(f"{prefix}{marker}{key}")
            render_branch(node[key], prefix + child_prefix)

    render_branch(tree)
    return "\n".join(lines)


def build_self_extracting_header(repo_name: str, file_count: int, line_count: int) -> str:
    """Universal Bash + Python self-extracting header."""
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    header_top = f"""#!/usr/bin/env bash
# {SEPARATOR_HEAVY}
# REPO CONTAINER: {repo_name}
# Generated by RepoPack (Offline Python Edition) on: {timestamp}
# Files: {file_count} | Total Lines: {line_count}
# {SEPARATOR_HEAVY}
# SELF-INSTRUCTIONS TO UNPACK THIS CONTAINER BACK INTO SOURCE FILES:
#
# Method 1 (Direct Execution with Bash on Linux / macOS / WSL / Git Bash):
#     bash <this_file> [target_directory]
#     Examples:
#         bash container.txt
#         bash container.txt ./my_restored_repo
#
# Method 2 (Direct Execution with Python 3):
#     python3 - < <this_file>
#
# Method 3 (RepoPack Web or Python Unpacker):
#     Use the RepoPack web UI or run 'repopack.py' and select option 4.
# {SEPARATOR_HEAVY}
"""

    script_body = r'''
if [ -n "$BASH_VERSION" ] || [ -n "$ZSH_VERSION" ] || [ -n "$SH_VERSION" ] || [ -f "$0" ]; then
    python3 -c '
import sys, os, re

src = sys.argv[1]
dest = sys.argv[2] if len(sys.argv) > 2 else "."

if src == "-" or not os.path.isfile(src):
    text = sys.stdin.read()
else:
    with open(src, "r", encoding="utf-8", errors="replace") as f:
        text = f.read()

pattern = re.compile(
    r"^={80}\r?\nFILE:\s*([^\r\n]+)\r?\n(?:LINES:[^\r\n]*\r?\n)?={80}\r?\n([\s\S]*?)\r?\n-{80}\r?\nEND FILE:\s*\1\r?\n={80}",
    re.M
)

matches = list(pattern.finditer(text))
if not matches:
    print("[-] No marked files found in container.")
    sys.exit(1)

print(f"[*] Restoring {len(matches)} files into \x27{dest}\x27...")
for m in matches:
    rel = m.group(1).strip()
    dest_path = os.path.join(dest, rel)
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    with open(dest_path, "w", encoding="utf-8") as out:
        out.write(m.group(2))
    print(f"  + {rel}")

print(f"\n[OK] Successfully restored {len(matches)} files into \x27{dest}\x27.")
' "$0" "${1:-.}"
    exit 0
fi
'''
    return header_top + script_body


def pack_file_entries(repo_name: str, file_entries: list, output_filepath: str):
    """
    file_entries: list of dicts:
        {"path": "rel/path.ext", "content": "text...", "lines": int, "size": int}
    """
    total_lines = sum(f["lines"] for f in file_entries)
    total_files = len(file_entries)

    header = build_self_extracting_header(repo_name, total_files, total_lines)
    tree_text = generate_ascii_tree([f["path"] for f in file_entries])

    with open(output_filepath, "w", encoding="utf-8") as out:
        # Write bash script header
        out.write(header)
        out.write("\n")

        # Write Directory Structure
        out.write(SEPARATOR_HEAVY + "\n")
        out.write("DIRECTORY STRUCTURE\n")
        out.write(SEPARATOR_HEAVY + "\n")
        out.write(tree_text + "\n")
        out.write(SEPARATOR_HEAVY + "\n\n")

        # Write each file line for line with strict separators
        for f in file_entries:
            rel = f["path"]
            lines_cnt = f["lines"]
            size_bytes = f["size"]
            content = f["content"]

            out.write(SEPARATOR_HEAVY + "\n")
            out.write(f"FILE: {rel}\n")
            out.write(f"LINES: {lines_cnt} | SIZE: {size_bytes} bytes\n")
            out.write(SEPARATOR_HEAVY + "\n")
            out.write(content)
            if not content.endswith("\n"):
                out.write("\n")
            out.write(SEPARATOR_LIGHT + "\n")
            out.write(f"END FILE: {rel}\n")
            out.write(SEPARATOR_HEAVY + "\n\n")

    out_size = os.path.getsize(output_filepath)
    print("\n" + SEPARATOR_HEAVY)
    print(f" [+] PACK COMPLETE: {output_filepath}")
    print(SEPARATOR_HEAVY)
    print(f" Total Included Files:  {total_files}")
    print(f" Total Code Lines:      {total_lines:,}")
    print(f" Container File Size:   {out_size / 1024:.2f} KB ({out_size:,} bytes)")
    print(f" Estimated Tokens:      ~{int(out_size / 4):,}")
    print(f"\n To unpack anywhere on macOS/Linux/WSL:")
    print(f"   bash {output_filepath} ./extracted_folder")
    print(SEPARATOR_HEAVY + "\n")


def unpack_container_file(container_path: str, target_dir: str):
    """Parses a container file and recreates all directories and files on disk."""
    if not os.path.isfile(container_path):
        print(f"[-] Error: File not found: {container_path}")
        return False

    with open(container_path, "r", encoding="utf-8", errors="replace") as f:
        text = f.read()

    pattern = re.compile(
        r"^={80}\r?\nFILE:\s*([^\r\n]+)\r?\n(?:LINES:[^\r\n]*\r?\n)?={80}\r?\n([\s\S]*?)\r?\n-{80}\r?\nEND FILE:\s*\1\r?\n={80}",
        re.MULTILINE
    )

    matches = list(pattern.finditer(text))
    if not matches:
        print(f"[-] Error: No marked file sections found in {container_path}")
        print("    Ensure the file is a valid RepoPack container format.")
        return False

    os.makedirs(target_dir, exist_ok=True)
    print(f"\n[*] Restoring {len(matches)} files into '{target_dir}'...")

    total_bytes = 0
    for m in matches:
        rel_path = m.group(1).strip()
        data = m.group(2)
        dest_path = os.path.join(target_dir, rel_path)
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        with open(dest_path, "w", encoding="utf-8") as out:
            out.write(data)
        file_sz = len(data.encode("utf-8"))
        total_bytes += file_sz
        print(f"  + Restored: {rel_path} ({file_sz} bytes)")

    print("\n" + SEPARATOR_LIGHT)
    print(f"[OK] Successfully restored {len(matches)} files ({total_bytes / 1024:.1f} KB) into '{target_dir}'")
    print(SEPARATOR_LIGHT + "\n")
    return True


# ==============================================================================
# WORKFLOW IMPLEMENTATIONS
# ==============================================================================

def workflow_pack_directory(dir_path: str, config: PackConfig):
    """Packs an existing local directory on disk."""
    if not os.path.isdir(dir_path):
        print(f"[-] Error: Directory does not exist: '{dir_path}'")
        return

    repo_name = os.path.basename(os.path.abspath(dir_path)) or "repository"
    print(f"\n[*] Scanning directory: '{dir_path}' (Repository: {repo_name})...")

    included_entries = []
    skipped_count = 0

    for root, dirs, files in os.walk(dir_path):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, dir_path).replace("\\", "/")

            try:
                stat = os.stat(full_path)
                file_size = stat.st_size

                with open(full_path, "rb") as bf:
                    sample = bf.read(8000)

                should_include, reason = check_file_filter(rel_path, file_size, sample, config)

                if should_include:
                    with open(full_path, "r", encoding="utf-8", errors="replace") as tf:
                        content = tf.read()
                    lines = len(content.splitlines())
                    included_entries.append({
                        "path": rel_path,
                        "content": content,
                        "lines": lines,
                        "size": file_size
                    })
                    print(f"  [INCLUDE] {rel_path} ({lines} lines)")
                else:
                    skipped_count += 1
                    print(f"  [STRIP]   {rel_path} - Reason: {reason}")
            except Exception as e:
                print(f"  [ERROR]   {rel_path}: {e}")
                skipped_count += 1

    if not included_entries:
        print("\n[-] Warning: No files passed the filtering criteria! Container not generated.")
        return

    output_filename = f"{repo_name}_container.txt"
    pack_file_entries(repo_name, included_entries, output_filename)


def workflow_pack_zip(zip_path: str, config: PackConfig):
    """Packs a local .zip file archive."""
    if not os.path.isfile(zip_path):
        print(f"[-] Error: ZIP file not found: '{zip_path}'")
        return

    repo_name = Path(zip_path).stem.replace("-master", "").replace("-main", "")
    print(f"\n[*] Reading ZIP archive: '{zip_path}'...")

    try:
        with zipfile.ZipFile(zip_path, "r") as z:
            namelist = z.namelist()
            # Determine if there's a common root folder like repo-main/
            common_prefix = ""
            non_empty_names = [n for n in namelist if not n.endswith("/")]
            if non_empty_names:
                first_parts = non_empty_names[0].split("/")
                if len(first_parts) > 1:
                    candidate = first_parts[0] + "/"
                    if all(n.startswith(candidate) for n in non_empty_names):
                        common_prefix = candidate

            included_entries = []
            skipped_count = 0

            for entry in z.infolist():
                if entry.is_dir():
                    continue
                rel_path = entry.filename
                if common_prefix and rel_path.startswith(common_prefix):
                    rel_path = rel_path[len(common_prefix):]
                rel_path = rel_path.strip("/")

                sample = z.read(entry)[:8000]
                should_include, reason = check_file_filter(rel_path, entry.file_size, sample, config)

                if should_include:
                    raw_data = z.read(entry)
                    text = raw_data.decode("utf-8", errors="replace")
                    lines = len(text.splitlines())
                    included_entries.append({
                        "path": rel_path,
                        "content": text,
                        "lines": lines,
                        "size": entry.file_size
                    })
                    print(f"  [INCLUDE] {rel_path} ({lines} lines)")
                else:
                    skipped_count += 1
                    print(f"  [STRIP]   {rel_path} - Reason: {reason}")

            if not included_entries:
                print("\n[-] Warning: No valid source files found in ZIP after filtering.")
                return

            output_filename = f"{repo_name}_container.txt"
            pack_file_entries(repo_name, included_entries, output_filename)

    except Exception as e:
        print(f"[-] Failed to process ZIP archive: {e}")


def workflow_pack_github(github_input: str, config: PackConfig, token: str = None):
    """Fetches a public or private GitHub repository directly and packs it."""
    cleaned = github_input.strip()
    cleaned = re.sub(r"^https?://github\.com/", "", cleaned)
    cleaned = re.sub(r"^git@github\.com:", "", cleaned)
    cleaned = re.sub(r"\.git$", "", cleaned)
    parts = [p for p in cleaned.split("/") if p]

    if len(parts) < 2:
        print("[-] Invalid format. Please enter 'owner/repo' or 'https://github.com/owner/repo'")
        return

    owner = parts[0]
    repo = parts[1]
    branch = "main"

    if len(parts) >= 4 and parts[2] in ("tree", "blob"):
        branch = parts[3]

    effective_token = token or os.environ.get("GITHUB_TOKEN")

    repo_name = f"{owner}_{repo}"
    print(f"\n[*] Fetching GitHub repository: {owner}/{repo} (branch: {branch})...")
    if effective_token:
        print("    [!] Authenticated GitHub Token detected (private repos enabled)")

    # Try downloading the repository archive from GitHub
    archive_urls = [
        f"https://api.github.com/repos/{owner}/{repo}/zipball/{branch}",
        f"https://github.com/{owner}/{repo}/archive/refs/heads/{branch}.zip",
        f"https://github.com/{owner}/{repo}/archive/refs/heads/master.zip"
    ]

    downloaded = False
    temp_zip = None

    headers = {
        "User-Agent": "RepoPack-CLI/1.0",
        "Accept": "application/vnd.github.v3+json, application/zip"
    }
    if effective_token:
        t = effective_token.strip()
        headers["Authorization"] = t if (t.startswith("Bearer ") or t.startswith("token ")) else f"Bearer {t}"

    for url in archive_urls:
        try:
            print(f"  -> Attempting download from: {url}")
            req = urllib.request.Request(
                url,
                headers=headers
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = resp.read()
                temp_fd, temp_path = tempfile.mkstemp(suffix=".zip")
                with os.fdopen(temp_fd, "wb") as f:
                    f.write(data)
                temp_zip = temp_path
                downloaded = True
                print(f"  [+] Downloaded archive: {len(data) / 1024:.1f} KB")
                break
        except urllib.error.HTTPError as he:
            note = ""
            if he.code == 404:
                note = " (repo not found or private; provide token with 'repo' scope)"
            elif he.code == 401:
                note = " (invalid or expired token)"
            print(f"  [-] HTTP {he.code}: {he.reason}{note}")
        except Exception as ex:
            print(f"  [-] Error: {ex}")

    if not downloaded or not temp_zip:
        print(f"[-] Could not download repository archive for {owner}/{repo}.")
        print("    Check your network, or if private, set GITHUB_TOKEN or pass a token with 'repo' scope.")
        return

    try:
        workflow_pack_zip(temp_zip, config)
        # Rename default container output to owner-repo
        default_out = f"{Path(temp_zip).stem}_container.txt"
        target_out = f"{owner}_{repo}_container.txt"
        if os.path.isfile(default_out):
            os.rename(default_out, target_out)
            print(f"[*] Saved output as: {target_out}")
    finally:
        if os.path.exists(temp_zip):
            os.remove(temp_zip)


# ==============================================================================
# INTERACTIVE USER MENU
# ==============================================================================

def configure_menu(config: PackConfig):
    """Sub-menu to toggle filter settings."""
    while True:
        config.display()
        print(" Toggle or change a setting:")
        print("   1) Toggle Dotfiles & Dotdirectories")
        print("   2) Toggle Binary Filtering")
        print("   3) Toggle Vendor & Build Directories")
        print("   4) Toggle Dependency Lockfiles")
        print("   5) Change Max File Size Limit")
        print("   0) Return to Main Menu")
        choice = input("\n Select option [0-5]: ").strip()

        if choice == "1":
            config.strip_dotfiles = not config.strip_dotfiles
            print(f"[+] Dotfiles stripping: {'ENABLED' if config.strip_dotfiles else 'DISABLED'}")
        elif choice == "2":
            config.strip_binaries = not config.strip_binaries
            print(f"[+] Binary stripping: {'ENABLED' if config.strip_binaries else 'DISABLED'}")
        elif choice == "3":
            config.strip_vendor_dirs = not config.strip_vendor_dirs
            print(f"[+] Vendor stripping: {'ENABLED' if config.strip_vendor_dirs else 'DISABLED'}")
        elif choice == "4":
            config.strip_lockfiles = not config.strip_lockfiles
            print(f"[+] Lockfiles stripping: {'ENABLED' if config.strip_lockfiles else 'DISABLED'}")
        elif choice == "5":
            val = input(" Enter new max file size limit in KB (e.g. 500): ").strip()
            try:
                num = int(val)
                if num > 0:
                    config.max_file_size_kb = num
                    print(f"[+] Max size set to: {num} KB")
                else:
                    print("[-] Size must be a positive integer.")
            except ValueError:
                print("[-] Invalid number entered.")
        elif choice == "0":
            break
        else:
            print("[-] Invalid choice.")


def run_interactive_menu():
    """Main interactive terminal menu."""
    config = PackConfig()

    while True:
        print("\n" + SEPARATOR_HEAVY)
        print("         RepoPack - Standalone Repository to Text Container (CLI)        ")
        print(SEPARATOR_HEAVY)
        print(" 1) Pack a local directory / folder")
        print(" 2) Pack a local .zip archive")
        print(" 3) Pack a public GitHub repository (via URL or owner/repo)")
        print(" 4) Unpack a container .txt file back into directory")
        print(" 5) Configure filter rules (dotfiles, binaries, vendor, size)")
        print(" 6) View current configuration")
        print(" 0) Exit")
        print(SEPARATOR_HEAVY)

        choice = input(" Select an option [0-6]: ").strip()

        if choice == "1":
            dir_path = input("\n Enter path to local directory [default: .]: ").strip() or "."
            workflow_pack_directory(dir_path, config)

        elif choice == "2":
            zip_path = input("\n Enter path to .zip file: ").strip()
            if zip_path:
                workflow_pack_zip(zip_path, config)
            else:
                print("[-] No ZIP file specified.")

        elif choice == "3":
            gh_url = input("\n Enter GitHub URL or owner/repo (e.g. expressjs/express): ").strip()
            if gh_url:
                env_tok = os.environ.get("GITHUB_TOKEN")
                tok = ""
                if env_tok:
                    print(f" [*] Using GITHUB_TOKEN from environment.")
                else:
                    tok = input(" Enter GitHub token for private repo (optional, press Enter to skip): ").strip()
                workflow_pack_github(gh_url, config, token=tok or None)
            else:
                print("[-] No GitHub repository specified.")

        elif choice == "4":
            container_file = input("\n Enter container .txt file path: ").strip()
            if not container_file:
                print("[-] No container file path specified.")
                continue
            dest_dir = input(" Enter extraction destination directory [default: ./restored_repo]: ").strip() or "./restored_repo"
            unpack_container_file(container_file, dest_dir)

        elif choice == "5":
            configure_menu(config)

        elif choice == "6":
            config.display()

        elif choice == "0" or choice.lower() in ("q", "quit", "exit"):
            print("\n Goodbye!\n")
            sys.exit(0)

        else:
            print("[-] Invalid choice. Please enter a number between 0 and 6.")


# ==============================================================================
# CLI ARGUMENT SUPPORT
# ==============================================================================

def main():
    if len(sys.argv) > 1:
        # CLI command mode
        cmd = sys.argv[1].lower()

        if cmd in ("-h", "--help", "help"):
            print("Usage:")
            print("  python3 repopack.py                     (Launches interactive menu)")
            print("  python3 repopack.py pack <dir_or_zip>   (Packs directory or zip)")
            print("  python3 repopack.py unpack <file.txt> [destination_dir]")
            sys.exit(0)

        config = PackConfig()

        if cmd == "pack":
            target = sys.argv[2] if len(sys.argv) > 2 else "."
            if target.endswith(".zip") and os.path.isfile(target):
                workflow_pack_zip(target, config)
            elif os.path.isdir(target):
                workflow_pack_directory(target, config)
            elif target.startswith("http") or "/" in target:
                workflow_pack_github(target, config)
            else:
                print(f"[-] Unrecognized target: '{target}'")
                sys.exit(1)

        elif cmd == "unpack":
            if len(sys.argv) < 3:
                print("[-] Usage: python3 repopack.py unpack <container.txt> [destination_dir]")
                sys.exit(1)
            src_file = sys.argv[2]
            dest_dir = sys.argv[3] if len(sys.argv) > 3 else "./restored_repo"
            unpack_container_file(src_file, dest_dir)

        else:
            # Assume target is a directory, zip, or github url
            target = sys.argv[1]
            if os.path.isdir(target):
                workflow_pack_directory(target, config)
            elif os.path.isfile(target) and target.endswith(".zip"):
                workflow_pack_zip(target, config)
            elif target.endswith(".txt"):
                unpack_container_file(target, "./restored_repo")
            else:
                run_interactive_menu()
    else:
        run_interactive_menu()

if __name__ == "__main__":
    main()
