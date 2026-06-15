import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Trash2,
  MinusCircle,
  PlusCircle,
  Plus,
  GripVertical,
  Egg,
  Eye,
  EyeOff,
  Heart,
  Minus,
  Mars,
  Venus,
  Sword,
  Wand2,
  Zap,
  Shield,
  ShieldCheck
} from "lucide-react";
import {
  EggPet,
  NATURE_OPTIONS,
  STATS_OPTIONS,
  EGG_GROUPS,
  BRAND_OPTIONS,
  NEST_STATUS_OPTIONS,
  LIMIT_OPTIONS
} from "../types";
import { Autocomplete } from "./Autocomplete";
import { getPetDetails, getSpriteFileName, getImagePath, ALL_PET_NAMES, getEggGroupStyle, getStatusStyle, getBrandStyle, getAvailableSprites, getSpriteFormDisplayName } from "../petHelper";

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
  "电": "bg-yellow-50 dark:bg-yellow-950/10 text-yellow-500 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/30",
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




interface SortableCardProps {
  pet: EggPet;
  handleDeletePet: (id: string) => void;
  handleUpdateSprite: (id: string, name: string) => void;
  handleUpdateParentName: (id: string, parent: "father" | "mother", name: string) => void;
  handleUpdateNature: (id: string, parent: "father" | "mother", natureIndex: number, value: string) => void;
  handleRemoveNature: (id: string, parent: "father" | "mother", natureIndex: number) => void;
  handleAddNature: (id: string, parent: "father" | "mother") => void;
  handleUpdateStat: (id: string, parent: "father" | "mother", statIndex: number, value: string) => void;
  handleUpdateGroup: (id: string, groupIndex: number, value: string) => void;
  handleRemoveGroup: (id: string, groupIndex: number) => void;
  handleAddGroup: (id: string) => void;
  handleUpdateBrand: (id: string, brand: string) => void;
  handleUpdateStatus: (id: string, status: string) => void;
  handleUpdateLimit: (id: string, limit: string) => void;
  handleUpdateHideStats: (id: string, hide: boolean) => void;
  handleUpdateEggCount: (id: string, count: string) => void;
  onProduceEgg?: (pet: EggPet) => void;
}

