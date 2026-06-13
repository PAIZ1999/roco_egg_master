# Research Notes: 蛋窝产蛋联动与精灵蛋体型标签显示优化

## 模型名称、模型大小、模型类型、修订版本
- 模型名称：Gemini 3.5 Flash (High)
- 模型大小：中等大小
- 模型类型：多模态对话模型
- 修订版本：v6.0 (RIPER-5 + Manus + MCP + Skills)

---

## 1. 最低进化形态推导设计 (`petHelper.ts`)
- 通过分析 `eggPetList`（定义在 `images/洛克王国_蛋组精灵表.json`）的 `family_chain` 数据：
  - 进化链格式如 `"乖乖鹄 → 蓝珠天鹅 → 翠顶夫人"`。
  - 最低形态位于分割后数组的第一个元素（例如 `"乖乖鹄"`）。
- 我们可以通过以下步骤获取最低进化形态名字并保留后缀（例如 `冬羽雀_春天的样子`）：
  - 提取基础名与形态后缀：`const [baseName, suffix] = name.split('_');`。
  - 从 `getPetDetails(baseName)` 中读取 `familyChain` 并分割获取第一个精灵名：`chainParts[0]`。
  - 拼接成最终最低进化形态名：`${lowestBase}${suffix ? '_' + suffix : ''}`。

## 2. 联动产蛋交互设计 (`SortableCard.tsx` 和 `App.tsx`)
- 在蛋窝卡片 `SortableCard.tsx` 中，当 `pet.status === "有现蛋"` 时，在现蛋数量输入框右侧渲染一个“产蛋”操作按钮。
- `SortableCardProps` 新增 `onProduceEgg?: (pet: EggPet) => void` 属性。
- 点击“产蛋”按钮触发 `onProduceEgg(pet)` 并阻止事件冒泡。
- 在 `App.tsx` 中绑定该回调：
  - 构造一个新的 `EggData`，除了 `eggSize` 和 `eggWeight` 为空之外，其余字段（牌子、性格、三围、精灵名等）全量从蛋窝中继承。
  - 性格默认取数组首个元素 `nest.fatherNatures[0]` / `nest.motherNatures[0]`。
  - 精灵名通过 `getLowestStageName(nest.sprite)` 转为最低进化形态。
  - 产出时间默认当前日期（YYYY-MM-DD）。
  - 追加新蛋到 `eggs` 列表顶部：`setEggs(prev => [newEgg, ...prev])`。
  - 更新蛋窝现蛋数与状态：
    - 将蛋窝卡片上的现蛋数量（eggCount）加 1，并确保其窝点状态（status）自动切换为“有现蛋”。

## 3. 手动登记蛋默认三围优化 (`App.tsx` 中的 `handleAddEggClick`)
- 默认三围 `fatherStats` 和 `motherStats` 由原先的 `["无", "无", "无"]` 修改为 `["生命", "物攻", "速度"]`，确保新增后即有 3V 候选数据。

## 4. 体型标签回退过滤 (`EggCard.tsx`)
- 原本当 `getStatusBadge()` 返回 `null` 时默认渲染“普通体型”标签。
- 优化后，若牌子为 `"大粗"`, `"大婉"`, `"单大块头"` 之一，即使 `getStatusBadge() === null` 也不显示“普通体型”标签，只有在达到极限值时显示“极限大”。
