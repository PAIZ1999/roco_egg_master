# Task Plan: 牌子重命名 (单大粗 -> 单粗嗓门, 单大婉 -> 单婉转声)

## Goal
将系统中“单大粗”和“单大婉”牌子名称分别替换为“单粗嗓门”和“单婉转声”，确保所有引用（下拉列表、样式映射、匹配逻辑等）同步，验证编译无误，然后执行 build，并提交至 git。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [x] memory 知识存储完成

## Phases
- [x] Phase 1: 牌子名称修改 (修改 types.ts 中的 BRAND_OPTIONS 和 petHelper.ts 中的 getBrandStyle 映射)
- [x] Phase 2: 构建测试 (本地运行 npm run build 进行类型和构建检查)
- [x] Phase 3: Git 提交 (规范提交 feat/refactor 类型的修改)

## Key Questions
1. 数据库或者本地存储的历史数据是否需要做迁移？
    - 答：用户要求仅修改牌子文字。由于本项目没有统一的后台数据库，全为本地 JSON 存储。前端通过 BRAND_OPTIONS 约束，我们将 options 和 style 中的 key 对应替换即可。用户若有历史包含旧文字的本地 JSON 文件，下次载入时可能被匹配为 default 灰色，但修改后新数据均会使用新牌子名称。

## Decisions Made
- [决策]: 替换 types.ts 里的 BRAND_OPTIONS 数组项，以及 petHelper.ts 中 getBrandStyle 的 case 分支。

## Errors Encountered
- 无

## Status
**Currently in Completed** - 所有修改均已完成并成功通过打包测试，已提交至 git 仓库。
