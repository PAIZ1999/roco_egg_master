# Research Notes: 将系别合并入最新数据源 (pets_data.json)

## 模型信息
- 模型名称：Gemini 3.5 Flash (High)
- 模型大小：动态
- 模型类型：高级Agentic AI编码助手
- 修订版本：v6.0-Antigravity

---

## 1. 物理合并系别数据
我们需要读取 `src/pet_types.json` 里的系别映射，并将其写入 `洛克精灵数据/pets_data.json`。
合并逻辑：
- 顶层精灵对象增加 `"types": pet_types[pet.name] || []` 字段。
- `forms` 列表中的每个形态对象增加 `"types": pet_types[form.name] || pet_types[getBasePetName(form.name)] || []` 字段。
这样就使得每个子形态和顶层精灵都拥有了系别属性，完全满足项目原有的系别展示和过滤功能！

---

## 2. 代码解析重构
重构 `src/petHelper.ts`：
- 彻底移除对 `src/pet_types.json` 的导入。
- 直接读取新 JSON 中的 `form.types` 或 `pet.types`：
  `const types = form.types || []`。
  这一机制确保了即使数据源更改，前端获取系别也是全动态的，且无需任何多余的临时映射文件。
- 物理删除 `src/pet_types.json`，清理冗余。
