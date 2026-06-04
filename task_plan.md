# Task Plan: 性格下拉框首字母检索 7 大性格优先级置顶

## Goal
在性格输入框首字母检索（以及默认展示）时，将洛克王国世界最常用的 7 大加成性格（固执、聪明、开朗、胆小、平和、沉默、踏实）排在下拉列表的最上方，方便玩家快速选择。

## MCP Status
- [x] memory 检索完成
- [ ] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [x] memory 知识存储完成

## Phases
- [x] Phase 1: 规划与准备 (创建任务计划，分析代码)
- [x] Phase 2: 修改 Autocomplete 组件逻辑 (过滤与排序模块)
- [x] Phase 3: 编写并执行单元测试 (验证 7 大性格是否优先排在最上面)
- [x] Phase 4: 运行应用并在浏览器验证
- [x] Phase 5: 最终交付与 Git 提交

## Key Questions
1. 7 大优先性格是否也应该在无检索 query 的默认展开下拉框状态下置顶？
   - **决策**: 是的，即使没有输入 query，也应该在下拉菜单的最上面显示这 7 大性格。因为这 7 个是《洛克王国：世界》里最核心常用的性格，这样可以极大提升用户不打字、直接点选的体验。
2. 检索逻辑是否适用于其他 autocomplete？
   - **决策**: 本次优化针对包含这 7 大性格名字的选项起效。这 7 个词极具独特性（固执、聪明、开朗、胆小、平和、沉默、踏实），且只出现在性格选项中，即使在宠物名中出现，也会同样被正确置顶，符合用户预期。

## Decisions Made
- [决策]: 无论 query 是否为空，都对 matching/options 数组中的这 7 大性格赋予最高排序优先级。

## Errors Encountered
- 无

## Status
**Currently in Phase 5** - 交付完成

