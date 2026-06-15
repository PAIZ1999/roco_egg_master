import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Trash2,
  MinusCircle,
  PlusCircle,
  GripVertical
} from "lucide-react";
import {
  EggPet,
  NATURE_OPTIONS,
  STATS_OPTIONS,
  EGG_GROUPS,
  BRAND_OPTIONS,
  NEST_STATUS_OPTIONS,
  LIMIT_OPTIONS,
  THREE_V_OPTIONS
} from "../types";
import { Autocomplete } from "./Autocomplete";
import { ALL_PET_NAMES, getPetDetails, getSpriteFileName, getImagePath, getAvailableSprites, getSpriteFormDisplayName } from "../petHelper";

const typeColorMap: Record<string, string> = {
  "光": "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-900/30",
  "冰": "bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900/30",
  "地": "bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/30",
  "幻": "bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-300 border-pink-200 dark:border-pink-900/30",
  "幽": "bg-violet-50 dark:bg-violet-950/20 text-violet-650 dark:text-violet-300 border-violet-200 dark:border-violet-900/30",
  "恶": "bg-red-50 dark:bg-red-950/10 text-red-200 dark:text-red-300 border-red-200 dark:border-red-900/30",
  "普通": "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  "机械": "bg-zinc-100 dark:bg-zinc-900/20 text-zinc-650 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800/30",
  "武": "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900/30",
  "毒": "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-900/30",
  "水": "bg-blue-50 dark:bg-blue-950/20 text-blue-650 dark:text-blue-300 border-blue-200 dark:border-blue-900/30",
  "火": "bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-300 border-red-200 dark:border-red-900/30",
  "电": "bg-yellow-50 dark:bg-yellow-950/10 text-yellow-500 dark:text-yellow-405 border-yellow-200 dark:border-yellow-900/30",
  "翼": "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/30",
  "草": "bg-green-50 dark:bg-green-950/20 text-green-650 dark:text-green-300 border-green-200 dark:border-green-900/30",
  "萌": "bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-300 border-rose-200 dark:border-rose-900/30",
  "虫": "bg-lime-50 dark:bg-lime-950/20 text-lime-650 dark:text-lime-300 border-lime-200 dark:border-lime-900/30",
  "龙": "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/30",
};

interface SortableRowProps {
  key?: string;
  pet: EggPet;
  originalIndex: number;
  handleDeletePet: (index: number) => void;
  handleUpdateSprite: (index: number, name: string) => void;
  handleUpdateNature: (index: number, parent: "father" | "mother", natureIndex: number, value: string) => void;
  handleRemoveNature: (index: number, parent: "father" | "mother", natureIndex: number) => void;
  handleAddNature: (index: number, parent: "father" | "mother") => void;
  handleUpdateStat: (index: number, parent: "father" | "mother", statIndex: number, value: string) => void;
  handleUpdateGroup: (index: number, groupIndex: number, value: string) => void;
  handleRemoveGroup: (index: number, groupIndex: number) => void;
  handleAddGroup: (index: number) => void;
  handleUpdateBrand: (index: number, brand: string) => void;
  handleUpdateStatus: (index: number, status: string) => void;
  handleUpdateLimit: (index: number, limit: string) => void;
  handleUpdateHideStats: (index: number, hide: boolean) => void;
  getEggGroupStyle: (group: string) => string;
  getStatusStyle: (status: string) => string;
  getBrandStyle: (brand: string) => string;
}

const getStatBadgeStyle = (stat: string): string => {
  const colors: Record<string, string> = {
    "无": "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700 line-through decoration-dotted font-normal",
    "生命": "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/30",
    "物攻": "bg-amber-50 dark:bg-amber-950/15 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/35",
    "速度": "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/30",
    "魔攻": "bg-purple-50 dark:bg-purple-950/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/35",
    "物防": "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/30",
    "魔防": "bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900/30",
  };
  return colors[stat] || "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-750";
};

