import React, { useState, useEffect, useMemo } from "react";
import { ParentPet, EGG_GROUPS, cleanNature } from "../types";
import { Sparkles, Check, Play, UserCheck } from "lucide-react";

// 8种常用性格定义
export const STATS_NATURES = ["开朗", "胆小", "固执", "聪明", "平和", "踏实", "沉默", "急躁"];

interface WarehouseStatsTableProps {
  parents: ParentPet[];
  activeGroup: string;
  activeNature: string;
  activeBrand: string;
  onSelectGrid: (group: string | null, nature: string | null, brand: "大粗" | "大腕" | null) => void;
  onSelectPair: (fatherId: string, motherId: string) => void;
}

export const WarehouseStatsTable: React.FC<WarehouseStatsTableProps> = ({
  parents,
  activeGroup,
  activeNature,
  activeBrand,
  onSelectGrid,
  onSelectPair,
}) => {
  // 1. 内部维护大粗/大腕的切换状态，默认大粗
  const [mode, setMode] = useState<"大粗" | "大腕">("大粗");

  // 只要下方筛选框的牌子过滤变成了大粗或大腕，同步更新此处的模式
  useEffect(() => {
    if (activeBrand === "大粗" || activeBrand === "大腕") {
      setMode(activeBrand);
    }
  }, [activeBrand]);

  // 2. 常用性格归一化提取辅助函数
  const getShortNature = (fullNature: string): string | null => {
    const cleanN = cleanNature(fullNature);
    if (!cleanN) return null;
    return STATS_NATURES.find(n => cleanN.startsWith(n)) || null;
  };

  // 3. 统计每个格子下的父母本 (严格限定 brand === mode)
  const stats = useMemo(() => {
    const tempStats: Record<string, Record<string, { fathers: ParentPet[]; mothers: ParentPet[] }>> = {};
    
    // 初始化空结构
    for (const group of EGG_GROUPS) {
      tempStats[group] = {};
      for (const nature of STATS_NATURES) {
        tempStats[group][nature] = { fathers: [], mothers: [] };
      }
    }

    // 填充数据 (仅限当前 mode 的品牌计入表格)
    for (const p of parents) {
      if (!p.sprite || p.brand !== mode) continue;
      const shortN = getShortNature(p.nature);
      if (!shortN) continue;

      for (const group of p.groups) {
        if (tempStats[group] && tempStats[group][shortN]) {
          if (p.gender === "♂") {
            tempStats[group][shortN].fathers.push(p);
          } else {
            tempStats[group][shortN].mothers.push(p);
          }
        }
      }
    }

    return tempStats;
  }, [parents, mode]);

  // 4. 计算“可产蛋区域（呼吸灯）”智能判定 (父母都必须拥有当前选择的 brand)
  const spawnableGrid = useMemo(() => {
    const tempSpawnable: Record<
      string,
      Record<string, { spawnable: boolean; father?: ParentPet; mother?: ParentPet }>
    > = {};

    for (const group of EGG_GROUPS) {
      tempSpawnable[group] = {};
      for (const nature of STATS_NATURES) {
        tempSpawnable[group][nature] = { spawnable: false };
      }
    }

    // 过滤出所有有名字且牌子与当前 mode 吻合的父母本
    const allValidParents = parents.filter(p => p.sprite && p.brand === mode);
    const fathers = allValidParents.filter(p => p.gender === "♂");
    const mothers = allValidParents.filter(p => p.gender === "♀");

    for (const group of EGG_GROUPS) {
      for (const nature of STATS_NATURES) {
        const grid = stats[group]?.[nature];
        if (!grid) continue;

        const hasFather = grid.fathers.length > 0;
        const hasMother = grid.mothers.length > 0;

        // 如果这个格子公母齐全，则不需要繁育推荐
        if (hasFather && hasMother) continue;

        // 寻找满足直接交配路径的父母：
        // 母本 M 必须含有蛋组 group，且牌子为当前 mode
        // 父本 F 必须是性格 nature，且牌子为当前 mode
        // 且 F 和 M 至少有一个蛋组相交
        const targetMothers = mothers.filter(m => m.groups.includes(group));
        const targetFathers = fathers.filter(f => getShortNature(f.nature) === nature);

        let foundPair = false;
        let matchedFather: ParentPet | undefined = undefined;
        let matchedMother: ParentPet | undefined = undefined;

        for (const m of targetMothers) {
          for (const f of targetFathers) {
            const hasIntersection = f.groups.some(g => m.groups.includes(g));
            if (hasIntersection) {
              foundPair = true;
              matchedFather = f;
              matchedMother = m;
              break;
            }
          }
          if (foundPair) break;
        }

        if (foundPair) {
          tempSpawnable[group][nature] = {
            spawnable: true,
            father: matchedFather,
            mother: matchedMother,
          };
        }
      }
    }

    return tempSpawnable;
  }, [parents, stats, mode]);

  // 5. 生成配组建议列表
  const breedingRecommendations = useMemo(() => {
    const list: Array<{
      id: string;
      targetGroup: string;
      targetNature: string;
      father: ParentPet;
      mother: ParentPet;
      missing: "♂" | "♀" | "both";
    }> = [];

    for (const group of EGG_GROUPS) {
      for (const nature of STATS_NATURES) {
        const grid = stats[group]?.[nature];
        if (!grid) continue;

        const hasFather = grid.fathers.length > 0;
        const hasMother = grid.mothers.length > 0;

        if (hasFather && hasMother) continue;

        const spInfo = spawnableGrid[group]?.[nature];
        if (spInfo && spInfo.spawnable && spInfo.father && spInfo.mother) {
          list.push({
            id: `${group}-${nature}`,
            targetGroup: group,
            targetNature: nature,
            father: spInfo.father,
            mother: spInfo.mother,
            missing: !hasFather && !hasMother ? "both" : !hasFather ? "♂" : "♀",
          });
        }
      }
    }

    // 按照缺公 -> 缺母 -> 缺双向的优先级排序，以优化收集路线
    return list.sort((a, b) => {
      const score = (x: typeof a) => (x.missing === "♂" ? 1 : x.missing === "♀" ? 2 : 3);
      return score(a) - score(b);
    });
  }, [stats, spawnableGrid]);

  // 计算总收集进度：112 个常用位置 (14 蛋组 x 8 性格) 中，已拥有当前 mode 种公的格子数
  const totalFathersCollected = useMemo(() => {
    let count = 0;
    for (const group of EGG_GROUPS) {
      for (const nature of STATS_NATURES) {
        if (stats[group]?.[nature]?.fathers.length > 0) {
          count++;
        }
      }
    }
    return count;
  }, [stats]);

  // 已集齐公母的格子数
  const totalPairsCollected = useMemo(() => {
    let count = 0;
    for (const group of EGG_GROUPS) {
      for (const nature of STATS_NATURES) {
        const g = stats[group]?.[nature];
        if (g && g.fathers.length > 0 && g.mothers.length > 0) {
          count++;
        }
      }
    }
    return count;
  }, [stats]);

  // 处理模式切换并同步联动下方列表
  const handleModeChange = (newMode: "大粗" | "大腕") => {
    setMode(newMode);
    // 切换后，自动把下方列表筛选中的牌子也同步更改为对应品牌
    onSelectGrid(activeGroup || null, activeNature || null, newMode);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 顶层面板：数据统计与全局概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-xs flex items-center justify-between col-span-1 md:col-span-1">
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">{mode}直接繁育缺口</p>
            <h3 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {breedingRecommendations.length} <span className="text-sm font-medium text-slate-500">处</span>
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">当前仓库支持直接配对繁育【{mode}】的性格蛋组</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-500 dark:text-amber-400">
            <Play className="w-5 h-5 animate-bounce" />
          </div>
        </div>
      </div>

      {/* 主体布局：左侧统计大表格，右侧配组建议 */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* 左侧：仓库精灵全览表格 */}
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm overflow-hidden flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">仓库精灵全览</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">提示: 仅统计当前选中的体型牌。双蛋组会同时亮起。</p>
              </div>

              {/* 大粗/大腕滑动切换组件 */}
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
                  onClick={() => handleModeChange("大腕")}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    mode === "大腕"
                      ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                  }`}
                >
                  大腕 🎵
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
                  <th className="py-2.5 px-3 border-r border-slate-200/60 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900 text-left min-w-[70px]">蛋组 \ 性格</th>
                  {STATS_NATURES.map(nature => (
                    <th key={nature} className="py-2.5 px-1 min-w-[65px] font-bold">{nature}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs select-none">
                {EGG_GROUPS.map(group => {
                  // 判断当前是否在筛选该蛋组
                  const isGroupFiltered = activeGroup === group;

                  return (
                    <tr key={group} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      {/* 蛋组名列 */}
                      <td 
                        onClick={() => onSelectGrid(group, null, mode)}
                        className={`py-2 px-3 border-r border-slate-200/60 dark:border-slate-800 font-bold text-left cursor-pointer transition-colors ${
                          isGroupFiltered 
                            ? "bg-indigo-100/70 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300" 
                            : "bg-slate-50/30 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                        }`}
                      >
                        {group}
                      </td>

                      {/* 8个性格格子 */}
                      {STATS_NATURES.map(nature => {
                        const grid = stats[group]?.[nature];
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

                        // 判断是否属于“可产蛋区域（呼吸灯）”
                        const isSpawnable = spawnableGrid[group]?.[nature]?.spawnable;

                        return (
                          <td
                            key={nature}
                            onClick={() => onSelectGrid(group, nature, mode)}
                            className={`relative py-2 px-1 cursor-pointer transition-all border border-b-slate-100 dark:border-b-slate-800 font-sans h-11 min-w-[65px] ${bgClass} ${borderClass} hover:brightness-[0.98] dark:hover:brightness-110`}
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
                              <span className="text-[9px] text-slate-300 dark:text-slate-700 font-medium">无记录</span>
                            )}

                            {/* 呼吸灯：可产蛋区域指示 */}
                            {isSpawnable && !isGridFiltered && (
                              <div 
                                className="absolute inset-0.5 border-1.5 border-dashed border-amber-400/90 dark:border-amber-500/80 rounded-md pointer-events-none animate-pulse"
                                title={`当前拥有一对能直接繁育出【${mode}】该性格的父母，可产蛋！`}
                              />
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
              <span className="w-3.5 h-3.5 rounded border-1.5 border-dashed border-amber-400 dark:border-amber-500"></span>
              <span>呼吸灯: 可产蛋区域 (产当前体型)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"></span>
              <span>暂无记录</span>
            </div>
          </div>
        </div>

        {/* 右侧：配组智能建议模块 */}
        <div className="w-full lg:w-80 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col gap-3 h-[590px] overflow-hidden">
          <div className="shrink-0">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" style={{ animationDuration: "3s" }} />
              {mode}配组建议
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              推荐可繁育【{mode}】的常用性格黄金配对
            </p>
          </div>

          <div className="flex-1 overflow-y-auto pr-0.5 no-scrollbar flex flex-col gap-3">
            {breedingRecommendations.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-800/10 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 select-none">
                <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">暂无可繁育的建议</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  需要你有【{mode}】且特定性格的父本和对应蛋组的母本。请先在仓库录入更多精灵吧！
                </p>
              </div>
            ) : (
              breedingRecommendations.map((rec) => (
                <div 
                  key={rec.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-indigo-200 dark:hover:border-indigo-900/60 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-all flex flex-col gap-2 relative group"
                >
                  {/* 目标徽章 */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                      【{rec.targetGroup} · {rec.targetNature}】
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                      rec.missing === "♂" 
                        ? "bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/30" 
                        : rec.missing === "♀"
                        ? "bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30"
                        : "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30"
                    }`}>
                      {rec.missing === "♂" ? "缺种公" : rec.missing === "♀" ? "缺种母" : "缺公母"}
                    </span>
                  </div>

                  {/* 繁育关系链 */}
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-1 rounded">父本</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{rec.father.sprite}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">({rec.father.nature})</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="font-semibold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1 rounded">母本</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{rec.mother.sprite}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">({rec.mother.nature})</span>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100/60 dark:border-slate-800/50 mt-1 select-none">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">
                      有交集蛋组: {rec.father.groups.filter(g => rec.mother.groups.includes(g)).join(", ")}
                    </span>
                    <button
                      onClick={() => onSelectPair(rec.father.id, rec.mother.id)}
                      className="px-2 py-1 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-sm shadow-indigo-600/10"
                    >
                      <Check className="w-3 h-3" />
                      一键选中
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
