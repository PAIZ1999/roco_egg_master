# Task Plan: 启动自动检测与引导安装 Python 3 & Npcap

## Goal
实现 Electron 启动时检测系统是否配置有 Python 3 和 Npcap。如无，则自动搜寻同目录离线安装包（npcap-1.88.exe 和 python-3.12.10-amd64.exe）并引导运行安装，保证环境一键自愈。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [x] memory 知识存储完成

## Phases
- [x] Phase 1: 检测与探测函数编写
- [x] Phase 2: 离线包路径定位与安装启动逻辑
- [x] Phase 3: 主进程 whenReady 初始化集成
- [/] Phase 4: 开发环境与打包环境测试验证
- [ ] Phase 5: 最终交付与知识沉淀

## Key Questions
1. **如果用户拒绝了安装如何处理？**
   - 答：若用户选择不安装，将继续尝试打开应用，但当用户点击“本地数据库直连”时会报错或无法加载角色，我们也会在检测失败且用户放弃安装时提供再次弹窗提示。
2. **离线包应该存放在哪里？**
   - 答：在打包后，离线安装包（`npcap-1.88.exe` 和 `python-3.12.10-amd64.exe`）应该与我们的主桌面 `.exe`（便携版）放在相同的物理目录下。这样用户解压或者直接双击运行时，系统能在同级迅速找到它们。

## Decisions Made
- [决策]: Python 使用 `PrependPath=1` 参数进行静默安装，保证不需要用户参与，自动把 python.exe 写入系统 PATH；而 Npcap 采用普通交互拉起，因为 Npcap 免费版不支持静默选项。

## Errors Encountered
- 无

## Status
**Currently in Phase 4** - 正在对环境依赖探测和引导安装逻辑进行编译与运行验证。
