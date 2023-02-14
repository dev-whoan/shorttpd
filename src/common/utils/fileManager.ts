import * as fs from 'fs';
import * as path from 'path';

export const directoryReader = (requestPath: string) => {
  const read = fs.readdirSync(requestPath, { withFileTypes: true });
  const dirs = [];
  const files = [];

  read.forEach((file, index) => {
    const fDir = file.isDirectory();
    const fName = file.name;
    const fPath = path.join(requestPath, fName);

    if (!fDir) {
      const fStat = fs.statSync(fPath);
      files.push({
        name: fName,
        dir: false,
        size: fStat.size,
        lastModified: new Date(fStat.mtime).toLocaleString(),
      });
      return false;
    }
    dirs.push({
      name: fName,
      dir: true,
      size: 'Directory',
      lastModified: null,
    });
  });

  const fileSorter = (a, b) => {
    const A = a.name.toUpperCase();
    const B = b.name.toUpperCase();
    return A > B ? 1 : -1;
  };
  dirs.sort(fileSorter);
  files.sort(fileSorter);

  const unite = [...dirs, ...files];
  return unite;
};
