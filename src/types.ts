export interface EggPet {
  id?: string;
  sprite: string;
  fatherNatures: string[];
  motherNatures: string[];
  fatherStats: string[];
  motherStats: string[];
  groups: string[];
  brand: string;
  status: string;
  isLimit: string;
  is3V: string;
  hideStats?: boolean;
}

export const LIMIT_OPTIONS = ["非极限", "极限"];

export const THREE_V_OPTIONS = ["否", "3V", "3+2", "3+1", "2+2", "2+1", "1+1"];

export const NATURE_OPTIONS = [
  "聪明 (+魔攻 -物攻)", "专注 (+魔攻 -物防)", "偏执 (+魔攻 -魔防)", "冷静 (+魔攻 -速度)", "理性 (+魔攻 -生命)",
  "大胆 (+物攻 -物防)", "固执 (+物攻 -魔攻)", "调皮 (+物攻 -魔防)", "勇敢 (+物攻 -速度)", "逞强 (+物攻 -生命)",
  "警惕 (+魔防 -物攻)", "温顺 (+魔防 -物防)", "害羞 (+魔防 -魔攻)", "慎重 (+魔防 -速度)", "焦虑 (+魔防 -生命)",
  "稳重 (+物防 -物攻)", "天真 (+物防 -魔攻)", "懒散 (+物防 -魔防)", "悠闲 (+物防 -速度)", "坦率 (+物防 -生命)",
  "沉默 (+生命 -物攻)", "忧郁 (+生命 -物防)", "平和 (+生命 -魔攻)", "粗心 (+生命 -魔防)", "踏实 (+生命 -速度)",
  "胆小 (+速度 -物攻)", "急躁 (+速度 -物防)", "开朗 (+速度 -魔攻)", "莽撞 (+速度 -魔防)", "热情 (+速度 -生命)",
  "错性格"
];

export const STATS_OPTIONS = ["无", "生命", "物攻", "速度", "魔攻", "物防", "魔防"];

export const EGG_GROUPS = [
  "两栖组", "动物组", "大地组", "天空组", "妖精组", "巨灵组", "拟人组",
  "昆虫组", "机械组", "植物组", "海洋组", "软体组", "魔力组", "龙组"
];

export const BRAND_OPTIONS = ["大粗", "大婉", "小粗", "小婉", "单牌", "普通"];

export const NEST_STATUS_OPTIONS = [
  "有现蛋",
  "正在孵，可预约",
  "已撤窝，要提前换产线",
  "接投资"
];

export const INITIAL_TABLE_DATA: EggPet[] = [
  { 
    sprite: "喵喵", 
    fatherNatures: ["踏实 (+生命 -速度)"], 
    motherNatures: ["踏实 (+生命 -速度)"],
    fatherStats: ["生命", "物攻", "速度"],
    motherStats: ["生命", "物攻", "速度"],
    groups: ["动物组", "拟人组"], 
    brand: "大婉", 
    status: "有现蛋", 
    isLimit: "极限", 
    is3V: "3V" 
  }
];

declare global {
  interface Window {
    electronAPI?: {
      loadData: () => Promise<any>;
      saveData: (data: any) => Promise<{ success: boolean; path: string; error?: string }>;
      getDataPath: () => Promise<string>;
      selectSavePath: (currentData: any) => Promise<{ path: string; data: any } | null>;
    };
  }
}