export const SortableCard = React.memo(function SortableCard({
  pet,
  handleDeletePet,
  handleUpdateSprite,
  handleUpdateParentName,
  handleUpdateNature,
  handleRemoveNature,
  handleAddNature,
  handleUpdateStat,
  handleUpdateGroup,
  handleRemoveGroup,
  handleAddGroup,
  handleUpdateBrand,
  handleUpdateStatus,
  handleUpdateLimit,
  handleUpdateHideStats,
  handleUpdateEggCount,
  onProduceEgg
}: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: pet.id as string });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const petDetails = getPetDetails(pet.sprite);
  const spriteName = petDetails ? petDetails.name : pet.sprite;
  const spriteFile = getSpriteFileName(pet.sprite);
  const spriteUrl = spriteFile ? getImagePath(`images/sprites/${spriteFile}`) : null;
  const availableSprites = getAvailableSprites(pet.sprite);

  // 判断是否 3V
  const isPet3V = () => {
    if (pet.hideStats) return false;
    const f = pet.fatherStats || ["生命", "物攻", "速度"];
    const m = pet.motherStats || ["生命", "物攻", "速度"];
    if (f.includes("无") || m.includes("无")) return false;
    const fSorted = [...f].sort();
    const mSorted = [...m].sort();
    return fSorted.every((v, idx) => v === mSorted[idx]);
  };

  const renderStatSelect = (
    parent: "father" | "mother",
    sIdx: number,
    currentValue: string
  ) => {
    const badgeColors = getStatBadgeStyle(currentValue);
    const isImageStat = STATS_WITH_IMAGES.includes(currentValue);

    return (
      <div
        key={sIdx}
        className={`relative w-[28px] h-[28px] rounded-full border flex items-center justify-center transition-all shadow-3xs cursor-pointer hover:scale-100 active:scale-95 stat-icon-select-container ${badgeColors}`}
        title={`${parent === "father" ? "父方" : "母方"}三围[${sIdx + 1}]: ${currentValue}`}
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
          onChange={(e) => handleUpdateStat(pet.id as string, parent, sIdx, e.target.value)}
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
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col sm:grid sm:grid-cols-12 gap-2.5 p-3 relative overflow-visible group/card ${isDragging ? "shadow-lg ring-2 ring-indigo-200 dark:ring-indigo-950 bg-slate-50/90 dark:bg-slate-900/90" : ""
        }`}
    >
      {/* Left Column: Avatar & Meta */}
      <div className="w-full sm:col-span-4 flex flex-row sm:flex-col items-center sm:border-r sm:border-slate-100 dark:sm:border-slate-800 pr-0 sm:pr-2 relative min-h-0 gap-3 sm:gap-1.5">
        {/* Drag handle & Delete row - absolute positioned on mobile, normal flow on desktop */}
        <div className="absolute top-1.5 right-1.5 sm:static flex sm:items-center sm:justify-between w-auto sm:w-full gap-1 sm:pb-1.5 shrink-0 z-20">
          <div
            {...attributes}
            {...listeners}
            className="flex items-center justify-center p-1 sm:p-0.5 text-slate-400 hover:text-slate-650 active:text-indigo-650 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-grab active:cursor-grabbing transition-colors shrink-0 drag-grip-handle"
            title="按住拖动排序"
          >
            <GripVertical className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
          </div>

          <button
            onClick={() => handleDeletePet(pet.id as string)}
            className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/35 p-1 sm:p-0.5 rounded transition-all cursor-pointer border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30 action-buttons"
            title="删除该蛋窝"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
          </button>
        </div>

        {/* Large Avatar Container */}
        <div className="w-20 h-20 sm:w-full sm:h-auto sm:aspect-square rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-center shadow-inner relative group/avatar overflow-hidden shrink-0">
          {spriteUrl ? (
            <img
              src={spriteUrl}
              alt={spriteName}
              className="w-[85%] h-[85%] object-contain transition-transform duration-300 group-hover/avatar:scale-110"
            />
          ) : (
            <Egg className="w-7 h-7 text-slate-300 animate-pulse" />
          )}

          {/* Form dropdown overlay for multi-form sprites */}
          {availableSprites.length > 1 && (
            <div className="absolute bottom-0.5 left-0.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs px-1.5 py-0.5 rounded shadow-2xs z-10 border border-slate-200/85 dark:border-slate-700 flex items-center hover:bg-white dark:hover:bg-slate-700 transition-colors duration-150 action-buttons">
              <select
                value={availableSprites.includes(pet.sprite) ? pet.sprite : (spriteFile ? spriteFile.slice(0, -4) : pet.sprite)}
                onChange={(e) => handleUpdateSprite(pet.id as string, e.target.value)}
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

          {/* Top Overlays */}
          {isPet3V() && (
            <span className="absolute top-0.5 left-0.5 text-[7px] sm:text-[8px] font-extrabold px-1 sm:px-1.5 py-0.25 rounded bg-emerald-500 text-white shadow-xs shrink-0 scale-90 origin-top-left z-15">
              3V
            </span>
          )}
          {pet.isLimit === "有极限蛋" && (
            <span className="absolute top-0.5 right-0.5 text-[7px] sm:text-[8px] font-extrabold px-1 sm:px-1.5 py-0.25 rounded bg-amber-500 text-white shadow-xs shrink-0 scale-90 origin-top-right z-15">
              极限
            </span>
          )}
        </div>

        {/* Vertical Align Name and Types on desktop, flex-1 container on mobile */}
        <div className="flex flex-col items-start sm:items-center gap-1 sm:gap-1.5 flex-1 min-w-0 pr-10 sm:pr-0">
          {/* Name input underneath avatar */}
          <div className="w-full text-left sm:text-center shrink-0">
            <Autocomplete
              value={pet.sprite}
              options={ALL_PET_NAMES}
              placeholder="输入精灵..."
              onChange={(val) => handleUpdateSprite(pet.id as string, val)}
              className="w-full text-left sm:text-center"
              inputClassName="bg-transparent font-bold text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 w-full border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-none py-0.5 transition-colors text-left sm:text-center"
            />
          </div>

          {/* Type badges: circular images */}
          {petDetails && petDetails.types && petDetails.types.length > 0 && (
            <div className="flex gap-1 justify-start sm:justify-center items-center flex-wrap w-full shrink-0">
              {petDetails.types.map((t) => {
                const iconUrl = getImagePath(`images/attributes/${t}.png`);
                const badgeStyle = typeColorMap[t] || "bg-slate-50 text-slate-600 border-slate-200";
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

      {/* Right Column: Editing settings (occupies 8/12 cols, approx 67% width) */}
      <div className="w-full sm:col-span-8 flex flex-col justify-start gap-1 border-t sm:border-t-0 border-slate-100 pt-2.5 sm:pt-0">
        {/* Father & Mother Configurations */}
        <div className="grid grid-cols-2 gap-2">
          {/* Father Column */}
          <div className="flex flex-col gap-1">
            <div className="relative flex items-center w-full">
              <Autocomplete
                value={pet.fatherName || ""}
                options={ALL_PET_NAMES}
                placeholder="父方配置"
                onChange={(val) => handleUpdateParentName(pet.id as string, "father", val)}
                className="w-full"
                inputClassName="font-bold text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded pl-1.5 pr-5 py-0.5 w-full focus:outline-none focus:border-blue-400 dark:focus:border-blue-550 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-3xs"
              />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500 dark:text-blue-400 font-bold text-[11px] flex items-center">
                ♂
              </span>
            </div>

            {/* Father Natures */}
            <div className="flex flex-col gap-0.5">
              {(pet.fatherNatures || []).map((nat, nIdx) => {
                return (
                  <div key={nIdx} className="flex items-center gap-1 w-full">
                    <Autocomplete
                      value={nat}
                      options={NATURE_OPTIONS}
                      placeholder="选择性格"
                      onChange={(val) => handleUpdateNature(pet.id as string, "father", nIdx, val)}
                      className="flex-1 min-w-0"
                      inputClassName="font-bold text-[13px] text-center text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md py-0.5 px-1 w-full focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/40 transition-all shadow-3xs"
                    />
                    <div className="flex items-center gap-0.5 shrink-0 action-buttons select-action-buttons">
                      {(pet.fatherNatures || []).length > 1 && (
                        <button
                           onClick={() => handleRemoveNature(pet.id as string, "father", nIdx)}
                           className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-0.5 rounded-full transition-colors cursor-pointer"
                           title="移除性格"
                        >
                          <MinusCircle className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Father Stats (Icons) */}
            {!pet.hideStats && (
              <div className="flex items-center gap-1.5 justify-center py-0.5 mt-0.5 shrink-0">
                {(pet.fatherStats || ["生命", "物攻", "速度"]).map((stat, sIdx) =>
                  renderStatSelect("father", sIdx, stat)
                )}
              </div>
            )}
          </div>

          {/* Mother Column */}
          <div className="flex flex-col gap-1">
            <div className="relative flex items-center w-full">
              <Autocomplete
                value={pet.motherName || ""}
                options={ALL_PET_NAMES}
                placeholder="母方配置"
                onChange={(val) => handleUpdateParentName(pet.id as string, "mother", val)}
                className="w-full"
                inputClassName="font-bold text-[10px] text-pink-650 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/40 rounded pl-1.5 pr-5 py-0.5 w-full focus:outline-none focus:border-pink-400 dark:focus:border-pink-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-3xs"
              />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-pink-500 dark:text-pink-400 font-bold text-[11px] flex items-center">
                ♀
              </span>
            </div>

            {/* Mother Natures */}
            <div className="flex flex-col gap-0.5">
              {(pet.motherNatures || []).map((nat, nIdx) => {
                return (
                  <div key={nIdx} className="flex items-center gap-1 w-full">
                    <Autocomplete
                      value={nat}
                      options={NATURE_OPTIONS}
                      placeholder="选择性格"
                      onChange={(val) => handleUpdateNature(pet.id as string, "mother", nIdx, val)}
                      className="flex-1 min-w-0"
                      inputClassName="font-bold text-[13px] text-center text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md py-0.5 px-1 w-full focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/40 transition-all shadow-3xs"
                    />
                    <div className="flex items-center gap-0.5 shrink-0 action-buttons select-action-buttons">
                      {(pet.motherNatures || []).length > 1 && (
                        <button
                          onClick={() => handleRemoveNature(pet.id as string, "mother", nIdx)}
                          className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-0.5 rounded-full transition-colors cursor-pointer"
                          title="移除性格"
                        >
                          <MinusCircle className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mother Stats (Icons) */}
            {!pet.hideStats && (
              <div className="flex items-center gap-1.5 justify-center py-0.5 mt-0.5 shrink-0">
                {(pet.motherStats || ["生命", "物攻", "速度"]).map((stat, sIdx) =>
                  renderStatSelect("mother", sIdx, stat)
                )}
              </div>
            )}
          </div>
        </div>

        {/* Hide/Show Stats Controller */}
        <div className="flex justify-center shrink-0">
          {pet.hideStats ? (
            <div className="w-full py-1.5 px-2 border border-dashed border-slate-200 dark:border-slate-750 rounded-lg bg-slate-50/50 dark:bg-slate-900/40 flex flex-col items-center justify-center select-none">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                <EyeOff className="w-3 h-3" /> 三围信息已隐藏
              </span>
              <button
                onClick={() => handleUpdateHideStats(pet.id as string, false)}
                className="mt-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full shadow-3xs transition-colors action-buttons cursor-pointer"
              >
                显示并编辑三围
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleUpdateHideStats(pet.id as string, true)}
              className="text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors action-buttons border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30 bg-slate-50/20 dark:bg-slate-900/20 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 px-2 py-0.5 rounded-full select-none cursor-pointer flex items-center gap-1"
            >
              <Eye className="w-2.5 h-2.5" /> 隐藏三围属性
            </button>
          )}
        </div>

        {/* Egg Groups & Settings Footer */}
        <div className="flex flex-col gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-2 shrink-0">
          {/* Egg Groups Row */}
          <div className="flex items-center justify-between gap-1.5 bg-slate-50/70 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-100/60 dark:border-slate-800">
            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 border border-teal-200/50 dark:border-teal-900/40 px-1.5 py-0.5 rounded-md select-none shrink-0 flex items-center gap-0.5">
              宠物蛋组
            </span>
            <div className="flex flex-wrap gap-1 items-center justify-end flex-1">
              {pet.groups.map((grp, gIdx) => {
                const isLast = gIdx === pet.groups.length - 1;
                const canAdd = isLast && pet.groups.length < 3;
                return (
                  <div key={gIdx} className="flex items-center gap-1">
                    <div className="relative shrink-0">
                      <select
                        value={grp}
                        onChange={(e) => handleUpdateGroup(pet.id as string, gIdx, e.target.value)}
                        className={`appearance-none text-xs font-bold text-center border rounded-full py-0.5 px-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700 transition-all ${getEggGroupStyle(
                          grp
                        )}`}
                      >
                        {EGG_GROUPS.map((opt) => (
                          <option key={opt} value={opt} className="dark:bg-slate-800 dark:text-slate-200">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0 action-buttons select-action-buttons">
                      {pet.groups.length > 1 && (
                        <button
                          onClick={() => handleRemoveGroup(pet.id as string, gIdx)}
                          className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-0.5 rounded-full transition-colors cursor-pointer"
                          title="移除蛋组"
                        >
                          <MinusCircle className="w-3 h-3" />
                        </button>
                      )}
                      {canAdd && (
                        <button
                          onClick={() => handleAddGroup(pet.id as string)}
                          className="text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 p-0.5 rounded-full transition-colors cursor-pointer"
                          title="添加蛋组"
                        >
                          <PlusCircle className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Brand, Limit, Status Row */}
          <div className="grid grid-cols-12 gap-1 bg-slate-50/70 dark:bg-slate-900/40 p-1.5 rounded-lg border border-slate-100/60 dark:border-slate-800">
            {/* Brand Column */}
            <div className="col-span-3 flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-300 select-none">牌子</span>
              <select
                value={pet.brand}
                onChange={(e) => handleUpdateBrand(pet.id as string, e.target.value)}
                className={`appearance-none text-xs font-bold text-center border rounded-md py-0.5 px-0.5 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-950 transition-colors ${getBrandStyle(
                  pet.brand
                )}`}
              >
                {BRAND_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="dark:bg-slate-800 dark:text-slate-200">
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Limit Column */}
            <div className="col-span-4 flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-300 select-none">极限蛋</span>
              <select
                value={pet.isLimit}
                onChange={(e) => handleUpdateLimit(pet.id as string, e.target.value)}
                className={`appearance-none text-xs font-bold text-center border rounded-md py-0.5 px-0.5 w-full cursor-pointer focus:outline-none focus:ring-2 transition-colors ${pet.isLimit === "有极限蛋"
                  ? "bg-amber-100 border-amber-300 text-amber-800 font-bold dark:bg-amber-950/20 dark:border-amber-900/35 dark:text-amber-300"
                  : "bg-slate-100 border-slate-200 text-slate-650 font-medium dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                  }`}
              >
                {LIMIT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="dark:bg-slate-800 dark:text-slate-200">
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Column */}
            <div className="col-span-5 flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-300 select-none">蛋窝状态</span>
              <select
                value={pet.status}
                onChange={(e) => handleUpdateStatus(pet.id as string, e.target.value)}
                className={`appearance-none text-xs font-bold text-center border rounded-md py-0.5 px-0.5 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-950 transition-colors ${getStatusStyle(
                  pet.status
                )}`}
              >
                {NEST_STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-semibold py-1">
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nest Egg Count Floating Overlay / Row */}
          {pet.status === "有现蛋" ? (
            <div className="flex items-center justify-between gap-1.5 bg-amber-50/50 dark:bg-amber-950/15 border border-amber-200/40 dark:border-amber-900/30 rounded-lg px-2 py-1 mt-0.5">
              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                <Egg className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                当前窝点现蛋数量
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="number"
                  min="0"
                  value={pet.eggCount || "1"}
                  onChange={(e) => handleUpdateEggCount(pet.id as string, e.target.value)}
                  className="w-10 text-center text-xs font-bold text-amber-950 dark:text-amber-300 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/40 rounded focus:outline-none focus:ring-2 focus:ring-amber-400 py-0.5 px-0.5 shadow-3xs"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onProduceEgg) {
                      onProduceEgg(pet);
                    }
                  }}
                  className="text-[10px] font-bold text-white bg-amber-500 hover:bg-amber-600 active:scale-95 px-2 py-1 rounded-md shadow-3xs transition-all cursor-pointer flex items-center gap-0.5 border border-transparent action-buttons"
                  title="一键产蛋并录入到蛋管理中心"
                >
                  <Plus className="w-2.5 h-2.5" />
                  产蛋
                </button>
              </div>
            </div>
          ) : (
            (() => {
              let containerClass = "bg-indigo-50/50 dark:bg-indigo-950/15 border-indigo-200/40 dark:border-indigo-900/30";
              let dotClass = "bg-indigo-500 dark:bg-indigo-400";
              let textClass = "text-indigo-900 dark:text-indigo-300";
              let statusTextClass = "text-indigo-650 dark:text-indigo-400 bg-indigo-100/60 dark:bg-indigo-950/30 border border-transparent dark:border-indigo-900/30";
              let statusLabel = "已就绪";
              let desc = "当前蛋窝状态已就绪";
              let isPing = false;

              if (pet.status === "正在孵，可预约") {
                containerClass = "bg-sky-50/70 dark:bg-sky-950/15 border-sky-300/60 dark:border-sky-900/40";
                dotClass = "bg-sky-500 dark:bg-sky-400";
                textClass = "text-sky-900 dark:text-sky-300";
                statusTextClass = "text-sky-700 dark:text-sky-350 bg-sky-100/80 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/40";
                statusLabel = "孵化中";
                desc = "精灵蛋在窝里温暖孵化";
                isPing = true;
              } else if (pet.status === "已撤窝") {
                containerClass = "bg-orange-50/70 dark:bg-orange-950/15 border-orange-300/60 dark:border-orange-900/40";
                dotClass = "bg-orange-500 dark:bg-orange-400";
                textClass = "text-orange-950 dark:text-orange-300";
                statusTextClass = "text-orange-700 dark:text-orange-300 bg-orange-100/80 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/40";
                statusLabel = "已撤窝";
                desc = "当前蛋窝精灵蛋已撤窝";
              } else if (pet.status === "接投资") {
                containerClass = "bg-purple-50/70 dark:bg-purple-950/15 border-purple-300/60 dark:border-purple-900/40";
                dotClass = "bg-purple-500 dark:bg-purple-400";
                textClass = "text-purple-900 dark:text-purple-300";
                statusTextClass = "text-purple-700 dark:text-purple-400 bg-purple-100/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40";
                statusLabel = "接投资";
                desc = "空位引资，等待老板投资";
                isPing = true;
              } else {
                // 已就绪状态
                containerClass = "bg-indigo-50/50 dark:bg-indigo-950/15 border-indigo-200/40 dark:border-indigo-900/35";
                textClass = "text-indigo-900 dark:text-indigo-300";
                statusTextClass = "text-indigo-650 dark:text-indigo-400 bg-indigo-100/60 dark:bg-indigo-950/30 border border-transparent dark:border-indigo-900/30";
              }

              return (
                <div className={`flex items-center justify-between gap-1.5 border rounded-lg px-2 py-1 mt-0.5 min-h-[26px] ${containerClass}`}>
                  <span className={`text-[10px] font-bold ${textClass} flex items-center gap-1.5`}>
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      {isPing && (
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotClass}`}></span>
                      )}
                      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotClass}`}></span>
                    </span>
                    {desc}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.25 rounded shrink-0 ${statusTextClass}`}>
                    {statusLabel}
                  </span>
                </div>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
});
