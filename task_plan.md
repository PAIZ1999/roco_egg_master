# Task Plan: 洛克王国起来鸭形态映射值修正计划

## Goal
修正起来鸭与紧实的样子（睡帽鸭）在 `RocoImportModal.tsx` 里的 `conf_id` 映射对调 Bug，确保从游戏直连/API 导入鸭吉吉的各个形态时能正确匹配其图片和名字。

## MCP Status
- [x] memory 检索完成
- [x] context7/deepwiki 查询完成
- [x] sequential-thinking 分析完成
- [x] memory 知识存储完成

## Phases
- [x] Phase 1: 规划与准备 (从 SQLite/API 原始字段及网页 DOM 中科学印证鸭吉吉形态 conf_id 与网页展示文字的真实对应关系)
- [x] Phase 2: 修改 `src/components/RocoImportModal.tsx` 修正鸭吉吉的形态映射值
- [x] Phase 3: 运行并验证 Vite 构建及本地导入功能
- [x] Phase 4: 最终交付与项目知识库更新

## Key Questions
- 无

## Decisions Made
- [决策]: 经查证，`conf_id === 410738` 的 15级/14级鸭吉吉在游戏直连端实际对应的形态名称是“起来鸭”（旧代码误映射为“紧实的样子”），而 `300710` 对应的才是“紧实的样子”（睡帽鸭，旧代码误映射为“起来鸭”）。需要将 `410738` 与 `300710` 的映射值互换，并新增 `300463` 的“等一等鸭”映射。

## Errors Encountered
- 无

## Status
**Currently in Phase 4** - 最终交付。所有形态映射值的纠正、项目知识库与演示说明的同步更新及打包构建已全部圆满完成。
