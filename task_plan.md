# Task Plan: 解决长图导出排版微调与格式切换问题

## Goal
微调和优化长图导出时的排版细节：
1. 解决换蛋卡片中右侧「换蛋类型」文字上移的问题，确保垂直完美居中；
2. 解决当前窝点现蛋数量图标上移问题，去掉其跳动（bounce）动画；
3. 将导出的长图图片格式从 PNG 变更为 JPEG (.jpg)，并更新下载文件名。

## MCP Status
- [ ] memory 检索完成
- [ ] context7/deepwiki 查询完成
- [ ] sequential-thinking 分析完成
- [ ] memory 知识存储完成

## Phases
- [ ] Phase 1: 规划与准备 (更新 task_plan.md 与 notes.md)
- [ ] Phase 2: 代码修改 (修改 SortableCard.tsx 去掉动画并对齐，修改 App.tsx 优化 Badge 并切换导出格式)
- [ ] Phase 3: 运行并测试验证 (启动本地开发环境，通过网页与导出验证效果)
- [ ] Phase 4: 最终交付与项目知识库/Git 提交更新

## Key Questions
1. 为什么 html2canvas 渲染文字/图标会上移？
   - **解答**：主要是因为在 html2canvas 渲染过程中，CSS keyframe 动画（如 `animate-bounce`）会改变元素的真实 transform 位移导致截图瞬间位置偏差；同时对于没有固定高度和显式 `leading-none` / flex 居中的内联/块级元素，html2canvas 对 padding 与 line-height 的计算可能会有几像素的基线偏移。
2. PNG 切换为 JPG 有什么需要注意的？
   - **解答**：JPEG 不支持透明度，但由于我们导出的 offscreen 容器已经设置了实色背景 `#f8fafc`，因此切换为 JPEG 不会产生黑色底色。转换方法是 `canvas.toDataURL("image/jpeg", 0.9)`，下载文件名后缀应同步改为 `.jpg`。

## Decisions Made
- [决策]: 对「换蛋类型」文字，使用 `flex items-center justify-center h-7 px-3 leading-none` 进行布局，强行锁定高度并配合 `leading-none` 实现完全的垂直居中。
- [决策]: 移除蛋窝卡片中「当前窝点现蛋数量」图标的 `animate-bounce` 动画类，并使用 `shrink-0` 保证其尺寸固定，防止其在导出时上移。
- [决策]: 修改 `App.tsx` 中的长图导出 quality 和 format 为 `image/jpeg`，保留 90% 质量，将文件名也改为 `.jpg` 后缀。

## Errors Encountered
- 无

## Status
**Currently in Phase 1** - 完成计划制定，准备进入 Phase 2 代码修改。
