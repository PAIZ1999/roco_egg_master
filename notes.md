# Research Notes: 父母本滚动查看布局、蛋管理分页与全局卡片拖拽与筛选

## 模型名称、模型大小、模型类型、修订版本
- 模型名称：Gemini 3.5 Flash (High)
- 模型大小：中等/云端
- 模型类型：多模态大模型
- 修订版本：v6.0 (RIPER-5 + Manus + MCP + Skills)

---

## 1. 父母本滚动查看布局修改
- **目标**：彻底删除 `parentCols` 相关状态或残留 slider（经调研，`src/App.tsx` 中目前无 `parentCols` 状态，说明无需多余清理，只需专注于布局修改）。
- **布局调整**：
  将左侧父本仓库（原第 3200 行附近）和右侧母本仓库（原第 3314 行附近）的 Grid 容器恢复/修改为：
  `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4`
  以完全支持鼠标滚轮向下滚动显示更多卡片。

## 2. 蛋管理分页显示
- **目标**：精灵蛋管理列表每页展示 6 张卡片。
- **常量与状态引入**：
  在 `App.tsx` 中定义 `const EGG_PAGE_SIZE = 6;` 并引入 `eggCurrentPage` 状态：
  `const [eggCurrentPage, setEggCurrentPage] = useState(1);`
- **过滤与切片逻辑**：
  - 计算总页数：`const totalEggPages = Math.ceil(filteredEggs.length / EGG_PAGE_SIZE) || 1;`
  - 对过滤后的列表做 Slice：`const paginatedEggs = filteredEggs.slice((eggCurrentPage - 1) * EGG_PAGE_SIZE, eggCurrentPage * EGG_PAGE_SIZE);`
- **自动归拢与重置页码**：
  - 当过滤条件（`eggSearchTerm`、`eggFilterGroup`、`eggFilterBrand`、`eggFilterLimit`、`eggFilter3V`）改变时，重置 `eggCurrentPage` 为 `1`。
  - 在删除蛋等操作导致 filteredEggs 减少，或者其它导致 `eggCurrentPage > totalEggPages` 的场景下，自动将 `eggCurrentPage` 归拢至 `totalEggPages`。
- **分页控制器 UI**：
  - 在精灵蛋列表底部渲染精美、响应式的分页控件。
  - 具备 "首页"、"上一页"、"下一页"、"末页"、页码按钮及省略号 "..."。

## 3. 全局卡片拖拽与筛选
蛋窝已支持拖拽。我们需要为蛋管理和父母本各自独立集成拖拽。
### 3.1 改造卡片为可拖拽组件
- **`EggCard.tsx`**：
  - 引入 `useSortable` 钩子，并在最外层 div 上绑定 `ref={setNodeRef}`、`style={style}`。
  - 在卡片 `Action Row` 处添加拖动 Grip 手柄（`GripVertical` 图标），并将其绑定为拖拽的激活点：`{...attributes} {...listeners}`。
  - 如果 `isDragging` 为真，则提供 `opacity-60` 的视觉反馈。
- **`ParentCard.tsx`**：
  - 引入 `useSortable` 钩子，同理最外层 div 绑定 `ref={setNodeRef}`、`style={style}`。
  - 在卡片左侧操作区域的“配组” checkbox 旁边或前方渲染拖动 Grip 手柄（`GripVertical` 图标），绑定 `{...attributes} {...listeners}`。

### 3.2 引入独立拖拽上下文
在 `App.tsx` 中，我们为这三个列表各自创建独立的拖拽上下文：
- **蛋管理列表**：
  - 在蛋管理卡片 Grid 容器外包裹 `DndContext`（指定 `sensors`，`collisionDetection={closestCenter}`，`onDragEnd={handleEggDragEnd}`）。
  - 内层包裹 `SortableContext`（`items={paginatedEggs.map(e => e.id)}`，`strategy={rectSortingStrategy}`）。
- **左侧父本列表**：
  - 在父本 Grid 容器外包裹 `DndContext`（指定 `sensors`，`collisionDetection={closestCenter}`，`onDragEnd={handleFatherDragEnd}`）。
  - 内层包裹 `SortableContext`（`items={visibleFathers.map(p => p.id)}`，`strategy={rectSortingStrategy}`）。
- **右侧母本列表**：
  - 在母本 Grid 容器外包裹 `DndContext`（指定 `sensors`，`collisionDetection={closestCenter}`，`onDragEnd={handleMotherDragEnd}`）。
  - 内层包裹 `SortableContext`（`items={visibleMothers.map(p => p.id)}`，`strategy={rectSortingStrategy}`）。

### 3.3 编写 onDragEnd 排序处理器
由于底层数据是全量保存的，我们在拖拽完成后在全量数组中移动元素：
- **蛋拖拽重排**：
  ```typescript
  const handleEggDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = eggs.findIndex(e => e.id === active.id);
    const newIndex = eggs.findIndex(e => e.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      setEggs(prev => arrayMove(prev, oldIndex, newIndex));
    }
  };
  ```
- **父本拖拽重排**：
  ```typescript
  const handleFatherDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = parents.findIndex(p => p.id === active.id);
    const newIndex = parents.findIndex(p => p.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      setParents(prev => arrayMove(prev, oldIndex, newIndex));
    }
  };
  ```
- **母本拖拽重排**：
  与父本同理，在全量 `parents` 数组中找到母本的位置，调用 `arrayMove` 重排。
