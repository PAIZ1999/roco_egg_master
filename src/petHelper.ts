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

// 预处理进化链分组，以便推导分支进化和最大 stage 宠物
const familyGroups: Record<string, any[]> = {};
eggPetList.forEach((item: any) => {
  const chain = item.family_chain || "";
  if (!chain) return;
  if (!familyGroups[chain]) {
    familyGroups[chain] = [];
  }
  familyGroups[chain].push(item);
});

const chainMaxStageMap: Record<string, string[]> = {};
const chainMaxStageValueMap: Record<string, number> = {};

Object.entries(familyGroups).forEach(([chain, pets]) => {
  let maxStage = 0;
  pets.forEach(p => {
    if (p.stage > maxStage) {
      maxStage = p.stage;
    }
  });
  
  const maxStageNames: string[] = [];
  pets.forEach(p => {
    if (p.stage === maxStage && p.display_name) {
      if (!maxStageNames.includes(p.display_name)) {
        maxStageNames.push(p.display_name);
      }
    }
  });
  
  chainMaxStageMap[chain] = maxStageNames;
  chainMaxStageValueMap[chain] = maxStage;
});

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
  
  const maxStagePets = chainMaxStageMap[chain] || [];
  const maxStageVal = chainMaxStageValueMap[chain] || 0;
  
  let maxStageName = name;
  if (item.stage < maxStageVal) {
    // 低阶宠物：默认升级为进化链中排在最后的那个最高阶宠物
    const chainParts = chain.split(" → ").map(p => p.trim());
    const availableMaxPetsInChain = chainParts.filter(p => maxStagePets.includes(p));
    maxStageName = availableMaxPetsInChain[availableMaxPetsInChain.length - 1] || maxStagePets[0] || name;
  } else {
    // 已是最高阶形态本身，不需要升级
    maxStageName = name;
  }

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
 * Extracts the base pet name by stripping any trailing variation suffixes starting with "_".
 */
export const getBasePetName = (name: string): string => {
  if (!name) return "";
  return name.split("_")[0];
};

/**
 * Returns pet details by name, or null if not found. Supports multi-form suffixes.
 */
export const getPetDetails = (name: string): PetDetails | null => {
  if (!name) return null;
  const baseName = getBasePetName(name);
  return petDataMap[baseName] || null;
};

/**
 * Gets all available sprites (forms) for a pet name.
 */
export const getAvailableSprites = (petName: string): string[] => {
  if (!petName) return [];
  const baseName = getBasePetName(petName);
  
  const getSinglePetSprites = (singleName: string): string[] => {
    const exactFile = singleName + ".png";
    const results: string[] = [];
    if (spriteFiles.includes(exactFile)) {
      results.push(singleName);
    }
    spriteFiles.forEach(file => {
      if (file.startsWith(singleName + "_") && file.endsWith(".png")) {
        const formName = file.slice(0, -4);
        if (!results.includes(formName)) {
          results.push(formName);
        }
      }
    });
    return results;
  };

  const selfSprites = getSinglePetSprites(baseName);
  
  const details = getPetDetails(baseName);
  if (details && details.familyChain) {
    const chain = details.familyChain;
    const maxStagePets = chainMaxStageMap[chain] || [];
    
    // 如果当前宠物本身就是进化链上的最高阶之一，且该进化链有多个平行最高阶
    if (maxStagePets.includes(baseName) && maxStagePets.length > 1) {
      const combinedResults = [...selfSprites];
      maxStagePets.forEach(otherPet => {
        if (otherPet !== baseName) {
          const otherSprites = getSinglePetSprites(otherPet);
          otherSprites.forEach(sprite => {
            if (!combinedResults.includes(sprite)) {
              combinedResults.push(sprite);
            }
          });
        }
      });
      return combinedResults;
    }
  }
  
  return selfSprites;
};

/**
 * Gets the actual image filename in sprites/ directory for a given pet name.
 */
export const getSpriteFileName = (petName: string): string | null => {
  if (!petName) return null;
  
  // 1. Try exact match first (e.g. "冬羽雀_夏天的样子" -> "冬羽雀_夏天的样子.png")
  const exactMatch = petName + ".png";
  if (spriteFiles.includes(exactMatch)) {
    return exactMatch;
  }
  
  // 2. Try prefix match
  const prefixMatch = spriteFiles.find(file => file.startsWith(petName + "_") && file.endsWith(".png"));
  if (prefixMatch) {
    return prefixMatch;
  }
  
  // 3. Try base name exact match
  const baseName = getBasePetName(petName);
  const baseExactMatch = baseName + ".png";
  if (spriteFiles.includes(baseExactMatch)) {
    return baseExactMatch;
  }
  
  // 4. Try base name prefix match
  const basePrefixMatch = spriteFiles.find(file => file.startsWith(baseName + "_") && file.endsWith(".png"));
  if (basePrefixMatch) {
    return basePrefixMatch;
  }
  
  // 5. Try substring match
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
    case "普通":
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

/**
 * Gets a user-friendly display name for a sprite form option.
 * If the pet has parallel branch evolutions, return clean branch names (e.g. "翠顶", "黑羽", "秩序", "混乱").
 * Otherwise, return the suffix after "_" or "默认".
 */
export const getSpriteFormDisplayName = (spriteOption: string): string => {
  if (!spriteOption) return "默认";
  
  // 针对特定分支进化的特殊处理
  if (spriteOption.startsWith("翠顶夫人")) return "翠顶" + (spriteOption.includes("_") ? "_" + spriteOption.split("_")[1] : "");
  if (spriteOption.startsWith("黑羽夫人")) return "黑羽" + (spriteOption.includes("_") ? "_" + spriteOption.split("_")[1] : "");
  if (spriteOption.startsWith("秩序鱿墨")) return "秩序" + (spriteOption.includes("_") ? "_" + spriteOption.split("_")[1] : "");
  if (spriteOption.startsWith("混乱鱿彩")) return "混乱" + (spriteOption.includes("_") ? "_" + spriteOption.split("_")[1] : "");
  
  // 原有的后缀显示逻辑
  return spriteOption.includes("_") ? spriteOption.split("_")[1] : "默认";
};


