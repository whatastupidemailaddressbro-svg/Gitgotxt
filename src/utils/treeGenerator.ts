interface TreeNode {
  name: string;
  isDir: boolean;
  children: Map<string, TreeNode>;
}

export function generateAsciiTree(filePaths: string[]): string {
  if (filePaths.length === 0) {
    return ".\n└── (no files)";
  }

  // Build tree hierarchy
  const root: TreeNode = { name: ".", isDir: true, children: new Map() };

  for (const rawPath of filePaths) {
    const cleanPath = rawPath.replace(/\\/g, "/").replace(/^\/+/, "");
    const parts = cleanPath.split("/").filter(Boolean);

    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isDir = i < parts.length - 1;

      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          isDir,
          children: new Map(),
        });
      }
      current = current.children.get(part)!;
    }
  }

  const lines: string[] = ["."];

  function renderNode(node: TreeNode, prefix: string, isLast: boolean, depth: number) {
    if (depth > 0) {
      const connector = isLast ? "└── " : "├── ";
      const dirSuffix = node.isDir ? "/" : "";
      lines.push(`${prefix}${connector}${node.name}${dirSuffix}`);
    }

    const nextPrefix = depth === 0 ? "" : prefix + (isLast ? "    " : "│   ");

    // Sort: directories first, then alphabetical
    const sortedEntries = Array.from(node.children.values()).sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

    for (let i = 0; i < sortedEntries.length; i++) {
      const child = sortedEntries[i];
      const childIsLast = i === sortedEntries.length - 1;
      renderNode(child, nextPrefix, childIsLast, depth + 1);
    }
  }

  renderNode(root, "", true, 0);

  return lines.join("\n");
}
