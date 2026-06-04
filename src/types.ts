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

export interface EggTrade {
  id: string;
  sprite: string;
  nature: string;
  brand: string;
  is3V: boolean;
  isLimit: boolean;
  tradeType: string; // '包公' | '包母' | '1换1'
  notes: string;
}

export const TRADE_TYPE_OPTIONS = ["包公", "包母", "1换1"];


export const LIMIT_OPTIONS = ["非极限", "极限"];

export const THREE_V_OPTIONS = ["否", "3V", "3+2", "3+1", "2+2", "2+1", "1+1"];

export const NATURE_OPTIONS = [
  // 物攻+
  "逞强 (+物攻 -生命)", "固执 (+物攻 -魔攻)", "大胆 (+物攻 -物防)", "调皮 (+物攻 -魔防)", "勇敢 (+物攻 -速度)",
  // 魔攻+
  "理性 (+魔攻 -生命)", "聪明 (+魔攻 -物攻)", "专注 (+魔攻 -物防)", "偏执 (+魔攻 -魔防)", "冷静 (+魔攻 -速度)",
  // 物防+
  "坦率 (+物防 -生命)", "稳重 (+物防 -物攻)", "天真 (+物防 -魔攻)", "懒散 (+物防 -魔防)", "悠闲 (+物防 -速度)",
  // 魔防+
  "焦虑 (+魔防 -生命)", "警惕 (+魔防 -物攻)", "害羞 (+魔防 -魔攻)", "温顺 (+魔防 -物防)", "慎重 (+魔防 -速度)",
  // 速度+
  "热情 (+速度 -生命)", "胆小 (+速度 -物攻)", "开朗 (+速度 -魔攻)", "急躁 (+速度 -物防)", "莽撞 (+速度 -魔防)",
  // 生命+
  "沉默 (+生命 -物攻)", "平和 (+生命 -魔攻)", "忧郁 (+生命 -物防)", "粗心 (+生命 -魔防)", "踏实 (+生命 -速度)",
  "错性格"
];

export const STATS_OPTIONS = ["无", "生命", "物攻", "速度", "魔攻", "物防", "魔防"];

export const EGG_GROUPS = [
  "两栖组", "动物组", "大地组", "天空组", "妖精组", "巨灵组", "拟人组",
  "昆虫组", "机械组", "植物组", "海洋组", "软体组", "魔力组", "龙组"
];

export const BRAND_OPTIONS = ["大粗", "大婉", "小粗", "小婉", "单牌", "无牌"];

export const NEST_STATUS_OPTIONS = [
  "有现蛋",
  "正在孵，可预约",
  "已撤窝，要提前换产线",
  "接投资"
];

export const INITIAL_TABLE_DATA: EggPet[] = [
  { 
    sprite: "喵喵", 
    fatherNatures: ["固执 (+物攻 -魔攻)"], 
    motherNatures: ["固执 (+物攻 -魔攻)"],
    fatherStats: ["生命", "物攻", "速度"],
    motherStats: ["生命", "物攻", "速度"],
    groups: ["动物组", "拟人组"], 
    brand: "大婉", 
    status: "有现蛋", 
    isLimit: "极限", 
    is3V: "3V" 
  }
];

export const cleanNature = (natureStr: string): string => {
  if (!natureStr) return "错性格";
  
  if (NATURE_OPTIONS.includes(natureStr)) {
    return natureStr;
  }

  const plusMatch = natureStr.match(/\+([^\s\-\)\(\+]+)/);
  const minusMatch = natureStr.match(/-([^\s\-\)\(\+]+)/);

  if (plusMatch && minusMatch) {
    const plusAttr = plusMatch[1];
    const minusAttr = minusMatch[1];

    const matched = NATURE_OPTIONS.find(opt => opt.includes(`+${plusAttr}`) && opt.includes(`-${minusAttr}`));
    if (matched) {
      return matched;
    }
  }

  // 洛克王国性格简称到全称的映射，处理老数据格式或用户简称输入的情况
  const rocoNatureMap: Record<string, string> = {
    // 物攻+
    "逞强": "逞强 (+物攻 -生命)",
    "固执": "固执 (+物攻 -魔攻)",
    "大胆": "大胆 (+物攻 -物防)",
    "调皮": "调皮 (+物攻 -魔防)",
    "勇敢": "勇敢 (+物攻 -速度)",
    // 魔攻+
    "理性": "理性 (+魔攻 -生命)",
    "聪明": "聪明 (+魔攻 -物攻)",
    "专注": "专注 (+魔攻 -物防)",
    "偏执": "偏执 (+魔攻 -魔防)",
    "冷静": "冷静 (+魔攻 -速度)",
    // 物防+
    "坦率": "坦率 (+物防 -生命)",
    "稳重": "稳重 (+物防 -物攻)",
    "天真": "天真 (+物防 -魔攻)",
    "懒散": "懒散 (+物防 -魔防)",
    "悠闲": "悠闲 (+物防 -速度)",
    // 魔防+
    "焦虑": "焦虑 (+魔防 -生命)",
    "警惕": "警惕 (+魔防 -物攻)",
    "害羞": "害羞 (+魔防 -魔攻)",
    "温顺": "温顺 (+魔防 -物防)",
    "慎重": "慎重 (+魔防 -速度)",
    // 速度+
    "热情": "热情 (+速度 -生命)",
    "胆小": "胆小 (+速度 -物攻)",
    "开朗": "开朗 (+速度 -魔攻)",
    "急躁": "急躁 (+速度 -物防)",
    "莽撞": "莽撞 (+速度 -魔防)",
    // 生命+
    "沉默": "沉默 (+生命 -物攻)",
    "平和": "平和 (+生命 -魔攻)",
    "忧郁": "忧郁 (+生命 -物防)",
    "粗心": "粗心 (+生命 -魔防)",
    "踏实": "踏实 (+生命 -速度)",
  };

  for (const name of Object.keys(rocoNatureMap)) {
    if (natureStr.includes(name)) {
      return rocoNatureMap[name];
    }
  }

  return "错性格";
};


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

