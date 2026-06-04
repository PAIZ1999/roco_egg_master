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
