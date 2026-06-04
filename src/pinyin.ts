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

export function getSingleCharPinyin(char: string): string {
  if (!char || char.trim() === '') return '';
  if (!/[\u4e00-\u9fa5]/.test(char)) {
    return char.toLowerCase();
  }
  
  for (let i = PINYIN_BOUNDS.length - 1; i >= 0; i--) {
    const bound = PINYIN_BOUNDS[i];
    if (char.localeCompare(bound.char, 'zh-Hans-CN') >= 0) {
      return bound.pinyin;
    }
  }
  
  return 'a';
}

export function getPinyinInitials(str: string): string {
  if (!str) return '';
  return Array.from(str).map(getSingleCharPinyin).join('');
}
