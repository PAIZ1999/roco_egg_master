# Notes: 表格视觉效果优化研究笔记

## 1. 图一与图二的对比及优化要点

| 元素 | 图一状况 (需优化) | 图二效果 (目标) | 实施策略 |
| :--- | :--- | :--- | :--- |
| **网格线** | 密集的纵横分割线 | 仅水平底线，无纵向线 | 移除 header 和 tbody 单元格的所有 `border-r` |
| **斑马纹** | 无交替色，全是白色 | 浅灰/蓝交替背景 | 奇数白，偶数 `bg-slate-50/60 dark:bg-slate-900/30` |
| **3V高亮** | 未突出高亮行 | 优雅的浅蓝/浅青高亮背景 | 3V行应用 `bg-emerald-50/40 dark:bg-emerald-950/10` |
| **性格展示** | 性格全称 + 蓝粉性别，繁杂 | 性格简称，去性别符(若相同) | 提取简称。不同时使用灰色 `♂` `♀` 分行展示 |
| **三维展示** | 明亮蓝粉 `♂` `♀` + 换行 | 相同则单行中性，不同分两行 | 相同显示单行中性；不同用淡雅 ♂/♀ 引导展示 |
| **下拉选择** | 方正 select 框，生硬 | 胶囊状 Badge 下拉标签 | `appearance-none border-0 rounded-full text-center py-1` |
| **现蛋数量** | 大边框数字框 + 微调箭头 | 浅黄/灰 Badge，微调融入 | 有现蛋用 `bg-amber-50`，无现蛋用 `0` 占位 Badge |

## 2. 核心 CSS 与 HTML 结构修改设计

### A. 下拉选择胶囊化 (牌子与状态)
将原本 select 的 class 进行如下升级：
```typescript
// 牌子
className={`appearance-none text-[10.5px] font-bold text-center border-0 rounded-full py-1 px-2.5 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-950 transition-all shadow-3xs ${getBrandStyle(pet.brand)}`}

// 状态
className={`appearance-none text-[10.5px] font-bold text-center border-0 rounded-full py-1 px-3 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-950 transition-all shadow-3xs ${getStatusStyle(pet.status)}`}
```

### B. 现蛋数量容器设计
如果 `pet.status === "有现蛋"`，渲染带背景的圆角 Badge 输入框；否则只显示一个轻巧的灰色 Badge：
```typescript
{pet.status === "有现蛋" ? (
  <div className="flex items-center justify-center gap-1 bg-amber-50/80 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-extrabold border border-amber-200/50 dark:border-amber-900/40 rounded-full pl-2.5 pr-1.5 py-0.5 w-[72px] mx-auto shadow-3xs group/egg">
    <input
      type="number"
      min="0"
      value={pet.eggCount || "0"}
      onChange={(e) => handleUpdateEggCount(pet.id as string, e.target.value)}
      className="w-7 bg-transparent text-center text-xs font-black border-0 p-0 focus:ring-0 focus:outline-none text-amber-800 dark:text-amber-200"
    />
    <div className="flex flex-col gap-0.5 shrink-0 select-none text-[8px] font-bold text-amber-500/70 hover:text-amber-700">
      <button
        onClick={() => handleUpdateEggCount(pet.id as string, String(Number(pet.eggCount || 0) + 1))}
        className="hover:text-amber-600 cursor-pointer"
      >
        ▲
      </button>
      <button
        onClick={() => handleUpdateEggCount(pet.id as string, String(Math.max(0, Number(pet.eggCount || 0) - 1)))}
        className="hover:text-amber-600 cursor-pointer"
      >
        ▼
      </button>
    </div>
  </div>
) : (
  <div className="bg-slate-50/60 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 font-bold border border-slate-100 dark:border-slate-800/40 rounded-full py-0.5 w-[72px] text-center mx-auto text-xs select-none">
    0
  </div>
)}
```

### C. 垃圾桶按钮精细化
```typescript
<button
  onClick={() => handleDeletePet(pet.id as string)}
  className="text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 p-1.5 rounded-lg transition-colors cursor-pointer"
  title="删除该蛋窝"
>
  <Trash2 className="w-3.5 h-3.5" />
</button>
```
