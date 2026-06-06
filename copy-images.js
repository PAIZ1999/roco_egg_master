import fs from 'fs';
import path from 'path';

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const srcDir = path.resolve('images');
const destDir = path.resolve('dist/images');

if (fs.existsSync(srcDir)) {
  console.log(`[CopyImages] Copying from ${srcDir} to ${destDir}...`);
  copyDir(srcDir, destDir);
  console.log('[CopyImages] Copying completed successfully.');
} else {
  console.error(`[CopyImages] Error: Source directory ${srcDir} does not exist.`);
  process.exit(1);
}
