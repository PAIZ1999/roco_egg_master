import React from "react";
import {
  Trash2,
  Mars,
  Venus,
  Ruler,
  Weight,
  Minus
} from "lucide-react";
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
  getSpriteFormDisplayName
} from "../petHelper";

const typeColorMap: Record<string, string> = {
  "光": "bg-amber-50 text-amber-600 border-amber-200",
  "冰": "bg-cyan-50 text-cyan-600 border-cyan-200",
  "地": "bg-amber-100 text-amber-800 border-amber-300",
  "幻": "bg-pink-50 text-pink-600 border-pink-200",
  "幽": "bg-violet-50 text-violet-600 border-violet-200",
  "恶": "bg-red-50 text-red-200 border-red-200",
  "普通": "bg-slate-50 text-slate-600 border-slate-200",
  "机械": "bg-zinc-100 text-zinc-600 border-zinc-200",
  "武": "bg-orange-50 text-orange-700 border-orange-200",
  "毒": "bg-purple-50 text-purple-600 border-purple-200",
  "水": "bg-blue-50 text-blue-600 border-blue-200",
  "火": "bg-red-50 text-red-600 border-red-200",
  "电": "bg-yellow-50 text-yellow-500 border-yellow-200",
  "翼": "bg-indigo-50 text-indigo-600 border-indigo-200",
  "草": "bg-green-50 text-green-600 border-green-200",
  "萌": "bg-rose-50 text-rose-500 border-rose-200",
  "虫": "bg-lime-50 text-lime-600 border-lime-200",
  "龙": "bg-rose-50 text-rose-700 border-rose-200",
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

  return (
    <div
      className={`rounded-xl border hover:shadow-md transition-all flex flex-col sm:grid sm:grid-cols-12 gap-2.5 p-3 relative overflow-visible group/card ${
        parent.checked
          ? "border-indigo-400 bg-indigo-50/5 shadow-xs"
          : "bg-white border-slate-200/80 shadow-sm"
      }`}
    >
      {/* Left Column: Avatar, Checkbox, Delete */}
      <div className="w-full sm:col-span-4 flex flex-row sm:flex-col items-center sm:border-r sm:border-slate-100 pr-0 sm:pr-2 relative min-h-0 gap-3 sm:gap-1.5">
        
        {/* Checkbox and Delete Row */}
        <div className="absolute top-1.5 right-1.5 sm:static flex sm:items-center sm:justify-between w-auto sm:w-full gap-2 sm:pb-1.5 shrink-0 z-20">
          <label className="flex items-center gap-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!parent.checked}
              onChange={(e) => handleUpdateParentChecked(parent.id, e.target.checked)}
              className="w-3.5 h-3.5 cursor-pointer text-indigo-600 focus:ring-indigo-400 rounded border-slate-300"
            />
            <span className="text-[10px] font-bold text-slate-500 hover:text-indigo-650 transition-colors">配组</span>
          </label>

          <button
            onClick={() => handleDeleteParent(parent.id)}
            className="text-slate-350 hover:text-rose-600 hover:bg-rose-50 p-1 sm:p-0.5 rounded transition-all cursor-pointer border border-transparent hover:border-rose-100"
            title="删除精灵"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
          </button>
        </div>

        {/* Avatar Container */}
        <div className="w-20 h-20 sm:w-full sm:h-auto sm:aspect-square rounded-xl border border-slate-150 bg-slate-50/50 flex items-center justify-center shadow-inner relative group/avatar overflow-hidden shrink-0">
          {spriteUrl ? (
            <img
              src={spriteUrl}
              alt={spriteName}
              className="w-[85%] h-[85%] object-contain transition-transform duration-300 group-hover/avatar:scale-110"
            />
          ) : (
            <div className="w-7 h-7 flex items-center justify-center text-slate-300">🧬</div>
          )}

          {/* Form dropdown overlay for multi-form sprites */}
          {availableSprites.length > 1 && (
            <div className="absolute bottom-0.5 left-0.5 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded shadow-2xs z-10 border border-slate-200/85 flex items-center hover:bg-white transition-colors duration-150">
              <select
                value={availableSprites.includes(parent.sprite) ? parent.sprite : (spriteFile ? spriteFile.slice(0, -4) : parent.sprite)}
                onChange={(e) => handleUpdateParentSprite(parent.id, e.target.value)}
                className="text-[8px] sm:text-[9px] font-bold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer pr-1 py-0.25 leading-none appearance-none"
              >
                {availableSprites.map((spriteOption) => {
                  const displayName = getSpriteFormDisplayName(spriteOption);
                  return (
                    <option key={spriteOption} value={spriteOption}>
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
            <div className="absolute bottom-0.5 right-0.5 w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 z-10">
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
              inputClassName="bg-transparent font-bold text-xs text-slate-800 placeholder:text-slate-400 w-full border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none py-0.5 transition-colors text-left sm:text-center"
            />
          </div>

          {petDetails && petDetails.types && petDetails.types.length > 0 && (
            <div className="flex gap-1 justify-start sm:justify-center items-center flex-wrap w-full shrink-0">
              {petDetails.types.map((t) => {
                const iconUrl = getImagePath(`images/attributes/${t}.png`);
                const badgeStyle = typeColorMap[t] || "bg-slate-50 text-slate-600 border-slate-205";
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
        </div>
      </div>

      {/* Right Column: Settings */}
      <div className="w-full sm:col-span-8 flex flex-col justify-start gap-1 border-t sm:border-t-0 border-slate-100 pt-2.5 sm:pt-0">
        
        {/* Core Profile: Brand, Height, Weight */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-50/70 p-1.5 rounded-lg border border-slate-100/60">
          {/* Brand */}
          <div className="col-span-2 flex flex-col gap-0.5">
            <span className="text-[9px] font-bold text-slate-400 select-none">牌子</span>
            <select
              value={parent.brand}
              onChange={(e) => handleUpdateParentBrand(parent.id, e.target.value)}
              className={`appearance-none text-xs font-bold text-center border rounded-md py-0.5 px-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-250 transition-colors ${getBrandStyle(
                parent.brand
              )}`}
            >
              {BRAND_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Height (Ruler) */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold text-slate-400 select-none">身高</span>
            <div className="relative flex items-center rounded-md border border-slate-200 bg-slate-50 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-3xs overflow-hidden h-7">
              <div className="pl-1.5 pr-1 flex items-center text-slate-400 pointer-events-none select-none">
                <Ruler className="w-3 h-3" />
              </div>
              <input
                type="text"
                value={parent.height}
                onChange={(e) => handleUpdateParentHeight(parent.id, e.target.value)}
                placeholder="数字..."
                className="w-full text-xs font-bold text-slate-800 bg-transparent py-0.5 border-none focus:outline-none placeholder:text-slate-400"
              />
              <span className="text-[10px] font-bold text-slate-400 pr-1.5 pointer-events-none select-none">m</span>
            </div>
          </div>

          {/* Weight (Weight/Scale) */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold text-slate-400 select-none">体重</span>
            <div className="relative flex items-center rounded-md border border-slate-200 bg-slate-50 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-3xs overflow-hidden h-7">
              <div className="pl-1.5 pr-1 flex items-center text-slate-400 pointer-events-none select-none">
                <Weight className="w-3 h-3" />
              </div>
              <input
                type="text"
                value={parent.weight}
                onChange={(e) => handleUpdateParentWeight(parent.id, e.target.value)}
                placeholder="数字..."
                className="w-full text-xs font-bold text-slate-800 bg-transparent py-0.5 border-none focus:outline-none placeholder:text-slate-400"
              />
              <span className="text-[10px] font-bold text-slate-400 pr-1.5 pointer-events-none select-none">kg</span>
            </div>
          </div>
        </div>

        {/* Nature Selection Container */}
        <div className="flex flex-col gap-1 bg-slate-50/70 p-1.5 rounded-lg border border-slate-100/60">
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/50 px-1.5 py-0.5 rounded-md select-none shrink-0 w-fit flex items-center gap-0.5">
            精灵性格
          </span>
          <Autocomplete
            value={parent.nature}
            options={NATURE_OPTIONS}
            placeholder="选择/输入性格"
            onChange={(val) => handleUpdateParentNature(parent.id, val)}
            className="w-full"
            inputClassName="font-bold text-[13px] text-center text-slate-800 bg-white border border-slate-200 rounded-md py-0.5 px-2 w-full focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all shadow-3xs"
          />
        </div>

        {/* Stats Section */}
        <div className="flex flex-col gap-1.5 bg-slate-50/70 p-1.5 rounded-lg border border-slate-100/60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200/50 px-1.5 py-0.5 rounded-md select-none shrink-0 w-fit flex items-center gap-0.5">
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
          <div className="flex items-center justify-between gap-1.5 bg-slate-50/70 p-1.5 rounded-lg border border-slate-100/60 shrink-0">
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/50 px-1.5 py-0.5 rounded-md select-none shrink-0">
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
