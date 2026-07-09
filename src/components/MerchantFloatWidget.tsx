import React, { useState, useEffect, useRef } from "react";
import { Store, X, RotateCw, HelpCircle, ChevronRight, Send, ArrowRight, Activity } from "lucide-react";
import { getLiveMerchantData, MerchantData } from "../merchantHelper";
import { queryPet, queryEgg, queryEggGroups, parseEggParams, parseEggGroupParams, QueryPetResult, PredictedEggResult, petsRaceMap } from "../queryHelper";
import { getImagePath, getSpriteFileName } from "../petHelper";

// 1. 原生六边形内联雷达图组件 (适配气泡卡片宽度)
function BubbleRadarChart({ stats }: { stats: { hp: number; speed: number; atk: number; def: number; sp_atk: number; sp_def: number } }) {
  const cx = 95;
  const cy = 90;
  const R = 50;
  const M = 200;

  const keys = ['hp', 'atk', 'def', 'speed', 'sp_def', 'sp_atk'];
  const iconFileNames: Record<string, string> = {
    hp: '生',
    atk: '攻',
    def: '防',
    speed: '速',
    sp_def: '魔防',
    sp_atk: '魔攻'
  };
  const angles = [
    -Math.PI / 2,         // 生命 (正上方)
    7 * Math.PI / 6,      // 物攻
    5 * Math.PI / 6,      // 物防
    Math.PI / 2,          // 速度
    Math.PI / 6,          // 魔防
    -Math.PI / 6          // 魔攻
  ];

  // 背景六边形
  const bgPolygons = [];
  for (let scale = 1; scale <= 5; scale++) {
    const ratio = scale / 5;
    const r = R * ratio;
    const points = angles.map(angle => {
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    bgPolygons.push(
      <polygon
        key={scale}
        points={points}
        className="fill-none stroke-white/5 dark:stroke-slate-800/80 stroke-[0.5]"
      />
    );
  }

  // 轴线
  const axisLines = angles.map((angle, i) => {
    const x = cx + R * Math.cos(angle);
    const y = cy + R * Math.sin(angle);
    return (
      <line
        key={i}
        x1={cx}
        y1={cy}
        x2={x.toFixed(1)}
        y2={y.toFixed(1)}
        className="stroke-white/10 dark:stroke-slate-800/80 stroke-[0.5]"
      />
    );
  });

  // 数据坐标
  const dataPoints = keys.map((key, i) => {
    const val = (stats as any)[key] !== null && (stats as any)[key] !== undefined ? (stats as any)[key] : 0;
    const limitedVal = Math.min(val, M);
    const r = R * (limitedVal / M);
    const angle = angles[i];
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { x, y, val, key };
  });

  const areaPoints = dataPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // 标签
  const labels = dataPoints.map((p, i) => {
    const angle = angles[i];
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const labelDist = R + 10;
    const anchorX = cx + labelDist * cos;
    const anchorY = cy + labelDist * sin;

    let textAnchor = "middle";
    if (cos > 0.1) textAnchor = "start";
    else if (cos < -0.1) textAnchor = "end";

    let dy = "0.33em";
    if (sin < -0.8) dy = "-0.1em";
    else if (sin > 0.8) dy = "0.7em";

    const labelName = iconFileNames[p.key];

    return (
      <text
        key={i}
        x={anchorX.toFixed(1)}
        y={anchorY.toFixed(1)}
        textAnchor={textAnchor}
        dy={dy}
        className="text-[8px] font-bold fill-slate-400"
      >
        {labelName} <tspan className="fill-indigo-300 font-extrabold">{p.val}</tspan>
      </text>
    );
  });

  return (
    <svg viewBox="10 10 170 160" className="w-36 h-36 mx-auto select-none shrink-0">
      <defs>
        <radialGradient id="bubble-radar-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(99, 102, 241, 0.05)" />
          <stop offset="100%" stopColor="rgba(99, 102, 241, 0.25)" />
        </radialGradient>
      </defs>
      <g>
        {bgPolygons}
        {axisLines}
      </g>
      <polygon
        points={areaPoints}
        className="fill-[url(#bubble-radar-grad)] stroke-indigo-500/80 stroke-[1]"
      />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="2" className="fill-indigo-300 stroke-indigo-500 stroke-[0.5]" />
      ))}
      {labels}
    </svg>
  );
}