export function SortableRow({
  pet,
  originalIndex,
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
  getEggGroupStyle,
  getStatusStyle,
  getBrandStyle
}: SortableRowProps) {
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
    backgroundColor: isDragging ? (typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? "rgba(30, 41, 59, 0.95)" : "rgba(243, 244, 246, 0.9)") : undefined,
    zIndex: isDragging ? 10 : undefined,
    position: isDragging ? "relative" : undefined,
  };

  const petDetails = getPetDetails(pet.sprite);
  const spriteName = petDetails ? petDetails.name : pet.sprite;
  const spriteFile = getSpriteFileName(pet.sprite);
  const spriteUrl = spriteFile ? getImagePath(`images/sprites/${spriteFile}`) : null;
  const availableSprites = getAvailableSprites(pet.sprite);

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800/60 transition-colors group relative ${isDragging ? "shadow-md ring-2 ring-indigo-100 dark:ring-indigo-950" : ""}`}
    >
      {/* Drag handle column */}
      <td className="px-1 py-3 text-center align-middle drag-handle-column">
        <div
          {...attributes}
          {...listeners}
          className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-600 active:text-indigo-650 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-grab active:cursor-grabbing transition-colors drag-grip-handle"
          title="按住拖动排序"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      </td>

      {/* Name input + hovering delete */}
      <td className="p-3 relative align-middle">
        <div className="flex items-center gap-2 min-w-[170px] justify-start px-2 relative">
          {/* Avatar Container */}
          <div className="w-12 h-12 rounded-full border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative hover:[&_img]:scale-75 hover:[&_span]:scale-75 hover:[&_button]:opacity-100 hover:[&_button]:pointer-events-auto">
            {spriteUrl ? (
              <img src={spriteUrl} alt={spriteName} className="w-10 h-10 object-contain transition-transform duration-200" />
            ) : (
              <span className="text-sm text-slate-400 dark:text-slate-500 font-bold transition-transform duration-200">?</span>
            )}

            {/* Hover Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeletePet(originalIndex);
              }}
              className="absolute inset-0 flex items-center justify-center bg-rose-500/90 text-white rounded-full opacity-0 pointer-events-none transition-all duration-200 z-20 cursor-pointer action-buttons hover:bg-rose-600/95"
              title="删除这一行"
            >
              <Trash2 className="w-6 h-6 hover:scale-110 active:scale-95 transition-transform" />
            </button>
          </div>

          <div className="flex flex-col flex-1 items-start gap-1">
            <div className="flex items-center gap-1">
              <Autocomplete
                value={pet.sprite}
                options={ALL_PET_NAMES}
                placeholder="精灵名称..."
                onChange={val => handleUpdateSprite(originalIndex, val)}
                className="w-28 text-left"
                inputClassName="bg-transparent font-bold text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 w-full border-b-2 border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-none pb-0.5 transition-colors text-left"
              />

              {/* Form selector dropdown for multi-form sprites in row */}
              {availableSprites.length > 1 && (
                <div className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 px-1 py-0.25 rounded shadow-3xs border border-slate-200 dark:border-slate-700 flex items-center transition-colors duration-150 action-buttons shrink-0 -ml-1">
                  <select
                    value={availableSprites.includes(pet.sprite) ? pet.sprite : (spriteFile ? spriteFile.slice(0, -4) : pet.sprite)}
                    onChange={(e) => handleUpdateSprite(originalIndex, e.target.value)}
                    className="text-[9px] font-bold text-slate-700 dark:text-slate-200 bg-transparent border-none focus:outline-none cursor-pointer pr-1 leading-none appearance-none"
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
                  <span className="text-[7px] text-slate-400 pointer-events-none select-none -mt-0.5">▼</span>
                </div>
              )}
            </div>

            {/* Element Badges */}
            {petDetails && petDetails.types && petDetails.types.length > 0 && (
              <div className="flex gap-1 items-center flex-wrap">
                {petDetails.types.map(t => {
                  const badgeStyle = typeColorMap[t] || "bg-slate-50 text-slate-600 border-slate-200";
                  const iconUrl = getImagePath(`images/attributes/${t}.png`);
                  return (
                    <span key={t} className={`inline-flex items-center justify-center p-0.5 rounded-full border shrink-0 ${badgeStyle}`} title={t}>
                      <img src={iconUrl} alt={t} className="w-3.5 h-3.5 object-contain shrink-0" />
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Natures list */}
      <td className="p-2.5 align-middle text-center">
        <div className="flex flex-col gap-2 w-[180px] mx-auto">
          {/* Father Natures */}
          <div className="flex items-center gap-1 justify-center w-full">
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-1 py-0.5 rounded border border-blue-100 dark:border-blue-900/30 shrink-0 select-none">父</span>
            <div className="flex flex-col gap-1 w-full">
              {(pet.fatherNatures || []).map((nat, nIdx) => {
                const isLast = nIdx === (pet.fatherNatures || []).length - 1;
                return (
                  <div key={nIdx} className="flex items-center gap-1 justify-center w-full">
                    <Autocomplete
                      value={nat}
                      options={NATURE_OPTIONS}
                      placeholder="选择性格"
                      onChange={val => handleUpdateNature(originalIndex, "father", nIdx, val)}
                      className="w-28 text-center"
                      inputClassName="font-medium text-[11px] text-center text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-0.5 px-2 w-full focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/40 transition-all shadow-sm"
                    />

                    <div className="flex items-center gap-0.5 select-action-buttons w-10 shrink-0 action-buttons">
                      {(pet.fatherNatures || []).length > 1 && (
                        <button
                          onClick={() => handleRemoveNature(originalIndex, "father", nIdx)}
                          className="text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/35 p-0.5 rounded-full transition-colors"
                          title="移除性格"
                        >
                          <MinusCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isLast && (
                        <button
                          onClick={() => handleAddNature(originalIndex, "father")}
                          className="text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-950/35 p-0.5 rounded-full transition-colors"
                          title="新增性格属性"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mother Natures */}
          <div className="flex items-center gap-1 justify-center w-full">
            <span className="text-[11px] font-bold text-pink-650 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/20 px-1 py-0.5 rounded border border-pink-100 dark:border-pink-900/30 shrink-0 select-none">母</span>
            <div className="flex flex-col gap-1 w-full">
              {(pet.motherNatures || []).map((nat, nIdx) => {
                const isLast = nIdx === (pet.motherNatures || []).length - 1;
                return (
                  <div key={nIdx} className="flex items-center gap-1 justify-center w-full">
                    <Autocomplete
                      value={nat}
                      options={NATURE_OPTIONS}
                      placeholder="选择性格"
                      onChange={val => handleUpdateNature(originalIndex, "mother", nIdx, val)}
                      className="w-28 text-center"
                      inputClassName="font-medium text-[11px] text-center text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-0.5 px-2 w-full focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/40 transition-all shadow-sm"
                    />

                    <div className="flex items-center gap-0.5 select-action-buttons w-10 shrink-0 action-buttons">
                      {(pet.motherNatures || []).length > 1 && (
                        <button
                          onClick={() => handleRemoveNature(originalIndex, "mother", nIdx)}
                          className="text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/35 p-0.5 rounded-full transition-colors"
                          title="移除性格"
                        >
                          <MinusCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isLast && (
                        <button
                          onClick={() => handleAddNature(originalIndex, "mother")}
                          className="text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-950/35 p-0.5 rounded-full transition-colors"
                          title="新增性格属性"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </td>

      {/* Stats list */}
      <td className="p-2.5 align-middle text-center">
        {pet.hideStats ? (
          <div className="flex flex-col items-center justify-center py-2 px-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 w-[200px] mx-auto min-h-[64px] select-none">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">三围已隐藏</span>
            <button
              onClick={() => handleUpdateHideStats(originalIndex, false)}
              className="mt-1.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full shadow-sm transition-colors action-buttons"
            >
              显示并填写
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 w-[200px] mx-auto">
            {/* Father Stats */}
            <div className="flex items-center gap-1 justify-center w-full">
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-1 py-0.5 rounded border border-blue-100 dark:border-blue-900/30 shrink-0 select-none">父</span>
              <div className="flex gap-1 justify-center flex-1">
                {(pet.fatherStats || ["生命", "物攻", "速度"]).map((stat, sIdx) => {
                  return (
                    <div key={sIdx} className="relative w-14">
                      <select
                        value={stat}
                        onChange={e => handleUpdateStat(originalIndex, "father", sIdx, e.target.value)}
                        className={`appearance-none font-semibold text-[10px] text-center border rounded-full py-1 px-2 w-full focus:outline-none transition-colors ${getStatBadgeStyle(stat)}`}
                      >
                        {STATS_OPTIONS.map(opt => (
                          <option key={opt} value={opt} className="dark:bg-slate-800 dark:text-slate-200">{opt}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 opacity-70 dropdown-arrow text-current">
                        <svg className="fill-current h-2 w-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mother Stats */}
            <div className="flex items-center gap-1 justify-center w-full">
              <span className="text-[11px] font-bold text-pink-650 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/20 px-1 py-0.5 rounded border border-pink-100 dark:border-pink-900/30 shrink-0 select-none">母</span>
              <div className="flex gap-1 justify-center flex-1">
                {(pet.motherStats || ["生命", "物攻", "速度"]).map((stat, sIdx) => {
                  return (
                    <div key={sIdx} className="relative w-14">
                      <select
                        value={stat}
                        onChange={e => handleUpdateStat(originalIndex, "mother", sIdx, e.target.value)}
                        className={`appearance-none font-semibold text-[10px] text-center border rounded-full py-1 px-2 w-full focus:outline-none transition-colors ${getStatBadgeStyle(stat)}`}
                      >
                        {STATS_OPTIONS.map(opt => (
                          <option key={opt} value={opt} className="dark:bg-slate-800 dark:text-slate-200">{opt}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 opacity-70 dropdown-arrow text-current">
                        <svg className="fill-current h-2 w-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hide stats action */}
            <div className="flex justify-center mt-0.5">
              <button
                onClick={() => handleUpdateHideStats(originalIndex, true)}
                className="text-[10px] font-medium text-slate-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors action-buttons border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-900/30 bg-slate-50/50 hover:bg-indigo-50/50 dark:bg-slate-800 dark:hover:bg-indigo-950/30 px-2 py-0.5 rounded-full select-none cursor-pointer"
              >
                隐藏三围
              </button>
            </div>
          </div>
        )}
      </td>

      {/* Egg Groups list */}
      <td className="p-3 align-middle text-center font-display">
        <div className="flex flex-col gap-1.5 items-center justify-center w-[180px] mx-auto">
          {pet.groups.map((grp, gIdx) => {
            const isLast = gIdx === pet.groups.length - 1;
            const canAdd = isLast && pet.groups.length < 3;
            return (
              <div key={gIdx} className="flex items-center gap-1 justify-center w-full">
                <div className="relative w-32 shrink-0 font-sans">
                  <select
                    value={grp}
                    onChange={e => handleUpdateGroup(originalIndex, gIdx, e.target.value)}
                    className={`appearance-none text-xs font-semibold text-center border rounded-full py-1.5 px-4 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 dark:focus:ring-slate-700 transition-all ${getEggGroupStyle(grp)}`}
                  >
                    {EGG_GROUPS.map(opt => (
                      <option key={opt} value={opt} className="dark:bg-slate-800 dark:text-slate-200">{opt}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 dropdown-arrow">
                    <svg className="fill-current h-3 w-3 opacity-60" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                  </div>
                </div>

                <div className="flex items-center gap-1 select-action-buttons w-12 shrink-0 action-buttons">
                  {pet.groups.length > 1 && (
                    <button
                      onClick={() => handleRemoveGroup(originalIndex, gIdx)}
                      className="text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/35 p-0.5 rounded-full transition-colors"
                      title="移除蛋组属性"
                    >
                      <MinusCircle className="w-4 h-4" />
                    </button>
                  )}
                  {canAdd && (
                    <button
                      onClick={() => handleAddGroup(originalIndex)}
                      className="text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-950/35 p-0.5 rounded-full transition-colors"
                      title="添加至多3个蛋组"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </td>

      {/* Brand selector */}
      <td className="p-3 align-middle text-center">
        <div className="relative inline-block w-20">
          <select
            value={pet.brand}
            onChange={e => handleUpdateBrand(originalIndex, e.target.value)}
            className={`appearance-none text-xs font-semibold text-center border rounded-full px-2.5 py-1.5 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-300 dark:focus:ring-indigo-950 transition-colors ${getBrandStyle(pet.brand)}`}
          >
            {BRAND_OPTIONS.map(opt => (
              <option key={opt} value={opt} className="dark:bg-slate-800 dark:text-slate-200">{opt}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 dropdown-arrow">
            <svg className="fill-current h-3 w-3 opacity-60" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
          </div>
        </div>
      </td>

      {/* Nest Status selector */}
      <td className="p-3 align-middle text-center">
        <div className="relative inline-block w-36">
          <select
            value={pet.status}
            onChange={e => handleUpdateStatus(originalIndex, e.target.value)}
            className={`appearance-none text-xs font-semibold text-center border rounded-full px-4 py-1.5 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 dark:focus:ring-slate-700 transition-colors ${getStatusStyle(pet.status)}`}
          >
            {NEST_STATUS_OPTIONS.map(opt => (
              <option key={opt} value={opt} className="bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-semibold py-1">
                {opt}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-current dropdown-arrow">
            <svg className="fill-current h-3 w-3 opacity-80" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
          </div>
        </div>
      </td>

      {/* Limit / Speed indicator */}
      <td className="p-3 align-middle text-center">
        <div className="relative inline-block w-20">
          <select
            value={pet.isLimit}
            onChange={e => handleUpdateLimit(originalIndex, e.target.value)}
            className={`appearance-none text-xs font-semibold text-center border rounded-full px-2 py-1.5 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors ${pet.isLimit === "有极限蛋" ? "bg-amber-100 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-900/35" : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"}`}
          >
            {LIMIT_OPTIONS.map(opt => (
              <option key={opt} value={opt} className="dark:bg-slate-800 dark:text-slate-200">{opt}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dropdown-arrow">
            <svg className="fill-current h-3 w-3 opacity-60" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
          </div>
        </div>
      </td>
    </tr>
  );
}
