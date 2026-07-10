# Task Plan: 洛克王国起来鸭与丢丢导入形态解析修复计划

## Goal
修复洛克宠物数据导入时起来鸭（显示为鸭吉吉蓬松的样子）和丢丢（草地附近的样子显示为沙地附近的样子）形态映射解析错误的 Bug。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [x] memory 知识存储完成

## Phases
- [x] Phase 1: 规划与准备 (分析 SQLite 原始数据结构，寻找形态 conf_id 与 base_conf_id 对应关系)
- [x] Phase 2: 修改 `src/components/RocoImportModal.tsx` 以修正形态名字处理顺序及增加丢丢形态映射
- [x] Phase 3: 运行并验证 Vite 构建及本地导入功能
- [x] Phase 4: 最终交付与项目知识库更新

## Key Questions
- 无

## Decisions Made
- [决策]: 调整 `RocoImportModal.tsx` 中解码宠物名称与形态映射、拼接的先后顺序。原代码先进行 `isYajiji` 映射和后缀拼接，此时 `rawName` 还是空值，导致后缀拼接直接被跳过，后续兜底解码仅拿到不带形态 of `"鸭吉吉"`。修改为先做名字解码兜底，再进行形态映射和拼接。
- [决策]: 增加丢丢进化链的特殊 `conf_id` 映射判定：皮肤 ID `2200004` 映射为“草地附近的样子”，`300036` 为“雪山附近的样子”，`410036` 为“火山附近的样子”，而 `3290001`/`3291001`/`3292001` 等 `329` 前缀的配置映射为“沙地附近的样子”。

## Errors Encountered
- 无

## Status
**Currently in Phase 4** - 最终交付。所有的 Bug 修复、形态配置映射，编译与包构建，项目知识库更新已全部圆满完成。
