import petsData from "./pets_data.json";
import spriteFiles from "./sprite_files.json";
import petsRaceData from "./pets_race_data.json";
import { EggData } from "./types";

// 深拷贝以纠正原始 JSON 中错误录入的小数点放大及蛋组信息 (如月亮砣 ID 238)
const cleanedPetsData = JSON.parse(JSON.stringify(petsData));
const ylt = cleanedPetsData.find((p: any) => p.id === 238 || p.name === "月亮砣");
if (ylt && ylt.egg_data) {
  ylt.egg_data.egg_groups = ["海洋组"];
  if (ylt.egg_data.weight_max > 1000) {
    ylt.egg_data.weight_max = ylt.egg_data.weight_max / 10000;
  }
  if (ylt.egg_data.giant_weight_line > 1000) {
    ylt.egg_data.giant_weight_line = ylt.egg_data.giant_weight_line / 10000;
  }
}

// 种族值 Map 用于装载形态
const petsRaceMap: Record<string, any> = {};
petsRaceData.forEach((item: any) => {
  if (item.name) {
    petsRaceMap[item.name.trim()] = item;
  }
});

// 装载从 pets_race_data.json 中提取出的多形态/变体形态进入 cleanedPetsData
const allRaceKeys = Object.keys(petsRaceMap);
let tempIdCounter = 10000;
for (const formName of allRaceKeys) {
  if (formName.includes('（') || formName.includes('(')) {
    const mainName = formName.split(/[（(]/)[0].trim();
    
    let parentPet = cleanedPetsData.find((p: any) => p.name === mainName);
    let baseForm: any = null;
    
    if (!parentPet) {
      parentPet = cleanedPetsData.find((p: any) => p.forms && p.forms.some((f: any) => f.name === mainName));
      if (parentPet) {
        baseForm = parentPet.forms.find((f: any) => f.name === mainName);
      }
    } else {
      baseForm = parentPet.forms && parentPet.forms[0] ? parentPet.forms[0] : null;
    }

    if (!parentPet) {
      parentPet = {
        id: tempIdCounter++,
        name: mainName,
        types: ["普通"],
        evolution_chain: [mainName],
        forms: []
      };
      cleanedPetsData.push(parentPet);
    }

    if (parentPet) {
      if (!parentPet.forms) {
        parentPet.forms = [];
      }
      const hasForm = parentPet.forms.some((f: any) => f.name === formName);
      if (!hasForm) {
        const raceItem = petsRaceMap[formName];
        const newForm = {
          name: formName,
          types: (raceItem && raceItem.type_name) ? [raceItem.type_name] : (baseForm ? [...baseForm.types] : (parentPet.types ? [...parentPet.types] : ["普通"])),
          egg_groups: baseForm && baseForm.egg_groups ? [...baseForm.egg_groups] : (parentPet.egg_data && parentPet.egg_data.egg_groups ? [...parentPet.egg_data.egg_groups] : ["无法孵蛋"]),
          height_min: baseForm ? baseForm.height_min : (parentPet.egg_data ? parentPet.egg_data.height_min : null),
          height_max: baseForm ? baseForm.height_max : (parentPet.egg_data ? parentPet.egg_data.height_max : null),
          weight_min: baseForm ? baseForm.weight_min : (parentPet.egg_data ? parentPet.egg_data.weight_min : null),
          weight_max: baseForm ? baseForm.weight_max : (parentPet.egg_data ? parentPet.egg_data.weight_max : null),
          giant_weight_line: baseForm ? baseForm.giant_weight_line : (parentPet.egg_data ? parentPet.egg_data.giant_weight_line : null),
          tiny_weight_line: baseForm ? baseForm.tiny_weight_line : (parentPet.egg_data ? parentPet.egg_data.tiny_weight_line : null)
        };
        parentPet.forms.push(newForm);
      }
    }
  }
}

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

// 预定义平行最高进化阶段（分支进化）
const PARALLEL_MAX_STAGES = ["翠顶夫人", "黑羽夫人", "秩序鱿墨", "混乱鱿彩"];

// 全局的 chainMaxStageMap 映射
export const chainMaxStageMap: Record<string, string[]> = {
  "乖乖鹄 → 蓝珠天鹅 → 翠顶夫人 → 黑羽夫人": ["翠顶夫人", "黑羽夫人"],
  "墨鱿士 → 混乱鱿彩 → 秩序鱿墨": ["混乱鱿彩", "秩序鱿墨"]
};

// 清洗蛋组里的脏数据，如月亮砣包含“海洋组身高：...”
const cleanEggGroups = (groups: string[]): string[] => {
  return groups.map(g => g.includes("海洋组") ? "海洋组" : g);
};

// 预处理 cleanedPetsData，提取所有的 forms 并初始化 petDataMap
cleanedPetsData.forEach((pet: any) => {
  const chainStr = pet.evolution_chain.join(" → ");
  const lastInChain = pet.evolution_chain[pet.evolution_chain.length - 1];

  pet.forms.forEach((form: any) => {
    const name = form.name;
    if (!name) return;

    // 推导 maxStageName
    let maxStageName = name;
    if (PARALLEL_MAX_STAGES.includes(name)) {
      maxStageName = name;
    } else if (name === lastInChain) {
      maxStageName = name;
    } else {
      // 默认升级为进化链中排在最后的那个高阶宠物
      maxStageName = lastInChain || name;
    }

    const groups = cleanEggGroups(form.egg_groups || []);
    const types = form.types || [];

    if (!petDataMap[name]) {
      petDataMap[name] = {
        name,
        groups,
        types,
        familyChain: chainStr,
        maxStageName
      };
    } else {
      // 合并唯一组和系别
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
 * Helper to find precise matching form from cleanedPetsData
 */
const findForm = (spriteName: string): any => {
  if (!spriteName) return null;
  const cleanName = spriteName.replace(/[（(]/g, "_").replace(/[）)]/g, "");
  const bracketName = spriteName.includes("_") 
    ? `${spriteName.split("_")[0]}（${spriteName.split("_")[1]}）` 
    : spriteName;

  for (const pet of cleanedPetsData) {
    let form = pet.forms.find((f: any) => 
      f.name === spriteName || 
      f.name === cleanName || 
      f.name === bracketName
    );
    if (form) return form;
  }
  
  const baseName = getBasePetName(spriteName);
  for (const pet of cleanedPetsData) {
    let form = pet.forms.find((f: any) => f.name === baseName);
    if (form) return form;
  }
  return null;
};

/**
 * Returns pet details by name, or null if not found. Supports multi-form suffixes.
 */
export const getPetDetails = (name: string): PetDetails | null => {
  if (!name) return null;
  
  if (petDataMap[name]) return petDataMap[name];
  
  const cleanName = name.replace(/[（(]/g, "_").replace(/[）)]/g, "");
  if (petDataMap[cleanName]) return petDataMap[cleanName];

  const bracketName = name.includes("_") 
    ? `${name.split("_")[0]}（${name.split("_")[1]}）` 
    : name;
  if (petDataMap[bracketName]) return petDataMap[bracketName];

  const baseName = getBasePetName(name);
  return petDataMap[baseName] || null;
};

/**
 * 获取精灵的标准身高和体重范围
 * 支持带有下划线后缀的多形态智能匹配
 */
export const getPetGuideSize = (spriteName: string): { height: string; weight: string } | null => {
  const matchedForm = findForm(spriteName);
  if (!matchedForm) return null;

  const heightStr = matchedForm.height_min === matchedForm.height_max
    ? `${matchedForm.height_min}`
    : `${matchedForm.height_min}~${matchedForm.height_max}`;
  const weightStr = matchedForm.weight_min === matchedForm.weight_max
    ? `${matchedForm.weight_min}`
    : `${matchedForm.weight_min}~${matchedForm.weight_max}`;

  return {
    height: heightStr,
    weight: weightStr
  };
};

export interface SizeThresholds {
  minHeight: number;
  maxHeight: number;
  minWeight: number;
  maxWeight: number;
  giantWeightLine: number;
  tinyWeightLine: number;
}

/**
 * 计算精灵身高体重的临界值和大块头/小不点及格线
 */
export const getPetSizeThresholds = (spriteName: string): SizeThresholds | null => {
  const matchedForm = findForm(spriteName);
  if (!matchedForm) return null;

  return {
    minHeight: matchedForm.height_min,
    maxHeight: matchedForm.height_max,
    minWeight: matchedForm.weight_min,
    maxWeight: matchedForm.weight_max,
    giantWeightLine: matchedForm.giant_weight_line,
    tinyWeightLine: matchedForm.tiny_weight_line
  };
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
  const baseName = getBasePetName(petName);
  
  // 转换括号为下划线以兼容 regional forms (如 "鸭吉吉（蓬松的样子）" -> "鸭吉吉_蓬松的样子")
  const cleanName = petName
    .replace(/[（(]/g, "_")
    .replace(/[）)]/g, "");

  // 1. Try exact match (e.g. "冬羽雀_夏天的样子" -> "冬羽雀_夏天的样子.png")
  const exactMatch = cleanName + ".png";
  if (spriteFiles.includes(exactMatch)) {
    return exactMatch;
  }

  // 2. Try prefix match (e.g. "冬羽雀_夏天的样子" -> "冬羽雀_夏天的样子.png")
  const prefixMatches = spriteFiles.filter(file => file.startsWith(petName + "_") && file.endsWith(".png"));
  if (prefixMatches.length > 0) {
    const originalMatch = prefixMatches.find(file => 
      file.includes("本来的样子") || 
      file.includes("平常的样子") ||
      (baseName === "鸭吉吉" && file.includes("蓬松的样子"))
    );
    if (originalMatch) {
      return originalMatch;
    }
    return prefixMatches[0];
  }
  
  // 3. Try base name exact match
  const baseExactMatch = baseName + ".png";
  if (spriteFiles.includes(baseExactMatch)) {
    return baseExactMatch;
  }
  
  // 4. Try base name prefix match
  const basePrefixMatches = spriteFiles.filter(file => file.startsWith(baseName + "_") && file.endsWith(".png"));
  if (basePrefixMatches.length > 0) {
    const originalMatch = basePrefixMatches.find(file => 
      file.includes("本来的样子") || 
      file.includes("平常的样子") ||
      (baseName === "鸭吉吉" && file.includes("蓬松的样子"))
    );
    if (originalMatch) {
      return originalMatch;
    }
    return basePrefixMatches[0];
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
 * Images are at dist/images/, so we always use ./ relative path.
 * vite base: './' ensures relative paths work in both dev and packaged mode.
 */
export const getImagePath = (relPath: string): string => {
  return `./${relPath}`;
};

export const getEggGroupStyle = (groupName: string): string => {
  if (!groupName) return "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800";
  
  let cleanName = groupName;
  if (cleanName.endsWith("蛋组")) {
    cleanName = cleanName.slice(0, -2);
  }
  if (cleanName.endsWith("组")) {
    cleanName = cleanName.slice(0, -1);
  }
  if (cleanName === "大地" || cleanName === "陆地") {
    cleanName = "大地";
  }

  switch (cleanName) {
    case "两栖":
      return "bg-cyan-50 dark:bg-cyan-950 border-cyan-200 dark:border-cyan-900 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/80 hover:border-cyan-300 dark:hover:border-cyan-800";
    case "动物":
      return "bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/80 hover:border-rose-300 dark:hover:border-rose-800";
    case "大地":
      return "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/80 hover:border-amber-300 dark:hover:border-amber-800";
    case "天空":
      return "bg-sky-50 dark:bg-sky-950 border-sky-200 dark:border-sky-900 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/80 hover:border-sky-300 dark:hover:border-sky-800";
    case "妖精":
      return "bg-pink-50 dark:bg-pink-950 border-pink-200 dark:border-pink-900 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-900/80 hover:border-pink-300 dark:hover:border-pink-800";
    case "巨灵":
      return "bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 hover:border-indigo-300 dark:hover:border-indigo-800";
    case "拟人":
      return "bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-900 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/80 hover:border-purple-300 dark:hover:border-purple-800";
    case "昆虫":
      return "bg-lime-50 dark:bg-lime-950 border-lime-200 dark:border-lime-900 text-lime-700 dark:text-lime-300 hover:bg-lime-100 dark:hover:bg-lime-900/80 hover:border-lime-300 dark:hover:border-lime-800";
    case "机械":
      return "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:border-zinc-350 dark:hover:border-zinc-650";
    case "植物":
      return "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 hover:border-emerald-300 dark:hover:border-emerald-800";
    case "海洋":
      return "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/80 hover:border-blue-300 dark:hover:border-blue-800";
    case "软体":
      return "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/80 hover:border-red-300 dark:hover:border-red-800";
    case "魔力":
      return "bg-violet-50 dark:bg-violet-950 border-violet-200 dark:border-violet-900 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/80 hover:border-violet-300 dark:hover:border-violet-800";
    case "龙":
      return "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-900 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/80 hover:border-orange-300 dark:hover:border-orange-800";
    case "精灵":
    case "守护":
      return "bg-teal-50 dark:bg-teal-950 border-teal-200 dark:border-teal-900 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/80 hover:border-teal-300 dark:hover:border-teal-800";
    case "不死":
      return "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600";
    default:
      return "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800";
  }
};

export const getStatusStyle = (status: string): string => {
  switch (status) {
    case "有现蛋":
      return "bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-900 text-amber-800 dark:text-amber-300 font-bold shadow-xs";
    case "正在孵，可预约":
      return "bg-sky-100 dark:bg-sky-950 border-sky-300 dark:border-sky-900 text-sky-800 dark:text-sky-300 font-bold shadow-xs";
    case "接投资":
      return "bg-purple-100 dark:bg-violet-950 border-purple-300 dark:border-violet-900 text-purple-800 dark:text-violet-300 font-bold shadow-xs";
    case "已撤窝":
      return "bg-orange-100 dark:bg-orange-950 border-orange-300 dark:border-orange-900 text-orange-900 dark:text-orange-300 font-bold shadow-xs";
    default:
      return "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium";
  }
};

export const getBrandStyle = (brand: string): string => {
  switch (brand) {
    case "大婉":
      return "bg-rose-100 dark:bg-rose-950 border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-300 font-bold";
    case "大粗":
      return "bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-900 text-amber-800 dark:text-amber-300 font-bold";
    case "普通":
      return "bg-emerald-100 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 font-bold";
    case "小婉":
      return "bg-sky-100 dark:bg-sky-950 border-sky-300 dark:border-sky-900 text-sky-800 dark:text-sky-300 font-bold";
    case "小粗":
      return "bg-purple-100 dark:bg-purple-950 border-purple-300 dark:border-purple-900 text-purple-800 dark:text-purple-300 font-bold";
    case "单大块头":
      return "bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold";
    case "单粗嗓门":
      return "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-900 text-orange-700 dark:text-orange-300 font-bold";
    case "单婉转声":
      return "bg-pink-50 dark:bg-pink-950 border-pink-200 dark:border-pink-900 text-pink-700 dark:text-pink-300 font-bold";
    case "单小不点":
      return "bg-cyan-50 dark:bg-cyan-950 border-cyan-200 dark:border-cyan-900 text-cyan-700 dark:text-cyan-300 font-bold";
    case "概率大粗":
      return "bg-amber-50 dark:bg-amber-950 border-amber-400 dark:border-amber-900 text-amber-800 dark:text-amber-300 font-extrabold border-dashed";
    case "概率大婉":
      return "bg-rose-50 dark:bg-rose-950 border-rose-400 dark:border-rose-900 text-rose-800 dark:text-rose-300 font-extrabold border-dashed";
    case "概率大块头":
      return "bg-slate-50 dark:bg-slate-900 border-slate-400 dark:border-slate-700 text-slate-800 dark:text-slate-300 font-extrabold border-dashed";
    case "概率小粗":
      return "bg-purple-50 dark:bg-purple-950 border-purple-400 dark:border-purple-900 text-purple-800 dark:text-purple-300 font-extrabold border-dashed";
    case "概率小婉":
      return "bg-sky-50 dark:bg-sky-950 border-sky-400 dark:border-sky-900 text-sky-800 dark:text-sky-300 font-extrabold border-dashed";
    case "概率小不点":
      return "bg-cyan-50 dark:bg-cyan-950 border-cyan-400 dark:border-cyan-900 text-cyan-800 dark:text-cyan-300 font-extrabold border-dashed";
    default:
      return "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-medium";
  }
};

export const getStatBadgeStyle = (stat: string): string => {
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

export interface EggConfig {
  pet_id: number;
  name: string;
  weight_low: number;
  weight_high: number;
  height_low: number;
  height_high: number;
  hatch_data: number;
}

/**
 * 获取精灵蛋的标准配置
 */
export const getEggConfig = (petName: string): EggConfig | null => {
  if (!petName) return null;
  const baseName = getBasePetName(petName);
  
  const matchedPet = cleanedPetsData.find((p: any) => p.name === baseName || p.evolution_chain.includes(baseName));
  if (!matchedPet || !matchedPet.egg_data) return null;

  const egg = matchedPet.egg_data;
  return {
    pet_id: matchedPet.id,
    name: matchedPet.name,
    weight_low: egg.weight_min * 1000,
    weight_high: egg.weight_max * 1000,
    height_low: egg.height_min * 100, // 还原为厘米
    height_high: egg.height_max * 100,
    hatch_data: 0
  };
};

export interface EggSizeThresholds {
  minHeight: number; // in meters
  maxHeight: number; // in meters
  minWeight: number; // in kg
  maxWeight: number; // in kg
  giantWeightLine: number;
  tinyWeightLine: number;
}

/**
 * 计算精灵蛋身高体重的临界值和大块头/小不点及格线
 */
export const getEggSizeThresholds = (petName: string): EggSizeThresholds | null => {
  if (!petName) return null;
  const baseName = getBasePetName(petName);

  const matchedPet = cleanedPetsData.find((p: any) => p.name === baseName || p.evolution_chain.includes(baseName));
  if (!matchedPet || !matchedPet.egg_data) return null;

  const egg = matchedPet.egg_data;
  return {
    minHeight: egg.height_min,
    maxHeight: egg.height_max,
    minWeight: egg.weight_min,
    maxWeight: egg.weight_max,
    giantWeightLine: egg.giant_weight_line,
    tinyWeightLine: egg.tiny_weight_line
  };
};

export const formatHatchTime = (seconds: number): string => {
  if (!seconds) return "未知时间";
  const hours = seconds / 3600;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}天${remainingHours}小时` : `${days}天`;
  }
  return `${hours}小时`;
};

export const isEgg3V = (egg: EggData): boolean => {
  const f = egg.fatherStats || ["无", "无", "无"];
  const m = egg.motherStats || ["无", "无", "无"];
  if (f.includes("无") || m.includes("无")) return false;
  const fSorted = [...f].sort();
  const mSorted = [...m].sort();
  return fSorted.every((v, idx) => v === mSorted[idx]);
};

export const getEggStatusType = (egg: EggData) => {
  const thresholds = getEggSizeThresholds(egg.sprite);
  if (!thresholds || !egg.eggSize || !egg.eggWeight) return "普通";
  const sizeVal = parseFloat(egg.eggSize);
  const weightVal = parseFloat(egg.eggWeight);
  if (isNaN(sizeVal) || isNaN(weightVal)) return "普通";

  const isGiantBrand = ["大粗", "大婉", "单大块头"].includes(egg.brand);
  const isTinyBrand = ["小粗", "小婉", "单小不点"].includes(egg.brand);

  if (isGiantBrand) {
    if (sizeVal >= thresholds.maxHeight && weightVal >= thresholds.maxWeight) {
      return "极限大";
    }
  } else if (isTinyBrand) {
    if (sizeVal <= thresholds.minHeight && weightVal <= thresholds.minWeight) {
      return "极限小";
    }
  } else {
    if (sizeVal >= thresholds.maxHeight && weightVal >= thresholds.giantWeightLine) {
      return "大块头达标";
    }
    if (sizeVal <= thresholds.minHeight && weightVal <= thresholds.tinyWeightLine) {
      return "小不点达标";
    }
    const x = Math.abs(thresholds.giantWeightLine - weightVal);
    const y = Math.abs(thresholds.tinyWeightLine - weightVal);
    if (x <= y) {
      const maxDiff = thresholds.giantWeightLine * 0.10;
      if (weightVal < thresholds.giantWeightLine && x <= maxDiff) {
        return "大块头临界";
      }
    } else {
      const maxDiff = thresholds.tinyWeightLine * 0.10;
      if (weightVal > thresholds.tinyWeightLine && y <= maxDiff) {
        return "小不点临界";
      }
    }
  }
  return "普通";
};

/**
 * 获取该宠物的最低进化形态名称，若有形态后缀则自动保留后缀
 */
export const getLowestStageName = (petName: string): string => {
  if (!petName) return "";
  const parts = petName.split("_");
  const baseName = parts[0];
  const suffix = parts[1] ? `_${parts[1]}` : "";
  
  const details = getPetDetails(baseName);
  if (details && details.familyChain) {
    const chainParts = details.familyChain.split(" → ").map(p => p.trim());
    if (chainParts.length > 0 && chainParts[0]) {
      return `${chainParts[0]}${suffix}`;
    }
  }
  return petName;
};




