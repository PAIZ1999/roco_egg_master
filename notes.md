# Notes: 精灵/蛋数据查询与行商模块迁移设计笔记

## 1. 拼音库依赖
- 迁移自 `rocoqqbot` 的模糊查找依赖 `pinyin-pro` 的全拼和首字母转换。
- 我们将在项目目录执行 `npm install pinyin-pro`，并在 `queryHelper.ts` 中直接 `import { pinyin } from 'pinyin-pro'`。

## 2. 预测计算算法与数据
- 预测算法核心逻辑：马氏距离多元高斯似然算法。
- 数据依赖：
  1. `egg_chart_data.json`：高斯分布的均值、方差等参数。
  2. `pets_data.json`：精灵的形态、进化链、系别和蛋的基础极值。
  3. `pets_race_data.json`（我们从 `rocoqqbot` 复制过来，以便支持精灵种族资质大表和资质六围展示！等等，在精灵数据查询中展示六围极具观赏性！）。
- 我们需要将 `rocoqqbot` 的 `pets_race_data.json` 和 `src/egg_chart_data.json` 复制到主项目的 `src` 下。

## 3. 远行商人抓取逻辑
- 页面：`https://www.onebiji.com/hykb_tools/comm/lkwgmerchant/preview.php?id=1&immgj=0`
- 数据格式：HTML
- 跨域解决方案：主进程中存在 `window.electronAPI.httpGet(url)`。虽然它会尝试 `JSON.parse` 并返回 `success: false`，但它会通过 `raw` 字段原样带回 HTML 内容。
- 前端解析：在 `merchantHelper.ts` 中解析 `raw` HTML，使用正则表达式提取商品项目，生成商品 JSON 供悬浮窗使用。
- 悬浮窗设计：
  - 炫酷毛玻璃卡片（暗色背景，磨砂玻璃效果，带呼吸灯状态）。
  - 右下角或者侧边浮动按钮，点击可以折叠/展开，并有红点提示（如果数据已更新）。
  - 展示商品大头像、名称、价格（如 100 洛克钻）、限购情况，以及当前的时段（8-12点，12-16点，16-20点，20-24点）。

## 4. 迁移文件清单
1. [NEW] `src/egg_chart_data.json` (来自 `rocoqqbot/src/egg_chart_data.json`)
2. [NEW] `src/pets_race_data.json` (来自 `rocoqqbot/pets_race_data.json`)
3. [NEW] `src/queryHelper.ts` (基于 `rocoqqbot/src/query.js` 转换的 TypeScript 查询助手)
4. [NEW] `src/merchantHelper.ts` (前端行商 HTML 解析助手)
5. [NEW] `src/components/MerchantFloatWidget.tsx` (远行商人悬浮窗组件)
6. [MODIFY] `src/App.tsx` (添加 Tab "dataQuery"，引入查询组件与悬浮窗组件)
