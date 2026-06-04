# Task Plan: 洛克王国孵蛋表上传 GitHub 与项目管理指引

## Goal
完成本地 Git 仓库初始化，将项目代码上传至 GitHub 远程仓库，并配置 GitHub Issues、Projects 以及 Milestones 等工具进行高效的项目生命周期与任务进度管理。

## MCP Status
- [x] memory 检索完成
- [x] sequential-thinking 分析完成
- [x] memory 知识存储完成

## Phases
- [x] Phase 1: 规划与准备
  - [x] 评估 MCP 状态与本地环境
  - [x] 检查本地 `.gitignore` 文件，发现需要补全 `dist-electron/` 过滤
- [x] Phase 2: 本地 Git 初始化与提交
  - [x] 更新本地 `.gitignore` 排除打包生成的大文件目录
  - [x] 本地执行 `git init` 初始化仓库
  - [x] 暂存文件 `git add .`
  - [x] 本地提交 `git commit -m "chore: 初始化 Git 仓库并更新 .gitignore"`
- [x] Phase 3: 创建并关联 GitHub 仓库
  - [x] 编写详细上传与项目管理文档供用户阅读
  - [x] 提供如何使用 GitHub CLI 或网页端新建 Repository 的指导
  - [x] 建立远程分支关联并推送 `git push -u origin main`
- [x] Phase 4: GitHub 项目管理实战指导
  - [x] 提供 GitHub Issues、GitHub Projects (看板) 的配置方案与实战教程
  - [x] 解释 Git Commit 自动关联 Issue 关闭的规范 (Smart Commits)
- [x] Phase 5: 最终交付与归档
  - [x] 本地保存 `github_management_guide.md`
  - [x] 更新项目知识库 `.claude/PROJECT_KNOWLEDGE.md`

## Key Questions
1. 本地是否有大文件（如 exe 或是宣传视频.mp4）？
   - 答：根目录下有 `宣传视频.mp4` (15MB) 以及 `dist/` 和 `dist-electron/` 目录。需要在 `.gitignore` 里将打包输出目录排除。由于视频较大，若无需上传可加到 `.gitignore`，或作为普通媒体资源提交。

## Decisions Made
- [更新 .gitignore]：需要把 `dist-electron/` 排除在 Git 追踪之外，避免提交数百MB的桌面打包安装包。

## Errors Encountered
- 本地配置了全局代理 `http.proxy = http://127.0.0.1:10808`，但由于代理软件未开启或不稳定，导致 `git push` 在连接 GitHub 时挂起超时。
  - **解决方案**：在本地项目下执行 `git config --local http.proxy ""` 和 `git config --local https.proxy ""` 临时清空当前仓库的代理，以直连方式进行上传。

## Status
**Completed** - 项目已成功上传至 GitHub 仓库且建立了 `main` 追踪关系，文档与配置已就绪。
