# Task Plan: 配对中心母本合并与同性格筛选

## Goal
实现智能繁育配对中心的母本合并显示与同性格筛选，母本卡片内支持多父本左右切换，保证筛选时动态刷新候选父本。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [x] memory 知识存储完成

## Phases
- [x] Phase 1: 规划与准备
- [x] Phase 2: 修改状态与筛选逻辑
- [x] Phase 3: 重构卡片合并与切换 UI
- [x] Phase 4: 测试与编译验证
- [x] Phase 5: 交付与知识沉淀

## Key Questions
1. **如何处理无性格/空性格的情况？**
   - 答：双亲同性格筛选只适用于父母双方都有具体性格（非空）且性格完全相同的情况。如果一方为“选择性格”(空字符串 `""`)，则不认为相同。

## Decisions Made
- [决策]: 采用“方案 A”，即按母本卡片实例 `mother.id` 进行分组合并，确保每只在仓储中具备不同属性（物理存放位置、身高体重偏差）的母本精灵都作为独立的配对主体进行展示和导入，避免产生笛卡尔积切换混乱。

## Errors Encountered
- **JSX 标签与多余闭合大括号导致编译失败**: 替换时因局部错位残留了旧的 filteredPairings map 下半段，导致引用 `pair` 且大括号不匹配。
  - *解决方案*：执行 `git checkout` 恢复原样，重新编写精准的 Node/CommonJS 局域替换脚本 `fix_pairing.cjs` 进行变量修剪，再整体替换 `parents-pairing-section`，完美通过 `npm run lint` 验证。

## Status
**Currently in Phase 5** - 开发已经全部完成，项目编译通过 (tsc --noEmit 成功)，已进入手动验证与交付阶段。
