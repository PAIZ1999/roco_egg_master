# Roco Egg Master 多账号管理及导入导出设计笔记

## 1. 核心数据模型与类型扩展

在 `src/types.ts` 中新增以下数据模型：
```typescript
export interface Account {
  id: string;      // 随机生成的内部唯一 ID
  uid: string;     // 用户可见/可编辑的洛克王国 UID
  nickname: string;// 用户可见/可编辑的昵称
}

export interface AccountData {
  pets: EggPet[];
  trades: EggTrade[];
  parents: ParentPet[];
}
```

## 2. 数据存盘与兼容性设计

全局保存的大 JSON 字段结构演进：
```typescript
interface FullSaveData {
  accounts: Account[];
  activeAccountId: string;
  accountDataMap: Record<string, AccountData>;
  settings: {
    showWatermarkPanel: boolean;
    enableWatermark: boolean;
    watermarkText: string;
    watermarkOpacity: number;
    watermarkDensity: string;
    watermarkSize: number;
  };
}
```

### 2.1 向下兼容与首次运行迁移 (Migration)
当读取到没有 `accounts` 字段的旧数据时：
- 创建“默认账号”：
  `id: "default", uid: "default", nickname: "默认账号"`。
- 将已读取到的 `pets`（经过 `migratePets`）、`trades`（经过 `migrateTrades`）和 `parents` 包装为 `accountDataMap["default"]`。
- 设置 `activeAccountId: "default"`，`accounts: [defaultAccount]`。
- 保证用户已有数据零损坏加载。

### 2.2 自动保存流程
自动保存的副作用 `useEffect` 应当侦听：
`[pets, trades, parents, accounts, activeAccountId, showWatermarkPanel, enableWatermark, watermarkText, watermarkOpacity, watermarkDensity, watermarkSize, isLoaded]`

每次数据修改时，都使用最新的当前状态组装写盘：
```typescript
const mergedMap = {
  ...accountDataMap,
  [activeAccountId]: { pets, trades, parents }
};
window.electronAPI.saveData({
  accounts,
  activeAccountId,
  accountDataMap: mergedMap,
  settings: { ... }
});
```

### 2.3 账号切换平滑过渡
切换账号的核心步骤：
1. **保存当前**：把当前的 `pets, trades, parents` 序列化保存到局部变量 `updatedMap`：
   ```typescript
   const updatedMap = {
     ...accountDataMap,
     [activeAccountId]: { pets, trades, parents }
   };
   setAccountDataMap(updatedMap);
   ```
2. **读取目标**：从 `updatedMap` 中读取目标账号 `targetId` 的数据（若不存在则兜底为空数组/默认精灵）：
   ```typescript
   const targetData = updatedMap[targetId] || { pets: [], trades: [], parents: [] };
   ```
3. **状态更新**：
   ```typescript
   setPets(migratePets(targetData.pets));
   setTrades(migrateTrades(targetData.trades || []));
   setParents(targetData.parents || []);
   setActiveAccountId(targetId);
   ```

---

## 3. 导入导出逻辑细化

为了同时支持**单个账号**和**多账号全量**的导入导出：

### 3.1 导出格式规范
- **单账号导出 (Single Account Export)**：
  ```json
  {
    "version": "roco_egg_single_account_v1",
    "uid": "123456",
    "nickname": "测试账号",
    "pets": [...],
    "trades": [...],
    "parents": [...]
  }
  ```
- **多账号全量导出 (All Accounts Export)**：
  ```json
  {
    "version": "roco_egg_multi_accounts_v1",
    "accounts": [...],
    "activeAccountId": "...",
    "accountDataMap": { ... }
  }
  ```

### 3.2 导入智能解析流程
在 `executeImport(pastedText)` 中，对 JSON 进行格式探针：
1. **全量多账号备份 (`version === "roco_egg_multi_accounts_v1"`)**：
   - 提示：“检测到完整的全账号备份（共 X 个账号）。导入将覆盖现有全部账号和数据，是否确认导入？”
   - 用户确认后，全量更新 `accounts`, `activeAccountId`, `accountDataMap` 并切换状态。
