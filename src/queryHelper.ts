import { pinyin } from "pinyin-pro";
import eggChartDataRaw from "./egg_chart_data.json";
import petsDataRaw from "./pets_data.json";
import petsRaceData from "./pets_race_data.json";
import spriteFilesRaw from "./sprite_files.json";
import { getSpriteFileName } from "./petHelper";

const spriteFiles = spriteFilesRaw as string[];


// 类型定义
export interface PetRaceStat {
  sum: number;
  stats: {
    hp: number;
    speed: number;
    atk: number;
    def: number;
    sp_atk: number;
    sp_def: number;
  };
}

export interface QueryPetForm {
  name: string;
  types: string[];
  egg_groups: string[];
  height_min: number | null;
  height_max: number | null;
  weight_min: number | null;
  weight_max: number | null;
  giant_weight_line: number | null;
  tiny_weight_line: number | null;
  race: PetRaceStat | null;
}

export interface QueryPetResult {
  id: number;
  name: string;
  types: string[];
  evolution_chain: any[];
  currentForm: QueryPetForm;
  forms: any[];
  egg_data: any | null;
  avatarPath: string | null;
  avatars: Array<{ styleName: string; absolutePath: string }>;
}

export interface PredictedEggResult {
  id: number;
  name: string;
  types: string[];
  egg_groups: string[];
  height_min: number;
  height_max: number;
  weight_min: number;
  weight_max: number;
  empirical_box_real: number[];
  giant_weight_line: number;
  tiny_weight_line: number;
  avatarPath: string | null;
  sizeTag: string;
  probability: string;
}

const eggChartData = eggChartDataRaw as Record<string, any>;

// 深拷贝并清洗 petsDataRaw
const petsData: any[] = JSON.parse(JSON.stringify(petsDataRaw));
const ylt = petsData.find((p: any) => p.id === 238 || p.name === "月亮砣");
if (ylt && ylt.egg_data) {
  ylt.egg_data.egg_groups = ["海洋组"];
  if (ylt.egg_data.weight_max > 1000) {
    ylt.egg_data.weight_max = ylt.egg_data.weight_max / 10000;
  }
  if (ylt.egg_data.giant_weight_line > 1000) {
    ylt.egg_data.giant_weight_line = ylt.egg_data.giant_weight_line / 10000;
  }
}

// 种族值 Map
export const petsRaceMap: Record<string, any> = {};
petsRaceData.forEach((item: any) => {
  if (item.name) {
    petsRaceMap[item.name.trim()] = item;
  }
});

// 常数与哈希表
const precomputedChartData: Record<string, any> = {};
const eggGroupMap: Record<string, string> = {};

function precomputeChart() {
  const transform = (h: number, w: number) => {
    const x = 1.9578174 * Math.log(h) + 2.563638;
    const y = 0.549724 * Math.log(w) - 0.9431053;
    return { x, y };
  };

  const r = 0.96;
  for (const name of Object.keys(eggChartData)) {
    const item = eggChartData[name];
    
    // 预计算特征中心坐标
    const mu = transform(item.s_mean, item.w_mean);

    // 预计算特征边界坐标并求出标准差
    const min_pt = transform(item.s_min, item.w_min);
    const max_pt = transform(item.s_max, item.w_max);
    
    const sig_x = Math.max((max_pt.x - min_pt.x) / 5, 0.02);
    const sig_y = Math.max((max_pt.y - min_pt.y) / 5, 0.02);

    // 预计算物理硬排除边界 (理论区间扩展 15%)
    const t_s_min = item.theory_box_real[0] * 0.85;
    const t_s_max = item.theory_box_real[1] * 1.15;
    const t_w_min = item.theory_box_real[2] * 0.85;
    const t_w_max = item.theory_box_real[3] * 1.15;

    // 自动高精度反推理论大块头与小不点判定线 (正态分布2%与98%分位线)
    const w_theory_min = item.theory_box_real[2];
    const w_theory_max = item.theory_box_real[3];
    const tinyLine = w_theory_min + (w_theory_max - w_theory_min) * 0.02;
    const giantLine = w_theory_min + (w_theory_max - w_theory_min) * 0.98;

    // 预计算对数似然概率密度的常数部分: -ln(sig_x * sig_y * sqrt(1 - r^2))
    const const_term = -Math.log(sig_x * sig_y * Math.sqrt(1 - r * r));

    precomputedChartData[name] = {
      mu_x: mu.x,
      mu_y: mu.y,
      sig_x,
      sig_y,
      const_term,
      t_s_min,
      t_s_max,
      t_w_min,
      t_w_max,
      tiny_weight_line: tinyLine,
      giant_weight_line: giantLine,
      is_rideable: item.is_rideable || false,
      theory_box_real: item.theory_box_real,
      empirical_box_real: item.empirical_box_real
    };
  }
}

