# Task Plan: 洛克王国 S3 赛季精灵数据与高清头像更新

## Goal
全面更新洛克王国精灵数据源至 S3 赛季新数据，废除旧版数据，同步更新为 596 张带图鉴 ID 的高清精灵与子形态头像，并重构头像匹配检索逻辑，确保桌面端和打包后的桌面软件中多形态头像、进化链和蛋物理参数均能无缝且精准地展示。

## MCP Status
- [x] memory 检索完成 (已查询到有关 forms 重构及甜甜/晶石蜗等多形态排重解决历史)
- [ ] context7/deepwiki 查询完成
- [ ] sequential-thinking 分析完成
- [ ] memory 知识存储完成

## Phases
- [x] Phase 1: 规划与准备
  - [x] 研究并分析 `洛克精灵数据打包/database` 及 `高清精灵头像` 目录下的新数据结构。
  - [x] 制定 `implementation_plan.md` 精确数据合并与归一化图片路径寻路算法实施方案。
  - [x] 提交实施计划并取得用户审批。
- [x] Phase 2: 头像资源更新与索引重建
  - [x] 清空旧的 `images/sprites/` 目录，拷贝 596 张全新高清头像。
  - [x] 编写脚本并自动生成新的 `src/sprite_files.json` 头像文件名缓存索引。
- [x] Phase 3: 精灵数据清洗与物理合并
  - [x] 编写 Node.js 数据合并脚本 `scratch/merge_new_data.cjs`，将 178 个独立 JSON 重新合并构建为 React 所需的单一 `src/pets_data.json`，确保格式兼容。
- [x] Phase 4: 头像与形态寻路匹配重构
  - [x] 修改 `src/petHelper.ts` 中 `getSpriteFileName`、`findForm` 的匹配方法，使其支持带有 ID 前缀和中文括号的头像寻路。
  - [x] 修改 `src/queryHelper.ts` 中的匹配规则，保证在查询面板与桌面助理中点击进化链及多形态时能正确锁定对应的头像图片。
- [x] Phase 5: 测试验证与最终交付
  - [x] 编写并执行自校验脚本，检查 S3 新数据下所有精灵与多形态头像的对齐覆盖率是否为 100%
  - [x] 运行 `npm run build` 进行 TS 编译和 Electron 打包资源拷贝测试
  - [x] 运行 Vite dev 服务器进行浏览器端多 Tab 交互手动验证
  - [x] 更新项目知识库 `.claude\PROJECT_KNOWLEDGE.md` 并生成 `walkthrough.md` 报告

## Key Questions
1. 以前的数据在 React 运行时会依赖 `pets_race_data.json` 中的变体形态并动态补充到 `forms` 中。我们在新版 `pets_data.json` 中是否应该直接把 `regional_forms`、`lord_forms` 等一次性打包进主精灵的 `forms` 中以去冗余？
   *决策*: 是的，新版 JSON 直接物理包含所有形态属性，能最大化提高性能并避免脏数据。

## Decisions Made
- [决策]: 彻底废除旧的 `images/sprites` 目录，将其重构为纯净的 `[ID]-[精灵形态名].png` 的高清头像数据库，减少 800+ 冗余非繁育垃圾图片。
- [决策]: `getSpriteFileName` 匹配时对传入参数与 spriteFiles 文件名同时进行归一化（剥离数字 ID 前缀，去除后缀，中英文括号统一映射为下划线后强对比），从而完美穿透 ID 和括号的阻隔。

## Errors Encountered
- 无

## Status
**Currently in Phase 2** - 正在进行头像清空、拷贝和索引重建。
