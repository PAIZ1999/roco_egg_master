# Task Plan: 精灵多形态头像支持

## Goal
支持多形态精灵（如冬羽雀的四季形态、丢丢的各种地形形态等）在蛋窝卡片和换蛋看板头像中的切换与显示，且能够在长图导出和数据持久化中完美保留。

## MCP Status
- [x] memory 检索完成
- [ ] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [ ] memory 知识存储完成

## Phases
- [x] Phase 1: 精灵多形态匹配与辅助函数重构 (`src/petHelper.ts`)
- [x] Phase 2: 蛋窝卡片多形态头像切换交互 (`src/components/SortableCard.tsx`)
- [x] Phase 3: 表格行多形态头像切换交互 (`src/components/SortableRow.tsx`)
- [x] Phase 4: 换蛋看板多形态展示与发布表单优化 (`src/App.tsx`)
- [x] Phase 5: 页面运行、长图导出与打包测试验证

## Key Questions
1. 如何让输入框输入“冬羽雀”时能匹配到蛋组，并且能随意切换不同形态？
   - **决策**：通过下划线分隔，将 `pet.sprite` 设为具体的形态名称（如 `"冬羽雀_春天的样子"`），而 `getPetDetails` 内部通过 `split("_")[0]` 拆分出基础名字 `"冬羽雀"` 去查表获取系别和蛋组，从而既不破坏数据结构，又支持多形态图片。
2. 形态切换的交互如何设计，既高级又不会破坏原本精美的卡片布局，且不影响长图导出？
   - **决策**：在卡片大头像容器底部放置一个毛玻璃效果的微型形态切换 `<select>` 下拉框，只有当该精灵有 2 个或以上可选形态时才显示。该下拉框带有 `.action-buttons` 类，以便在导出长图时自动被 CSS 过滤隐藏，保留干净亮丽 of 选定形态头像。

## Decisions Made
- [决策]: 保持 `pet.sprite` 字段为存储媒介，带下划线的字符串格式表示特定形态。
- [决策]: 在 `src/petHelper.ts` 中提供 `getAvailableSprites` 和重构 of `getPetDetails` / `getSpriteFileName` 以做数据与图片的底层支撑。

## Errors Encountered
- 无

## Status
**✅ 全部完成** - 精灵多形态支持功能已全部实现、测试通过，已打包并推送至远程仓库。
