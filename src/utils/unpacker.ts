import JSZip from "jszip";
import { UnpackedFile } from "../types";

export function parseContainerText(text: string): {
  files: UnpackedFile[];
  repoName?: string;
  asciiTree?: string;
} {
  // Extract repo name if available
  const nameMatch = text.match(/REPO CONTAINER:\s*([^\r\n]+)/);
  const repoName = nameMatch ? nameMatch[1].trim() : undefined;

  // Extract directory tree if available
  const treeMatch = text.match(
    /REPOSITORY DIRECTORY STRUCTURE\r?\n={80}\r?\n([\s\S]*?)\r?\n={80}/
  );
  const asciiTree = treeMatch ? treeMatch[1].trim() : undefined;

  // Regex to extract all file blocks
  const fileRegex = /^={80}\r?\nFILE:\s*([^\r\n]+)\r?\n(?:LINES:[^\r\n]*\r?\n)?={80}\r?\n([\s\S]*?)\r?\n-{80}\r?\nEND FILE:\s*\1\r?\n={80}/gm;

  const files: UnpackedFile[] = [];
  let match: RegExpExecArray | null;

  while ((match = fileRegex.exec(text)) !== null) {
    const filePath = match[1].trim();
    const content = match[2];
    const lines = content.length > 0 ? content.split(/\r\n|\r|\n/).length : 0;
    const size = new Blob([content]).size;

    files.push({
      path: filePath,
      content,
      size,
      lines,
    });
  }

  return {
    files,
    repoName,
    asciiTree,
  };
}

export async function downloadFilesAsZip(
  files: UnpackedFile[],
  zipFileName: string = "unpacked-repo.zip"
): Promise<void> {
  const zip = new JSZip();

  for (const file of files) {
    zip.file(file.path, file.content);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
