import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getPinyinInitials } from '../pinyin';

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  onSelect?: (value: string) => void;
  disabled?: boolean;
}

export const filterOptions = (options: string[], query: string): string[] => {
  const PRIORITY_NATURES = ["固执", "聪明", "开朗", "胆小", "平和", "沉默", "踏实"];

  if (!query) {
    // 即使没有 query，也先把这 7 大性格排在最上面，方便用户直接选择
    const sortedOptions = [...options].sort((a, b) => {
      const aPriority = PRIORITY_NATURES.some(name => a.startsWith(name));
      const bPriority = PRIORITY_NATURES.some(name => b.startsWith(name));
      if (aPriority && !bPriority) return -1;
      if (!aPriority && bPriority) return 1;
      return options.indexOf(a) - options.indexOf(b);
    });
    return sortedOptions.slice(0, 10);
  }
  
  const lowerQuery = query.toLowerCase().trim();
  
  const matches = options.map(opt => {
    const lowerOpt = opt.toLowerCase();
    const initials = getPinyinInitials(opt);
    
    let score = -1;
    if (lowerOpt === lowerQuery) {
      score = 0; // 精确匹配
    } else if (lowerOpt.startsWith(lowerQuery)) {
      score = 1; // 前缀匹配
    } else if (initials.startsWith(lowerQuery)) {
      score = 2; // 拼音首字母前缀匹配
    } else if (lowerOpt.includes(lowerQuery)) {
      score = 3; // 包含匹配
    } else if (initials.includes(lowerQuery)) {
      score = 4; // 拼音首字母包含匹配
    }
    
    return { opt, score };
  });
  
  return matches
     .filter(m => m.score !== -1)
     .sort((a, b) => {
       const aPriority = PRIORITY_NATURES.some(name => a.opt.startsWith(name));
       const bPriority = PRIORITY_NATURES.some(name => b.opt.startsWith(name));
       if (aPriority && !bPriority) return -1;
       if (!aPriority && bPriority) return 1;
       if (a.score !== b.score) {
         return a.score - b.score;
       }
       return options.indexOf(a.opt) - options.indexOf(b.opt);
     })
     .map(m => m.opt)
     .slice(0, 15);
};

// 下拉框估算高度（max-h-56 = 224px）
const DROPDOWN_MAX_HEIGHT = 224;
// 向上弹出时输入框和下拉框之间的间距
const DROPDOWN_GAP = 4;
// 触发向上弹出的最小下方剩余空间阈值
const MIN_SPACE_BELOW = 200;

export const Autocomplete: React.FC<AutocompleteProps> = ({
  value,
  onChange,
  options,
  placeholder = '',
  className = '',
  inputClassName = '',
  onSelect,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [coords, setCoords] = useState<{ top: number; left: number; width: number; openUpward: boolean }>({
    top: 0, left: 0, width: 0, openUpward: false
  });

  // 同步外部value与内部query
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filtered = filterOptions(options, query);

  // 计算并更新下拉菜单的显示坐标（支持向上/向下智能弹出）
  const updateCoords = () => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();

    // 优先使用 visualViewport（移动端键盘弹出后的实际可见视口）
    const vvHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const vvOffsetTop = window.visualViewport ? window.visualViewport.offsetTop : 0;

    // 输入框下方到视口底部的可用空间
    const spaceBelow = vvHeight - (rect.bottom - vvOffsetTop);
    // 输入框上方到视口顶部的可用空间
    const spaceAbove = rect.top - vvOffsetTop;

    const openUpward = spaceBelow < MIN_SPACE_BELOW && spaceAbove > DROPDOWN_MAX_HEIGHT;

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    if (openUpward) {
      // 向上弹出：下拉框的底部贴紧输入框的顶部
      setCoords({
        top: rect.top + scrollY - DROPDOWN_MAX_HEIGHT - DROPDOWN_GAP,
        left: rect.left + scrollX,
        width: rect.width,
        openUpward: true
      });
    } else {
      // 向下弹出（默认）
      setCoords({
        top: rect.bottom + scrollY + DROPDOWN_GAP,
        left: rect.left + scrollX,
        width: rect.width,
        openUpward: false
      });
    }
  };

  // 在打开时监听滚动、大小变化和 visualViewport resize 以更新下拉框位置
  useEffect(() => {
    if (!isOpen) return;

    updateCoords();

    const handleUpdate = () => {
      // 使用 setTimeout 确保在浏览器布局完成后再重新计算坐标
      setTimeout(updateCoords, 0);
    };

    window.addEventListener('resize', handleUpdate);
    // 使用 capture=true 确保检测到页面上所有嵌套容器的滚动
    window.addEventListener('scroll', handleUpdate, true);

    // 监听 visualViewport（移动端键盘弹出时触发）
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleUpdate);
      window.visualViewport.addEventListener('scroll', handleUpdate);
    }

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleUpdate);
        window.visualViewport.removeEventListener('scroll', handleUpdate);
      }
    };
  }, [isOpen]);

  // 监听点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current && containerRef.current.contains(target)) {
        return;
      }
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleSelectOption = (opt: string) => {
    setQuery(opt);
    onChange(opt);
    setIsOpen(false);
    if (onSelect) {
      onSelect(opt);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex(prev => (prev + 1) % filtered.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen) {
        setHighlightedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
      }
    } else if (e.key === 'Enter') {
      if (isOpen && filtered.length > 0) {
        e.preventDefault();
        handleSelectOption(filtered[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Tab') {
      if (isOpen && filtered.length > 0) {
        handleSelectOption(filtered[highlightedIndex]);
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className={inputClassName || "w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"}
      />
      {isOpen && filtered.length > 0 && createPortal(
        <div 
          ref={dropdownRef}
          className={`max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl z-[99999] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent text-left ${coords.openUpward ? 'mb-1' : 'mt-1'}`}
          style={{
            position: 'absolute',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`
          }}
          // 使用 preventDefault 拦截 mousedown，防止输入框失去焦点
          onMouseDown={(e) => e.preventDefault()}
        >
          {filtered.map((opt, idx) => (
            <div
              key={opt}
              onClick={() => handleSelectOption(opt)}
              onMouseEnter={() => setHighlightedIndex(idx)}
              className={`px-3 py-1.5 text-xs cursor-pointer select-none transition-colors ${
                idx === highlightedIndex 
                  ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {opt}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};
