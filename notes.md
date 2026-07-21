# Research Notes: 大容量数据导入卡死与保存丢失分析及优化方案

## 1. 核心问题定位

### 1.1 全选父母+母本导致软件卡死
在 `src/App.tsx` 中，存在一个计算并显示所有可用父母本繁育配对的逻辑：
- 父母本配对是通过 `getPairings()` 函数计算的，它是对已勾选的父本 (`checkedFathers`) 和母本 (`checkedMothers`) 执行双重嵌套循环（笛卡尔积）。
- **问题 A**：虽然 `getPairings` 使用了 `useCallback`，但我们在 `src/App.tsx` 的 JSX Render 部分（第5571行起）是**直接且同步**地以 `const allPairings = getPairings()` 执行，且随后直接在渲染中做大量的去重、筛选和分组操作：
  - `allPairings.flatMap(p => p.matchingGroups)` 展平蛋组并去重。
  - `allPairings.map(p => p.brand)` 对牌子进行去重。
  - `allPairings.filter(...)` 进行筛选过滤。
  - 循环 `filteredPairings` 执行按子代精灵的分组操作。
  这意味着，**每次页面的 React 状态发生任意改变**（例如在输入框打字、或者展开聊天框、甚至仅仅改变某只精灵的蛋数等无关状态），都会在主线程同步触发这个上万次甚至几十万次的循环与过滤，直接导致 UI 假死与主线程阻塞。
- **问题 B**：未设置安全保护阈值。当用户导入 1003 只精灵并全选父母本时，假定有 500 对父本和 500 对母本，两两配对会产生 $500 \times 500 = 250,000$ 组配对！主线程在渲染过程中直接执行 25万次的嵌套配对计算、去重和过滤，会让浏览器内存和计算资源瞬间耗尽，引起应用彻底无响应。

### 1.2 退出/重启后数据没有保存
系统虽然拥有以下两个保存机制：
- **防抖保存**：任何关键数据改变后，会在 500ms 后异步调用 `executeSave` 写入 localStorage 和 Electron 本地文件。
- **退出保存**：在 `window` 监听 `beforeunload`，在退出时同步调用 `executeSave` 存盘。
然而：
- 当用户全选父母本后，JS 主线程彻底卡死，防抖定时器（`setTimeout`）根本无机会被调度运行。
- 由于卡死，用户无法通过软件的正常关闭按钮退出，而是采用任务管理器强制结束进程（或 Electron 主进程超时杀掉渲染进程）。这种非正常关闭**完全不会触发 beforeunload 事件**。
- 因此，内存中刚刚导入的 1003 只精灵状态还没来得及同步到本地文件就随着进程被强杀而彻底丢失。

---

## 2. 优化方案设计

### 2.1 性能与卡死优化（熔断与强力缓存）
1. **使用 `useMemo` 缓存全部配对中间态**：
   - 将 `allPairings` 的调用包裹在 `useMemo` 中，仅依赖于 `getPairings` 本身（其依赖于 `parents` 数组）。
   - 将 `allPairGroups` 和 `allPairBrands` 的提取逻辑包裹在以 `allPairings` 为依赖项的 `useMemo` 中。
   - 将 `filteredPairings` 的过滤逻辑包裹在 `useMemo` 中，依赖项为 `[allPairings, pairingFilterName, pairingFilterGroup, pairingFilterBrand, pairingFilterNature, pairingFilter3V, pairingFilterSameNature]`。
   - 将 `groupedPairings` 的分组逻辑包裹在 `useMemo` 中，依赖项为 `[filteredPairings]`。
   - 彻底斩断“JSX 渲染时无脑重复运行重度循环”的灾难，确保打字、无关操作时计算开销为 0。
2. **引入智能配对熔断机制（安全阀）**：
   - 在 `useMemo` 内部，在执行双循环前计算 $checkedFathers.length \times checkedMothers.length$ 的值。
   - 设定安全阈值为 **3000** 组。若计算得出的总组合数超过 3000，则直接提前截断并返回 `{ pairings: [], isOverloaded: true }`，不再执行笛卡尔积和随后的高阶函数去重过滤。
   - 在 UI 的配对列表位置，若 `isOverloaded` 为 `true`，则不再渲染空列表，而是呈现一个精心设计的磨砂警示看板，提示用户：
     > ⚠️ **当前勾选的父母本配对数量过多（共 $N$ 组），为防卡死已自动暂停配对计算。请通过筛选器过滤父母本或取消部分全选来缩小范围。**

### 2.2 数据持久化优化（同步即时存盘）
- 允许 `executeSave` 接受可选的重写状态（例如最新的 `parents` 数组），这样我们就可以绕过 React 异步状态更新带来的时序漏洞。
- 在用户触发大批量、高风险的数据变动时，**无需等待 500ms 的防抖，直接同步调用 `executeSave` 进行瞬时存盘**！
- 涵盖的高风险触发点：
  1. `RocoImportModal` 中的 `onImport` (导入精灵盒子数据时)
  2. `confirmImportAll` (账号全量数据覆盖导入时)
  3. `confirmImportSingle` (单账号备份数据导入时)
- 这样，哪怕后续的页面交互发生卡死崩溃，之前导入的几千条数据也早已安全无虞地躺在了物理文件和 localStorage 中，重启即完美恢复。
