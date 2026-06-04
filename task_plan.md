# Task Plan: 换蛋卡片添加精灵蛋组信息

## Goal
在换蛋中心生成的换蛋卡片中显示对应精灵的蛋组信息，保证视觉上优雅且在长图导出时保持美观。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [x] memory 知识存储完成

## Phases
- [x] Phase 1: 规划与准备
- [x] Phase 2: 信息调研
- [x] Phase 3: 核心执行
- [x] Phase 4: 测试验证
- [x] Phase 5: 最终交付

## Key Questions
1. 蛋组信息是从精灵详情（details.groups / details.eggGroups）中直接获取，还是需要额外处理？
2. 蛋组信息在卡片上的视觉位置如何摆放（例如：放在系别图标旁，还是放在备注上面，或者做成精致的 Badge）？

## Decisions Made
- [决策]: 蛋组信息可以直接调用已存在的 `getPetDetails(trade.sprite)` 获取其 `groups` 属性（字符串数组类型）。
- [决策]: 蛋组在卡片上作为“属性：性格/牌子” Flex 容器的子项进行平铺展示，复用主表格中的 `getEggGroupStyle` 函数渲染 Badge，这样可以自然换行，防止高度撑破，且视觉上风格一致。

## Errors Encountered
- 无。

## Status
**Currently in Phase 5** - 任务全部顺利完成。换蛋卡片已成功集成精灵蛋组 Badge，并针对长性格名完成了防抖动换行排版，构建测试与浏览器视觉验证全部通过。
