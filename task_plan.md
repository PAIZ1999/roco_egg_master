# Task Plan: 极限量级字段变更为有无极限蛋

## Goal
将系统中的“极限量级”字段及其选项变更为“有无极限蛋”，选项修改为“有极限蛋”与“无极限蛋”，并在完成修改后重新打包桌面端应用。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [ ] memory 知识存储完成

## Phases
- [ ] Phase 1: 规划与分析 (已完成代码分析，正等待用户审批)
- [ ] Phase 2: 修改核心字段定义与迁移逻辑 (`src/types.ts`, `src/App.tsx`)
- [ ] Phase 3: 修改组件展示与高亮逻辑 (`SortableCard.tsx`, `SortableRow.tsx`, `App.tsx`)
- [ ] Phase 4: 本地构建与功能验证 (`npm run dev`)
- [ ] Phase 5: 桌面端打包 (`npm run electron:build`)
- [ ] Phase 6: 最终交付与 Git 提交

## Key Questions
1. 历史数据兼容性如何处理？
   - **解答**：在 `migratePets` 迁移函数中，若读取到历史数据为“极限”或“是”，自动映射为“有极限蛋”；若为“非极限”或“否”或空值，自动映射为“无极限蛋”。

## Decisions Made
- [决策]: 将 `LIMIT_OPTIONS` 选项文本更新为 `["无极限蛋", "有极限蛋"]`。
- [决策]: 表格、卡片及筛选中的“极限量级”文案统一变更为“有无极限蛋”，Badge 展示文本变更为“有极限蛋”。

## Errors Encountered
- 无

## Status
**Currently in Phase 1** - 规划与准备阶段，已生成实施计划，正等待用户审批。
