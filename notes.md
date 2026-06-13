# Research Notes: 暗色模式主题切换方案设计

## 模型信息
- 模型名称：Gemini 3.5 Flash (High)
- 模型大小：中等参数量
- 模型类型：多模态对话模型
- 修订版本：v6.0 (RIPER-5 + Manus + MCP + Skills)

---

## 1. 技术背景与 Tailwind CSS v4 暗色模式
在 Tailwind CSS v4 中，暗色模式默认支持媒体查询和 `class` 机制。
给顶层网页节点 `html` 注入 `class="dark"` 后，所有带有 `dark:` 前缀的 Tailwind 样式（如 `dark:bg-slate-900`）就会在对应的暗色模式下生效。

### 方案设计
- **状态管理**：在 `App.tsx` 中定义 `theme` 状态：
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
- **挂载同步**：使用 `useEffect` 实时将 `theme` 同步到 `document.documentElement`：
  ```typescript
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  ```
- **切换入口**：在页面 Banner 区域的 Credits 旁边，增加一个高颜值的 Moon/Sun 切换按钮，配以微妙的 hover 和旋转过渡动效。
- **持久化**：使用 `localStorage` 保存用户的偏好设置。

---

## 2. 前端组件颜色适配清单

### 2.1 全局背景与容器 (`App.tsx`)
- 页面底层：`bg-slate-50` -> `bg-slate-50 dark:bg-slate-950`，`text-slate-900` -> `text-slate-900 dark:text-slate-100`。
- 主面板卡片：`bg-white` -> `bg-white dark:bg-slate-900`，`border-slate-100` -> `border-slate-100 dark:border-slate-800`。
- 统计卡片：`bg-white` -> `bg-white dark:bg-slate-850/50`，`border-slate-100` -> `border-slate-100 dark:border-slate-800`。

### 2.2 筛选与过滤区 (`App.tsx`)
- 过滤行：`bg-slate-50/20` -> `bg-slate-50/20 dark:bg-slate-900/40`。
- 搜索输入框：`bg-white` -> `bg-white dark:bg-slate-800`，`text-slate-900` -> `text-slate-900 dark:text-slate-150`。
- 下拉选择菜单（Select）：`bg-white` -> `bg-white dark:bg-slate-800`，`text-slate-700` -> `text-slate-700 dark:text-slate-200`，`border-slate-200` -> `border-slate-200 dark:border-slate-700`。

### 2.3 蛋窝卡片 (`SortableCard.tsx`)
- 卡片主体：`bg-white` -> `bg-white dark:bg-slate-850`，`border-slate-200/80` -> `border-slate-200/80 dark:border-slate-800`。
- 性格、窝点详情输入框：在 Focus 时，改变 `focus-within:bg-white` -> `focus-within:bg-white dark:focus-within:bg-slate-800`。
- 蛋数操作按钮与指示色带在暗色下的高对比度。

### 2.4 父母本仓库与精灵蛋管理卡片 (`ParentCard.tsx`, `EggCard.tsx`)
- 卡片主体：`bg-white` -> `bg-white dark:bg-slate-850`，`border-slate-200/80` -> `border-slate-200/80 dark:border-slate-800`。
- 按钮、输入框、下拉框以及边框全部映射到 `dark:bg-slate-800` 和 `dark:border-slate-700`，确保不会出现刺眼的亮白色输入框。

### 2.5 拼音 Autocomplete 下拉菜单 (`Autocomplete.tsx`)
- 下拉浮窗：`bg-white` -> `bg-white dark:bg-slate-800`，悬浮高亮 `hover:bg-slate-50` -> `hover:bg-slate-50 dark:hover:bg-slate-700`。
- 文本框与拼音提示文本颜色适配。

---

## 3. 长图导出时的特殊处理
当用户选择“导出长图”时，系统会在 `document.body` 增加 `.exporting` 类，并生成一个离线 Clone 的 DOM 树。
为了保证导出的长图在打印和分享时有最好的对比度，**长图应当默认使用亮色主题进行渲染**，以防止暗色长图在打印时耗费墨水，或者在不同显示器上看不清。
- 解决方案：在克隆 DOM 树的导出代码中，在克隆出的树中移除 `dark` 类（或者强制设置其为亮色环境），保证生成的 canvas 依然使用高对比度的亮色。
- 我们可以在 `App.tsx` 的 `html2canvas` 导出逻辑（在 `wrapper` 或 `clone` 层级上）显式去除 `dark` 类。这样即使当前是暗色模式，克隆出来的 DOM 也是以亮色主题生成。
