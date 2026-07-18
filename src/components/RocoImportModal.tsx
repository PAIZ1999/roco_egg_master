import React, { useState, useEffect, useRef } from "react";
import {
  X,
  RefreshCw,
  Clipboard,
  Check,
  AlertCircle,
  Mars,
  Venus,
  ShieldAlert,
  Search,
  Filter,
  ArrowRight,
  Database,
  User,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { ParentPet, cleanNature, STATS_OPTIONS } from "../types";
import {
  getPetDetails,
  getSpriteFileName,
  getImagePath,
  getPetSizeThresholds,
  ALL_PET_NAMES,
  getEggGroupStyle
} from "../petHelper";
import petsData from "../pets_data.json";

// 洛克王国世界性格 ID 映射修正 (对齐官方 BMwuucP5.js 性格配置)
const NATURE_ID_MAP: Record<number, string> = {
  1: "大胆", 2: "固执", 3: "调皮", 4: "勇敢", 5: "逞强",
  6: "稳重", 7: "天真", 8: "懒散", 9: "悠闲", 10: "坦率",
  11: "聪明", 12: "专注", 13: "偏执", 14: "冷静", 15: "理性",
  16: "警惕", 17: "温顺", 18: "害羞", 19: "慎重", 20: "焦虑",
  21: "胆小", 22: "急躁", 23: "开朗", 24: "莽撞", 25: "热情",
  26: "沉默", 27: "忧郁", 28: "平和", 29: "粗心", 30: "踏实",
  31: "平和"
};

// 属性个体值中文名映射
const STAT_KEY_MAP: Record<string, string> = {
  hp: "生命", health: "生命", HP: "生命",
  atk: "物攻", attack: "物攻", ATK: "物攻", physical_attack: "物攻",
  speed: "速度", spd: "速度", SPEED: "速度",
  matk: "魔攻", magic_atk: "魔攻", magic_attack: "魔攻", MATK: "魔攻", special_attack: "魔攻",
  def: "物防", defense: "物防", DEF: "物防", physical_defense: "物防",
  mdef: "魔防", magic_def: "魔防", magic_defense: "魔防", MDEF: "魔防", special_defense: "魔防"
};

// Unicode Base64 宠物名称解码器
const decodeBase64Name = (str: string): string => {
  if (!str) return "";
  // 简易 Base64 格式校验
  if (!/^[A-Za-z0-9+/=]+$/.test(str) || str.length % 4 !== 0) {
    return str;
  }
  try {
    const decoded = atob(str);
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      bytes[i] = decoded.charCodeAt(i);
    }
    const decodedName = new TextDecoder("utf-8").decode(bytes);
    // 防呆：如果解码出来的名字全都是奇怪的控制字符或乱码，则退回原串
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFD]/.test(decodedName)) {
      return str;
    }
    return decodedName;
  } catch (e) {
    return str;
  }
};

// 模糊检索下拉框组件
interface SearchableSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  displayMap?: Record<string, string>;
  placeholder?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  value,
  onChange,
  options,
  displayMap,
  placeholder = "搜索..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearchVal("");
    }
  }, [isOpen]);

  const filteredOptions = options.filter(opt => {
    const disp = displayMap && displayMap[opt] ? displayMap[opt] : opt;
    return disp.toLowerCase().includes(searchVal.toLowerCase());
  });

  const selectedDisplay = displayMap && displayMap[value] ? displayMap[value] : value;

  return (
    <div className="flex flex-col gap-1.5 relative w-full font-sans select-none" ref={containerRef}>
      <span className="text-[10px] text-slate-450 dark:text-slate-500 font-extrabold uppercase tracking-wider">{label}</span>
      
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full pl-3 pr-8 py-1.8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 text-xs font-bold transition-all cursor-pointer flex items-center justify-between min-h-[30px] shadow-3xs"
      >
        <span className="truncate">{selectedDisplay}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-450 dark:text-slate-500 shrink-0" />
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-55 flex flex-col min-w-[160px] max-h-[220px] overflow-hidden backdrop-blur-md bg-white/95 dark:bg-slate-900/95">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/95 dark:bg-slate-900/95 z-10 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder={placeholder}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-transparent text-xs font-bold text-slate-750 dark:text-slate-200 focus:outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
                无匹配选项
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const disp = displayMap && displayMap[opt] ? displayMap[opt] : opt;
                const isSelected = value === opt;
                return (
                  <div
                    key={opt}
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                    }}
                    className={`px-3 py-1.8 text-xs font-bold transition-all cursor-pointer truncate flex items-center justify-between ${
                      isSelected
                        ? "bg-indigo-600 text-white dark:bg-indigo-500"
                        : "text-slate-700 dark:text-slate-250 hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
                    }`}
                  >
                    <span>{disp}</span>
                    {isSelected && <span className="text-[10px]">✓</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface ParsedPet {
  uid: string; // 唯一键
  name: string; // 精灵名字
  sprite: string; // 形态名字
  level: number;
  gender: "♂" | "♀";
  nature: string;
  height: string;
  weight: string;
  brand: string;
  stats: string[];
  groups: string[];
  rawItem: any;
  selected: boolean;
  isDuplicate: boolean;
  voice?: number | null;
  isNearGiant?: boolean;
  isNearTiny?: boolean;
  isNearVoice?: boolean;
  position?: string;
}

interface RocoImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingParents: ParentPet[];
  onImport: (newParents: ParentPet[]) => void;
}

