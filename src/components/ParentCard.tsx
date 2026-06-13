import React from "react";
import {
  Trash2,
  Mars,
  Venus,
  Ruler,
  Weight,
  Minus,
  GripVertical
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ParentPet,
  BRAND_OPTIONS,
  NATURE_OPTIONS,
  STATS_OPTIONS
} from "../types";
import { Autocomplete } from "./Autocomplete";
import {
  getPetDetails,
  getSpriteFileName,
  getImagePath,
  ALL_PET_NAMES,
  getEggGroupStyle,
  getBrandStyle,
  getAvailableSprites,
  getSpriteFormDisplayName,
  getPetGuideSize,
  getPetSizeThresholds
} from "../petHelper";

const typeColorMap: Record<string, string> = {
  "光": "bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-900/30",
  "冰": "bg-cyan-50 dark:bg-cyan-955/20 text-cyan-600 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900/30",
  "地": "bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-305 border-amber-300 dark:border-amber-800/30",
  "幻": "bg-pink-50 dark:bg-pink-955/20 text-pink-650 dark:text-pink-300 border-pink-200 dark:border-pink-900/30",
  "幽": "bg-violet-50 dark:bg-violet-955/20 text-violet-650 dark:text-violet-305 border-violet-200 dark:border-violet-900/30",
  "恶": "bg-red-50 dark:bg-red-955/10 text-red-200 dark:text-red-305 border-red-200 dark:border-red-900/30",
  "普通": "bg-slate-50 dark:bg-slate-850 text-slate-655 dark:text-slate-300 border-slate-205 dark:border-slate-700",
  "机械": "bg-zinc-100 dark:bg-zinc-900/20 text-zinc-650 dark:text-zinc-305 border-zinc-200 dark:border-zinc-800/30",
  "武": "bg-orange-50 dark:bg-orange-955/20 text-orange-700 dark:text-orange-350 border-orange-200 dark:border-orange-900/30",
  "毒": "bg-purple-50 dark:bg-purple-955/20 text-purple-650 dark:text-purple-300 border-purple-200 dark:border-purple-900/30",
  "水": "bg-blue-50 dark:bg-blue-955/20 text-blue-655 dark:text-blue-300 border-blue-200 dark:border-blue-900/30",
  "火": "bg-red-50 dark:bg-red-955/20 text-red-655 dark:text-red-300 border-red-200 dark:border-red-900/30",
  "电": "bg-yellow-50 dark:bg-yellow-955/10 text-yellow-505 dark:text-yellow-405 border-yellow-205 dark:border-yellow-900/30",
  "翼": "bg-indigo-50 dark:bg-indigo-955/20 text-indigo-650 dark:text-indigo-305 border-indigo-200 dark:border-indigo-900/30",
  "草": "bg-green-50 dark:bg-green-955/20 text-green-650 dark:text-green-300 border-green-200 dark:border-green-900/30",
  "萌": "bg-rose-50 dark:bg-rose-955/20 text-rose-500 dark:text-rose-300 border-rose-200 dark:border-rose-900/30",
  "虫": "bg-lime-50 dark:bg-lime-955/20 text-lime-655 dark:text-lime-305 border-lime-200 dark:border-lime-900/30",
  "龙": "bg-rose-50 dark:bg-rose-955/20 text-rose-755 dark:text-rose-350 border-rose-200 dark:border-rose-900/30",
};

const STATS_WITH_IMAGES = ["生命", "物攻", "速度", "魔攻", "物防", "魔防"];

