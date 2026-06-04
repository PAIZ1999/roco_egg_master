# Notes: GitHub 上传与项目管理研究笔记

## 1. Git 初始化与提交流程
- 本地项目当前未建立 Git 仓库。
- 需要在项目根目录下执行 `git init` 进行初始化。
- 经过检查，原有的 `.gitignore` 缺少对 `dist-electron/` 目录的过滤，该目录下包含打包好的桌面免安装可执行程序（大文件）。现已手动修改 `.gitignore` 并追加了 `dist-electron/` 这一行。
- 项目根目录下存在一个 `宣传视频.mp4`，文件大小为 15MB 左右，可以提交至 Git，但如果不希望上传，可引导用户加入 `.gitignore`。

## 2. GitHub 仓库推送步骤
1. 新建仓库时，不要勾选 "Add a README.md" 或 ".gitignore" 以免产生初始提交冲突。
2. 关联远程并推送到 `main` 分支的命令：
   ```bash
   git remote add origin git@github.com:username/repository.git
   # 或者 HTTPS 地址:
   # git remote add origin https://github.com/username/repository.git
   git branch -M main
   git push -u origin main
   ```

## 3. GitHub 项目管理核心概念
- **GitHub Issues**: 跟踪 Bug、功能请求、技术债。
  - 标签管理 (Labels): `bug`, `enhancement`, `documentation`, `chore`。
  - 分配人 (Assignees): 分配给具体的开发者。
- **GitHub Projects (看板)**:
  - 采用敏捷开发的看板模式，自定义列：`Backlog` (待办池), `Todo` (本周计划), `In Progress` (开发中), `In Review` (测试与审查), `Done` (已完成)。
  - 可以设置自动化规则：当 Issue 被分配或标记时自动移动到对应列。
- **Milestones (里程碑)**:
  - 将多个 Issue 或 Pull Request 绑定至一个里程碑，用来管理具体的版本迭代周期（例如 `v1.0.0-Beta`）。
  - 可以查看当前里程碑的完成百分比。
- **Smart Commits (智能提交关联)**:
  - 在 commit message 中使用特定关键词直接关联或关闭 Issue：
    - 关联：`git commit -m "feat: 增加小婉与小粗统计信息 (#12)"` （其中 `#12` 为 Issue 编号）。
    - 关闭：`git commit -m "fix: 修复长图导出裁剪问题 (close #15)"` 或 `closes #15`、`fixes #15`。推送后 GitHub 会自动将对应的 Issue 状态更新为 Closed。

## 4. 解决网络与登录凭据挂起问题
- 当使用 HTTPS 链接在后台推送时，可能因为缺乏 Git 凭证管理器弹窗而导致进程挂起。
- 解决方案：使用 GitHub Personal Access Token (PAT) 经典版，赋予 `repo` 权限。
- 将 Token 嵌入 URL 中进行无交互推送：
  `git remote set-url origin https://<TOKEN>@github.com/PAIZ1999/roco_egg_master.git`
  `git push -u origin main`
- 该方法可绕过系统弹窗直接完成认证。
