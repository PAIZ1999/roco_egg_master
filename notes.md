# Research Notes: 大容量数据导入卡死与保存丢失分析及优化方案

## 1. 核心问题定位

### 1.1 全选父母+母本导致软件卡死
在 `src/App.tsx` 中，存在一个计算并显示所有可用父母本繁育配对的逻辑：
- 父母本配对是通过 `getPairings()` 函数计算的，它是对已勾选的父本 (`checkedFathers`) 和母本 (`checkedMothers`) 执行双重嵌套循环（笛卡尔积）。
- **问题 A**：虽然 `getPairings` 使用了 `useCallback`，但我们在 `src/App.tsx` 的 JSX Render 部分（第5571行起）是**直接且同步**地以 `const allPairings = getPairings()` 执行，且随后直接在渲染中做大量的去重、筛选和分组操作。
- **问题 B**：未设置安全保护阈值。当用户导入 1003 只精灵并全选父母本时，假定有 500 对父本和 500 对母本，两两配对会产生 $500 \times 500 = 250,000$ 组配对！主线程在渲染过程中直接执行 25万次的嵌套配对计算、去重和过滤，会让浏览器内存和计算资源瞬间耗尽，引起应用彻底无响应。

### 1.2 退出/重启后数据没有保存
系统虽然拥有自动保存和安全退出保存机制。但当用户全选父母本后，JS 主线程彻底卡死，防抖定时器无法被调度。用户被迫强杀软件进程，这也导致软件没有机会执行退出时的存盘事件。

### 1.3 补充定位：配对中心缺少渲染分页（熔断阈值内依然卡顿的隐患）
虽然我们在上一阶段中引入了 3000 对的安全熔断阈值。如果勾选父母本的乘积在 3000 以下（比如产生 2000 对配对），代码在 JS 内存中能快速计算出来且不会触发熔断。
然而，在 UI 渲染端：
- 智能繁育配对中心在 JSX 渲染时，**直接对包含 2000 组的 `groupedPairings` 数组执行了 `.map()` 渲染**，并且在以往的重构中漏掉了配对分页控制器（`pairingCurrentPage` 在代码里不存在）。
- 一次性向浏览器 DOM 树中渲染 2000 个包含双头像、下拉菜单、Badge 胶囊、体型极限算法等极其复杂的卡片节点，会导致浏览器重排重绘压力暴增，产生严重的 UI 滞后和假死。

---

## 2. 优化方案设计

### 2.1 性能与卡死优化（熔断与强力缓存）
1. **使用 `useMemo` 缓存全部配对中间态**：
   将 `allPairings`, `allPairGroups`, `allPairBrands`, `filteredPairings`, `groupedPairings` 缓存为顶级 `useMemo`，减少打字或非配对筛选改变时的计算开销。
2. **引入智能配对熔断机制（安全阀）**：
   设定安全阈值为 **3000** 组。若最大配对数超载，则拦截并渲染提示看板。

### 2.2 数据持久化优化（同步即时存盘）
重构 `executeSave` 接口使其支持接受最新的状态覆盖字段，并在导入精灵、全量/单账号数据导入等关键变动时刻立刻触发存盘，跳过 500ms 防抖延迟。

### 2.3 补充设计：配对中心分页渲染（彻底根治熔断内卡顿）
1. **状态声明**：声明配对页面的 `pairingCurrentPage` 分页变量，且指定页容量 `PAIRING_PAGE_SIZE = 20`。
2. **切片缓存**：使用 `useMemo` 对 `groupedPairings` 进行渲染切片截取，生成 `paginatedGroupedPairings`（在 `isExporting` 为 `true` 导出长图时，自适应放开 slice 限制以保证长图数据完整）：
   ```typescript
   const paginatedGroupedPairings = useMemo(() => {
     if (isExporting) return groupedPairings;
     return groupedPairings.slice((pairingCurrentPage - 1) * PAIRING_PAGE_SIZE, pairingCurrentPage * PAIRING_PAGE_SIZE);
   }, [groupedPairings, pairingCurrentPage, isExporting]);
   ```
3. **交互联动与自适应归拢**：
   - 过滤条件、搜索关键词或配对总数改变时，自动将 `pairingCurrentPage` 重置为 `1`。
   - 当删除配对导致总页数变小时，自动将 `pairingCurrentPage` 归拢至最大有效页。
4. **分页 UI 渲染**：在卡片列表的下方挂载结构紧凑、高颜值的交互分页组件，支持首页、尾页、上一页、下一页及数字区间跳转，单页卡片渲染严格控制在 20 张以内。
