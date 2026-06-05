# Research Notes: 三围底色优化与长图导出字体大小一致性

## 1. 三围底色优化
- **现状**：之前的修改为了区别于白底卡片，改成了 `bg-rose-100` 等浅饱和对比度背景。但用户反馈依然不够显眼，要求使用“深色阶”。
- **方案**：将原本的 100 阶背景和 300 阶边框升级为 200 阶背景和 400 阶边框。
  - 生命：`bg-rose-200 text-rose-800 border-rose-400 hover:bg-rose-300 shadow-2xs`
  - 物攻：`bg-amber-200 text-amber-900 border-amber-400 hover:bg-amber-300 shadow-2xs`
  - 速度：`bg-emerald-200 text-emerald-800 border-emerald-400 hover:bg-emerald-300 shadow-2xs`
  - 魔攻：`bg-purple-200 text-purple-800 border-purple-400 hover:bg-purple-300 shadow-2xs`
  - 物防：`bg-blue-200 text-blue-800 border-blue-400 hover:bg-blue-300 shadow-2xs`
  - 魔防：`bg-cyan-200 text-cyan-800 border-cyan-400 hover:bg-cyan-300 shadow-2xs`
  - 无：`bg-slate-200 text-slate-500 border-slate-350 hover:bg-slate-300`
- **对比度效果**：在白色卡片背景上形成了非常强烈的色彩色阶对比，使得玩家一眼就能分辨六围对应的属性。

## 2. 长图导出字号放大问题
- **现状分析**：
  1. 在 `App.tsx` 中的 `handleExportLongImage` 函数中，对 `<input>` 和 `<select>` 在克隆节点中替换为静态 `<div>`，但直接使用了硬编码的最小高度（`minHeight` 为 28px 或 24px），以及硬编码的 padding。
  2. 原本的 React 表单控件可能从 User Agent Stylesheet 或全局 CSS 继承了较小的字号（如 `text-[10px]` 或 `text-xs`），但替换成 `<div>` 后，如果没有显式指定，就回退到了父容器或全局的较大字号（如 `text-sm` 或 `text-base`），导致文字被放大。
  3. 强行设定 `width: 100%` 会拉伸一些本应为固定宽度的输入框（如现蛋数量输入框 `w-10`）。
- **方案**：
  1. 利用 `window.getComputedStyle(originalEl)` 精确读取原页面表单元素的实际计算样式。
  2. 将 `fontSize`、`fontWeight`、`lineHeight`、`color`、`padding`、`height`、`minHeight`、`width` 等布局和文字样式动态赋予静态 `<div>`，实现像素级还原，确保长图文字字号、高矮与界面看到的一模一样，完全没有放大或拉伸现象。

## 3. 我的精灵蛋窝中心与自建换蛋需求中心标题一致性
- **分析**：目前蛋窝中心标题使用 `text-sm`，换蛋需求中心使用 `text-lg`。
- **解决**：两者一律提升为 `text-lg font-bold text-slate-800`，说明文字统一为 `text-xs text-slate-500`，图标容器大小、右侧 Badge 大小等样式元素一律拉齐。

## 4. 蛋窝卡片不选“有现蛋”时太空问题
- **分析**：没有现蛋数量输入框后，卡片高度减少且底盘变空。
- **解决**：在非“有现蛋”时渲染一个优雅的状态兜底信息条（带有匹配主题底色和呼吸点/提示圆点），文字具有洛克王国孵蛋趣味性，使卡片保持丰满。

## 5. 精灵名紧贴头像，系别等距排版
- **分析**：左列使用 `flex-col justify-between` 导致间距拉大，且各元素位置因卡片高矮而抖动。
- **解决**：将头像、名字输入框、系别图标组合包进一个独立的 Flex-col 容器中，设定统一的 `gap-1.5`，并将名字输入框 padding 归零以实现三者之间的绝对等间距，紧凑不散架。