export const RocoImportModal: React.FC<RocoImportModalProps> = ({
  isOpen,
  onClose,
  existingParents,
  onImport
}) => {
  const [activeTab, setActiveTab] = useState<"sqlite" | "paste">("sqlite");
  const [importCurrentPage, setImportCurrentPage] = useState(1);
  const IMPORT_PAGE_SIZE = 50;
  const [apiUrl, setApiUrl] = useState("http://127.0.0.1:4939/api/pets");
  const [jsonText, setJsonText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // SQLite 专属状态
  const [rocoUsers, setRocoUsers] = useState<Array<{ uid: number; name: string }>>([]);
  const [selectedUid, setSelectedUid] = useState<string>("");
  const [isSqliteAvailable, setIsSqliteAvailable] = useState(false);
  
  // 过滤控制
  const [filterGender, setFilterGender] = useState<"全部" | "♂" | "♀">("全部");
  const [filterNature, setFilterNature] = useState<string>("全部");
  const [filterBrand, setFilterBrand] = useState<string>("全部");
  const [filterGroup, setFilterGroup] = useState<string>("全部");

  // 嗅探状态呼吸灯：'idle' | 'fetching' | 'success' | 'error'
  const [connStatus, setConnStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle');

  // 解析出来的宠物列表
  const [parsedPets, setParsedPets] = useState<ParsedPet[]>([]);
  const [searchTerm, setSearchTerm] = useState("");


  
  // 异步加载本地 SQLite 角色列表
  const loadSqliteUsers = async (): Promise<boolean> => {
    if (window.electronAPI && window.electronAPI.getRocoUsers) {
      try {
        const res = await window.electronAPI.getRocoUsers();
        if (res.success && res.data && res.data.length > 0) {
          setRocoUsers(res.data);
          setSelectedUid(String(res.data[0].uid));
          setIsSqliteAvailable(true);
          return true;
        } else {
          setIsSqliteAvailable(false);
          return false;
        }
      } catch (e: any) {
        setIsSqliteAvailable(false);
        return false;
      }
    }
    return false;
  };

  // 监听模态框打开重置状态
  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      setSuccessMsg("");
      setParsedPets([]);
      setConnStatus('idle');
      
      // 重置过滤下拉框状态
      setFilterGender("全部");
      setFilterNature("全部");
      setFilterBrand("全部");
      setFilterGroup("全部");
      
      // 检测并加载 SQLite
      if (window.electronAPI && window.electronAPI.getRocoUsers) {
        setIsLoading(true);
        loadSqliteUsers().then((available) => {
          if (available) {
            setActiveTab("sqlite");
          } else {
            setActiveTab("sqlite");
          }
        }).catch(() => {
          setActiveTab("sqlite");
        }).finally(() => {
          setIsLoading(false);
        });
      } else {
        setActiveTab("sqlite");
      }
    }
  }, [isOpen]);

  // 监听过滤条件变化，重置导入分页码 (必须放置在 if (!isOpen) 提前返回的上方，遵循 React Hook 规则，防止组件崩溃白屏)
  useEffect(() => {
    setImportCurrentPage(1);
  }, [searchTerm, filterGender, filterNature, filterBrand, filterGroup, parsedPets]);

  if (!isOpen) return null;

  // 自适应字段猜测解析单只宠物
  const parseSinglePet = (item: any, index: number, existingSet: Set<string>): ParsedPet | null => {
    try {
      // 1. 识别并解码精灵名字 (优先使用 ID 在本地 petsData 中反查，以实现 100% 官方数据库无缝对接)
      let rawName = "";
      const rawId = item.base_conf_id !== undefined ? item.base_conf_id : (item.pet_id !== undefined ? item.pet_id : (item.id !== undefined ? item.id : item.sprite_id));
      if (rawId !== undefined) {
        const idNum = parseInt(String(rawId));
        const foundPet = petsData.find((p: any) => p.id === idNum);
        if (foundPet) {
          rawName = foundPet.name;
        } else {
          // 查找 forms
          for (const p of petsData) {
            const f = p.forms.find((form: any) => form.id === idNum);
            if (f) {
              rawName = f.name;
              break;
            }
          }
        }
      }

      // 如果通过 ID 没查到，再使用名字字段解码兜底 (提前执行，确保后续形态映射与拼接能获取到 rawName)
      if (!rawName) {
        if (typeof item.name === "string" && item.name) {
          rawName = decodeBase64Name(item.name);
        } else if (typeof item.sprite === "string" && item.sprite) {
          rawName = decodeBase64Name(item.sprite);
        } else if (typeof item.pet_name === "string" && item.pet_name) {
          rawName = decodeBase64Name(item.pet_name);
        } else if (typeof item.displayName === "string" && item.displayName) {
          rawName = decodeBase64Name(item.displayName);
        }
      }

      // 获取 item 中可能存在的带形态的原始名字
      let rawOriginalName = "";
      if (typeof item.name === "string" && item.name) {
        rawOriginalName = decodeBase64Name(item.name);
      } else if (typeof item.sprite === "string" && item.sprite) {
        rawOriginalName = decodeBase64Name(item.sprite);
      } else if (typeof item.pet_name === "string" && item.pet_name) {
        rawOriginalName = decodeBase64Name(item.pet_name);
      } else if (typeof item.displayName === "string" && item.displayName) {
        rawOriginalName = decodeBase64Name(item.displayName);
      }

      // 提取原始名称中可能的形态信息 (如 "古钟蛇（本来的样子）" -> "本来的样子")
      let formSuffix = "";
      if (rawOriginalName) {
        const matchBracket = rawOriginalName.match(/[（(](.+?)[）)]/);
        if (matchBracket) {
          formSuffix = matchBracket[1];
        } else if (rawOriginalName.includes("_")) {
          formSuffix = rawOriginalName.split("_")[1];
        }
      }

      // 特殊多形态宠物 conf_id 映射：如鸭吉吉 (base_conf_id: 3742/3744/3745/3495/3012/3036/3452/3453)
      const isYajiji = (
        [3742, 3744, 3745, 3495, 3012, 3036, 3452, 3453].includes(rawId) ||
        ["鸭吉吉", "火红尾", "雅丹鬃"].includes(rawName) ||
        ["鸭吉吉", "火红尾", "雅丹鬃"].includes(rawOriginalName)
      );
      if (isYajiji) {
        const confIdVal = item.conf_id !== undefined ? parseInt(String(item.conf_id)) : null;
        if (confIdVal === 3742001 || confIdVal === 410012) {
          formSuffix = "蓬松的样子";
        } else if (confIdVal === 410738 || confIdVal === 410739 || confIdVal === 410740) {
          formSuffix = "起来鸭"; // 即睡帽鸭
        } else if (confIdVal === 300710 || confIdVal === 300711 || confIdVal === 410032) {
          formSuffix = "紧实的样子";
        } else if (confIdVal === 300463 || confIdVal === 410449) {
          formSuffix = "等一等鸭";
        } else if (confIdVal === 410448) {
          formSuffix = "急急急鸭";
        } else if (confIdVal === 410491) {
          formSuffix = "燃了鸭";
        }
      }

      // 特殊多形态宠物 conf_id 映射：如丢丢/卡卡虫/卡瓦重 (丢丢进化链，基础 ID 3040/3041/3042，以及沙地 3290/3291/3292，新版火山 3295/雪山 3296)
      const isDiudiuChain = (
        [3040, 3041, 3042, 3290, 3291, 3292, 3295, 3296].includes(rawId) ||
        ["丢丢", "卡卡虫", "卡瓦重"].includes(rawName) ||
        ["丢丢", "卡卡虫", "卡瓦重"].includes(rawOriginalName)
      );
      if (isDiudiuChain) {
        const confIdVal = item.conf_id !== undefined ? parseInt(String(item.conf_id)) : null;
        if (confIdVal === 2200004 || confIdVal === 3040001) {
          formSuffix = "草地附近的样子";
        } else if (confIdVal && (Math.floor(confIdVal / 10000) === 329 || confIdVal === 3290001 || confIdVal === 3292001)) {
          formSuffix = "沙地附近的样子";
        } else if (confIdVal === 300036 || confIdVal === 410286) {
          formSuffix = "雪山附近的样子";
        } else if (confIdVal === 410036 || confIdVal === 410285) {
          formSuffix = "火山附近的样子";
        }
      }

      // 特殊多形态宠物 conf_id 映射：如晶石蜗 (基础 ID 3308/3448/3449/3450/3451/3486)
      const isJingshiwo = (
        [3308, 3448, 3449, 3450, 3451, 3486].includes(rawId) ||
        rawName === "晶石蜗" || rawOriginalName === "晶石蜗"
      );
      if (isJingshiwo) {
        const baseIdMap: Record<number, string> = {
          3308: "西瓜碧玺的样子",
          3448: "莲花刚玉的样子",
          3449: "星彩榴石的样子",
          3450: "火山琉璃的样子",
          3451: "蓝锥矿的样子",
          3486: "烧蓝黄金的样子"
        };
        if (baseIdMap[rawId]) {
          formSuffix = baseIdMap[rawId];
        }
      }

      // 特殊多形态宠物 conf_id 映射：如星光狮
      const isXingguangshi = (rawId === 3194 || rawId === 3443 || rawName === "星光狮" || rawOriginalName === "星光狮");
      if (isXingguangshi) {
        const confIdVal = item.conf_id !== undefined ? parseInt(String(item.conf_id)) : null;
        if (confIdVal === 410190) {
          formSuffix = "星光能量的样子";
        } else if (confIdVal === 410439) {
          formSuffix = "月光能量的样子";
        }
      }

      // 特殊多形态宠物 conf_id 映射：如冬羽雀 / 雪绒鸟 / 岚鸟
      const isXuerongniao = (
        [3282, 3280, 3279, 3037, 3285, 3286, 3287].includes(rawId) ||
        ["冬羽雀", "雪绒鸟", "岚鸟"].includes(rawName) ||
        ["冬羽雀", "雪绒鸟", "岚鸟"].includes(rawOriginalName)
      );
      if (isXuerongniao) {
        const confIdVal = item.conf_id !== undefined ? parseInt(String(item.conf_id)) : null;
        if (confIdVal === 410278 || confIdVal === 3279001) {
          formSuffix = "春天的样子";
        } else if (confIdVal === 410279 || confIdVal === 3280001) {
          formSuffix = "夏天的样子";
        } else if (confIdVal === 410280) {
          formSuffix = "秋天的样子";
        } else {
          formSuffix = "冬天的样子";
        }
      }

      // 进一步通过 base_conf_id 特殊处理其他 3.2.4 新版独立 ID 分支的多形态精灵
      if (rawName === "圣代甜甜") {
        const baseIdMap: Record<number, string> = {
          3459: "樱桃抹茶口味",
          3460: "蓝莓巧克力口味",
          3461: "蓝莓草莓口味",
          3462: "蓝莓抹茶口味",
          3463: "杨桃巧克力口味",
          3464: "杨桃草莓口味",
          3465: "杨桃抹茶口味"
        };
        if (baseIdMap[rawId]) {
          formSuffix = baseIdMap[rawId];
        }
      } else if (rawName === "海枝枝") {
        const baseIdMap: Record<number, string> = {
          3430: "碧蓝珊瑚",
          3431: "杏黄百合",
          3432: "洋红沙丁",
          3433: "翠绿纶布"
        };
        if (baseIdMap[rawId]) {
          formSuffix = baseIdMap[rawId];
        }
      } else if (rawName === "月亮砣" || rawName === "刺轮砣") {
        const baseIdMap: Record<number, string> = {
          3583: "上弦的样子",
          3585: "下弦的样子",
          3584: "下弦的样子"
        };
        if (baseIdMap[rawId]) {
          formSuffix = baseIdMap[rawId];
        }
      } else if (rawName === "乌拉塔" || rawName === "乌达" || rawName === "迷你乌") {
        const baseIdMap: Record<number, string> = {
          3538: "极昼的样子",
          3541: "极夜的样子"
        };
        if (baseIdMap[rawId]) {
          formSuffix = baseIdMap[rawId];
        }
      } else if (rawName === "地鼠" || rawName === "遁地鼠" || rawName === "遁鼠") {
        const baseIdMap: Record<number, string> = {
          3020: "枯水期的样子",
          3022: "枯水期的样子",
          3456: "储水时的样子"
        };
        if (baseIdMap[rawId]) {
          formSuffix = baseIdMap[rawId];
        }
      } else if (rawName === "蹦蹦种子" || rawName === "蹦蹦果" || rawName === "蹦蹦花" || rawName === "蹦蹦草") {
        const baseIdMap: Record<number, string> = {
          3019: "海神球形态",
          3303: "彩玉球形态",
          3304: "短毛球形态",
          3305: "象牙球形态"
        };
        if (baseIdMap[rawId]) {
          formSuffix = baseIdMap[rawId];
        }
      } else if (rawName === "加油蟹") {
        const confIdVal = item.conf_id !== undefined ? parseInt(String(item.conf_id)) : null;
        if (confIdVal === 410753 || confIdVal === 410655) {
          formSuffix = "单只海葵的样子";
        }
      } else if (rawName === "落陨星兔") {
        const confIdVal = item.conf_id !== undefined ? parseInt(String(item.conf_id)) : null;
        if (confIdVal === 410315) {
          formSuffix = "信使精灵";
        }
      }

      if (rawName && formSuffix) {
        // 如果 rawName 本身没有形态后缀，则拼接形态
        if (!rawName.includes("_") && !rawName.includes("（") && !rawName.includes("(")) {
          if (rawName !== formSuffix) {
            rawName = `${rawName}_${formSuffix}`;
          }
        }
      }

      if (!rawName) return null;

      // 剔除形态后缀，检查官方蛋组和系别
      const baseName = rawName.split("_")[0];
      const petDetails = getPetDetails(baseName);
      const groups = petDetails ? petDetails.groups : [];

      // 2. 识别性别 (1=公, 2=母, 0=未知)
      let gender: "♂" | "♀" = "♀"; // 默认母
      const gVal = item.gender !== undefined ? item.gender : item.sex;
      if (gVal !== undefined) {
        const gStr = String(gVal).toLowerCase();
        if (gStr === "1" || gStr === "male" || gStr === "m" || gStr.includes("公") || gStr.includes("雄") || gStr.includes("♂")) {
          gender = "♂";
        }
      }

      // 3. 识别性格
      let nature = "错性格";
      const nVal = item.nature !== undefined ? item.nature : item.character;
      if (nVal !== undefined) {
        if (typeof nVal === "string") {
          nature = cleanNature(nVal);
        } else if (typeof nVal === "number") {
          const nameFromId = NATURE_ID_MAP[nVal];
          if (nameFromId) {
            nature = cleanNature(nameFromId);
          }
        }
      }

      // 4. 等级
      let level = 100;
      const lVal = item.level !== undefined ? item.level : item.lv;
      if (lVal !== undefined) {
        level = parseInt(String(lVal)) || 100;
      }

      // 5. 身高和体重（自动处理厘米/米，克/千克）
      let height = "";
      let weight = "";
      const hVal = item.height !== undefined ? item.height : item.size;
      const wVal = item.weight !== undefined ? item.weight : item.mass;
      
      if (hVal !== undefined) {
        let hNum = parseFloat(String(hVal));
        if (!isNaN(hNum)) {
          if (hNum > 10) hNum = hNum / 100; // 厘米 -> 米
          height = hNum.toFixed(3);
        }
      }
      if (wVal !== undefined) {
        let wNum = parseFloat(String(wVal));
        if (!isNaN(wNum)) {
          if (wNum > 1000) wNum = wNum / 1000; // 克 -> 千克
          weight = wNum.toFixed(3);
        }
      }

      // 6. 体型牌判定与智能推算
      let brand = "普通";
      let voice: number | null = null;
      let isNearVoice = false;
      let isNearGiant = false;
      let isNearTiny = false;

      const bVal = item.brand !== undefined ? item.brand : item.size_brand;
      if (bVal && typeof bVal === "string") {
        brand = bVal;
      } else {
        const voiceVal = item.voice !== undefined ? item.voice : (item.voice_type !== undefined ? item.voice_type : item.voice_brand);
        let voiceType = 0; // 0=普通, 1=粗嗓门, 2=婉转声
        
        if (voiceVal !== undefined) {
          const vNum = parseInt(String(voiceVal));
          if (!isNaN(vNum)) {
            voice = vNum;
            if (vNum <= -96) voiceType = 1; // 粗嗓门
            else if (vNum >= 96) voiceType = 2; // 婉转声
            else if ((vNum >= -95 && vNum <= -90) || (vNum >= 90 && vNum <= 95)) {
              isNearVoice = true; // 临近声音
            }
          }
        }
        
        let isGiant = false;
        let isTiny = false;
        
        const thresholds = getPetSizeThresholds(rawName);
        if (thresholds && height && weight) {
          const hNum = parseFloat(height);
          const wNum = parseFloat(weight);
          if (!isNaN(hNum) && !isNaN(wNum)) {
            // 大块头条件：身高 >= 身高上限，体重 >= 大及格线
            isGiant = hNum >= thresholds.maxHeight && wNum >= thresholds.giantWeightLine;
            // 临近大块头：身高 >= 身高上限，体重在 90% 大及格线到 100% 之间
            isNearGiant = hNum >= thresholds.maxHeight && wNum < thresholds.giantWeightLine && wNum >= thresholds.giantWeightLine * 0.90;
            
            // 小不点条件：身高 <= 身高下限，体重 <= 小及格线
            isTiny = hNum <= thresholds.minHeight && wNum <= thresholds.tinyWeightLine;
            // 临近小不点：身高 <= 身高下限，体重在 100% 小及格线到 110% 之间
            isNearTiny = hNum <= thresholds.minHeight && wNum > thresholds.tinyWeightLine && wNum <= thresholds.tinyWeightLine * 1.10;
          }
        }
        
        if (isGiant) {
          if (voiceType === 1) brand = "大粗";
          else if (voiceType === 2) brand = "大婉";
          else brand = "单大块头";
        } else if (isTiny) {
          if (voiceType === 1) brand = "小粗";
          else if (voiceType === 2) brand = "小婉";
          else brand = "单小不点";
        } else {
          if (voiceType === 1) brand = "单粗嗓门";
          else if (voiceType === 2) brand = "单婉转声";
          else brand = "普通";
        }
      }

      // 7. 三围天赋/个体值判定 (满值 30/31 提取)
      const stats: string[] = ["无", "无", "无"];
      const foundVs: string[] = [];

      // 7.1 支持魔方 Next 协议 attribute_info 结构体解析 (优先以 talent_add_value > 0 努力加点判定)
      if (item.attribute_info && typeof item.attribute_info === "object") {
        const hasEfforts = Object.values(item.attribute_info).some((attrObj: any) => 
          attrObj && attrObj.talent_add_value !== undefined && attrObj.talent_add_value > 0
        );

        Object.entries(item.attribute_info).forEach(([k, attrObj]: [string, any]) => {
          if (attrObj) {
            const mappedName = STAT_KEY_MAP[k];
            if (mappedName) {
              if (hasEfforts) {
                // 如果存在努力加点，只提取加了点的属性作为三围
                if (attrObj.talent_add_value !== undefined && attrObj.talent_add_value > 0) {
                  if (!foundVs.includes(mappedName)) {
                    foundVs.push(mappedName);
                  }
                }
              } else {
                // 否则（未加点胚子），用个体值大等于 30 兜底
                if (attrObj.talent >= 30 || attrObj.talent_add_value === 10) {
                  if (!foundVs.includes(mappedName)) {
                    foundVs.push(mappedName);
                  }
                }
              }
            }
          }
        });
      }

      // 7.2 兜底支持常规扁平 talents 键值对解析
      const talentsObj = item.talents || item.stats || item.individual || item.attrs || item;
      if (talentsObj && typeof talentsObj === "object" && foundVs.length === 0) {
        Object.entries(talentsObj).forEach(([k, v]) => {
          const valNum = parseInt(String(v));
          if (valNum >= 30) {
            const mappedName = STAT_KEY_MAP[k];
            if (mappedName && !foundVs.includes(mappedName)) {
              foundVs.push(mappedName);
            }
          }
        });
      }

      // 整理前 3 个满值的项
      let sIdx = 0;
      foundVs.forEach(vName => {
        if (sIdx < 3) {
          stats[sIdx] = vName;
          sIdx++;
        }
      });

      // 8. 判定是否与本地已存在的数据完全重复 (使用 Set 实现 O(1) 匹配，避免 N*M 复杂度的 JSON.stringify 与 sort 重绘假死)
      const sortedStats = [...stats].sort().join(',');
      const key = `${rawName}|${gender}|${nature}|${brand}|${sortedStats}`;
      const isDuplicate = existingSet.has(key);

      return {
        uid: `parsed-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: baseName,
        sprite: rawName,
        level,
        gender,
        nature,
        height,
        weight,
        brand,
        stats,
        groups,
        rawItem: item,
        selected: !isDuplicate, // 重复的默认不勾选，不重复的默认勾选
        isDuplicate,
        voice,
        isNearGiant,
        isNearTiny,
        isNearVoice,
        position: item.position || "-"
      };
    } catch (e) {
      console.error("解析单只宠物失败:", e, item);
      return null;
    }
  };

  // 处理获取到的完整宠物数据列表
  const handleRawDataList = (list: any[]) => {
    if (!Array.isArray(list) || list.length === 0) {
      setErrorMsg("数据格式有误或未获取到宠物列表");
      setParsedPets([]);
      return;
    }

    // 提前构建去重特征 Set (优化百万次 N*M JSON.stringify 查重开销)
    const existingSet = new Set<string>(
      existingParents.map(p => {
        const sortedStats = [...p.stats].sort().join(',');
        return `${p.sprite}|${p.gender}|${p.nature}|${p.brand}|${sortedStats}`;
      })
    );

    const results: ParsedPet[] = [];
    list.forEach((item, index) => {
      const parsed = parseSinglePet(item, index, existingSet);
      if (parsed) {
        results.push(parsed);
      }
    });

    if (results.length === 0) {
      setErrorMsg("未能解析出任何有效的精灵数据，请检查字段结构");
    } else {
      setParsedPets(results);
      setSuccessMsg(`成功导入并解析出 ${results.length} 只精灵！`);
    }
  };

  // 1. 直连本地 SQLite 数据库获取数据
  const handleSqliteFetch = async () => {
    if (!selectedUid) {
      setErrorMsg("请先选择要导入的游戏角色");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (window.electronAPI && window.electronAPI.getRocoPets) {
        const res = await window.electronAPI.getRocoPets(selectedUid);
        if (res.success && res.data) {
          // res.data 是 Array<{ id: number, data: any }> 结构，我们将 data 转换出来
          const petList = res.data.map((item: any) => ({
            ...item.data,
            id: item.id
          }));
          handleRawDataList(petList);
        } else {
          setErrorMsg(res.error || "读取角色宠物数据失败，请确保该角色有游戏数据。");
        }
      }
    } catch (err: any) {
      setErrorMsg(`读取数据库发生异常: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. 发起 API 请求
  const handleApiFetch = async () => {
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    setConnStatus('fetching');

    try {
      if (window.electronAPI && window.electronAPI.httpGet) {
        // Electron 桌面环境下，使用主进程代理转发，绕过 CORS
        const res = await window.electronAPI.httpGet(apiUrl);
        if (res.success) {
          setConnStatus('success');
          const raw = res.data;
          const list = Array.isArray(raw) ? raw : (raw.pets || raw.data || raw.list || []);
          handleRawDataList(list);
        } else {
          setConnStatus('error');
          setErrorMsg(res.error || "请求失败，请确保洛克王国世界助手正在后台运行且端口正确");
        }
      } else {
        // 普通网页端，降级直接 Fetch
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`HTTP 错误: ${res.status}`);
        const raw = await res.json();
        setConnStatus('success');
        const list = Array.isArray(raw) ? raw : (raw.pets || raw.data || raw.list || []);
        handleRawDataList(list);
      }
    } catch (err: any) {
      setConnStatus('error');
      setErrorMsg(`连接助手接口失败: ${err.message}。您可以切换至“文本粘贴”标签，直接粘贴宠物 JSON。`);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. 解析手动粘贴的 JSON 文本
  const handlePasteParse = () => {
    setErrorMsg("");
    setSuccessMsg("");
    
    if (!jsonText.trim()) {
      setErrorMsg("请输入或粘贴精灵 JSON 响应文本");
      return;
    }

    try {
      const raw = JSON.parse(jsonText);
      const list = Array.isArray(raw) ? raw : (raw.pets || raw.data || raw.list || []);
      handleRawDataList(list);
    } catch (e: any) {
      setErrorMsg(`JSON 格式解析错误: ${e.message}`);
    }
  };

  // 列表过滤与渲染
  const filteredPets = parsedPets.filter(pet => {
    // 1. 精灵名称搜索过滤
    if (searchTerm.trim() && !pet.sprite.includes(searchTerm.trim()) && !pet.name.includes(searchTerm.trim())) {
      return false;
    }
    // 2. 性别过滤
    if (filterGender !== "全部" && pet.gender !== filterGender) {
      return false;
    }
    // 3. 性格过滤 (子串包含匹配)
    if (filterNature !== "全部" && !pet.nature.includes(filterNature)) {
      return false;
    }
    // 4. 牌子与临近关系过滤
    if (filterBrand === "全部") {
      // 真正的全部精灵，不做任何限制，直接通过
    } else if (filterBrand === "全部达标牌子") {
      const allowedBrands = ["单大块头", "大粗", "大婉", "单小不点", "小粗", "小婉", "单粗嗓门", "单婉转声"];
      if (!allowedBrands.includes(pet.brand)) {
        return false;
      }
    } else if (filterBrand === "临近大块头") {
      if (!pet.isNearGiant) {
        return false;
      }
    } else if (filterBrand === "临近声音") {
      if (!pet.isNearVoice) {
        return false;
      }
    } else if (filterBrand === "大块头 + 临近声音") {
      const hasGiantBody = ["大粗", "大婉", "单大块头"].includes(pet.brand) || pet.isNearGiant;
      if (!hasGiantBody || !pet.isNearVoice) {
        return false;
      }
    } else if (filterBrand === "声音牌 + 临近大块头") {
      const hasVoiceBrand = ["大粗", "大婉", "单粗嗓门", "单婉转声", "小粗", "小婉"].includes(pet.brand);
      if (!hasVoiceBrand || !pet.isNearGiant) {
        return false;
      }
    } else {
      if (pet.brand !== filterBrand) {
        return false;
      }
    }
    // 5. 官方蛋组过滤
    if (filterGroup !== "全部" && !pet.groups.includes(filterGroup)) {
      return false;
    }
    return true;
  });

  const totalImportPages = Math.ceil(filteredPets.length / IMPORT_PAGE_SIZE);
  const visibleImportPets = filteredPets.slice(
    (importCurrentPage - 1) * IMPORT_PAGE_SIZE,
    importCurrentPage * IMPORT_PAGE_SIZE
  );

  const getImportPageNumbers = () => {
    const pages = [];
    if (totalImportPages <= 5) {
      for (let i = 1; i <= totalImportPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (importCurrentPage > 3) {
        pages.push("...");
      }
      const start = Math.max(2, importCurrentPage - 1);
      const end = Math.min(totalImportPages - 1, importCurrentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (importCurrentPage < totalImportPages - 2) {
        pages.push("...");
      }
      pages.push(totalImportPages);
    }
    return pages;
  };

  // 全选/反选 (使用 Set 优化可见性过滤时间复杂度至 O(N))
  const handleToggleAll = (checked: boolean) => {
    const visibleIds = new Set(filteredPets.map(p => p.uid));
    setParsedPets(prev => prev.map(p => {
      if (visibleIds.has(p.uid)) {
        return { ...p, selected: checked };
      }
      return p;
    }));
  };

  const handleToggleSelect = (uid: string) => {
    setParsedPets(prev => prev.map(p => {
      if (p.uid === uid) {
        return { ...p, selected: !p.selected };
      }
      return p;
    }));
  };

  // 一键导入
  const handleImportSubmit = () => {
    const selectedParsed = filteredPets.filter(p => p.selected);
    if (selectedParsed.length === 0) {
      alert("请至少选择一只精灵进行导入！");
      return;
    }

    const newParents: ParentPet[] = selectedParsed.map(p => {
      return {
        id: `parent-import-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        gender: p.gender,
        sprite: p.sprite,
        brand: p.brand,
        height: p.height,
        weight: p.weight,
        nature: p.nature,
        stats: p.stats,
        groups: p.groups,
        checked: false,
        voice: p.voice,
        position: p.position
      };
    });

    onImport(newParents);
  };

  // 状态呼吸灯样式
  const getStatusLightClass = () => {
    switch (connStatus) {
      case 'fetching': return 'bg-amber-400 animate-ping';
      case 'success': return 'bg-emerald-500';
      case 'error': return 'bg-rose-500';
      default: return 'bg-slate-350 dark:bg-slate-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden transition-all duration-300 transform scale-100">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
              📥
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">导入《洛克王国：世界》精灵盒子</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">免网卡抓包，一键同步本地盒子精灵父母本</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab & Sources Selection */}
        <div className="px-5 pt-4 pb-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex bg-slate-100 dark:bg-slate-950/60 p-1 rounded-lg border border-slate-200/60 dark:border-slate-800 shrink-0 w-fit">
            {window.electronAPI && window.electronAPI.getRocoUsers && (
              <button
                onClick={() => { setActiveTab("sqlite"); setErrorMsg(""); setSuccessMsg(""); }}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "sqlite"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                本地数据库直连
              </button>
            )}
            <button
              onClick={() => { setActiveTab("paste"); setErrorMsg(""); setSuccessMsg(""); }}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === "paste"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              手动粘贴 JSON
            </button>
          </div>

          <div className="flex-1 max-w-md">
            {activeTab === "sqlite" && (
              <div className="flex items-center gap-2 w-full justify-end">
                {rocoUsers.length > 0 ? (
                  <div className="flex items-center gap-2 w-full">
                    <div className="relative flex-1 flex items-center">
                      <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select
                        value={selectedUid}
                        onChange={(e) => setSelectedUid(e.target.value)}
                        className="w-full text-xs font-bold pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-850 dark:text-slate-100 appearance-none cursor-pointer"
                      >
                        {rocoUsers.map((u) => (
                          <option key={u.uid} value={u.uid}>
                            {u.name} ({u.uid})
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-2.5 text-[8px] text-slate-400 pointer-events-none">▼</span>
                    </div>
                    <button
                      onClick={handleSqliteFetch}
                      disabled={isLoading}
                      className="bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white font-bold text-xs px-4 py-1.8 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                      一键加载数据
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={loadSqliteUsers}
                    disabled={isLoading}
                    className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 font-bold text-xs px-3 py-1.5 rounded-md border border-indigo-200/40 dark:border-indigo-900/30 cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    重新检测本地数据
                  </button>
                )}
              </div>
            )}

            {activeTab === "paste" && (
              <div className="flex items-center gap-2 w-full justify-end">
                <button
                  onClick={handlePasteParse}
                  className="bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white font-bold text-xs px-4 py-1.8 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  解析并预览
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Display Area (Paste Box or Parsed List) */}
        <div className="flex-1 overflow-y-auto p-5 min-h-0 bg-slate-50/40 dark:bg-slate-950/20 flex flex-col gap-4">
          
          {/* Paste tab textarea */}
          {activeTab === "paste" && parsedPets.length === 0 && (
            <div className="flex-1 flex flex-col gap-2 min-h-[180px]">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">粘贴 JSON 数据：</label>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder='例如：[{"name":"喵喵","gender":1,"level":100,"nature":"固执","height":1.62,"weight":48.5,"talents":{"hp":31,"atk":31,"speed":31}}]'
                className="flex-1 w-full p-3 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 placeholder:text-slate-400"
              />
            </div>
          )}

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300 shadow-3xs">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && !errorMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 shadow-3xs">
              <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Parsed Pets List */}
          {parsedPets.length > 0 && (
            <div className="flex-1 flex flex-col min-h-0 gap-3">
              
              {/* Filter controls panel */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 shadow-sm shrink-0 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="搜索精灵名..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white focus:outline-none text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleAll(true)}
                      className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 font-bold text-xs px-2.5 py-1.5 rounded-md border border-indigo-200/40 dark:border-indigo-900/30 cursor-pointer"
                    >
                      全选可见
                    </button>
                    <button
                      onClick={() => handleToggleAll(false)}
                      className="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      清空选择
                    </button>
                  </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                {/* 4联智能下拉筛选栏 */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs font-bold text-slate-600 dark:text-slate-400 select-none">
                  {/* 性别筛选 */}
                  <SearchableSelect
                    label="性别筛选"
                    value={filterGender}
                    onChange={(val) => setFilterGender(val as any)}
                    options={["全部", "♂", "♀"]}
                    displayMap={{ "全部": "全部性别", "♂": "公 (♂)", "♀": "母 (♀)" }}
                    placeholder="输入 ♂ 或 公 检索..."
                  />

                  {/* 性格筛选 */}
                  <SearchableSelect
                    label="性格筛选"
                    value={filterNature}
                    onChange={(val) => setFilterNature(val)}
                    options={[
                      "全部",
                      "固执", "聪明", "胆小", "开朗", "急躁", "沉默", "平和", "踏实",
                      "逞强", "大胆", "调皮", "勇敢", "理性", "专注", "偏执", "冷静", "坦率", "稳重",
                      "天真", "懒散", "悠闲", "焦虑", "警惕", "害羞", "温顺", "慎重", "热情", "莽撞",
                      "忧郁", "粗心"
                    ]}
                    displayMap={{ "全部": "全部性格" }}
                    placeholder="搜索性格 (如：固执)..."
                  />

                  {/* 达标体型牌筛选 */}
                  <SearchableSelect
                    label="体型声音牌筛选"
                    value={filterBrand}
                    onChange={(val) => setFilterBrand(val)}
                    options={[
                      "全部", "全部达标牌子", "大粗", "大婉", "单大块头", "单粗嗓门", "单婉转声", "小粗", "小婉", "单小不点",
                      "临近大块头", "临近声音", "大块头 + 临近声音", "声音牌 + 临近大块头"
                    ]}
                    displayMap={{
                      "全部": "全部精灵",
                      "全部达标牌子": "全部达标牌子 ✨",
                      "大粗": "大粗 🧱",
                      "大婉": "大婉 🎵",
                      "单大块头": "单大块头",
                      "单粗嗓门": "单粗嗓门",
                      "单婉转声": "单婉转声",
                      "小粗": "小粗",
                      "小婉": "小婉",
                      "单小不点": "单小不点",
                      "临近大块头": "临近大块头",
                      "临近声音": "临近声音",
                      "大块头 + 临近声音": "大块头 + 临近声音",
                      "声音牌 + 临近大块头": "声音牌 + 临近大块头"
                    }}
                    placeholder="搜索体型声音牌..."
                  />

                  {/* 蛋组筛选 */}
                  <SearchableSelect
                    label="官方蛋组筛选"
                    value={filterGroup}
                    onChange={(val) => setFilterGroup(val)}
                    options={["全部", "两栖组", "动物组", "大地组", "天空组", "妖精组", "巨灵组", "拟人组", "昆虫组", "机械组", "植物组", "海洋组", "软体组", "魔力组", "龙组", "精灵组"]}
                    displayMap={{ "全部": "全部蛋组" }}
                    placeholder="搜索蛋组 (如：天空组)..."
                  />
                </div>
              </div>

              {/* Table list of pets */}
              <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm min-h-0 overflow-y-auto">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead className="bg-slate-50 dark:bg-slate-950/30 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
                    <tr className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      <th className="w-12 py-3 px-4 text-center">选择</th>
                      <th className="w-32 py-3 px-2">精灵</th>
                      <th className="w-16 py-3 px-2 text-center">性别</th>
                      <th className="w-44 py-3 px-2">性格</th>
                      <th className="w-32 py-3 px-2 text-center">体型声音牌</th>
                      <th className="w-24 py-3 px-2 text-center">位置</th>
                      <th className="w-24 py-3 px-2 text-center">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {visibleImportPets.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                          没有找到符合筛选条件的精灵数据
                        </td>
                      </tr>
                    ) : (
                      visibleImportPets.map((pet) => {
                        const spriteFile = getSpriteFileName(pet.sprite);
                        const spriteUrl = spriteFile ? getImagePath(`images/sprites/${spriteFile}`) : null;
                        const thresholds = getPetSizeThresholds(pet.sprite);

                        // 组装个体值展示徽章
                        const displayStats = pet.stats.filter(s => s !== "无");

                        return (
                          <tr
                            key={pet.uid}
                            onClick={() => handleToggleSelect(pet.uid)}
                            className={`hover:bg-slate-50/50 dark:hover:bg-slate-850/30 cursor-pointer text-xs transition-colors duration-150 ${
                              pet.selected
                                ? "bg-indigo-50/10 dark:bg-indigo-950/5"
                                : ""
                            }`}
                          >
                            {/* Checkbox column */}
                            <td className="py-2.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={pet.selected}
                                onChange={() => handleToggleSelect(pet.uid)}
                                className="rounded text-indigo-600 dark:text-indigo-400 focus:ring-indigo-400 dark:focus:ring-indigo-500 w-3.5 h-3.5 bg-white dark:bg-slate-800 border-slate-350 dark:border-slate-655 cursor-pointer"
                              />
                            </td>

                            {/* Sprite Name & Avatar */}
                            <td className="py-2.5 px-2 font-bold text-slate-800 dark:text-slate-200">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700/80 flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                                  {spriteUrl ? (
                                    <img src={spriteUrl} alt={pet.sprite} className="w-full h-full object-contain" />
                                  ) : (
                                    <span className="text-[10px]">🧬</span>
                                  )}
                                </div>
                                <span className="truncate" title={pet.sprite}>{pet.sprite}</span>
                              </div>
                            </td>

                            {/* Gender */}
                            <td className="py-2.5 px-2 text-center">
                              {pet.gender === "♂" ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 shrink-0 select-none">
                                  <Mars className="w-2.5 h-2.5 text-blue-500" />
                                  公
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-pink-50 dark:bg-pink-950 text-pink-650 dark:text-pink-400 border border-pink-200/50 dark:border-pink-900/30 shrink-0 select-none">
                                  <Venus className="w-2.5 h-2.5 text-pink-500" />
                                  母
                                </span>
                              )}
                            </td>

                            {/* Nature */}
                            <td className="py-2.5 px-2 font-bold text-slate-700 dark:text-slate-300">
                              {pet.nature === "错性格" ? (
                                <span className="text-slate-400 dark:text-slate-500 font-medium">错性格</span>
                              ) : (
                                <span className={pet.nature.includes("平衡") ? "text-slate-400 dark:text-slate-500 font-medium" : "text-emerald-600 dark:text-emerald-400"}>
                                  {pet.nature}
                                </span>
                              )}
                            </td>

                            {/* Brand & Size */}
                            <td className="py-2.5 px-2 text-center">
                              <div className="flex flex-col gap-0.5">
                                <span className={`font-extrabold text-[11px] ${
                                  ["大粗", "大婉", "单大块头"].includes(pet.brand) 
                                    ? "text-indigo-600 dark:text-indigo-400 font-sans" 
                                    : ["小粗", "小婉", "单小不点"].includes(pet.brand)
                                    ? "text-amber-600 dark:text-amber-500 font-sans"
                                    : "text-slate-750 dark:text-slate-300 font-sans"
                                }`}>
                                  {pet.brand}
                                </span>
                                {pet.height && pet.weight && (
                                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium select-none">
                                    {pet.height}m / {pet.weight}kg
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Position */}
                            <td className="py-2.5 px-2 text-center text-slate-650 dark:text-slate-400 select-none">
                              {pet.position && pet.position !== "-" ? (
                                <div className="flex flex-col gap-0.5 font-bold leading-tight text-[10px]">
                                  <span className="text-indigo-600 dark:text-indigo-400">{pet.position.split('\n')[0]}</span>
                                  {pet.position.split('\n')[1] && (
                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">{pet.position.split('\n')[1]}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-600 font-medium">-</span>
                              )}
                            </td>

                            {/* Duplicate status badge */}
                            <td className="py-2.5 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                              {pet.isDuplicate ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200/40 dark:border-amber-900/30 text-[9px] font-extrabold select-none">
                                  已在库中
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 border border-teal-200/40 dark:border-teal-900/30 text-[9px] font-extrabold select-none">
                                  新加入
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* 导入分页控制器 */}
              {totalImportPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 px-1 border-t border-slate-100 dark:border-slate-800 shrink-0">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium select-none text-left">
                    共 <span className="font-bold font-mono text-slate-700 dark:text-slate-300">{filteredPets.length}</span> 只精灵，
                    当前展示第 <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">{(importCurrentPage - 1) * IMPORT_PAGE_SIZE + 1}-{Math.min(importCurrentPage * IMPORT_PAGE_SIZE, filteredPets.length)}</span> 只
                  </div>
                  <div className="flex items-center gap-1.5 select-none">
                    <button
                      onClick={() => setImportCurrentPage(1)}
                      disabled={importCurrentPage === 1}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-305 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed text-xs font-semibold"
                    >
                      首页
                    </button>
                    <button
                      onClick={() => setImportCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={importCurrentPage === 1}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      上一页
                    </button>
                    <div className="flex items-center gap-1">
                      {getImportPageNumbers().map((pageNum, idx) => {
                        if (pageNum === "...") {
                          return (
                            <span key={`import-dots-${idx}`} className="px-1 text-slate-400 font-bold text-xs">
                              ...
                            </span>
                          );
                        }
                        return (
                          <button
                            key={`import-page-${pageNum}`}
                            onClick={() => setImportCurrentPage(Number(pageNum))}
                            className={`w-7 h-7 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center ${
                              importCurrentPage === pageNum
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 border border-indigo-600"
                                : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-305 hover:bg-slate-50 dark:hover:bg-slate-700"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setImportCurrentPage(prev => Math.min(totalImportPages, prev + 1))}
                      disabled={importCurrentPage === totalImportPages}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1"
                    >
                      下一页
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setImportCurrentPage(totalImportPages)}
                      disabled={importCurrentPage === totalImportPages}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-305 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed text-xs font-semibold"
                    >
                      末页
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Intro Screen when no data is parsed yet */}
          {parsedPets.length === 0 && (
            <div className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/30 flex items-center justify-center text-3xl shadow-inner select-none mb-3">
                🧬
              </div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">暂无载入的精灵数据</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mt-1">
                {activeTab === "sqlite" && "系统已成功检测到本机的 1 个洛克助手本地数据库！请在上方下拉选择您的角色并点击“一键加载数据”。"}
                {activeTab === "api" && "请启动《洛克王国：世界》助手程序，在右侧填入您的本地监听 API 地址，然后点击“同步精灵”按钮一键拉取本地盒子宠物数据！"}
                {activeTab === "paste" && "请打开洛克助手网页，在宠物盒子筛选页面按 F12 复制获取到的精灵 JSON 响应列表，粘贴到上方输入框中点击解析并预览。"}
              </p>
              
              <div className="mt-5 p-3 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-200/50 dark:border-slate-800 max-w-md text-left text-[11px] text-slate-500 dark:text-slate-400">
                <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-indigo-500" />
                  智能映射字段规范支持说明
                </div>
                <span>
                  本系统将自动识别数据包中的 <strong>等级、性别、性格名称/ID、身高体重（自动纠偏厘米和克单位）</strong>；对于 <strong>3V 属性</strong>，如果精灵个体值天赋（talents/stats）或 `attribute_info` 某项数据等于最大值 <strong>31</strong>，系统会自动匹配该属性为 V 项并归入父母本仓储。
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 dark:text-slate-500 font-semibold select-none">
            {parsedPets.length > 0 && (
              <span>
                已选择 <strong className="text-indigo-600 dark:text-indigo-400">{filteredPets.filter(p => p.selected).length}</strong> / {filteredPets.length} 只精灵 (排除 {parsedPets.length - filteredPets.length} 只)
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-250 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs rounded-xl text-slate-700 dark:text-slate-350 cursor-pointer shadow-3xs hover:shadow-2xs transition-all"
            >
              取消
            </button>
            <button
              onClick={handleImportSubmit}
              disabled={parsedPets.length === 0 || filteredPets.filter(p => p.selected).length === 0}
              className="bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-650 disabled:cursor-not-allowed text-white font-extrabold text-xs px-5 py-2.2 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              一键导入所选父母本 ({parsedPets.length > 0 ? filteredPets.filter(p => p.selected).length : 0} 只)
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
