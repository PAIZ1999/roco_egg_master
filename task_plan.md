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
- [x] Phase 5: 3V 筛选与同性格解耦，支持交叉过滤及“仅非同性格 3V”过滤
- [x] Phase 6: 表格编辑顺序按图一排序，缩窄性格与三维列宽，扩宽精灵列；将表格每页数量由 50 调整为 25；导出长图时按图二重新排列列顺序并移除操作列
- [x] Phase 7: 在父母本统计表格中增加智能 Autocomplete 精灵蛋组查询与金色聚光灯高亮列联动，并提供“只看种公”的统计展示模式
- [x] Phase 8: 精灵查询输入框支持模糊检索，且支持键盘方向键选择和回车（Enter）一键选定
- [x] Phase 9: 表格现蛋输入框隐去原生自带的灰色 spin buttons；实现表格现蛋数量修改与“精灵蛋管理中心”双向增删同步；有现蛋状态初始现蛋数直接归零
- [x] Phase 10: 构建验证与最终交付

## Key Questions
- 无

## Decisions Made
- [决策]: 智能繁育配对中心的一键导入只联动每个 eggSprite 分组当前由 Chevron 控件所选的 safeIdx 的配对，这样在交互上直观，且默认不会导入隐藏起来的父本配对。
- [决策]: 浅色模式表格斑马线与 hover 色值直接用 Tailwind 十六进制色值 `bg-[#F2F6F8]`，`bg-white`，`hover:bg-[#DFE9EF]`。
- [决策]: 导出长图只导出主体：通过直接在 cloned DOM 节点上 `.remove()` 移去不需要的 Banner、Tab 导航栏、实时统计面板、筛选和搜索条。
- [决策]: 通过在 cloned table nodes 上物理操作 `.appendChild` 来重新排序 th/td，使得导出长图不需要维护多套 React DOM，实现图二的列排列展示，完美兼容 layout 样式。
- [决策]: 使用 `setPets` 和 `setEggs` 双重联动机制来实现表格现蛋数修改与蛋管理中心的同步。增加现蛋数时往 `eggs` 头部追加绑定了 `fromNestId` 的新蛋；减少现蛋数时，自动按创建顺序过滤掉指定差额个原蛋。

## Errors Encountered
- 无

## Status
**Currently in Phase 10** - 最终交付。修改均已通过测试并提交。