2. **单账号备份 (`version === "roco_egg_single_account_v1"`) 或老版本备份 (没有 version 标志，但有 `pets` 字段或直接是数组)**：
   - 提取备份中的 `pets`, `trades`, `parents`。如果包含 `uid` 和 `nickname`，则记录；如果是老版本，默认设为 `导入账号`。
   - 弹出二级选择框或提供两个按钮选项：
     - **“覆盖当前账号”**：将当前激活账号的数据（`pets`, `trades`, `parents`）替换为该备份数据，不创建新账号。
     - **“作为新账号导入”**：在 `accounts` 中追加一个随机 ID 账号，并指定读取出来的 `uid` 和 `nickname`。将数据存入 `accountDataMap` 并自动切换至该新账号。

---

## 4. UI 界面设计细节

1. **Header 右上角账号切换器**：
   - 采用 Flex 布局，放置在 Credits/呼吸灯区域左侧。
   - 外观为一个毛玻璃圆角按钮，点击后展开 Dropdown。
   - 按钮内容：`👤 昵称 (UID)` 加上展开小箭头。
   - 下拉菜单包含：
     - 列表中列出所有账号。当前选中的账号右侧有绿色 Check 勾选图标。
     - 下拉菜单底部有一条分隔线，分隔线下方为“➕ 新增账号”和“⚙️ 账号管理”两个选项。
2. **账号管理 Modal**：
   - 用表格或列表形式展示所有账号。
   - 每行包括：
     - 昵称（支持内联编辑或点击弹出输入框编辑）
     - UID（支持编辑）
     - 单独导出 JSON 按钮
     - 删除按钮（在账号总数 > 1 时可用，且删除当前账号时会自动切换到其他账号，需二次确认）
   - Modal 底部提供新增账号的输入表单：
     - `UID` 输入框
     - `昵称` 输入框
     - “创建” 按钮

---

## 5. 严重竞态修复与自定义二次确认弹窗设计

### 5.1 异步状态覆写竞态问题 (State Race Conditions)
在多账号切换和删除流程中，`activeAccountId`（ID 状态）和 `pets, trades, parents`（数据状态）的修改是分离且异步的。
- **问题表现**：当删除或切换账号时，`activeAccountId` 改变会触发自动保存的 `useEffect`。由于 React 状态合并更新机制，在此瞬间 `pets` 等数据还保留着上一个账号的内容。如果不加控制，`useEffect` 会将上一个账号的数据写到新账号的 ID 键值下，导致新账号的数据被旧账号数据彻底覆盖/污染。
- **解决方案**：引入 `lastActiveAccountIdRef = useRef(activeAccountId)`。
  - 在 `useEffect` 的最开头，校验 `lastActiveAccountIdRef.current !== activeAccountId`。如果为真，说明该轮渲染处于“账号切换过渡期”。
  - 此时立刻同步 `lastActiveAccountIdRef.current = activeAccountId` 并执行 `return`，**强行拦截该次自动保存**，避开脏数据覆写。
  - 随后，`setPets` 等状态对应的后续渲染发生，`pets` 数据就位，再次触发 `useEffect`，此时 `lastActiveAccountIdRef.current === activeAccountId` 成立，正常执行写盘。

### 5.2 强校验防止僵尸账号写回
在删除当前账号时，若 `useEffect` 侦听到状态变化，可能会在瞬间将已被剔除的账号数据重新保存回 local 数据。
- **解决方案**：在 `useEffect` 开头增加防御校验 `if (!accounts.some(a => a.id === activeAccountId)) return;`，如激活账号在列表中已被删除，则直接安全拦截，杜绝被删除账号残留写回。

### 5.3 彻底弃用原生 confirm
原生 `window.confirm` 在 Electron (桌面客户端) 或部分沙箱环境下会产生主线程阻塞或抛出未捕获的弹窗状态错误，尤其影响自动化回归测试的稳定性。
- **解决方案**：实现 React 态的 `confirmConfig` 和 `showConfirm` 函数，采用自定义的磨砂玻璃遮罩层和精美圆角 Modal 实现完全非阻塞的确认交互，视觉上与洛克王国孵蛋表的高清视觉风格达到 100% 协调。
