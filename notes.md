# Research Notes

## 拼音首字母匹配算法
我们在 `scratch/verify_pinyin_dataset.js` 中成功使用了如下的字符区间匹配算法来提取首字母。为了 100% 精确，使用了边界数组进行定位：

```typescript
const PINYIN_BOUNDS = [
  { char: '啊', pinyin: 'a' },
  { char: '芭', pinyin: 'b' },
  { char: '擦', pinyin: 'c' },
  { char: '搭', pinyin: 'd' },
  { char: '蛾', pinyin: 'e' },
  { char: '发', pinyin: 'f' },
  { char: '噶', pinyin: 'g' },
  { char: '哈', pinyin: 'h' },
  { char: '击', pinyin: 'j' },
  { char: '喀', pinyin: 'k' },
  { char: '垃', pinyin: 'l' },
  { char: '妈', pinyin: 'm' },
  { char: '拿', pinyin: 'n' },
  { char: '哦', pinyin: 'o' },
  { char: '啪', pinyin: 'p' },
  { char: '期', pinyin: 'q' },
  { char: '然', pinyin: 'r' },
  { char: '撒', pinyin: 's' },
  { char: '塌', pinyin: 't' },
  { char: '挖', pinyin: 'w' },
  { char: '昔', pinyin: 'x' },
  { char: '压', pinyin: 'y' },
  { char: '匝', pinyin: 'z' }
];
```

配合 `localeCompare` 判定，能完全覆盖 351 个精灵中文名字对应的拼音首字母。

## 精灵图片匹配规则
精灵图片放在 `images/sprites/` 目录下，文件名格式通常为 `[精灵名称]_[其他信息].png` 或 `[精灵名称].png`。
我们需要遍历 `src/sprite_files.json` 的文件名，对输入的精灵名称进行模糊搜索：
1. 精确匹配：文件名除去 `.png` 后等于 `精灵名`。
2. 前缀匹配：文件名以 `精灵名_` 开头。
3. 如果依然匹配不到，回退到 `images/sprites/[精灵名].png`，或者无图时的占位元素。

## 进化链高阶提取
`images/洛克王国_蛋组精灵表.json` 中的每项纪录都包含 `family_chain` 字段，类型为 string，格式如 `"喵喵 → 武斗酷猫 → 圣藤草王"` 或者直接是 `"某个精灵"`。
通过对 `family_chain` 进行按 `" → "` 拆分，其最后一个元素即为该精灵对应进化链的最高阶精灵名称：
```typescript
const parts = item.family_chain.split(" → ");
const maxStageName = parts[parts.length - 1].trim();
```

## 精灵头像悬浮删除按钮设计
- **布局定位**: 放弃宠物名左侧的 `-left-2` 位置，将其完全移入精灵头像的 `div` 容器（`Avatar Container`）中。
- **触发机制**: 
  - 头像容器添加 `relative group/avatar`。
  - 删除按钮（`button`）设置为绝对定位 `absolute inset-0 z-20`，大小完全覆盖头像。
  - 使用 `opacity-0 group-hover/avatar:opacity-100` 控制其显示。
  - 背景使用半透明红色蒙版 `bg-rose-500/90 hover:bg-rose-600/95`，内置白色大垃圾桶图标。
  - 头像内原有的图片在 hover 时使用 `group-hover/avatar:scale-75` 微缩，从而营造出按钮“放大且吞噬”头像的精美交互体验。


输入低阶精灵名字并完成选定后，自动替换为最高阶名称，再填充对应的蛋组和系别。
