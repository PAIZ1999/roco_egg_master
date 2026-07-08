# Task Plan: 优化表格视觉效果 (参考图二)

## Goal
重构并美化精灵蛋窝主表格的视觉效果。消除繁杂的纵向网格线、精简性格全称为简称、隐藏多余的性别符号、将状态和牌子 select 框胶囊 Badge 化，并为现蛋数量配置智能高亮容器，使其整体设计达到媲美图二的高级美感。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [x] memory 知识存储完成

## Phases
- [x] Phase 1: 规划与准备
- [x] Phase 2: 信息调研与代码设计 (对比图一与图二的视觉差异，梳理修改样式)
- [x] Phase 3: 核心执行 (修改 `src/App.tsx` 中的 Table 结构与 CSS 类)
- [x] Phase 4: 测试与验证 (验证亮暗色模式、页面对齐及长图导出效果)
- [x] Phase 5: 最终交付与总结

## Key Questions
1. 在表格模式下，性格和三维如果不同时，如何以最雅致的方式显示？
   - 答：放弃大面积的高饱和度红蓝粉，转而使用细小的灰色 ♂ 和 ♀ 符号引导简称，文字颜色统一使用中性黑/深灰。
2. 牌子和状态在表格里是 select 选择框，如何兼顾“可修改的下拉交互”和“Badged 胶囊化”？
   - 答：保留原生 select 以维持快捷修改能力，但移除其边框、背景及默认外观，在 class 中添加 `border-0 rounded-full py-1 shadow-3xs` 配合已有的背景样式，使其呈现静态胶囊 Badge 效果，在 hover 和 focus 时应用精美的环形高亮。

## Decisions Made
- [决策]: 蛋窝状态和牌子依然使用 select 元素，但通过 CSS `border-0 rounded-full text-center cursor-pointer` 样式包装。
  - [理由]: 保持了用户直接在表格内点击即修改的流畅交互，同时在视觉上 100% 模拟了现代圆角 Badge 标签，完美兼容普通状态和长图导出。

## Errors Encountered
- 无

## Status
**Currently in Phase 5** - 交付完成。