const getStatBadgeStyle = (stat: string): string => {
  const colors: Record<string, string> = {
    "无": "bg-slate-200 text-slate-500 border-slate-350 hover:bg-slate-300",
    "生命": "bg-rose-200 text-rose-800 border-rose-400 hover:bg-rose-300 shadow-2xs",
    "物攻": "bg-amber-200 text-amber-900 border-amber-400 hover:bg-amber-300 shadow-2xs",
    "速度": "bg-emerald-200 text-emerald-800 border-emerald-400 hover:bg-emerald-300 shadow-2xs",
    "魔攻": "bg-purple-200 text-purple-800 border-purple-400 hover:bg-purple-300 shadow-2xs",
    "物防": "bg-blue-200 text-blue-800 border-blue-400 hover:bg-blue-300 shadow-2xs",
    "魔防": "bg-cyan-200 text-cyan-800 border-cyan-400 hover:bg-cyan-300 shadow-2xs",
  };
  return colors[stat] || "bg-slate-50 text-slate-700 border-slate-200";
};

interface ParentCardProps {
  parent: ParentPet;
  handleDeleteParent: (id: string) => void;
  handleUpdateParentSprite: (id: string, name: string) => void;
  handleUpdateParentBrand: (id: string, brand: string) => void;
  handleUpdateParentHeight: (id: string, height: string) => void;
  handleUpdateParentWeight: (id: string, weight: string) => void;
  handleUpdateParentNature: (id: string, nature: string) => void;
  handleUpdateParentStat: (id: string, statIndex: number, value: string) => void;
  handleUpdateParentChecked: (id: string, checked: boolean) => void;
}

