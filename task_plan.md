# Task Plan: 蛋窝产蛋联动与精灵蛋体型标签显示优化

## Goal
实现精灵蛋窝中心与蛋管理中心的双向联动：支持从蛋窝卡片一键产蛋到蛋管理中心（自动映射父母性格、三围、最低进化形态精灵名，现蛋数量加 1 且状态置为“有现蛋”）；反之，当精灵蛋在管理中心被删除时，系统自动追溯对应蛋窝卡片现蛋数减 1，并在归零时变更为“正在孵，可预约”状态。另外，优化手动登记蛋 of 默认三围为生命/物攻/速度，选择大粗、大婉、单大块头时在未达极限时不显示“普通体型”标签，移除蛋卡片孵化时间并新增及格线临界值显示标签。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成 (不需额外文档)
- [x] sequential-thinking 分析完成
- [x] memory 知识存储完成

## Phases
- [x] Phase 1: 代码定义与算法准备 (在 `petHelper.ts` 中实现 `getLowestStageName` 精灵最低进化形态推导算法)
- [x] Phase 2: 蛋窝卡片交互扩展 (修改 `SortableCard.tsx` 的 props、一键产蛋 UI，并在有现蛋时展示“产蛋”按钮)
- [x] Phase 3: 主页面联动与添加逻辑 (修改 `App.tsx` 中的手动添加蛋三围默认值，并实现 `handleProduceEgg` 与 `handleDeleteEgg` 产蛋/删除双向联动)
- [x] Phase 4: 蛋体型与信息标签微调 (修改 `EggCard.tsx` 以过滤大粗、大婉、单大块头在未达极限时的“普通体型”标签，并移除孵化时间、新增及格线临界值标签)
- [x] Phase 5: 测试验证与 Git 提交 (运行 npm run build 验证构建，并进行规范的 git commit 提交)

## Key Questions
1. 蛋窝中如果包含多性格（`fatherNatures` 数组），产蛋时精灵蛋应该选择哪一个性格？
   - 决策：精灵蛋的 `fatherNature` 字段只支持单字符串。我们将默认使用蛋窝性格数组 the 第一个元素 `nest.fatherNatures[0]`，如果为空则设为空字符串，符合易用性。
2. 蛋窝产蛋后，蛋窝卡片的现蛋数量和状态如何变化？
   - 决策：现蛋数量加 1，并且状态自动设置为“有现蛋”（支持用户方便地记录在该蛋窝产出的现蛋个数并连续多次产蛋）。

## Decisions Made
- [决策]: 在 `SortableCard.tsx` 的现蛋数量右侧添加醒目的“产蛋”按钮，在 `status === "有现蛋"` 时渲染。
- [决策]: 一键产蛋后，现蛋数量加 1，且状态强制确保为“有现蛋”，生成 EggData 时存储 `fromNestId` 字段以供回溯。
- [决策]: 删除精灵蛋时，若其包含 `fromNestId` 属性，则使对应 ID 的蛋窝现蛋数减 1，降至 0 时将窝状态重置为“正在孵，可预约”。

## Errors Encountered
- 暂无

## Status
**Currently in Completed** - 所有联动产蛋功能和标签过滤规则均已完成，成功通过类型检查与生产打包，并已提交至 git 仓库。
