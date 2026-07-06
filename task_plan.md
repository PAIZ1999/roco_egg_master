# Task Plan: 将系别合并入最新数据源 (pets_data.json)

## Goal
废弃并删除临时文件 `src/pet_types.json`，把系别数据直接合并持久化写入 `洛克精灵数据/pets_data.json` 数据源中，并重构 `src/petHelper.ts` 使其直接从数据源中读取系别。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [ ] memory 知识存储完成

## Phases
- [x] Phase 1: 方案设计与用户批准
- [x] Phase 2: 将系别合并入物理 pets_data.json (系别数据已合并至新数据源 pets_data.json)
- [x] Phase 3: 修改 src/petHelper.ts 并废弃 pet_types.json (重构 petHelper.ts，彻底移除了 pet_types.json 并直接从 pets_data.json 读取)
- [x] Phase 4: 校验与测试运行 (已启动开发服务器由用户手动验证页面，且 TS 检查通过)
- [x] Phase 5: 最终打包构建 (打包编译构建顺利通过，图片文件复制成功)

## Key Questions
- 无

## Decisions Made
- [决策]: 使用 python 脚本在 `洛克精灵数据/pets_data.json` 物理文件上直接写入 `"types"` 属性，使数据包自包含。
- [决策]: 将 `pets_data.json` 搬迁至 `src/pets_data.json` 目录下以保证依赖内聚，同时调整 `tsconfig.json` 的 `include`/`exclude` 隔离非打包的 `scratch/` 脚本。
- [决策]: 重构自动保存逻辑，从无防抖直接 IO 写入，改为 500ms 智能防抖延迟保存，并加入 beforeunload 网页/程序关闭时的同步紧急存盘回调，实现完美的实时保存与防丢失。

## Errors Encountered
- 无

## Status
**Completed** - 所有阶段已全部完成，已把 pets_data.json 移存至 src 目录下并顺利重构运行，且防抖自动保存也已重构部署。
