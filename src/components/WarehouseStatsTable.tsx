import React, { useState, useEffect, useMemo, useRef } from "react";
import { ParentPet, EGG_GROUPS, cleanNature } from "../types";
import { Sparkles, UserCheck, Search, X, CheckSquare, Square } from "lucide-react";
import { ALL_PET_NAMES, getPetDetails, getSpriteFileName, getImagePath } from "../petHelper";

// 8种常用性格定义
export const STATS_NATURES = ["开朗", "胆小", "固执", "聪明", "平和", "踏实", "沉默", "急躁"];

interface WarehouseStatsTableProps {
  parents: ParentPet[];
  activeGroup: string;
  activeNature: string;
  activeBrand: string;
  onSelectGrid: (group: string | null, nature: string | null, brand: "大粗" | "大婉" | null) => void;
}

export const WarehouseStatsTable: React.FC<WarehouseStatsTableProps> = ({
  parents,
  activeGroup,
  activeNature,
  activeBrand,
  onSelectGrid,
}) => {
  // 1. 内部维护大粗/大婉的切换状态，默认大婉
  const [mode, setMode] = useState<"大粗" | "大婉">("大婉");

  // 1.5. 只看种公
  const [onlyFathers, setOnlyFathers] = useState(false);

  // 1.6. 精灵蛋组查询状态
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedPetDetails, setSearchedPetDetails] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedSuggestionIdx, setFocusedSuggestionIdx] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);

  // 1.7. 过滤联想项逻辑
  const getFilteredSuggestions = () => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return ALL_PET_NAMES.filter(name => name.toLowerCase().includes(query)).slice(0, 5);
  };

  // 点击外部自动关闭联想提示框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 只要下方筛选框的牌子过滤变成了大粗或大婉，同步更新此处的模式
  useEffect(() => {
    if (activeBrand === "大粗" || activeBrand === "大婉") {
      setMode(activeBrand);
    }
  }, [activeBrand]);

  // 2. 常用性格归一化提取辅助函数
  const getShortNature = (fullNature: string): string | null => {
    const cleanN = cleanNature(fullNature);
    if (!cleanN) return null;
    return STATS_NATURES.find(n => cleanN.startsWith(n)) || null;
  };

  // 3. 统计每个格子下的父母本 (键结构：stats[nature][group])
  const stats = useMemo(() => {
    const tempStats: Record<string, Record<string, { fathers: ParentPet[]; mothers: ParentPet[] }>> = {};
    
    // 初始化空结构 (外层是性格，内层是蛋组)
    for (const nature of STATS_NATURES) {
      tempStats[nature] = {};
      for (const group of EGG_GROUPS) {
        tempStats[nature][group] = { fathers: [], mothers: [] };
      }
    }

    // 填充数据 (仅限当前 mode 的品牌计入表格)
    for (const p of parents) {
      if (!p.sprite || p.brand !== mode) continue;
      // 如果勾选了“只看种公”，且 p.gender === "♀"，则直接跳过！
      if (onlyFathers && p.gender === "♀") continue;

      const shortN = getShortNature(p.nature);
      if (!shortN) continue;

      for (const group of p.groups) {
        if (tempStats[shortN] && tempStats[shortN][group]) {
          if (p.gender === "♂") {
            tempStats[shortN][group].fathers.push(p);
          } else {
            tempStats[shortN][group].mothers.push(p);
          }
        }
      }
    }

    return tempStats;
  }, [parents, mode, onlyFathers]);

  // 计算总收集进度：112 个常用位置 (14 蛋组 x 8 性格) 中，已拥有当前 mode 种公的格子数
  const totalFathersCollected = useMemo(() => {
    let count = 0;
    for (const nature of STATS_NATURES) {
      for (const group of EGG_GROUPS) {
        if (stats[nature]?.[group]?.fathers.length > 0) {
          count++;
        }
      }
    }
    return count;
  }, [stats]);

  // 已集齐公母的格子数
  const totalPairsCollected = useMemo(() => {
    let count = 0;
    for (const nature of STATS_NATURES) {
      for (const group of EGG_GROUPS) {
        const g = stats[nature]?.[group];
        if (g && g.fathers.length > 0 && g.mothers.length > 0) {
          count++;
        }
      }
    }
    return count;
  }, [stats]);

  // 处理模式切换并同步联动下方列表
  const handleModeChange = (newMode: "大粗" | "大婉") => {
    setMode(newMode);
    // 切换后，自动把下方列表筛选中的牌子也同步更改为对应品牌
    onSelectGrid(activeGroup || null, activeNature || null, newMode);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 顶层面板：数据统计与全局概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">{mode}种公收集进度</p>
            <h3 className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
              {totalFathersCollected} <span className="text-sm font-medium text-slate-500">/ 112 种</span>
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">已点亮 14 蛋组 × 8 常用性格的【{mode}】父本</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-500 dark:text-blue-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {searchedPetDetails ? (
          <div className="bg-gradient-to-r from-indigo-50/50 to-amber-50/50 dark:from-indigo-950/20 dark:to-slate-950/40 border border-indigo-100 dark:border-indigo-900/60 p-4 rounded-xl shadow-xs flex items-center justify-between relative overflow-hidden">
            <div className="flex items-center gap-3">
              {/* 精灵头像 */}
              {(() => {
                const spriteFile = getSpriteFileName(searchedPetDetails.name);
                const spriteUrl = spriteFile ? getImagePath(`images/sprites/${spriteFile}`) : null;
                return (
                  <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                    {spriteUrl ? (
                      <img src={spriteUrl} alt={searchedPetDetails.name} className="w-[85%] h-[85%] object-contain" />
                    ) : (
                      <div className="text-lg font-bold text-slate-350 font-mono">?</div>
                    )}
                  </div>
                );
              })()}
              <div>
                <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 tracking-wider">精灵蛋组查询结果</p>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-100 mt-0.5">{searchedPetDetails.name}</h3>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {searchedPetDetails.groups.map((grp: string) => (
                    <span
                      key={grp}
                      className="inline-block text-[10px] font-extrabold border border-indigo-200 dark:border-indigo-900 bg-indigo-50/80 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-full text-indigo-700 dark:text-indigo-300 animate-pulse"
                    >
                      {grp}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 右侧清除按钮 */}
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchedPetDetails(null);
              }}
              className="absolute top-2 right-2 p-1 text-slate-450 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-all cursor-pointer"
              title="清除查询结果"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="text-[10px] text-indigo-400/80 dark:text-indigo-500/70 font-semibold self-end shrink-0 hidden sm:block whitespace-nowrap">
              已高亮下方蛋组列
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">{mode}公母配对达成度</p>
              <h3 className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
                {totalPairsCollected} <span className="text-sm font-medium text-slate-500">/ 112 对</span>
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">已同时拥有同组同性格【{mode}】种公和种母的格子数</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-500 dark:text-purple-400">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>
        )}
      </div>

      {/* 主体布局：仓库精灵全览表格（原配组建议已移除，表格100%拉满） */}
      <div className="flex flex-col gap-6">
        
        {/* 仓库精灵全览表格 */}
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm overflow-hidden flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 select-none">
            <div className="flex flex-wrap items-center gap-3.5">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">仓库精灵全览</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-0.5">提示: 仅统计当前选中的体型牌。双蛋组会同时亮起。</p>
              </div>

              {/* 大粗/大婉滑动切换组件 */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/40 dark:border-slate-700/40 shrink-0">
                <button
                  onClick={() => handleModeChange("大粗")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    mode === "大粗"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                  }`}
                >
                  大粗 🧱
                </button>
                <button
                  onClick={() => handleModeChange("大婉")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    mode === "大婉"
                      ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                  }`}
                >
                  大婉 🎵
                </button>
              </div>

              {/* 只看种公 Toggle */}
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-350 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-1 px-2.5 h-8 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 shadow-3xs transition-all shrink-0">
                <input
                  type="checkbox"
                  checked={onlyFathers}
                  onChange={(e) => setOnlyFathers(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-indigo-650 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 cursor-pointer"
                />
                <span>只看种公</span>
              </label>

              {/* 精灵蛋组查询 (智能联想 autocomplete) */}
              <div ref={searchRef} className="relative flex items-center shrink-0 w-full sm:w-[185px]">
                <div className="absolute left-2.5 text-slate-400 pointer-events-none">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    setShowSuggestions(true);
                    setFocusedSuggestionIdx(0); // 默认高亮第一项
                    const details = getPetDetails(val.trim());
                    if (details) {
                      setSearchedPetDetails(details);
                    } else {
                      setSearchedPetDetails(null);
                    }
                  }}
                  onKeyDown={(e) => {
                    const suggestions = getFilteredSuggestions();
                    if (suggestions.length === 0) return;

                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setFocusedSuggestionIdx(prev => (prev + 1) % suggestions.length);
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setFocusedSuggestionIdx(prev => (prev - 1 + suggestions.length) % suggestions.length);
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      const idx = focusedSuggestionIdx >= 0 && focusedSuggestionIdx < suggestions.length ? focusedSuggestionIdx : 0;
                      const selectedName = suggestions[idx];
                      if (selectedName) {
                        setSearchQuery(selectedName);
                        const details = getPetDetails(selectedName);
                        setSearchedPetDetails(details);
                        setShowSuggestions(false);
                      }
                    } else if (e.key === "Escape") {
                      setShowSuggestions(false);
                    }
                  }}
                  placeholder="输入精灵名查蛋组..."
                  className="w-full pl-8 pr-7 py-1 h-8 text-xs font-semibold rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-855 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-all shadow-3xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchedPetDetails(null);
                    }}
                    className="absolute right-2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* 智能联想下拉建议菜单 */}
                {showSuggestions && searchQuery.trim().length > 0 && (
                  <div className="absolute top-9 left-0 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-md max-h-48 overflow-y-auto z-40 py-1 divide-y divide-slate-50 dark:divide-slate-700/40">
                    {(() => {
                      const filtered = getFilteredSuggestions();
                      if (filtered.length === 0) {
                        return (
                          <div className="px-3 py-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                            未找到该精灵
                          </div>
                        );
                      }
                      return filtered.map((name, index) => {
                        const details = getPetDetails(name);
                        const spriteFile = getSpriteFileName(name);
                        const spriteUrl = spriteFile ? getImagePath(`images/sprites/${spriteFile}`) : null;
                        const isFocused = index === focusedSuggestionIdx;
                        return (
                          <button
                            key={name}
                            onClick={() => {
                              setSearchQuery(name);
                              setSearchedPetDetails(details);
                              setShowSuggestions(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 flex items-center gap-2 cursor-pointer transition-colors ${
                              isFocused
                                ? "bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-750 dark:text-indigo-300 border-l-2 border-l-indigo-500 font-bold"
                                : "hover:bg-slate-50 dark:hover:bg-slate-750"
                            }`}
                          >
                            <div className="w-6 h-6 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 flex items-center justify-center overflow-hidden shrink-0">
                              {spriteUrl ? (
                                <img src={spriteUrl} alt={name} className="w-[85%] h-[85%] object-contain" />
                              ) : (
                                <div className="text-[10px] text-slate-350 font-mono">?</div>
                              )}
                            </div>
                            <div className="flex flex-col min-w-0 leading-tight">
                              <span className="text-xs text-slate-800 dark:text-slate-100 truncate">{name}</span>
                              {details && details.groups && (
                                <span className="text-[9px] text-indigo-400 dark:text-indigo-500 font-semibold truncate">
                                  {details.groups.join('/')}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => {
                onSelectGrid(null, null, null);
                setSearchQuery("");
                setSearchedPetDetails(null);
              }}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 px-2.5 py-1 h-8 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer shrink-0 ml-auto lg:ml-0"
            >
              清空筛选
            </button>
          </div>

          <div className="overflow-x-auto no-scrollbar rounded-xl border border-slate-200/60 dark:border-slate-800">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200/60 dark:border-slate-800 select-none">
                  <th className={`py-2.5 px-3 border-r border-slate-200/60 dark:border-slate-800 text-left min-w-[80px] transition-all ${
                    searchedPetDetails 
                      ? "bg-amber-100/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-extrabold border-b border-b-amber-400"
                      : "bg-slate-100/50 dark:bg-slate-900 text-slate-500 dark:text-slate-400"
                  }`}>
                    {searchedPetDetails ? (
                      <div className="flex items-center gap-1.5 leading-none select-none">
                        <span>🔍 查: {searchedPetDetails.name}</span>
                      </div>
                    ) : (
                      "性格 \\ 蛋组"
                    )}
                  </th>
                  {EGG_GROUPS.map(group => {
                    const isGroupFiltered = activeGroup === group;
                    const isGroupQueried = searchedPetDetails && searchedPetDetails.groups.includes(group);
                    
                    let highlightClass = "";
                    if (isGroupFiltered) {
                      highlightClass = "bg-indigo-100/75 dark:bg-indigo-950/75 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-300 dark:ring-indigo-900";
                    } else if (isGroupQueried) {
                      highlightClass = "bg-amber-100/85 dark:bg-amber-950/75 text-amber-950 dark:text-amber-200 ring-2 ring-amber-400/85 z-10 animate-pulse";
                    }

                    return (
                      <th
                        key={group}
                        onClick={() => onSelectGrid(group, null, mode)}
                        className={`py-2.5 px-1 min-w-[75px] font-bold text-[10px] cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all select-none ${highlightClass}`}
                      >
                        {group}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs select-none">
                {STATS_NATURES.map(nature => {
                  // 判断当前是否在筛选该性格
                  const isNatureFiltered = activeNature === nature;

                  return (
                    <tr key={nature} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      {/* 性格名列 */}
                      <td 
                        onClick={() => onSelectGrid(null, nature, mode)}
                        className={`py-2 px-3 border-r border-slate-200/60 dark:border-slate-800 font-bold text-left cursor-pointer transition-colors ${
                          isNatureFiltered 
                            ? "bg-indigo-100/70 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300" 
                            : "bg-slate-50/30 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                        }`}
                      >
                        {nature}
                      </td>

                      {/* 14个蛋组的格子 */}
                      {EGG_GROUPS.map(group => {
                        const grid = stats[nature]?.[group];
                        const fatherCount = grid ? grid.fathers.length : 0;
                        const motherCount = grid ? grid.mothers.length : 0;
                        
                        const hasFather = fatherCount > 0;
                        const hasMother = motherCount > 0;

                        // 确定当前行与当前列是否被选中
                        const isRowSelected = activeNature === nature;
                        const isColSelected = activeGroup === group;

                        // 根据公母有无确定背景色
                        let bgClass = "bg-white dark:bg-slate-900";
                        let borderClass = "border-slate-100 dark:border-slate-850/60";

                        if (hasFather && hasMother) {
                          // 公母均有 -> 紫色底
                          bgClass = "bg-purple-100/80 dark:bg-purple-950/40";
                          borderClass = "border-purple-200/80 dark:border-purple-900/50";
                        } else if (hasFather) {
                          // 只有公 -> 蓝色底
                          bgClass = "bg-sky-100/80 dark:bg-sky-950/40";
                          borderClass = "border-sky-200/80 dark:border-sky-900/50";
                        } else if (hasMother) {
                          // 只有母 -> 粉色底
                          bgClass = "bg-rose-100/80 dark:bg-rose-950/40";
                          borderClass = "border-rose-200/80 dark:border-rose-900/50";
                        } else {
                          // 无记录的格子，如果所在的行或列被选中，应用淡蓝色底高亮
                          if (isRowSelected || isColSelected) {
                            bgClass = "bg-indigo-50/30 dark:bg-indigo-950/20";
                          }
                        }

                        const isGroupQueried = searchedPetDetails && searchedPetDetails.groups.includes(group);

                        // 行列高亮交叉十字线边框追加
                        let borderSelectedClass = "";
                        if (isRowSelected) {
                          borderSelectedClass += " border-t-indigo-200 border-b-indigo-200 dark:border-t-indigo-900/50 dark:border-b-indigo-900/50";
                        }
                        if (isColSelected) {
                          borderSelectedClass += " border-l-indigo-200 border-r-indigo-200 dark:border-l-indigo-900/50 dark:border-r-indigo-900/50";
                        }

                        // 精灵蛋组查询的列高亮追加（聚光灯淡金框及淡黄底色高亮）
                        if (isGroupQueried) {
                          borderSelectedClass += " border-l-amber-300 border-r-amber-300 dark:border-l-amber-900/40 dark:border-r-amber-900/40";
                          if (!hasFather && !hasMother && !isRowSelected && !isColSelected) {
                            bgClass = "bg-amber-50/40 dark:bg-amber-950/10";
                          }
                        }

                        // 如果该格子正处于被点击筛选状态（行列交叉点），则强制应用主题色高亮边框和 Ring
                        const isGridFiltered = activeGroup === group && activeNature === nature;
                        if (isGridFiltered) {
                          borderClass = "border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20 dark:ring-indigo-400/20 z-10";
                        }

                        return (
                          <td
                            key={group}
                            onClick={() => onSelectGrid(group, nature, mode)}
                            className={`relative py-2 px-1 cursor-pointer transition-all border border-b-slate-100 dark:border-b-slate-800 font-sans h-11 min-w-[75px] ${bgClass} ${borderClass} ${borderSelectedClass} hover:brightness-[0.98] dark:hover:brightness-110`}
                          >
                            {/* 公母只数显示 */}
                            {(hasFather || hasMother) ? (
                              <div className="flex flex-col gap-0.5 justify-center items-center font-bold text-[10px]">
                                {hasFather && (
                                  <span className="text-sky-600 dark:text-sky-400 tracking-tighter">
                                    ♂{fatherCount}只
                                  </span>
                                )}
                                {hasMother && (
                                  <span className="text-rose-500 dark:text-rose-400 tracking-tighter">
                                    ♀{motherCount}只
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[9px] text-slate-350 dark:text-slate-650 font-medium">无</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 表格图例 */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-850 select-none">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-sky-100 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/50"></span>
              <span>只有种公</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-purple-100 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50"></span>
              <span>公母均有</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-rose-100 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50"></span>
              <span>只有种母</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"></span>
              <span>暂无记录</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
