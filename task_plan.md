# Task Plan: 暗色模式主题切换制作

## Goal
实现高品质的暗色模式主题切换功能：支持在右上角进行亮/暗色一键切换并自动保存到 localStorage；同时全量适配 App.tsx 和 5 个核心子组件在暗色环境下的高颜值背景、文本、边框与输入框样式；确保长图导出时自动回退为亮色主题，保证导出的图片干净美观。

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
- [x] Phase 5: 长图导出兼容与生产打包验证 (在 App.tsx 的导出 clone 逻辑中剔除 dark 样式，确保长图默认亮色，执行 tsc 检查和打包)

## Key Questions
1. 在暗色模式下，父母本仓储卡片和蛋窝卡片原本包含的彩条（例如体型牌、状态标签）是否需要调整？
   - 决策：体型牌和状态标签本来具有高饱和度底色（如 `bg-rose-50 text-rose-700`），在暗色模式下可以映射为稍微深一点的背景或者保留它们的高对比度样式（可使用 `dark:bg-rose-950/40 dark:text-rose-300` 样式使其在暗色模式下不至于太晃眼，同时保留原来的视觉语义）。
2. 长图导出时是否自动回退为亮色模式？
   - 决策：是的，为了保证导出的图片具有极高的可读性，并且在实体打印时更加环保美观，在克隆 DOM 导出长图时将克隆树的 class 去除 `.dark`，保证导出的图片依然为亮色主题。

## Decisions Made
- [决策]: 使用 `document.documentElement.classList` 动态增删 `.dark`，通过 Tailwind 4 的原生 `dark:` 属性来实现暗色样式。
- [决策]: 引入 `Sun` 和 `Moon` 图标进行切换，并为亮色和暗色状态加上缩放、透明度渐变等微交互动画。
- [决策]: 在 `generateLongImage` 方法中，在 clone 被 append 到 offscreen wrapper 之前，调用 `clone.classList.remove('dark')`。由于克隆树原本继承了根元素的 class，这样可以强制将克隆体变回亮色渲染。

## Errors Encountered
- 在 multi_replace_file_content 匹配 showAccountModal 时因定位内容不唯一而出现错乱。解决方法是：使用 git checkout 恢复文件，并采用高独特性（含有特定组件变量名）的小范围定位 chunk 进行精准替换。

## Status
**Completed** - 所有的暗色模式切换、各大模态框和分页器的 dark 变体适配工作均已开发完毕，且已通过 Vite 生产打包编译检验。项目处于待提交交付状态。
