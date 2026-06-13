# Task Plan: 蛋窝产蛋联动与精灵蛋体型标签显示优化

## Goal
实现精灵蛋窝中心与蛋管理中心的联动：支持从蛋窝卡片一键产蛋到蛋管理中心（自动映射父母性格、三围、精灵名，且精灵名默认为最低进化形态，扣减现蛋数量或切换状态）；优化手动登记蛋的默认三围为生命/物攻/速度；优化蛋卡片体型标签的渲染规则，选择大粗、大婉、单大块头体型牌且未达到极限值时，不显示“普通体型”标签。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成 (不需额外文档)
- [x] sequential-thinking 分析完成
- [x] memory 知识存储完成

## Phases
- [x] Phase 1: 代码定义与算法准备 (在 `petHelper.ts` 中实现 `getLowestStageName` 精灵最低进化形态推导算法)
- [x] Phase 2: 蛋窝卡片交互扩展 (修改 `SortableCard.tsx` 的 props、一键产蛋 UI，并在有现蛋时展示“产蛋”按钮)
- [x] Phase 3: 主页面联动与添加逻辑 (修改 `App.tsx` 中的手动添加蛋三围默认值，并实现 `handleAddEggFromNest` 一键产蛋联动逻辑)
- [x] Phase 4: 蛋体型标签显示规则微调 (修改 `EggCard.tsx` 以过滤大粗、大婉、单大块头在未达极限时的“普通体型”标签)
- [x] Phase 5: 测试验证与 Git 提交 (运行 npm run dev 测试联动和体型标签，执行 npm run build，然后进行规范的 git commit 提交)

## Key Questions
1. 蛋窝中如果包含多性格（`fatherNatures` 数组），产蛋时精灵蛋应该选择哪一个性格？
   - 决策：精灵蛋的 `fatherNature` 字段只支持单字符串。我们将默认使用蛋窝性格数组的第一个元素 `nest.fatherNatures[0]`，如果为空则设为空字符串，符合易用性。
2. 蛋窝产蛋扣减完现蛋数后，若现蛋数归零（即扣减前数量为1，扣减后为0），如何重置蛋窝状态？
   - 决策：将蛋窝现蛋数重置为 `"0"`，且将状态（`status`）修改为 `"已撤窝"`，以便呈现非现蛋状态占位色带，保持卡片物理排版高度一致。

## Decisions Made
- [决策]: 在 `SortableCard.tsx` 的现蛋数量右侧添加醒目的“产蛋”按钮，在 `status === "有现蛋"` 时渲染。
- [决策]: 一键产蛋后，如果扣减前数量大于1，则现蛋数量减1，否则将现蛋数量设为 `"0"` 并将窝点状态变更为 `"已撤窝"`。

## Errors Encountered
- 暂无

## Status
**Currently in Completed** - 所有联动产蛋功能和标签过滤规则均已完成，成功通过类型检查与生产打包，并已提交至 git 仓库。
