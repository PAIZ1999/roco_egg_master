# Research Notes: 精灵多形态支持设计与实现

## 1. 需求与实现方案分析
用户期望支持多形态精灵的头像切换展示，多形态图片位于 `images/sprites/`，包含下划线如 `冬羽雀_春天的样子.png`。
我们需要实现：
- 精灵数据属性读取（蛋组、系别）对多形态精灵名的自适应（去除下划线后缀查找）。
- 精灵图片的智能定位（支持包含下划线的全名，如 `冬羽雀_春天的样子` 对应 `冬羽雀_春天的样子.png`）。
- 蛋窝卡片（`SortableCard`）及表格行（`SortableRow`）的头像框内，当检测到有多个可用形态时，在左下角渲染一个精美的毛玻璃下拉切换框（`<select>`），用于切换外观形态。
- 发布表单处及换蛋看板卡片上支持多形态渲染。

---

## 2. 辅助函数实现设计 (`src/petHelper.ts`)
- **`getBasePetName`**:
  ```typescript
  export const getBasePetName = (name: string): string => {
    if (!name) return "";
    return name.split("_")[0];
  };
  ```
- **`getPetDetails`**:
  ```typescript
  export const getPetDetails = (name: string): PetDetails | null => {
    if (!name) return null;
    const baseName = getBasePetName(name);
    return petDataMap[baseName] || null;
  };
  ```
- **`getAvailableSprites`**:
  获取该精灵可用的所有形态名（无 `.png` 后缀，如 `["冬羽雀_夏天的样子", "冬羽雀_春天的样子", ...]`）。
  ```typescript
  export const getAvailableSprites = (petName: string): string[] => {
    if (!petName) return [];
    const baseName = getBasePetName(petName);
    const exactFile = baseName + ".png";
    const results: string[] = [];
    
    if (spriteFiles.includes(exactFile)) {
      results.push(baseName);
    }
    
    spriteFiles.forEach(file => {
      if (file.startsWith(baseName + "_") && file.endsWith(".png")) {
        const formName = file.slice(0, -4);
        if (!results.includes(formName)) {
          results.push(formName);
        }
      }
    });
    
    return results;
  };
  ```
- **`getSpriteFileName`**:
  能够完美支持输入具体形态名或基础名。
  ```typescript
  export const getSpriteFileName = (petName: string): string | null => {
    if (!petName) return null;
    
    // 1. 尝试全名精确匹配 (例如 "冬羽雀_夏天的样子.png")
    const exactMatch = petName + ".png";
    if (spriteFiles.includes(exactMatch)) {
      return exactMatch;
    }
    
    // 2. 尝试全名前缀匹配
    const prefixMatch = spriteFiles.find(file => file.startsWith(petName + "_") && file.endsWith(".png"));
    if (prefixMatch) {
      return prefixMatch;
    }
    
    // 3. 尝试基础名精确匹配
    const baseName = getBasePetName(petName);
    const baseExactMatch = baseName + ".png";
    if (spriteFiles.includes(baseExactMatch)) {
      return baseExactMatch;
    }
    
    // 4. 尝试基础名前缀匹配
    const basePrefixMatch = spriteFiles.find(file => file.startsWith(baseName + "_") && file.endsWith(".png"));
    if (basePrefixMatch) {
      return basePrefixMatch;
    }
    
    // 5. 模糊包含匹配
    const containsMatch = spriteFiles.find(file => file.includes(petName) && file.endsWith(".png"));
    if (containsMatch) {
      return containsMatch;
    }
    
    return null;
  };
  ```

---

## 3. 界面交互与布局设计
### 3.1 蛋窝卡片 (`SortableCard.tsx`)
- **布局位置**：大头像容器的左下角 (`absolute bottom-1 left-1`)。由于右下角是系别图标 (`bottom-1 right-1`)，左上角是 3V 标，右上角是极限标，所以左下角是完美对称的空位。
- **渲染条件**：`availableSprites.length > 1`。
- **外观样式**：
  ```tsx
  <div className="absolute bottom-1 left-1 bg-white/85 backdrop-blur-xs px-1.5 py-0.5 rounded shadow-3xs z-15 border border-slate-150 flex items-center max-w-[70%] hover:bg-white transition-colors duration-150 action-buttons">
    <select
      value={availableSprites.includes(pet.sprite) ? pet.sprite : (spriteFile ? spriteFile.slice(0, -4) : pet.sprite)}
      onChange={(e) => handleUpdateSprite(pet.id as string, e.target.value)}
      className="text-[9px] font-bold text-slate-750 bg-transparent border-none focus:outline-none cursor-pointer w-full"
    >
      {availableSprites.map((spriteOption) => {
        const displayName = spriteOption.includes("_") ? spriteOption.split("_")[1] : "默认样子";
        return (
          <option key={spriteOption} value={spriteOption}>
            {displayName}
          </option>
        );
      })}
    </select>
  </div>
  ```
- **长图导出**：该下拉框添加 `.action-buttons` 类，长图导出时由 CSS 规则自动隐藏，无感完美保留选中的头像图片。

### 3.2 表格行 (`SortableRow.tsx`)
- 类似地，在表格行的头像容器内添加形态选择下拉框，保证功能一致性。

### 3.3 换蛋中心表单及卡片 (`App.tsx`)
- **发布表单**：在输入框右侧增加了形态选择下拉框，并实现头像预览联动切换。当基础精灵名称更新时，会自动重置形态；
- **换蛋看板卡片**：由于原本 hover 覆盖头像的删除按钮会阻碍形态选择下拉框的点击，因此我们做出了一个更优雅的**设计改进**——将删除按钮移至整个卡片的右上角（仅在 hover 卡片时淡入显示），与蛋窝卡片设计保持一致。这样头像区域便可无遮挡地容纳形态选择下拉框，从而让用户在看板上也可以极简地一键切换精灵形态。

---

## 4. 验证计划
1. 在网页端选择“冬羽雀”或“丢丢”，验证头像左下角是否浮现形态切换下拉框。
2. 切换形态为“秋天的样子”或“沙地附近的样子”，验证头像是否即时刷新，且卡片的系别、蛋组是否依然能够正确读取展示。
3. 点击“导出长图”，验证导出的长图是否包含了正确的形态头像，且隐藏了下拉选择框本身。
4. 验证数据保存与读取，关闭网页后重新打开，形态选择是否被完整持久化。
5. 换蛋中心发布与看板切换：选择“冬羽雀”，并在右侧选择“春天的样子”发布，验证看板卡片正确显示“春天的样子”。在卡片上切换为“秋天的样子”，验证卡片头像更新。
