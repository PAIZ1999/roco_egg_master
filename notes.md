# Roco Egg Master 父母本管理中心设计研究笔记

## 1. 核心改进目标与设计原则

> [!IMPORTANT]
> 针对用户提出的新增“父母本管理中心”，支持单独录入父本与母本卡片，录入身高、体重，选择单个性格、三围，并支持自动配组一键导入的功能，制定以下设计原则：
> 1. **Tab 标签导航体系**：在主界面 Banner 以下，新增一个充满洛克王国魔法风格、采用玻璃拟态 (Glassmorphism) 效果的 Tab 切换控件。当处于“父母本管理中心”Tab 时，显示父母本相关内容；当处于原“蛋窝中心”Tab 时，显示蛋窝和需求内容。
> 2. **父母本独立卡片库**：
>    - 界面分为“♂️ 父本库 (Male Library)”与“♀️ 母本库 (Mother Library)”两栏网格布局。
>    - 卡片内提供宠物头像、中文名字、系别图标、品质牌子下拉框。
>    - 每一个卡片提供一个“勾选框”控制是否参与配对，以及右上角“删除”按钮。
> 3. **身高体重录入**：
>    - 在卡片内新增两个带有图标的输入框。
>    - **身高输入框**：左侧带有尺子图标 (Lucide `Ruler`)，右侧显示单位 `m`。
>    - **体重输入框**：左侧带有秤砣图标 (Lucide `Weight`)，右侧显示单位 `kg`。
> 4. **性格单选与三围自选复用**：
>    - **性格**：每个卡片仅指定一个性格，通过 Autocomplete 进行模糊搜索选择。在一键导入蛋窝中心时，生成的 `EggPet` 性格数组中填充单性格元素，即 `[parent.nature]`。
>    - **三围**：展示 3 个圆形徽章，点击弹出隐式 select 供选择 6 围属性（或“无”）。
> 5. **智能配对与一键导入**：
>    - **规则 1**：父本与母本有至少一个相同的蛋组（蛋组交集非空）：`father.groups.some(g => mother.groups.includes(g))`。
>    - **规则 2**：同牌子的父母才能生出同牌子的蛋：`father.brand === mother.brand`。
>    - **规则 3**：生出来的蛋的精灵类型随母本：`egg.sprite = mother.sprite`。
>    - 实时计算所有被勾选的父本与母本之间的笛卡尔积配对组合，如果满足上述 3 个规则，则在配对面板中展示，并提供“一键导入到蛋窝”按钮。
>    - 导入后，自动在 `pets` 中添加该记录，并弹出 Toast 提示。

## 2. 数据流与持久化方案

在 `src/types.ts` 中定义 `ParentPet`：
```typescript
export interface ParentPet {
  id: string;
  gender: "male" | "female";
  sprite: string;
  brand: string;
  height: string; // m
  weight: string; // kg
  nature: string; // 单个性格
  stats: string[]; // 3围
  groups: string[]; // 蛋组
  checked?: boolean;
}
```

在 `src/App.tsx` 中做如下状态绑定与同步：
- 增加状态：`const [parents, setParents] = useState<ParentPet[]>([]);`
- 在 `loadLocalData` 阶段，从 JSON 中读取 `parents` 数组，如果为空则设为空数组。
- 在 `useEffect` 自动存盘逻辑中，将 `parents` 作为 `saveData` 的一个字段（如 `saveData({ pets, trades, parents })`）传给 Electron 主进程，利用原有的序列化逻辑存盘。同时写入 `roco_egg_parents_v1` 做 localStorage 备份。
- 实现 App 级别的导入导出 JSON 支持父母本数据。
- 限制 html2canvas 长图导出：在克隆 DOM 时，仅在 `activeTab === 'nest'` 时可用，或者在克隆时主动过滤掉父母本 DOM。

## 3. UI 界面与交互细节

### 3.1 尺子与秤砣图标选择
- **身高尺子**：使用 Lucide 的 `Ruler` 图标。
- **体重秤砣**：使用 Lucide 的 `Weight` 图标（代表秤砣或砝码重物）。

### 3.2 卡片 Autocomplete 精灵匹配
- 用户输入宠物名字时，使用项目现有的 `ALL_PET_NAMES` 模糊匹配。
- 选择宠物后，调用 `getPetDetails(name)` 自动获取其系别与所属的 `groups`，并填充到卡片的 `groups` 中，从而参与配对计算。