export const ParentCard = React.memo(function ParentCard({
  parent,
  handleDeleteParent,
  handleUpdateParentSprite,
  handleUpdateParentBrand,
  handleUpdateParentHeight,
  handleUpdateParentWeight,
  handleUpdateParentNature,
  handleUpdateParentStat,
  handleUpdateParentChecked
}: ParentCardProps) {
  const petDetails = getPetDetails(parent.sprite);
  const spriteName = petDetails ? petDetails.name : parent.sprite;
  const spriteFile = getSpriteFileName(parent.sprite);
  const spriteUrl = spriteFile ? getImagePath(`images/sprites/${spriteFile}`) : null;
  const availableSprites = getAvailableSprites(parent.sprite);
  const guideSize = getPetGuideSize(parent.sprite);
  const thresholds = getPetSizeThresholds(parent.sprite);

  const getStatusBadge = () => {
    if (!thresholds || !parent.height || !parent.weight) return null;
    const hVal = parseFloat(parent.height);
    const wVal = parseFloat(parent.weight);
    if (isNaN(hVal) || isNaN(wVal)) return null;

    const isGiantBrand = ["大粗", "大婉", "单大块头"].includes(parent.brand);
    const isTinyBrand = ["小粗", "小婉", "单小不点"].includes(parent.brand);

    if (isGiantBrand) {
      if (hVal >= thresholds.maxHeight && wVal >= thresholds.maxWeight) {
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/30 shadow-3xs select-none mt-1 shrink-0 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            极限大
          </span>
        );
      }
      return null;
    }

    if (isTinyBrand) {
      if (hVal <= thresholds.minHeight && wVal <= thresholds.minWeight) {
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 dark:bg-indigo-955/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/30 shadow-3xs select-none mt-1 shrink-0 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            极限小
          </span>
        );
      }
      return null;
    }

    // 到了这里，肯定是非体型牌（如普通、单粗嗓门、单婉转声等）
    // 1. 如果达标了，显示达标徽章
    if (hVal >= thresholds.maxHeight && wVal >= thresholds.giantWeightLine) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-955/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/30 shadow-3xs select-none mt-1 shrink-0 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          大块头 (达标)
        </span>
      );
    }

    if (hVal <= thresholds.minHeight && wVal <= thresholds.tinyWeightLine) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-sky-50 dark:bg-sky-955/20 text-sky-700 dark:text-sky-305 border border-sky-200/60 dark:border-sky-900/30 shadow-3xs select-none mt-1 shrink-0 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          小不点 (达标)
        </span>
      );
    }

    // 2. 如果并非体型牌，计算与临界值的差值并显示在 10% 以内的临界情况
    const x = Math.abs(thresholds.giantWeightLine - wVal);
    const y = Math.abs(thresholds.tinyWeightLine - wVal);

    if (x <= y) {
      // 距离大块头更近
      const maxDiff = thresholds.giantWeightLine * 0.10;
      if (wVal < thresholds.giantWeightLine && x <= maxDiff) {
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 dark:bg-amber-955/10 text-amber-755 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/30 shadow-3xs select-none mt-1 shrink-0 animate-pulse whitespace-nowrap" style={{ animationDuration: "2s" }}>
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
      if (wVal > thresholds.tinyWeightLine && y <= maxDiff) {
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 dark:bg-purple-955/15 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/35 shadow-3xs select-none mt-1 shrink-0 animate-pulse whitespace-nowrap" style={{ animationDuration: "2s" }}>
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

  const renderStatSelect = (sIdx: number, currentValue: string) => {
    const badgeColors = getStatBadgeStyle(currentValue);
    const isImageStat = STATS_WITH_IMAGES.includes(currentValue);

    return (
      <div
        key={sIdx}
        className={`relative w-[28px] h-[28px] rounded-full border flex items-center justify-center transition-all shadow-3xs cursor-pointer hover:scale-105 active:scale-95 stat-icon-select-container ${badgeColors}`}
        title={`三围[${sIdx + 1}]: ${currentValue}`}
      >
        {isImageStat ? (
          <img
            src={getImagePath(`images/6围/${currentValue}.png`)}
            alt={currentValue}
            className="w-[18px] h-[18px] object-contain shrink-0"
          />
        ) : (
          <Minus className="w-3 h-3 text-slate-400 shrink-0" />
        )}
        <select
          value={currentValue}
          onChange={(e) => handleUpdateParentStat(parent.id, sIdx, e.target.value)}
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

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: parent.id });

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
      className={`rounded-xl border hover:shadow-md transition-all flex flex-col sm:grid sm:grid-cols-12 gap-2.5 p-3 relative overflow-visible group/card ${
        parent.checked
          ? "border-indigo-400 dark:border-indigo-500 bg-indigo-50/5 dark:bg-indigo-950/10 shadow-xs"
          : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm"
      }`}
    >
      {/* Left Column: Avatar, Checkbox, Delete */}
      <div className="w-full sm:col-span-4 flex flex-row sm:flex-col items-center sm:border-r sm:border-slate-100 dark:sm:border-slate-800 pr-0 sm:pr-2 relative min-h-0 gap-3 sm:gap-1.5">
        
        {/* Checkbox and Delete Row */}
        <div className="absolute top-1.5 right-1.5 sm:static flex sm:items-center sm:justify-between w-auto sm:w-full gap-2 sm:pb-1.5 shrink-0 z-20">
          <div
            {...attributes}
            {...listeners}
            className="text-slate-300 hover:text-slate-500 dark:hover:text-slate-400 p-0.5 rounded transition-all cursor-grab active:cursor-grabbing hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 flex items-center justify-center"
            title="按住拖拽排序"
          >
            <GripVertical className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
          </div>

          <button
            onClick={() => handleDeleteParent(parent.id)}
            className="text-slate-350 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-455 hover:bg-rose-50 dark:hover:bg-rose-955/30 p-1 sm:p-0.5 rounded transition-all cursor-pointer border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30"
            title="删除精灵"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
          </button>
        </div>

        {/* Avatar Container */}
        <div className="w-24 h-24 sm:w-full sm:h-auto sm:aspect-square rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955/35 flex items-center justify-center shadow-inner relative group/avatar overflow-hidden shrink-0">
          {spriteUrl ? (
            <img
              src={spriteUrl}
              alt={spriteName}
              className="w-[85%] h-[85%] object-contain transition-transform duration-300 group-hover/avatar:scale-110"
            />
          ) : (
            <div className="w-7 h-7 flex items-center justify-center text-slate-300 dark:text-slate-500">🧬</div>
          )}

          {/* Matchmaking Checkbox overlay */}
          <label className="absolute inset-0 bg-slate-950/65 backdrop-blur-[1.5px] flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover/avatar:opacity-100 transition-all duration-200 cursor-pointer z-30">
            <input
              type="checkbox"
              checked={!!parent.checked}
              onChange={(e) => handleUpdateParentChecked(parent.id, e.target.checked)}
              className="w-4.5 h-4.5 cursor-pointer text-indigo-600 dark:text-indigo-400 focus:ring-indigo-400 dark:focus:ring-indigo-500 rounded border-slate-300 dark:border-slate-655 bg-white dark:bg-slate-800"
            />
            <span className="text-[10px] font-bold text-white select-none">
              {parent.checked ? "取消配组" : "点击配组"}
            </span>
          </label>

          {/* Selected Status Corner Badge */}
          {parent.checked && (
            <div className="absolute top-0.5 right-0.5 w-4.5 h-4.5 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-sm border border-white/20 z-20 pointer-events-none">
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          {/* Form dropdown overlay for multi-form sprites */}
          {availableSprites.length > 1 && (
            <div 
              className="absolute bottom-0.5 left-0.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs px-1.5 py-0.5 rounded shadow-2xs z-40 border border-slate-200/85 dark:border-slate-700 flex items-center hover:bg-white dark:hover:bg-slate-750 transition-colors duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <select
                value={availableSprites.includes(parent.sprite) ? parent.sprite : (spriteFile ? spriteFile.slice(0, -4) : parent.sprite)}
                onChange={(e) => handleUpdateParentSprite(parent.id, e.target.value)}
                className="text-[8px] sm:text-[9px] font-bold text-slate-700 dark:text-slate-200 bg-transparent border-none focus:outline-none cursor-pointer pr-1 py-0.25 leading-none appearance-none"
              >
                {availableSprites.map((spriteOption) => {
                  const displayName = getSpriteFormDisplayName(spriteOption);
                  return (
                    <option key={spriteOption} value={spriteOption} className="dark:bg-slate-805 dark:text-slate-200">
                      {displayName}
                    </option>
                  );
                })}
              </select>
              <span className="text-[6px] sm:text-[7px] text-slate-400 pointer-events-none select-none ml-0.5 -mt-0.5">▼</span>
            </div>
          )}

          {/* Type Badge absolute overlay */}
          {petDetails && petDetails.types && petDetails.types.length > 0 && (
            <div className="absolute bottom-0.5 right-0.5 w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 bg-white dark:bg-slate-805 rounded-full flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800 z-10">
              <img
                src={getImagePath(`images/attributes/${petDetails.types[0]}.png`)}
                alt={petDetails.types[0]}
                className="w-3 h-3 sm:w-3.5 sm:h-3.5 object-contain"
              />
            </div>
          )}

          {/* Gender Overlay */}
          <span className={`absolute top-0.5 left-0.5 p-0.5 rounded-md shadow-2xs text-white scale-80 origin-top-left z-15`}>
            {parent.gender === "♂" ? (
              <Mars className="w-3 h-3 text-blue-500 stroke-[3px]" />
            ) : (
              <Venus className="w-3 h-3 text-pink-500 stroke-[3px]" />
            )}
          </span>
        </div>

        {/* Name and types */}
        <div className="flex flex-col items-start sm:items-center gap-1 sm:gap-1.5 flex-1 min-w-0 pr-10 sm:pr-0">
          <div className="w-full text-left sm:text-center shrink-0">
            <Autocomplete
              value={parent.sprite}
              options={ALL_PET_NAMES}
              placeholder="输入精灵..."
              onChange={(val) => handleUpdateParentSprite(parent.id, val)}
              className="w-full text-left sm:text-center"
              inputClassName="bg-transparent font-bold text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-550 w-full border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-none py-0.5 transition-colors text-left sm:text-center"
            />
          </div>

          {petDetails && petDetails.types && petDetails.types.length > 0 && (
            <div className="flex gap-1 justify-start sm:justify-center items-center flex-wrap w-full shrink-0">
              {petDetails.types.map((t) => {
                const iconUrl = getImagePath(`images/attributes/${t}.png`);
                const badgeStyle = typeColorMap[t] || "bg-slate-50 text-slate-655 border-slate-205";
                return (
                  <span
                    key={t}
                    className={`inline-flex items-center justify-center p-0.5 rounded-full border shrink-0 shadow-xs ${badgeStyle}`}
                    title={t}
                  >
                    <img
                      src={iconUrl}
                      alt={t}
                      className="w-3.5 h-3.5 object-contain shrink-0"
                    />
                  </span>
                );
              })}
            </div>
          )}
          {guideSize && (
            <div className="flex flex-col gap-1 bg-slate-50/90 dark:bg-slate-950/30 border border-slate-100/60 dark:border-slate-800 p-1.5 rounded-md text-[10px] text-slate-500 dark:text-slate-450 mt-1.5 select-none w-full sm:w-fit min-w-[92px] shrink-0 shadow-3xs items-start sm:items-center">
              <div className="flex items-center gap-1 whitespace-nowrap" title="标准身高范围">
                <Ruler className="w-3.5 h-3.5 text-slate-400 dark:text-slate-550 shrink-0" />
                <span className="font-semibold text-slate-600 dark:text-slate-305 whitespace-nowrap">{guideSize.height} m</span>
              </div>
              <div className="flex items-center gap-1 whitespace-nowrap" title="标准体重范围">
                <Weight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-550 shrink-0" />
                <span className="font-semibold text-slate-600 dark:text-slate-305 whitespace-nowrap">{guideSize.weight} kg</span>
              </div>
              {thresholds && (
                <>
                  <div className="w-full border-t border-dashed border-slate-200 dark:border-slate-800 my-1 shrink-0" />
                  <div className="flex flex-col gap-0.5 w-full text-[9px] text-slate-400 dark:text-slate-500">
                    <div className="flex items-center justify-between gap-1 whitespace-nowrap w-full" title="大块头及格重量">
                      <span className="shrink-0 whitespace-nowrap">大及格:</span>
                      <span className="font-bold text-slate-505 dark:text-slate-400 shrink-0 whitespace-nowrap">≥{thresholds.giantWeightLine}kg</span>
                    </div>
                    <div className="flex items-center justify-between gap-1 whitespace-nowrap w-full" title="小不点及格重量">
                      <span className="shrink-0 whitespace-nowrap">小及格:</span>
                      <span className="font-bold text-slate-505 dark:text-slate-400 shrink-0 whitespace-nowrap">≤{thresholds.tinyWeightLine}kg</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Settings */}
      <div className="w-full sm:col-span-8 flex flex-col justify-start gap-1 border-t sm:border-t-0 border-slate-100 pt-2.5 sm:pt-0">
        
        {/* Core Profile: Brand, Height, Weight */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-50/70 dark:bg-slate-900/40 p-1.5 rounded-lg border border-slate-100/60 dark:border-slate-800">
          {/* Brand */}
          <div className="col-span-2 flex flex-col gap-0.5">
            <span className="text-[9px] font-bold text-slate-400 select-none">牌子</span>
            <select
              value={parent.brand}
              onChange={(e) => handleUpdateParentBrand(parent.id, e.target.value)}
              className={`appearance-none text-xs font-bold text-center border rounded-md py-0.5 px-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-250 dark:focus:ring-indigo-950 transition-colors ${getBrandStyle(
                parent.brand
              )}`}
            >
              {BRAND_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="dark:bg-slate-805 dark:text-slate-200">
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Height (Ruler) */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold text-slate-400 select-none">身高</span>
            <div className="relative flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-850 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950/40 transition-all shadow-3xs overflow-hidden h-7">
              <div className="pl-1.5 pr-1 flex items-center text-slate-400 dark:text-slate-550 pointer-events-none select-none">
                <Ruler className="w-3 h-3" />
              </div>
              <input
                type="text"
                value={parent.height}
                onChange={(e) => handleUpdateParentHeight(parent.id, e.target.value)}
                placeholder="数字..."
                className="w-full text-xs font-bold text-slate-800 dark:text-slate-100 bg-transparent py-0.5 border-none focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-550"
              />
              <span className="text-[10px] font-bold text-slate-400 pr-1.5 pointer-events-none select-none">m</span>
            </div>
          </div>

          {/* Weight (Weight/Scale) */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold text-slate-400 select-none">体重</span>
            <div className="relative flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus-within:border-indigo-400 dark:focus-within:border-indigo-550 focus-within:bg-white dark:focus-within:bg-slate-850 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950/40 transition-all shadow-3xs overflow-hidden h-7">
              <div className="pl-1.5 pr-1 flex items-center text-slate-400 dark:text-slate-550 pointer-events-none select-none">
                <Weight className="w-3 h-3" />
              </div>
              <input
                type="text"
                value={parent.weight}
                onChange={(e) => handleUpdateParentWeight(parent.id, e.target.value)}
                placeholder="数字..."
                className="w-full text-xs font-bold text-slate-800 dark:text-slate-100 bg-transparent py-0.5 border-none focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-550"
              />
              <span className="text-[10px] font-bold text-slate-400 pr-1.5 pointer-events-none select-none">kg</span>
            </div>
          </div>
        </div>

        {getStatusBadge() && (
          <div className="flex justify-start pl-0.5 my-0.5 shrink-0">
            {getStatusBadge()}
          </div>
        )}

        {/* Nature Selection Container */}
        <div className="flex flex-col gap-1 bg-slate-50/70 dark:bg-slate-900/40 p-1.5 rounded-lg border border-slate-100/60 dark:border-slate-800">
          <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-305 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/30 px-1.5 py-0.5 rounded-md select-none shrink-0 w-fit flex items-center gap-0.5">
            精灵性格
          </span>
          <Autocomplete
            value={parent.nature}
            options={NATURE_OPTIONS}
            placeholder="选择/输入性格"
            onChange={(val) => handleUpdateParentNature(parent.id, val)}
            className="w-full"
            inputClassName="font-bold text-[13px] text-center text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md py-0.5 px-2 w-full focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/40 transition-all shadow-3xs"
          />
        </div>

        {/* Stats Section */}
        <div className="flex flex-col gap-1.5 bg-slate-50/70 dark:bg-slate-900/40 p-1.5 rounded-lg border border-slate-100/60 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-350 bg-teal-50 dark:bg-teal-950/25 border border-teal-200/50 dark:border-teal-900/30 px-1.5 py-0.5 rounded-md select-none shrink-0 w-fit flex items-center gap-0.5">
              精灵三围
            </span>
          </div>
          <div className="flex items-center gap-2.5 justify-center py-0.5 shrink-0">
            {(parent.stats || ["无", "无", "无"]).map((stat, sIdx) =>
              renderStatSelect(sIdx, stat)
            )}
          </div>
        </div>

        {/* Groups Display */}
        {parent.groups && parent.groups.length > 0 && (
          <div className="flex items-center justify-between gap-1.5 bg-slate-50/70 dark:bg-slate-900/40 p-1.5 rounded-lg border border-slate-100/60 dark:border-slate-800 shrink-0">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-350 bg-amber-50 dark:bg-amber-955/25 border border-amber-200/50 dark:border-amber-900/30 px-1.5 py-0.5 rounded-md select-none shrink-0">
              所属组别
            </span>
            <div className="flex flex-wrap gap-1 items-center justify-end flex-1">
              {parent.groups.map((grp) => (
                <span
                  key={grp}
                  className={`text-[10px] font-bold py-0.5 px-2 rounded-full border shadow-3xs select-none ${getEggGroupStyle(
                    grp
                  )}`}
                >
                  {grp}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
