# Task Plan: 修复长图导出问题与下拉框遮挡

## Goal
彻底解决洛克王国孵蛋表长图导出时的文字折行、对齐不一致、系别文字缺失问题，同时解决精灵名称和性格下拉框被表格行和滚动容器遮挡的问题。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [ ] memory 知识存储完成

## Phases
- [x] Phase 1: 升级 Autocomplete 组件，支持 React Portal 以彻底消除遮挡
- [x] Phase 2: 调整主表格与长图导出时的列宽比例，解决列挤压引起的换行
- [x] Phase 3: 优化长图导出中的 Input 替换逻辑，支持自适应对齐方式
- [x] Phase 4: 修改系别 Badge 为不显示文字，仅显示属性图标（含 Hover 提示）
- [x] Phase 5: 测试验证与最终交付

## Key Questions
1. 属性 Badge 的文字颜色和在导出图上的渲染效果是否需要进行特定调整？
   - 答：不需要，直接保持与 Live 页面一致的 Tailwind 色彩和 `whitespace-nowrap` 即可。

## Decisions Made
- [决策]: 采用 React Portal + `absolute` 定位动态更新坐标的方式渲染 Autocomplete 下拉菜单。
  - [理由]: `fixed` 或普通的 `absolute` 依然受限于外层的 `overflow-x-auto` 容器裁剪；只有将下拉菜单挂载在 `document.body` 根节点上并手动计算绝对定位，才能完美避免被遮挡。

## Errors Encountered
- 无

## Status
**Currently in Phase 5** - 所有优化和测试工作均已顺利完成，超清长图导出排版、列宽、对齐及无遮挡下拉功能均已通过验证，准备交付。
