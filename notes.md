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