## 6. 牌子底色显眼度与“单大块头”更名优化
- **背景**：用户反馈原本牌子的显示太淡，看不清。同时，需要将原本的“无牌”选项改名为“单大块头”。
- **优化方案**：
  1. 将 types.ts 中的 `BRAND_OPTIONS` 从 `["大粗", "大婉", "小粗", "小婉", "单牌", "无牌"]` 改为 `["大粗", "大婉", "小粗", "小婉", "单牌", "单大块头"]`。
  2. 针对六种牌子在 `src/petHelper.ts` 的 `getBrandStyle` 中配置极其醒目的底色和对比边框：
     - 大婉：`bg-rose-100 border-rose-300 text-rose-800 font-bold shadow-xs`
     - 大粗：`bg-amber-100 border-amber-300 text-amber-900 font-bold shadow-xs`
     - 单牌：`bg-emerald-100 border-emerald-300 text-emerald-800 font-bold shadow-xs`
     - 小婉：`bg-blue-100 border-blue-300 text-blue-800 font-bold shadow-xs`
     - 小粗：`bg-purple-100 border-purple-300 text-purple-800 font-bold shadow-xs`
     - 单大块头：`bg-slate-100 border-slate-300 text-slate-800 font-bold shadow-xs`
  3. 修改 `App.tsx` 中的状态初始化和数据迁移（原本默认值由“无牌”升级为“单大块头”）。
  4. 优化 `App.tsx` 中换蛋需求发布表单中的牌子选择按钮，直接应用 `getBrandStyle(brand)` 的颜色样式，并对被选中的按钮添加高亮缩放及 `ring-2 ring-indigo-500` 效果。
  5. 优化顶部筛选下拉框 `select`，在选择特定牌子时，使用 `getBrandStyle(filterBrand)` 赋予其对应的强对比颜色，未选择时采用常规白色背景。
  6. 优化统计图表，将原本的五列改为六列（`grid-cols-6`），加入“单大块头”选项，并设定对应的高级银灰色背景。

## 7. 状态底色醒目度优化
- **背景**：用户反馈“状态也要有不同的底色”。
- **分析**：
  1. 原本的 `getStatusStyle` 函数中的状态字符串为老版本状态字符串（如 `"正在孵"`, `"已撤窝"`, `"投资中"`），而系统目前实际使用的是 `"有现蛋"`, `"正在孵，可预约"`, `"已撤窝，要提前换产线"`, `"接投资"`。这导致除“有现蛋”外，其他状态全部回退到了灰色的 `default` 样式，显得极度暗淡。
  2. 蛋窝卡片底部渲染的兜底状态信息条在判断状态时，也错误地匹配了老版字符串，导致除了“有现蛋”外所有状态都显示为默认的“已就绪/当前蛋窝状态已就绪”蓝色条带。
- **方案**：
  1. 在 `src/petHelper.ts` 的 `getStatusStyle` 中为四种真实状态分配鲜艳高对比度的底色：
     - 有现蛋：`bg-amber-100 border-amber-300 text-amber-800 font-bold shadow-xs` (明亮金黄)
     - 正在孵，可预约：`bg-sky-100 border-sky-300 text-sky-800 font-bold shadow-xs` (明亮天空蓝)
     - 已撤窝，要提前换产线：`bg-orange-100 border-orange-300 text-orange-800 font-bold shadow-xs` (警告橙色)
     - 接投资：`bg-purple-100 border-purple-300 text-purple-800 font-bold shadow-xs` (明亮紫)
  2. 在 `src/App.tsx` 的顶部状态筛选下拉框中引入 `getStatusStyle(filterStatus)` 动态样式，使得选中某个状态时，筛选框呈现亮眼的对比背景。
  3. 在 `src/components/SortableCard.tsx` 和 `src/components/SortableRow.tsx` 的下拉选项（`<option>`）上注入相应的状态背景色。
  4. 修复 `src/components/SortableCard.tsx` 中底部兜底提示条的状态匹配条件，使其与真实的状态字符串一一对应，恢复“孵化中”、“已撤窝”、“投资中”等状态的呼吸灯提示和描述文字，且各状态文字的条带背景颜色与状态下拉框的亮眼底色保持高级的色阶协调。
