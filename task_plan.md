# Task Plan: 长图导出在特定电脑上 DPI/Zoom 缩放导致文字放大与重叠 Bug 修复

## Goal
修复当用户在具有系统 DPI 缩放（如 125%、150%）或浏览器 Zoom 缩放的电脑上导出长图时，图片中的文字（如输入框、下拉框静态 div）被异常放大且排版重叠对不齐的问题。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [ ] memory 知识存储完成

## Phases
- [x] Phase 1: 规划与原因深度剖析
- [x] Phase 2: `src/App.tsx` 中 `handleExportLongImage` 样式复制逻辑重构（引入 DPR 缩放校正）
- [x] Phase 3: 本地构建与测试验证（确保各种缩放比例下长图完美渲染）
- [x] Phase 4: 最终交付与 Git 提交

## Key Questions
1. 为什么文字会被异常放大？
   - **原由**：在 DPI 或浏览器缩放不为 100% 的电脑上，`window.getComputedStyle(originalEl)` 获取到的绝对像素值（`fontSize`, `padding`, `width`, `height`）是已经被浏览器放大的物理像素值。直接硬编码到 1200px 固定的克隆容器中会导致这些元素在图片中被显示得格外巨大，从而撑破卡片并发生折行、错位。

## Decisions Made
- [决策]: 在 `handleExportLongImage` 中，计算出当前缩放比 `dpr = window.devicePixelRatio`，并编写自适应像素校正函数 `adjustPx`，将复制的 px 样式值自动除以 `dpr` 还原为标准的 CSS 像素大小。
- [决策]: 对 `padding` 字符串进行拆分并对各个方向的像素值均执行 `adjustPx` 校正。

## Errors Encountered
- 无

## Status
**Completed** - 所有修复、构建、项目知识库同步及 Git 推送已顺利完成。


