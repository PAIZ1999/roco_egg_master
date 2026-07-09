# Task Plan: 优化智能配对与长图导出及表格浅色主题颜色

## Goal
优化繁育配对中心的勾选与导入体验（默认只导入当前显示的父本，增加全选/取消全选），只导出表格或卡片核心内容（不导头部和数据统计），并更新浅色模式下的表格行和 hover 颜色为用户指定色值。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [x] memory 知识存储完成

## Phases
- [x] Phase 1: 规划与准备
- [x] Phase 2: 修改浅色模式下的表格斑马线背景色与悬停 hover 颜色
- [x] Phase 3: 优化智能繁育配对中心的一键导入和选择逻辑（同一个母本只导入当前显示的父本配对），并添加“全选”与“取消全选”按钮
- [x] Phase 4: 改进长图导出逻辑（`handleExportLongImage`），只导出卡片或表格核心内容，移除主 Banner、导航栏、统计面板以及各 Tab 内的统计和筛选面板
- [/] Phase 5: 测试验证与最终交付

## Key Questions
- 无

## Decisions Made
- [决策]: 智能繁育配对中心的一键导入只联动每个 eggSprite 分组当前由 Chevron 控件所选 of safeIdx 的配对，这样在交互上直观，且默认不会导入隐藏起来的父本配对。
- [决策]: 浅色模式表格斑马线与 hover 色值直接用 Tailwind 十六进制色值 `bg-[#F2F6F8]`，`bg-white`，`hover:bg-[#DFE9EF]`。
- [决策]: 导出长图只导出主体：通过直接在 cloned DOM 节点上 `.remove()` 移去不需要的 Banner、Tab 导航栏、实时统计面板、筛选和搜索条。

## Errors Encountered
- 无

## Status
**Currently in Phase 5** - 已修改完所有核心逻辑代码，准备通过编译验证和运行，并做最终交付。
