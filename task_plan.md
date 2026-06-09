# Task Plan: 洛克王国新增“蛋管理中心”标签页

## Goal
新增“蛋管理中心”标签页，以卡片形式记录和管理玩家的宠物蛋数据。卡片展示精灵头像、父母性格三围、牌子、蛋尺寸、蛋重量以及产出时间。头像下方显示精灵蛋名字、系别、组别和标准蛋的尺寸重量范围。支持蛋的临界值（极限蛋等）计算与高亮，支持模糊搜索与多重筛选，并与现有的多账号系统和自动保存功能无缝集成。

## MCP Status
- [ ] memory 检索完成
- [ ] context7/deepwiki 查询完成
- [ ] sequential-thinking 分析完成
- [ ] memory 知识存储完成

## Phases
- [x] Phase 1: 规划与准备
  - [x] 解析 `PET_EGG_CONF.json` 的数据结构与计算公式
  - [x] 更新 `task_plan.md` 与 `notes.md`
  - [x] 提交 `implementation_plan.md` 供用户审查
- [ ] Phase 2: 数据结构扩展与兼容迁移
  - [ ] 在 `src/types.ts` 定义 `EggData` 接口并扩展 `AccountData`
  - [ ] 在 `src/App.tsx` 引入 `eggs` 状态，更新多账号保存、读取、导入导出逻辑
- [ ] Phase 3: 蛋数据临界值计算与数据工具开发
  - [ ] 编写蛋配置加载器，支持加载 `PET_EGG_CONF.json`
  - [ ] 编写蛋尺寸重量极限与临界值计算逻辑，将 mm（除以100）/ g（除以1000）转换为 m / kg 进行比对
- [ ] Phase 4: 蛋管理中心卡片及表单 UI 开发
  - [ ] 创建 `src/components/EggCard.tsx` 组件，实现高保真磨砂玻璃卡片视觉
  - [ ] 在 `App.tsx` 中编写蛋的添加/编辑模态框，支持精灵搜索自动联想，且自动展示所选精灵蛋的标准范围及孵化时间
- [ ] Phase 5: 搜索过滤与排序交互
  - [ ] 实现蛋列表的模糊搜索（根据名称、拼音、系别等）
  - [ ] 实现根据牌子、组别、极限属性、产出时间等组合筛选
- [ ] Phase 6: 联调测试与 Electron 打包
  - [ ] 联调测试多账号切换、数据迁移、自动保存与导入导出
  - [ ] 执行 `npm run dev` 和 `npm run electron:build` 确保打包无误

## Key Questions
1. 蛋的临界值计算公式是怎样的？
   - 答：蛋的计算公式与精灵完全一致：
     - 大块头及格线: `maxWeight - (maxWeight - minWeight) * 0.02`
     - 小不点及格线: `minWeight + (maxWeight - minWeight) * 0.05`
     - 极限大：处于大体型牌下且尺寸和重量均达到最大值。
     - 极限小：处于小体型牌下且尺寸 and 重量均达到最小值。
     - 非体型牌达标：高度达到最大（或最小），重量达到大块头（或小不点）及格线。
     - 差临界值：非体型牌下，重量差在 10% 以内的临界状态。
2. 蛋数据的持久化存储与多账号怎么整合？
   - 答：将 `eggs` 数组作为 `AccountData` 的一个新字段，切换账号时同步更新 `eggs` 状态，并配合现有的 `useEffect` 自动存盘，兼容旧的单账号备份。

## Decisions Made
- **单位转换**：读取 `PET_EGG_CONF.json` 里的 `height_low` 和 `height_high`，除以 100 转换为米（m）（例如 23mm 对应 0.23m）；重量 `weight_low` 和 `weight_high` 除以 1000 转换为千克（kg）。用户输入和卡片显示统一使用 m 和 kg。
- **页面设计**：在 App.tsx 的 Tab 导航中新增“蛋管理中心”按钮，点击后渲染对应的卡片网格和筛选操作栏，交互体验和原有蛋窝/父母本页面保持高度统一。

## Errors Encountered
- 暂无

## Status
**Currently in Phase 1** - 已提交实现计划，正在等待用户对转换公式及方案进行授权确认。
