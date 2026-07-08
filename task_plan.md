# Task Plan: 优化父母本卡片排版与切换按钮重定位

## Goal
优化父母本卡片的布局和排版，解决左侧大面积留白及系别重复渲染问题；将父本/母本仓库的卡片/表格切换按钮从过滤栏移至深色标题栏右侧的“全选”按钮旁。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [ ] memory 知识存储完成

## Phases
- [ ] Phase 1: 规划与准备 (更新 implementation_plan.md 并获取批准)
- [ ] Phase 2: 修改 ParentCard.tsx (去除头像绝对定位属性Badge，将组别、位置、三围移至左侧以平衡高度；将右侧表单项重构为 2x2 网格排版)
- [ ] Phase 3: 修改 App.tsx (移除过滤栏原有的切换按钮，并分别在父本/母本黑色标题栏最右侧引入暗色系切换按钮)
- [ ] Phase 4: 测试与验证 (验证打包与编译，进行 UI 人工/自动化测试，截取高水准设计效果图)
- [ ] Phase 5: 最终交付与知识沉淀 (更新 PROJECT_KNOWLEDGE.md，完成 Git 规范提交)

## Key Questions
1. 左右高度如何做到完美均衡？
   - 答：将“所属组别”（Egg Groups）、“游戏位置”（📍 Location）和“精灵三围”（Stats selectors）挪到左侧精灵头像和名字下方，左侧的内容能够填满空间；而右侧原本拥挤的表单项改为 2x2 精美网格布局，高度大幅下降，左右在高度上达到了像素级的高度平齐，卡片饱满美观。
2. 按钮移到黑色标题栏后，背景如何融合？
   - 答：使用 bg-slate-800 与 border-slate-700 搭配，选中状态使用 text-sky-400（父）和 text-pink-400（母）以与两端各自的主题色呼应，具有极其精致的高档质感。

## Decisions Made
- [决策]: 彻底移除头像容器右下角的绝对定位系别圆形 Badge，避免精灵名字下方有重复渲染的系别导致梦想三三等宠物出现双爱心视觉 Bug。

## Errors Encountered
- 无

## Status
**Currently in Phase 1** - 正在更新实施计划，等待审批通过。
