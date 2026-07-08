# Task Plan: 洛克王国孵蛋数据大容量导入与展示性能优化

## Goal
优化游戏数据导入模块，消除一次性解析/查重上千条精灵时导致的主线程假死白屏问题，并对蛋窝中心、父母本仓储进行分页渲染改造，彻底根治大容量数据下的软件卡顿与白屏 Bug，实现极致流畅的操作体验。

## MCP Status
- [x] memory 检索完成
- [ ] sequential-thinking 分析完成
- [ ] memory 知识存储完成

## Phases
- [/] Phase 1: 规划与准备（算法分析、性能排查与优化方案设计） [进行中]
- [ ] Phase 2: RocoImportModal.tsx 性能优化（O(1) 哈希去重算法、弹窗内表格分页展示）
- [ ] Phase 3: 父母本仓储库分页改造（父本和母本管理列表独立分页及筛选重置联动）
- [ ] Phase 4: 我的精灵蛋窝中心分页改造（蛋窝 SortableCard 网格分页及筛选重置联动）
- [ ] Phase 5: 打包构建与多维度极限性能测试验证

## Key Questions
1. 父母本与蛋窝分页的单页容量大小：
   - 父母本左右分栏渲染，建议 `PARENT_PAGE_SIZE = 10`，兼顾内容饱满度和大屏滚动友好度。
   - 蛋窝中心采用 3 列网格，建议 `NEST_PAGE_SIZE = 9` (3x3)，保证每一页完美对称无缺口。
   - 导入弹窗内精灵列表为行紧凑表格，建议 `IMPORT_PAGE_SIZE = 50`。

## Decisions Made
- [决策]: **O(1) 去重哈希表设计**：在 RocoImportModal 中，不再针对每一只导入的精灵在 existingParents 数组中反复做 `.some()` + `JSON.stringify()`，而是提前将现有父母本数据编译为一个 `Set<string>`，使查重复杂度由 $O(N \times M)$ 降为 $O(N + M)$，完全消除数据量大时的解析卡死。
- [决策]: **全分页控制机制**：避免一次性渲染成百上千个包含拖动、下拉 autocomplete 的 React 节点。在蛋窝、父本、母本三大高载荷组件内均加入独立分页，并将 `@dnd-kit/sortable` 限制在单页内排序。

## Errors Encountered
- 暂无

## Status
**Currently in Phase 1** - 已完成代码瓶颈定位，正在编写任务计划并准备进行去重和渲染分页开发。
