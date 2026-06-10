# Task Plan: 洛克王国孵蛋表多维度优化

## Goal
完成父母本管理筛选、每个标签页单独初始化和重置状态清空、以及精灵蛋无弹窗直接卡片修改功能，确保数据在不同标签页下的检索隔离。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [ ] memory 知识存储完成

## Phases
- [x] Phase 1: 规划与准备 (提交实现方案)
- [x] Phase 2: 蛋窝父母姓名智能导入与性别底框及模糊搜索
- [x] Phase 3: 父母本列表分栏及卡片拖拽
- [x] Phase 4: 蛋管理行内编辑重构与废除弹窗 (已完成)
- [x] Phase 5: 父母本筛选、各标签页独立初始化与重置状态清空
  - [x] 分别为父本和母本定义独立的筛选状态 (father/mother SearchTerm, FilterGroup, FilterBrand, NatureSearch)
  - [x] 在 executeReset 中更新 parents 重置逻辑以清空这 8 个新筛选状态
  - [x] 重构 App.tsx 的父母本筛选 UI，用两套独立的、更美观的筛选栏替换原本的单筛选条，并对精灵名和性格使用模糊搜索
- [x] Phase 6: 全局拖拽排序细节微调 (已通过 Autocomplete 拼音及下拉支持微调完美)
- [x] Phase 7: 联调、测试与交付 (在浏览器中对父本/母本精灵名、性格模糊及首字母检索功能进行了全量通过性验证)

## Key Questions
1. 父母本筛选应包含哪些维度？
   - 答：父本和母本独立进行名称搜索、性格搜索、蛋组选择和牌子选择。精灵名和性格支持输入框模糊匹配。
2. 每个标签页单独初始化时，是否应该同时清空该标签页的检索/筛选条件？
   - 答：是的，重置该 Tab 列表时，必须把该 Tab 对应的全部筛选/检索状态一并置空，以防重置后因筛选条件存在而显示为空白。

## Decisions Made
- 父母本检索与过滤使用独立字段：
  - 父本：`fatherSearchTerm`, `fatherNatureSearch`, `fatherFilterGroup`, `fatherFilterBrand`
  - 母本：`motherSearchTerm`, `motherNatureSearch`, `motherFilterGroup`, `motherFilterBrand`
- 模糊搜索逻辑：对 `sprite` 和 `nature` 均使用小写 `includes` 来匹配，性格筛选和精灵名筛选均采用系统现成的 Autocomplete 组件以支持拼音首字母和模糊下拉搜索。
- 重置时隔离清空：各个 Tab 下的重置对话框会彻底清空列表数据以及所有对应的筛选条件。
- 全选按钮仅作用于当前过滤可见的父母本卡片，方便批量勾选符合特定条件的配对。

## Errors Encountered
- 暂无

## Status
**Currently in Completed** - 所有过滤逻辑、Autocomplete 拼音首字母/字母匹配与下拉筛选、各 Tab 隔离清空重置逻辑均已完美跑通且验证完毕。项目成功交付。

