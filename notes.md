# Roco Egg Master 临界值判断与牌子扩充研究笔记

## 1. 核心改进目标与设计原则

> [!IMPORTANT]
> 针对用户提出的在身高体重录入时自动判断临界状态，并在智能繁育中加入临界值自动匹配，及格线数据展示，同时牌子加入“单粗嗓门”与“单婉转声”选项的要求，制定以下设计原则：
> 1. **及格线计算精确度**：
>    - 大块头的及格线 = `最高重量 + (最低重量 - 最高重量) * 0.02`
>    - 小不点的及格线 = `最轻重量 - (最轻重量 - 最重重量) * 0.05`
>    - 解析 `guideSize` 字符串范围，处理单值与多值情形，保证数据计算的健壮性。
> 2. **临界与达标双维度指示**：
>    - 引入状态判定高亮 Badge，放在左侧头像信息的下方。
>    - **大块头 (达标)**：`height >= maxHeight` 且 `weight >= giantWeightLine`。
>    - **大块头 (临界)**：`height >= maxHeight` 且 `weight < giantWeightLine`（身高达标，体重不够）。
>    - **小不点 (达标)**：`height <= minHeight` 且 `weight <= tinyWeightLine`。
>    - **小不点 (临界)**：`height <= minHeight` 且 `weight > tinyWeightLine`（身高最矮，体重未减够）。
> 3. **临界值信息展示**：
>    - 父母本卡片中，展示在 `guideSize` 的下方，显示“大及格”与“小及格”具体数值（如 `大及格: 4.58kg`）。
>    - 智能繁育结果卡片中，在子代产出信息下方增加“📏 身高: min~max m”、“⚖️ 大及格: ≥giant kg”、“⚖️ 小及格: ≤tiny kg”的展示，保证繁育预测结果的明确度。
> 4. **牌子扩充与智能配对机制**：
>    - 新增“单粗嗓门”和“单婉转声”牌子，分别作为“大粗”和“大婉”的临界前置状态。
>    - 智能配对算法适配：
>      - **大粗配对链**：父母牌子皆处于 `["大粗", "单粗嗓门"]` 时匹配通过，子代蛋的牌子强制指定为“大粗”；
>      - **大婉配对链**：父母牌子皆处于 `["大婉", "单婉转声"]` 时匹配通过，子代蛋的牌子强制指定为“大婉”；
>      - 如果是其他牌子，需 `father.brand === mother.brand`，子代蛋牌子继承父母的牌子。
>      - 繁育卡片展示时，子代蛋牌子会显示相应的“大粗”、“大婉”或对应的匹配牌子。

## 2. 数据结构变化与预估

在 `src/types.ts` 中：
```typescript
export const BRAND_OPTIONS = [
  "大粗",
  "大婉",
  "小粗",
  "小婉",
  "普通",
  "单大块头",
  "单粗嗓门",
  "单婉转声"
];
```

在 `src/petHelper.ts` 中实现：
- `getPetSizeThresholds(spriteName: string): SizeThresholds | null`：包含 min/max 身高体重，以及计算后的小数点对齐的 `giantWeightLine` 与 `tinyWeightLine`。
- `getBrandStyle(brand: string): string`：增加“单粗嗓门”和“单婉转声”的背景渐变或纯色。

在 `src/components/ParentCard.tsx` 中：
- 读取 `getPetSizeThresholds(parent.sprite)`。
- 判断当前 `height` 与 `weight` 的临界与达标。
- 将临界值数据放置在身高体重下方。

在 `src/App.tsx` 中：
- 重构 `getPairings()` 中的牌子交集检测规则。
- 渲染子代繁育卡片下方的临界值。
