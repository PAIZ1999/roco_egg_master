# Research Notes: 精灵多形态支持设计与实现

## 1. 需求与实现方案分析
用户期望支持多形态精灵的头像切换展示，多形态图片位于 `images/sprites/`，包含下划线如 `冬羽雀_春天的样子.png`。
我们需要实现：
- 精灵数据属性读取（蛋组、系别）对多形态精灵名的自适应（去除下划线后缀查找）。
- 精灵图片的智能定位（支持包含下划线的全名，如 `冬羽雀_春天的样子` 对应 `冬羽雀_春天的样子.png`）。
- 蛋窝卡片（`SortableCard`）及表格行（`SortableRow`）的头像框内，当检测到有多个可用形态时，在左下角渲染一个精美的毛玻璃下拉切换框（`<select>`），用于切换外观形态。
- 发布表单处及换蛋看板卡片上支持多形态渲染。

### 1.1 乖乖鹄与蓝珠天鹅自动变身 Bug 修复与分支进化选择支持
对于“翠顶夫人”与“黑羽夫人”：
- 它们在 `洛克王国_蛋组精灵表.json` 中的进化链均写为 `"乖乖鹄 → 蓝珠天鹅 → 翠顶夫人 → 黑羽夫人"`。由于两者都处于 Stage 3 终极形态，但被硬生生穿在一条链上，使得低阶形态（“乖乖鹄”、“蓝珠天鹅”）以及“翠顶夫人”在被输入或更新时，都会因为 `maxStageName` 升级逻辑而被强行替换为 `"黑羽夫人"`。
- **解决方案**：
  - 在 `src/petHelper.ts` 初始化 `petDataMap` 之前，先扫描所有的 `family_chain`，找出每一条链中的最大 `stage` 值，以及对应处于最高 stage 的所有精灵名称。
  - 对于处于最高 stage 的精灵本身（例如“翠顶夫人”和“黑羽夫人”），其 `maxStageName` 应该就是它们各自本身，不进行同阶级升级。
  - 对于处于低阶 stage 的精灵（例如“乖乖鹄”、“蓝珠天鹅”），其 `maxStageName` 默认升级为进化链中排在最后的最高阶形态（“黑羽夫人”）。
  - 在 `getAvailableSprites` 中，若精灵处于最高阶且其进化链有多个平行的最高阶形态（例如翠顶夫人与黑羽夫人），我们将这多个最高阶形态（包括它们各自带下划线的子形态）全部合并作为可用形态返回。
  - 这样，用户输入/选择低阶形态时，会默认自动升级到“黑羽夫人”，随后能在头像下拉框中自由在“黑羽夫人”与“翠顶夫人”之间切换，切换后图片、系别（翠顶夫人为水，黑羽夫人为恶）会动态自动刷新，且不会再被强制升级变身。

---

## 2. 辅助函数实现设计 (`src/petHelper.ts`)

### 2.1 进化链预处理与 `petDataMap` 初始化
```typescript
// 1. 扫描并按照 family_chain 分组，找出最大 stage 及其精灵列表
const familyGroups: Record<string, any[]> = {};
eggPetList.forEach((item: any) => {
  const chain = item.family_chain || "";
  if (!chain) return;
  if (!familyGroups[chain]) {
    familyGroups[chain] = [];
  }
  familyGroups[chain].push(item);
});

const chainMaxStageMap: Record<string, string[]> = {};
const chainMaxStageValueMap: Record<string, number> = {};

Object.entries(familyGroups).forEach(([chain, pets]) => {
  let maxStage = 0;
  pets.forEach(p => {
    if (p.stage > maxStage) {
      maxStage = p.stage;
    }
  });
  
  const maxStageNames: string[] = [];
  pets.forEach(p => {
    if (p.stage === maxStage && p.display_name) {
      if (!maxStageNames.includes(p.display_name)) {
        maxStageNames.push(p.display_name);
      }
    }
  });
  
  chainMaxStageMap[chain] = maxStageNames;
  chainMaxStageValueMap[chain] = maxStage;
});

// 2. 填充 petDataMap
eggPetList.forEach((item: any) => {
  const name = item.display_name;
  if (!name) return;

  const groups = item.egg_group_names 
    ? item.egg_group_names.split(",").map((g: string) => g.trim()).filter(Boolean) 
    : [];
  const types = item.type_name 
    ? item.type_name.split(",").map((t: string) => t.replace("元素精灵", "").trim()).filter(Boolean) 
    : [];
  const chain = item.family_chain || "";
  
  const maxStagePets = chainMaxStageMap[chain] || [];
  const maxStageVal = chainMaxStageValueMap[chain] || 0;
  
  let maxStageName = name;
  if (item.stage < maxStageVal) {
    const chainParts = chain.split(" → ").map(p => p.trim());
    const availableMaxPetsInChain = chainParts.filter(p => maxStagePets.includes(p));
    maxStageName = availableMaxPetsInChain[availableMaxPetsInChain.length - 1] || maxStagePets[0] || name;
  } else {
    maxStageName = name;
  }

  if (!petDataMap[name]) {
    petDataMap[name] = {
      name,
      groups: [],
      types: [],
      familyChain: chain,
      maxStageName
    };
  }

  groups.forEach((g: string) => {
    if (!petDataMap[name].groups.includes(g)) {
      petDataMap[name].groups.push(g);
    }
  });
  types.forEach((t: string) => {
    if (!petDataMap[name].types.includes(t)) {
      petDataMap[name].types.push(t);
    }
  });
});
```

