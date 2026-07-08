# Notes: 父母本仓储优化与表格转置研究笔记

## 1. 父母本仓储独立切换状态设计
*   原本 `parentsViewMode` 控制全部父母本的卡片/表格模式。
*   重构方案：
    *   在 `src/App.tsx` 中定义 `fatherViewMode` 和 `motherViewMode` 两个状态。
    *   初始化时从本地存储 `roco_egg_father_view_mode` 和 `roco_egg_mother_view_mode` 获取。
    *   并在 `handleDoubleClickParent` 中，双击父本只将 `fatherViewMode` 设为 `card`，双击母本只将 `motherViewMode` 设为 `card`。

## 2. 统计表格转置 (性格为行，蛋组为列)
*   **原结构**：行 = 蛋组，列 = 性格
*   **新结构**：行 = 性格，列 = 蛋组
*   对调后的数据结构 `stats[nature][group]`：
    ```typescript
    const tempStats: Record<string, Record<string, { fathers: ParentPet[]; mothers: ParentPet[] }>> = {};
    for (const nature of STATS_NATURES) {
      tempStats[nature] = {};
      for (const group of EGG_GROUPS) {
        tempStats[nature][group] = { fathers: [], mothers: [] };
      }
    }
    ```
*   表头渲染：
    *   首列：`性格 \ 蛋组`
    *   后续 14 列：各蛋组名
*   数据单元格：
    *   对应 `stats[nature][group]`。
    *   点击筛选当前性格与蛋组：`onSelectGrid(group, nature, mode)`。

## 3. 表格模式添加复选框 (勾选精灵配组)
*   在父本和母本的表格行，首列“精灵”包含头像和名称。
*   在头像的最前面添加 `<input type="checkbox">`。
*   样式匹配：
    *   父本勾选框：`accent-indigo-650` 或统一使用 UI 的 React Checkbox 风格。
    *   母本勾选框：`accent-pink-650` 风格。
    *   点击事件添加 `e.stopPropagation()`，防止触发行的双击跳转（double-click）或选中卡片交互。
    *   切换状态调用 `handleUpdateParentChecked(parent.id, e.target.checked)`。

## 4. 配组智能建议模块删除
*   移除 `WarehouseStatsTable.tsx` 里的 `breedingRecommendations`、`spawnableGrid` 智能算法与右侧 UI。
*   移除顶部统计卡片的第三项：“直接繁育缺口”。
*   调整父组件 `App.tsx` 中的 `onSelectPair` 和 `handleSelectPair`。如果无需通过配组建议快速选中，可以保留底层 `handleSelectPair` 逻辑（或者因卡片模式依然需要它），但从 `WarehouseStatsTableProps` 里彻底移除。