// 2. 精灵卡片消息气泡组件 (1:1 还原 card.html)
function ChatPetCard({ data }: { data: QueryPetResult }) {
  const [activeForm, setActiveForm] = useState<any>(null);

  useEffect(() => {
    if (data) {
      setActiveForm(data.currentForm);
    }
  }, [data]);

  if (!data || !activeForm) return null;

  const handleSelectForm = (formItem: any) => {
    const raceInfo = petsRaceMap[formItem.name.trim()];
    const race = raceInfo && raceInfo.stats ? {
      sum: raceInfo.sum,
      stats: raceInfo.stats
    } : null;

    setActiveForm({
      ...formItem,
      race
    });
  };

  const getSpritePath = () => {
    const fileName = getSpriteFileName(activeForm.name);
    return fileName ? getImagePath(`images/sprites/${fileName}`) : getImagePath(`images/sprites/${activeForm.name}.png`);
  };

  const typeColorClasses: Record<string, string> = {
    "草": "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
    "火": "border-rose-500/30 text-rose-400 bg-rose-500/10",
    "水": "border-sky-500/30 text-sky-400 bg-sky-500/10",
    "光": "border-amber-500/30 text-amber-400 bg-amber-500/10",
    "地": "border-amber-800/30 text-amber-500 bg-amber-800/10",
    "恶": "border-slate-500/30 text-slate-400 bg-slate-500/10",
    "翼": "border-blue-500/30 text-blue-400 bg-blue-500/10",
    "幽": "border-indigo-500/30 text-indigo-400 bg-indigo-500/10",
    "机械": "border-cyan-500/30 text-cyan-400 bg-cyan-500/10",
    "冰": "border-cyan-300/30 text-cyan-300 bg-cyan-300/10",
    "石": "border-amber-900/30 text-amber-600 bg-amber-900/10",
    "毒": "border-fuchsia-500/30 text-fuchsia-400 bg-fuchsia-500/10",
    "龙": "border-indigo-600/30 text-indigo-350 bg-indigo-600/10",
    "虫": "border-lime-500/30 text-lime-400 bg-lime-500/10",
    "武": "border-red-600/30 text-red-400 bg-red-600/10",
    "电": "border-yellow-500/30 text-yellow-400 bg-yellow-500/10",
    "萌": "border-pink-500/30 text-pink-400 bg-pink-500/10",
    "幻": "border-purple-500/30 text-purple-400 bg-purple-500/10"
  };

  const primaryType = activeForm.types[0] || "普通";
  const glowBorderClass = primaryType ? `border-indigo-500/20` : "border-slate-800";

  return (
    <div className={`w-full max-w-sm rounded-2xl bg-slate-950/80 border ${glowBorderClass} p-4 flex flex-col gap-3.5 relative overflow-hidden select-none text-left`}>
      {/* 顶部流光背景效果 */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/5 rounded-full filter blur-3xl pointer-events-none"></div>

      {/* 头部 (头像 + ID + 名字) */}
      <div className="flex items-center gap-3.5 relative z-10">
        <div className="w-16 h-16 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
          <img
            key={activeForm.name}
            src={getSpritePath()}
            alt={activeForm.name}
            className="w-14 h-14 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = getImagePath("images/egg-icon.png");
            }}
          />
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider font-mono">No.{data.id}</span>
          <h2 className="text-[15px] font-black text-white truncate">{activeForm.name}</h2>
          <div className="flex items-center gap-1.5 flex-wrap">
            {activeForm.types.map((type: string) => (
              <span
                key={type}
                className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded border ${typeColorClasses[type] || "border-slate-800 text-slate-400 bg-slate-900"}`}
              >
                {type}
              </span>
            ))}
            {activeForm.egg_groups.map((group: string) => (
              <span
                key={group}
                className={`text-[8.5px] font-semibold px-1.5 py-0.5 rounded border border-white/5 bg-white/5 text-slate-350`}
              >
                {group}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 形态选择画廊 */}
      {data.avatars && data.avatars.length > 1 && (
        <div className="border-t border-slate-900 pt-2.5">
          <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto no-scrollbar">
            {data.avatars.map((av, avIdx) => {
              const formItem = data.forms[avIdx];
              const isSelected = activeForm.name === formItem.name;
              return (
                <button
                  key={avIdx}
                  onClick={() => handleSelectForm(formItem)}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[8.5px] cursor-pointer hover:bg-slate-900 transition-all ${
                    isSelected
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 font-extrabold"
                      : "bg-slate-950 border-slate-900 text-slate-400"
                  }`}
                >
                  <img
                    src={getImagePath(av.absolutePath)}
                    alt={av.styleName}
                    className="w-4 h-4 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getImagePath("images/egg-icon.png");
                    }}
                  />
                  <span className="truncate max-w-14">{av.styleName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 体积区间面板 */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        {/* 精灵本体体型 */}
        <div className="bg-white/2 p-2.5 rounded-xl border border-white/5 flex flex-col gap-1.5">
          <span className="font-extrabold text-slate-300">📏 精灵体型</span>
          <div className="text-[9.5px] text-slate-400 space-y-0.5">
            <div>身: {activeForm.height_min}m ~ {activeForm.height_max}m</div>
            <div>重: {activeForm.weight_min}kg ~ {activeForm.weight_max}kg</div>
            <div className="text-[8.5px] text-slate-500 border-t border-white/5 pt-1 mt-1">
              <div>大块头: ≥{activeForm.giant_weight_line}kg</div>
              <div>小不点: ≤{activeForm.tiny_weight_line}kg</div>
            </div>
          </div>
        </div>

        {/* 精灵蛋体型 */}
        <div className="bg-white/2 p-2.5 rounded-xl border border-white/5 flex flex-col gap-1.5">
          <span className="font-extrabold text-slate-300">🥚 精灵蛋</span>
          {data.egg_data && !data.egg_data.egg_groups.includes("无法孵蛋") ? (
            <div className="text-[9.5px] text-slate-400 space-y-0.5">
              <div>直: {data.egg_data.height_min}m ~ {data.egg_data.height_max}m</div>
              <div>重: {data.egg_data.weight_min}kg ~ {data.egg_data.weight_max}kg</div>
              <div className="text-[8.5px] text-slate-500 border-t border-white/5 pt-1 mt-1">
                <div>大块头蛋: ≥{data.egg_data.giant_weight_line}kg</div>
                <div>小不点蛋: ≤{data.egg_data.tiny_weight_line}kg</div>
              </div>
            </div>
          ) : (
            <div className="text-[8.5px] text-slate-500 flex items-center justify-center h-full">无法孵蛋</div>
          )}
        </div>
      </div>

      {/* 资质总和与雷达图 */}
      {activeForm.race && (
        <div className="bg-white/2 border border-white/5 rounded-xl p-2.5 flex items-center gap-3">
          <div className="flex-1 flex flex-col gap-1 text-[10px]">
            <span className="text-[10.5px] text-slate-300 font-extrabold flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              资质六围
            </span>
            <div className="text-[11.5px] text-slate-200 mt-1 font-bold">
              总和: <span className="text-emerald-400 text-sm font-black">{activeForm.race.sum}</span>
            </div>
            <div className="text-[8.5px] text-slate-400 space-y-0.5 mt-1 font-mono">
              <div>生命:{activeForm.race.stats.hp} 速度:{activeForm.race.stats.speed}</div>
              <div>物攻:{activeForm.race.stats.atk} 物防:{activeForm.race.stats.def}</div>
              <div>魔攻:{activeForm.race.stats.sp_atk} 魔防:{activeForm.race.stats.sp_def}</div>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-white/5 rounded-lg">
            <BubbleRadarChart stats={activeForm.race.stats} />
          </div>
        </div>
      )}
    </div>
  );
}

