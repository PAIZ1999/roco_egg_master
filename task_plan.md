# Task Plan: 洛克王国孵蛋表多账号切换功能

## Goal
增加多账号切换功能，每个账号记录 UID 和昵称。账号间数据（蛋窝、换蛋需求、父母本）完全隔离。支持单个账号导入导出，以及多账号全量导入导出，并向下兼容老版单账号历史数据。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [ ] memory 知识存储完成

## Phases
- [ ] Phase 1: 规划与准备
  - [x] 查阅现有的数据存盘与导入导出逻辑
  - [x] 初始化 `task_plan.md` 和 `notes.md`
  - [x] 编写并更新 `implementation_plan.md` 供用户审查
- [ ] Phase 2: 方案确认与用户授权
  - [x] 等待用户确认并批准实施方案 (已将切换位置调整更新)
- [x] Phase 3: 核心逻辑修改与数据迁移
  - [x] 在 `src/types.ts` 定义 `Account` 和 `AccountData` 类型
  - [x] 在 `src/App.tsx` 新增多账号状态（`accounts`, `activeAccountId`, `accountDataMap`）
  - [x] 修改 `loadLocalData` 支持多账号解析，并对老旧单账号数据做无缝迁移
  - [x] 修改自动保存的 `useEffect` 副作用，将当前激活数据合并进全局 `accountDataMap` 并持久化
- [x] Phase 4: 多账号管理 UI 交互实现
  - [x] 精细化重构账号快速切换下拉菜单 UI，使其视觉效果达到极具品质感的磨砂玻璃和精致胶囊卡片状态
  - [x] 新建“账号管理”Modal，支持查看账号列表、新增账号、编辑昵称/UID、删除账号（需二次确认且保留至少一个账号）
  - [x] 实现账号切换时的平滑过渡（切换后更新页面 state）
- [x] Phase 5: 导入导出与兼容性开发
  - [x] 修改“导出数据”弹窗，提供“仅导出当前账号”与“全量导出所有账号”两个选项
  - [x] 修改“导入数据”弹窗，智能识别 JSON 结构（全量多账号备份、单账号备份、老旧格式）
  - [x] 为单账号/老旧备份提供“覆盖当前账号数据”或“作为新账号导入”的交互选项
- [x] Phase 6: 回归测试与构建打包
  - [x] 在本地执行开发服务器验证多账号读写、切换与导入导出功能
  - [x] 运行 `npm run electron:build` 确保桌面 EXE 端打包无误
  - [x] 规范 Git 提交并更新项目知识库

## Key Questions
1. 如何保证账号的唯一性且允许修改 UID？
   - 决定：引入一个随机生成的 `id` 作为账号的主键，将 `uid` 和 `nickname` 视为可编辑的属性。这样即使修改 `uid`，底层数据关联也不会中断。
2. 切换账号时的自动保存是否会产生数据污染？
   - 决定：切换账号时，需首先将当前活动的 `pets`, `trades`, `parents` 存入 `accountDataMap[activeAccountId]` 对应的旧账号中，然后再加载新账号的对应数据，最后将 `activeAccountId` 指向新账号。这一连串状态变化会触发自动保存副作用，写入包含最新各账号数据的 JSON，避免数据相互覆盖或污染。

## Decisions Made
- **多账号数据隔离**：当前活动的 `pets`, `trades`, `parents` 保持为独立 State，仅在保存 and 切换时与 `accountDataMap` 进行合并/提取，以最大化复用现有组件逻辑，降低修改风险。
- **历史数据兼容性**：老数据加载时自动包装入 `id: "default", uid: "default", nickname: "默认账号"`，用户原有的蛋窝和换蛋需求等所有数据绝不丢失。
- **账号切换菜单重构**：重新设计下拉项的外观，摒弃原有的硬线条分割和单调配色，采用磨砂玻璃质感容器、卡片式悬浮项、高亮勾选标示、微交互悬浮特效以及精致的单色小胶囊药丸（UID 标签），凸显高级数字员工的审美水准。

## Errors Encountered
- 暂无

## Status
**Completed** - 多账号隔离切换、单/双备份导入导出功能及磨砂玻璃 UI 已全部开发验证完成，且 Electron 桌面 EXE 打包顺利成功。
