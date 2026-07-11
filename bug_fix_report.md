# 洛克王国多形态精灵及进化链切换 Bug 修复报告

本项目于 2026-07-11 对「数据查询中心」与「桌面助理」中多形态精灵的数据切换错乱、高亮丢失等共性 Bug 进行了集中重构修复。以下是详细报告。

---

## 1. 缺陷现象与根本原因

### Bug A：多形态精灵切换样式时，种族资质与尺寸判定错乱
* **现象**：在数据查询中心或聊天气泡卡片中，查询“晶石蜗”或“鸭吉吉”等拥有不同样子的精灵时，点击下方“切换形态样式”按钮，右侧的种族资质总和、雷达图以及下方的身高体重判定达标线未正确更新，或者数值与图片完全对不齐。
* **原因分析**：
  1. **脏数据累加**：`pets_data.json` 物理数据源中，针对矿晶虫、脆筒甜甜等精灵的 `forms` 与 `evolution_chain` 数组中因历史爬取/生成 Bug，包含大量同名同属性的重复项。
  2. **下标索引关联**：在 `DataQueryTab.tsx` 和 `MerchantFloatWidget.tsx` 的形态切换画廊中，代码采用 `avatars.map((av, idx) => { const formItem = forms[idx]; ... })`。由于 `avatars` 是通过读取图片文件名动态扫描生成的，而 `forms` 是从静态数据表及区域变体中加载的，两者的长度与顺序完全不对等。按索引 `idx` 关联导致数据错位、串行。

### Bug B：点击进化链走向时，当前激活的精灵头像无法被正确高亮
* **现象**：在查询“圣代甜甜”时，点击下方进化链中的“圣代甜甜”节点，虽然主面板和图片已切换为圣代甜甜，但下方进化链的高亮边框仍停留在根精灵“脆筒甜甜”上。
* **原因分析**：
  1. 进化链组件的高亮判断条件为 `cleanName === petResult.name`。而 `petResult.name` 永远是进化链底层的根精灵名字（即 `脆筒甜甜` 或 `矿晶虫`），导致高亮永远无法移动至后面的进化形态。
  2. 形态画廊中的「本来的样子」和「默认」按钮的关联逻辑错误地将形态指向了根精灵，导致当用户在查看高阶进化态（如“圣代甜甜”）时，其对应的“本来的样子”按钮未能被正确激活高亮。

---

## 2. 解决方案与修改详情

### ① 数据源去重清洗
* **处理方案**：编写并执行去重脚本对 [pets_data.json](file:///d:/desk/洛克王国孵蛋表-副本/src/pets_data.json) 原地去重，剔除 `evolution_chain` 与 `forms` 内的重复脏数据，恢复两级/三级线性结构的干净进化链。

### ② 升级形态画廊关联逻辑（改为名称匹配）
* 将 `DataQueryTab.tsx` 与 `MerchantFloatWidget.tsx` 的形态映射，由下标匹配重构为基于 `styleName` 的**智能文本匹配**。
* 引入 `formBaseName` 对“本来的样子”进行锁定，确保其准确关联至当前正在展示的进化形态的基准名，而不是底层根精灵。
* **核心代码逻辑**：
  ```typescript
  const formBaseName = petResult.currentForm.name.split(/[（(]/)[0].trim();
  const formItem = petResult.forms.find((f: any) => {
    if (avatar.styleName === '本来的样子' || avatar.styleName === '默认') {
      return f.name === formBaseName;
    }
    return f.name.includes(avatar.styleName);
  }) || petResult.forms[idx] || petResult.currentForm;
  ```

### ③ 升级进化链高亮对比逻辑
* **处理方案**：在 `DataQueryTab.tsx` 组件渲染中声明 `activeFormBase`（剥离括号后缀的当前选中具体形态名），并将进化链普通节点与分支节点的高亮条件修改为与 `activeFormBase` 对齐，从而使高亮指示器能够随用户的跳转动作精准更新。
* **修改处**：
  - [DataQueryTab.tsx](file:///d:/desk/洛克王国孵蛋表-副本/src/components/DataQueryTab.tsx#L494-L498) : `cleanName === activeFormBase`
  - [DataQueryTab.tsx](file:///d:/desk/洛克王国孵蛋表-副本/src/components/DataQueryTab.tsx#L528-L532) : `cleanSub === activeFormBase`

---

## 3. 验证与回归测试情况

为了确保修复质量，我们使用了 Playwright 浏览器自动化对本地开发环境（Port 3000）进行了全功能 E2E 跑测回归：

1. **类型编译与检测**：
   - 运行 `npm run lint`：通过（类型零报错）。
   - 运行 `npm run build`：通过（打包及静态资源复制完美编译）。
2. **多形态数据同步测试**：
   - 输入并检索“晶石蜗”：
     * 默认状态（西瓜碧玺）：种族资质总和显示为 **`583`**。
     * 点击“莲花刚玉的样子”：数据与图片完美联动切换，种族值正确更新为 **`585`**。
     * 再次切换回“西瓜碧玺的样子/星彩榴石的样子”：种族值正确回退为 **`583`**。
   - 输入并检索“鸭吉吉”：
     * 切换“起来鸭”：种族资质总和正确显示为 **`578`**。
     * 切换“等一等鸭”：种族资质总和正确显示为 **`469`**。
     * 切换“蓬松的样子”：种族值与达标阈值正确显示为 **`471`**。
3. **高亮交互测试**：
   - 检索“圣代甜甜”：进化链中的“圣代甜甜”节点亮起蓝色发光框；且形态选择器中的“本来的样子”按钮自动高亮。点击“脆筒甜甜”节点，进化链高亮和形态选项自动跳转，交互流程极度流畅。
4. **桌面助理同步测试**：
   - 在喵喵聊天界面输入并发送“晶石蜗”与“鸭吉吉”，返回的卡片不仅排版美观，其卡片内的形态选择按钮切换时，资质面板与身高体重说明同样实现了 100% 同步变化。

---

## 4. 相关资源路径
* **更新后的知识库**：[.claude/PROJECT_KNOWLEDGE.md](file:///d:/desk/洛克王国孵蛋表-副本/.claude/PROJECT_KNOWLEDGE.md) (已补充多变体精灵名录归档)
* **本次 E2E 测试实机视频**：[test_multiform_display.webp](file:///C:/Users/Administrator/.gemini/antigravity-ide/brain/9f0c4eee-9d99-493b-899f-7f99db011d86/test_multiform_display_1783735587393.webp)
* **本次完整修复清单**：[walkthrough.md](file:///C:/Users/Administrator/.gemini/antigravity-ide/brain/9f0c4eee-9d99-493b-899f-7f99db011d86/walkthrough.md)