function getPinyinInfo(text: string) {
  const cleanText = text.replace(/[^\u4e00-\u9fa5a-zA-Z]/g, '');
  const full = pinyin(cleanText, { toneType: 'none', type: 'array' }).join('').toLowerCase();
  const abbr = pinyin(cleanText, { pattern: 'first', toneType: 'none', type: 'array' }).join('').toLowerCase();
  return { full, abbr };
}

function initEggGroupMap() {
  const VALID_EGG_GROUPS = [
    '动物组', '拟人组', '巨灵组', '魔力组', '天空组', '两栖组', '植物组',
    '大地组', '妖精组', '昆虫组', '软体组', '海洋组', '机械组', '龙组', '无法孵蛋'
  ];
  
  VALID_EGG_GROUPS.forEach(fullName => {
    const baseName = fullName.endsWith('组') ? fullName.slice(0, -1) : fullName;
    
    // 映射中文全名与简称
    eggGroupMap[fullName.toLowerCase()] = fullName;
    eggGroupMap[baseName.toLowerCase()] = fullName;
    
    // 映射全名拼音与简称拼音
    const infoFull = getPinyinInfo(fullName);
    eggGroupMap[infoFull.full] = fullName;
    if (infoFull.abbr && infoFull.abbr.length >= 2) {
      eggGroupMap[infoFull.abbr] = fullName;
    }
    
    // 映射简称拼音与缩写
    const infoBase = getPinyinInfo(baseName);
    eggGroupMap[infoBase.full] = fullName;
    if (infoBase.abbr && infoBase.abbr.length >= 2) {
      eggGroupMap[infoBase.abbr] = fullName;
    }
  });
  
  eggGroupMap['无法孵蛋'] = '无法孵蛋';
  eggGroupMap['wufafudan'] = '无法孵蛋';
  eggGroupMap['wffd'] = '无法孵蛋';
}

function findAvatarPath(formName: string, petName: string): string | null {
  const nameToUse = formName || petName;
  const fileName = getSpriteFileName(nameToUse);
  return fileName ? `./images/sprites/${fileName}` : `./images/sprites/${nameToUse}.png`;
}

