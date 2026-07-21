# Walkthrough: 洛克王国龙组与飞龙组蛋组解析 Bug 修复

我们已成功分析并解决了从游戏直连或 API 导入父母本精灵卡片时，由于数据源中的 `"飞龙组"` 与前端定义的 `"龙组"` 命名不一致，导致龙系宠物在导入后所属蛋组被错误显示为“飞龙组”，进而阻断智能繁育配对、筛选联动和分类图鉴查询的 Bug。

## 1. 变更点总结 (Changes Made)

### 📂 1.1 物理数据库源头修正
- **修改文件**：
  - [database/398-莫比乌乌.json](file:///d:/desk/洛克王国孵蛋表-副本/database/398-莫比乌乌.json)
  - [database/289-大头骨龙.json](file:///d:/desk/洛克王国孵蛋表-副本/database/289-大头骨龙.json)
  - [database/239-豆丁鱼.json](file:///d:/desk/洛克王国孵蛋表-副本/database/239-豆丁鱼.json)
  - [database/224-小翼龙.json](file:///d:/desk/洛克王国孵蛋表-副本/database/224-小翼龙.json)
  - [database/203-伊雷龙.json](file:///d:/desk/洛克王国孵蛋表-副本/database/203-伊雷龙.json)
- **修改点**：在上述 5 个龙系精灵的源头配置文件中，将所有的 `"飞龙组"` 全局物理替换为符合项目规范的 `"龙组"`。

### ⚙️ 1.2 构建数据合并清洗系统升级
- **修改文件**：[scripts/update-all.cjs](file:///d:/desk/洛克王国孵蛋表-副本/scripts/update-all.cjs)
- **修改点**：在 `mergeDatabaseData` 的合并逻辑中，增设了统一的 `cleanEggGroups` 洗数函数。在整合各 `.json` 文件并将 egg_groups 属性合并写入 `src/pets_data.json` 前，强行清洗拦截，将可能残存的 `"飞龙组"` 映射规范化为 `"龙组"`，确保打包/编译阶段的数据纯净性。

### 🛡️ 1.3 运行时防卫性清洗拦截
- **修改文件**：[src/petHelper.ts](file:///d:/desk/洛克王国孵蛋表-副本/src/petHelper.ts)
- **修改点**：在运行时 `cleanEggGroups` 函数中为形态数组加入防御性映射，即使有来自老旧 localStorage 备份、脏数据归档或未清洗 API 接口返回的 `"飞龙组"` 字符，也会在加载时被自动拦截并替换为标准的 `"龙组"`。

---

## 2. 验证与测试 (What Was Tested)

### 2.1 物理数据一致性自查
- 使用 grep 命令在已重新构建整合 of `src/pets_data.json` 数据源中搜索关键字 `"飞龙组"`：
  - **检索结果**：0 个匹配（除 `petHelper.ts` 代码逻辑里的判断行外，数据源中所有 `"飞龙组"` 已被完全物理移除且替换为 `"龙组"`）。

### 2.2 自动化构建编译验证
- 在项目根目录执行生产环境编译指令：
  ```bash
  npm run build
  ```
- **验证结果**：编译任务正常启动并完成：
  1. `scripts/update-all.cjs` 自动清空并同步高清精灵头像并成功重建缓存。
  2. 178 条主精灵数据完成合并，全新生成的 `src/pets_data.json` 中已经完全不含任何飞龙组的脏数据。
  3. Vite 模块转译与 Rollup 打包生产资源 100% 成功，没有发生任何 TS 编译异常或类型校验失败。
