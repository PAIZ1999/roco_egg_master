# Research Notes: 卡片数据复制粘贴与数据保存路径优化

## 模型信息
- 模型名称：Gemini 3.5 Flash
- 模型大小：标准
- 模型类型：多模态大语言模型
- 修订版本：v6.0

---

## 1. 复制与粘贴需求分析

用户需要在孵蛋表管理系统的三个 Tab 页（蛋窝中心、父母本仓储、精灵蛋管理）实现卡片的快捷复制粘贴功能：
- **操作交互**：点击选中卡片 -> 按下 `Ctrl+C` -> 悬停（Hover）在另一张卡片上或选中目标卡片 -> 按下 `Ctrl+V` 粘贴覆盖。
- **自动新建**：若当前没有任何 Hover 或选中的卡片作为粘贴目标，直接按 `Ctrl+V` 会自动在当前 Tab 页新建一个卡片，并将复制的数据复制进去。
- **保存路径调整**：将 Electron 默认自动数据保存路径调整为当前文件（可执行程序或开发根目录）的同级目录下（不需要额外的 `data` 目录）。

---

## 2. 跨类型卡片字段映射设计

因为系统中有三种主要卡片：蛋窝（`EggPet`）、父母本（`ParentPet`）、精灵蛋（`EggData`），当用户跨 Tab 复制粘贴数据时，需要执行以下智能映射逻辑：

### 2.1 复制源：蛋窝卡片 (`EggPet`)
- **粘贴至蛋窝 (`EggPet`)**：
  - 完全复制。排除 `id`（自动生成新 ID），重置状态为“有现蛋”或保持原样？建议保留原有卡片的 `status` 和 `eggCount`，或完全覆盖。为方便使用，除了 `id` 之外，所有字段（`sprite`, `fatherNatures`, `motherNatures`, `fatherStats`, `motherStats`, `groups`, `brand`, `status`, `isLimit`, `is3V`, `hideStats`, `eggCount`, `fatherName`, `motherName`）全部覆盖。
- **粘贴至父母本 (`ParentPet`)**：
  - 如果目标是父本（`gender: "♂"`）：从源中提取 `fatherName` (若无则使用 `sprite`) 作为 `sprite`；提取 `fatherNatures[0]` 作为 `nature`；提取 `fatherStats` 作为 `stats`；提取 `brand` 作为 `brand`；蛋组 `groups` 根据新名字重新获取（或使用源中的蛋组）。
  - 如果目标是母本（`gender: "♀"`）：从源中提取 `motherName` (若无则使用 `sprite`) 作为 `sprite`；提取 `motherNatures[0]` 作为 `nature`；提取 `motherStats` 作为 `stats`；提取 `brand` 作为 `brand`；同理计算 `groups`。
  - *若在 parents Tab 下空白处直接粘贴新建*：默认创建一个母本（`gender: "♀"`），名字取 `sprite`，三围和性格取母方配置，牌子和蛋组取源配置。这是因为蛋窝卡片的精灵名称本质上代表母本精灵。
- **粘贴至精灵蛋 (`EggData`)**：
  - 新精灵蛋名字为最低进化形态，通过 `getLowestStageName(sprite)` 推导。
  - 父母性格：`fatherNature = fatherNatures[0]`，`motherNature = motherNatures[0]`。
  - 父母三围：`fatherStats = fatherStats`，`motherStats = motherStats`。
  - 其它属性：`brand = brand`，`eggSize = ""`，`eggWeight = ""`，产出时间为当前日期。

### 2.2 复制源：父母本卡片 (`ParentPet`)
- **粘贴至蛋窝 (`EggPet`)**：
  - 如果复制源是父本（`gender: "♂"`）：把数据应用到蛋窝卡片的父本部分：`fatherName = sprite`，`fatherNatures = [nature]`，`fatherStats = stats`，`brand = brand`。
  - 如果复制源是母本（`gender: "♀"`）：应用到母本及蛋窝主体：`sprite = sprite`，`motherName = sprite`，`motherNatures = [nature]`，`motherStats = stats`，`brand = brand`。同时根据 `sprite` 重新推导蛋组 `groups`。
- **粘贴至父母本 (`ParentPet`)**：
  - 完全复制（不改动目标卡片的 `gender` 与 `id`）。覆盖 `sprite`, `brand`, `height`, `weight`, `nature`, `stats`, `groups`。
- **粘贴至精灵蛋 (`EggData`)**：
  - 如果复制源是父本：将性格和三围填入精灵蛋的 `fatherNature = nature`, `fatherStats = stats`, 牌子设为 `brand`。
  - 如果复制源是母本：精灵蛋主体名 `sprite = sprite`（由于它是母本，直接作为精灵蛋最低进化形态的输入），`motherNature = nature`, `motherStats = stats`, `brand = brand`。

### 2.3 复制源：精灵蛋卡片 (`EggData`)
- **粘贴至蛋窝 (`EggPet`)**：
  - 蛋窝卡片 `sprite = sprite`（或者推导其最大进化形态，但最安全的做法是直接带入，由用户自愿升级），`brand = brand`。
  - 填充父方与母方性格和三围：`fatherNatures = [fatherNature]`，`motherNatures = [motherNature]`，`fatherStats = fatherStats`，`motherStats = motherStats`。
- **粘贴至父母本 (`ParentPet`)**：
  - 如果目标是父本：覆盖 `nature = fatherNature`，`stats = fatherStats`，`brand = brand`。
  - 如果目标是母本：覆盖 `sprite = sprite`，`nature = motherNature`，`stats = motherStats`，`brand = brand`。
  - *若在 parents Tab 下空白处直接粘贴新建*：默认创建一个母本卡片，名字为 `sprite`，性格为 `motherNature`，三围为 `motherStats`，牌子为 `brand`。
- **粘贴至精灵蛋 (`EggData`)**：
  - 完全复制。除了 `id` 重新生成、产出时间重置为当前时间外，其它字段全部覆盖。

---

## 3. 全局按键注册与输入框拦截

为了避免键盘事件污染正常的文本框编辑，在 `useEffect` 的 `keydown` 监听器中：
```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  const activeEl = document.activeElement;
  if (
    activeEl &&
    (activeEl.tagName === "INPUT" ||
     activeEl.tagName === "TEXTAREA" ||
     activeEl.tagName === "SELECT" ||
     activeEl.getAttribute("contenteditable") === "true")
  ) {
    return; // 放行，保留原本的文字复制粘贴行为
  }

  // 执行卡片的 Ctrl+C / Ctrl+V
};
```
同时，选中卡片的交互通过 `selectedCard` 状态控制，并在 App 最外层容器提供空白点击检测清除选中：
```typescript
const handleGlobalClick = (e: React.MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest(".nest-card, .parent-card, .egg-card")) {
    setSelectedCard(null);
  }
};
```
当卡片处于选中状态时，我们添加醒目的靛蓝色外框以及流光阴影，以展现极佳的微交互体验。
