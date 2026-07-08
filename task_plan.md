# Task Plan: 优化呼吸灯状态位置与输入框遮挡问题

## Goal
按照用户的最新反馈：
1. 将代表体型或声音达标状态的“呼吸灯标签”移至左栏“精灵数据”面板的正下方。
2. 修复身高、体重、声音值输入框为空时，占位符 (placeholder) 文本与单位重叠遮挡的问题，确保任何宽度下均能完全、清晰地显示。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [ ] memory 知识存储完成

## Phases
- [ ] Phase 1: 规划与设计 (编写实施计划，描述呼吸灯移动与输入框 flex 压缩优化)
- [ ] Phase 2: 修改 ParentCard.tsx (调整 getStatusBadge() 渲染层至左侧 guideSize 圆角面板下；修改 input CSS 属性为 flex-1 min-w-0 w-0 并优化 placeholder 为更简短的输入文案)
- [ ] Phase 3: 测试验证与 lint 检查 (运行 lint 和本地开发服务器，在卡片数据为空的状态下在浏览器中核实占位符完全显露)
- [ ] Phase 4: 交付与沉淀 (编写 walkthrough 报告并提供更新后的效果截图，提交 Git 仓库)

## Key Questions
1. 如何彻底避免输入框占位符重叠遮挡？
   - 答：将 input 设为 `flex-1 min-w-0 w-0` 从而限制其在 Flex 容器中的过度拉伸；将前置 icon 和后置单位（如 `m`, `kg`）设为 `shrink-0`；最后将 placeholder 文案优化为更精炼的短词（如“输入身高”、“输入体重”），彻底杜绝与单位重叠和遮挡。

## Decisions Made
- [决策]: 确认左侧垂直排布为：头像 -> 名字 -> 属性图标 -> 精灵数据面板 -> 呼吸灯状态灯 -> 游戏位置，各层次清晰，结构平衡。

## Errors Encountered
- 无

## Status
**Currently in Phase 1** - 正在申请实施方案审批。
