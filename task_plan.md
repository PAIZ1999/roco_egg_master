# Task Plan: 优化全选父母配对卡顿与导入数据保存机制

## Goal
彻底解决 1000+ 级大容量精灵导入及全选父母本时的软件卡顿/卡死问题，并确保大批量导入数据时瞬时存盘，防范崩溃导致的数据丢失。

## MCP Status
- [x] memory 检索完成
- [ ] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [ ] memory 知识存储完成

## Phases
- [ ] Phase 1: 规划与准备 (当前阶段，编写实施方案并征求确认)
- [ ] Phase 2: 核心修改 (使用 useMemo 提取与缓存配对，加入熔断保护机制，重构 executeSave 并引入即时存盘)
- [ ] Phase 3: 本地编译与功能验证 (进行 Electron 本地编译及大批量导入性能极限测试)
- [ ] Phase 4: 知识库整理与最终交付 (更新 PROJECT_KNOWLEDGE.md 并沉淀 memory)

## Key Questions
1. 3000 对作为熔断阈值是否能够满足用户通常的繁育查看需要？
2. 熔断提示在 UI 界面上是否需要支持“仍然强制计算”选项？（考虑到防止卡顿的核心目标，建议默认不支持强制，以保障软件稳定性）

## Decisions Made
- [决策]: 必须将 JSX 内部的所有大数组链式去重、筛选与分组运算全部迁移到组件顶层的 `useMemo` 中。
- [决策]: 引入安全阈值（暂定 3000 组配对），超出则只进行熔断警示，防止产生数十万次无价值笛卡尔积计算挂起主线程。
- [决策]: 重构 `executeSave` 保存执行器以支持状态字段覆盖，并在精灵导入/数据恢复等批量操作中执行即时物理存盘，切断“卡死->丢失数据”的恶性链条。

## Errors Encountered
- 无

## Status
**Currently in Phase 1** - 规划与准备。已定位问题成因并设计优化策略，正在向用户呈递 Implementation Plan。
