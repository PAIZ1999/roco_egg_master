# Task Plan: 洛克王国孵蛋表父母本临界值判断与牌子扩充

## Goal
在父母本管理中心新增身高体重临界值自动判定，扩充牌子至包含“单粗嗓门”与“单婉转声”，在智能繁育配对中支持临界值父母（大粗/单粗嗓门，大婉/单婉转声）的结合匹配，并在卡片和配对结果下方展示身高体重标准范围及临界值。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [x] memory 知识存储完成

## Phases
- [x] Phase 1: 规划与设计准备
  - [x] 查阅现有的 types.ts, petHelper.ts, ParentCard.tsx 和 App.tsx 逻辑
  - [x] 初始化 `task_plan.md` 和 `notes.md` 
  - [x] 编写 `implementation_plan.md` 并提交审核
- [x] Phase 2: 方案确认与用户授权
  - [x] 等待用户确认并批准实施方案
- [x] Phase 3: 核心执行（代码修改与新增）
  - [x] 更新 `src/types.ts` 扩充 `BRAND_OPTIONS`，加入“单粗嗓门”、“单婉转声”
  - [x] 更新 `src/petHelper.ts` 的 `getBrandStyle` 方法，加入新牌子的高对比度底色
  - [x] 在 `src/petHelper.ts` 中新增 `getPetSizeThresholds`，解析精灵身高体重范围并计算大块头/小不点及格线
- [x] Phase 6: 体型牌极限值状态 Badge 优化
  - [x] 在 `src/components/ParentCard.tsx` 的 `getStatusBadge()` 中，为大体型牌（大粗、大婉、单大块头）和小体型牌（小粗、小婉）新增只有达到绝对极限值时才显示“极限大”/“极限小”的逻辑
  - [x] 运行 Vite 验证当达到绝对极限值时显示“极限大”/“极限小”，而只达标但未到极限时显示“大块头 (达标)”/“小不点 (达标)”
  - [x] 编译构建打包测试，规范提交代码
- [x] Phase 7: 新增“单小不点”体型牌
  - [x] 更新 `src/types.ts` 中的 `BRAND_OPTIONS`，加入“单小不点”牌子
  - [x] 更新 `src/petHelper.ts` 的 `getBrandStyle` 样式，为“单小不点”配置青色或浅蓝色等视觉效果好的样式底色
  - [x] 更新 `src/components/ParentCard.tsx` 中的 `isTinyBrand` 逻辑，将“单小不点”牌子纳入小不点极限徽章判断中
  - [x] 编译构建打包，启动开发服务，确保前端交互、渲染及备份导入均正常

## Key Questions
1. 及格线公式的取值范围如何保障高精度？
   → 决定：使用 Float 解析 images/全图鉴.json 中的范围（通过 `~` 分隔的最高和最低值），及格线计算结果使用 `Math.round(val * 10000) / 10000` 保留 4 位小数，避免浮点数计算中 0.0000001 之类的显示偏差。
2. 临界值父母本相结合生出大块头的逻辑如何转换？
   → 决定：“单粗嗓门”是“大粗”的临界状态，而“单婉转声”是“大婉”的临界状态。当父本和母本同为粗嗓门组（大粗或单粗嗓门）时，配对成功，子代蛋牌子为“大粗”；同为婉转声组（大婉或单婉转声）时，配对成功，子代蛋牌子为“大婉”。其余牌子仍然保持相同牌子配对。
3. 临界值数据的展示位置在哪里？
   → 决定：
    - 父母本卡片：直接显示在左侧标准身高体重范围（guideSize）的下方，用一条细线划开，并在其上渲染出达标或临界状态的高亮 Badge。
    - 子代配对卡片：父母身高体重直接展示在左右两侧各自头像 and 名字下方；子代参考范围及大小及格线保留在下方卡片规格区块中。
4. 体型牌如何判断极限值？
   → 决定：
    - 大体型牌（大粗/大婉/单大块头）在 `hVal >= thresholds.maxHeight && wVal >= thresholds.maxWeight` 时显示 `极限大`。
    - 小体型牌（小粗/小婉）在 `hVal <= thresholds.minHeight && wVal <= thresholds.minWeight` 时显示 `极限小`。
    - 仅达标（大于等于及格线但没到极限值）时，依然显示 `大块头 (达标)` 或 `小不点 (达标)`。

## Decisions Made
- **及格线公式**：
  - 大块头及格线 = 最高重量 + (最低重量 - 最高重量) * 0.02
  - 小不点的及格线 = 最轻重量 - (最轻重量 - 最重重量) * 0.05
- **判定临界条件**：
  - 身高达标（`>= max`）且体重达标（`>= giantWeightLine`）→ 大块头 (达标)
  - 身高达标（`>= max`）且体重未达标且相差在 20% 以内（`< giantWeightLine` 且 `>= giantWeightLine * 0.8`）→ 大块头 (临界)
  - 身高最小（`<= min`）且体重达到小不点（`<= tinyWeightLine`）→ 小不点 (达标)
  - 身高最小（`<= min`）且体重未达到小不点且相差在 20% 以内（`> tinyWeightLine` 且 `<= tinyWeightLine * 1.2`）→ 小不点 (临界)
- **极限大/极限小判定**：
  - 只有选择大粗、大婉、单大块头，且身高体重都达到最大极限时，才显示 `极限大`。
  - 只有选择小粗、小婉，且身高体重都达到最小极限时，才显示 `极限小`。

## Errors Encountered
- **编译类型错误**：Vite 编译期间在子代规格参考中使用了不存在的 `heightRange` 和 `weightRange` 属性。
  - **解决方案**：将其修改为 `getPetGuideSize` 定义 of `{ height: string; weight: string }` 中的 `height` 和 `weight`。

## Status
**Currently in Phase 7** - 本阶段新增“单小不点”体型牌以及极限大/小优化重构已经全部处理完毕，已顺利通过 Vite 项目编译与构建。
