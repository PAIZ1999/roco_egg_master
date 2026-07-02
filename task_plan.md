# Task Plan: 卡片数据复制粘贴与数据保存路径优化

## Goal
在主界面的蛋窝中心、父母本仓储和精灵蛋管理 Tab 下实现 Ctrl+C / Ctrl+V 卡片复制粘贴与智能映射功能，支持在无粘贴目标时自动新建卡片，并且将 Electron 数据文件的默认自动保存路径改为程序所在同级目录下。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [ ] memory 知识存储完成

## Phases
- [x] Phase 1: 方案设计与用户批准 (已通过用户审查并批准)
- [x] Phase 2: 修改 Electron 主进程 (main.cjs) 保存路径
- [x] Phase 3: 修改卡片组件 (SortableCard, ParentCard, EggCard) 接收选中和 Hover 属性
- [x] Phase 4: 修改 App.tsx 实现 Ctrl+C/V 监听器、卡片智能映射与自动新建逻辑
- [/] Phase 5: 验证与编译构建 (Vite 构建与 Electron 打包回归测试中)

## Key Questions
1. 跨类型复制时的智能字段转换映射是否满足体验？
   - 决策：在 `notes.md` 中设计了完备的跨类型转换（例如蛋窝复制后粘贴到父本或母本时，仅提取对应性别一方的属性；粘贴到精灵蛋时，自动剥离多余形态为最低进化形态，并正确匹配各属性字段）。
2. 如何规避输入框正常的文本 Ctrl+C/V 编辑被拦截？
   - 决策：在事件捕获阶段过滤当 `activeElement` 为文本编辑元素（`input`, `textarea`, `select` 等）时的按键响应，保障正常文字输入体验。

## Decisions Made
- [决策]: 使用内存变量 `copiedCardRef` 进行前端保底存储，同时写入 `navigator.clipboard` 系统剪贴板以提供跨窗口、跨启动的复制粘贴体验。
- [决策]: 给三类卡片外层 div 增加对应的类名（`nest-card`, `parent-card`, `egg-card`），通过 `closest` 精确判定点击空白处清除选中状态。

## Errors Encountered
- 无

## Status
**Currently in Phase 5** - 核心开发与代码注入已全部完毕。目前 Vite 前端项目成功编译为静态资源，正在后台执行 `electron-builder` 以编译最终的 EXE 可执行文件，稍后将通过 Playwright 自动化进行端到端逻辑覆盖及测试。
