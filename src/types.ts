export interface RepoFile {
  path: string;
  size: number;
  lines: number;
  content?: string;
  status: "included" | "skipped";
  skipReason?: string;
  isSelected?: boolean;
}

export interface RepoMeta {
  owner: string;
  repo: string;
  branch: string;
  fullRepoName: string;
  description?: string;
}

export type UnpackerType = "python" | "bash" | "node" | "polyglot";

export interface PackConfig {
  stripDotFiles: boolean;
  stripBinaries: boolean;
  stripVendorDirs: boolean;
  stripLockfiles: boolean;
  maxFileSizeKb: number;
  unpackerScriptType: UnpackerType;
  customIgnorePatterns: string;
}

export interface PackStats {
  totalScanned: number;
  includedCount: number;
  skippedCount: number;
  totalLines: number;
  totalBytes: number;
  estimatedTokens: number;
}

export interface PackResult {
  containerText: string;
  asciiTree: string;
  stats: PackStats;
  files: RepoFile[];
}

export interface UnpackedFile {
  path: string;
  content: string;
  size: number;
  lines: number;
}

export interface PackingProgress {
  active: boolean;
  percent: number;
  title: string;
  step: number;
  totalSteps: number;
  detail: string;
  sourceType?: "github" | "local" | "drive";
  repoName?: string;
  elapsedSeconds?: number;
}
