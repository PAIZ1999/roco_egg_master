# Task Plan: 解决添加精灵时默认性格为空及“选择性格”占位符的交互优化

## Goal
优化添加精灵时的性格选择交互：
1. 添加精灵时，父/母性格默认初始化为空字符串 `""`；
2. 页面中性格未选择（为空字符串）时，渲染为 `"选择性格"` 占位符；
3. 用户直接点击该占位符即可弹出性格选择下拉菜单进行快速选择；
4. 保证 `cleanNature` 数据清洗机制对空性格与占位符进行特殊保留，不会被误处理为 `"错性格"`；
5. 构建网页版，并提交至 Git 仓库管理。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [x] memory 知识存储完成

## Phases
- [x] Phase 1: 规划与准备 (更新 task_plan.md 与 notes.md)
- [x] Phase 2: 代码修改 (修改 types.ts 允许空性格，修改 App.tsx 默认初值与 cleanNature 清洗逻辑，修改 SortableCard.tsx 与 SortableRow.tsx 中下拉组件的默认选择)
- [x] Phase 3: 运行并测试验证 (启动本地 Playwright 脚本自动对表格、卡片中的“选择性格”和下拉弹出进行全链路测试，测试通过)
- [x] Phase 4: 构建网页版 (运行 npm run build 编译 dist 包，并通过 copy-images.js 完成静态图片拷贝)
- [x] Phase 5: 最终交付与项目知识库/Git 提交更新 (更新 PROJECT_KNOWLEDGE.md，git add & git commit 提交，并 git push 到 Github 仓库)

## Key Questions
1. 空性格会不会被 `cleanNature` 误转为 `"错性格"`？
   - **解答**：会。原本的清洗逻辑在面对任何不在 30 种有效性格列表内的值时，都会作为“废弃/无效字符”强制兜底转化为 `"错性格"`。为了避免此问题，我们在 `cleanNature` 的入口处特意增加了白名单拦截——当检测到输入为 `""`、`undefined`、`null` 或 `"选择性格"` 时，立刻直接返回原值，保留用户的初始“未选”状态。

## Decisions Made
- [决策]: 在 `src/types.ts` 中扩展 `Nature` 类型，添加 `""`，以便在 React 状态管理中合法且类型安全地传递和初始化空值。
- [决策]: 在 `SortableCard.tsx` 和 `SortableRow.tsx` 中，针对下拉选择框 `<select>` 元素，若当前性格值为 `""`，则默认渲染第一项 `<option value="">选择性格</option>` 并使该项处于选中状态。由于 HTML5 交互特性，点击该 option 的瞬间即会呈现完整的 30 种加成性格供用户进行选择，达成了“一键弹出下拉菜单”的效果。

## Errors Encountered
- 无

## Status
**Currently in Phase 5** - 任务全部顺利完成。
