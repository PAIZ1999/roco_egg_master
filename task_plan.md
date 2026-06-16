# Task Plan: 洛克王国父母本管理中心统计表格与配组建议模块

## Goal
在父母本管理中心，设计一个“仓库精灵全览”统计表格（直观展示各蛋组、常用性格的种公种母收集情况）与“配组智能建议”模块（分析缺口并一键推荐繁育方案）。

## MCP Status
- [x] memory 检索完成
- [ ] context7/deepwiki 查询完成
- [ ] sequential-thinking 分析完成
- [ ] memory 知识存储完成

## Phases
- [/] Phase 1: 方案设计与用户批准 (已创建 implementation_plan.md 供用户评审)
- [ ] Phase 2: 新建 WarehouseStatsTable.tsx 组件 (编写 14 蛋组 x 8 性格统计，呼吸灯可产蛋算法，及配对建议展示)
- [ ] Phase 3: 整合 App.tsx 状态与路由 (接入组件，编写 handleSelectGrid 快捷过滤与 handleSelectPair 联动勾选逻辑)
- [ ] Phase 4: 样式调试与功能验证 (支持亮/暗色模式、交互手势、滚动及长图导出测试)
- [ ] Phase 5: 最终交付与项目知识库归档

## Key Questions
1. 双蛋组宠物是否应该在表格中同时亮起？
   - 决策：是的，双蛋组同时亮起更符合玩家利用双蛋组宠物进行跨组配对的实际使用习惯。
2. “可产蛋区域（呼吸灯）”的具体界定是什么？
   - 决策：若某格子（蛋组 G, 常用性格 N）缺少种公或种母，且仓库中同时存在该蛋组 G 的母本，以及拥有性格 N 且能与该母本交配的父本，则该格子亮起黄色虚线框呼吸灯。

## Decisions Made
- [决策]: 抽离 `WarehouseStatsTable.tsx` 独立组件，避免在 `App.tsx` 中塞入大篇幅繁育统计与算法代码。
- [决策]: 在配组建议模块中设计“一键选中”功能，点击后清空无关过滤、自动勾选父母并平滑滚动至繁育配对区。

## Errors Encountered
- 无

## Status
**Currently in Phase 1** - 方案设计完成，等待用户批准。
