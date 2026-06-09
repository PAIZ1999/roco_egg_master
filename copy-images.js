import fs from 'fs';
import path from 'path';

// 不需要打包进 dist 的目录名（备份目录等）
const EXCLUDE_DIRS = ['sprites_backup'];

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    // 跳过排除目录
    if (entry.isDirectory() && EXCLUDE_DIRS.includes(entry.name)) {
      console.log(`[CopyImages] Skipping excluded directory: ${entry.name}`);
      continue;
    }

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
