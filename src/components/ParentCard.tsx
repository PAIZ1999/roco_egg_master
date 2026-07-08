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
  "光": "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-900/30",
  "冰": "bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900/30",
  "地": "bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/30",
  "幻": "bg-pink-50 dark:bg-pink-950/20 text-pink-650 dark:text-pink-300 border-pink-200 dark:border-pink-900/30",
  "幽": "bg-violet-50 dark:bg-violet-950/20 text-violet-650 dark:text-violet-300 border-violet-200 dark:border-violet-900/30",
  "恶": "bg-red-50 dark:bg-red-950/10 text-red-200 dark:text-red-300 border-red-200 dark:border-red-900/30",
  "普通": "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  "机械": "bg-zinc-100 dark:bg-zinc-900/20 text-zinc-650 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800/30",
  "武": "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/30",
  "毒": "bg-purple-50 dark:bg-purple-950/20 text-purple-650 dark:text-purple-300 border-purple-200 dark:border-purple-900/30",
  "水": "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-900/30",
  "火": "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-300 border-red-200 dark:border-red-900/30",
  "电": "bg-yellow-50 dark:bg-yellow-950/10 text-yellow-500 dark:text-yellow-405 border-yellow-200 dark:border-yellow-900/30",
  "翼": "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/30",
  "草": "bg-green-50 dark:bg-green-950/20 text-green-650 dark:text-green-300 border-green-200 dark:border-green-900/30",
  "萌": "bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-300 border-rose-200 dark:border-rose-900/30",
  "虫": "bg-lime-50 dark:bg-lime-950/20 text-lime-600 dark:text-lime-300 border-lime-200 dark:border-lime-900/30",
  "龙": "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/30",
};

const STATS_WITH_IMAGES = ["生命", "物攻", "速度", "魔攻", "物防", "魔防"];

