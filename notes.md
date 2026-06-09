# Roco Egg Master 蛋管理中心设计笔记

## 1. 核心数据模型与类型扩展

在 `src/types.ts` 中新增或扩展以下类型：
```typescript
export interface EggData {
  id: string;            // 蛋的唯一主键 (如 egg-uuid)
  sprite: string;        // 精灵名称 (关联精灵头像，例如 "喵喵")
  fatherNature: string;  // 父亲性格
  motherNature: string;  // 母亲性格
  fatherStats: string[]; // 父亲三围
  motherStats: string[]; // 母亲三围
  brand: string;         // 牌子 (大粗、大婉、小粗、小婉、普通等)
  eggSize: string;       // 蛋尺寸 (单位 m，用户输入)
  eggWeight: string;     // 蛋重量 (单位 kg，用户输入)
  produceTime: string;   // 蛋产出时间 (YYYY-MM-DD HH:mm)
}

export interface AccountData {
  pets: EggPet[];
  trades: EggTrade[];
  parents: ParentPet[];
  eggs: EggData[];       // 扩展蛋数据，支持多账号隔离
}
```

## 2. 蛋临界值计算算法

蛋的属性范围来源于 `images/蛋数据/PET_EGG_CONF.json`。数据中的属性：
- `height_low`, `height_high`：以毫米 (mm) 为单位
- `weight_low`, `weight_high`：以克 (g) 为单位

在比对与临界值计算中，我们将这些数值除以 1000 转换为米 (m) 和千克 (kg)，从而保持与输入端和精灵原数据一致。

### 2.1 临界值公式：
- **最大高度** `maxHeight = height_high / 1000`
- **最小高度** `minHeight = height_low / 1000`
- **最大重量** `maxWeight = weight_high / 1000`
- **最小重量** `minWeight = weight_low / 1000`
- **大块头及格线** `giantWeightLine = maxWeight - (maxWeight - minWeight) * 0.02`
- **小不点及格线** `tinyWeightLine = minWeight + (maxWeight - minWeight) * 0.05`

### 2.2 蛋形态标签推导逻辑：
1. **尺寸牌子为大体型** ("大粗", "大婉", "单大块头")：
   - 当 `eggSize >= maxHeight` 且 `eggWeight >= maxWeight` 时，标记为 **“极限大”** (极限蛋)。
2. **尺寸牌子为小体型** ("小粗", "小婉", "单小不点")：
   - 当 `eggSize <= minHeight` 且 `eggWeight <= minWeight` 时，标记为 **“极限小”** (极限蛋)。
3. **其他牌子** (或非体型牌)：
   - 当 `eggSize >= maxHeight` 且 `eggWeight >= giantWeightLine` 时，标记为 **“大块头 (达标)”**。
   - 当 `eggSize <= minHeight` 且 `eggWeight <= tinyWeightLine` 时，标记为 **“小不点 (达标)”**。
   - 如果未达标，计算距离大块头/小不点的临界值（如重量差在及格线 10% 以内），并在卡片上闪烁显示类似 **“差大块头临界值 X kg”** 或 **“差小块头临界值 Y kg”**。

## 3. UI 界面与交互设计

1. **标签页导航**：
   - 新增“蛋管理中心”Tab，点击时展示蛋列表卡片。
2. **卡片结构 (EggCard)**：
   - 顶部：精灵头像、产出时间、删除按钮。
   - 头像下方：精灵蛋名称 (如 "喵喵蛋")，显示系别、组别标签。
   - 标准范围：展示标准蛋尺寸范围 (m) 和重量范围 (kg)，以及孵化时间。
   - 蛋数据：展示输入的蛋尺寸和重量，附带临界值状态徽章（如“极限大”、“差大块头临界值 0.005kg”）。
   - 父母数据：展示父母性格和三围标识。
3. **搜索与过滤栏**：
   - 顶部提供模糊搜索框（支持搜索精灵名）。
   - 筛选选项：
     - 蛋组 (天空组、动物组等)
     - 系别 (草、火、水等)
     - 牌子
     - 极限/临界属性 (“全部”、“极限蛋”、“已达标蛋”、“临界蛋”)
4. **添加/编辑弹窗 (Modal)**：
   - 输入框：
     - 精灵名称（自动联想，基于 `PET_EGG_CONF.json` 中的精灵，并支持显示头像）
     - 父亲性格、母亲性格
     - 父亲三围、母亲三围 (六围复选点击)
     - 牌子选择
     - 蛋尺寸 (m)、蛋重量 (kg)
     - 产出时间 (默认当前时间，提供快捷设置)
   - 当选择完精灵后，在弹窗内实时显示该精灵蛋的标准尺寸重量范围和孵化时间，帮助用户校验输入。

## 4. 自动保存与导入导出兼容

- **自动保存**：`localStorage` 和 Electron 写入的 JSON 中均增加 `eggs` 字段，并在多账号切换、编辑、删除时实时更新。
- **单账号导出**：支持在导出 JSON 中包含 `eggs: EggData[]` 属性。
- **全量多账号导出**：支持 `accountDataMap` 包含所有账号的 `eggs` 记录。
- **老旧备份导入**：若导入的数据中没有 `eggs` 字段，自动补全为 `[]` 空数组，确保向前兼容。
