import eggPetList from "../images/洛克王国_蛋组精灵表.json";
import spriteFiles from "./sprite_files.json";

export interface PetData {
  display_name: string;
  egg_group_names: string;
  family_chain: string;
  stage: number;
  type_name: string;
}

// Map from pet name to parsed information
export interface PetDetails {
  name: string;
  groups: string[];
  types: string[];
  familyChain: string;
  maxStageName: string;
}

const petDataMap: Record<string, PetDetails> = {};

eggPetList.forEach((item: any) => {
  const name = item.display_name;
  if (!name) return;

  const groups = item.egg_group_names 
    ? item.egg_group_names.split(",").map((g: string) => g.trim()).filter(Boolean) 
    : [];
  const types = item.type_name 
    ? item.type_name.split(",").map((t: string) => t.replace("元素精灵", "").trim()).filter(Boolean) 
    : [];
  const chain = item.family_chain || "";
  const chainParts = chain.split(" → ");
  const maxStageName = chainParts[chainParts.length - 1]?.trim() || name;

  if (!petDataMap[name]) {
    petDataMap[name] = {
      name,
      groups: [],
      types: [],
      familyChain: chain,
      maxStageName
    };
  }

  // Merge unique groups and types
  groups.forEach((g: string) => {
    if (!petDataMap[name].groups.includes(g)) {
      petDataMap[name].groups.push(g);
    }
  });
  types.forEach((t: string) => {
    if (!petDataMap[name].types.includes(t)) {
      petDataMap[name].types.push(t);
    }
  });
});

// All unique pet names for autocomplete
export const ALL_PET_NAMES = Object.keys(petDataMap).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));

/**
 * Returns pet details by name, or null if not found.
 */
export const getPetDetails = (name: string): PetDetails | null => {
  if (!name) return null;
  return petDataMap[name] || null;
};

/**
 * Gets the actual image filename in sprites/ directory for a given pet name.
 */
export const getSpriteFileName = (petName: string): string | null => {
  if (!petName) return null;
  
  // Try exact match first
  const exactMatch = petName + ".png";
  if (spriteFiles.includes(exactMatch)) {
    return exactMatch;
  }
  
  // Try prefix match (e.g. "喵喵" -> "喵喵_极夜的样子.png" or "喵喵_1.png")
  const prefixMatch = spriteFiles.find(file => file.startsWith(petName + "_") && file.endsWith(".png"));
  if (prefixMatch) {
    return prefixMatch;
  }
  
  // Try substring match
  const containsMatch = spriteFiles.find(file => file.includes(petName) && file.endsWith(".png"));
  if (containsMatch) {
    return containsMatch;
  }
  
  return null;
};

/**
 * Normalizes paths for development vs. production (packaged Electron App)
 */
export const getImagePath = (relPath: string): string => {
  if (window.location.protocol === "file:") {
    return `../${relPath}`;
  }
  return `./${relPath}`;
};

export const getEggGroupStyle = (groupName: string): string => {
  switch (groupName) {
    case "精灵蛋组":
      return "bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100 hover:border-teal-300";
    case "天空蛋组":
      return "bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100 hover:border-sky-300";
    case "陆地蛋组":
      return "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-105 hover:border-amber-305";
    case "神智蛋组":
      return "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300";
    case "动物蛋组":
      return "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 hover:border-rose-300";
    case "植物蛋组":
      return "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-105 hover:border-emerald-305";
    case "守护蛋组":
      return "bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100 hover:border-violet-300";
    case "不死蛋组":
      return "bg-slate-50 border-slate-205 text-slate-700 hover:bg-slate-105 hover:border-slate-305";
    default:
      return "bg-slate-50 border-slate-205 text-slate-600 hover:bg-slate-100";
  }
};

export const getStatusStyle = (status: string): string => {
  switch (status) {
    case "有现蛋":
      return "bg-amber-100 border-amber-300 text-amber-800 font-bold shadow-xs";
    case "正在孵，可预约":
      return "bg-sky-100 border-sky-300 text-sky-800 font-bold shadow-xs";
    case "接投资":
      return "bg-purple-100 border-purple-300 text-purple-800 font-bold shadow-xs";
    case "已撤窝，要提前换产线":
      return "bg-orange-100 border-orange-300 text-orange-850 font-bold shadow-xs";
    default:
      return "bg-slate-100 border-slate-250 text-slate-600 font-medium";
  }
};

export const getBrandStyle = (brand: string): string => {
  switch (brand) {
    case "大婉":
      return "bg-rose-100 border-rose-300 text-rose-800 font-bold";
    case "大粗":
      return "bg-amber-100 border-amber-300 text-amber-800 font-bold";
    case "单牌":
      return "bg-emerald-100 border-emerald-300 text-emerald-800 font-bold";
    case "小婉":
      return "bg-sky-100 border-sky-300 text-sky-800 font-bold";
    case "小粗":
      return "bg-purple-100 border-purple-300 text-purple-800 font-bold";
    case "单大块头":
      return "bg-slate-100 border-slate-300 text-slate-700 font-bold";
    default:
      return "bg-slate-50 border-slate-200 text-slate-500 font-medium";
  }
};

