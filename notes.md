# Research Notes: 迁移至最新精灵数据源 (pets_data.json)

## 模型信息
- 模型名称：Gemini 3.5 Flash (High)
- 模型大小：动态
- 模型类型：高级Agentic AI编码助手
- 修订版本：v6.0-Antigravity

---

## 1. 脏数据分析与清洗
在对新数据源 `洛克精灵数据/pets_data.json` 进分析时，发现“月亮砣”（ID 238）的蛋组数据包含脏字符串：
`"egg_groups": ["海洋组身高：0.08-0.1引体重0.9450一"]`
在 `petHelper.ts` 的解析字典中，必须对其进行规整转换：
```typescript
const cleanEggGroups = (groups: string[]): string[] => {
  return groups.map(g => {
    if (g.includes("海洋组")) return "海洋组";
    // 其它蛋组清洗
    return g;
  });
};
```

---

## 2. 补全系别（Type）数据
由于新数据源 `pets_data.json` 缺少系别信息，原有的系别 Badge 图标面临失效。为此，我们通过 python 脚本从老版本 `洛克王国_蛋组精灵表.json` 提取了所有 350 个精灵的系别映射，并对 25 个未匹配名称（如迪莫、帕尔萨斯等）按实际属性进行了人工补全，生成了 `src/pet_types.json` 映射文件。
解析时直接按以下形式匹配：
`types = petTypes[name] || petTypes[baseName] || []`

---

## 3. 身高体重极限及临界计算重构
原有的 `allGuideData` 和 `petEggConf` 高度是毫米（mm）、重量是克（g），在代码中需要除以 100 和 1000。
新 `pets_data.json` 中的数据（无论在 `egg_data` 还是 `forms` 里）都已经是米（m）和千克（kg）的浮点数值，不需要再进行解析 `~` 字符范围以及除以 100/1000 的操作，这显著简化了计算函数。
- **精灵身高体重**：
  直接读取形态的 `height_min`, `height_max`, `weight_min`, `weight_max`。
- **精灵及格线与极值**：
  直接读取形态的 `giant_weight_line`, `tiny_weight_line`。
- **精灵蛋身高体重及极值**：
  直接读取顶层 `egg_data` 的 `height_min`, `height_max`, `weight_min`, `weight_max`, `giant_weight_line`, `tiny_weight_line`。

---

## 4. 头像文件名匹配 (getSpriteFileName)
老代码是精确文件名匹配 `精灵名.png`，现在多形态精灵图片为原样，而基础精灵图片为带 `id-` 前缀。
为此，新图片的 `filename` 字段会被解析为首选：
1. 优先使用 `pets_data.json` 中配置好的 `filename`。
2. 若无或匹配不到，再使用 `sprite_files.json` 的模糊前缀和后缀寻找（如 `冬羽雀_夏天的样子.png`）。

---

## 5. 新图片物理拷贝
需要运行 Node 脚本或 Python 脚本将 `洛克精灵数据/*.png` 复制到 `images/sprites/` 目录下。
图片列表大约有 151 个。拷贝后需更新 `src/sprite_files.json` 清单。
