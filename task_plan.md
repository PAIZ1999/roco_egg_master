# Task Plan: 洛克王国孵蛋表手机端界面适配

## Goal
实现洛克王国孵蛋数据管理系统的移动端（320px - 480px 等绝大多数手机屏幕）完美适配，优化布局结构、交互响应与拖拽手势，并确保不影响原 PC 端体验和 1200px 离屏长图的高保真导出。

## MCP Status
- [x] memory 检索完成
- [x] sequential-thinking 分析完成
- [ ] memory 知识存储完成

## Phases
- [x] Phase 1: 规划与准备
  - [x] 探查项目代码和结构
  - [x] 创建 `task_plan.md` 和 `notes.md`
- [x] Phase 2: 信息调研与技术方案
  - [x] 调研现有界面在移动端的核心痛点（Banner、卡片、表单、下拉 Portal、Dnd-kit 拖拽）
  - [x] 设计不破坏 1200px 导出长图的 CSS 响应式隔离方案
- [/] Phase 3: 核心执行
  - [x] 引入 `TouchSensor` 并配置 Dnd-kit 支持触屏拖拽
  - [x] 修改 `src/App.tsx` 中的头部 Banner、统计卡片以及筛选头部在移动端的响应式折叠
  - [x] 优化 `src/components/SortableCard.tsx` 在小屏幕下的列宽与上下堆叠自适应
  - [/] 优化换蛋需求中心（包括发布表单和看板卡片）的移动端折行与对齐
  - [/] 优化 Portal 挂载下拉菜单（Autocomplete）的移动端定位与软键盘自适应
  - [/] 优化长图预览与操作模态框（Modal）在手机屏幕的垂直对齐与居中
- [ ] Phase 4: 测试验证
  - [ ] 本地启动测试环境
  - [ ] 使用 Playwright/Chrome-devtools 模拟移动端常见视口（375px/414px）检查排版
  - [ ] 测试拖拽手势与手势滚屏在移动端的兼容性
  - [ ] 验证 1200px 宽度长图导出的一致性与高保真度
- [ ] Phase 5: 最终交付
  - [ ] 整理项目知识库
  - [ ] 执行 Git 规范提交

## Key Questions
1. Dnd-kit 启用 `TouchSensor` 后，如何避免移动端用户滑动页面查看内容时，手指碰到精灵卡片误触发拖拽，从而无法流畅滚动屏幕？
   → 已解决：`delay: 250, tolerance: 5` 配置，普通滑屏不会触发拖拽
2. 在移动端浏览器中，键盘弹出导致视口缩小时，Portal 下拉菜单的坐标是否会错位？
   → 处理中：升级 updateCoords 算法，结合 visualViewport 实现智能向上/向下弹出

## Decisions Made
- **Dnd-kit 触屏拖拽**: 引入 `TouchSensor`，配置 `delay: 250, tolerance: 5`，长按 250ms 才激活拖拽，普通滑屏自动触发原生页面滚动，完美解决冲突。
- **长图物理隔离**: 利用 Tailwind 的 `sm:` 断点条件。长图导出时离屏容器强制设为 1200px，自动应用 PC 端样式，保证长图质量。
- **筛选栏折叠**: 引入 `showMobileFilters` State，移动端默认只显示搜索框和筛选按钮，点击展开全部筛选器。

## Errors Encountered
- *暂无，执行中记录*

## Status
**Currently in Phase 3** - 正在执行：EggTrade 交易卡片移动端自适应重排 → Autocomplete Portal 向上/向下智能弹出 → 弹窗 Modal 小屏紧凑排版。