const getStatBadgeStyle = (stat: string): string => {
  const colors: Record<string, string> = {
    "无": "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-400 dark:border-slate-600 hover:bg-slate-300 dark:hover:bg-slate-600",
    "生命": "bg-rose-200 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-400 dark:border-rose-900/60 hover:bg-rose-300 dark:hover:bg-rose-900/80 shadow-2xs",
    "物攻": "bg-amber-200 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-400 dark:border-amber-900/60 hover:bg-amber-300 dark:hover:bg-amber-900/80 shadow-2xs",
    "速度": "bg-emerald-200 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-400 dark:border-emerald-900/60 hover:bg-emerald-300 dark:hover:bg-emerald-900/80 shadow-2xs",
    "魔攻": "bg-purple-200 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-400 dark:border-purple-900/60 hover:bg-purple-300 dark:hover:bg-purple-900/80 shadow-2xs",
    "物防": "bg-blue-200 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-400 dark:border-blue-900/60 hover:bg-blue-300 dark:hover:bg-blue-900/80 shadow-2xs",
    "魔防": "bg-cyan-200 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border-cyan-400 dark:border-cyan-900/60 hover:bg-cyan-300 dark:hover:bg-cyan-900/80 shadow-2xs",
  };
  return colors[stat] || "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700";
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
  handleUpdateParentVoice: (id: string, voice: number | null) => void;
  isSelected?: boolean;
  onSelect?: () => void;
  onHover?: (hovered: boolean) => void;
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
  handleUpdateParentChecked,
  handleUpdateParentVoice,
  isSelected,
  onSelect,
  onHover
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
    
    const badges: React.ReactNode[] = [];

    // 1. 体型状态判定
    if (isGiantBrand) {
      if (hVal >= thresholds.maxHeight && wVal >= thresholds.maxWeight) {
        badges.push(
          <span key="limit-giant" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/30 shadow-3xs select-none mt-1 shrink-0 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            极限大
          </span>
        );
      }
    } else if (isTinyBrand) {
      if (hVal <= thresholds.minHeight && wVal <= thresholds.minWeight) {
        badges.push(
          <span key="limit-tiny" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/30 shadow-3xs select-none mt-1 shrink-0 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            极限小
          </span>
        );
      }
    } else {
      if (hVal >= thresholds.maxHeight && wVal >= thresholds.giantWeightLine) {
        badges.push(
          <span key="giant-ok" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/30 shadow-3xs select-none mt-1 shrink-0 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            大块头 (达标)
          </span>
        );
      } else if (hVal <= thresholds.minHeight && wVal <= thresholds.tinyWeightLine) {
        badges.push(
          <span key="tiny-ok" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-900/30 shadow-3xs select-none mt-1 shrink-0 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            小不点 (达标)
          </span>
        );
      } else {
        const x = Math.abs(thresholds.giantWeightLine - wVal);
        const y = Math.abs(thresholds.tinyWeightLine - wVal);
        if (x <= y) {
          const maxDiff = thresholds.giantWeightLine * 0.10;
          if (wVal < thresholds.giantWeightLine && x <= maxDiff) {
            badges.push(
              <span key="near-giant" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 dark:bg-amber-950/10 text-amber-755 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/30 shadow-3xs select-none mt-1 shrink-0 animate-pulse whitespace-nowrap" style={{ animationDuration: "2s" }}>
                <span className="relative flex w-1.5 h-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                </span>
                差大块头 {x.toFixed(3)}kg
              </span>
            );
          }
        } else {
          const maxDiff = thresholds.tinyWeightLine * 0.10;
          if (wVal > thresholds.tinyWeightLine && y <= maxDiff) {
            badges.push(
              <span key="near-tiny" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 dark:bg-purple-950/15 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/35 shadow-3xs select-none mt-1 shrink-0 animate-pulse whitespace-nowrap" style={{ animationDuration: "2s" }}>
                <span className="relative flex w-1.5 h-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500"></span>
                </span>
                差小块头 {y.toFixed(3)}kg
              </span>
            );
          }
        }
      }
    }

    // 2. 声音状态判定
    if (parent.voice !== undefined && parent.voice !== null) {
      const v = parent.voice;
      if (v <= -96) {
        badges.push(
          <span key="voice-coarse" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/30 shadow-3xs select-none mt-1 shrink-0 whitespace-nowrap">
            🎤 粗嗓门 ({v})
          </span>
        );
      } else if (v >= 96) {
        badges.push(
          <span key="voice-sweet" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 dark:bg-purple-950/20 text-purple-650 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/30 shadow-3xs select-none mt-1 shrink-0 whitespace-nowrap">
            🎤 婉转声 ({v})
          </span>
        );
      } else if (v <= -90 && v >= -95) {
        badges.push(
          <span key="near-coarse" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 dark:bg-amber-950/10 text-amber-700 dark:text-amber-350 border border-amber-250/50 dark:border-amber-900/30 shadow-3xs select-none mt-1 shrink-0 animate-pulse whitespace-nowrap" style={{ animationDuration: "2.5s" }}>
            🎤 临近粗嗓 ({v})
          </span>
        );
      } else if (v >= 90 && v <= 95) {
        badges.push(
          <span key="near-sweet" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 dark:bg-purple-950/10 text-purple-700 dark:text-purple-350 border border-purple-250/50 dark:border-purple-900/30 shadow-3xs select-none mt-1 shrink-0 animate-pulse whitespace-nowrap" style={{ animationDuration: "2.5s" }}>
            🎤 临近婉转 ({v})
          </span>
        );
      }
    }

    if (badges.length === 0) return null;
    return (
      <div className="flex flex-col gap-1 w-full shrink-0 items-start sm:items-center">
        {badges}
      </div>
    );
  };

  const renderStatSelect = (sIdx: number, currentValue: string) => {
    const badgeColors = getStatBadgeStyle(currentValue);
    const isImageStat = STATS_WITH_IMAGES.includes(currentValue);

    return (
      <div
        key={sIdx}
        className={`relative w-[28px] h-[28px] rounded-full border flex items-center justify-center transition-all shadow-3xs cursor-pointer hover:scale-100 active:scale-95 stat-icon-select-container ${badgeColors}`}
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
      onClick={onSelect}
      onMouseEnter={() => onHover && onHover(true)}
      onMouseLeave={() => onHover && onHover(false)}
      className={`rounded-xl border transition-all flex flex-col sm:grid sm:grid-cols-12 gap-2.5 p-3 relative overflow-visible group/card parent-card ${
        isSelected
          ? "ring-2 ring-indigo-500/80 dark:ring-indigo-400/80 shadow-[0_0_15px_rgba(99,102,241,0.4)] border-indigo-500/80 dark:border-indigo-400/80"
          : "hover:shadow-md"
      } ${
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
            onClick={(e) => { e.stopPropagation(); handleDeleteParent(parent.id); }}
            className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-1 sm:p-0.5 rounded transition-all cursor-pointer border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30"
            title="删除精灵"
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
            <div className="w-7 h-7 flex items-center justify-center text-slate-300 dark:text-slate-500">🧬</div>
          )}

          {/* Matchmaking Checkbox overlay */}
          <label className="absolute inset-0 bg-slate-950/65 backdrop-blur-[1.5px] flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover/avatar:opacity-100 transition-all duration-200 cursor-pointer z-30">
            <input
              type="checkbox"
              checked={!!parent.checked}
              onChange={(e) => handleUpdateParentChecked(parent.id, e.target.checked)}
              className="w-4.5 h-4.5 cursor-pointer text-indigo-600 dark:text-indigo-400 focus:ring-indigo-400 dark:focus:ring-indigo-500 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
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
                    <option key={spriteOption} value={spriteOption} className="dark:bg-slate-800 dark:text-slate-200">
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
            <div className="absolute bottom-0.5 right-0.5 w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800 z-10">
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
              inputClassName="bg-transparent font-bold text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 w-full border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-none py-0.5 transition-colors text-left sm:text-center"
            />
          </div>

          {petDetails && petDetails.types && petDetails.types.length > 0 && (
            <div className="flex gap-1 justify-start sm:justify-center items-center flex-wrap w-full shrink-0">
              {petDetails.types.map((t) => {
                const iconUrl = getImagePath(`images/attributes/${t}.png`);
                const badgeStyle = typeColorMap[t] || "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
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
            <div className="flex flex-col gap-1 bg-slate-50/90 dark:bg-slate-950/30 border border-slate-100/60 dark:border-slate-800 p-1.5 rounded-md text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 select-none w-full sm:w-fit min-w-[92px] shrink-0 shadow-3xs items-start sm:items-center">
              <div className="flex items-center gap-1 whitespace-nowrap" title="标准身高范围">
                <Ruler className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                <span className="font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">{guideSize.height} m</span>
              </div>
              <div className="flex items-center gap-1 whitespace-nowrap" title="标准体重范围">
                <Weight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                <span className="font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">{guideSize.weight} kg</span>
              </div>
              {thresholds && (
                <>
                  <div className="w-full border-t border-dashed border-slate-200 dark:border-slate-800 my-1 shrink-0" />
                  <div className="flex flex-col gap-0.5 w-full text-[9px] text-slate-400 dark:text-slate-500">
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
          )}
        </div>
      </div>

      {/* Right Column: Settings */}
      <div className="w-full sm:col-span-8 flex flex-col justify-start gap-1 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-2.5 sm:pt-0">
        
        {/* Core Profile: Brand, Height, Weight, Voice */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-50/70 dark:bg-slate-900/40 p-1.5 rounded-lg border border-slate-100/60 dark:border-slate-800">
          {/* Brand */}
          <div className="col-span-3 flex flex-col gap-0.5">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-300 select-none">牌子</span>
            <select
              value={parent.brand}
              onChange={(e) => handleUpdateParentBrand(parent.id, e.target.value)}
              className={`appearance-none text-xs font-bold text-center border rounded-md py-0.5 px-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-950 transition-colors ${getBrandStyle(
                parent.brand
              )}`}
            >
              {BRAND_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="dark:bg-slate-800 dark:text-slate-200">
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Height (Ruler) */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-350 select-none">身高</span>
            <div className="relative flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950/40 transition-all shadow-3xs overflow-hidden h-7">
              <div className="pl-1 pr-0.5 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none select-none shrink-0">
                <Ruler className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={parent.height}
                onChange={(e) => handleUpdateParentHeight(parent.id, e.target.value)}
                placeholder="数字..."
                className="w-full min-w-0 text-xs font-bold text-center text-slate-800 dark:text-slate-100 bg-transparent py-0.5 px-0.5 border-none focus:outline-none focus:ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <span className="text-[9px] font-bold text-slate-400 pr-1 pl-0.5 pointer-events-none select-none shrink-0">m</span>
            </div>
          </div>

          {/* Weight (Weight/Scale) */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-350 select-none">体重</span>
            <div className="relative flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus-within:border-indigo-400 dark:focus-within:border-indigo-550 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950/40 transition-all shadow-3xs overflow-hidden h-7">
              <div className="pl-1 pr-0.5 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none select-none shrink-0">
                <Weight className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={parent.weight}
                onChange={(e) => handleUpdateParentWeight(parent.id, e.target.value)}
                placeholder="数字..."
                className="w-full min-w-0 text-xs font-bold text-center text-slate-800 dark:text-slate-100 bg-transparent py-0.5 px-0.5 border-none focus:outline-none focus:ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <span className="text-[9px] font-bold text-slate-400 pr-1 pl-0.5 pointer-events-none select-none shrink-0">kg</span>
            </div>
          </div>

          {/* Voice (🎤 Input) */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-350 select-none">声音值</span>
            <div className="relative flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950/40 transition-all shadow-3xs overflow-hidden h-7">
              <div className="pl-1.5 pr-0.5 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none select-none shrink-0">
                <span className="text-[10px]">🎤</span>
              </div>
              <input
                type="text"
                value={parent.voice !== undefined && parent.voice !== null ? parent.voice : ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    handleUpdateParentVoice(parent.id, null);
                  } else {
                    const numVal = parseInt(val);
                    handleUpdateParentVoice(parent.id, isNaN(numVal) ? null : numVal);
                  }
                }}
                placeholder="数字..."
                className="w-full min-w-0 text-xs font-bold text-center text-slate-800 dark:text-slate-100 bg-transparent py-0.5 px-0.5 border-none focus:outline-none focus:ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
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
          <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/30 px-1.5 py-0.5 rounded-md select-none shrink-0 w-fit flex items-center gap-0.5">
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
            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/25 border border-teal-200/50 dark:border-teal-900/30 px-1.5 py-0.5 rounded-md select-none shrink-0 w-fit flex items-center gap-0.5">
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
          <div className="flex items-center justify-between gap-1.5 bg-slate-50/70 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-100/60 dark:border-slate-800 shrink-0">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border border-amber-200/50 dark:border-amber-900/30 px-1.5 py-0.5 rounded-md select-none shrink-0">
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

        {/* 📍 游戏内仓库位置定位 Badge */}
        {parent.position && parent.position !== "-" && (
          <div className="flex items-center justify-between gap-1.5 bg-indigo-50/60 dark:bg-indigo-950/20 p-1.5 rounded-lg border border-indigo-100/40 dark:border-indigo-900/30 shrink-0 select-none">
            <span className="text-[10px] font-bold text-indigo-750 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-900/30 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
              <span>📍</span>游戏位置
            </span>
            <span className="text-[10px] font-extrabold text-indigo-650 dark:text-indigo-350 pr-1.5">
              {parent.position.replace('\n', ' ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
