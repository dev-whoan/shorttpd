import * as fs from 'fs';
import * as path from 'path';

export interface FileEntry {
  name: string;
  dir: boolean;
  size: string;
  lastModified: string | null;
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
};

const byName = (a: FileEntry, b: FileEntry): number =>
  a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1;

export const directoryReader = (
  requestPath: string,
  excludes: string[],
): FileEntry[] => {
  const entries = fs.readdirSync(requestPath, { withFileTypes: true });
  const dirs: FileEntry[] = [];
  const files: FileEntry[] = [];

  for (const entry of entries) {
    if (excludes.includes(entry.name)) continue;

    if (entry.isDirectory()) {
      dirs.push({ name: entry.name, dir: true, size: 'Directory', lastModified: null });
    } else {
      const stat = fs.statSync(path.join(requestPath, entry.name));
      files.push({
        name: entry.name,
        dir: false,
        size: formatSize(stat.size),
        lastModified: new Date(stat.mtime).toLocaleString(),
      });
    }
  }

  dirs.sort(byName);
  files.sort(byName);

  return [...dirs, ...files];
};
