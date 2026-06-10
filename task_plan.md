# Task Plan: 父母本滚动查看布局、蛋管理分页与全局卡片拖拽与筛选 (以及临界体型配对细化)

## Goal
优化父母本页面布局，彻底删除任何 `parentCols` 列数滑块残留，将左右两栏的 Grid 容器恢复为适合滚动的大屏/桌面体验；实现精灵蛋管理列表的分页机制（一页展示 6 个）；引入 `@dnd-kit/sortable` 并实现蛋管理与左右两列父母本各自的卡片拖拽排序与本地存档；实现精灵蛋卡片删除免确认；细化智能繁育临界体型“概率大块头”的判定与一键导入“普通”牌子的映射。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [ ] memory 知识存储完成

## Phases
- [x] Phase 1: 规划与准备 (分析代码基, 确认 Git 状态, 制定高阶计划)
- [x] Phase 2: 信息调研与设计 (详细分析 App.tsx 中过滤逻辑、状态管理、卡片结构并编写排序方案)
- [x] Phase 3: 核心执行 - 父母本布局修改与蛋管理分页修改 (在 `src/App.tsx` 中把左右栏 Grid 类名更改为 `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4`，把分页设为一页展示 6 个并编写精美分页控制器 UI)
- [x] Phase 4: 核心执行 - 改造卡片与集成拖拽排序 (修改 `EggCard.tsx` 和 `ParentCard.tsx` 支持 `useSortable` 与 Grip 图标；在 `src/App.tsx` 中为三个列表各自集成独立的拖拽上下文并编写 `onDragEnd` 数据重排与自动存档)
- [x] Phase 5: 核心执行 - 智能繁育体型规则与免确认删除 (在 `src/App.tsx` 中修改 `getPairings` brand 判定决策树；在 `handleImportPairingsToNest` 导入时将 `概率大块头` 映射为 `普通`；移除精灵蛋删除弹窗二次确认)
- [x] Phase 6: 测试验证与审查 (在本地运行并使用浏览器/终端测试各项功能，打包构建验证，记录至 walkthrough.md)

## Key Questions
1. 在父母本仓储中，左侧父本和右侧母本列表如何处理拖拽排序？
    - 答：分别使用独立的 `DndContext` 包裹父本和母本列表。在各自的拖动结束后，在全量 `parents` 数组中定位 active 和 over 元素，然后使用 `arrayMove` 在全量数组中重排，非常简单且完美。
2. 蛋管理包含分页，如何进行拖拽排序？
    - 答：`SortableContext` 的 `items` 传入当前页的蛋 ID 列表（`paginatedEggs.map(e => e.id)`）。拖拽结束后在全量 `eggs` 数组中定位对应的 active 和 over 蛋 ID 并进行 `arrayMove` 重排。
3. 如果当前页只有一个卡片，并且被删除了，页码怎么处理？
    - 答：当 `eggCurrentPage > totalEggPages` 时，通过 `useEffect` 自动将 `eggCurrentPage` 归拢至 `totalEggPages`，避免展示空白页。

## Decisions Made
- [决策]: 父母本卡片和蛋管理卡片分别包裹各自独立的 `DndContext`，完全隔离拖拽作用域，避免干扰。
- [决策]: 彻底移除任何 `parentCols` 残留，将父母本网格统一设为 `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4`。
- [决策]: 分页大小根据最新用户需求固定为 6，当筛选条件改变时重置当前页码为 1。
- [决策]: 对“概率大块头”牌子，一键导入时统一强制重写 brand 为“普通”。

## Errors Encountered
- `DndContext` 标识符重复声明编译错误：已通过移除 App.tsx 顶部的多余重复导入解决。

## Status
**Currently in Completed** - 任务全部阶段顺利完成。已在本地和浏览器（Electron 模拟）中进行了双列父母本布局滚动、6个一页精灵蛋分页、全局卡片拖动重排序、智能繁育临界体型配对细化、概率大块头一键导入以及数据自动存盘验证，并更新了项目知识库。
