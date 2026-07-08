# Task Plan: 游戏内精灵仓库位置同步展示升级

## Goal
支持提取《洛克：世界》本地盒子数据库中的位置索引表 `box_{UID}`，建立宠物 ID 与其所在盒子、行、列的映射关系，实现导入时在列表中显示并在父母本卡片上持久化展示“📍 X盒 X行X列”位置。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [x] memory 知识存储完成

## Phases
- [/] Phase 1: 仓库位置算法映射设计与 implementation_plan 编写 (当前)
- [ ] Phase 2: 后端 Electron main.cjs 提取位置并拼装属性
- [ ] Phase 3: 前端 types.ts 和 RocoImportModal.tsx 表格与字段扩充
- [ ] Phase 4: 前端 ParentCard.tsx 卡片加注 📍 位置定位 Badge
- [ ] Phase 5: 打包构建与多维度过滤验证测试

## Key Questions
1. 盒子的行列排布规律：已确定是每页 30 格 (6行5列)，完美契合 $k$ 索引换算。

## Decisions Made
- [决策]: 位置数据直接在 Python 数据层拼装成 "1盒\n2行4列" 字符串，减少前端的计算负担。
- [决策]: 父母本卡片上仅在 position 存在且不为 "-" 时显示，保证老数据完全向后兼容。

## Errors Encountered
- 无

## Status
**Currently in Phase 1** - 已设计完临界值模型并提交了 Implementation Plan 供用户评审。
