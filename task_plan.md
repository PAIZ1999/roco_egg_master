# Task Plan: 精灵蛋窝卡片化与蛋数量功能优化

## Goal
将精灵蛋窝信息模块从传统的表格（Table）重构为现代、精致的卡片式网格（Grid）布局。蛋窝卡片需集成精灵详情、父母性格与三围、蛋组、牌子等信息，且支持直接编辑；并将“窝点详情”列升级为“蛋数量”控制，在选择“有现蛋”时展示并支持修改蛋的数量，并在长图导出中完美兼容。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [x] memory 知识存储完成

## Phases
- [x] Phase 1: 规划与准备
- [x] Phase 2: 精灵数据模型扩展 (types.ts)
- [x] Phase 3: 卡片编辑组件开发 (SortableCard.tsx)
- [x] Phase 4: App.tsx 主渲染层适配重构
- [x] Phase 5: 长图导出与统计功能适配
- [x] Phase 6: 部署、验证与总结
- [x] Phase 7: 卡片样式与图标极致优化
- [x] Phase 8: 编译与浏览器测试验证

## Key Questions
1. 卡片的视觉尺寸和栅格如何在不同屏幕下响应式排版？
2. 蛋数量的数据类型是 `string` 还是 `number`？为了与 Autocomplete/保存机制契合，使用带有默认值的 string 更为便捷。
3. 以前的 Table 在导出长图时转为了静态 text 元素，卡片中的 input 和 select 也需要类似转换吗？是的，已经支持将卡片内的 input 和 select 在导出时替换为静态文本以保证导出的长图美观。
4. 速度、物防、魔防等特殊图标如何自定义 SVG 才能达到最美观和最兼容的效果？本次将直接替换为本地高精度的 PNG 图片（生命.png、物攻.png、魔攻.png、速度.png、物防.png、魔防.png），并提供完美兜底。

## Decisions Made
- [决策]: 卡片在屏幕宽度 >= md 时采用两栏或三栏 Grid 排版，保证多卡片排列时的美观，同时高度自适应。
- [决策]: 窝点状态中只有当 `status` 为 `"有现蛋"` 时，才显示蛋数量输入框，初始默认为 `"1"`。
- [决策]: 在长图导出中剔除拖拽手柄 `.drag-grip-handle` 并将所有输入框替换为静态文本展示，确保存档图片的美观。
- [决策]: 三围选项不再使用 Lucide 和自定义 SVG，全部改用 `images/6围/*.png` 本地图片，"无"状态下使用 Lucide `Minus`。
- [决策]: 放大父母配置区域字号至 `text-xs` (原来是 `text-[10px]`)，增加三围图标点击区域（从 `w-7 h-7` 放大至 `w-8.5 h-8.5`），使操作按钮和文字更大更清晰，双栏平分右侧 2/3 的空间。
- [决策]: 响应用户需求删除了父母性格旁的 `+` 号（仅保留性格删除按钮以防止布局过乱），将精灵名称加粗加大，卡片内的所有文字、下拉菜单均调整加大，同时在导出长图时于窝点顶部生成统一的“我的窝点”标题。
- [决策]: 将看板标题、列表 Grid Padding 以及网格 Gap 缩小回退，以在导出长图时展现紧凑精致的排版。

## Errors Encountered
- [错误]: TypeScript 检查报错：`SortableCardProps` 中未显式包含 React 自带的 `key` 属性，导致在 `App.tsx` 中渲染 `<SortableCard key={pet.id} ... />` 时抛出编译警告。
  - [解决方案]: 在 `SortableCardProps` 接口中加入可选的 `key?: string;` 属性。

## Status
**Currently in Phase 8** - 精灵蛋窝中心页面排版精致化与长图导出回退测试全部完成，视觉排版极具美感且精致紧凑，所有功能均已验证完毕，正式交付。