// 3. 蛋组筛选卡片气泡组件 (1:1 还原 egg_group.html)
function ChatEggGroupCard({ data, onSelectPet }: { data: { groups: string[], results: any[] }, onSelectPet: (name: string) => void }) {
  const isSingle = data.groups.length === 1;
  const isDual = data.groups.length === 2;

  const matchedCount = data.results.length;

  return (
    <div className="w-full max-w-sm rounded-2xl bg-slate-950/80 border border-indigo-500/20 p-4 flex flex-col gap-3 relative overflow-hidden select-none text-left">
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/5 rounded-full filter blur-3xl pointer-events-none"></div>

      <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
        <span className="p-1 bg-indigo-500/20 rounded-md text-indigo-400">🥚</span>
        <div className="flex flex-col">
          <span className="text-[12px] font-black text-white">
            {isSingle ? `${data.groups[0]}精灵画廊` : '双蛋组筛选结果'}
          </span>
          <span className="text-[9px] text-slate-500 font-medium">共符合 {matchedCount} 只精灵</span>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto custom-scrollbar pr-1">
        {isSingle && matchedCount > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {data.results.map((pet, idx) => {
              const fileName = getSpriteFileName(pet.name);
              const spritePath = fileName ? getImagePath(`images/sprites/${fileName}`) : getImagePath(`images/sprites/${pet.name}.png`);
              return (
                <button
                  key={idx}
                  onClick={() => onSelectPet(pet.name)}
                  className="bg-white/2 border border-white/5 hover:border-indigo-500/40 hover:bg-slate-900 rounded-xl p-1.5 flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95"
                  title="点击查询精灵图鉴"
                >
                  <img
                    src={spritePath}
                    alt={pet.name}
                    className="w-10 h-10 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getImagePath("images/egg-icon.png");
                    }}
                  />
                  <span className="text-[8px] font-bold text-slate-300 truncate w-full text-center">{pet.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {isDual && matchedCount > 0 && (
          <div className="flex flex-col gap-2">
            {data.results.map((pet, idx) => {
              const fileName = getSpriteFileName(pet.name);
              const spritePath = fileName ? getImagePath(`images/sprites/${fileName}`) : getImagePath(`images/sprites/${pet.name}.png`);
              return (
                <button
                  key={idx}
                  onClick={() => onSelectPet(pet.name)}
                  className="flex items-center gap-3 p-2 rounded-xl bg-white/2 border border-white/5 hover:border-indigo-500/40 hover:bg-slate-900 cursor-pointer text-left transition-all"
                  title="点击查询精灵图鉴"
                >
                  <div className="w-10 h-10 bg-slate-900 border border-white/5 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={spritePath}
                      alt={pet.name}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getImagePath("images/egg-icon.png");
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11.5px] font-extrabold text-slate-200 truncate">{pet.name}</span>
                      <span className="text-[8px] text-slate-500 font-mono">No.{pet.id || idx + 1}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      直: {pet.height_min}m ~ {pet.height_max}m | 重: {pet.weight_min}kg ~ {pet.weight_max}kg
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {matchedCount === 0 && (
          <div className="py-8 text-center text-[10.5px] text-slate-500 font-medium">没有找到匹配此蛋组组合的精灵喵~</div>
        )}
      </div>
    </div>
  );
}

// 4. 精灵蛋预测卡片气泡组件 (1:1 还原 egg_predict.html)
function ChatEggPredictCard({ data, onSelectPet }: { data: { height: number, weight: number, results: PredictedEggResult[] }, onSelectPet: (name: string) => void }) {
  const matchedCount = data.results.length;

  return (
    <div className="w-full max-w-sm rounded-2xl bg-slate-950/80 border border-indigo-500/20 p-4 flex flex-col gap-3 relative overflow-hidden select-none text-left">
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/5 rounded-full filter blur-3xl pointer-events-none"></div>

      <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
        <span className="p-1 bg-amber-500/20 rounded-md text-amber-400">🥚</span>
        <div className="flex flex-col">
          <span className="text-[12px] font-black text-white">精灵蛋体形体积检测报告</span>
          <span className="text-[9px] text-slate-500 font-medium">洛克王国宠物繁育实验室</span>
        </div>
      </div>

      {/* 检测指标看板 */}
      <div className="grid grid-cols-2 gap-2 bg-slate-900 border border-white/5 p-2 rounded-xl text-center">
        <div className="flex flex-col">
          <span className="text-[8.5px] text-slate-500 font-bold uppercase">检测直径</span>
          <span className="text-[12px] font-black text-slate-200 mt-0.5">{data.height.toFixed(2)} m</span>
        </div>
        <div className="flex flex-col border-l border-white/5">
          <span className="text-[8.5px] text-slate-500 font-bold uppercase">检测重量</span>
          <span className="text-[12px] font-black text-slate-200 mt-0.5">{data.weight.toFixed(2)} kg</span>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto custom-scrollbar pr-1 space-y-2">
        {matchedCount > 0 ? (
          data.results.map((egg, idx) => {
            const fileName = getSpriteFileName(egg.name);
            const spritePath = fileName ? getImagePath(`images/sprites/${fileName}`) : getImagePath(`images/sprites/${egg.name}.png`);
            return (
              <button
                key={idx}
                onClick={() => onSelectPet(egg.name)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/2 border border-white/5 hover:border-indigo-500/40 hover:bg-slate-900 text-left transition-all cursor-pointer relative"
                title="点击查询精灵图鉴"
              >
                <div className="w-10 h-10 bg-slate-900 border border-white/5 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src={spritePath}
                    alt={egg.name}
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getImagePath("images/egg-icon.png");
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11.5px] font-extrabold text-slate-200 truncate">{egg.name}</span>
                    <span className="text-[11px] font-black text-amber-500">{egg.probability}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[8.5px] text-slate-400 truncate max-w-28">{egg.egg_groups.join(" & ")}</span>
                    <span
                      className={`px-1 rounded text-[7.5px] font-black ${
                        egg.sizeTag === "大块头"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : egg.sizeTag === "小不点"
                          ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                          : "bg-slate-800 text-slate-500 border border-transparent"
                      }`}
                    >
                      {egg.sizeTag}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="py-6 text-center text-[10px] text-slate-500 flex flex-col items-center gap-1.5 font-semibold">
            <span>⚠️ 未检测到匹配的精灵蛋</span>
            <span className="text-[9px] text-slate-600 font-medium">直径与重量未处于现有繁育精灵的标准概率区间内</span>
          </div>
        )}
      </div>
    </div>
  );
}

// 5. 远行商人卡片气泡组件 (1:1 还原 merchant.html)
function ChatMerchantCard({ data }: { data: MerchantData | null }) {
  if (!data) return null;

  const isResting = data.period === 0;
  const getPeriodText = (p: number) => {
    switch (p) {
      case 1: return "08:00 - 12:00";
      case 2: return "12:00 - 16:00";
      case 3: return "16:00 - 20:00";
      case 4: return "20:00 - 24:00";
      default: return "远行商人已打烊";
    }
  };

  return (
    <div className="w-full max-w-sm rounded-2xl bg-slate-950/80 border border-amber-500/20 p-4 flex flex-col gap-3 relative overflow-hidden select-none text-left">
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/5 rounded-full filter blur-3xl pointer-events-none"></div>

      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
        <div className="flex flex-col">
          <h1 className="text-[12.5px] font-black text-white flex items-center gap-1.5">
            🛒 远行商人今日售卖
          </h1>
          <span className="text-[9px] text-slate-500 mt-0.5">
            {isResting ? "每日 00:00-08:00 通常打烊休息中" : `${getPeriodText(data.period)} 商品清单`}
          </span>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
            isResting ? "bg-slate-800 text-slate-400" : "bg-amber-600/20 text-amber-400 border border-amber-500/20 shadow-xs"
          }`}
        >
          {isResting ? "打烊中" : "售卖中"}
        </span>
      </div>

      <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2 pr-1">
        {isResting || data.items.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center gap-1.5 text-xs text-slate-500">
            <span>💤 远行商人休息中哦</span>
            <span className="text-[9.5px] text-slate-600">可以在每日的 08:00 - 24:00 时段查询售卖信息</span>
          </div>
        ) : (
          data.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-2 rounded-xl bg-white/2 border border-white/5 hover:border-amber-500/30 hover:bg-slate-900 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 overflow-hidden border border-white/5">
                {item.sourceImage ? (
                  <img
                    src={item.sourceImage}
                    alt={item.name}
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getImagePath("images/egg-icon.png");
                    }}
                  />
                ) : (
                  <Store className="w-5 h-5 text-slate-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] font-extrabold text-slate-200 truncate">{item.name}</span>
                  <span className="text-[11px] font-black text-amber-500 font-mono">💰{item.price}</span>
                </div>
                <div className="text-[9px] text-slate-400 flex items-center gap-2 mt-0.5">
                  {item.limit && <span className="text-slate-500 font-semibold">{item.limit}</span>}
                  {item.type && <span className="text-slate-500 font-medium">{item.type}</span>}
                </div>
                {item.description && <div className="text-[8px] text-slate-500 truncate mt-0.5">{item.description}</div>}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-[8px] text-slate-600 border-t border-white/5 pt-1.5 mt-1 flex justify-between">
        <span>数据源: 游民星空/好游快爆</span>
        <span>同步于 {data?.updatedAt}</span>
      </div>
    </div>
  );
}

interface Message {
  id: string;
  sender: "user" | "myow";
  type: "text" | "petCard" | "eggGroupCard" | "eggPredictCard" | "merchantCard";
  content: string;
  data?: any;
}

export function MerchantFloatWidget({ isStandalone = false }: { isStandalone?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "myow",
      type: "text",
      content: "主人您好！我是您的智能桌宠助理喵喵 🐱~ \n\n您可以在这里直接输入以下指令：\n• 精灵名字（如“喵喵”、“鸭吉吉”）查精灵\n• 多个蛋组（如“天空 动物”）筛选蛋组精灵\n• 蛋的直径重量（如“0.24 4.8”）预测孵蛋结果\n• 输入“行商”或“远行商人”查询实时售卖清单"
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isMerchantActive, setIsMerchantActive] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [chatWidth, setChatWidth] = useState(380);
  const [chatHeight, setChatHeight] = useState(540);

  // 仅在独立窗口模式下，动态通知 Electron 缩放窗口大小，防止折叠时遮挡桌面其他区域
  useEffect(() => {
    if (isStandalone && window.electronAPI && window.electronAPI.resizeFloatWindow) {
      if (isOpen) {
        window.electronAPI.resizeFloatWindow({ width: chatWidth, height: chatHeight });
      } else {
        window.electronAPI.resizeFloatWindow({ width: 70, height: 75 });
      }
    }
  }, [isOpen, isStandalone, chatWidth, chatHeight]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || isOpen) return; // 必须是左键，且只能在折叠态拖动
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.screenX;
    const startY = e.screenY;
    let lastX = e.screenX;
    let lastY = e.screenY;
    let hasDragged = false;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.screenX - lastX;
      const deltaY = moveEvent.screenY - lastY;
      
      // 累计移动距离如果超过 4 像素，标记为拖拽
      const dist = Math.sqrt(
        Math.pow(moveEvent.screenX - startX, 2) + Math.pow(moveEvent.screenY - startY, 2)
      );
      if (dist > 4) {
        hasDragged = true;
      }
      
      lastX = moveEvent.screenX;
      lastY = moveEvent.screenY;
      
      if (hasDragged && window.electronAPI && window.electronAPI.dragFloatWindow) {
        window.electronAPI.dragFloatWindow({ deltaX, deltaY });
      }
    };
    
    const handleMouseUp = (upEvent: MouseEvent) => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      
      // 只有在没发生实质拖拽的情况下，才触发点击逻辑
      if (!hasDragged) {
        if (clickTimerRef.current) {
          // 双击逻辑：唤醒并显示主窗口
          clearTimeout(clickTimerRef.current);
          clickTimerRef.current = null;
          if (window.electronAPI && window.electronAPI.showMainWindow) {
            window.electronAPI.showMainWindow();
          }
        } else {
          // 单击逻辑：延时判定展开聊天
          clickTimerRef.current = setTimeout(() => {
            clickTimerRef.current = null;
            setIsOpen(true);
          }, 220);
        }
      }
    };
    
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, direction: "left" | "top") => {
    e.preventDefault();
    e.stopPropagation();
    
    let lastX = e.screenX;
    let lastY = e.screenY;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (direction === "left") {
        const deltaX = moveEvent.screenX - lastX;
        lastX = moveEvent.screenX;
        setChatWidth(prev => {
          const next = prev - deltaX;
          return Math.max(320, Math.min(580, next));
        });
      } else if (direction === "top") {
        const deltaY = moveEvent.screenY - lastY;
        lastY = moveEvent.screenY;
        setChatHeight(prev => {
          const next = prev - deltaY;
          return Math.max(400, Math.min(780, next));
        });
      }
    };
    
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // 定期轮询检查行商是否营业以点亮红点
  const checkMerchantStatus = async () => {
    try {
      const data = await getLiveMerchantData();
      if (data && data.items && data.items.length > 0 && data.period !== 0) {
        setIsMerchantActive(true);
      } else {
        setIsMerchantActive(false);
      }
    } catch {
      setIsMerchantActive(false);
    }
  };

  useEffect(() => {
    checkMerchantStatus();
    const interval = setInterval(checkMerchantStatus, 180 * 1000); // 3 分钟轮询
    return () => clearInterval(interval);
  }, []);

  // 滚动至最新消息
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // 追加用户消息
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, {
      id: userMsgId,
      sender: "user",
      type: "text",
      content: text
    }]);
    setInputText("");

    const queryText = text.trim();

    // 分支一：行商
    if (queryText === "行商" || queryText === "远行商人" || queryText === "商行" || queryText === "商人" || queryText === "shop") {
      try {
        const data = await getLiveMerchantData();
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: "myow",
          type: "merchantCard",
          content: "",
          data
        }]);
      } catch {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: "myow",
          type: "text",
          content: "唔……喵喵接头行商失败了耶，请主人待会儿再重试喵~"
        }]);
      }
      return;
    }

    // 分支二：蛋预测 (两个数字)
    const eggParams = parseEggParams(queryText);
    if (eggParams) {
      const results = queryEgg(eggParams.height, eggParams.weight, eggParams.isRideableOnly);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: "myow",
        type: "eggPredictCard",
        content: "",
        data: {
          height: eggParams.height,
          weight: eggParams.weight,
          results
        }
      }]);
      return;
    }

    // 分支三：蛋组
    const eggGroupParams = parseEggGroupParams(queryText);
    if (eggGroupParams) {
      const results = queryEggGroups(eggGroupParams);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: "myow",
        type: "eggGroupCard",
        content: "",
        data: {
          groups: eggGroupParams,
          results
        }
      }]);
      return;
    }

    // 分支四：查精灵 (查精灵名)
    const petResult = queryPet(queryText);
    if (petResult) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: "myow",
        type: "petCard",
        content: "",
        data: petResult
      }]);
      return;
    }

    // 兜底提示
    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      sender: "myow",
      type: "text",
      content: `唔喵……喵喵没听懂“${queryText}”是什么意思耶 😿。` +
        `\n\n您可以试试发这些给喵喵：\n• 精灵名字（如“迪莫”、“水蓝蓝”）\n• 繁育蛋组（如“天空”、“海洋 天空”）\n• 蛋的体积（如“0.28 5.2”）\n• 或者发送“行商”查看今日售卖清单喵！`
    }]);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend(inputText);
    }
  };

  // 单双击事件分流
  const handleFloatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clickTimerRef.current) {
      // 250ms 内的第二次点击，判定为双击
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      if (window.electronAPI && window.electronAPI.showMainWindow) {
        window.electronAPI.showMainWindow();
      }
    } else {
      // 单击：设置定时器延迟执行
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        setIsOpen(true);
      }, 220);
    }
  };

  return (
    <div className={`${isStandalone ? "w-full h-full p-2" : "fixed right-4 bottom-24 z-50"} flex items-end justify-end select-none`}>
      <style>{`
        @keyframes myowFloat {
          0%, 100% { transform: translateY(0px) scale(1) rotate(0deg); }
          50% { transform: translateY(-4px) scale(1.03) rotate(0.8deg); }
        }
        .animate-myow-float {
          animation: myowFloat 3s ease-in-out infinite;
        }
      `}</style>

      {/* 悬浮图标 (折叠态：具有呼吸漂动特效的喵喵桌面宠物) */}
      {!isOpen && (
        <button
          onMouseDown={handleMouseDown}
          className="flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-slate-900/90 to-indigo-950/90 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer relative border border-indigo-500/30 group p-1 animate-myow-float"
          title="按住左键拖拽位置，单击聊天，双击显示软件主页"
        >
          <img
            src={getImagePath("images/sprites/喵喵.png")}
            alt="喵喵"
            draggable={false}
            className="w-12 h-12 object-contain pointer-events-none select-none"
            onError={(e) => {
              (e.target as HTMLImageElement).src = getImagePath("images/egg-icon.png");
            }}
          />
          {isMerchantActive && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-500 rounded-full border border-white flex items-center justify-center animate-bounce shadow">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            </span>
          )}
          {/* 悬浮气泡提示 */}
          {!isStandalone && (
            <span className="absolute right-16 scale-0 group-hover:scale-100 bg-slate-900/90 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg border border-slate-700 transition-all">
              🐱 喵喵智能助手在线！
            </span>
          )}
        </button>
      )}

      {/* 聊天室 (展开态) */}
      {isOpen && (
        <div
          style={{ width: `${chatWidth}px`, height: `${chatHeight}px` }}
          className="flex flex-col bg-slate-900/95 dark:bg-slate-950/98 backdrop-blur-xl border border-slate-700/80 dark:border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 transform scale-100 origin-bottom-right relative"
        >
          {/* 左边缘拉伸把手 */}
          <div
            className="w-2.5 h-full absolute left-0 top-0 cursor-w-resize z-50 hover:bg-indigo-500/10 active:bg-indigo-500/20 transition-all"
            onMouseDown={(e) => handleResizeMouseDown(e, "left")}
          />
          {/* 顶边缘拉伸把手 */}
          <div
            className="h-2.5 w-full absolute left-0 top-0 cursor-n-resize z-50 hover:bg-indigo-500/10 active:bg-indigo-500/20 transition-all"
            onMouseDown={(e) => handleResizeMouseDown(e, "top")}
          />
          {/* 聊天头部 */}
          <div className="px-4 py-3 bg-gradient-to-r from-indigo-900/40 to-slate-900/20 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={getImagePath("images/sprites/喵喵.png")}
                alt="喵喵"
                className="w-7 h-7 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getImagePath("images/egg-icon.png");
                }}
              />
              <div className="flex flex-col">
                <span className="text-[12px] font-black text-indigo-300">桌面助理：喵喵</span>
                <span className="text-[9px] text-slate-500 font-bold">洛克王国孵蛋智能百宝箱</span>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800/60 active:scale-95 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 消息历史区 */}
          <div className="flex-1 overflow-y-auto p-3.5 custom-scrollbar space-y-3.5 bg-slate-900/30">
            {messages.map((msg) => {
              const isMyow = msg.sender === "myow";
              return (
                <div key={msg.id} className={`flex items-start gap-2.5 ${isMyow ? 'justify-start' : 'justify-end'}`}>
                  {isMyow && (
                    <div className="w-7.5 h-7.5 rounded-full bg-slate-950 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        src={getImagePath("images/sprites/喵喵.png")}
                        alt="喵喵"
                        className="w-6.5 h-6.5 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getImagePath("images/egg-icon.png");
                        }}
                      />
                    </div>
                  )}

                  <div className="max-w-[85%]">
                    {msg.type === "text" && (
                      <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed font-bold break-all whitespace-pre-line shadow ${
                        isMyow 
                          ? "bg-slate-850 border border-white/5 text-slate-200" 
                          : "bg-indigo-600 border border-indigo-500 text-white"
                      }`}>
                        {msg.content}
                      </div>
                    )}
                    {msg.type === "petCard" && (
                      <ChatPetCard data={msg.data} />
                    )}
                    {msg.type === "eggGroupCard" && (
                      <ChatEggGroupCard data={msg.data} onSelectPet={handleSend} />
                    )}
                    {msg.type === "eggPredictCard" && (
                      <ChatEggPredictCard data={msg.data} onSelectPet={handleSend} />
                    )}
                    {msg.type === "merchantCard" && (
                      <ChatMerchantCard data={msg.data} />
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* 聊天发送底部 */}
          <div className="p-3 bg-slate-950/80 border-t border-slate-850 flex gap-2 items-center">
            <button
              onClick={() => handleSend("行商")}
              className="px-2.5 py-1.5 bg-amber-600/10 hover:bg-amber-600/20 border border-amber-500/20 text-amber-400 text-[10px] font-black rounded-lg transition-all active:scale-95 cursor-pointer shrink-0"
              title="一键查看远行商人售卖清单"
            >
              💰 行商
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="问问喵喵精灵、蛋组、体积..."
              className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
            />
            <button
              onClick={() => handleSend(inputText)}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
