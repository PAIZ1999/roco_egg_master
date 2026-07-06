# Task Plan: 迁移至最新精灵数据源 (pets_data.json)

## Goal
废弃原有的 `洛克王国_蛋组精灵表.json`、`全图鉴.json` 以及 `PET_EGG_CONF.json` 数据源，完全迁移到最新 `洛克精灵数据/pets_data.json` 数据包，同时保证精灵头像不裂图、系别 Badge 渲染正常以及临界大小及格线计算精确。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [ ] memory 知识存储完成

## Phases
- [ ] Phase 1: 方案设计与用户批准
- [/] Phase 2: 整合新图片与更新 sprite_files.json (正在准备拷贝脚本)
- [ ] Phase 3: 重构 src/petHelper.ts 数据源和计算逻辑
- [ ] Phase 4: 修改 src/App.tsx 并验证开发环境
- [ ] Phase 5: 打包构建与回归测试

## Key Questions
1. 新 JSON 里面月亮砣的蛋组 `海洋组身高：0.08-0.1引体重0.9450一` 存在格式错误，如何处理？
   - 决策：在 `petHelper.ts` 初始化 `egg_groups` 时，通过正则或字符串包含匹配将该字符串归一化为标准的 `"海洋组"`。
2. 新旧图片重名或前缀冲突如何处理？
   - 决策：新图片（如 `1-迪莫.png`）作为新文件拷贝进 `images/sprites` 目录中，并不覆盖原有的不带前缀的旧图片（如 `迪莫.png`），这样新旧图片将并存，以确保最大兼容性。

## Decisions Made
- [决策]: 提前提炼出 `src/pet_types.json` 静态文件，避免新 JSON 缺少系别属性导致图标显示裂开。
- [决策]: `getPetGuideSize` 和 `getEggSizeThresholds` 统一重构为浮点数范围读取，彻底废弃旧的除以 100/1000 以及 `~` 字符串解析逻辑。

## Errors Encountered
- 无

## Status
**Currently in Phase 1** - 已设计好迁移方案并准备好了系别提取映射。正等待用户批准 Implementation Plan 以开始执行。