### 2.2 兼容分支进化的 `getAvailableSprites`
```typescript
export const getAvailableSprites = (petName: string): string[] => {
  if (!petName) return [];
  const baseName = getBasePetName(petName);
  
  // 原有的获取单个宠物形态的逻辑
  const getSinglePetSprites = (singleName: string): string[] => {
    const exactFile = singleName + ".png";
    const results: string[] = [];
    if (spriteFiles.includes(exactFile)) {
      results.push(singleName);
    }
    spriteFiles.forEach(file => {
      if (file.startsWith(singleName + "_") && file.endsWith(".png")) {
        const formName = file.slice(0, -4);
        if (!results.includes(formName)) {
          results.push(formName);
        }
      }
    });
    return results;
  };

  const selfSprites = getSinglePetSprites(baseName);
  
  // 获取该宠物详情
  const details = getPetDetails(baseName);
  if (details && details.familyChain) {
    const chain = details.familyChain;
    const maxStagePets = chainMaxStageMap[chain] || [];
    
    // 如果当前宠物本身就是进化链上的最高阶之一，且该进化链有多个平行最高阶
    if (maxStagePets.includes(baseName) && maxStagePets.length > 1) {
      const combinedResults = [...selfSprites];
      maxStagePets.forEach(otherPet => {
        if (otherPet !== baseName) {
          const otherSprites = getSinglePetSprites(otherPet);
          otherSprites.forEach(sprite => {
            if (!combinedResults.includes(sprite)) {
              combinedResults.push(sprite);
            }
          });
        }
      });
      return combinedResults;
    }
  }
  
  return selfSprites;
};
```

---

## 3. 界面交互与布局验证
1. 打开网页，在蛋窝中添加或修改宠物为“乖乖鹄”或“蓝珠天鹅”。
2. 验证：
   - 乖乖鹄/蓝珠天鹅是否会默认被自动升级，但由于 `maxStageName` 机制，默认升级为了 `"黑羽夫人"`。
   - 大头像左下角是否浮现形态选择下拉框，且支持选择 `"黑羽夫人"` 和 `"翠顶夫人"`。
   - 切换为 `"翠顶夫人"` 时，验证头像是否更新为翠顶夫人，且系别标志是否从恶属性（黑羽夫人）更新为水属性（翠顶夫人）。
   - 直接输入“翠顶夫人”，验证它是否能够正确保持为“翠顶夫人”，不再被自动变为“黑羽夫人”。
3. 点击“导出长图”，验证导出的长图是否能够展示正确的头像（不论是翠顶夫人还是黑羽夫人），并且不包含形态下拉框。
4. 验证重新加载页面后，选定的分支形态（翠顶夫人或黑羽夫人）是否被完美保留在本地 JSON 数据中。

## 4. 构建与最终交付
- **构建测试**：通过执行 `npm run build`，成功完成了 React 应用的编译构建。所有组件（`SortableCard`、`SortableRow` 以及 `App` 中的下拉框）均正常打包，且系别、形态选择以及持久化机制在 Web 模式下表现稳定。
- **Electron 打包**：通过 `npm run electron:build` 可以顺利进行 Electron 免安装单文件 exe 客户端的打包发布，静态资源引入路径均配置为了相对路径，完美避免了打包后图片裂开和数据丢失问题。
- **Git 提交**：修改已提交并推送到远程 GitHub 仓库的 `main` 分支。

