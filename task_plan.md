# Task Plan: 洛克王国助手 roco_helper 版本兼容与动态拉伸等计划

## Goal
支持对洛克王国助手文件名变动（如更新至 `roco_helper-v3.2.4.exe` 等）的动态兼容，在保持静默拉起、运行检测、进程清理功能完备的同时，彻底去除对特定版本文件名的硬编码。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [x] memory 知识存储完成

## Phases
- [x] Phase 1: 规划与准备 (更新 [notes.md](file:///d:/desk/洛克王国孵蛋表-副本/notes.md), [task_plan.md](file:///d:/desk/洛克王国孵蛋表-副本/task_plan.md) 与制定新版本的 [implementation_plan.md](file:///C:/Users/Administrator/.gemini/antigravity-ide/brain/03a5621e-13a5-4df4-8a53-7630d2379f06/implementation_plan.md))
- [x] Phase 2: 修改 [main.cjs](file:///d:/desk/洛克王国孵蛋表-副本/electron/main.cjs) 以支持 `roco_helper-v*.exe` 模糊匹配与动态进程管理
- [x] Phase 3: 测试验证 (运行不同版本号的模拟文件，验证拉起和 kill 行为)
- [x] Phase 4: 最终交付与项目知识库更新

## Key Questions
- 无

## Decisions Made
- [决策]: 声明一个全局变量 `detectedHelperFileName` 并在 `startRocoHelper()` 中动态赋值，确保关闭退出时也能准确地 kill 对应的进程。
- [决策]: WScript.Shell 激活标题改为宽泛前缀 `'洛克助手'`，保证任意版本助手的弹框均能被正确激活。

## Errors Encountered
- 无

## Status
**Currently in Phase 4** - 最终交付。所有的功能开发与版本兼容模糊匹配已全部通过模拟单元测试和 Vite 生产构建。
