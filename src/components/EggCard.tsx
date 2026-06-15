import React from "react";
import {
  Trash2,
  Pencil,
  Ruler,
  Weight,
  Calendar,
  Mars,
  Venus,
  Minus,
  GripVertical
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EggData, BRAND_OPTIONS, NATURE_OPTIONS, STATS_OPTIONS } from "../types";
import { Autocomplete } from "./Autocomplete";
import {
  getPetDetails,
  getSpriteFileName,
  getImagePath,
  getBrandStyle,
  getEggGroupStyle,
  getEggSizeThresholds,
  getEggConfig,
  formatHatchTime,
  isEgg3V,
  getEggStatusType,
  ALL_PET_NAMES,
  getAvailableSprites,
  getSpriteFormDisplayName
} from "../petHelper";

const typeColorMap: Record<string, string> = {
  "光": "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-900/30",
  "冰": "bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900/30",
  "地": "bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/30",
  "幻": "bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-300 border-pink-200 dark:border-pink-900/30",
  "幽": "bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-300 border-violet-200 dark:border-violet-900/30",
  "恶": "bg-red-50 dark:bg-red-950/10 text-red-200 dark:text-red-300 border-red-200 dark:border-red-900/30",
  "普通": "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  "机械": "bg-zinc-100 dark:bg-zinc-900/20 text-zinc-650 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800/30",
  "武": "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/30",
  "毒": "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-900/30",
  "水": "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-900/30",
  "火": "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-300 border-red-200 dark:border-red-900/30",
  "电": "bg-yellow-50 dark:bg-yellow-950/10 text-yellow-500 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/30",
  "翼": "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/30",
  "草": "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-300 border-green-200 dark:border-green-900/30",
  "萌": "bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-300 border-rose-200 dark:border-rose-900/30",
  "虫": "bg-lime-50 dark:bg-lime-950/20 text-lime-600 dark:text-lime-300 border-lime-200 dark:border-lime-900/30",
  "龙": "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/30",
};

const STATS_WITH_IMAGES = ["生命", "物攻", "速度", "魔攻", "物防", "魔防"];

const getStatBadgeStyle = (stat: string): string => {
  const colors: Record<string, string> = {
    "无": "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-300 dark:hover:bg-slate-600",
    "生命": "bg-rose-200 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-400 dark:border-rose-900/60 hover:bg-rose-300 dark:hover:bg-rose-900/80 shadow-2xs",
    "物攻": "bg-amber-200 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-400 dark:border-amber-900/60 hover:bg-amber-300 dark:hover:bg-amber-900/80 shadow-2xs",
    "速度": "bg-emerald-200 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-400 dark:border-emerald-900/60 hover:bg-emerald-300 dark:hover:bg-emerald-900/80 shadow-2xs",
    "魔攻": "bg-purple-200 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-400 dark:border-purple-900/60 hover:bg-purple-300 dark:hover:bg-purple-900/80 shadow-2xs",
    "物防": "bg-blue-200 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-400 dark:border-blue-900/60 hover:bg-blue-300 dark:hover:bg-blue-900/80 shadow-2xs",
    "魔防": "bg-cyan-200 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border-cyan-400 dark:border-cyan-900/60 hover:bg-cyan-300 dark:hover:bg-cyan-900/80 shadow-2xs",
  };
  return colors[stat] || "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700";
};

const getEggGroupBadgeStyle = (grp: string) => {
  let mapped = grp;
  if (grp.includes("组") && !grp.includes("蛋组")) {
    mapped = grp.replace("组", "蛋组");
  }
  if (mapped === "大地蛋组") mapped = "陆地蛋组";
  return getEggGroupStyle(mapped);
};

interface EggCardProps {
  egg: EggData;
  handleDeleteEgg: (id: string) => void;
  handleUpdateEggSprite: (id: string, sprite: string) => void;
  handleUpdateEggBrand: (id: string, brand: string) => void;
  handleUpdateEggSize: (id: string, size: string) => void;
  handleUpdateEggWeight: (id: string, weight: string) => void;
  handleUpdateEggFatherNature: (id: string, nature: string) => void;
  handleUpdateEggMotherNature: (id: string, nature: string) => void;
  handleUpdateEggFatherStat: (id: string, statIdx: number, val: string) => void;
  handleUpdateEggMotherStat: (id: string, statIdx: number, val: string) => void;
  handleUpdateEggProduceTime: (id: string, produceTime: string) => void;
}

