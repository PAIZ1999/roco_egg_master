# Research Notes: 有无极限蛋字段变更设计

## 1. 需求与实现方案分析
用户期望将“极限量级”变更为“有无极限蛋”，并且选项调整为：
- `有极限蛋` (原本的“极限”)
- `无极限蛋` (原本的“非极限”)

我们需要在不破坏已有历史数据存储的前提下，平滑升级并更新界面文案。

### 1.1 核心数据迁移与兼容
在 `src/App.tsx` 中有 `migratePets` 逻辑。历史数据中 `isLimit` 的可能值为：
- `"是"` / `"极限"` (代表是极限)
- `"否"` / `"非极限"` (代表非极限)
- 已经存在的其它值或空值。

**迁移逻辑重构**：
```typescript
isLimit: p.isLimit === "是" || p.isLimit === "极限" || p.isLimit === "有极限蛋" ? "有极限蛋" : "无极限蛋"
```
这可以确保在用户打开旧版数据时，系统能无缝把旧版 `"极限"` 补全为新版 `"有极限蛋"`，并把 `"非极限"` 转换为 `"无极限蛋"`。

### 1.2 界面文案与展示组件修改
1. **`src/types.ts`**:
   - `LIMIT_OPTIONS` 由 `["非极限", "极限"]` 修改为 `["无极限蛋", "有极限蛋"]`。
   - `INITIAL_TABLE_DATA` 里的默认宠物喵喵，`isLimit` 字段默认改为 `"有极限蛋"`。
2. **`src/App.tsx`**:
   - `limitsCount` 统计改为匹配 `p.isLimit === "有极限蛋"`。
   - `handleAddPet` 中的新增默认值改为 `isLimit: "无极限蛋"`。
   - 过滤条件下拉框文案改为 `"全部(有无极限蛋)"`。
3. **`src/components/SortableCard.tsx`**:
   - 标签文案 `"极限量级"` 变更为 `"有无极限蛋"`。
   - 选中的高亮样式判断 `pet.isLimit === "极限"` 变更为 `pet.isLimit === "有极限蛋"`。
   - 头像右上角 Badge 渲染判断和文字均修改为 `"有极限蛋"`。
4. **`src/components/SortableRow.tsx`**:
   - 选中的高亮样式判断 `pet.isLimit === "极限"` 变更为 `pet.isLimit === "有极限蛋"`。

## 2. 打包与分发
修改完毕并经过 Playwright/浏览器手动验证无误后，执行以下命令构建与打包：
- 本地调试：`npm run dev` / `npm run electron:start`
- EXE打包：`npm run electron:build`
确保输出到 `dist-electron/` 目录下的打包 `.exe` 文件没有报错，能够正常双击启动并运行。
