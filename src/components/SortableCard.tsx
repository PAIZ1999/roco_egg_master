import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Trash2,
  MinusCircle,
  PlusCircle,
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




interface SortableCardProps {
  pet: EggPet;
  handleDeletePet: (id: string) => void;
  handleUpdateSprite: (id: string, name: string) => void;
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
}

export const SortableCard = React.memo(function SortableCard({
  pet,
  handleDeletePet,
  handleUpdateSprite,
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
  handleUpdateEggCount
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
        className={`relative w-[28px] h-[28px] rounded-full border flex items-center justify-center transition-all shadow-3xs cursor-pointer hover:scale-105 active:scale-95 stat-icon-select-container ${badgeColors}`}
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
      className={`bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col sm:grid sm:grid-cols-12 gap-2.5 p-3 relative overflow-visible group/card ${isDragging ? "shadow-lg ring-2 ring-indigo-200 bg-slate-50/90" : ""
        }`}
    >
      {/* Left Column: Avatar & Meta */}
      <div className="w-full sm:col-span-4 flex flex-row sm:flex-col items-center sm:border-r sm:border-slate-100 pr-0 sm:pr-2 relative min-h-0 gap-3 sm:gap-1.5">
        {/* Drag handle & Delete row - absolute positioned on mobile, normal flow on desktop */}
        <div className="absolute top-1.5 right-1.5 sm:static flex sm:items-center sm:justify-between w-auto sm:w-full gap-1 sm:pb-1.5 shrink-0 z-20">
          <div
            {...attributes}
            {...listeners}
            className="flex items-center justify-center p-1 sm:p-0.5 text-slate-400 hover:text-slate-650 active:text-indigo-650 hover:bg-slate-100 rounded cursor-grab active:cursor-grabbing transition-colors shrink-0 drag-grip-handle"
            title="按住拖动排序"
          >
            <GripVertical className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
          </div>

          <button
            onClick={() => handleDeletePet(pet.id as string)}
            className="text-slate-350 hover:text-rose-600 hover:bg-rose-50 p-1 sm:p-0.5 rounded transition-all cursor-pointer border border-transparent hover:border-rose-100 action-buttons"
            title="删除该蛋窝"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
          </button>
        </div>

        {/* Large Avatar Container */}
        <div className="w-20 h-20 sm:w-full sm:h-auto sm:aspect-square rounded-xl border border-slate-150 bg-slate-50/50 flex items-center justify-center shadow-inner relative group/avatar overflow-hidden shrink-0">
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
            <div className="absolute bottom-0.5 left-0.5 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded shadow-2xs z-10 border border-slate-200/85 flex items-center hover:bg-white transition-colors duration-150 action-buttons">
              <select
                value={availableSprites.includes(pet.sprite) ? pet.sprite : (spriteFile ? spriteFile.slice(0, -4) : pet.sprite)}
                onChange={(e) => handleUpdateSprite(pet.id as string, e.target.value)}
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
              inputClassName="bg-transparent font-bold text-xs text-slate-800 placeholder:text-slate-400 w-full border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none py-0.5 transition-colors text-left sm:text-center"
            />
          </div>

          {/* Type badges: circular images */}
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

      {/* Right Column: Editing settings (occupies 8/12 cols, approx 67% width) */}
      <div className="w-full sm:col-span-8 flex flex-col justify-start gap-1 border-t sm:border-t-0 border-slate-100 pt-2.5 sm:pt-0">
        {/* Father & Mother Configurations */}
        <div className="grid grid-cols-2 gap-2">
          {/* Father Column */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50/60 px-1.5 py-0.5 rounded border border-blue-100/40 w-fit select-none flex items-center gap-0.5 shrink-0">
              父方配置 <Mars className="w-2.5 h-2.5 text-blue-500" />
            </span>

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
                      inputClassName="font-bold text-[13px] text-center text-slate-800 bg-slate-50 border border-slate-200 rounded-md py-0.5 px-1 w-full focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all shadow-3xs"
                    />
                    <div className="flex items-center gap-0.5 shrink-0 action-buttons select-action-buttons">
                      {(pet.fatherNatures || []).length > 1 && (
                        <button
                          onClick={() => handleRemoveNature(pet.id as string, "father", nIdx)}
                          className="text-rose-500 hover:bg-rose-50 p-0.5 rounded-full transition-colors cursor-pointer"
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
            <span className="text-[10px] font-bold text-pink-650 bg-pink-50/60 px-1.5 py-0.5 rounded border border-pink-100/40 w-fit select-none flex items-center gap-0.5 shrink-0">
              母方配置 <Venus className="w-2.5 h-2.5 text-pink-500" />
            </span>

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
                      inputClassName="font-bold text-[13px] text-center text-slate-800 bg-slate-50 border border-slate-200 rounded-md py-0.5 px-1 w-full focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all shadow-3xs"
                    />
                    <div className="flex items-center gap-0.5 shrink-0 action-buttons select-action-buttons">
                      {(pet.motherNatures || []).length > 1 && (
                        <button
                          onClick={() => handleRemoveNature(pet.id as string, "mother", nIdx)}
                          className="text-rose-500 hover:bg-rose-50 p-0.5 rounded-full transition-colors cursor-pointer"
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
            <div className="w-full py-1.5 px-2 border border-dashed border-slate-200 rounded-lg bg-slate-50/50 flex flex-col items-center justify-center select-none">
              <span className="text-[10px] text-slate-555 font-bold flex items-center gap-1">
                <EyeOff className="w-3 h-3" /> 三围信息已隐藏
              </span>
              <button
                onClick={() => handleUpdateHideStats(pet.id as string, false)}
                className="mt-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-750 bg-white hover:bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full shadow-3xs transition-colors action-buttons cursor-pointer"
              >
                显示并编辑三围
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleUpdateHideStats(pet.id as string, true)}
              className="text-[10px] font-bold text-slate-500 hover:text-indigo-650 transition-colors action-buttons border border-transparent hover:border-indigo-150 bg-slate-50/20 hover:bg-indigo-50/30 px-2 py-0.5 rounded-full select-none cursor-pointer flex items-center gap-1"
            >
              <Eye className="w-2.5 h-2.5" /> 隐藏三围属性
            </button>
          )}
        </div>

        {/* Egg Groups & Settings Footer */}
        <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-2 shrink-0">
          {/* Egg Groups Row */}
          <div className="flex items-center justify-between gap-1.5 bg-slate-50/70 p-1.5 rounded-lg border border-slate-100/60">
            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200/50 px-1.5 py-0.5 rounded-md select-none shrink-0 flex items-center gap-0.5">
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
                        className={`appearance-none text-xs font-bold text-center border rounded-full py-0.5 px-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all ${getEggGroupStyle(
                          grp
                        )}`}
                      >
                        {EGG_GROUPS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0 action-buttons select-action-buttons">
                      {pet.groups.length > 1 && (
                        <button
                          onClick={() => handleRemoveGroup(pet.id as string, gIdx)}
                          className="text-rose-500 hover:bg-rose-50 p-0.5 rounded-full transition-colors cursor-pointer"
                          title="移除蛋组"
                        >
                          <MinusCircle className="w-3 h-3" />
                        </button>
                      )}
                      {canAdd && (
                        <button
                          onClick={() => handleAddGroup(pet.id as string)}
                          className="text-indigo-500 hover:bg-indigo-50 p-0.5 rounded-full transition-colors cursor-pointer"
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
          <div className="grid grid-cols-12 gap-1 bg-slate-50/70 p-1.5 rounded-lg border border-slate-100/60">
            {/* Brand Column */}
            <div className="col-span-3 flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-slate-400 select-none">牌子</span>
              <select
                value={pet.brand}
                onChange={(e) => handleUpdateBrand(pet.id as string, e.target.value)}
                className={`appearance-none text-xs font-bold text-center border rounded-md py-0.5 px-0.5 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-250 transition-colors ${getBrandStyle(
                  pet.brand
                )}`}
              >
                {BRAND_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Limit Column */}
            <div className="col-span-4 flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-slate-400 select-none">极限蛋</span>
              <select
                value={pet.isLimit}
                onChange={(e) => handleUpdateLimit(pet.id as string, e.target.value)}
                className={`appearance-none text-xs font-bold text-center border rounded-md py-0.5 px-0.5 w-full cursor-pointer focus:outline-none focus:ring-2 transition-colors ${pet.isLimit === "有极限蛋"
                  ? "bg-amber-100 border-amber-300 text-amber-800 font-bold"
                  : "bg-slate-105 border-slate-205 text-slate-650 font-medium"
                  }`}
              >
                {LIMIT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Column */}
            <div className="col-span-5 flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-slate-400 select-none">蛋窝状态</span>
              <select
                value={pet.status}
                onChange={(e) => handleUpdateStatus(pet.id as string, e.target.value)}
                className={`appearance-none text-xs font-bold text-center border rounded-md py-0.5 px-0.5 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-colors ${getStatusStyle(
                  pet.status
                )}`}
              >
                {NEST_STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-white text-slate-800 font-semibold py-1">
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nest Egg Count Floating Overlay / Row */}
          {pet.status === "有现蛋" ? (
            <div className="flex items-center justify-between gap-1.5 bg-amber-50/50 border border-amber-200/40 rounded-lg px-2 py-1 mt-0.5">
              <span className="text-[10px] font-bold text-amber-800 flex items-center gap-1">
                <Egg className="w-3 h-3 text-amber-600 shrink-0" />
                当前窝点现蛋数量
              </span>
              <input
                type="number"
                min="0"
                value={pet.eggCount || "1"}
                onChange={(e) => handleUpdateEggCount(pet.id as string, e.target.value)}
                className="w-10 text-center text-xs font-bold text-amber-950 bg-white border border-amber-200 rounded focus:outline-none focus:ring-2 focus:ring-amber-400 py-0.5 px-0.5 shadow-3xs"
              />
            </div>
          ) : (
            (() => {
              let containerClass = "bg-indigo-50/50 border-indigo-200/40";
              let dotClass = "bg-indigo-500";
              let textClass = "text-indigo-850";
              let statusTextClass = "text-indigo-650 bg-indigo-100/60";
              let statusLabel = "已就绪";
              let desc = "当前蛋窝状态已就绪";
              let isPing = false;

              if (pet.status === "正在孵，可预约") {
                containerClass = "bg-sky-50/70 border-sky-300/60";
                dotClass = "bg-sky-500";
                textClass = "text-sky-850";
                statusTextClass = "text-sky-700 bg-sky-100/80 border border-sky-200";
                statusLabel = "孵化中";
                desc = "精灵蛋在窝里温暖孵化";
                isPing = true;
              } else if (pet.status === "已撤窝") {
                containerClass = "bg-orange-50/70 border-orange-300/60";
                dotClass = "bg-orange-500";
                textClass = "text-orange-950";
                statusTextClass = "text-orange-700 bg-orange-100/80 border border-orange-200";
                statusLabel = "已撤窝";
                desc = "当前蛋窝精灵蛋已撤窝";
              } else if (pet.status === "接投资") {
                containerClass = "bg-purple-50/70 border-purple-300/60";
                dotClass = "bg-purple-500";
                textClass = "text-purple-900";
                statusTextClass = "text-purple-700 bg-purple-100/80 border border-purple-200";
                statusLabel = "接投资";
                desc = "空位引资，等待老板投资";
                isPing = true;
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
