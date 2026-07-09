# Task Plan: 迁移精灵/蛋查询与远行商人功能

## Goal
从 `rocoqqbot` 迁移精灵数据查询、蛋组查询、孵蛋预测（马氏高斯似然算法）以及远行商人功能（CORS 请求/正则解析+悬浮窗展示）至主项目 `洛克王国孵蛋表-副本` 中，并将查询功能整合在新增的“数据查询”Tab，将远行商人做成可开启/折叠的悬浮窗。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [x] memory 知识存储完成

## Phases
- [x] Phase 1: 规划与准备 (创建 task_plan.md, notes.md, 安装 pinyin-pro)
- [x] Phase 2: 编写 queryHelper.ts 核心计算模块 (处理多元高斯对数马氏距离等)
- [x] Phase 3: 编写 merchantHelper.ts 及相关 Electron IPC 适配 (抓取和解析远行商人 HTML)
- [x] Phase 4: 在 App.tsx 新增“数据查询”Tab 界面 (包含精灵数据查询、蛋组查询、孵蛋预测)
- [x] Phase 5: 设计并实现“远行商人”可折叠/隐藏的悬浮窗组件
- [x] Phase 6: 测试与验证 (TypeScript 编译与 Vite 生产构建全部通过)
- [x] Phase 7: 最终交付与 PROJECT_KNOWLEDGE.md 更新

## Key Questions
1. 行商图片下载：行商的原图是 remote URL，如果我们在前端悬浮窗显示，可以直接通过 `<img>` 标签引用 remote URL `sourceImage` 吗？
   - 回答：是的，在渲染进程我们不需要物理下载图片到本地，因为这只是个前端悬浮窗，直接使用网页里的图片链接（如 `https://www.onebiji.com/....`）展示即可，不需要像 QQ 机器人那样本地保存再发送。

## Decisions Made
- [决策]: 新增 `"dataQuery"` 标签页，并设计精致的 UI 将精灵查询、蛋组查询和孵蛋预测组织为三个独立的子板块或统一搜索入口。
- [决策]: 远行商人悬浮窗作为一个浮动的 Widget，支持点击展开/折叠，自动每隔 3 分钟通过 `window.electronAPI.httpGet` 刷新数据（防抖与组件卸载时清理定时器）。
- [决策]: 在 `package.json` 中安装 `pinyin-pro`，以便在前端完美匹配拼音模糊查询。

## Errors Encountered
- TS2339: Property 'src' does not exist on type 'HTMLElement' (在 `DataQueryTab.tsx` 中强转 `e.target` 为 `HTMLImageElement` 以修复此类型编译错误)。

## Status
**Currently in Phase 7** - 最终交付。修改均已测试通过并完成 Vite 生产构建验证。
