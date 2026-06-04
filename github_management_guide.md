# 洛克王国孵蛋数据管理系统 - GitHub 托管与项目管理指南

本指南旨在手把手教您如何将本地的代码上传至 GitHub 仓库，并利用 GitHub 提供的强大工具（Issues、Projects、Milestones 等）进行项目的精细化与看板式管理。

---

## 第一部分：将本地项目上传至 GitHub

我们已经在您的本地初始化了 Git 仓库，并完成了首次提交。接下来的步骤需要您在 GitHub 网页端与本地终端配合完成。

### 1. 检查本地 Git 状态
本地仓库已经过滤了打包生成的大文件目录（`dist-electron/`、`node_modules/` 等），并对项目源文件及抓取脚本进行了初始 Commit。您可以在终端输入以下命令验证：
```bash
git status
```
*（提示：应该显示 `nothing to commit, working tree clean`，说明本地代码已全部提交至本地仓库）*

### 2. 在 GitHub 上新建仓库
1. 打开并登录 [GitHub](https://github.com/)。
2. 点击右上角的 **`+`** 按钮，选择 **`New repository`**（新建仓库）。
3. 填写仓库信息：
   - **Repository name**（仓库名称）：例如 `roco-incubator-table`
   - **Description**（描述）：`洛克王国宠物孵蛋数据管理系统（桌面打包与本地数据存盘）`
   - **Public/Private**（公开/私有）：根据需要选择。如果您希望保护自己的数据和代码，建议选择 **Private**（私有）。
   - **重要：不要勾选** `Add a README file`、`Add .gitignore` 或 `Choose a license`。因为本地已经存在这些文件，勾选会导致冲突。
4. 点击最下方的 **`Create repository`** 按钮。

### 3. 将本地代码推送到 GitHub
创建完成后，GitHub 会显示如下页面。请复制 `…or push an existing repository from the command line` 下的命令。

在项目根目录（`D:\desk\洛克王国孵蛋表`）打开终端，依次运行以下命令：

```bash
# 1. 关联远程仓库地址 (请将 <your-username> 和 <your-repo> 替换为您实际的 GitHub 链接)
git remote add origin https://github.com/<your-username>/roco-incubator-table.git

# 2. 将本地默认分支重命名为 main
git branch -M main

# 3. 将代码推送到 GitHub (首次推送需加上 -u 参数建立追踪关系)
git push -u origin main
```
*（注意：如果您在推送时遇到权限或登录问题，可根据提示使用 GitHub Token 或是 SSH Key 登录）*

---

## 第二部分：如何使用 GitHub 进行项目管理

上传代码后，您的 GitHub 仓库就拥有了完整的协作与管理套件。以下是如何用它们来进行项目管理的实战方案：

### 1. 使用 GitHub Issues 跟踪任务与 Bug
**Issue**（议题）是管理具体任务的最小单位。无论是发现了一个 Bug、想开发一个新功能，还是一些琐碎的优化，都应该新建一个 Issue。

*   **创建 Issue**：
    1. 点击仓库顶部的 **`Issues`** 选项卡 -> **`New issue`**。
    2. 填写标题和描述（例如：“`fix: 优化长图导出，避免圆角边框裁剪`”）。
*   **标记与分类 (Labels)**：
    *   `bug`：程序出错或崩溃。
    *   `enhancement`：新功能或体验优化。
    *   `documentation`：文档编写与更新。
*   **负责人 (Assignees)**：将 Issue 指派给自己，防止任务被遗忘。

### 2. 使用 GitHub Projects (看板) 掌控开发进度
**Projects** 是 GitHub 内置的类似 Trello 的看板工具，非常适合用于规划项目的开发阶段。

*   **新建 Project**：
    1. 点击仓库顶部的 **`Projects`** 选项卡 -> **`New project`**。
    2. 选择 **`Board`**（看板模板），点击 **`Create`**。
    3. 命名您的项目（如：“`洛克王国孵蛋表迭代路线图`”）。
*   **配置看板列**：
    建议设置以下 5 列来对应软件开发的生命周期：
    1. `Backlog`（需求池）：所有未来的想法、新宠物孵蛋逻辑。
    2. `Todo`（待办）：本周或近期必须解决的 Issue。
    3. `In Progress`（进行中）：正在编写代码的任务。
    4. `In Review`（待测试/评审）：代码已写完，等待测试或 Electron 打包验证。
    5. `Done`（已完成）：已经测试完毕并正常运行的任务。
*   **关联 Issue**：
    在看板中点击 `Add item`，可以直接搜索并添加您之前创建的 Issues。拖拽卡片即可在不同状态列之间流转。

### 3. 使用 Milestones (里程碑) 规划版本发布
**Milestone** 用于将一堆 Issue 聚合到一个具体的发布日期或版本号（例如 `v1.0.0-Beta` 或 `v1.1.0-Release`）。

*   **创建里程碑**：
    1. 进入 **`Issues`** 页面，点击右上角的 **`Milestones`** -> **`New milestone`**。
    2. 输入版本名称（如 `v1.1.0-桌面端稳定版`）、截止日期以及描述。
*   **关联任务**：
    在创建或修改 Issue 时，在右侧的 `Milestone` 属性中选择该里程碑。
    *   *好处：您可以实时看到当前版本距离 100% 完成还差多少个任务，极具掌控感。*

### 4. 高级技巧：Smart Commits (智能提交自动关闭)
在本地提交代码时，如果您的 Commit 信息中包含特定关键字和 Issue 编号，GitHub 会在您 `git push` 时**自动更新**或**关闭**对应的 Issue，省去手动操作网页的繁琐。

*   **自动关闭格式**：
    *   `fix: 解决 3V 蛋重复统计问题 (close #12)`
    *   `feat: 新增小粗和小婉牌子类型 (closes #15)`
    *   *常用关键字：`close`, `closes`, `closed`, `fix`, `fixes`, `fixed`, `resolve`, `resolves`, `resolved`*
*   **仅做关联（不关闭）**：
    *   `refactor: 重构 Electron 主进程路径探测逻辑 (#8)`
    *   *这会在 Issue 的时间线里留下一条该 Commit 的引用记录，方便后续追溯“这段代码是为解决哪个问题而写”。*

---

## 第三部分：项目后续维护最佳实践

1. **分支保护**：
   如果您与其他人协作，可以在 GitHub 的 **`Settings -> Branches`** 中为 `main` 分支设置保护规则，防止误删或强制推送。
2. **每次开发新功能的标准流**：
   - 第一步：在 GitHub 建一个 Issue 记录需求。
   - 第二步：在本地拉出开发分支（如 `feature/new-filters`）或直接在本地修改。
   - 第三步：写完代码后，Commit 时写上 `closes #issue_number`。
   - 第四步：推送代码，Issue 自动关闭，Projects 看板上的卡片也会根据规则自动跑到 `Done` 中。
