# Research Notes: 智能配对升级与小体型临界规则设计

## 模型信息
- 模型名称：Antigravity
- 模型大小：超大参数规模
- 模型类型：代码与智能体双模态模型
- 修订版本：v6.0-Compacted-Resume

---

## 1. 智能配对升级背景
用户需要让系统智能支持以下小体型牌子和普通牌子的交叉繁殖配对：
1. **小粗** + **单粗嗓门**
2. **小婉** + **单婉转声**
3. **小不点** (单小不点) + **普通**

原先的系统仅定义了大体型牌子的特殊概率配对逻辑（如“概率大粗”、“概率大婉”、“概率大块头”），以及体型一致时的基础配对（如“小粗+小粗”、“单粗嗓门+单粗嗓门”等）。

为了支持小体型的智能繁育系统，需要做三点升级：
- 在配对逻辑中引入 `isNearTinyLimit` (接近小不点体重临界值且身高已缩减至最小值) 的判定。
- 在配对产出中补充 `"概率小粗"`、`"概率小婉"`、`"概率小不点"` 等虚拟概率牌子。
- 对可能产生的体型冲突（例如 `大粗 + 小粗`、`大婉 + 小婉`）进行物理拦截，因为相反的特化体型是无法兼容繁育的。

---

## 2. 核心判定规则与算法推演

### 2.1 isNearTinyLimit (小不点临界) 判定公式
参考 `ParentCard.tsx` 中小不点达标与临界的数学逻辑：
- `minHeight`：该宠物的标准身高最小值。
- `tinyWeightLine`：该宠物的标准小不点及格重量线，计算公式为：`minWeight + (maxWeight - minWeight) * 0.05`。
- **达标小不点**：`height <= minHeight` 且 `weight <= tinyWeightLine`。
- **小不点临界**：`height <= minHeight` 且重量处于临界带。临界带为：重量大于 `tinyWeightLine` 且距离 `tinyWeightLine` 差值在 10% 以内。
  即：`weight > tinyWeightLine` 且 `weight - tinyWeightLine <= tinyWeightLine * 0.10`（即 `weight <= tinyWeightLine * 1.10`）。

代码实现：
```typescript
const isNearTinyLimit = (pet: ParentPet) => {
  const t = getPetSizeThresholds(pet.sprite);
  if (!t || !pet.height || !pet.weight) return false;
  const hVal = parseFloat(pet.height);
  const wVal = parseFloat(pet.weight);
  if (isNaN(hVal) || isNaN(wVal)) return false;
  return hVal <= t.minHeight && wVal > t.tinyWeightLine && wVal <= t.tinyWeightLine * 1.10;
};
```

### 2.2 粗嗓门组 (Coarse Voice) 配对公式
包含牌子：`大粗`、`小粗`、`单粗嗓门`。
- **大粗 + 大粗**：
  - 若均不接近大块头临界 -> `大粗`
  - 否则 -> `概率大粗`
- **小粗 + 小粗**：
  - 若均不接近小不点临界 -> `小粗`
  - 否则 -> `概率小粗`
- **大粗 + 单粗嗓门**：
  - 若有任意一方接近大块头临界 -> `概率大粗`
  - 否则 -> `单粗嗓门`
- **小粗 + 单粗嗓门**：
  - 若有任意一方接近小不点临界 -> `概率小粗`
  - 否则 -> `单粗嗓门`
- **大粗 + 小粗**：不兼容（拦截）。
- **单粗嗓门 + 单粗嗓门**：`单粗嗓门`。

### 2.3 婉转声组 (Soft Voice) 配对公式
包含牌子：`大婉`、`小婉`、`单婉转声`。
与粗嗓门完全镜像：
- **大婉 + 大婉** -> `大婉` 或 `概率大婉`
- **小婉 + 小婉** -> `小婉` 或 `概率小婉`
- **大婉 + 单婉转声** -> `概率大婉` 或 `单婉转声`
- **小婉 + 单婉转声** -> `概率小婉` 或 `单婉转声`
- **大婉 + 小婉**：不兼容（拦截）。
- **单婉转声 + 单婉转声** -> `单婉转声`。

### 2.4 无声体型组 (Pure Size) 配对公式
包含牌子：`普通`、`单大块头`、`单小不点`。
- **单大块头 + 普通**：
  - 若普通一方接近大块头临界 -> `概率大块头`
  - 否则 -> `普通`
- **单小不点 + 普通**：
  - 若普通一方接近小不点临界 -> `概率小不点`
  - 否则 -> `普通`
- **普通 + 普通**：
  - 若双方都接近大块头临界 -> `概率大块头`
  - 若双方都接近小不点临界 -> `概率小不点`
  - 否则 -> `普通`（已被 `father.brand === mother.brand` 处理为 `普通`）。

---

## 3. 概率牌子颜色规范 (Theme Integration)
当配对显示这三种概率子代时，我们需要在 `getBrandStyle` 里面加入其 CSS 样式：
- **概率小粗**：浅紫色底加紫色虚线边框（`bg-purple-50 dark:bg-purple-950 border-purple-400 dark:border-purple-900 text-purple-800 dark:text-purple-300 font-extrabold border-dashed`）。
- **概率小婉**：浅天蓝色底加天蓝虚线边框（`bg-sky-50 dark:bg-sky-950 border-sky-400 dark:border-sky-900 text-sky-800 dark:text-sky-300 font-extrabold border-dashed`）。
- **概率小不点**：浅青色底加青色虚线边框（`bg-cyan-50 dark:bg-cyan-950 border-cyan-400 dark:border-cyan-900 text-cyan-800 dark:text-cyan-300 font-extrabold border-dashed`）。
