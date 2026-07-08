# Task Plan: 临近大块头与临近声音牌智能筛选与卡片展示升级

## Goal
支持在游戏盒子导入界面提取和筛选“临近大块头”、“临近声音牌”以及两者的联合过滤选项；在父母本卡片中持久化存储并展示精灵的实际声音偏差数值，支持手动编辑调整，提供极值与临界的动态高亮呼吸徽章。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [x] memory 知识存储完成

## Phases
- [/] Phase 1: 临界值判定设计与 implementation_plan 编写 (当前)
- [ ] Phase 2: 类型系统 (types.ts) 追加 voice 字段与 App.tsx 事件响应
- [ ] Phase 3: 前端 RocoImportModal 解析、推导及三级下拉模糊联选重构
- [ ] Phase 4: 前端 ParentCard 卡片增加声音编辑框与左侧动态呼吸徽章
- [ ] Phase 5: 打包构建与多维度过滤验证测试

## Key Questions
1. 声音临界值是否只针对 [-95, -90] 与 [90, 95] 区间进行提示？（已通过数据库特征确定该分布）

## Decisions Made
- [决策]: 临近大块头（Near Giant）和临近声音值均通过本地阈值计算动态推导得出，不依赖第三方库。
- [决策]: 在卡片上提供声音值输入框，使手动添加或修改能够实时计算并更新牌子等级状态。

## Errors Encountered
- 无

## Status
**Currently in Phase 1** - 已设计完临界值模型并提交了 Implementation Plan 供用户评审。
