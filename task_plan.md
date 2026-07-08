# Task Plan: 优化父母本仓储展示和统计逻辑

## Goal
重构父母本仓储的展示方式和数据统计逻辑：将表格/卡片切换移动至各自的仓储库中并支持独立切换；删除配组建议模块并将统计大表格的维度对调为性格/蛋组；为表格模式下的精灵行增加快速勾选配组的复选框。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [ ] memory 知识存储完成

## Phases
- [x] Phase 1: 规划与准备 (创建 implementation_plan.md 并获取批准)
- [x] Phase 2: 修改 WarehouseStatsTable.tsx (删除配组建议，统计表格转置为性格/蛋组，调整卡片及排版布局)
- [x] Phase 3: 修改 App.tsx (拆分 parentsViewMode 为独立状态，重定位切换按钮，在表格行添加复选框，清理相关冗余逻辑)
- [x] Phase 4: 测试与验证 (验证单独切换、维度对调、表格快速勾选及删除建议后UI自适应)
- [x] Phase 5: 最终交付与知识沉淀 (更新 PROJECT_KNOWLEDGE.md，完成 Git 提交)

## Key Questions
1. 父母本仓储的表格和卡片切换按钮移动至过滤栏后，样式和位置如何保持和谐？
   - 答：放置在各自的过滤栏最右侧，与“重置”按钮并排对齐，使用 `h-7` 高度的胶囊按钮，与现有过滤器设计风格保持一致。
2. 表格转置为 8 性格 × 14 蛋组后，列数增多是否会导致横向溢出？
   - 答：外层有 `overflow-x-auto no-scrollbar` 容器保护，滚动体验良好；且由于删除了右侧的“配组建议”栏，表格宽度能够完全拉满占满页面，阅读体验会明显提升。

## Decisions Made
- [决策]: 独立 `fatherViewMode` 和 `motherViewMode` 两个状态，分别存储在 localStorage 中以保证用户体验的连贯性。
- [决策]: 统计表格顶部卡片只保留“种公收集进度”和“公母配对达成度”，删除已经没有数据支撑的“直接繁育缺口”卡片。
- [决策]: 在表格中的精灵名字前引入和卡片模式相同样式的 checkbox，勾选触发 `handleUpdateParentChecked`。

## Errors Encountered
- 无

## Status
**Currently in Phase 5** - 所有工作已顺利完成并通过浏览器自动化与人工测试验证，准备交付并提交 Git。
