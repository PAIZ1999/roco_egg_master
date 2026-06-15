# Research Notes: 暗色模式细节补全与长图导出适配分析

## 模型信息
- 模型名称：Antigravity
- 模型大小：超大参数规模
- 模型类型：代码与智能体双模态模型
- 修订版本：v6.0-Compacted-Resume

---

## 1. 样式盲区问题与定位

### 1.1 三围选择图标底盘白块
在以下三个核心组件中：
- `src/components/SortableCard.tsx` (L58)
- `src/components/EggCard.tsx` (L56)
- `src/components/ParentCard.tsx` (L56)
各自实现了一个 `getStatBadgeStyle` 方法。
在亮色下，三围（生命、物攻、速度、魔攻、物防、魔防）使用高饱和度亮底渲染（如 `bg-rose-200 text-rose-800`）。
但在暗色模式下，它们缺失了任何 `dark:` 变体适配，导致在暗黑的卡片背景下渲染出极其突兀的圆形大白块。
**解决方案**：
统一适配其 colors 字典，使之在暗色模式下显示为优雅、低饱和度的柔和背景，并拉高文本对比度：
```typescript
"生命": "bg-rose-200 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-400 dark:border-rose-900/60 hover:bg-rose-300 dark:hover:bg-rose-900/80 shadow-2xs",
"物攻": "bg-amber-200 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-400 dark:border-amber-900/60 hover:bg-amber-300 dark:hover:bg-amber-900/80 shadow-2xs",
"速度": "bg-emerald-200 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-400 dark:border-emerald-900/60 hover:bg-emerald-300 dark:hover:bg-emerald-900/80 shadow-2xs",
"魔攻": "bg-purple-200 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-400 dark:border-purple-900/60 hover:bg-purple-300 dark:hover:bg-purple-900/80 shadow-2xs",
"物防": "bg-blue-200 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-400 dark:border-blue-900/60 hover:bg-blue-300 dark:hover:bg-blue-900/80 shadow-2xs",
"魔防": "bg-cyan-200 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border-cyan-400 dark:border-cyan-900/60 hover:bg-cyan-300 dark:hover:bg-cyan-900/80 shadow-2xs",
```

### 1.2 自建换蛋需求中心表单细节遗漏
在 `src/App.tsx` 中：
- **精灵名称的 Label (L2890)**: `className="text-xs font-bold text-slate-700"` 缺少 `dark:text-slate-300`。
- **精灵头像容器 (L2902)**: `className="w-[38px] h-[38px] bg-white ... border border-slate-200 ..."` 缺少 `dark:bg-slate-800 dark:border-slate-700`，导致在暗色模式下也是一个大白块。
- **属性图标容器 (L2913)**: 缺少 `dark:bg-slate-800 dark:border-slate-700`。
**解决方案**：
在这些元素上补上对应的 `dark:` 前缀。

### 1.3 大背景不透光与统一
在三个 Tab 面板下：
- 页面底座与 footer 等采用 `bg-slate-50/50 dark:bg-slate-950/20`。
- 半透明的 `dark:bg-slate-950/20` 在一些特殊浏览器上可能无法完美消除背后的透底。
**解决方案**：
将底盘的外壳在暗色下设为完全不透明的 `dark:bg-slate-950`，保证整个底板风格统一。

---

## 2. 长图导出支持暗色模式

在 `src/App.tsx` 的 `generateLongImage` 方法中：
- 之前强制在渲染前剥离了 `document.documentElement` 的 `dark` 类，渲染后再行恢复：
  ```typescript
  const isCurrentlyDark = document.documentElement.classList.contains("dark");
  if (isCurrentlyDark) {
    document.documentElement.classList.remove("dark");
  }
  ```
  这直接导致导出的长图一定是亮色风格。
- 现在用户要求**长图导出支持暗色模式**。
**解决方案**：
- 彻底移除剥离/恢复 `dark` 的这几行代码，允许克隆节点自然继承当前页面的暗色/亮色状态。
- 为 `html2canvas` 传入动态的 `backgroundColor`：
  ```typescript
  const isCurrentlyDark = document.documentElement.classList.contains("dark");
  const exportBgColor = isCurrentlyDark ? "#020617" : "#f8fafc";
  ```
  其中 `#020617` 是 `bg-slate-950` 的十六进制颜色，这能保证在暗色模式下导出的图拥有完美的黑底底座。

---

## 3. 默认开启暗色模式

在 `src/App.tsx` 中，`theme` 的 useState 初始化：
```typescript
const [theme, setTheme] = useState<'light' | 'dark'>(() => {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
});
```
**解决方案**：
为了让应用在无缓存和无 prefers 状态下默认处于暗色模式，将兜底的 `return 'light'` 修改为 `return 'dark'`。
由于 `localStorage.getItem` 依然有效，用户可以自由切换回亮色模式并持久化，这能提供最高灵活性且不破坏首屏加载逻辑。
