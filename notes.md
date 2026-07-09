# Notes: 智能配对、长图导出与浅色主题表格颜色优化

## 1. 浅色主题表格颜色修改
根据用户要求：
- 偶数行（1-indexed 的第偶数行，React 中 `index % 2 === 1`）：`#ffffff` (bg-white)
- 奇数行（1-indexed 的第奇数行，React 中 `index % 2 === 0`）：`#F2F6F8` (bg-[#F2F6F8])
- 悬停：`#DFE9EF` (hover:bg-[#DFE9EF])

需要修改的文件和行：
- `src/App.tsx` 3710 行（蛋窝表格模式行背景色）
- `src/App.tsx` 4886 行（父本表格模式行背景色）
- `src/App.tsx` 5222 行（母本表格模式行背景色）

## 2. 智能配对中心一键导入与选择逻辑优化
当前同一个母本的卡片（通过蛋品种 `eggSprite` 分组），有多个配对（`pairings`）。默认情况下，一键导入会把所有未排出的配对全部导入。
优化方案：
- 将配对选择池从 `filteredPairings` 缩减为只取当前显示的配对 `activePairings`。
- 对于每个 `groupedPairing`，当前显示的配对是 `group.pairings[safeIdx]`，其中 `safeIdx` 是当前 Chevron 切换索引。
- 一键导入按钮和 `selectedPairings` 统计只联动 `activePairings`：
  ```typescript
  const activePairings = groupedPairings.map(group => {
    const groupKey = group.eggSprite;
    const activeIndex = activeFatherIndices[groupKey] || 0;
    const safeIdx = activeIndex >= group.pairings.length ? 0 : activeIndex;
    return group.pairings[safeIdx];
  }).filter(Boolean);
  
  const selectedPairings = activePairings.filter(pair => !excludedPairKeys.has(pair.father.id + "-" + pair.mother.id));
  ```
- 顶部的“一键导入所选配对”按钮仅导入 `selectedPairings`。
- 添加“全选”与“取消全选”按钮：
  - “全选”：把 `excludedPairKeys` 清空。
  - “取消全选”：把当前 `activePairings` 的配对键都放进 `excludedPairKeys` 集中。

## 3. 长图导出只保留核心内容
长图导出原有逻辑克隆了 `#export-container`。为了只保留表格或卡片主体内容，不导出顶部的头部和统计区域，可以通过克隆后操作 DOM 节点的 `.remove()` 干净地移除它们：
- 给 `Banner Section` 添加 `id="header-banner"`
- 给 `Tab 切换导航栏` 添加 `id="tab-navigation-bar"`
- 给 `蛋窝 Tab` 的实时数据统计面板添加 `id="nest-stats-panel"`
- 给 `父母本 Tab` 的头部操作栏添加 `id="parents-header-bar"`
- 给 `父母本 Tab` 的 `WarehouseStatsTable` 外部容器添加 `id="parents-stats-table-container"`
- 给 `父本单独过滤栏` 添加 `id="father-filter-bar"`
- 给 `母本单独过滤栏` 添加 `id="mother-filter-bar"`
- 给 `配对筛选栏` 添加 `id="pairing-filter-bar"`
- 给 `精灵蛋 Tab` 的实时统计面板添加 `id="eggs-stats-panel"`
- 给 `精灵蛋 Tab` 的头部和筛选栏添加 `id="eggs-header-bar"`
- 在 `handleExportLongImage` 里一并移除：
  ```typescript
  const toRemoveSelectors = [
    "#header-banner",
    "#tab-navigation-bar",
    "#nest-stats-panel",
    "#filter-header-bar",
    "#parents-header-bar",
    "#parents-stats-table-container",
    "#father-filter-bar",
    "#mother-filter-bar",
    "#pairing-filter-bar",
    "#eggs-stats-panel",
    "#eggs-header-bar"
  ];
  toRemoveSelectors.forEach(selector => {
    const el = clone.querySelector(selector);
    if (el) el.remove();
  });
  ```
