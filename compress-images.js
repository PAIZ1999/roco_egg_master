/**
 * compress-images.js
 * 批量无损压缩 images/sprites 目录下的所有 PNG 文件
 * 使用 sharp 库的最高无损压缩等级，完整保留透明通道（RGBA）
 * 原始文件会备份到 images/sprites_backup/
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const SPRITES_DIR = path.resolve('images/sprites');
const BACKUP_DIR = path.resolve('images/sprites_backup');

// 格式化字节数
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

async function compressImages() {
  if (!fs.existsSync(SPRITES_DIR)) {
    console.error(`❌ sprites 目录不存在: ${SPRITES_DIR}`);
    process.exit(1);
  }

  // 检查是否已经备份过
  if (fs.existsSync(BACKUP_DIR)) {
    console.log('⚠️  检测到备份目录已存在 (sprites_backup)，跳过备份步骤。');
    console.log('   如需重新压缩，请先删除 sprites_backup 目录。\n');
  } else {
    console.log('📦 正在备份原始图片到 sprites_backup/ ...');
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const backupFiles = fs.readdirSync(SPRITES_DIR);
    for (const file of backupFiles) {
      fs.copyFileSync(path.join(SPRITES_DIR, file), path.join(BACKUP_DIR, file));
    }
    console.log(`✅ 备份完成，共 ${backupFiles.length} 个文件\n`);
  }

  const files = fs.readdirSync(SPRITES_DIR).filter(f => f.toLowerCase().endsWith('.png'));
  console.log(`🖼️  开始无损压缩 ${files.length} 张 PNG 图片（compressionLevel=9）...\n`);

  let totalOriginal = 0;
  let totalCompressed = 0;
  let failed = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(SPRITES_DIR, file);
    const originalSize = fs.statSync(filePath).size;
    totalOriginal += originalSize;

    try {
      // 读取 -> 无损压缩 -> 写回原路径（完整保留 RGBA 透明通道）
      const compressed = await sharp(filePath)
        .png({ compressionLevel: 9, effort: 10 })
        .toBuffer();

      fs.writeFileSync(filePath, compressed);
      const compressedSize = compressed.length;
      totalCompressed += compressedSize;

      const ratio = (((originalSize - compressedSize) / originalSize) * 100).toFixed(1);
      const progress = `[${String(i + 1).padStart(3)}/${files.length}]`;
      console.log(`${progress} ${file.padEnd(35)} ${formatBytes(originalSize).padStart(8)} → ${formatBytes(compressedSize).padStart(8)}  (${ratio}% ↓)`);
    } catch (err) {
      console.error(`❌ 压缩失败: ${file} - ${err.message}`);
      failed.push(file);
    }
  }

  const savedBytes = totalOriginal - totalCompressed;
  const savedRatio = ((savedBytes / totalOriginal) * 100).toFixed(1);

  console.log('\n' + '='.repeat(70));
  console.log(`✅ 压缩完成！`);
  console.log(`   原始总大小:  ${formatBytes(totalOriginal)}`);
  console.log(`   压缩后大小:  ${formatBytes(totalCompressed)}`);
  console.log(`   节省空间:    ${formatBytes(savedBytes)} (${savedRatio}%)`);
  if (failed.length > 0) {
    console.log(`   失败文件:    ${failed.length} 个 - ${failed.join(', ')}`);
  }
  console.log('='.repeat(70));
  console.log('\n💡 提示: 原始图片已备份至 images/sprites_backup/');
  console.log('   重新构建后执行 npm run electron:build 以生成更小的 exe\n');
}

compressImages().catch(err => {
  console.error('❌ 压缩过程出错:', err);
  process.exit(1);
});
