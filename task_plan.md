# Task Plan: 解决浏览器/系统缩放（Ctrl + 滚轮）导出长图文字错乱问题

## Goal
彻底解决当浏览器存在缩放（如按住 Ctrl + 滚轮放大或缩小，或者系统高 DPI 缩放）时，导出的长图文字错乱、换行、对不齐等兼容性问题，确保在任何缩放比例下均能稳定导出清晰、完美的表格长图。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [x] memory 知识存储完成

## Phases
- [x] Phase 1: 问题复现与机制分析（利用 Playwright 模拟浏览器不同缩放比例复现 bug）
- [x] Phase 2: 技术方案设计与论证（使用 html2canvas 替换 modern-screenshot 方案设计）
- [x] Phase 3: 方案代码实现与调整
- [x] Phase 4: 多尺度缩放测试与 UI 效果验证
- [x] Phase 5: 最终交付与项目知识库更新

## Key Questions
1. 浏览器缩放（Ctrl + 滚轮）对 `modern-screenshot` 渲染有何影响？
   - **解答**：浏览器缩放改变了 `window.devicePixelRatio` 并且缩放了文字渲染 of 物理像素。在 Chromium 下，SVG `<foreignObject>` 的文字渲染字号会受到缩放因子的物理放大，但容器的 nominal CSS 像素大小（1200px）保持不变，导致字体相对容器变大、折行并破坏排版。

## Decisions Made
- [决策]: 必须确保在真实的浏览器缩放场景下（通过 Playwright / 浏览器 subagent 进行不同 zoomFactor 的测试）能复现并成功验证修复方案。
- [决策]: 弃用 SVG-based 的 `modern-screenshot`，改用 2D Canvas 渲染的 `html2canvas-pro` 彻底解决 Chrome 在页面缩放下的 SVG text-rendering 缩放 bug。
- [决策]: 使用 `html2canvas-pro` 替代原生 `html2canvas`，解决 Tailwind v4 的 `oklch()` 颜色解析崩溃问题。

## Errors Encountered
- [错误]: 原生 `html2canvas` 遇到 Tailwind v4 的 `oklch()` 颜色值时抛出 `Attempting to parse an unsupported color function` 异常崩溃。
  - **解决方案**：引入社区维护的 `html2canvas-pro` 作为替代，其原生支持现代色彩空间解析。

## Status
**Currently in Phase 5** - 修复方案通过全部缩放层级（100%、150%）的测试验证，完成全部工作并交付。
