import React, { useState, useEffect, useMemo } from "react";
import { ParentPet, EGG_GROUPS, cleanNature } from "../types";
import { Sparkles, UserCheck } from "lucide-react";

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
  }, [parents, mode]);

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
      </div>

      {/* 主体布局：仓库精灵全览表格（原配组建议已移除，表格100%拉满） */}
      <div className="flex flex-col gap-6">
        
        {/* 仓库精灵全览表格 */}
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm overflow-hidden flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">仓库精灵全览</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">提示: 仅统计当前选中的体型牌。双蛋组会同时亮起。</p>
              </div>

              {/* 大粗/大婉滑动切换组件 */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/40 dark:border-slate-700/40 select-none">
                <button
                  onClick={() => handleModeChange("大粗")}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    mode === "大粗"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                  }`}
                >
                  大粗 🧱
                </button>
                <button
                  onClick={() => handleModeChange("大婉")}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    mode === "大婉"
                      ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                  }`}
                >
                  大婉 🎵
                </button>
              </div>
            </div>

            <button 
              onClick={() => onSelectGrid(null, null, null)}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 px-2 py-1 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
            >
              清空筛选
            </button>
          </div>

          <div className="overflow-x-auto no-scrollbar rounded-xl border border-slate-200/60 dark:border-slate-800">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200/60 dark:border-slate-800 select-none">
                  <th className="py-2.5 px-3 border-r border-slate-200/60 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900 text-left min-w-[80px]">性格 \ 蛋组</th>
                  {EGG_GROUPS.map(group => (
                    <th key={group} className="py-2.5 px-1 min-w-[75px] font-bold text-[10px]">{group}</th>
                  ))}
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

                        // 确定当前格子是否被筛选中
                        const isGridFiltered = activeGroup === group && activeNature === nature;

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
                        }

                        // 如果该格子正处于被点击筛选状态，则强制应用主题色高亮边框
                        if (isGridFiltered) {
                          borderClass = "border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20 dark:ring-indigo-400/20 z-10";
                        }

                        return (
                          <td
                            key={group}
                            onClick={() => onSelectGrid(group, nature, mode)}
                            className={`relative py-2 px-1 cursor-pointer transition-all border border-b-slate-100 dark:border-b-slate-800 font-sans h-11 min-w-[75px] ${bgClass} ${borderClass} hover:brightness-[0.98] dark:hover:brightness-110`}
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
