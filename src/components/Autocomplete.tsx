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

const filterOptions = (options: string[], query: string): string[] => {
  if (!query) return options.slice(0, 10);
  
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
     .sort((a, b) => a.score - b.score)
     .map(m => m.opt)
     .slice(0, 15);
};

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

  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  // 同步外部value与内部query
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filtered = filterOptions(options, query);

  // 计算并更新下拉菜单的显示坐标
  const updateCoords = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  // 在打开时监听滚动和大小变化以更新下拉框位置
  useEffect(() => {
    if (!isOpen) return;

    updateCoords();

    window.addEventListener('resize', updateCoords);
    // 使用 capture=true 确保检测到页面上所有嵌套容器的滚动
    window.addEventListener('scroll', updateCoords, true);

    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
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
        className={inputClassName || "w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"}
      />
      {isOpen && filtered.length > 0 && createPortal(
        <div 
          ref={dropdownRef}
          className="max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl z-[99999] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent text-left mt-1"
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
