import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '洛克王国_蛋组精灵表.json'), 'utf8'));

const chainMap = {};
data.forEach(item => {
  const chain = item.family_chain;
  if (!chain) return;
  if (!chainMap[chain]) {
    chainMap[chain] = [];
  }
  chainMap[chain].push(item);
});

console.log("=== 分析进化链中的 Stage 分布 ===");
let count = 0;
for (const [chain, pets] of Object.entries(chainMap)) {
  const stages = pets.map(p => `${p.display_name}(S${p.stage})`);
  const stageCounts = {};
  let hasDuplicateStage = false;
  pets.forEach(p => {
    stageCounts[p.stage] = (stageCounts[p.stage] || 0) + 1;
    if (stageCounts[p.stage] > 1) {
      hasDuplicateStage = true;
    }
  });

  if (hasDuplicateStage) {
    count++;
    console.log(`链 [${chain}]: ${stages.join(" -> ")}`);
  }
}
console.log(`共发现 ${count} 个有重叠 Stage 的进化链`);