function initFormsAndRegional() {
  const allRaceKeys = Object.keys(petsRaceMap);
  let tempIdCounter = 10000;
  for (const formName of allRaceKeys) {
    if (formName.includes('（') || formName.includes('(')) {
      const mainName = formName.split(/[（(]/)[0].trim();
      
      let parentPet = petsData.find((p: any) => p.name === mainName);
      let baseForm: any = null;
      
      if (!parentPet) {
        // 如果主精灵列表中找不到，尝试在子形态名字中匹配主精灵
        parentPet = petsData.find((p: any) => p.forms && p.forms.some((f: any) => f.name === mainName));
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
        petsData.push(parentPet);
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
}

// 初始化
precomputeChart();
initEggGroupMap();
initFormsAndRegional();

// 归一化名字
function normalizeName(name: string): string {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '');
}

/**
 * 查询精灵数据
 */
export function queryPet(queryText: string): QueryPetResult | null {
  if (!queryText) return null;
  let cleanQuery = queryText.trim().toLowerCase();

  const aliasMap: Record<string, string> = {
    '琪琪': '棋棋',
    'qiqi': '棋棋',
    '草布丁': '抹茶布丁',
    'caobuding': '抹茶布丁',
    'cbd': '抹茶布丁',
    '冰布丁': '椰浆布丁',
    'bingbuding': '椰浆布丁',
    'bbd': '椰浆布丁',
    '火布丁': '熔岩布丁',
    'huobuding': '熔岩布丁',
    'hbd': '熔岩布丁'
  };

  if (aliasMap[cleanQuery]) {
    cleanQuery = aliasMap[cleanQuery];
  }

  let normalizedQuery = normalizeName(cleanQuery);
  if (aliasMap[normalizedQuery]) {
    normalizedQuery = normalizeName(aliasMap[normalizedQuery]);
  }

  if (!normalizedQuery) return null;

  const candidates: any[] = [];

  for (const pet of petsData) {
    const petName = pet.name.toLowerCase();
    const normalizedPetName = normalizeName(pet.name);
    const petPinyin = getPinyinInfo(pet.name);

    let mainScore = 0;
    if (normalizedPetName === normalizedQuery) {
      mainScore = 95;
    } else if (normalizedPetName.startsWith(normalizedQuery)) {
      mainScore = 75;
    } else if (normalizedPetName.includes(normalizedQuery)) {
      mainScore = 55;
    } else if (petPinyin.full === cleanQuery || petPinyin.abbr === cleanQuery) {
      mainScore = 40;
    } else if (normalizedQuery.includes(normalizedPetName) && normalizedQuery.length > normalizedPetName.length) {
      mainScore = 20;
    }

    if (mainScore > 0) {
      candidates.push({
        pet,
        form: pet.forms && pet.forms[0] ? pet.forms[0] : null,
        score: mainScore,
        matchedName: pet.name,
        type: 'main'
      });
    }

    if (pet.forms && pet.forms.length > 0) {
      for (const form of pet.forms) {
        const formName = form.name.toLowerCase();
        const normalizedFormName = normalizeName(form.name);
        const formPinyin = getPinyinInfo(form.name);

        const aliasName = form.name.replace(pet.name, '').replace(/[（()）]/g, '').toLowerCase().trim();
        const normalizedAliasName = normalizeName(aliasName);
        const aliasPinyin = aliasName ? getPinyinInfo(aliasName) : null;

        let formScore = 0;
        let matchedName = form.name;

        if (normalizedFormName === normalizedQuery) {
          formScore = 100;
        } else if (normalizedAliasName && normalizedAliasName === normalizedQuery) {
          formScore = 90;
        } else if (normalizedFormName.startsWith(normalizedQuery)) {
          formScore = 80;
        } else if (normalizedAliasName && normalizedAliasName.startsWith(normalizedQuery)) {
          formScore = 70;
        } else if (normalizedFormName.includes(normalizedQuery)) {
          formScore = 60;
        } else if (normalizedAliasName && normalizedAliasName.includes(normalizedQuery)) {
          formScore = 50;
        } else if (formPinyin.full === cleanQuery || formPinyin.abbr === cleanQuery) {
          formScore = 40;
        } else if (aliasPinyin && (aliasPinyin.full === cleanQuery || aliasPinyin.abbr === cleanQuery)) {
          formScore = 35;
        }

        if (formScore > 0) {
          candidates.push({
            pet,
            form,
            score: formScore,
            matchedName,
            type: 'form'
          });
        }
      }
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const lenDiffA = Math.abs(normalizeName(a.matchedName).length - normalizedQuery.length);
    const lenDiffB = Math.abs(normalizeName(b.matchedName).length - normalizedQuery.length);
    if (lenDiffA !== lenDiffB) {
      return lenDiffA - lenDiffB;
    }
    return a.pet.id - b.pet.id;
  });

  const bestMatch = candidates[0];
  const { pet, form } = bestMatch;

  const result: QueryPetResult = {
    id: pet.id,
    name: pet.name,
    types: pet.types || [],
    evolution_chain: pet.evolution_chain ? JSON.parse(JSON.stringify(pet.evolution_chain)) : [pet.name],
    currentForm: {
      name: form ? form.name : pet.name,
      types: (form && form.types) ? form.types : (pet.types || []),
      egg_groups: (form && form.egg_groups) ? form.egg_groups : (pet.egg_data ? pet.egg_data.egg_groups : ["无法孵蛋"]),
      height_min: (form && form.height_min !== undefined) ? form.height_min : (pet.egg_data ? pet.egg_data.height_min : null),
      height_max: (form && form.height_max !== undefined) ? form.height_max : (pet.egg_data ? pet.egg_data.height_max : null),
      weight_min: (form && form.weight_min !== undefined) ? form.weight_min : (pet.egg_data ? pet.egg_data.weight_min : null),
      weight_max: (form && form.weight_max !== undefined) ? form.weight_max : (pet.egg_data ? pet.egg_data.weight_max : null),
      giant_weight_line: (form && form.giant_weight_line !== undefined) ? form.giant_weight_line : (pet.egg_data ? pet.egg_data.giant_weight_line : null),
      tiny_weight_line: (form && form.tiny_weight_line !== undefined) ? form.tiny_weight_line : (pet.egg_data ? pet.egg_data.tiny_weight_line : null),
      race: null
    },
    forms: pet.forms || [],
    egg_data: pet.egg_data || null,
    avatarPath: null,
    avatars: []
  };

  let currentFormName = result.currentForm.name.trim();
  const allRaceForms = Object.keys(petsRaceMap).filter(k => 
    k.startsWith(pet.name + '（') || k.startsWith(pet.name + '(')
  );
  const isAlreadyRegional = result.currentForm.name.includes('（') || result.currentForm.name.includes('(');
  if (!isAlreadyRegional && allRaceForms.length > 0) {
    const pureQueryKeyword = normalizedQuery.replace(normalizeName(pet.name), '').trim();
    
    if (pureQueryKeyword) {
      let matchedForm = null;
      for (const formKey of allRaceForms) {
        const bracketContent = normalizeName(formKey.replace(pet.name, ''));
        if (bracketContent && (bracketContent.includes(pureQueryKeyword) || pureQueryKeyword.includes(bracketContent))) {
          matchedForm = formKey;
          break;
        }
      }
      if (matchedForm) {
        result.currentForm.name = matchedForm;
        currentFormName = matchedForm;
      }
    }
  }

  const bracketMatch = result.currentForm.name.match(/[（(].+?[）)]/);
  if (bracketMatch) {
    const suffix = bracketMatch[0];
    const mapChain = (item: any): any => {
      if (Array.isArray(item)) {
        return item.map(mapChain);
      } else if (typeof item === 'string') {
        const baseName = item.split(/[（(]/)[0].trim();
        const suffixedName = baseName + suffix;
        if (petsRaceMap[suffixedName]) {
          return suffixedName;
        }
        return item;
      }
      return item;
    };
    result.evolution_chain = result.evolution_chain.map(mapChain);
  }

  let raceInfo = petsRaceMap[currentFormName];
  if (!raceInfo) {
    const possibleKeys = Object.keys(petsRaceMap).filter(k => 
      k.startsWith(currentFormName + '（') || k.startsWith(currentFormName + '(')
    );
    if (possibleKeys.length > 0) {
      raceInfo = petsRaceMap[possibleKeys[0]];
      result.currentForm.name = possibleKeys[0];
    }
  }

  if (raceInfo && raceInfo.stats) {
    result.currentForm.race = {
      sum: raceInfo.sum,
      stats: raceInfo.stats
    };
  }

  const avatarPath = findAvatarPath(result.currentForm.name, result.name);
  result.avatarPath = avatarPath;

  const associatedAvatars: Array<{ styleName: string; absolutePath: string }> = [];
  const formBaseName = result.currentForm.name.split(/[（(]/)[0].trim();
  const searchNames = [result.currentForm.name, formBaseName, pet.name];

  let found = false;
  for (const name of searchNames) {
    if (!name) continue;
    
    for (const file of spriteFiles) {
      const cleanFileName = file.replace(/^\d+-/, ''); // 去除 "313-" 等前导数字
      
      if (cleanFileName.toLowerCase() === `${name.toLowerCase()}.png`) {
        associatedAvatars.push({
          styleName: '本来的样子',
          absolutePath: `./images/sprites/${file}`
        });
        found = true;
      } else if (cleanFileName.toLowerCase().startsWith(`${name.toLowerCase()}_`) && cleanFileName.endsWith('.png')) {
        const styleName = cleanFileName.substring(name.length + 1, cleanFileName.length - 4);
        associatedAvatars.push({
          styleName: styleName,
          absolutePath: `./images/sprites/${file}`
        });
        found = true;
      }
    }
    if (found && associatedAvatars.length > 0) {
      break;
    }
  }

  if (associatedAvatars.length === 0 && avatarPath) {
    associatedAvatars.push({
      styleName: result.currentForm.name === result.name ? '本来的样子' : result.currentForm.name,
      absolutePath: avatarPath
    });
  }

  // 去重处理，防止因为名字重合导致同一个样子选择出现两次
  const seenPaths = new Set<string>();
  result.avatars = associatedAvatars.filter(av => {
    if (seenPaths.has(av.absolutePath)) return false;
    seenPaths.add(av.absolutePath);
    return true;
  });

  return result;
}

/**
 * 解析直径与重量参数
 */
export function parseEggParams(queryText: string) {
  if (!queryText) return null;

  const numRegex = /(\d+(?:\.\d+)?)\s*(m|cm|kg|g)?/gi;
  const matches = [...queryText.matchAll(numRegex)];
  if (matches.length < 2) return null;

  let height = parseFloat(matches[0][1]);
  const unit1 = matches[0][2] ? matches[0][2].toLowerCase() : 'm';
  let weight = parseFloat(matches[1][1]);
  const unit2 = matches[1][2] ? matches[1][2].toLowerCase() : 'kg';

  if (unit1 === 'cm') {
    height = height / 100;
  }
  if (unit2 === 'g') {
    weight = weight / 1000;
  }

  const isRideableOnly = queryText.includes('同乘') || queryText.includes('rideable');

  return { height, weight, isRideableOnly };
}

/**
 * 预测精灵蛋可能匹配的精灵
 */
export function queryEgg(height: number, weight: number, isRideableOnly: boolean = false): PredictedEggResult[] {
  if (height === undefined || weight === undefined || isNaN(height) || isNaN(weight)) {
    return [];
  }

  const transform = (h: number, w: number) => {
    const x = 1.9578174 * Math.log(h) + 2.563638;
    const y = 0.549724 * Math.log(w) - 0.9431053;
    return { x, y };
  };

  const target = transform(height, weight);
  const r = 0.96;
  const one_minus_r2 = 1 - r * r;

  const candidates: any[] = [];

  for (const pet of petsData) {
    const chart = precomputedChartData[pet.name];
    if (!chart) continue;

    if (isRideableOnly && !chart.is_rideable) {
      continue;
    }

    if (height < chart.t_s_min || height > chart.t_s_max || weight < chart.t_w_min || weight > chart.t_w_max) {
      continue;
    }

    const dx = (target.x - chart.mu_x) / chart.sig_x;
    const dy = (target.y - chart.mu_y) / chart.sig_y;

    const D2 = (dx * dx + dy * dy - 2 * r * dx * dy) / one_minus_r2;
    const score = -0.5 * D2 + chart.const_term;

    let sizeTag = '普通';
    if (weight <= chart.tiny_weight_line) {
      sizeTag = '小不点';
    } else if (weight >= chart.giant_weight_line) {
      sizeTag = '大块头';
    }

    const avatarPath = findAvatarPath(pet.name, pet.name);

    candidates.push({
      id: pet.id,
      name: pet.name,
      types: pet.types || [],
      egg_groups: (pet.egg_data && pet.egg_data.egg_groups) ? pet.egg_data.egg_groups : [],
      height_min: chart.theory_box_real[0],
      height_max: chart.theory_box_real[1],
      weight_min: chart.theory_box_real[2],
      weight_max: chart.theory_box_real[3],
      empirical_box_real: chart.empirical_box_real,
      giant_weight_line: chart.giant_weight_line,
      tiny_weight_line: chart.tiny_weight_line,
      avatarPath,
      sizeTag,
      score
    });
  }

  if (candidates.length === 0) return [];

  const activeCandidates = candidates.filter(c => c.score > -30.19);
  const finalCandidates = activeCandidates.length > 0 ? activeCandidates : candidates;

  const maxScore = Math.max(...finalCandidates.map(c => c.score));
  const expSums = finalCandidates.map(c => ({
    ...c,
    expVal: Math.exp(c.score - maxScore)
  }));

  const totalExp = expSums.reduce((sum, c) => sum + c.expVal, 0);

  const output = expSums.map(c => {
    const prob = totalExp > 0 ? (c.expVal / totalExp) * 100 : (100 / finalCandidates.length);
    return {
      id: c.id,
      name: c.name,
      types: c.types,
      egg_groups: c.egg_groups,
      height_min: c.height_min,
      height_max: c.height_max,
      weight_min: c.weight_min,
      weight_max: c.weight_max,
      empirical_box_real: c.empirical_box_real,
      giant_weight_line: c.giant_weight_line,
      tiny_weight_line: c.tiny_weight_line,
      avatarPath: c.avatarPath,
      sizeTag: c.sizeTag,
      probability: prob.toFixed(1) + '%',
      probValue: prob
    };
  });

  const hasValidProb = output.some(o => o.probValue >= 0.1);
  const filtered = hasValidProb ? output.filter(o => o.probValue >= 0.1) : output;

  return filtered
    .map(({ probValue, ...rest }) => rest)
    .sort((a, b) => parseFloat(b.probability) - parseFloat(a.probability));
}

/**
 * 解析用户输入的蛋组
 */
export function parseEggGroupParams(queryText: string): string[] | null {
  if (!queryText) return null;
  
  const tokens = queryText.trim().split(/[\s,;，；&\+\/\-|]+/).map(t => t.trim()).filter(Boolean);
  if (tokens.length === 0) return null;
  
  const matchedGroups: string[] = [];
  const seen = new Set<string>();
  
  for (const token of tokens) {
    const cleanToken = token.toLowerCase();
    const groupName = eggGroupMap[cleanToken];
    if (groupName) {
      if (!seen.has(groupName)) {
        seen.add(groupName);
        matchedGroups.push(groupName);
      }
    } else {
      return null;
    }
  }
  
  if (matchedGroups.length > 0 && matchedGroups.length <= 2) {
    return matchedGroups;
  }
  
  return null;
}

/**
 * 根据蛋组查询精灵
 */
export function queryEggGroups(groups: string[]) {
  if (!groups || groups.length === 0) return [];
  
  const results: any[] = [];
  for (const pet of petsData) {
    if (!pet.egg_data || !pet.egg_data.egg_groups) continue;
    
    const petGroups = pet.egg_data.egg_groups;
    const isMatch = groups.every(g => petGroups.includes(g));
    
    if (isMatch) {
      results.push({
        id: pet.id,
        name: pet.name,
        types: pet.types || [],
        egg_groups: petGroups,
        height_min: pet.egg_data.height_min,
        height_max: pet.egg_data.height_max,
        weight_min: pet.egg_data.weight_min,
        weight_max: pet.egg_data.weight_max,
        giant_weight_line: pet.egg_data.giant_weight_line,
        tiny_weight_line: pet.egg_data.tiny_weight_line,
        avatarPath: findAvatarPath(pet.name, pet.name)
      });
    }
  }
  
  return results.sort((a, b) => a.id - b.id);
}
