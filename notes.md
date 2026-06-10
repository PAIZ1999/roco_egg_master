# 洛克王国孵蛋数据管理系统优化设计笔记

## 1. 父母本滚动查看布局
- **目标**：彻底删除 parentCols 列数滑块，提供更纯粹的桌面与大屏体验。
- **布局**：左右分栏中，左侧父本仓库和右侧母本仓库列表的 Grid 容器恢复为 `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4`，以完全支持鼠标滚轮向下滚动显示更多卡片。

## 2. 标签页初始化隔离
- **目标**：各标签页的搜索和过滤状态相互独立，避免切换时互相影响。
- **状态划分**：
  - 蛋窝中心：`searchTerm`（模糊搜索）、`filterNature`、`filterGroup`、`filterBrand`、`filterStatus`、`filterLimit`、`filter3V`。
  - 父母本中心：新增 `parentSearchTerm`（模糊搜索）、`parentFilterGroup`（组别筛选）、`parentFilterNature`（性格筛选）。
  - 蛋管理中心：`eggSearchTerm`、`eggFilterGroup`、`eggFilterBrand`、`eggFilterLimit`、`eggFilter3V`。
- 确保在账号切换、数据初始化时，这些筛选条件独立控制各自的卡片列表渲染。

## 3. 蛋窝中心父母精灵名与性别底框
- **蛋数据扩展**：在 `EggPet` 接口中扩展 `fatherName?: string` 和 `motherName?: string` 字段。
- **UI 显示**：在 `SortableCard.tsx` 中：
  - 父亲配置：若 `pet.fatherName` 存在，则显示 `pet.fatherName`；否则显示 `"父方配置"`。使用蓝色底框（`bg-blue-50 border border-blue-200 text-blue-600 rounded px-1.5 py-0.5`）和 `<Mars>` 符号。
  - 母亲配置：若 `pet.motherName` 存在，则显示 `pet.motherName`；否则显示 `"母方配置"`。使用粉色底框（`bg-pink-50 border border-pink-200 text-pink-650 rounded px-1.5 py-0.5`）和 `<Venus>` 符号。
- **自动录入**：在 `App.tsx` 中的 `handleImportPairingsToNest` 中，构建 `EggPet` 时自动录入父母的精灵名字：
  - `fatherName: pair.father.sprite`
  - `motherName: pair.mother.sprite`

## 4. 父母本管理独立筛选
- **目标**：按组别、性格、牌子以及名字多重且相互独立地过滤父本和母本卡片。
- **方案**：在左侧“♂️ 父本仓储库”下方和右侧“♀️ 母本仓储库”下方分别渲染一套独立的检索栏：
  - **名称搜索**（`fatherSearchTerm` / `motherSearchTerm`）：过滤精灵名。
  - **蛋组筛选**（`fatherFilterGroup` / `motherFilterGroup`）：过滤蛋组。
  - **性格筛选**（`fatherFilterNature` / `motherFilterNature`）：过滤性格。
  - **牌子筛选**（`fatherFilterBrand` / `motherFilterBrand`）：过滤牌子。
- 过滤后计算 `filteredFathers` 与 `filteredMothers` 并渲染对应的 Grid。

## 5. 蛋管理分页显示
- **目标**：一页展示 10 张蛋卡片。
- **状态**：`eggCurrentPage: number`，默认为 `1`。
- **计算**：对筛选后的蛋列表进行 Slice 截取展示。
- **UI**：在蛋管理列表下方渲染响应式分页控制器（上一页、下一页、页码点击、总页数显示）。当过滤条件改变或删除蛋数据时，自动将 `eggCurrentPage` 重置或归拢至有效范围。

## 6. 蛋管理中心行内编辑重构
- **目标**：取消 Modal 弹窗，卡片上直接编辑；增加地区形态切换及其他选择。
- **方案**：
  - 对 `EggCard.tsx` 进行重构，点击各个文本字段可以直接展示对应的 input/select 控件。
  - 整合多地区形态下拉菜单（毛玻璃形态选择菜单），支持带下划线形态和基础精灵还原。
  - 父母性格使用 `Autocomplete`，三围指标提供点击气泡或 select 切换，与 `ParentCard` 的行内编辑交互保持完全一致。
  - 精灵头像筛选和性格筛选等复用 `ParentCard` 相同逻辑。

## 7. 全局卡片拖拽与筛选
- **目标**：蛋窝、父母本、蛋管理所有卡片都可以自由拖动位置。
- **方案**：
  - 蛋窝：已支持拖拽。
  - 蛋管理：引入 `@dnd-kit/sortable`，在 `eggs` 的渲染列表外包裹 `DndContext`、`SortableContext`，实现蛋管理卡片的拖拽排序，并通过 `setEggs` 更新和自动存档。
  - 父母本：分别在父本和母本列表外包裹拖动上下文。由于父母本分为父本（男）和母本（女）两个独立的列表，需要支持在这两个独立的列表各自内部进行拖动排序，更新 `parents` 数组的顺序。
- 确保所有标签页的所有卡片均支持模糊搜索和特定筛选条件。
