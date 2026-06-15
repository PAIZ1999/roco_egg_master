# Task Plan: 洛克王国孵蛋表全站暗色模式细节与文字对比度优化

## Goal
实现高品质的暗色模式细节优化：
1. 默认设置暗色模式（即使在没有 localStorage 或 prefers-color-scheme 的情况下也默认开启暗色模式）。
2. 全局优化暗色模式底色与白块缺陷（解决精灵的蛋组标签、三围图标底盘、系别角标等在暗色模式下显示为亮色白块的问题）。
3. 统一各标签页（Tab）整体的风格、底板背景与文字颜色，拉开高品质的 Elevation 黑灰层次。
4. 长图导出功能完全支持暗色模式（当用户处于暗色模式时，导出的长图也为暗色；在亮色模式下则为亮色）。
5. 构建项目并成功推送到远程 GitHub 仓库。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [x] memory 知识存储完成

## Phases
- [x] Phase 1: 基础状态与切换按钮集成 (在 App.tsx 顶部注入 theme 状态、初始化检测、useEffect 同步和右上角切换按钮)
- [x] Phase 2: 主体页面与过滤模态框适配 (调整 App.tsx 的背景色、主背景、统计卡片、搜索框、下拉框、账号菜单与模态框的暗色样式)
- [x] Phase 3: 精灵卡片与列表适配 (适配 SortableCard.tsx, EggCard.tsx, ParentCard.tsx 和 SortableRow.tsx 的暗色背景、输入框、下拉框与边框)
- [x] Phase 4: Autocomplete 组件适配 (调整 Autocomplete.tsx 下拉浮窗、拼音提示在暗色下的文字和悬浮高亮色)
- [x] Phase 5: 网页端部署静态资源拷贝与生产打包验证 (配置拷贝脚本确保 images 资源在部署时不裂开)
- [/] Phase 6: 全站暗色细节统一与长图导出暗色支持 (将默认主题改为 dark，修复三围图标、系别角标、换蛋表单头像的白色白块，将半透明 bg-slate-950/20 实色化为 bg-slate-950/bg-slate-900，统一 Tab 大背景风格，修改 html2canvas 长图导出逻辑使其支持暗色模式，最终打包并 push 到远程仓库)

## Key Questions
1. 在暗色模式下，三围图标的白圈怎么优化？
   - 决策：在 `SortableCard.tsx`、`EggCard.tsx` 和 `ParentCard.tsx` 中将三围选择圆圈样式在暗色下由原亮色底（如 `bg-rose-200`）映射为带透明度且更柔和的深底高对比度字（如 `dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60`），消除晃眼的大白块。
2. 导出图片如何支持暗色？
   - 决策：移除克隆节点中剥离 `dark` 类的逻辑，并根据当前 theme 动态指定 html2canvas 的 `backgroundColor`，暗色下设为 `#020617`（即 `slate-950` 实色底），亮色下设为 `#f8fafc`。

## Decisions Made
- [决策]: 使用 `theme === 'dark' ? '#020617' : '#f8fafc'` 作为导出长图的 html2canvas 背景色，并保留克隆 DOM 的 `.dark` 类实现暗色长图导出。
- [决策]: 将 App.tsx 内的初始化 theme 默认值更改为 'dark'。
- [决策]: 优化 Tab 页面大背景及操作底栏为完全不透明的 `dark:bg-slate-950`，保证风格统一。
- [决策]: 修复自建需求中心表单中的 label（精灵名称）在暗色下缺失字色、头像和系别容器未适配 `dark:` 而出现的亮白块问题。

## Errors Encountered
- 无

## Status
**Currently in Phase 6** - 正在编写并审核 Implementation Plan，等待用户批准后进行全站细节适配、打包与 Git 推送。
