# Roco Egg Master 精灵蛋窝卡片排版优化研究笔记

## 1. 核心改进目标与设计原则

> [!IMPORTANT]
> 针对用户提出的蛋窝中心卡片排版不够紧凑、文字偏小、牌子/极限/状态未对齐以及组别底色缺失等痛点，制定以下重构原则：
> 1. **一行合并，精细分栏**：将“牌子 (brand)”、“有无极限蛋 (isLimit)”以及“蛋窝状态 (status)”三个原本占两行的配置合并到同一行，使用 `grid grid-cols-12` 布局，并分配 3:4:5 的列宽比例，以容纳最长的状态文本。
> 2. **组别区块底色化与标签 Badge 化**：将原本悬浮在白底上的“宠物蛋组”配置行，改造成带有 `bg-slate-50/70` 浅灰色底盘的卡片区块，并且将“宠物蛋组”标签本身改造成带有精美边框和高对比底色的胶囊型 Badge，与父/母方配置标签呼应。
> 3. **紧凑间距与放大字号**：
>    - 缩小右侧栏组件之间的 Gap 间距（如从 `gap-1.5` 微调为 `gap-1` 或 `gap-1.25`）。
>    - 调大所有 Select 下拉菜单的文字大小（从 `text-[10px]` 提升到 `text-xs`，并且使用 `font-bold` 或 `font-black`），同时调大性格输入框的文本大小（`text-[13px]`）。
> 4. **保持 1200px 导出一致性**：由于 1200px 长图导出时使用克隆 DOM 容器且强制设宽，所涉及的所有 Tailwind 响应式及布局更改必须完美兼容 PC/1200px 克隆节点的渲染逻辑。

## 2. 详细重构细节方案

### 2.1 牌子/极限蛋/状态一列化 (同一行)
在 `SortableCard.tsx` 中，合并原本独立的 Brand/Limit Grid 与 Status Grid：
- **容器样式**：
  `grid grid-cols-12 gap-1.5 bg-slate-50/70 p-1.5 rounded-lg border border-slate-100/60`
- **列分配**：
  - **牌子** (`col-span-3`):
    - 标签: `text-[9px] font-bold text-slate-400 select-none`
    - select: `text-xs font-bold py-0.5 px-0.5 ...`
  - **极限蛋** (`col-span-4`):
    - 标签: `text-[9px] font-bold text-slate-400 select-none`
    - select: `text-xs font-bold py-0.5 px-0.5 ...`
  - **状态** (`col-span-5`):
    - 标签: `text-[9px] font-bold text-slate-400 select-none`
    - select: `text-xs font-bold py-0.5 px-0.5 ...`

### 2.2 组别区块底色与 Badge 增强
在 `SortableCard.tsx` 中，重构宠物蛋组行的结构：
- **容器样式**：
  `flex items-center justify-between gap-1.5 bg-slate-50/70 p-1.5 rounded-lg border border-slate-100/60`
- **宠物蛋组 Label 样式**：
  `text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/50 select-none shrink-0`
- **下拉框 select 样式**：
  `text-xs font-bold py-0.5 px-2.5 ...`
- **操作按钮** (加减蛋组) 样式保持原有并微调间距。

### 2.3 间距与字号调优
- **主要容器**: 将 `sm:col-span-8 flex flex-col justify-start gap-1.5` 的 `gap-1.5` 改为 `gap-1` 以实现极致紧凑。
- **性格输入框 Autocomplete**: 将 `inputClassName` 中的 `text-xs` 改为 `text-[13px] font-semibold`。
- **三围状态文字**: 若三围隐藏，说明条与显示按钮的字号保持 `text-xs`，优化其内边距。