export const EggCard = React.memo(function EggCard({
  egg,
  handleDeleteEgg,
  handleUpdateEggSprite,
  handleUpdateEggBrand,
  handleUpdateEggSize,
  handleUpdateEggWeight,
  handleUpdateEggFatherNature,
  handleUpdateEggMotherNature,
  handleUpdateEggFatherStat,
  handleUpdateEggMotherStat,
  handleUpdateEggProduceTime
}: EggCardProps) {
  const petDetails = getPetDetails(egg.sprite);
  const spriteName = petDetails ? petDetails.name : egg.sprite;
  const spriteFile = getSpriteFileName(egg.sprite);
  const spriteUrl = spriteFile ? getImagePath(`images/sprites/${spriteFile}`) : null;
  
  const eggConfig = getEggConfig(egg.sprite);
  const thresholds = getEggSizeThresholds(egg.sprite);

  const getStatusBadge = () => {
    if (!thresholds || !egg.eggSize || !egg.eggWeight) return null;
    const sizeVal = parseFloat(egg.eggSize);
    const weightVal = parseFloat(egg.eggWeight);
    if (isNaN(sizeVal) || isNaN(weightVal)) return null;

    const isGiantBrand = ["大粗", "大婉", "单大块头"].includes(egg.brand);
    const isTinyBrand = ["小粗", "小婉", "单小不点"].includes(egg.brand);

    if (isGiantBrand) {
      if (sizeVal >= thresholds.maxHeight && weightVal >= thresholds.maxWeight) {
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/30 shadow-3xs select-none mt-1 shrink-0 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            极限大
          </span>
        );
      }
      return null;
    }

    if (isTinyBrand) {
      if (sizeVal <= thresholds.minHeight && weightVal <= thresholds.minWeight) {
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/30 shadow-3xs select-none mt-1 shrink-0 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            极限小
          </span>
        );
      }
      return null;
    }

    // 到了这里，肯定是非体型牌（如普通、单粗嗓门、单婉转声等）
    // 1. 如果达标了，显示达标徽章
    if (sizeVal >= thresholds.maxHeight && weightVal >= thresholds.giantWeightLine) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/30 shadow-3xs select-none mt-1 shrink-0 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          大块头 (达标)
        </span>
      );
    }

    if (sizeVal <= thresholds.minHeight && weightVal <= thresholds.tinyWeightLine) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-900/30 shadow-3xs select-none mt-1 shrink-0 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          小不点 (达标)
        </span>
      );
    }

    // 2. 如果并非体型牌，计算与临界值的差值并显示在 10% 以内的临界情况
    const x = Math.abs(thresholds.giantWeightLine - weightVal);
    const y = Math.abs(thresholds.tinyWeightLine - weightVal);

    if (x <= y) {
      // 距离大块头更近
      const maxDiff = thresholds.giantWeightLine * 0.10;
      if (weightVal < thresholds.giantWeightLine && x <= maxDiff) {
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 dark:bg-amber-950/15 text-amber-755 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/30 shadow-3xs select-none mt-1 shrink-0 animate-pulse whitespace-nowrap" style={{ animationDuration: "2s" }}>
            <span className="relative flex w-1.5 h-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
            </span>
            差大块头临界值 {x.toFixed(3)}kg
          </span>
        );
      }
    } else {
      // 距离小不点（小块头）更近
      const maxDiff = thresholds.tinyWeightLine * 0.10;
      if (weightVal > thresholds.tinyWeightLine && y <= maxDiff) {
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 dark:bg-purple-950/15 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/30 shadow-3xs select-none mt-1 shrink-0 animate-pulse whitespace-nowrap" style={{ animationDuration: "2s" }}>
            <span className="relative flex w-1.5 h-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500"></span>
            </span>
            差小块头临界值 {y.toFixed(3)}kg
          </span>
        );
      }
    }

    return null;
  };

  const renderFatherStatSelect = (sIdx: number, currentValue: string) => {
    const badgeColors = getStatBadgeStyle(currentValue);
    const isImageStat = STATS_WITH_IMAGES.includes(currentValue);

    return (
      <div
        key={sIdx}
        className={`relative w-[22px] h-[22px] rounded-full border flex items-center justify-center transition-all shadow-3xs cursor-pointer hover:scale-100 active:scale-95 stat-icon-select-container ${badgeColors}`}
        title={`父亲三围[${sIdx + 1}]: ${currentValue}`}
      >
        {isImageStat ? (
          <img
            src={getImagePath(`images/6围/${currentValue}.png`)}
            alt={currentValue}
            className="w-[14px] h-[14px] object-contain shrink-0"
          />
        ) : (
          <Minus className="w-2.5 h-2.5 text-slate-400 shrink-0" />
        )}
        <select
          value={currentValue}
          onChange={(e) => handleUpdateEggFatherStat(egg.id, sIdx, e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        >
          {STATS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const renderMotherStatSelect = (sIdx: number, currentValue: string) => {
    const badgeColors = getStatBadgeStyle(currentValue);
    const isImageStat = STATS_WITH_IMAGES.includes(currentValue);

    return (
      <div
        key={sIdx}
        className={`relative w-[22px] h-[22px] rounded-full border flex items-center justify-center transition-all shadow-3xs cursor-pointer hover:scale-100 active:scale-95 stat-icon-select-container ${badgeColors}`}
        title={`母亲三围[${sIdx + 1}]: ${currentValue}`}
      >
        {isImageStat ? (
          <img
            src={getImagePath(`images/6围/${currentValue}.png`)}
            alt={currentValue}
            className="w-[14px] h-[14px] object-contain shrink-0"
          />
        ) : (
          <Minus className="w-2.5 h-2.5 text-slate-400 shrink-0" />
        )}
        <select
          value={currentValue}
          onChange={(e) => handleUpdateEggMotherStat(egg.id, sIdx, e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        >
          {STATS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  };

  // Standard ranges
  const stdHeightRange = eggConfig ? `${(eggConfig.height_low / 100).toFixed(2)}m - ${(eggConfig.height_high / 100).toFixed(2)}m` : "未知";
  const stdWeightRange = eggConfig ? `${(eggConfig.weight_low / 1000).toFixed(3)}kg - ${(eggConfig.weight_high / 1000).toFixed(3)}kg` : "未知";
  const hatchTimeStr = eggConfig ? formatHatchTime(eggConfig.hatch_data) : "未知";

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: egg.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
    zIndex: isDragging ? 50 : undefined
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border hover:shadow-md transition-all flex flex-col sm:grid sm:grid-cols-12 gap-2.5 p-3 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-visible group/card"
    >
      {/* Left Column: Avatar & Standard info */}
      <div className="w-full sm:col-span-4 flex flex-row sm:flex-col items-center sm:border-r sm:border-slate-100 dark:sm:border-slate-800 pr-0 sm:pr-2 relative min-h-0 gap-3 sm:gap-1.5">
        
        {/* Action Row */}
        <div className="absolute top-1.5 right-1.5 sm:static flex sm:items-center sm:justify-end w-auto sm:w-full gap-1.5 sm:pb-1.5 shrink-0 z-20">
          <div
            {...attributes}
            {...listeners}
            className="text-slate-300 hover:text-slate-500 dark:hover:text-slate-400 p-1 sm:p-0.5 rounded transition-all cursor-grab active:cursor-grabbing hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            title="按住拖拽排序"
          >
            <GripVertical className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
          </div>
          <button
            onClick={() => handleDeleteEgg(egg.id)}
            className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-1 sm:p-0.5 rounded transition-all cursor-pointer border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30"
            title="删除精灵蛋"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
          </button>
        </div>

        {/* Avatar Container */}
        <div className="w-24 h-24 sm:w-full sm:h-auto sm:aspect-square rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/35 flex items-center justify-center shadow-inner relative group/avatar overflow-hidden shrink-0">
          {spriteUrl ? (
            <img
              src={spriteUrl}
              alt={spriteName}
              className="w-[85%] h-[85%] object-contain transition-transform duration-300 group-hover/avatar:scale-110"
            />
          ) : (
            <div className="w-7 h-7 flex items-center justify-center text-slate-300 dark:text-slate-500 select-none font-bold text-2xl">🥚</div>
          )}

          {/* Form dropdown overlay for multi-form sprites */}
          {(() => {
            const availableSprites = getAvailableSprites(egg.sprite);
            if (availableSprites.length > 1) {
              return (
                <div className="absolute bottom-0.5 left-0.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs px-1.5 py-0.5 rounded shadow-2xs z-10 border border-slate-200/85 dark:border-slate-700 flex items-center hover:bg-white dark:hover:bg-slate-750 transition-colors duration-150">
                  <select
                    value={availableSprites.includes(egg.sprite) ? egg.sprite : (spriteFile ? spriteFile.slice(0, -4) : egg.sprite)}
                    onChange={(e) => handleUpdateEggSprite(egg.id, e.target.value)}
                    className="text-[8px] sm:text-[9px] font-bold text-slate-700 dark:text-slate-200 bg-transparent border-none focus:outline-none cursor-pointer pr-1 py-0.25 leading-none appearance-none"
                  >
                    {availableSprites.map((spriteOption) => {
                      const displayName = getSpriteFormDisplayName(spriteOption);
                      return (
                        <option key={spriteOption} value={spriteOption} className="dark:bg-slate-800 dark:text-slate-200">
                          {displayName}
                        </option>
                      );
                    })}
                  </select>
                  <span className="text-[6px] sm:text-[7px] text-slate-400 pointer-events-none select-none ml-0.5 -mt-0.5">▼</span>
                </div>
              );
            }
            return null;
          })()}

          {/* Type Badge absolute overlay */}
          {petDetails && petDetails.types && petDetails.types.length > 0 && (
            <div className="absolute bottom-0.5 right-0.5 w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800 z-10">
              <img
                src={getImagePath(`images/attributes/${petDetails.types[0]}.png`)}
                alt={petDetails.types[0]}
                className="w-3 h-3 sm:w-3.5 sm:h-3.5 object-contain"
              />
            </div>
          )}

          {/* Top Overlays */}
          {isEgg3V(egg) && (
            <span className="absolute top-0.5 left-0.5 text-[7px] sm:text-[8px] font-extrabold px-1 sm:px-1.5 py-0.25 rounded bg-emerald-500 text-white shadow-xs shrink-0 scale-90 origin-top-left z-15 select-none">
              3V
            </span>
          )}
          {(() => {
            const statusType = getEggStatusType(egg);
            if (statusType === "极限大" || statusType === "极限小") {
              return (
                <span className="absolute top-0.5 right-0.5 text-[7px] sm:text-[8px] font-extrabold px-1 sm:px-1.5 py-0.25 rounded bg-amber-500 text-white shadow-xs shrink-0 scale-90 origin-top-right z-15 select-none">
                  极限
                </span>
              );
            }
            return null;
          })()}
        </div>

        {/* Info below avatar */}
        <div className="flex flex-col items-start sm:items-center gap-1 sm:gap-1.5 flex-1 min-w-0 pr-10 sm:pr-0">
          <div className="w-full text-left sm:text-center shrink-0 flex items-center justify-center gap-0.5">
            <Autocomplete
              value={egg.sprite}
              options={ALL_PET_NAMES}
              placeholder="输入精灵..."
              onChange={(val) => handleUpdateEggSprite(egg.id, val)}
              className="w-full text-left sm:text-center"
              inputClassName="bg-transparent font-bold text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 w-full border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-none py-0.5 transition-colors text-left sm:text-center"
            />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 select-none shrink-0 pr-1">蛋</span>
          </div>

          {/* Attributes and group badges */}
          <div className="flex gap-1 justify-start sm:justify-center items-center flex-wrap w-full shrink-0">
            {petDetails && petDetails.types && petDetails.types.map((t) => {
              const iconUrl = getImagePath(`images/attributes/${t}.png`);
              const badgeStyle = typeColorMap[t] || "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700";
              return (
                <span
                  key={t}
                  className={`inline-flex items-center justify-center p-0.5 rounded-full border shrink-0 shadow-xs ${badgeStyle}`}
                  title={t}
                >
                  <img
                    src={iconUrl}
                    alt={t}
                    className="w-3 h-3 object-contain shrink-0"
                  />
                </span>
              );
            })}
            
            {petDetails && petDetails.groups && petDetails.groups.map((grp) => (
              <span
                key={grp}
                className={`text-[8px] font-bold py-0.25 px-1.5 rounded-full border shadow-3xs select-none ${getEggGroupBadgeStyle(grp)}`}
              >
                {grp}
              </span>
            ))}
          </div>

          {/* Standard egg ranges */}
          <div className="flex flex-col gap-0.5 bg-slate-50/90 dark:bg-slate-950 border border-slate-100/60 dark:border-slate-800 p-1.5 rounded-md text-[10px] text-slate-500 dark:text-slate-400 mt-1 select-none w-full shrink-0 shadow-3xs items-start sm:items-center">
            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mb-0.5">标准区间 (蛋)</span>
            <div className="flex items-center gap-1 whitespace-nowrap" title="标准蛋尺寸">
              <Ruler className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
              <span className="font-semibold text-slate-600 dark:text-slate-400 text-[9px]">{stdHeightRange}</span>
            </div>
            <div className="flex items-center gap-1 whitespace-nowrap" title="标准蛋重量">
              <Weight className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
              <span className="font-semibold text-slate-600 dark:text-slate-400 text-[9px]">{stdWeightRange}</span>
            </div>
            {thresholds && (
              <>
                <div className="w-full border-t border-dashed border-slate-200 dark:border-slate-800 my-1 shrink-0" />
                <div className="flex flex-col gap-0.5 w-full text-[9px] text-slate-400 dark:text-slate-500 items-stretch">
                  <div className="flex items-center justify-between gap-1 whitespace-nowrap w-full" title="大块头及格重量">
                    <span className="shrink-0 whitespace-nowrap">大及格:</span>
                    <span className="font-bold text-slate-500 dark:text-slate-400 shrink-0 whitespace-nowrap">≥{thresholds.giantWeightLine}kg</span>
                  </div>
                  <div className="flex items-center justify-between gap-1 whitespace-nowrap w-full" title="小不点及格重量">
                    <span className="shrink-0 whitespace-nowrap">小及格:</span>
                    <span className="font-bold text-slate-500 dark:text-slate-400 shrink-0 whitespace-nowrap">≤{thresholds.tinyWeightLine}kg</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Details & Parents */}
      <div className="w-full sm:col-span-8 flex flex-col justify-start gap-1 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-2.5 sm:pt-0">
        
        {/* Egg Specifications: Brand, Size, Weight */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-50/70 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-100/60 dark:border-slate-800">
          {/* Brand */}
          <div className="col-span-2 flex flex-col gap-0.5">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-300 select-none">牌子</span>
            <div className="relative w-full">
              <select
                value={egg.brand}
                onChange={(e) => handleUpdateEggBrand(egg.id, e.target.value)}
                className={`appearance-none text-xs font-bold text-center border rounded-md py-0.5 px-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-950 transition-colors shadow-3xs ${getBrandStyle(
                  egg.brand
                )}`}
              >
                {BRAND_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="dark:bg-slate-800 dark:text-slate-200">
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Height (Ruler) */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-300 select-none">蛋尺寸</span>
            <div className="relative flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950/40 transition-all shadow-3xs overflow-hidden h-7">
              <div className="pl-1.5 pr-1 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none select-none">
                <Ruler className="w-3 h-3" />
              </div>
              <input
                type="text"
                value={egg.eggSize || ""}
                onChange={(e) => handleUpdateEggSize(egg.id, e.target.value)}
                placeholder="数字..."
                className="w-full text-xs font-bold text-slate-800 dark:text-slate-100 bg-transparent py-0.5 border-none focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <span className="text-[10px] font-bold text-slate-400 pr-1.5 pointer-events-none select-none">m</span>
            </div>
          </div>

          {/* Weight (Weight/Scale) */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-300 select-none">蛋重量</span>
            <div className="relative flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus-within:border-indigo-400 dark:focus-within:border-indigo-550 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950/40 transition-all shadow-3xs overflow-hidden h-7">
              <div className="pl-1.5 pr-1 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none select-none">
                <Weight className="w-3 h-3" />
              </div>
              <input
                type="text"
                value={egg.eggWeight || ""}
                onChange={(e) => handleUpdateEggWeight(egg.id, e.target.value)}
                placeholder="数字..."
                className="w-full text-xs font-bold text-slate-800 dark:text-slate-100 bg-transparent py-0.5 border-none focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <span className="text-[10px] font-bold text-slate-400 pr-1.5 pointer-events-none select-none">kg</span>
            </div>
          </div>
        </div>

        {/* Status & 3V Badges */}
        <div className="flex flex-wrap items-center gap-1.5 pl-0.5 my-0.5 shrink-0">
          {getStatusBadge() ? (
            getStatusBadge()
          ) : (
            !["大粗", "大婉", "单大块头"].includes(egg.brand) && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800 shadow-3xs select-none whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                普通体型
              </span>
            )
          )}
          {isEgg3V(egg) && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/30 shadow-3xs select-none whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              3V 精灵蛋
            </span>
          )}
        </div>

        {/* Parents Information */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-50/70 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-100/60 dark:border-slate-800 shrink-0">
          <div className="flex flex-col gap-1 border-r border-slate-100 dark:border-slate-800 pr-1.5">
            <div className="flex items-center gap-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/20 px-1 py-0.25 rounded w-fit select-none">
              <Mars className="w-2.5 h-2.5 shrink-0" />
              <span>父亲</span>
            </div>
            
            <div className="flex items-center gap-1 mt-0.5 w-full">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 shrink-0 select-none">性格:</span>
              <Autocomplete
                value={egg.fatherNature || ""}
                options={NATURE_OPTIONS}
                placeholder="性格"
                onChange={(val) => handleUpdateEggFatherNature(egg.id, val)}
                className="flex-1"
                inputClassName="font-bold text-[11px] text-indigo-650 dark:text-indigo-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded py-0.25 px-1.5 w-full focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 dark:focus:ring-indigo-950/40 transition-all shadow-3xs h-5.5 text-center leading-none"
              />
            </div>

            <div className="flex items-center gap-1 mt-1">
              <span className="text-[9px] text-slate-400 dark:text-slate-500 select-none">三围:</span>
              <div className="flex items-center gap-1">
                {(egg.fatherStats || ["无", "无", "无"]).map((stat, sIdx) => renderFatherStatSelect(sIdx, stat))}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-1 pl-1.5">
            <div className="flex items-center gap-0.5 text-[9px] font-bold text-pink-650 dark:text-pink-400 bg-pink-50/60 dark:bg-pink-950/20 px-1 py-0.25 rounded w-fit select-none">
              <Venus className="w-2.5 h-2.5 shrink-0" />
              <span>母亲</span>
            </div>

            <div className="flex items-center gap-1 mt-0.5 w-full">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 shrink-0 select-none">性格:</span>
              <Autocomplete
                value={egg.motherNature || ""}
                options={NATURE_OPTIONS}
                placeholder="性格"
                onChange={(val) => handleUpdateEggMotherNature(egg.id, val)}
                className="flex-1"
                inputClassName="font-bold text-[11px] text-indigo-650 dark:text-indigo-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded py-0.25 px-1.5 w-full focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 dark:focus:ring-indigo-950/40 transition-all shadow-3xs h-5.5 text-center leading-none"
              />
            </div>

            <div className="flex items-center gap-1 mt-1">
              <span className="text-[9px] text-slate-400 dark:text-slate-500 select-none">三围:</span>
              <div className="flex items-center gap-1">
                {(egg.motherStats || ["无", "无", "无"]).map((stat, sIdx) => renderMotherStatSelect(sIdx, stat))}
              </div>
            </div>
          </div>
        </div>

        {/* Produce Time */}
        <div className="flex items-center justify-between gap-1.5 bg-slate-50/70 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-100/60 dark:border-slate-800 shrink-0 mt-0.5">
          <span className="text-[9px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/20 border border-teal-200/50 dark:border-teal-900/40 px-1.5 py-0.5 rounded-md select-none shrink-0 flex items-center gap-0.5">
            <Calendar className="w-3 h-3 text-teal-600 dark:text-teal-400" />
            产出时间
          </span>
          <input
            type="date"
            value={egg.produceTime ? egg.produceTime.slice(0, 10) : ""}
            onChange={(e) => handleUpdateEggProduceTime(egg.id, e.target.value)}
            className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-transparent border-none focus:outline-none select-all text-right cursor-pointer dark:[color-scheme:dark]"
          />
        </div>
      </div>
    </div>
  );
});

