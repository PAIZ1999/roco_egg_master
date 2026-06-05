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
    "无": "bg-slate-50 text-slate-400 border-slate-200 line-through decoration-dotted font-normal",
    "生命": "bg-rose-50 text-rose-700 border-rose-200",
    "物攻": "bg-amber-50 text-amber-800 border-amber-200",
    "速度": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "魔攻": "bg-purple-50 text-purple-700 border-purple-200",
    "物防": "bg-blue-50 text-blue-700 border-blue-200",
    "魔防": "bg-cyan-50 text-cyan-700 border-cyan-200",
  };
  return colors[stat] || "bg-slate-50 text-slate-700 border-slate-200";
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
    backgroundColor: isDragging ? "rgba(243, 244, 246, 0.9)" : undefined,
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
      className={`hover:bg-slate-50/50 transition-colors group relative ${isDragging ? "shadow-md ring-2 ring-indigo-100" : ""}`}
    >
      {/* Drag handle column */}
      <td className="px-1 py-3 text-center align-middle drag-handle-column">
        <div
          {...attributes}
          {...listeners}
          className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-600 active:text-indigo-600 hover:bg-slate-100 rounded cursor-grab active:cursor-grabbing transition-colors drag-grip-handle"
          title="按住拖动排序"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      </td>

      {/* Name input + hovering delete */}
      <td className="p-3 relative align-middle">
        <div className="flex items-center gap-2 min-w-[170px] justify-start px-2 relative">
          {/* Avatar Container */}
          <div className="w-12 h-12 rounded-full border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative hover:[&_img]:scale-75 hover:[&_span]:scale-75 hover:[&_button]:opacity-100 hover:[&_button]:pointer-events-auto">
            {spriteUrl ? (
              <img src={spriteUrl} alt={spriteName} className="w-10 h-10 object-contain transition-transform duration-200" />
            ) : (
              <span className="text-sm text-slate-300 font-bold transition-transform duration-200">?</span>
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
                inputClassName="bg-transparent font-bold text-sm text-slate-800 placeholder:text-slate-300 w-full border-b-2 border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none pb-0.5 transition-colors text-left"
              />

              {/* Form selector dropdown for multi-form sprites in row */}
              {availableSprites.length > 1 && (
                <div className="bg-slate-100 hover:bg-slate-200 px-1 py-0.25 rounded shadow-3xs border border-slate-200 flex items-center transition-colors duration-150 action-buttons shrink-0 -ml-1">
                  <select
                    value={availableSprites.includes(pet.sprite) ? pet.sprite : (spriteFile ? spriteFile.slice(0, -4) : pet.sprite)}
                    onChange={(e) => handleUpdateSprite(originalIndex, e.target.value)}
                    className="text-[9px] font-bold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer pr-1 leading-none appearance-none"
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
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-1 py-0.5 rounded border border-blue-100 shrink-0 select-none">父</span>
            <div className="flex flex-col gap-1 w-full">
              {(pet.fatherNatures || []).map((nat, nIdx) => {
                const isLast = nIdx === (pet.fatherNatures || []).length - 1;
                return (
                  <div key={nIdx} className="flex items-center gap-1 justify-center w-full">
                    <Autocomplete
                      value={nat}
                      options={NATURE_OPTIONS}
                      placeholder="性格..."
                      onChange={val => handleUpdateNature(originalIndex, "father", nIdx, val)}
                      className="w-28 text-center"
                      inputClassName="font-medium text-[11px] text-center text-slate-700 bg-white border border-slate-200 rounded-lg py-0.5 px-2 w-full focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
                    />

                    <div className="flex items-center gap-0.5 select-action-buttons w-10 shrink-0 action-buttons">
                      {(pet.fatherNatures || []).length > 1 && (
                        <button
                          onClick={() => handleRemoveNature(originalIndex, "father", nIdx)}
                          className="text-rose-600 hover:bg-rose-100 p-0.5 rounded-full transition-colors"
                          title="移除性格"
                        >
                          <MinusCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isLast && (
                        <button
                          onClick={() => handleAddNature(originalIndex, "father")}
                          className="text-indigo-600 hover:bg-indigo-100 p-0.5 rounded-full transition-colors"
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
            <span className="text-[11px] font-bold text-pink-600 bg-pink-50 px-1 py-0.5 rounded border border-pink-100 shrink-0 select-none">母</span>
            <div className="flex flex-col gap-1 w-full">
              {(pet.motherNatures || []).map((nat, nIdx) => {
                const isLast = nIdx === (pet.motherNatures || []).length - 1;
                return (
                  <div key={nIdx} className="flex items-center gap-1 justify-center w-full">
                    <Autocomplete
                      value={nat}
                      options={NATURE_OPTIONS}
                      placeholder="性格..."
                      onChange={val => handleUpdateNature(originalIndex, "mother", nIdx, val)}
                      className="w-28 text-center"
                      inputClassName="font-medium text-[11px] text-center text-slate-700 bg-white border border-slate-200 rounded-lg py-0.5 px-2 w-full focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
                    />

                    <div className="flex items-center gap-0.5 select-action-buttons w-10 shrink-0 action-buttons">
                      {(pet.motherNatures || []).length > 1 && (
                        <button
                          onClick={() => handleRemoveNature(originalIndex, "mother", nIdx)}
                          className="text-rose-600 hover:bg-rose-100 p-0.5 rounded-full transition-colors"
                          title="移除性格"
                        >
                          <MinusCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isLast && (
                        <button
                          onClick={() => handleAddNature(originalIndex, "mother")}
                          className="text-indigo-600 hover:bg-indigo-100 p-0.5 rounded-full transition-colors"
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
          <div className="flex flex-col items-center justify-center py-2 px-3 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 w-[200px] mx-auto min-h-[64px] select-none">
            <span className="text-[11px] text-slate-400 font-medium">三围已隐藏</span>
            <button
              onClick={() => handleUpdateHideStats(originalIndex, false)}
              className="mt-1.5 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full shadow-sm transition-colors action-buttons"
            >
              显示并填写
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 w-[200px] mx-auto">
            {/* Father Stats */}
            <div className="flex items-center gap-1 justify-center w-full">
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-1 py-0.5 rounded border border-blue-100 shrink-0 select-none">父</span>
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
                          <option key={opt} value={opt}>{opt}</option>
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
              <span className="text-[11px] font-bold text-pink-600 bg-pink-50 px-1 py-0.5 rounded border border-pink-100 shrink-0 select-none">母</span>
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
                          <option key={opt} value={opt}>{opt}</option>
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
                className="text-[10px] font-medium text-slate-400 hover:text-indigo-600 transition-colors action-buttons border border-slate-200 hover:border-indigo-200 bg-slate-50/50 hover:bg-indigo-50/50 px-2 py-0.5 rounded-full select-none cursor-pointer"
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
                    className={`appearance-none text-xs font-semibold text-center border rounded-full py-1.5 px-4 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-300 transition-all ${getEggGroupStyle(grp)}`}
                  >
                    {EGG_GROUPS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
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
                      className="text-rose-600 hover:bg-rose-100 p-0.5 rounded-full transition-colors"
                      title="移除蛋组属性"
                    >
                      <MinusCircle className="w-4 h-4" />
                    </button>
                  )}
                  {canAdd && (
                    <button
                      onClick={() => handleAddGroup(originalIndex)}
                      className="text-indigo-600 hover:bg-indigo-100 p-0.5 rounded-full transition-colors"
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
            className={`appearance-none text-xs font-semibold text-center border rounded-full px-2.5 py-1.5 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-300 transition-colors ${getBrandStyle(pet.brand)}`}
          >
            {BRAND_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
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
            className={`appearance-none text-xs font-semibold text-center border rounded-full px-4 py-1.5 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition-colors ${getStatusStyle(pet.status)}`}
          >
            {NEST_STATUS_OPTIONS.map(opt => (
              <option key={opt} value={opt} className="bg-white text-slate-800 font-semibold py-1">
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
            className={`appearance-none text-xs font-semibold text-center border rounded-full px-2 py-1.5 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors ${pet.isLimit === "有极限蛋" ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-slate-50 text-slate-500 border-slate-200"}`}
          >
            {LIMIT_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
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
