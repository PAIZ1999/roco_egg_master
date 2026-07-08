import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Egg,
  Sparkles,
  Plus,
  RefreshCw,
  Search,
  Upload,
  Share2,
  X,
  Check,
  AlertCircle,
  Clipboard,
  Download,
  Camera,
  Settings,
  Filter,
  Trash2,
  Database,
  LayoutGrid,
  Zap,
  Award,
  Users,
  Dna,
  Info,
  Heart,
  ExternalLink,
  Sun,
  Moon,
  Ruler,
  Weight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Calendar,
  Table,
  Minus
} from "lucide-react";
import html2canvas from "html2canvas-pro";
import {
  EggPet,
  ParentPet,
  NATURE_OPTIONS,
  EGG_GROUPS,
  BRAND_OPTIONS,
  NEST_STATUS_OPTIONS,
  INITIAL_TABLE_DATA,
  LIMIT_OPTIONS,
  THREE_V_OPTIONS,
  STATS_OPTIONS,
  EggTrade,
  cleanNature,
  Account,
  AccountData
} from "./types";
import { EggCard } from "./components/EggCard";
import { EggData } from "./types";
import { getEggConfig, getEggSizeThresholds, formatHatchTime, getEggStatusType, isEgg3V, getLowestStageName } from "./petHelper";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableCard } from "./components/SortableCard";
import { ParentCard } from "./components/ParentCard";
import { RocoImportModal } from "./components/RocoImportModal";
import { Autocomplete } from "./components/Autocomplete";
import { WarehouseStatsTable } from "./components/WarehouseStatsTable";
import {
  getPetDetails,
  ALL_PET_NAMES,
  getSpriteFileName,
  getImagePath,
  getBrandStyle,
  getEggGroupStyle,
  getStatusStyle,
  getAvailableSprites,
  getBasePetName,
  getSpriteFormDisplayName,
  getPetGuideSize,
  getPetSizeThresholds,
  getStatBadgeStyle
} from "./petHelper";
import { getPinyinInitials } from "./pinyin";



const migratePets = (rawList: any[]): EggPet[] => {
  return rawList.map((p, index) => {
    let fatherNatures = p.fatherNatures || p.natures || [""];
    let motherNatures = p.motherNatures || [""];
    const fatherStats = p.fatherStats || ["生命", "物攻", "速度"];
    const motherStats = p.motherStats || ["生命", "物攻", "速度"];

    if (!Array.isArray(fatherNatures)) {
      fatherNatures = [fatherNatures];
    }
    if (!Array.isArray(motherNatures)) {
      motherNatures = [motherNatures];
    }

    const cleanFatherNatures = fatherNatures.map((n: any) => cleanNature(typeof n === "string" ? n : String(n)));
    const cleanMotherNatures = motherNatures.map((n: any) => cleanNature(typeof n === "string" ? n : String(n)));

    return {
      ...p,
      id: p.id || `pet-init-${index}-${Math.random().toString(36).substr(2, 5)}`,
      fatherNatures: cleanFatherNatures,
      motherNatures: cleanMotherNatures,
      fatherStats: Array.isArray(fatherStats) ? fatherStats : ["生命", "物攻", "速度"],
      motherStats: Array.isArray(motherStats) ? motherStats : ["生命", "物攻", "速度"],
      sprite: p.sprite || "",
      groups: p.groups || [EGG_GROUPS[0]],
      brand: p.brand || BRAND_OPTIONS[0],
      status: p.status === "已撤窝，要提前换产线" ? "已撤窝" : (p.status || NEST_STATUS_OPTIONS[0]),
      isLimit: p.isLimit === "是" || p.isLimit === "极限" || p.isLimit === "有极限蛋" ? "有极限蛋" : "无极限蛋",
      is3V: p.is3V === "是" ? "3V" : (p.is3V === "" || !p.is3V ? "否" : p.is3V),
      hideStats: !!p.hideStats,
      eggCount: p.eggCount || "1"
    };
  });
};

const migrateTrades = (rawList: any[]): EggTrade[] => {
  return rawList.map((t, index) => {
    return {
      ...t,
      id: t.id || `trade-${index}-${Math.random().toString(36).substr(2, 5)}`,
      nature: cleanNature(t.nature || "实干 (平衡)"),
      sprite: t.sprite || "",
      brand: t.brand || "单大块头",
      is3V: !!t.is3V,
      isLimit: !!t.isLimit,
      tradeType: t.tradeType || "1换1",
      notes: t.notes || ""
    };
  });
};

const EGG_PAGE_SIZE = 6;

export default function App() {
  // 主题状态（亮/暗色模式）
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 多账号核心状态
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string>("");
  const [accountDataMap, setAccountDataMap] = useState<Record<string, AccountData>>({});
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [newAccUid, setNewAccUid] = useState("");
  const [newAccNickname, setNewAccNickname] = useState("");
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingNickname, setEditingNickname] = useState("");
  const [editingUid, setEditingUid] = useState("");

  const lastActiveAccountIdRef = useRef(activeAccountId);

  // 自定义二次确认弹窗状态
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };
  
  // 导入导出管理状态
  const [exportType, setExportType] = useState<"single" | "all" | "nest" | "parents" | "eggs">("single");
  const [importContext, setImportContext] = useState<"global" | "nest" | "parents" | "eggs">("global");
  const [pendingImportData, setPendingImportData] = useState<any>(null);
  const [importInfoText, setImportInfoText] = useState("");
  const [importConfirmType, setImportConfirmType] = useState<"none" | "single" | "multi">("none");
  const [importAsNewNickname, setImportAsNewNickname] = useState("");
  const [importAsNewUid, setImportAsNewUid] = useState("");

  // Persistence state
  const [pets, setPets] = useState<EggPet[]>(() => {
    const saved = localStorage.getItem("roco_egg_data_v2");
    let loaded: EggPet[] = [];
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as EggPet[];
        loaded = migratePets(parsed);
      } catch (e) {
        loaded = migratePets(INITIAL_TABLE_DATA);
      }
    } else {
      loaded = migratePets(INITIAL_TABLE_DATA);
    }
    return loaded;
  });

  const [trades, setTrades] = useState<EggTrade[]>(() => {
    const saved = localStorage.getItem("roco_egg_trades_v1");
    if (saved) {
      try {
        return migrateTrades(JSON.parse(saved));
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [parents, setParents] = useState<ParentPet[]>(() => {
    const saved = localStorage.getItem("roco_egg_parents_v1");
    if (saved) {
      try {
        return JSON.parse(saved) as ParentPet[];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<"nest" | "parents" | "eggs">("nest");
  const [eggs, setEggs] = useState<EggData[]>(() => {
    const saved = localStorage.getItem("roco_egg_eggs_v1");
    if (saved) {
      try {
        return JSON.parse(saved) as EggData[];
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [eggSearchTerm, setEggSearchTerm] = useState("");
  const [eggFilterGroup, setEggFilterGroup] = useState("");
  const [eggFilterBrand, setEggFilterBrand] = useState("");
  const [eggFilterLimit, setEggFilterLimit] = useState("");
  const [eggFilter3V, setEggFilter3V] = useState("");
  const [eggCurrentPage, setEggCurrentPage] = useState(1);

  // Parent Filter states (Fathers & Mothers separately)
  const [fatherSearchTerm, setFatherSearchTerm] = useState("");
  const [fatherFilterGroup, setFatherFilterGroup] = useState("");
  const [fatherFilterBrand, setFatherFilterBrand] = useState("");
  const [fatherNatureSearch, setFatherNatureSearch] = useState("");

  const [motherSearchTerm, setMotherSearchTerm] = useState("");
  const [motherFilterGroup, setMotherFilterGroup] = useState("");
  const [motherFilterBrand, setMotherFilterBrand] = useState("");
  const [motherNatureSearch, setMotherNatureSearch] = useState("");

  // Tab reset target state
  const [resetTabTarget, setResetTabTarget] = useState<"nest" | "parents" | "eggs" | null>(null);

  // 分页设置与状态（大容量卡片展示性能优化）
  const [fatherCurrentPage, setFatherCurrentPage] = useState(1);
  const [motherCurrentPage, setMotherCurrentPage] = useState(1);
  const [nestCurrentPage, setNestCurrentPage] = useState(1);
  const [nestViewMode, setNestViewMode] = useState<"card" | "table">(() => {
    const saved = localStorage.getItem("roco_egg_nest_view_mode");
    return (saved === "table" || saved === "card") ? saved : "card";
  });

  useEffect(() => {
    localStorage.setItem("roco_egg_nest_view_mode", nestViewMode);
  }, [nestViewMode]);

  const [fatherViewMode, setFatherViewMode] = useState<"card" | "table">(() => {
    const saved = localStorage.getItem("roco_egg_father_view_mode");
    return (saved === "table" || saved === "card") ? saved : "card";
  });

  useEffect(() => {
    localStorage.setItem("roco_egg_father_view_mode", fatherViewMode);
  }, [fatherViewMode]);

  const [motherViewMode, setMotherViewMode] = useState<"card" | "table">(() => {
    const saved = localStorage.getItem("roco_egg_mother_view_mode");
    return (saved === "table" || saved === "card") ? saved : "card";
  });

  useEffect(() => {
    localStorage.setItem("roco_egg_mother_view_mode", motherViewMode);
  }, [motherViewMode]);

  const PARENT_PAGE_SIZE = 10;
  const NEST_PAGE_SIZE = nestViewMode === "table" ? 50 : 9;

  // Egg Modal Form states
  const [showEggModal, setShowEggModal] = useState(false);
  const [editingEggId, setEditingEggId] = useState<string | null>(null);
  const [eggFormSprite, setEggFormSprite] = useState("");
  const [eggFormFatherNature, setEggFormFatherNature] = useState("");
  const [eggFormMotherNature, setEggFormMotherNature] = useState("");
  const [eggFormFatherStats, setEggFormFatherStats] = useState<string[]>(["无", "无", "无"]);
  const [eggFormMotherStats, setEggFormMotherStats] = useState<string[]>(["无", "无", "无"]);
  const [eggFormBrand, setEggFormBrand] = useState("普通");
  const [eggFormSize, setEggFormSize] = useState("");
  const [eggFormWeight, setEggFormWeight] = useState("");
  const [eggFormProduceTime, setEggFormProduceTime] = useState("");
  const [excludedPairKeys, setExcludedPairKeys] = useState<Set<string>>(new Set());
  const [showRocoImportModal, setShowRocoImportModal] = useState(false);
  // 配对中心筛选状态
  const [pairingFilterName, setPairingFilterName] = useState("");
  const [pairingFilterGroup, setPairingFilterGroup] = useState("");
  const [pairingFilterBrand, setPairingFilterBrand] = useState("");
  const [pairingFilter3V, setPairingFilter3V] = useState(""); // "" | "3V" | "非3V"
  const [pairingFilterSameNature, setPairingFilterSameNature] = useState(false);
  const [pairingFilterNature, setPairingFilterNature] = useState(""); // 性格过滤
  const [activeFatherIndices, setActiveFatherIndices] = useState<Record<string, number>>({});
  const [filterSameNature, setFilterSameNature] = useState(false); // 蛋窝父母同性格
  const [isExporting, setIsExporting] = useState(false); // 是否正在导出长图

  // Egg trade form states
  const [newTradeSprite, setNewTradeSprite] = useState("");
  const [newTradeNature, setNewTradeNature] = useState("");
  const [newTradeBrand, setNewTradeBrand] = useState("单大块头");
  const [newTradeIs3V, setNewTradeIs3V] = useState(false);
  const [newTradeIsLimit, setNewTradeIsLimit] = useState(false);

  const [newTradeNotes, setNewTradeNotes] = useState("");

  // Configure dnd-kit sensors with distance activation constraint
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Avoids block-clicks; click works normally unless dragged 8px
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,    // 长按 250ms 以上才触发拖拽
        tolerance: 5,  // 允许移动的偏差在 5px 以内，超出则判定为普通滚动
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleEggDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = eggs.findIndex((e) => e.id === active.id);
    const newIndex = eggs.findIndex((e) => e.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      setEggs((prev) => arrayMove(prev, oldIndex, newIndex));
    }
  };

  const handleFatherDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = parents.findIndex((p) => p.id === active.id);
    const newIndex = parents.findIndex((p) => p.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      setParents((prev) => arrayMove(prev, oldIndex, newIndex));
    }
  };

  const handleMotherDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = parents.findIndex((p) => p.id === active.id);
    const newIndex = parents.findIndex((p) => p.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      setParents((prev) => arrayMove(prev, oldIndex, newIndex));
    }
  };

  // Filter conditions
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNature, setFilterNature] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterLimit, setFilterLimit] = useState("");
  const [filter3V, setFilter3V] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Custom visual enhancement states
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [activeModal, setActiveModal] = useState<"none" | "reset" | "import" | "export" | "image-preview">("none");
  const [jsonText, setJsonText] = useState("");
  const [importError, setImportError] = useState("");
  const [exportedImageUrl, setExportedImageUrl] = useState("");

  // Watermark States & Settings
  const [showWatermarkPanel, setShowWatermarkPanel] = useState<boolean>(() => {
    return localStorage.getItem("roco_watermark_panel_open") === "true";
  });
  const [enableWatermark, setEnableWatermark] = useState<boolean>(() => {
    const saved = localStorage.getItem("roco_watermark_enabled");
    return saved !== null ? saved === "true" : true;
  });
  const [watermarkText, setWatermarkText] = useState<string>(() => {
    return localStorage.getItem("roco_watermark_text") || "洛克王国孵蛋数据管理";
  });
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(() => {
    const saved = localStorage.getItem("roco_watermark_opacity");
    return saved !== null ? parseFloat(saved) : 0.12;
  });
  const [watermarkDensity, setWatermarkDensity] = useState<"dense" | "normal" | "sparse">(() => {
    return (localStorage.getItem("roco_watermark_density") as any) || "normal";
  });
  const [watermarkSize, setWatermarkSize] = useState<number>(() => {
    const saved = localStorage.getItem("roco_watermark_size");
    return saved !== null ? parseInt(saved) : 13;
  });

  // Auto-save tracker feedback
  const [lastSaved, setLastSaved] = useState<string>(() => {
    const now = new Date();
    return now.toTimeString().split(" ")[0];
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [localSavePath, setLocalSavePath] = useState<string>("");

  // 复制卡片数据功能相关的状态
  const [selectedCard, setSelectedCard] = useState<{ id: string; type: "nest" | "parent" | "egg" } | null>(null);
  const [hoveredCard, setHoveredCard] = useState<{ id: string; type: "nest" | "parent" | "egg" } | null>(null);
  const copiedCardRef = useRef<{ type: "nest" | "parent" | "egg"; data: any } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
  };

  const handleChangeSavePath = async () => {
    if (window.electronAPI && window.electronAPI.selectSavePath) {
      try {
        const currentData = {
          pets,
          trades,
          parents,
          eggs,
          settings: {
            showWatermarkPanel,
            enableWatermark,
            watermarkText,
            watermarkOpacity,
            watermarkDensity,
            watermarkSize
          }
        };
        const result = await window.electronAPI.selectSavePath(currentData);
        if (result) {
          setLocalSavePath(result.path);
          if (result.data) {
            // A data file existed in that directory, we load it into state
            if (Array.isArray(result.data.pets)) {
              setPets(migratePets(result.data.pets));
            }
            if (Array.isArray(result.data.trades)) {
              setTrades(migrateTrades(result.data.trades));
            }
            if (Array.isArray(result.data.parents)) {
              setParents(result.data.parents);
            }
            if (Array.isArray(result.data.eggs)) {
              setEggs(result.data.eggs);
            }
            if (result.data.settings) {
              const s = result.data.settings;
              if (s.showWatermarkPanel !== undefined) setShowWatermarkPanel(s.showWatermarkPanel);
              if (s.enableWatermark !== undefined) setEnableWatermark(s.enableWatermark);
              if (s.watermarkText !== undefined) setWatermarkText(s.watermarkText);
              if (s.watermarkOpacity !== undefined) setWatermarkOpacity(s.watermarkOpacity);
              if (s.watermarkDensity !== undefined) setWatermarkDensity(s.watermarkDensity);
              if (s.watermarkSize !== undefined) setWatermarkSize(s.watermarkSize);
            }
            showToast("已成功载入该自定义路径下的数据！", "success");
          } else {
            showToast("成功修改自动保存路径为当前文件夹！", "success");
          }
        }
      } catch (err) {
        console.error("修改存储路径失败:", err);
        showToast("修改存储路径失败", "error");
      }
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load data from Electron local file on mount
  useEffect(() => {
    const loadLocalData = async () => {
      if (window.electronAPI) {
        try {
          const loadedData = await window.electronAPI.loadData();
          if (loadedData) {
            if (Array.isArray(loadedData.accounts) && loadedData.accounts.length > 0) {
              setAccounts(loadedData.accounts);
              const activeId = loadedData.activeAccountId || loadedData.accounts[0].id;
              setActiveAccountId(activeId);
              setAccountDataMap(loadedData.accountDataMap || {});
              
              // 装载激活账号的数据
              const activeData = (loadedData.accountDataMap && loadedData.accountDataMap[activeId]) || { pets: [], trades: [], parents: [], eggs: [] };
              setPets(migratePets(activeData.pets || []));
              setTrades(migrateTrades(activeData.trades || []));
              setParents(activeData.parents || []);
              setEggs(activeData.eggs || []);
            } else if (Array.isArray(loadedData.pets)) {
              // 兼容老旧单账号数据
              const defaultAccount: Account = { id: "default", uid: "default", nickname: "默认账号" };
              const defaultData: AccountData = {
                pets: migratePets(loadedData.pets),
                trades: migrateTrades(loadedData.trades || []),
                parents: loadedData.parents || [],
                eggs: loadedData.eggs || []
              };
              setAccounts([defaultAccount]);
              setActiveAccountId("default");
              setAccountDataMap({ "default": defaultData });
              setPets(defaultData.pets);
              setTrades(defaultData.trades);
              setParents(defaultData.parents);
              setEggs(defaultData.eggs);
            } else {
              // 空数据初始化
              const defaultAccount: Account = { id: "default", uid: "default", nickname: "默认账号" };
              const defaultData: AccountData = {
                pets: migratePets(INITIAL_TABLE_DATA),
                trades: [],
                parents: [],
                eggs: []
              };
              setAccounts([defaultAccount]);
              setActiveAccountId("default");
              setAccountDataMap({ "default": defaultData });
              setPets(defaultData.pets);
              setTrades(defaultData.trades);
              setParents(defaultData.parents);
              setEggs(defaultData.eggs);
            }

            if (loadedData.settings) {
              const s = loadedData.settings;
              if (s.showWatermarkPanel !== undefined) setShowWatermarkPanel(s.showWatermarkPanel);
              if (s.enableWatermark !== undefined) setEnableWatermark(s.enableWatermark);
              if (s.watermarkText !== undefined) setWatermarkText(s.watermarkText);
              if (s.watermarkOpacity !== undefined) setWatermarkOpacity(s.watermarkOpacity);
              if (s.watermarkDensity !== undefined) setWatermarkDensity(s.watermarkDensity);
              if (s.watermarkSize !== undefined) setWatermarkSize(s.watermarkSize);
            }
            showToast("已成功从本地文件夹加载数据！", "success");
          }
          const actualPath = await window.electronAPI.getDataPath();
          setLocalSavePath(actualPath);
        } catch (err) {
          console.error("加载本地文件失败，回退到浏览器缓存:", err);
          setupBrowserFallback();
        } finally {
          setIsLoaded(true);
        }
      } else {
        setupBrowserFallback();
        setIsLoaded(true);
      }
    };

    const setupBrowserFallback = () => {
      const savedAccountsStr = localStorage.getItem("roco_accounts_v1");
      const savedActiveId = localStorage.getItem("roco_active_account_id_v1");
      const savedDataMapStr = localStorage.getItem("roco_account_data_map_v1");
      
      if (savedAccountsStr && savedActiveId && savedDataMapStr) {
        try {
          const parsedAccounts = JSON.parse(savedAccountsStr) as Account[];
          const parsedActiveId = savedActiveId;
          const parsedDataMap = JSON.parse(savedDataMapStr) as Record<string, AccountData>;
          
          setAccounts(parsedAccounts);
          setActiveAccountId(parsedActiveId);
          setAccountDataMap(parsedDataMap);
          
          const activeData = parsedDataMap[parsedActiveId] || { pets: [], trades: [], parents: [], eggs: [] };
          setPets(migratePets(activeData.pets));
          setTrades(migrateTrades(activeData.trades));
          setParents(activeData.parents || []);
          setEggs(activeData.eggs || []);
          return;
        } catch (e) {
          console.error("解析浏览器多账号失败:", e);
        }
      }

      // 迁移老旧单账号浏览器数据
      const savedPets = localStorage.getItem("roco_egg_data_v2");
      const savedTrades = localStorage.getItem("roco_egg_trades_v1");
      const savedParents = localStorage.getItem("roco_egg_parents_v1");
      const savedEggs = localStorage.getItem("roco_egg_eggs_v1");
      
      const defaultAccount: Account = { id: "default", uid: "default", nickname: "默认账号" };
      let initialPets = migratePets(INITIAL_TABLE_DATA);
      let initialTrades: EggTrade[] = [];
      let initialParents: ParentPet[] = [];
      let initialEggs: EggData[] = [];
      
      if (savedPets) {
        try { initialPets = migratePets(JSON.parse(savedPets)); } catch(e){}
      }
      if (savedTrades) {
        try { initialTrades = migrateTrades(JSON.parse(savedTrades)); } catch(e){}
      }
      if (savedParents) {
        try { initialParents = JSON.parse(savedParents); } catch(e){}
      }
      if (savedEggs) {
        try { initialEggs = JSON.parse(savedEggs); } catch(e){}
      }
      
      const defaultData: AccountData = { pets: initialPets, trades: initialTrades, parents: initialParents, eggs: initialEggs };
      setAccounts([defaultAccount]);
      setActiveAccountId("default");
      setAccountDataMap({ "default": defaultData });
      setPets(defaultData.pets);
      setTrades(defaultData.trades);
      setParents(defaultData.parents);
      setEggs(defaultData.eggs);
    };

    loadLocalData();
  }, []);

  // 1. 用 Ref 追踪最新的保存数据状态，避免防抖闭包获取到旧状态
  const autoSaveDataRef = useRef({
    pets, trades, parents, eggs,
    accounts, activeAccountId, accountDataMap,
    showWatermarkPanel, enableWatermark, watermarkText, watermarkOpacity, watermarkDensity, watermarkSize,
    isLoaded
  });

  useEffect(() => {
    autoSaveDataRef.current = {
      pets, trades, parents, eggs,
      accounts, activeAccountId, accountDataMap,
      showWatermarkPanel, enableWatermark, watermarkText, watermarkOpacity, watermarkDensity, watermarkSize,
      isLoaded
    };
  }, [
    pets, trades, parents, eggs,
    accounts, activeAccountId, accountDataMap,
    showWatermarkPanel, enableWatermark, watermarkText, watermarkOpacity, watermarkDensity, watermarkSize,
    isLoaded
  ]);

  // 2. 声明一个保存执行器函数，可以在防抖定时器到期时执行，也可以在 beforeunload 触发时立即执行
  const executeSave = useCallback(() => {
    const state = autoSaveDataRef.current;
    if (!state.isLoaded || !state.activeAccountId) return;

    // 强校验：如果当前 activeAccountId 在 accounts 列表中已不存在，说明该账号已经被删除，绝对不保存！
    if (!state.accounts.some(a => a.id === state.activeAccountId)) {
      return;
    }

    const mergedDataMap = {
      ...state.accountDataMap,
      [state.activeAccountId]: { pets: state.pets, trades: state.trades, parents: state.parents, eggs: state.eggs }
    };

    localStorage.setItem("roco_accounts_v1", JSON.stringify(state.accounts));
    localStorage.setItem("roco_active_account_id_v1", state.activeAccountId);
    localStorage.setItem("roco_account_data_map_v1", JSON.stringify(mergedDataMap));
    
    // 同时也保留单账号缓存以备不时之需（兼容老代码可能的加载）
    localStorage.setItem("roco_egg_data_v2", JSON.stringify(state.pets));
    localStorage.setItem("roco_egg_trades_v1", JSON.stringify(state.trades));
    localStorage.setItem("roco_egg_parents_v1", JSON.stringify(state.parents));
    localStorage.setItem("roco_egg_eggs_v1", JSON.stringify(state.eggs));

    localStorage.setItem("roco_watermark_panel_open", String(state.showWatermarkPanel));
    localStorage.setItem("roco_watermark_enabled", String(state.enableWatermark));
    localStorage.setItem("roco_watermark_text", state.watermarkText);
    localStorage.setItem("roco_watermark_opacity", String(state.watermarkOpacity));
    localStorage.setItem("roco_watermark_density", state.watermarkDensity);
    localStorage.setItem("roco_watermark_size", String(state.watermarkSize));

    if (window.electronAPI) {
      window.electronAPI.saveData({
        accounts: state.accounts,
        activeAccountId: state.activeAccountId,
        accountDataMap: mergedDataMap,
        settings: {
          showWatermarkPanel: state.showWatermarkPanel,
          enableWatermark: state.enableWatermark,
          watermarkText: state.watermarkText,
          watermarkOpacity: state.watermarkOpacity,
          watermarkDensity: state.watermarkDensity,
          watermarkSize: state.watermarkSize
        }
      }).then((res) => {
        if (res && res.success) {
          setLocalSavePath(res.path);
        }
      }).catch((e) => {
        console.error("自动保存到本地文件失败:", e);
      });
    }

    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    setLastSaved(timeStr);
  }, []);

  // 3. 用 useEffect 来实现防抖自动保存
  useEffect(() => {
    if (!isLoaded || !activeAccountId) return;

    // 账号切换拦截：如果 activeAccountId 改变，说明正在切换账号。
    // 这时我们仅同步 ref 值并退出，不做保存，避免将旧账号的数据覆写到新账号上！
    if (lastActiveAccountIdRef.current !== activeAccountId) {
      lastActiveAccountIdRef.current = activeAccountId;
      return;
    }

    setIsSaving(true);

    // 500ms 后物理执行保存
    const saveTimer = setTimeout(() => {
      executeSave();
      
      // 保存完成 600ms 后，把 "正在保存" 的动画灭灯
      const statusTimer = setTimeout(() => {
        setIsSaving(false);
      }, 600);
      return () => clearTimeout(statusTimer);
    }, 500);

    return () => clearTimeout(saveTimer);
  }, [
    pets, trades, parents, eggs, 
    accounts, activeAccountId, accountDataMap,
    showWatermarkPanel, enableWatermark, watermarkText, watermarkOpacity, watermarkDensity, watermarkSize, 
    isLoaded, executeSave
  ]);

  // 4. 监听 beforeunload 确保页面关闭前一定进行同步物理存盘
  useEffect(() => {
    const handleBeforeUnload = () => {
      executeSave();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [executeSave]);

  // 跨类型卡片数据映射逻辑
  const mapCardData = (sourceType: "nest" | "parent" | "egg", targetType: "nest" | "parent" | "egg", sourceData: any, targetGender?: "♂" | "♀") => {
    // 1. 深度克隆数据源，斩断引用共享
    const dataCopy = JSON.parse(JSON.stringify(sourceData));
    
    // 2. 必须移除原卡片的 id，避免覆盖目标卡片的 ID 或产生重复的 ID 冲突
    delete dataCopy.id;

    if (sourceType === targetType) {
      // 相同类型，返回除去 id 的克隆对象（如果目标是父母本，额外修正其性别 gender 字段）
      if (targetType === "parent" && targetGender) {
        dataCopy.gender = targetGender;
      }
      return dataCopy;
    }

    if (sourceType === "nest") {
      // 蛋窝 EggPet -> 父母本 ParentPet
      if (targetType === "parent") {
        const gender = targetGender || "♀";
        const details = getPetDetails(dataCopy.sprite);
        return {
          sprite: gender === "♂" ? (dataCopy.fatherName || dataCopy.sprite) : (dataCopy.motherName || dataCopy.sprite),
          nature: gender === "♂" ? (dataCopy.fatherNatures?.[0] || "") : (dataCopy.motherNatures?.[0] || ""),
          stats: gender === "♂" ? [...(dataCopy.fatherStats || ["生命", "物攻", "速度"])] : [...(dataCopy.motherStats || ["生命", "物攻", "速度"])],
          brand: dataCopy.brand,
          groups: details ? [...details.groups] : [...dataCopy.groups],
          height: "",
          weight: ""
        };
      }
      // 蛋窝 EggPet -> 精灵蛋 EggData
      if (targetType === "egg") {
        const lowestName = getLowestStageName(dataCopy.sprite);
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localISODate = (new Date(now.getTime() - offset)).toISOString().slice(0, 10);
        return {
          sprite: lowestName,
          fatherNature: dataCopy.fatherNatures?.[0] || "",
          motherNature: dataCopy.motherNatures?.[0] || "",
          fatherStats: [...(dataCopy.fatherStats || ["生命", "物攻", "速度"])],
          motherStats: [...(dataCopy.motherStats || ["生命", "物攻", "速度"])],
          brand: dataCopy.brand,
          eggSize: "",
          eggWeight: "",
          produceTime: localISODate
        };
      }
    }

    if (sourceType === "parent") {
      // 父母本 ParentPet -> 蛋窝 EggPet
      if (targetType === "nest") {
        const details = getPetDetails(dataCopy.sprite);
        const defaultStats = ["生命", "物攻", "速度"];
        const isFather = dataCopy.gender === "♂";
        return {
          sprite: isFather ? "" : dataCopy.sprite,
          fatherName: isFather ? dataCopy.sprite : "",
          motherName: isFather ? "" : dataCopy.sprite,
          fatherNatures: isFather ? [dataCopy.nature] : [""],
          motherNatures: isFather ? [""] : [dataCopy.nature],
          fatherStats: isFather ? [...dataCopy.stats] : defaultStats,
          motherStats: isFather ? defaultStats : [...dataCopy.stats],
          groups: details ? [...details.groups] : [],
          brand: dataCopy.brand,
          status: "有现蛋",
          isLimit: "无极限蛋",
          is3V: "否",
          hideStats: false,
          eggCount: "1"
        };
      }
      // 父母本 ParentPet -> 精灵蛋 EggData
      if (targetType === "egg") {
        const isFather = dataCopy.gender === "♂";
        const lowestName = isFather ? "" : getLowestStageName(dataCopy.sprite);
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localISODate = (new Date(now.getTime() - offset)).toISOString().slice(0, 10);
        return {
          sprite: lowestName,
          fatherNature: isFather ? dataCopy.nature : "",
          motherNature: isFather ? "" : dataCopy.nature,
          fatherStats: isFather ? [...dataCopy.stats] : ["无", "无", "无"],
          motherStats: isFather ? ["无", "无", "无"] : [...dataCopy.stats],
          brand: dataCopy.brand,
          eggSize: "",
          eggWeight: "",
          produceTime: localISODate
        };
      }
    }

    if (sourceType === "egg") {
      // 精灵蛋 EggData -> 蛋窝 EggPet
      if (targetType === "nest") {
        const details = getPetDetails(dataCopy.sprite);
        return {
          sprite: dataCopy.sprite,
          fatherName: "",
          motherName: dataCopy.sprite,
          fatherNatures: [dataCopy.fatherNature || ""],
          motherNatures: [dataCopy.motherNature || ""],
          fatherStats: [...(dataCopy.fatherStats || ["生命", "物攻", "速度"])],
          motherStats: [...(dataCopy.motherStats || ["生命", "物攻", "速度"])],
          groups: details ? [...details.groups] : [],
          brand: dataCopy.brand,
          status: "有现蛋",
          isLimit: "无极限蛋",
          is3V: "否",
          hideStats: false,
          eggCount: "1"
        };
      }
      // 精灵蛋 EggData -> 父母本 ParentPet
      if (targetType === "parent") {
        const gender = targetGender || "♀";
        const details = getPetDetails(sourceData.sprite);
        return {
          sprite: sourceData.sprite,
          nature: gender === "♂" ? sourceData.fatherNature : sourceData.motherNature,
          stats: gender === "♂" ? [...(sourceData.fatherStats || ["生命", "物攻", "速度"])] : [...(sourceData.motherStats || ["生命", "物攻", "速度"])],
          brand: sourceData.brand,
          groups: details ? [...details.groups] : [],
          height: "",
          weight: ""
        };
      }
    }

    return null;
  };

  // 全局键盘复制粘贴事件监听
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // 1. 判断是否处于输入框中
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT" ||
          activeEl.getAttribute("contenteditable") === "true")
      ) {
        return; // 放行，保留原生输入框文本复制粘贴行为
      }

      // 2. Ctrl + C 复制卡片数据
      if (e.ctrlKey && e.key.toLowerCase() === "c") {
        if (!selectedCard) return;

        let dataToCopy: any = null;
        if (selectedCard.type === "nest") {
          dataToCopy = pets.find(p => p.id === selectedCard.id);
        } else if (selectedCard.type === "parent") {
          dataToCopy = parents.find(p => p.id === selectedCard.id);
        } else if (selectedCard.type === "egg") {
          dataToCopy = eggs.find(eg => eg.id === selectedCard.id);
        }

        if (dataToCopy) {
          const serialized = {
            roco_egg_copypaste: true,
            type: selectedCard.type,
            data: dataToCopy
          };
          copiedCardRef.current = serialized;
          try {
            await navigator.clipboard.writeText(JSON.stringify(serialized));
          } catch (err) {
            console.warn("系统剪贴板写入失败，已使用内存保底：", err);
          }
          showToast(`已复制当前卡片数据！`, "success");
        }
      }

      // 3. Ctrl + V 粘贴卡片数据
      if (e.ctrlKey && e.key.toLowerCase() === "v") {
        let copiedPayload: any = copiedCardRef.current;

        // 尝试从系统剪贴板读取
        try {
          const clipText = await navigator.clipboard.readText();
          if (clipText) {
            const parsed = JSON.parse(clipText);
            if (parsed && parsed.roco_egg_copypaste) {
              copiedPayload = parsed;
            }
          }
        } catch (err) {
          // 捕获异常，回退使用内存保底
        }

        if (!copiedPayload || !copiedPayload.roco_egg_copypaste) {
          return; // 无有效的复制数据
        }

        const { type: sourceType, data: sourceData } = copiedPayload;

        // 判定粘贴目标
        let targetCard = hoveredCard;
        if (!targetCard && selectedCard) {
          targetCard = selectedCard;
        }

        if (targetCard) {
          // 情况 A & B：覆盖已有目标卡片
          if (targetCard.type === "nest") {
            const mapped = mapCardData(sourceType, "nest", sourceData);
            if (mapped) {
              setPets(prev => prev.map(p => p.id === targetCard!.id ? { ...p, ...mapped } : p));
              showToast("数据已粘贴覆盖目标蛋窝！", "success");
            }
          } else if (targetCard.type === "parent") {
            // 需要获取目标卡片的性别
            const targetParent = parents.find(p => p.id === targetCard!.id);
            const gender = targetParent ? targetParent.gender : "♀";
            const mapped = mapCardData(sourceType, "parent", sourceData, gender);
            if (mapped) {
              setParents(prev => prev.map(p => p.id === targetCard!.id ? { ...p, ...mapped } : p));
              showToast("数据已粘贴覆盖目标仓库！", "success");
            }
          } else if (targetCard.type === "egg") {
            const mapped = mapCardData(sourceType, "egg", sourceData);
            if (mapped) {
              setEggs(prev => prev.map(eg => eg.id === targetCard!.id ? { ...eg, ...mapped } : eg));
              showToast("数据已粘贴覆盖目标精灵蛋！", "success");
            }
          }
        } else {
          // 情况 C：没有 Hover 或点击的目标卡片作为目标，在当前活动 Tab 自动新建卡片
          if (activeTab === "nest") {
            const mapped = mapCardData(sourceType, "nest", sourceData);
            if (mapped) {
              const newPet = {
                ...mapped,
                id: `pet-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
              };
              setPets(prev => [...prev, newPet]);
              showToast("已自动新建蛋窝并粘贴数据！", "success");
            }
          } else if (activeTab === "parents") {
            // 判断性别
            let gender: "♂" | "♀" = "♀";
            if (sourceType === "parent" && sourceData.gender) {
              gender = sourceData.gender;
            }
            const mapped = mapCardData(sourceType, "parent", sourceData, gender);
            if (mapped) {
              const newParent = {
                ...mapped,
                id: `parent-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                gender,
                checked: false
              };
              setParents(prev => [...prev, newParent]);
              showToast(`已自动新建${gender === "♂" ? "父本" : "母本"}卡片并粘贴数据！`, "success");
            }
          } else if (activeTab === "eggs") {
            const mapped = mapCardData(sourceType, "egg", sourceData);
            if (mapped) {
              const newEgg = {
                ...mapped,
                id: `egg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
              };
              setEggs(prev => [newEgg, ...prev]);
              showToast("已自动新建精灵蛋并粘贴数据！", "success");
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCard, hoveredCard, pets, parents, eggs, activeTab]);

  // Statistics calculation
  const totalPets = pets.length;
  const brandStats = BRAND_OPTIONS.reduce((acc, current) => {
    acc[current] = pets.filter(p => p.brand === current).length;
    return acc;
  }, {} as Record<string, number>);

  const hasEggsCount = pets.filter(p => p.status === "有现蛋").length;
  const totalEggsCount = pets
    .filter(p => p.status === "有现蛋")
    .reduce((sum, p) => sum + parseInt(p.eggCount || "1", 10), 0);
  const limitsCount = pets.filter(p => p.isLimit === "有极限蛋" && p.status === "有现蛋").length;
  const isPet3V = (p: EggPet) => {
    if (p.hideStats) return false;
    const f = p.fatherStats || ["生命", "物攻", "速度"];
    const m = p.motherStats || ["生命", "物攻", "速度"];
    if (f.includes("无") || m.includes("无")) return false;
    const fSorted = [...f].sort();
    const mSorted = [...m].sort();
    return fSorted.every((v, idx) => v === mSorted[idx]);
  };

  const threeVsCount = pets.filter(p => isPet3V(p) && p.status === "有现蛋").length;

  // Event handlers
  // Event handlers
  const handleUpdateSprite = useCallback((id: string, name: string) => {
    setPets(prev => prev.map(p => {
      if (p.id === id) {
        if (name.includes("_")) {
          const details = getPetDetails(name);
          return {
            ...p,
            sprite: name,
            groups: (details && details.groups && details.groups.length > 0) ? [...details.groups] : p.groups
          };
        }
        const details = getPetDetails(name);
        if (details) {
          return {
            ...p,
            sprite: details.maxStageName || name,
            groups: (details.groups && details.groups.length > 0) ? [...details.groups] : p.groups
          };
        }
        return { ...p, sprite: name };
      }
      return p;
    }));
  }, []);

  const handleUpdateBrand = useCallback((id: string, brand: string) => {
    setPets(prev => prev.map(p => p.id === id ? { ...p, brand } : p));
  }, []);

  const handleUpdateStatus = useCallback((id: string, status: string) => {
    setPets(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  }, []);

  const handleUpdateLimit = useCallback((id: string, limit: string) => {
    setPets(prev => prev.map(p => p.id === id ? { ...p, isLimit: limit } : p));
  }, []);

  const handleUpdateHideStats = useCallback((id: string, hide: boolean) => {
    setPets(prev => prev.map(p => p.id === id ? { ...p, hideStats: hide } : p));
  }, []);

  const handleUpdateEggCount = useCallback((id: string, count: string) => {
    setPets(prev => prev.map(p => p.id === id ? { ...p, eggCount: count } : p));
  }, []);

  const handleUpdateParentName = useCallback((id: string, parent: "father" | "mother", name: string) => {
    setPets(prev => prev.map(p => {
      if (p.id !== id) return p;
      if (parent === "father") {
        return { ...p, fatherName: name };
      } else {
        return { ...p, motherName: name };
      }
    }));
  }, []);

  // Natures list update
  const handleAddNature = useCallback((id: string, parent: "father" | "mother") => {
    setPets(prev => prev.map(p => {
      if (p.id === id) {
        if (parent === "father") {
          return {
            ...p,
            fatherNatures: [...(p.fatherNatures || []), ""]
          };
        } else {
          return {
            ...p,
            motherNatures: [...(p.motherNatures || []), ""]
          };
        }
      }
      return p;
    }));
  }, []);

  const handleRemoveNature = useCallback((id: string, parent: "father" | "mother", natureIndex: number) => {
    setPets(prev => prev.map(p => {
      if (p.id === id) {
        if (parent === "father") {
          const list = [...(p.fatherNatures || [])];
          if (list.length > 1) {
            list.splice(natureIndex, 1);
            return { ...p, fatherNatures: list };
          }
        } else {
          const list = [...(p.motherNatures || [])];
          if (list.length > 1) {
            list.splice(natureIndex, 1);
            return { ...p, motherNatures: list };
          }
        }
      }
      return p;
    }));
  }, []);

  const handleUpdateNature = useCallback((id: string, parent: "father" | "mother", natureIndex: number, value: string) => {
    setPets(prev => prev.map(p => {
      if (p.id === id) {
        if (parent === "father") {
          const list = [...(p.fatherNatures || [])];
          list[natureIndex] = value;
          return { ...p, fatherNatures: list };
        } else {
          const list = [...(p.motherNatures || [])];
          list[natureIndex] = value;
          return { ...p, motherNatures: list };
        }
      }
      return p;
    }));
  }, []);

  // Stats list update
  const handleUpdateStat = useCallback((id: string, parent: "father" | "mother", statIndex: number, value: string) => {
    setPets(prev => prev.map(p => {
      if (p.id === id) {
        if (parent === "father") {
          const list = [...(p.fatherStats || ["生命", "物攻", "速度"])];
          list[statIndex] = value;
          return { ...p, fatherStats: list };
        } else {
          const list = [...(p.motherStats || ["生命", "物攻", "速度"])];
          list[statIndex] = value;
          return { ...p, motherStats: list };
        }
      }
      return p;
    }));
  }, []);

  // Egg Groups list update
  const handleAddGroup = useCallback((id: string) => {
    setPets(prev => prev.map(p => {
      if (p.id === id && p.groups.length < 3) {
        return {
          ...p,
          groups: [...p.groups, EGG_GROUPS[0]]
        };
      }
      return p;
    }));
  }, []);

  const handleRemoveGroup = useCallback((id: string, groupIndex: number) => {
    setPets(prev => prev.map(p => {
      if (p.id === id && p.groups.length > 1) {
        const list = [...p.groups];
        list.splice(groupIndex, 1);
        return { ...p, groups: list };
      }
      return p;
    }));
  }, []);

  const handleUpdateGroup = useCallback((id: string, groupIndex: number, value: string) => {
    setPets(prev => prev.map(p => {
      if (p.id === id) {
        const list = [...p.groups];
        list[groupIndex] = value;
        return { ...p, groups: list };
      }
      return p;
    }));
  }, []);

  const handleAddPet = () => {
    const newPet: EggPet = {
      id: `pet-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      sprite: "",
      fatherNatures: [""],
      motherNatures: [""],
      fatherStats: ["生命", "物攻", "速度"],
      motherStats: ["生命", "物攻", "速度"],
      groups: [EGG_GROUPS[0]],
      brand: BRAND_OPTIONS[0],
      status: NEST_STATUS_OPTIONS[0],
      isLimit: "无极限蛋",
      is3V: "否",
      hideStats: false,
      eggCount: "1"
    };
    setPets([...pets, newPet]);
  };

  const handleDeletePet = useCallback((id: string) => {
    setPets(prev => prev.filter(p => p.id !== id));
  }, []);

  const handleDeleteEgg = useCallback((id: string) => {
    let nestIdToDecrement: string | undefined = undefined;

    setEggs(prev => {
      const egg = prev.find(e => e.id === id);
      if (egg && egg.fromNestId) {
        nestIdToDecrement = egg.fromNestId;
      }
      return prev.filter(e => e.id !== id);
    });

    showToast("精灵蛋删除成功！", "success");

    if (nestIdToDecrement) {
      setPets(prev => prev.map(p => {
        if (p.id === nestIdToDecrement) {
          const currentCount = parseInt(p.eggCount || "0", 10);
          const newCount = Math.max(0, currentCount - 1);
          const newStatus = newCount === 0 ? "正在孵，可预约" : p.status;
          return {
            ...p,
            eggCount: newCount.toString(),
            status: newStatus
          };
        }
        return p;
      }));
    }
  }, [setEggs, setPets]);

  const handleAddEggClick = () => {
    // Set default produce time to current local YYYY-MM-DD format
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISODate = (new Date(now.getTime() - offset)).toISOString().slice(0, 10);

    const newEgg: EggData = {
      id: `egg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      sprite: "", // blank sprite so user can type/autocomplete it on the card
      fatherNature: "",
      motherNature: "",
      fatherStats: ["生命", "物攻", "速度"],
      motherStats: ["生命", "物攻", "速度"],
      brand: "普通",
      eggSize: "",
      eggWeight: "",
      produceTime: localISODate
    };

    setEggs(prev => [newEgg, ...prev]);
    showToast("已登记一只新精灵蛋卡片，请在卡片中填写信息！", "success");
  };

  const handleProduceEgg = useCallback((nest: EggPet) => {
    // 1. 推导最低进化形态
    const lowestName = getLowestStageName(nest.sprite);

    // 2. 获取当前日期
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISODate = (new Date(now.getTime() - offset)).toISOString().slice(0, 10);

    // 3. 构建新的精灵蛋 EggData
    const newEgg: EggData = {
      id: `egg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      sprite: lowestName,
      fatherNature: nest.fatherNatures?.[0] || "",
      motherNature: nest.motherNatures?.[0] || "",
      fatherStats: nest.fatherStats && nest.fatherStats.length > 0 ? [...nest.fatherStats] : ["生命", "物攻", "速度"],
      motherStats: nest.motherStats && nest.motherStats.length > 0 ? [...nest.motherStats] : ["生命", "物攻", "速度"],
      brand: nest.brand,
      eggSize: "", // 尺寸和重量留空
      eggWeight: "",
      produceTime: localISODate,
      fromNestId: nest.id
    };

    // 4. 新增到精灵蛋管理中心
    setEggs(prev => [newEgg, ...prev]);

    // 5. 增加当前蛋窝现蛋数量，并确保状态为“有现蛋”
    const currentCount = parseInt(nest.eggCount || "0", 10);
    const newCount = isNaN(currentCount) ? 1 : currentCount + 1;
    setPets(prev => prev.map(p => p.id === nest.id ? { ...p, eggCount: newCount.toString(), status: "有现蛋" } : p));
    showToast(`产蛋成功！精灵蛋[${lowestName}]已录入蛋管理中心，当前窝点数量已增加至 ${newCount}`, "success");
  }, [setEggs, setPets]);

  const handleUpdateEggSprite = useCallback((id: string, sprite: string) => {
    setEggs(prev => prev.map(e => e.id === id ? { ...e, sprite } : e));
  }, []);

  const handleUpdateEggBrand = useCallback((id: string, brand: string) => {
    setEggs(prev => prev.map(e => e.id === id ? { ...e, brand } : e));
  }, []);

  const handleUpdateEggSize = useCallback((id: string, size: string) => {
    setEggs(prev => prev.map(e => e.id === id ? { ...e, eggSize: size } : e));
  }, []);

  const handleUpdateEggWeight = useCallback((id: string, weight: string) => {
    setEggs(prev => prev.map(e => e.id === id ? { ...e, eggWeight: weight } : e));
  }, []);

  const handleUpdateEggFatherNature = useCallback((id: string, nature: string) => {
    setEggs(prev => prev.map(e => e.id === id ? { ...e, fatherNature: nature } : e));
  }, []);

  const handleUpdateEggMotherNature = useCallback((id: string, nature: string) => {
    setEggs(prev => prev.map(e => e.id === id ? { ...e, motherNature: nature } : e));
  }, []);

  const handleUpdateEggFatherStat = useCallback((id: string, statIdx: number, val: string) => {
    setEggs(prev => prev.map(e => {
      if (e.id === id) {
        const fatherStats = [...(e.fatherStats || ["无", "无", "无"])];
        fatherStats[statIdx] = val;
        return { ...e, fatherStats };
      }
      return e;
    }));
  }, []);

  const handleUpdateEggMotherStat = useCallback((id: string, statIdx: number, val: string) => {
    setEggs(prev => prev.map(e => {
      if (e.id === id) {
        const motherStats = [...(e.motherStats || ["无", "无", "无"])];
        motherStats[statIdx] = val;
        return { ...e, motherStats };
      }
      return e;
    }));
  }, []);

  const handleUpdateEggProduceTime = useCallback((id: string, produceTime: string) => {
    setEggs(prev => prev.map(e => e.id === id ? { ...e, produceTime } : e));
  }, []);

  const handleAddParent = (gender: "♂" | "♀") => {
    const newParent: ParentPet = {
      id: `parent-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      gender,
      sprite: "",
      nature: "",
      stats: ["生命", "物攻", "速度"],
      brand: BRAND_OPTIONS[0],
      groups: [],
      height: "",
      weight: "",
      checked: false
    };
    setParents(prev => [...prev, newParent]);
    showToast(`已成功添加一个新${gender === "♂" ? "父本" : "母本"}卡片！`, "success");
  };

  const handleDeleteParent = useCallback((id: string) => {
    setParents(prev => prev.filter(p => p.id !== id));
    showToast("已删除父母本卡片", "success");
  }, []);

  const handleUpdateParentSprite = useCallback((id: string, spriteName: string) => {
    const details = getPetDetails(spriteName);
    const groups = details ? details.groups : [];
    setParents(prev => prev.map(p => p.id === id ? { ...p, sprite: spriteName, groups } : p));
  }, []);

  const handleUpdateParentField = useCallback((id: string, field: keyof ParentPet, value: any) => {
    setParents(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  }, []);

  const handleUpdateParentBrand = useCallback((id: string, brand: string) => {
    handleUpdateParentField(id, "brand", brand);
  }, [handleUpdateParentField]);

  const handleUpdateParentHeight = useCallback((id: string, height: string) => {
    handleUpdateParentField(id, "height", height);
  }, [handleUpdateParentField]);

  const handleUpdateParentWeight = useCallback((id: string, weight: string) => {
    handleUpdateParentField(id, "weight", weight);
  }, [handleUpdateParentField]);

  const handleUpdateParentNature = useCallback((id: string, nature: string) => {
    handleUpdateParentField(id, "nature", nature);
  }, [handleUpdateParentField]);

  const handleUpdateParentChecked = useCallback((id: string, checked: boolean) => {
    handleUpdateParentField(id, "checked", checked);
  }, [handleUpdateParentField]);

  const handleUpdateParentVoice = useCallback((id: string, voice: number | null) => {
    handleUpdateParentField(id, "voice", voice);
  }, [handleUpdateParentField]);

  const handleUpdateParentStat = useCallback((id: string, statIndex: number, value: string) => {
    setParents(prev => prev.map(p => {
      if (p.id === id) {
        const newStats = [...p.stats];
        newStats[statIndex] = value;
        return { ...p, stats: newStats };
      }
      return p;
    }));
  }, []);

  const handleToggleAllParents = useCallback((gender: "♂" | "♀", checked: boolean, visibleIds: string[]) => {
    const visibleSet = new Set(visibleIds);
    setParents(prev => prev.map(p => {
      if (p.gender === gender && visibleSet.has(p.id)) {
        return { ...p, checked };
      }
      return p;
    }));
  }, []);

  const handleSelectGrid = useCallback((group: string | null, nature: string | null, brand: "大粗" | "大婉" | null) => {
    // 1. 如果 group 和 nature 都是 null，代表点击“清空筛选”
    if (group === null && nature === null) {
      setFatherFilterGroup("");
      setMotherFilterGroup("");
      setFatherNatureSearch("");
      setMotherNatureSearch("");
      setFatherFilterBrand("");
      setMotherFilterBrand("");
      return;
    }

    // 2. 处理性格筛选
    if (nature !== null) {
      const fullNature = NATURE_OPTIONS.find(opt => opt.startsWith(nature)) || "";
      const currentNatureShort = fatherNatureSearch ? fatherNatureSearch.substring(0, 2) : "";
      if (currentNatureShort === nature) {
        // 反选：清空性格筛选
        setFatherNatureSearch("");
        setMotherNatureSearch("");
      } else {
        setFatherNatureSearch(fullNature);
        setMotherNatureSearch(fullNature);
      }
    }

    // 3. 处理蛋组筛选
    if (group !== null) {
      if (fatherFilterGroup === group) {
        // 反选：清空蛋组筛选
        setFatherFilterGroup("");
        setMotherFilterGroup("");
      } else {
        setFatherFilterGroup(group);
        setMotherFilterGroup(group);
      }
    }

    // 4. 处理品牌筛选
    if (brand !== null) {
      setFatherFilterBrand(brand);
      setMotherFilterBrand(brand);
    }
  }, [fatherNatureSearch, fatherFilterGroup]);

  const handleSelectPair = useCallback((fatherId: string, motherId: string) => {
    setParents(prev => prev.map(p => {
      if (p.id === fatherId || p.id === motherId) {
        return { ...p, checked: true };
      }
      return { ...p, checked: false };
    }));
    
    // 清空过滤条件，确保用户能看到这两个卡片
    setFatherSearchTerm("");
    setFatherFilterGroup("");
    setFatherFilterBrand("");
    setFatherNatureSearch("");
    
    setMotherSearchTerm("");
    setMotherFilterGroup("");
    setMotherFilterBrand("");
    setMotherNatureSearch("");

    showToast("已成功为您勾选此推荐配对！且已清空过滤，您可在下方「繁育与配对中心」直接查看结果。", "success");

    setTimeout(() => {
      const el = document.getElementById("parents-pairing-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  }, [setParents]);

  const getPairings = useCallback(() => {
    const checkedFathers = parents.filter(p => p.gender === "♂" && p.checked && p.sprite);
    const checkedMothers = parents.filter(p => p.gender === "♀" && p.checked && p.sprite);
    const results: Array<{
      father: ParentPet;
      mother: ParentPet;
      brand: string;
      eggSprite: string;
      matchingGroups: string[];
    }> = [];

    // Helper: Determine if a pet is close to the giant weight threshold (body length is OK, but weight is slightly deficient within 20%)
    const isNearGiantLimit = (pet: ParentPet) => {
      const t = getPetSizeThresholds(pet.sprite);
      if (!t || !pet.height || !pet.weight) return false;
      const hVal = parseFloat(pet.height);
      const wVal = parseFloat(pet.weight);
      if (isNaN(hVal) || isNaN(wVal)) return false;
      return hVal >= t.maxHeight && wVal < t.giantWeightLine && wVal >= t.giantWeightLine * 0.90;
    };

    // Helper: Determine if a pet is close to the tiny weight threshold (body length is OK, but weight is slightly redundant within 10%)
    const isNearTinyLimit = (pet: ParentPet) => {
      const t = getPetSizeThresholds(pet.sprite);
      if (!t || !pet.height || !pet.weight) return false;
      const hVal = parseFloat(pet.height);
      const wVal = parseFloat(pet.weight);
      if (isNaN(hVal) || isNaN(wVal)) return false;
      return hVal <= t.minHeight && wVal > t.tinyWeightLine && wVal <= t.tinyWeightLine * 1.10;
    };

    for (const father of checkedFathers) {
      for (const mother of checkedMothers) {
        const matchingGroups = father.groups.filter(g => mother.groups.includes(g));
        if (matchingGroups.length === 0) continue;let brand = "";


                const isFatherCoarse = ["大粗", "小粗", "单粗嗓门"].includes(father.brand);


                const isMotherCoarse = ["大粗", "小粗", "单粗嗓门"].includes(mother.brand);


                const isFatherSoft = ["大婉", "小婉", "单婉转声"].includes(father.brand);


                const isMotherSoft = ["大婉", "小婉", "单婉转声"].includes(mother.brand);



                const isCoarseIncompatible = (father.brand === "大粗" && mother.brand === "小粗") || (father.brand === "小粗" && mother.brand === "大粗");


                const isSoftIncompatible = (father.brand === "大婉" && mother.brand === "小婉") || (father.brand === "小婉" && mother.brand === "大婉");



                if (isFatherCoarse && isMotherCoarse && !isCoarseIncompatible) {


                  // 粗嗓门组：大粗/小粗/单粗嗓门


                  if (father.brand === "大粗" && mother.brand === "大粗") {


                    brand = (isNearGiantLimit(father) || isNearGiantLimit(mother)) ? "概率大粗" : "大粗";


                  } else if (father.brand === "小粗" && mother.brand === "小粗") {


                    brand = (isNearTinyLimit(father) || isNearTinyLimit(mother)) ? "概率小粗" : "小粗";


                  } else if (


                    (father.brand === "大粗" && mother.brand === "单粗嗓门") ||


                    (mother.brand === "大粗" && father.brand === "单粗嗓门")


                  ) {


                    brand = (isNearGiantLimit(father) || isNearGiantLimit(mother)) ? "概率大粗" : "单粗嗓门";


                  } else if (


                    (father.brand === "小粗" && mother.brand === "单粗嗓门") ||


                    (mother.brand === "小粗" && father.brand === "单粗嗓门")


                  ) {


                    brand = (isNearTinyLimit(father) || isNearTinyLimit(mother)) ? "概率小粗" : "单粗嗓门";


                  } else {


                    brand = "单粗嗓门";


                  }


                } else if (isFatherSoft && isMotherSoft && !isSoftIncompatible) {


                  // 婉转声组：大婉/小婉/单婉转声


                  if (father.brand === "大婉" && mother.brand === "大婉") {


                    brand = (isNearGiantLimit(father) || isNearGiantLimit(mother)) ? "概率大婉" : "大婉";


                  } else if (father.brand === "小婉" && mother.brand === "小婉") {


                    brand = (isNearTinyLimit(father) || isNearTinyLimit(mother)) ? "概率小婉" : "小婉";


                  } else if (


                    (father.brand === "大婉" && mother.brand === "单婉转声") ||


                    (mother.brand === "大婉" && father.brand === "单婉转声")


                  ) {


                    brand = (isNearGiantLimit(father) || isNearGiantLimit(mother)) ? "概率大婉" : "单婉转声";


                  } else if (


                    (father.brand === "小婉" && mother.brand === "单婉转声") ||


                    (mother.brand === "小婉" && father.brand === "单婉转声")


                  ) {


                    brand = (isNearTinyLimit(father) || isNearTinyLimit(mother)) ? "概率小婉" : "单婉转声";


                  } else {


                    brand = "单婉转声";


                  }


                } else if (


                  (father.brand === "普通" && isNearGiantLimit(father) && mother.brand === "单大块头") ||


                  (mother.brand === "普通" && isNearGiantLimit(mother) && father.brand === "单大块头")


                ) {


                  brand = "概率大块头";


                } else if (


                  (father.brand === "普通" && isNearTinyLimit(father) && mother.brand === "单小不点") ||


                  (mother.brand === "普通" && isNearTinyLimit(mother) && father.brand === "单小不点")


                ) {


                  brand = "概率小不点";


                } else if (


                  father.brand === "普通" && isNearGiantLimit(father) &&


                  mother.brand === "普通" && isNearGiantLimit(mother)


                ) {


                  brand = "概率大块头";


                } else if (


                  father.brand === "普通" && isNearTinyLimit(father) &&


                  mother.brand === "普通" && isNearTinyLimit(mother)


                ) {


                  brand = "概率小不点";


                } else if (


                  (father.brand === "普通" && (mother.brand === "单大块头" || mother.brand === "单小不点" || mother.brand === "单粗嗓门" || mother.brand === "单婉转声")) ||


                  (mother.brand === "普通" && (father.brand === "单大块头" || father.brand === "单小不点" || father.brand === "单粗嗓门" || father.brand === "单婉转声"))


                ) {


                  // 普通 + 单XX = 普通


                  brand = "普通";


                } else if (father.brand === mother.brand) {


                  brand = father.brand;


                } else {


                  continue;


                }

        results.push({
          father,
          mother,
          brand,
          eggSprite: mother.sprite,
          matchingGroups
        });
      }
    }
    return results;
  }, [parents]);

  const handleImportPairingsToNest = (pairings: Array<{
    father: ParentPet;
    mother: ParentPet;
    brand: string;
    eggSprite: string;
    matchingGroups: string[];
  }>) => {
    if (pairings.length === 0) {
      showToast("没有符合规则的配对可导入", "error");
      return;
    }

    const newPets: EggPet[] = pairings.map(pair => {
      const isStatsMatch = pair.father.stats.length === pair.mother.stats.length &&
        pair.father.stats.every((v, i) => v === pair.mother.stats[i] && v !== "无");
      
      const details = getPetDetails(pair.eggSprite);
      const groups = details ? details.groups : pair.mother.groups;

      return {
        id: `pet-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        sprite: pair.eggSprite,
        fatherName: pair.father.sprite,
        motherName: pair.mother.sprite,
        fatherNatures: pair.father.nature ? [pair.father.nature] : [""],
        motherNatures: pair.mother.nature ? [pair.mother.nature] : [""],
        fatherStats: [...pair.father.stats],
        motherStats: [...pair.mother.stats],
        groups: [...groups],
        brand: (pair.brand === "概率大块头" || pair.brand === "概率小不点") ? "普通" : pair.brand,
        status: "正在孵，可预约",
        isLimit: "无极限蛋",
        is3V: isStatsMatch ? "3V" : "否",
        hideStats: false,
        eggCount: "1"
      };
    });

    setPets(prev => [...prev, ...newPets]);
    showToast(`已成功将 ${newPets.length} 组配对一键导入蛋窝中心！`, "success");
  };

  const handleAddTrade = () => {
    if (!newTradeSprite || !newTradeSprite.trim()) {
      showToast("请输入精灵名称", "error");
      return;
    }

    // 自动升级为进化链最高阶，且保留形态后缀
    const trimmed = newTradeSprite.trim();
    const [base, suffix] = trimmed.split("_");
    const details = getPetDetails(base);
    const finalBase = details ? (details.maxStageName || base) : base;
    const finalSprite = suffix ? `${finalBase}_${suffix}` : finalBase;

    const newTrade: EggTrade = {
      id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      sprite: finalSprite,
      nature: newTradeNature,
      brand: newTradeBrand,
      is3V: newTradeIs3V,
      isLimit: newTradeIsLimit,
      notes: newTradeNotes
    };

    setTrades([...trades, newTrade]);
    showToast(`成功添加换蛋需求：${finalSprite}`, "success");

    // 重置部分表单字段，保留一些选项以备连续输入
    setNewTradeSprite("");
    setNewTradeNature("");
    setNewTradeNotes("");
  };

  const handleDeleteTrade = (id: string) => {
    setTrades(trades.filter(t => t.id !== id));
    showToast("已删除换蛋需求", "success");
  };

  const handleUpdateTradeSprite = useCallback((id: string, newSprite: string) => {
    setTrades(prev => prev.map(t => t.id === id ? { ...t, sprite: newSprite } : t));
  }, []);

  const handleReset = (tab: "nest" | "parents" | "eggs") => {
    setResetTabTarget(tab);
    setActiveModal("reset");
  };

  const executeReset = () => {
    if (resetTabTarget === "nest") {
      const resetList = migratePets(INITIAL_TABLE_DATA);
      setPets(resetList);
      setTrades([]);
      setSearchTerm("");
      setFilterNature("");
      setFilterGroup("");
      setFilterBrand("");
      setFilterStatus("");
      setFilterLimit("");
      setFilter3V("");
      setFilterSameNature(false);
      showToast("已成功还原初始默认蛋窝与需求列表，且已重置筛选条件！", "success");
    } else if (resetTabTarget === "parents") {
      setParents([]);
      setFatherSearchTerm("");
      setFatherFilterGroup("");
      setFatherFilterBrand("");
      setFatherNatureSearch("");
      setMotherSearchTerm("");
      setMotherFilterGroup("");
      setMotherFilterBrand("");
      setMotherNatureSearch("");
      showToast("已成功清空所有父母本仓储数据，且已重置筛选条件！", "success");
    } else if (resetTabTarget === "eggs") {
      setEggs([]);
      setEggSearchTerm("");
      setEggFilterGroup("");
      setEggFilterBrand("");
      setEggFilterLimit("");
      setEggFilter3V("");
      showToast("已成功清空所有精灵蛋管理记录，且已重置筛选条件！", "success");
    }
    setActiveModal("none");
    setResetTabTarget(null);
  };

  const handleImportClick = () => {
    setJsonText("");
    setImportError("");
    setImportContext("global");
    setActiveModal("import");
  };

  const handleImportNestClick = () => {
    setJsonText("");
    setImportError("");
    setImportContext("nest");
    setActiveModal("import");
  };

  const handleImportParentsClick = () => {
    setJsonText("");
    setImportError("");
    setImportContext("parents");
    setActiveModal("import");
  };

  const handleImportEggsClick = () => {
    setJsonText("");
    setImportError("");
    setImportContext("eggs");
    setActiveModal("import");
  };

  // 支持单个账号/多账号的复杂导入逻辑
  const executeImport = (pastedText: string) => {
    try {
      if (!pastedText.trim()) {
        setImportError("请粘贴或选择有效的 JSON 备份数据");
        return;
      }
      const parsed = JSON.parse(pastedText);

      // 如果是局部导入
      if (importContext !== "global") {
        let targetList: any[] | null = null;
        let label = "";

        if (importContext === "nest") {
          label = "蛋窝";
          if (parsed && parsed.version === "roco_egg_nest_data_v1") {
            targetList = parsed.data;
          } else if (parsed && parsed.version === "roco_egg_single_account_v1" && parsed.data) {
            targetList = parsed.data.pets;
          } else if (Array.isArray(parsed)) {
            targetList = parsed;
          } else if (parsed && Array.isArray(parsed.pets)) {
            targetList = parsed.pets;
          }

          if (targetList) {
            const migrated = migratePets(targetList);
            setPets(migrated);
            setAccountDataMap(prev => ({
              ...prev,
              [activeAccountId]: {
                ...(prev[activeAccountId] || { pets: [], trades: [], parents: [], eggs: [] }),
                pets: migrated
              }
            }));
            // 重置过滤条件
            setSearchTerm("");
            setFilterNature("");
            setFilterGroup("");
            setFilterBrand("");
            setFilterStatus("");
            setFilterLimit("");
            setFilter3V("");
            setFilterSameNature(false);

            showToast(`已成功导入${label}数据！`, "success");
            setActiveModal("none");
            return;
          }
        } else if (importContext === "parents") {
          label = "父母本仓储";
          if (parsed && parsed.version === "roco_egg_parents_data_v1") {
            targetList = parsed.data;
          } else if (parsed && parsed.version === "roco_egg_single_account_v1" && parsed.data) {
            targetList = parsed.data.parents;
          } else if (Array.isArray(parsed)) {
            targetList = parsed;
          } else if (parsed && Array.isArray(parsed.parents)) {
            targetList = parsed.parents;
          }

          if (targetList) {
            setParents(targetList);
            setAccountDataMap(prev => ({
              ...prev,
              [activeAccountId]: {
                ...(prev[activeAccountId] || { pets: [], trades: [], parents: [], eggs: [] }),
                parents: targetList!
              }
            }));
            // 重置过滤条件
            setFatherSearchTerm("");
            setFatherFilterGroup("");
            setFatherFilterBrand("");
            setFatherNatureSearch("");
            setMotherSearchTerm("");
            setMotherFilterGroup("");
            setMotherFilterBrand("");
            setMotherNatureSearch("");

            showToast(`已成功导入${label}数据！`, "success");
            setActiveModal("none");
            return;
          }
        } else if (importContext === "eggs") {
          label = "精灵蛋管理";
          if (parsed && parsed.version === "roco_egg_eggs_data_v1") {
            targetList = parsed.data;
          } else if (parsed && parsed.version === "roco_egg_single_account_v1" && parsed.data) {
            targetList = parsed.data.eggs;
          } else if (Array.isArray(parsed)) {
            targetList = parsed;
          } else if (parsed && Array.isArray(parsed.eggs)) {
            targetList = parsed.eggs;
          }

          if (targetList) {
            setEggs(targetList);
            setAccountDataMap(prev => ({
              ...prev,
              [activeAccountId]: {
                ...(prev[activeAccountId] || { pets: [], trades: [], parents: [], eggs: [] }),
                eggs: targetList!
              }
            }));
            // 重置过滤条件
            setEggSearchTerm("");
            setEggFilterGroup("");
            setEggFilterBrand("");
            setEggFilterLimit("");
            setEggFilter3V("");
            setEggCurrentPage(1);

            showToast(`已成功导入${label}数据！`, "success");
            setActiveModal("none");
            return;
          }
        }

        setImportError(`无法识别的 JSON 格式或无法从中提取${label}数据`);
        return;
      }

      // 1. 判断是否是多账号全量备份
      if (parsed && parsed.version === "roco_egg_multi_accounts_v1" && Array.isArray(parsed.accounts)) {
        setPendingImportData(parsed);
        setImportConfirmType("multi");
        setImportInfoText(`检测到您正在导入全量多账号备份。包含 ${parsed.accounts.length} 个账号，导入后将完全替换当前系统内的所有账号和数据，无法恢复。`);
        return;
      }

      // 2. 判断是否是单账号备份（包含新旧版本）
      let singleData: AccountData | null = null;
      let singleNickname = "导入账号";
      let singleUid = "default";

      if (parsed && parsed.version === "roco_egg_single_account_v1") {
        singleNickname = parsed.nickname || "导入账号";
        singleUid = parsed.uid || "default";
        singleData = parsed.data || { pets: [], trades: [], parents: [], eggs: [] };
        if (!singleData.eggs) {
          singleData.eggs = [];
        }
      } else if (Array.isArray(parsed)) {
        // 老版本纯数组格式
        singleData = {
          pets: migratePets(parsed),
          trades: [],
          parents: [],
          eggs: []
        };
      } else if (parsed && (Array.isArray(parsed.pets) || Array.isArray(parsed.trades) || Array.isArray(parsed.parents) || Array.isArray(parsed.eggs))) {
        // 老版本包含 pets, trades, parents 的对象格式
        singleData = {
          pets: migratePets(parsed.pets || []),
          trades: migrateTrades(parsed.trades || []),
          parents: parsed.parents || [],
          eggs: parsed.eggs || []
        };
      }

      if (singleData) {
        setPendingImportData(singleData);
        setImportConfirmType("single");
        setImportAsNewNickname(`${singleNickname}_导入`);
        setImportAsNewUid(singleUid);
        setImportInfoText(`检测到单账号备份。您可以选择覆盖当前账号「${accounts.find(a => a.id === activeAccountId)?.nickname || '默认账号'}」，或者作为一个新账号导入。`);
      } else {
        setImportError("数据格式错误：无法识别的 JSON 备份格式");
      }
    } catch (err: any) {
      setImportError(`导入失败：${err.message || "无效的 JSON 字段/语法格式"}`);
    }
  };

  // 确认全量多账号导入
  const confirmImportAll = () => {
    if (!pendingImportData) return;
    const { accounts: importedAccounts, activeAccountId: importedActiveId, accountDataMap: importedDataMap } = pendingImportData;
    
    setAccounts(importedAccounts);
    setActiveAccountId(importedActiveId);
    setAccountDataMap(importedDataMap);

    const activeData = importedDataMap[importedActiveId] || { pets: [], trades: [], parents: [], eggs: [] };
    setPets(migratePets(activeData.pets || []));
    setTrades(migrateTrades(activeData.trades || []));
    setParents(activeData.parents || []);
    setEggs(activeData.eggs || []);

    setPendingImportData(null);
    setImportConfirmType("none");
    setActiveModal("none");
    showToast("已成功导入全量多账号备份数据！", "success");
  };

  // 确认单账号导入
  const confirmImportSingle = (asNew: boolean) => {
    if (!pendingImportData) return;
    
    if (asNew) {
      if (!importAsNewNickname.trim()) {
        showToast("新账号昵称不能为空", "error");
        return;
      }
      const newId = `acc_${Date.now()}`;
      const newAccount: Account = {
        id: newId,
        nickname: importAsNewNickname.trim(),
        uid: importAsNewUid.trim() || "default"
      };

      // 保存当前账号的数据
      const updatedMap = {
        ...accountDataMap,
        [activeAccountId]: { pets, trades, parents, eggs },
        [newId]: {
          pets: migratePets(pendingImportData.pets || []),
          trades: migrateTrades(pendingImportData.trades || []),
          parents: pendingImportData.parents || [],
          eggs: pendingImportData.eggs || []
        }
      };

      setAccounts(prev => [...prev, newAccount]);
      setAccountDataMap(updatedMap);
      setActiveAccountId(newId);

      setPets(migratePets(pendingImportData.pets || []));
      setTrades(migrateTrades(pendingImportData.trades || []));
      setParents(pendingImportData.parents || []);
      setEggs(pendingImportData.eggs || []);

      showToast(`成功导入并创建新账号：${importAsNewNickname}`, "success");
    } else {
      // 覆盖当前账号
      setPets(migratePets(pendingImportData.pets || []));
      setTrades(migrateTrades(pendingImportData.trades || []));
      setParents(pendingImportData.parents || []);
      setEggs(pendingImportData.eggs || []);
      
      // 更新缓存 map
      setAccountDataMap(prev => ({
        ...prev,
        [activeAccountId]: {
          pets: migratePets(pendingImportData.pets || []),
          trades: migrateTrades(pendingImportData.trades || []),
          parents: pendingImportData.parents || [],
          eggs: pendingImportData.eggs || []
        }
      }));

      showToast("已覆盖当前账号的数据！", "success");
    }

    setPendingImportData(null);
    setImportConfirmType("none");
    setActiveModal("none");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonText(text);
      setImportError("");
      executeImport(text); // 自动执行解析
    };
    reader.readAsText(file);
  };

  const handleExportClick = () => {
    // 默认打开导出当前账号
    handleExportSingleClick(activeAccountId);
  };

  const handleExportNestClick = () => {
    const backupData = JSON.stringify({
      version: "roco_egg_nest_data_v1",
      data: pets
    }, null, 2);
    setJsonText(backupData);
    setExportType("nest");
    setActiveModal("export");
  };

  const handleExportParentsClick = () => {
    const backupData = JSON.stringify({
      version: "roco_egg_parents_data_v1",
      data: parents
    }, null, 2);
    setJsonText(backupData);
    setExportType("parents");
    setActiveModal("export");
  };

  const handleExportEggsClick = () => {
    const backupData = JSON.stringify({
      version: "roco_egg_eggs_data_v1",
      data: eggs
    }, null, 2);
    setJsonText(backupData);
    setExportType("eggs");
    setActiveModal("export");
  };

  // 导出单个账号
  const handleExportSingleClick = (accountId: string) => {
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) return;
    
    // 如果是当前激活账号，先合并当前内存数据
    const targetData = accountId === activeAccountId 
      ? { pets, trades, parents, eggs }
      : accountDataMap[accountId] || { pets: [], trades: [], parents: [], eggs: [] };

    const backupData = JSON.stringify({
      version: "roco_egg_single_account_v1",
      nickname: acc.nickname,
      uid: acc.uid,
      data: targetData
    }, null, 2);

    setJsonText(backupData);
    setExportType("single");
    setActiveModal("export");
  };

  // 导出所有账号
  const handleExportAllClick = () => {
    // 包含当前激活账号的最新数据
    const mergedDataMap = {
      ...accountDataMap,
      [activeAccountId]: { pets, trades, parents, eggs }
    };

    const backupData = JSON.stringify({
      version: "roco_egg_multi_accounts_v1",
      accounts,
      activeAccountId,
      accountDataMap: mergedDataMap
    }, null, 2);

    setJsonText(backupData);
    setExportType("all");
    setActiveModal("export");
  };

  const downloadJsonBackup = () => {
    const blob = new Blob([jsonText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toLocaleDateString("zh-CN").replace(/\//g, "-");
    
    let prefix = "";
    if (exportType === "all") {
      prefix = "全部账号备份";
    } else if (exportType === "single") {
      prefix = `单账号备份_${accounts.find(a => a.id === activeAccountId)?.nickname || "默认"}`;
    } else if (exportType === "nest") {
      prefix = `蛋窝数据_${accounts.find(a => a.id === activeAccountId)?.nickname || "默认"}`;
    } else if (exportType === "parents") {
      prefix = `父母本数据_${accounts.find(a => a.id === activeAccountId)?.nickname || "默认"}`;
    } else if (exportType === "eggs") {
      prefix = `精灵蛋数据_${accounts.find(a => a.id === activeAccountId)?.nickname || "默认"}`;
    }

    link.href = url;
    link.download = `洛克王国_${prefix}_${dateStr}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("备份文件已准备就绪并开始下载！", "success");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonText)
      .then(() => {
        showToast("JSON 备份数据已成功复制！", "success");
      })
      .catch((err) => {
        showToast("复制失败，请手动全选复制！", "error");
      });
  };

  // 账号切换与管理函数
  const handleSwitchAccount = (accountId: string) => {
    if (accountId === activeAccountId) return;
    
    const updatedMap = {
      ...accountDataMap,
      [activeAccountId]: { pets, trades, parents, eggs }
    };
    setAccountDataMap(updatedMap);
    setActiveAccountId(accountId);
    
    const targetData = updatedMap[accountId] || { pets: [], trades: [], parents: [], eggs: [] };
    setPets(migratePets(targetData.pets || []));
    setTrades(migrateTrades(targetData.trades || []));
    setParents(targetData.parents || []);
    setEggs(targetData.eggs || []);
    
    showToast(`已切换至账号：${accounts.find(a => a.id === accountId)?.nickname || '未知账号'}`, "success");
  };

  const handleCreateAccount = (nickname: string, uid: string) => {
    if (!nickname.trim()) {
      showToast("昵称不能为空", "error");
      return;
    }
    const cleanUid = uid.trim() || "default";
    const newId = `acc_${Date.now()}`;
    const newAccount: Account = { id: newId, nickname: nickname.trim(), uid: cleanUid };
    const newData: AccountData = {
      pets: migratePets(INITIAL_TABLE_DATA),
      trades: [],
      parents: [],
      eggs: []
    };
    
    const updatedMap = {
      ...accountDataMap,
      [activeAccountId]: { pets, trades, parents, eggs }
    };

    setAccounts(prev => [...prev, newAccount]);
    setAccountDataMap({
      ...updatedMap,
      [newId]: newData
    });
    
    setActiveAccountId(newId);
    setPets(newData.pets);
    setTrades(newData.trades);
    setParents(newData.parents);
    setEggs(newData.eggs);
    
    setNewAccNickname("");
    setNewAccUid("");
    
    showToast(`成功创建并切换至账号：${nickname}`, "success");
  };

  const handleUpdateAccountInfo = (accountId: string, nickname: string, uid: string) => {
    if (!nickname.trim()) {
      showToast("昵称不能为空", "error");
      return;
    }
    setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, nickname: nickname.trim(), uid: uid.trim() } : a));
    setEditingAccountId(null);
    showToast("账号信息更新成功！", "success");
  };

  const handleDeleteAccount = (accountId: string) => {
    if (accounts.length <= 1) {
      showToast("必须保留至少一个账号！", "error");
      return;
    }
    
    const remainingAccounts = accounts.filter(a => a.id !== accountId);
    const updatedMap = { ...accountDataMap };
    delete updatedMap[accountId];
    
    setAccounts(remainingAccounts);
    setAccountDataMap(updatedMap);
    
    if (accountId === activeAccountId) {
      const nextActiveId = remainingAccounts[0].id;
      setActiveAccountId(nextActiveId);
      const nextData = updatedMap[nextActiveId] || { pets: [], trades: [], parents: [], eggs: [] };
      setPets(migratePets(nextData.pets || []));
      setTrades(migrateTrades(nextData.trades || []));
      setParents(nextData.parents || []);
      setEggs(nextData.eggs || []);
    }
    
    showToast("账号已成功删除！", "success");
  };

  const handleExportLongImage = async () => {
    showToast("正在生成高品质长图，请稍候...", "info");
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 150));

    // Find the target element in the real document
    const target = document.getElementById("export-container");
    if (!target) {
      showToast("找不到表格容器！", "error");
      return;
    }

    // Clone the node to avoid altering/re-rendering the on-screen live container
    const clone = target.cloneNode(true) as HTMLElement;

    // Synchronize form element states from original DOM to the cloned tree
    const originalInputs = Array.from(target.querySelectorAll("input"));
    const clonedInputs = Array.from(clone.querySelectorAll("input"));
    originalInputs.forEach((input, index) => {
      const inputEl = input as HTMLInputElement;
      if (clonedInputs[index]) {
        (clonedInputs[index] as HTMLInputElement).value = inputEl.value;
      }
    });

    const originalSelects = Array.from(target.querySelectorAll("select"));
    const clonedSelects = Array.from(clone.querySelectorAll("select"));
    originalSelects.forEach((select, index) => {
      const selectEl = select as HTMLSelectElement;
      if (clonedSelects[index]) {
        (clonedSelects[index] as HTMLSelectElement).value = selectEl.value;
      }
    });

    // Replace <input> elements in clone with beautiful static styled <div> elements
    // to bypass Chrome input-rendering bugs & avoid downward text-shifting
    clonedInputs.forEach((input, index) => {
      const inputEl = input as HTMLInputElement;
      const originalEl = originalInputs[index] as HTMLInputElement;
      const value = originalEl ? originalEl.value : "";
      const placeholder = inputEl.placeholder || "";
      const displayVal = value || placeholder;

      const div = document.createElement("div");
      // Inherit classes and paddings for seamless visual match
      div.className = inputEl.className;
      div.style.display = "inline-flex";
      div.style.alignItems = "center";
      div.style.whiteSpace = "nowrap";
      div.style.boxSizing = "border-box";
      div.textContent = displayVal || "—";

      // Inherit computed style to guarantee absolute pixel-level alignment & font sizes
      if (originalEl) {
        const computedStyle = window.getComputedStyle(originalEl);
        div.style.fontWeight = computedStyle.fontWeight;
        div.style.color = computedStyle.color;
        div.style.padding = computedStyle.padding;
        div.style.height = computedStyle.height;
        div.style.minHeight = computedStyle.minHeight;
        
        // Custom width: keep auto-width for w-full elements to adapt to 1200px container,
        // otherwise lock in the computed width to prevent collapse of fixed-width elements (like w-10)
        if (!originalEl.classList.contains("w-full")) {
          div.style.width = computedStyle.width;
        }
      }

      // Apply text alignment based on original input classes
      if (inputEl.classList.contains("text-left")) {
        div.style.justifyContent = "flex-start";
        div.style.textAlign = "left";
      } else if (inputEl.classList.contains("text-right")) {
        div.style.justifyContent = "flex-end";
        div.style.textAlign = "right";
      } else {
        div.style.justifyContent = "center";
        div.style.textAlign = "center";
      }

      if (!value) {
        div.classList.add("text-slate-400"); // placeholder styling color
      }

      // Add left padding preservation if it is the filter search bar input
      if (inputEl.placeholder === "搜索精灵名字...") {
        div.style.paddingLeft = "2.25rem";
      }

      inputEl.parentNode?.replaceChild(div, inputEl);
    });

    // Replace <select> tags in clone with matching static <div> elements
    // to render nicely inside the canvas, preventing baseline shifts
    clonedSelects.forEach((select, index) => {
      const selectEl = select as HTMLSelectElement;
      const originalEl = originalSelects[index] as HTMLSelectElement;
      const selectedIndex = originalEl ? originalEl.selectedIndex : selectEl.selectedIndex;
      const selectedOption = originalEl ? originalEl.options[selectedIndex] : selectEl.options[selectedIndex];
      const selectedText = selectedOption ? selectedOption.text : "";

      const div = document.createElement("div");
      div.className = selectEl.className;
      div.style.display = "inline-flex";
      div.style.alignItems = "center";
      div.style.justifyContent = "center";
      div.style.appearance = "none";
      div.style.whiteSpace = "nowrap";
      div.style.wordBreak = "keep-all";
      div.style.boxSizing = "border-box";
      div.textContent = selectedText;

      // Inherit computed style to guarantee absolute pixel-level alignment & font sizes
      if (originalEl) {
        const computedStyle = window.getComputedStyle(originalEl);
        div.style.fontWeight = computedStyle.fontWeight;
        div.style.color = computedStyle.color;
        
        // If it's a full-width select (status, brand, limit), clear excess padding to avoid wrapping.
        // For pill-badges (egg groups), keep computed padding.
        if (originalEl.classList.contains("w-full")) {
          div.style.paddingLeft = "4px";
          div.style.paddingRight = "4px";
        } else {
          div.style.padding = computedStyle.padding;
        }
        div.style.height = computedStyle.height;
        div.style.minHeight = computedStyle.minHeight;

        // Custom width: keep auto-width for w-full elements, otherwise lock in computed width
        if (!originalEl.classList.contains("w-full")) {
          div.style.width = computedStyle.width;
        }
      }

      selectEl.parentNode?.replaceChild(div, selectEl);
    });

    // Physical cleanup of the cloned DOM structure to prevent misalignments & overlapping
    // 1. Remove sorting (drag handle) columns and icons completely
    const clonedDragHandles = clone.querySelectorAll(".drag-handle-column");
    clonedDragHandles.forEach(el => el.remove());
    const clonedDragGrips = clone.querySelectorAll(".drag-grip-handle");
    clonedDragGrips.forEach(el => el.remove());

    // 2. Remove all interactive action/modification buttons to ensure layout cleaner
    const clonedActionButtons = clone.querySelectorAll(".action-buttons");
    clonedActionButtons.forEach(el => el.remove());
    const clonedSelectActions = clone.querySelectorAll(".select-action-buttons");
    clonedSelectActions.forEach(el => el.remove());

    // 3. Remove dropdown arrow SVGs to keep the text clean
    const clonedDropdownArrows = clone.querySelectorAll(".dropdown-arrow");
    clonedDropdownArrows.forEach(el => el.remove());

    // 4. Remove the first <col> in <colgroup> and redistribute percentages perfectly for remaining 7 columns
    const clonedColGroup = clone.querySelector("colgroup");
    if (clonedColGroup) {
      const cols = Array.from(clonedColGroup.querySelectorAll("col"));
      if (cols.length > 0) {
        cols[0].remove(); // Remove the sorting column col
        const remainingWidths = ["15%", "15.5%", "17.5%", "15.5%", "10.5%", "13%", "13%"];
        const remainingCols = Array.from(clonedColGroup.querySelectorAll("col"));
        remainingCols.forEach((col, idx) => {
          if (remainingWidths[idx]) {
            (col as HTMLElement).style.width = remainingWidths[idx];
          }
        });
      }
    }

    // Force all table headers to stay on a single line and avoid any text-wrapping
    const clonedThs = clone.querySelectorAll("th");
    clonedThs.forEach(th => {
      (th as HTMLElement).style.whiteSpace = "nowrap";
    });

    // Setup an absolute offscreen wrapper with absolute size (1200px wide) 
    // to give the browser layout engine an unconstrained, perfect canvas
    const wrapper = document.createElement("div");
    wrapper.style.position = "absolute";
    wrapper.style.left = "-9999px";
    wrapper.style.top = "-9999px";
    wrapper.style.width = "1200px";
    wrapper.style.height = "auto";
    const isCurrentlyDark = document.documentElement.classList.contains("dark");
    wrapper.style.backgroundColor = isCurrentlyDark ? "#020617" : "#f8fafc";

    // Customize clone layout style to spread beautifully over 1200px
    clone.style.width = "1200px";
    clone.style.maxWidth = "none";
    clone.style.borderRadius = "0px";
    clone.style.boxShadow = "none";
    clone.style.border = "none";
    clone.style.margin = "0";

    // Remove the bottom action buttons row inside clone so it is not captured in the exported image
    const clonedFooter = clone.querySelector("#footer-actions");
    if (clonedFooter) {
      clonedFooter.remove();
    }

    // Exclude header configuration buttons and the control panel from the export image
    const clonedWatermarkBtn = clone.querySelector("#header-watermark-btn");
    if (clonedWatermarkBtn) {
      clonedWatermarkBtn.remove();
    }
    const clonedExportBtn = clone.querySelector("#header-export-btn");
    if (clonedExportBtn) {
      clonedExportBtn.remove();
    }
    const clonedWatermarkPanel = clone.querySelector("#watermark-control-panel");
    if (clonedWatermarkPanel) {
      clonedWatermarkPanel.remove();
    }

    // Replace the title of custom breeding nest center in long image export
    const clonedNestTitle = clone.querySelector("#nest-center-title");
    if (clonedNestTitle) {
      clonedNestTitle.textContent = "我的窝点";
    }

    // Replace the title of custom breeding exchange center in long image export
    const clonedTradeTitle = clone.querySelector("#trade-center-title");
    if (clonedTradeTitle) {
      clonedTradeTitle.textContent = "我想换的蛋";
    }

    // Remove trade input form panel and delete buttons from long image export
    const clonedTradeForm = clone.querySelector("#trade-form-panel");
    if (clonedTradeForm) {
      clonedTradeForm.remove();
    }
    const clonedDeleteBtns = clone.querySelectorAll(".delete-trade-btn");
    clonedDeleteBtns.forEach(btn => {
      btn.remove();
    });

    // Expand overflow containers inside target clone fully, allowing table to fill column percentages naturally
    const overflowDiv = clone.querySelector(".overflow-x-auto") as HTMLElement;
    if (overflowDiv) {
      overflowDiv.style.overflow = "visible";
      overflowDiv.style.overflowX = "visible";
      const tableEl = overflowDiv.querySelector("table") as HTMLElement;
      if (tableEl) {
        tableEl.style.width = "100%";
        tableEl.style.minWidth = "0px";
      }
    }

    // Add custom diagonal watermarks if enabled
    if (enableWatermark) {
      // Watermark config: uid+nickname, sparse (360x260), opacity 20% (0.2), font-size 18px
      const currentAccount = accounts.find(a => a.id === activeAccountId);
      const computedWatermarkText = currentAccount
        ? `${currentAccount.nickname}${currentAccount.uid && currentAccount.uid !== "default" ? ` (UID: ${currentAccount.uid})` : ""}`
        : "默认账号";

      const wWidth = 360;
      const wHeight = 260;
      const wSize = 18;
      const wOpacity = 0.20;

      // Create a temporary canvas for the watermark tile
      const tileCanvas = document.createElement("canvas");
      tileCanvas.width = wWidth;
      tileCanvas.height = wHeight;
      const ctx = tileCanvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, wWidth, wHeight);
        ctx.font = `600 ${wSize}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = "#94a3b8";
        ctx.globalAlpha = wOpacity;
        // Translate and rotate around center
        ctx.translate(wWidth / 2, wHeight / 2);
        ctx.rotate((-23 * Math.PI) / 180);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(computedWatermarkText, 0, 0);
      }
      const watermarkDataUrl = tileCanvas.toDataURL("image/png");

      // Create full-screen pattern overlay div on top of cloned spreadsheet
      const watermarkDiv = document.createElement("div");
      watermarkDiv.style.position = "absolute";
      watermarkDiv.style.top = "0";
      watermarkDiv.style.left = "0";
      watermarkDiv.style.width = "100%";
      watermarkDiv.style.height = "100%";
      watermarkDiv.style.pointerEvents = "none";
      watermarkDiv.style.backgroundImage = `url("${watermarkDataUrl}")`;
      watermarkDiv.style.backgroundRepeat = "repeat";
      watermarkDiv.style.zIndex = "80"; // Cover table content elegantly

      clone.style.position = "relative";
      clone.appendChild(watermarkDiv);
    }

    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);
    document.body.classList.add("exporting");

    // 长图导出渲染时不再临时回退亮色模式，根据当前模式指定 Canvas 背景色，完美支持暗色导出
    const exportBgColor = isCurrentlyDark ? "#020617" : "#f8fafc";

    try {
      // Use html2canvas to render the offscreen clone with fixed scaling and size parameters
      const canvas = await html2canvas(clone, {
        backgroundColor: exportBgColor,
        scale: 2, // Double resolution for crystal-sharp text and borders
        useCORS: true,
        logging: false,
        width: 1200,
        windowWidth: 1200,
      });

      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

      setExportedImageUrl(dataUrl);
      setActiveModal("image-preview");
      showToast("长图已成功生成！", "success");
    } catch (error) {
      console.error("生成长图错误:", error);
      showToast("生成长图失败，请重试", "error");
    } finally {
      // Safely dispose of our temporary offscreen element wrapper
      if (document.body.contains(wrapper)) {
        document.body.removeChild(wrapper);
      }
      document.body.classList.remove("exporting");
      setIsExporting(false);
    }
  };

  // Drag and Drop End Callback
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setPets((items) => {
      const oldIndex = items.findIndex((p) => p.id === active.id);
      const newIndex = items.findIndex((p) => p.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        return arrayMove(items, oldIndex, newIndex);
      }
      return items;
    });
  };



  // Filter list
  const filteredPets = pets.filter(row => {
    const matchSprite = row.sprite.toLowerCase().includes(searchTerm.toLowerCase());
    const matchNature = filterNature === "" ||
      (row.fatherNatures && row.fatherNatures.includes(filterNature)) ||
      (row.motherNatures && row.motherNatures.includes(filterNature));
    const matchGroup = filterGroup === "" || row.groups.includes(filterGroup);
    const matchBrand = filterBrand === "" || row.brand === filterBrand;
    const matchStatus = filterStatus === "" || row.status === filterStatus;
    const matchLimit = filterLimit === "" || row.isLimit === filterLimit;
    const match3V = filter3V === "" || row.is3V === filter3V;
    const matchSameNature = !filterSameNature || (
      row.fatherNatures && row.motherNatures &&
      row.fatherNatures.length > 0 && row.motherNatures.length > 0 &&
      row.fatherNatures[0] && row.motherNatures[0] &&
      row.fatherNatures[0] === row.motherNatures[0]
    );
    return matchSprite && matchNature && matchGroup && matchBrand && matchStatus && matchLimit && match3V && matchSameNature;
  });


  const filteredEggs = eggs.filter((egg) => {
    const matchSprite = egg.sprite.toLowerCase().includes(eggSearchTerm.toLowerCase());
    
    const petDetails = getPetDetails(egg.sprite);
    const groups = petDetails ? petDetails.groups : [];
    const matchGroup = !eggFilterGroup || groups.includes(eggFilterGroup);
    
    const matchBrand = !eggFilterBrand || egg.brand === eggFilterBrand;
    
    const statusType = getEggStatusType(egg);
    let matchLimit = true;
    if (eggFilterLimit === "极限") {
      matchLimit = statusType === "极限大" || statusType === "极限小";
    } else if (eggFilterLimit === "达标") {
      matchLimit = statusType === "大块头达标" || statusType === "小不点达标";
    } else if (eggFilterLimit === "临界") {
      matchLimit = statusType === "大块头临界" || statusType === "小不点临界";
    } else if (eggFilterLimit === "普通") {
      matchLimit = statusType === "普通";
    }

    const is3V = isEgg3V(egg);
    const match3V = eggFilter3V === "" || 
      (eggFilter3V === "是" && is3V) || 
      (eggFilter3V === "否" && !is3V);

    return matchSprite && matchGroup && matchBrand && matchLimit && match3V;
  });

  const totalEggPages = Math.ceil(filteredEggs.length / EGG_PAGE_SIZE) || 1;
  const paginatedEggs = isExporting ? filteredEggs : filteredEggs.slice((eggCurrentPage - 1) * EGG_PAGE_SIZE, eggCurrentPage * EGG_PAGE_SIZE);

  useEffect(() => {
    setEggCurrentPage(1);
  }, [eggSearchTerm, eggFilterGroup, eggFilterBrand, eggFilterLimit, eggFilter3V]);

  useEffect(() => {
    if (eggCurrentPage > totalEggPages) {
      setEggCurrentPage(totalEggPages);
    }
  }, [filteredEggs.length, totalEggPages, eggCurrentPage]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalEggPages <= 7) {
      for (let i = 1; i <= totalEggPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (eggCurrentPage > 3) {
        pages.push("...");
      }
      const start = Math.max(2, eggCurrentPage - 1);
      const end = Math.min(totalEggPages - 1, eggCurrentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (eggCurrentPage < totalEggPages - 2) {
        pages.push("...");
      }
      pages.push(totalEggPages);
    }
    return pages;
  };

  // 蛋数量排序字段与方向状态 (默认降序排序，符合用户对蛋窝现蛋多寡的一目了然查询需求)
  const [nestSortField, setNestSortField] = useState<"eggCount" | null>("eggCount");
  const [nestSortDirection, setNestSortDirection] = useState<"asc" | "desc">("desc");

  // 蛋窝排序计算
  const sortedNests = [...filteredPets];
  if (nestViewMode === "table" && nestSortField === "eggCount") {
    sortedNests.sort((a, b) => {
      const countA = Number(a.eggCount) || 0;
      const countB = Number(b.eggCount) || 0;
      return nestSortDirection === "desc" ? countB - countA : countA - countB;
    });
  }

  // 蛋窝分页计算
  const totalNestPages = Math.ceil(sortedNests.length / NEST_PAGE_SIZE) || 1;
  const paginatedNests = isExporting ? sortedNests : sortedNests.slice((nestCurrentPage - 1) * NEST_PAGE_SIZE, nestCurrentPage * NEST_PAGE_SIZE);

  useEffect(() => {
    setNestCurrentPage(1);
  }, [searchTerm, filterNature, filterGroup, filterBrand, filterStatus, filterLimit, filter3V]);

  useEffect(() => {
    if (nestCurrentPage > totalNestPages) {
      setNestCurrentPage(totalNestPages);
    }
  }, [filteredPets.length, totalNestPages, nestCurrentPage]);

  // 父母本过滤与分页计算
  const visibleFathers = parents.filter((p) => {
    if (p.gender !== "♂") return false;
    const matchName = !fatherSearchTerm || p.sprite.toLowerCase().includes(fatherSearchTerm.toLowerCase());
    const matchNature = !fatherNatureSearch || p.nature.toLowerCase().includes(fatherNatureSearch.toLowerCase());
    const petDetails = getPetDetails(p.sprite);
    const groups = petDetails ? petDetails.groups : [];
    const matchGroup = !fatherFilterGroup || groups.includes(fatherFilterGroup);
    const matchBrand = !fatherFilterBrand || p.brand === fatherFilterBrand;
    return matchName && matchNature && matchGroup && matchBrand;
  });

  const totalFatherPages = Math.ceil(visibleFathers.length / PARENT_PAGE_SIZE) || 1;
  const paginatedFathers = isExporting ? visibleFathers : visibleFathers.slice((fatherCurrentPage - 1) * PARENT_PAGE_SIZE, fatherCurrentPage * PARENT_PAGE_SIZE);

  useEffect(() => {
    setFatherCurrentPage(1);
  }, [fatherSearchTerm, fatherNatureSearch, fatherFilterGroup, fatherFilterBrand]);

  useEffect(() => {
    if (fatherCurrentPage > totalFatherPages) {
      setFatherCurrentPage(totalFatherPages);
    }
  }, [visibleFathers.length, totalFatherPages, fatherCurrentPage]);

  const visibleMothers = parents.filter((p) => {
    if (p.gender !== "♀") return false;
    const matchName = !motherSearchTerm || p.sprite.toLowerCase().includes(motherSearchTerm.toLowerCase());
    const matchNature = !motherNatureSearch || p.nature.toLowerCase().includes(motherNatureSearch.toLowerCase());
    const petDetails = getPetDetails(p.sprite);
    const groups = petDetails ? petDetails.groups : [];
    const matchGroup = !motherFilterGroup || groups.includes(motherFilterGroup);
    const matchBrand = !motherFilterBrand || p.brand === motherFilterBrand;
    return matchName && matchNature && matchGroup && matchBrand;
  });

  const totalMotherPages = Math.ceil(visibleMothers.length / PARENT_PAGE_SIZE) || 1;
  const paginatedMothers = isExporting ? visibleMothers : visibleMothers.slice((motherCurrentPage - 1) * PARENT_PAGE_SIZE, motherCurrentPage * PARENT_PAGE_SIZE);

  useEffect(() => {
    setMotherCurrentPage(1);
  }, [motherSearchTerm, motherNatureSearch, motherFilterGroup, motherFilterBrand]);

  useEffect(() => {
    if (motherCurrentPage > totalMotherPages) {
      setMotherCurrentPage(totalMotherPages);
    }
  }, [visibleMothers.length, totalMotherPages, motherCurrentPage]);

  const handleDoubleClickParent = (parentId: string, gender: "♂" | "♀") => {
    // 1. 切换对应仓库为卡片模式
    if (gender === "♂") {
      setFatherViewMode("card");
    } else {
      setMotherViewMode("card");
    }
    // 2. 选中该卡片
    setSelectedCard({ id: parentId, type: "parent" });
    
    // 3. 计算并跳转到对应的卡片所在的页码
    const list = gender === "♂" ? visibleFathers : visibleMothers;
    const index = list.findIndex(p => p.id === parentId);
    if (index !== -1) {
      const page = Math.floor(index / PARENT_PAGE_SIZE) + 1;
      if (gender === "♂") {
        setFatherCurrentPage(page);
      } else {
        setMotherCurrentPage(page);
      }
    }

    // 4. 滚动到对应卡片
    setTimeout(() => {
      const element = document.getElementById(`parent-card-${parentId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 120);
  };

  // 通用分页器按钮列表计算函数
  const getPageNumbersHelper = (currentPage: number, totalPages: number) => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push("...");
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push("...");
      }
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div
      className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white"
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (!target.closest(".nest-card, .parent-card, .egg-card, .drag-grip-handle, .action-buttons, .select-action-buttons, .stat-icon-select-container")) {
          setSelectedCard(null);
        }
      }}
    >
      <div
        id="export-container"
        className="max-w-[1400px] mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden"
      >
        {/* Banner Section */}
        <div className="bg-slate-900 text-white p-4 sm:p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 relative overflow-hidden">
          {/* Decorative background radial glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 sm:gap-6 z-10 w-full md:w-auto">
            {/* Logo box */}
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center bg-slate-800 rounded-xl sm:rounded-2xl shadow-inner border border-slate-700/50">
              <Egg className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400 animate-pulse" />
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
            </div>

            <div>
              <h1 className="font-display text-lg sm:text-2xl md:text-3xl font-bold tracking-tight">
                洛克王国孵蛋数据管理系统
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1 max-w-xl font-normal leading-relaxed">
                全属性宠物、蛋组和性格匹配中心。<br />支持本地持久化存储并附带实时蛋组信息与性格加减状态。
              </p>
            </div>
          </div>

          {/* Credits section */}
          <div className="flex flex-col text-center md:text-right items-center md:items-end gap-1.5 z-10 shrink-0 w-full md:w-auto border-t md:border-t-0 border-slate-800/80 pt-3 md:pt-0">
            {/* Auto-save Status Badge */}
            <div className="flex items-center gap-1.5 bg-slate-800/85 border border-slate-700/50 rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 shadow-inner select-none transition-all whitespace-nowrap">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSaving ? "bg-amber-400" : "bg-emerald-400"}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isSaving ? "bg-amber-500" : "bg-emerald-500"}`}></span>
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-300 font-sans tracking-wide whitespace-nowrap">
                {isSaving ? "正在实时保存..." : `数据已自动保存于：${lastSaved}`}
              </span>
            </div>
            {localSavePath && (
              <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-slate-400 font-mono bg-slate-900/60 border border-slate-800/80 px-2 py-0.5 rounded max-w-[260px] w-full sm:w-auto">
                <span className="truncate flex-1 text-left" title={localSavePath}>
                  存储路径: {localSavePath}
                </span>
                <button
                  onClick={handleChangeSavePath}
                  className="text-indigo-400 hover:text-indigo-350 cursor-pointer font-sans font-bold border-l border-slate-800 pl-1.5 shrink-0 transition-colors select-none"
                  title="点击更改自动保存文件夹"
                >
                  修改
                </button>
              </div>
            )}

            <span className="text-[11px] sm:text-xs text-slate-400">
              Presented by <strong className="text-indigo-400 font-semibold font-display text-xs sm:text-sm">派 (QQ: 1095524934)</strong>
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-500 tracking-wider font-mono">
              © 2026 Roco Incubator Table
            </span>
            <div className="flex items-center gap-2 mt-1 sm:mt-1.5 flex-wrap justify-center md:justify-end">
              <button
                onClick={() => setActiveModal("about")}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-900 border border-slate-700/60 hover:border-slate-500/50 px-2 py-1 rounded-lg transition-all cursor-pointer"
                title="关于本工具 / 数据来源与致谢"
              >
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>关于 &amp; 致谢</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab 导航切换 */}
        <div className="bg-slate-900 border-t border-slate-800 px-3 sm:px-6 md:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 select-none relative z-30">
          <div className="grid grid-cols-3 gap-1 w-full sm:flex sm:gap-4 sm:w-auto whitespace-nowrap shrink-0">
            <button
              onClick={() => setActiveTab("nest")}
              className={`px-1 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === "nest"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-100"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Egg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="sm:hidden">培育中心</span>
              <span className="hidden sm:inline">蛋窝与需求中心</span>
            </button>
            <button
              onClick={() => setActiveTab("parents")}
              className={`px-1 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === "parents"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-100"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="sm:hidden">父母本库</span>
              <span className="hidden sm:inline">父母本管理中心</span>
            </button>
            <button
              onClick={() => setActiveTab("eggs")}
              className={`px-1 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === "eggs"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-100"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="sm:hidden">精灵蛋库</span>
              <span className="hidden sm:inline">蛋管理中心</span>
            </button>
          </div>

          {/* 账号快速切换下拉菜单 */}
          <div className="w-full sm:w-auto flex items-center justify-center sm:justify-end gap-3 relative">
            {/* 亮/暗色主题切换按钮 */}
            <button
              id="theme-toggle-btn"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-700/80 hover:border-slate-500/50 rounded-xl transition-all cursor-pointer shadow-sm relative group flex items-center justify-center shrink-0"
              title={theme === "light" ? "切换至暗色模式" : "切换至亮色模式"}
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 text-slate-400 group-hover:text-slate-100" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400 transition-all duration-300 group-hover:scale-110 group-hover:rotate-45" />
              )}
            </button>

            <div className="relative inline-block text-left select-none">
              <button
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="flex items-center gap-2 text-xs text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 hover:border-indigo-500/50 px-3 py-2 rounded-xl transition-all cursor-pointer font-medium shadow-sm hover:shadow shadow-indigo-950/20"
                title="点击切换账号或进行账号管理"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse"></span>
                <div className="flex items-center gap-1">
                  <span className="truncate max-w-[110px] font-bold">
                    {accounts.find(a => a.id === activeAccountId)?.nickname || "默认账号"}
                  </span>
                  {(() => {
                    const activeAcc = accounts.find(a => a.id === activeAccountId);
                    return activeAcc?.uid && activeAcc.uid !== "default" ? (
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        ({activeAcc.uid})
                      </span>
                    ) : null;
                  })()}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0" style={{ transform: showAccountDropdown ? 'rotate(180deg)' : 'none' }} />
              </button>

              {showAccountDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAccountDropdown(false)}></div>
                  <div className="absolute right-1/2 translate-x-1/2 sm:right-0 sm:translate-x-0 mt-2 w-64 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-[0_12px_40px_rgba(0,0,0,0.7)] z-50 overflow-hidden font-sans animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-950/20 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0110.081 18a11.375 11.375 0 01-6-3.297M14.214 15.584a2 2 0 00-2.583-1.246 3.5 3.5 0 00-4.047 3.07M3 10a4 4 0 118 0 4 4 0 01-8 0z" />
                      </svg>
                      <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">切换账号</span>
                    </div>
                    <div className="max-h-60 overflow-y-auto px-2 py-1.5 flex flex-col gap-1">
                      {accounts.map(acc => {
                        const isActive = acc.id === activeAccountId;
                        return (
                          <button
                            key={acc.id}
                            onClick={() => {
                              handleSwitchAccount(acc.id);
                              setShowAccountDropdown(false);
                            }}
                            className={`group w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-all duration-200 rounded-xl border cursor-pointer ${
                              isActive 
                                ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-300 font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
                                : "bg-transparent border-transparent text-slate-300 hover:bg-slate-800/60 hover:text-white hover:border-slate-700/30"
                            }`}
                          >
                            <span className="truncate flex-1 pr-2">{acc.nickname}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              {acc.uid && acc.uid !== "default" && (
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md border transition-all duration-200 ${
                                  isActive
                                    ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                                    : "bg-slate-800/50 border-slate-800/80 text-slate-500 group-hover:text-slate-300 group-hover:border-slate-700/50"
                                }`}>
                                  {acc.uid}
                                </span>
                              )}
                              {isActive && (
                                <svg className="w-3.5 h-3.5 text-indigo-400 animate-in zoom-in-50 duration-200" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="border-t border-slate-800/80 p-2 bg-slate-950/10">
                      <button
                        onClick={() => {
                          setShowAccountDropdown(false);
                          setShowAccountModal(true);
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-550/10 border border-transparent hover:border-indigo-500/20 font-bold flex items-center justify-between transition-all duration-200 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <Settings className="w-3.5 h-3.5 transition-transform duration-500 group-hover:rotate-90 text-indigo-400" />
                          <span>账号管理 &amp; 备份</span>
                        </div>
                        <svg className="w-3.5 h-3.5 text-indigo-400 opacity-60 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {activeTab === "nest" && (
          <>
            {/* Real-time stats section */}
            <div className="p-5 bg-slate-50/30 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
                        {/* Card 1: 总收录 */}
            <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-3 sm:p-4 flex flex-col justify-between min-h-[80px] sm:min-h-[96px] relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-slate-50 dark:bg-slate-800/40 rounded-full group-hover:scale-110 transition-transform duration-300 pointer-events-none" />
              <div className="flex items-center justify-between z-10">
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold">总收录精灵</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-800">
                  <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                </div>
              </div>
              <div className="mt-2 sm:mt-2.5 z-10 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black font-mono text-slate-800 dark:text-slate-200 tracking-tight">{totalPets}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">只</span>
              </div>
            </div>

            {/* Card 2: 牌子规格 */}
            <div className="col-span-2 md:col-span-1 lg:col-span-1 order-last bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-3 sm:p-4 flex flex-col justify-between min-h-[80px] sm:min-h-[96px] relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-indigo-50/30 dark:bg-indigo-950/10 rounded-full group-hover:scale-110 transition-transform duration-300 pointer-events-none" />
              <div className="flex items-center justify-between z-10">
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold">牌子规格统计</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-lg flex items-center justify-center border border-indigo-100/50 dark:border-indigo-900/40">
                  <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 mt-2 sm:mt-2.5 z-10">
                {(["大婉", "大粗", "普通", "小婉", "小粗", "单大块头"] as const).map((brand, idx) => {
                  const colors = [
                    "bg-rose-50/60 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border-rose-100/60 dark:border-rose-900/30",
                    "bg-amber-50/60 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-100/60 dark:border-amber-900/30",
                    "bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-100/60 dark:border-emerald-900/30",
                    "bg-blue-50/60 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-100/60 dark:border-blue-900/30",
                    "bg-purple-50/60 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border-purple-100/60 dark:border-purple-900/30",
                    "bg-slate-50/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-100/60 dark:border-slate-700/60"
                  ];
                  return (
                    <div key={brand} className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg border ${colors[idx]} text-center`}>
                      <span className="text-[9px] font-extrabold scale-90 origin-center truncate w-full">{brand}</span>
                      <span className="text-xs font-bold font-mono mt-0.5">{brandStats[brand] || 0}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card 3: 现有窝点 */}
            <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-3 sm:p-4 flex flex-col justify-between min-h-[80px] sm:min-h-[96px] relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-50 dark:bg-emerald-950/10 rounded-full group-hover:scale-110 transition-transform duration-300 pointer-events-none" />
              <div className="flex items-center justify-between z-10">
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold">现有现蛋窝点</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
                  <Egg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                </div>
              </div>
              <div className="mt-2 sm:mt-2.5 z-10 flex items-baseline gap-1 flex-wrap">
                <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">{hasEggsCount}</span>
                <span className="text-[10px] sm:text-xs text-emerald-500 dark:text-emerald-400 font-semibold">窝({totalEggsCount}蛋)</span>
              </div>
            </div>

            {/* Card 4: 极限蛋 */}
            <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-3 sm:p-4 flex flex-col justify-between min-h-[80px] sm:min-h-[96px] relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-50 dark:bg-amber-950/10 rounded-full group-hover:scale-110 transition-transform duration-300 pointer-events-none" />
              <div className="flex items-center justify-between z-10">
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold">极限精灵蛋</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-amber-50 dark:bg-amber-950/40 rounded-lg flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 dark:text-amber-405 shrink-0" />
                </div>
              </div>
              <div className="mt-2 sm:mt-2.5 z-10 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black font-mono text-amber-500 dark:text-amber-400 tracking-tight">{limitsCount}</span>
                <span className="text-xs text-amber-500 dark:text-amber-400 font-semibold">只</span>
              </div>
            </div>

            {/* Card 5: 3V蛋 */}
            <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-3 sm:p-4 flex flex-col justify-between min-h-[80px] sm:min-h-[96px] relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-rose-50 dark:bg-rose-950/10 rounded-full group-hover:scale-110 transition-transform duration-300 pointer-events-none" />
              <div className="flex items-center justify-between z-10">
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold">3V 精灵蛋</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-rose-50 dark:bg-rose-950/40 rounded-lg flex items-center justify-center border border-rose-100 dark:border-rose-900/50">
                  <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 dark:text-rose-405 shrink-0" />
                </div>
              </div>
              <div className="mt-2 sm:mt-2.5 z-10 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400 tracking-tight">{threeVsCount}</span>
                <span className="text-xs text-rose-500 dark:text-rose-400 font-semibold">只</span>
              </div>
            </div>
          </div>
        </div>        {/* Filters Header Row */}
        <div id="filter-header-bar" className="p-4 bg-slate-50/20 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center w-full">
            {/* Search filter input and mobile toggle */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48 sm:flex-none">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="搜索精灵名字..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950 transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="sm:hidden px-3 py-1.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-100 dark:border-indigo-900 flex items-center gap-1 active:bg-indigo-100 transition-all shrink-0"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{showMobileFilters ? "收起" : "筛选"}</span>
              </button>
            </div>

            {/* Other filters - collapsible on mobile */}
            <div className={`${showMobileFilters ? "flex flex-col gap-2 w-full mt-2" : "hidden"} sm:mt-0 sm:flex sm:flex-row sm:items-center sm:flex-wrap sm:gap-3 sm:w-auto sm:flex-1`}>
              {/* Filter by nature */}
              <select
                value={filterNature}
                onChange={e => setFilterNature(e.target.value)}
                className="text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors w-full sm:w-auto"
              >
                <option value="" className="dark:bg-slate-800">全部性格</option>
                {NATURE_OPTIONS.map(nature => (
                  <option key={nature} value={nature} className="dark:bg-slate-800">{nature}</option>
                ))}
              </select>

              {/* Filter by egg group */}
              <select
                value={filterGroup}
                onChange={e => setFilterGroup(e.target.value)}
                className="text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors w-full sm:w-auto"
              >
                <option value="" className="dark:bg-slate-800">全部蛋组</option>
                {EGG_GROUPS.map(group => (
                  <option key={group} value={group} className="dark:bg-slate-800">{group}</option>
                ))}
              </select>

              {/* Filter by brand */}
              <select
                value={filterBrand}
                onChange={e => setFilterBrand(e.target.value)}
                className={`text-xs border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer font-bold transition-all w-full sm:w-auto ${
                  filterBrand ? getBrandStyle(filterBrand) : 'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <option value="" className="dark:bg-slate-800">全部牌子</option>
                {BRAND_OPTIONS.map(brand => (
                  <option key={brand} value={brand} className="dark:bg-slate-800">{brand}</option>
                ))}
              </select>

              {/* Filter by status */}
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className={`text-xs border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-350 cursor-pointer font-bold transition-all w-full sm:w-auto ${
                  filterStatus ? getStatusStyle(filterStatus) : 'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <option value="" className="dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold py-1">全部状态/窝点</option>
                {NEST_STATUS_OPTIONS.map(status => (
                  <option key={status} value={status} className="dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-semibold py-1">
                    {status}
                  </option>
                ))}
              </select>

              {/* Filter by limit */}
              <select
                value={filterLimit}
                onChange={e => setFilterLimit(e.target.value)}
                className="text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors w-full sm:w-auto"
              >
                <option value="" className="dark:bg-slate-800">全部(有无极限蛋)</option>
                {LIMIT_OPTIONS.map(opt => (
                  <option key={opt} value={opt} className="dark:bg-slate-800">{opt}</option>
                ))}
              </select>

              {/* Filter by 3V */}
              <select
                value={filter3V}
                onChange={e => setFilter3V(e.target.value)}
                className="text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors w-full sm:w-auto"
              >
                <option value="" className="dark:bg-slate-800">全部(有无3V蛋)</option>
                <option value="是" className="dark:bg-slate-800">仅3V蛋</option>
                <option value="否" className="dark:bg-slate-800">仅非3V蛋</option>
              </select>

              {/* 父母同性格筛选 */}
              <label className="text-xs font-bold py-1.5 px-3 rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-2 w-full sm:w-auto select-none bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm">
                <input
                  type="checkbox"
                  checked={filterSameNature}
                  onChange={e => setFilterSameNature(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-650 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700 cursor-pointer"
                />
                <span>父母同性格</span>
              </label>

              {/* Watermark toggle */}
              <label
                id="header-watermark-btn"
                className={`sm:ml-auto text-xs font-bold py-1.5 px-3 rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-2 w-full sm:w-auto select-none ${
                  enableWatermark
                    ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 shadow-sm"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm"
                }`}
                title="开启/关闭长图导出时的防盗水印"
              >
                <input
                  type="checkbox"
                  checked={enableWatermark}
                  onChange={e => setEnableWatermark(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-350 accent-indigo-600 cursor-pointer"
                />
                <span>防盗水印</span>
              </label>
            </div>
          </div>
        </div>

        {/* 我的蛋窝点看板标题 */}
        <div className="p-6 bg-slate-50/30 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100/50 dark:border-indigo-900/50">
              <Egg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h2 id="nest-center-title" className="text-lg font-bold text-slate-800 dark:text-slate-200">我的精灵蛋窝中心</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">管理与培育您的极品精灵蛋与蛋窝状态</p>
            </div>
          </div>
          <div className="flex items-center gap-2 select-none shrink-0 action-buttons">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800 px-2.5 py-1.5 rounded-full border border-slate-200/40 dark:border-slate-700">
              当前有 {filteredPets.length} 个蛋窝
            </span>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
              <button
                onClick={() => setNestViewMode("card")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  nestViewMode === "card"
                    ? "bg-white dark:bg-slate-700 text-indigo-650 dark:text-indigo-400 shadow-3xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
                title="卡片网格模式"
              >
                <LayoutGrid className="w-3 h-3" />
                卡片
              </button>
              <button
                onClick={() => setNestViewMode("table")}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  nestViewMode === "table"
                    ? "bg-white dark:bg-slate-700 text-indigo-650 dark:text-indigo-400 shadow-3xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
                title="数据表格模式"
              >
                <Table className="w-3 h-3" />
                表格
              </button>
            </div>
          </div>
        </div>

        {/* Main Editable Card Grid Container */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-950">
          {nestViewMode === "card" ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={paginatedNests.map(p => p.id as string)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {paginatedNests.map((pet) => (
                    <SortableCard
                      key={pet.id}
                      pet={pet}
                      handleDeletePet={handleDeletePet}
                      handleUpdateSprite={handleUpdateSprite}
                      handleUpdateParentName={handleUpdateParentName}
                      handleUpdateNature={handleUpdateNature}
                      handleRemoveNature={handleRemoveNature}
                      handleAddNature={handleAddNature}
                      handleUpdateStat={handleUpdateStat}
                      handleUpdateGroup={handleUpdateGroup}
                      handleRemoveGroup={handleRemoveGroup}
                      handleAddGroup={handleAddGroup}
                      handleUpdateBrand={handleUpdateBrand}
                      handleUpdateStatus={handleUpdateStatus}
                      handleUpdateLimit={handleUpdateLimit}
                      handleUpdateHideStats={handleUpdateHideStats}
                      handleUpdateEggCount={handleUpdateEggCount}
                      onProduceEgg={handleProduceEgg}
                      isSelected={selectedCard?.id === pet.id && selectedCard?.type === "nest"}
                      onSelect={() => setSelectedCard({ id: pet.id as string, type: "nest" })}
                      onHover={(hovered) => setHoveredCard(hovered ? { id: pet.id as string, type: "nest" } : null)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="overflow-x-auto w-full rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 table-fixed">
                <thead>
                  <tr className="bg-indigo-600 dark:bg-indigo-950/80 text-white select-none">
                    <th className="px-2 py-4 text-center text-xs font-extrabold tracking-wider w-[5%]">#</th>
                    <th className="px-3 py-4 text-left text-xs font-extrabold tracking-wider w-[14%]">精灵</th>
                    <th className="px-2 py-4 text-center text-xs font-extrabold tracking-wider w-[12%]">性格</th>
                    <th className="px-2 py-4 text-center text-xs font-extrabold tracking-wider w-[13%]">蛋组</th>
                    <th className="px-3 py-4 text-center text-xs font-extrabold tracking-wider w-[18%]">三维</th>
                    <th className="px-2 py-4 text-center text-xs font-extrabold tracking-wider w-[11%]">牌子</th>
                    <th className="px-2 py-4 text-center text-xs font-extrabold tracking-wider w-[12%]">蛋窝状态</th>
                    <th
                      onClick={() => {
                        if (nestSortField !== "eggCount") {
                          setNestSortField("eggCount");
                          setNestSortDirection("desc");
                        } else if (nestSortDirection === "desc") {
                          setNestSortDirection("asc");
                        } else {
                          setNestSortField(null);
                        }
                      }}
                      className="px-2 py-4 text-center text-xs font-extrabold tracking-wider w-[9%] cursor-pointer hover:bg-indigo-700 select-none transition-colors"
                      title="点击切换现蛋排序：降序 -> 升序 -> 默认"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>现蛋</span>
                        {nestSortField === "eggCount" ? (
                          nestSortDirection === "desc" ? "⬇️" : "⬆️"
                        ) : (
                          <span className="opacity-35 text-[10px]">↕️</span>
                        )}
                      </div>
                    </th>
                    <th className="px-2 py-4 text-center text-xs font-extrabold tracking-wider w-[6%] action-buttons">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {paginatedNests.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 font-bold">
                        没有找到符合筛选条件的蛋窝数据
                      </td>
                    </tr>
                  ) : (
                    paginatedNests.map((pet, idx) => {
                      const petDetails = getPetDetails(pet.sprite);
                      const spriteName = petDetails ? petDetails.name : pet.sprite;
                      const spriteFile = getSpriteFileName(pet.sprite);
                      const spriteUrl = spriteFile ? getImagePath(`images/sprites/${spriteFile}`) : null;
                      const types = petDetails?.types || [];

                      const rowNum = (nestCurrentPage - 1) * NEST_PAGE_SIZE + idx + 1;

                      const fNats = pet.fatherNatures || [];
                      const mNats = pet.motherNatures || [];
                      const fNat = fNats[0] || "未洗";
                      const mNat = mNats[0] || "未洗";
                      const naturesEqual = fNat === mNat;

                      const fStats = pet.fatherStats || [];
                      const mStats = pet.motherStats || [];
                      const fStr = fStats.filter(s => s !== "无").join('、') || "无";
                      const mStr = mStats.filter(s => s !== "无").join('、') || "无";
                      const statsEqual = fStr === mStr;

                      const getShortNature = (nat: string) => {
                        if (!nat) return "";
                        return nat.split(" ")[0] || nat;
                      };

                      const petIs3V = isPet3V(pet);
                      let rowBgClass = "";
                      // 严格隔行交替背景色，奇数白，偶数淡青灰蓝，与图二视觉呼应
                      if (idx % 2 === 1) {
                        rowBgClass = "bg-[#f0f7ff]/60 dark:bg-slate-900/40 hover:bg-indigo-50/30 dark:hover:bg-slate-800/60";
                      } else {
                        rowBgClass = "bg-white dark:bg-slate-950 hover:bg-indigo-50/20 dark:hover:bg-slate-800/40";
                      }

                      return (
                        <tr
                          key={pet.id}
                          className={`transition-colors duration-200 border-b border-slate-100/80 dark:border-slate-800/50 ${rowBgClass}`}
                        >
                          <td className="px-2 py-3.5 text-center text-xs font-bold text-slate-400 dark:text-slate-500 font-mono align-middle">
                            {rowNum}
                          </td>
                          <td className="px-3 py-3 align-middle">
                            <div className="flex items-center gap-2.5 text-left">
                              <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-200/65 dark:border-slate-800 flex items-center justify-center relative overflow-hidden shrink-0">
                                {spriteUrl ? (
                                  <img src={spriteUrl} alt={spriteName} className="w-[85%] h-[85%] object-contain" />
                                ) : (
                                  <Egg className="w-5 h-5 text-slate-300 animate-pulse" />
                                )}
                              </div>
                              <div className="flex flex-col leading-tight min-w-0">
                                <span className="text-[13px] font-black text-slate-900 dark:text-slate-50 truncate">{spriteName}</span>
                                {types.length > 0 && (
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">{types.join('/')}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-3 text-center align-middle">
                            {naturesEqual ? (
                              <span className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{getShortNature(fNat)}</span>
                            ) : (
                              <div className="inline-flex flex-col text-left text-[11px] leading-normal font-semibold mx-auto">
                                <span className="text-slate-800 dark:text-slate-200"><span className="text-blue-500/70 mr-0.5 font-bold">♂</span>{getShortNature(fNat)}</span>
                                <span className="text-slate-850 dark:text-slate-200"><span className="text-pink-500/70 mr-0.5 font-bold">♀</span>{getShortNature(mNat)}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-3 text-center align-middle">
                            <div className="flex flex-wrap gap-1 justify-center">
                              {pet.groups.map(grp => (
                                <span
                                  key={grp}
                                  className={`inline-block text-[10.5px] font-extrabold border rounded-full px-2.5 py-0.5 ${getEggGroupStyle(grp)}`}
                                >
                                  {grp}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center align-middle">
                            {pet.hideStats ? (
                              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">已隐藏</span>
                            ) : statsEqual ? (
                              <span className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{fStr}</span>
                            ) : (
                              <div className="inline-flex flex-col text-left text-[11px] leading-normal font-semibold mx-auto">
                                <span className="text-slate-800 dark:text-slate-200"><span className="text-blue-500/70 mr-1 font-bold">♂</span>{fStr}</span>
                                <span className="text-slate-850 dark:text-slate-200"><span className="text-pink-500/70 mr-1 font-bold">♀</span>{mStr}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-3 text-center align-middle">
                            <div className="relative inline-block w-full max-w-[85px] mx-auto">
                              <select
                                value={pet.brand}
                                onChange={(e) => handleUpdateBrand(pet.id as string, e.target.value)}
                                className={`appearance-none text-[11px] font-extrabold text-center border-0 rounded-full py-1 px-2.5 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-950 transition-all shadow-3xs ${getBrandStyle(pet.brand)}`}
                              >
                                {BRAND_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt} className="dark:bg-slate-800 dark:text-slate-200">
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="px-2 py-3 text-center align-middle">
                            <div className="relative inline-block w-full max-w-[105px] mx-auto">
                              <select
                                value={pet.status}
                                onChange={(e) => handleUpdateStatus(pet.id as string, e.target.value)}
                                className={`appearance-none text-[11px] font-bold text-center border-0 rounded-full py-1 px-3 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-950 transition-all shadow-3xs ${getStatusStyle(pet.status)}`}
                              >
                                {NEST_STATUS_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt} className="dark:bg-slate-800 dark:text-slate-200 font-semibold py-1">
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="px-2 py-3 text-center align-middle">
                            {pet.status === "有现蛋" ? (
                              <div className="flex items-center justify-center gap-1 bg-amber-50/80 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-extrabold border border-amber-200/50 dark:border-amber-900/40 rounded-full pl-2.5 pr-1.5 py-0.5 w-[72px] mx-auto shadow-3xs group/egg">
                                <input
                                  type="number"
                                  min="0"
                                  value={pet.eggCount || "0"}
                                  onChange={(e) => handleUpdateEggCount(pet.id as string, e.target.value)}
                                  className="w-7 bg-transparent text-center text-sm font-black border-0 p-0 focus:ring-0 focus:outline-none text-amber-800 dark:text-amber-200"
                                />
                                <div className="flex flex-col gap-0.5 shrink-0 select-none text-[8px] font-bold text-amber-500/70 hover:text-amber-700">
                                  <button
                                    onClick={() => handleUpdateEggCount(pet.id as string, String(Number(pet.eggCount || 0) + 1))}
                                    className="hover:text-amber-600 cursor-pointer"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    onClick={() => handleUpdateEggCount(pet.id as string, String(Math.max(0, Number(pet.eggCount || 0) - 1)))}
                                    className="hover:text-amber-600 cursor-pointer"
                                  >
                                    ▼
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-slate-50/60 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold border border-slate-100 dark:border-slate-800/40 rounded-full py-0.5 w-[72px] text-center mx-auto text-xs select-none">
                                0
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-3 text-center align-middle action-buttons">
                            <button
                              onClick={() => handleDeletePet(pet.id as string)}
                              className="text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 p-1.5 rounded-lg transition-colors cursor-pointer"
                              title="删除该蛋窝"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 蛋窝中心分页控制器 */}
          {totalNestPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-1 py-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium select-none text-left">
                共 <span className="font-bold font-mono text-slate-700 dark:text-slate-300">{filteredPets.length}</span> 个蛋窝，
                当前展示第 <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">{(nestCurrentPage - 1) * NEST_PAGE_SIZE + 1}-{Math.min(nestCurrentPage * NEST_PAGE_SIZE, filteredPets.length)}</span> 个
              </div>
              <div className="flex items-center gap-1.5 select-none">
                <button
                  onClick={() => setNestCurrentPage(1)}
                  disabled={nestCurrentPage === 1}
                  className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-305 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed text-xs font-semibold"
                >
                  首页
                </button>
                <button
                  onClick={() => setNestCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={nestCurrentPage === 1}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-305 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  上一页
                </button>
                <div className="flex items-center gap-1">
                  {getPageNumbersHelper(nestCurrentPage, totalNestPages).map((pageNum, idx) => {
                    if (pageNum === "...") {
                      return (
                        <span key={`nest-dots-${idx}`} className="px-2 text-slate-400 font-bold text-xs">
                          ...
                        </span>
                      );
                    }
                    return (
                      <button
                        key={`nest-page-${pageNum}`}
                        onClick={() => setNestCurrentPage(Number(pageNum))}
                        className={`w-8 h-8 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center ${
                          nestCurrentPage === pageNum
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 border border-indigo-600"
                            : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-700"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setNestCurrentPage(prev => Math.min(totalNestPages, prev + 1))}
                  disabled={nestCurrentPage === totalNestPages}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-305 hover:bg-slate-55 dark:hover:bg-slate-700 disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1"
                >
                  下一页
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setNestCurrentPage(totalNestPages)}
                  disabled={nestCurrentPage === totalNestPages}
                  className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-55 dark:hover:bg-slate-700 disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed text-xs font-semibold"
                >
                  末页
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom utility controls */}
        <div id="footer-actions" className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-between">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-2.5 items-center w-full sm:w-auto">
            {/* Adding row button */}
            <button
              onClick={handleAddPet}
              className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 shadow-sm text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              添加新精灵
            </button>

            {/* Reset directory */}
            <button
              onClick={() => handleReset("nest")}
              className="py-2 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 rounded-lg transition-all font-medium flex items-center justify-center gap-2 shadow-sm text-sm cursor-pointer"
              title="一键还原到默认精灵列表"
            >
              <RefreshCw className="w-4 h-4 dark:text-slate-400" />
              初始化列表
            </button>

            {/* Import JSON button */}
            <button
              onClick={handleImportNestClick}
              className="py-2 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 rounded-lg transition-all font-medium flex items-center justify-center gap-2 shadow-sm text-sm cursor-pointer flex items-center gap-1.5"
              title="从备份文件或文本导入数据"
            >
              <Upload className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              导入数据
            </button>

            {/* Export JSON button */}
            <button
              onClick={handleExportNestClick}
              className="py-2 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 rounded-lg transition-all font-medium flex items-center justify-center gap-2 shadow-sm text-sm cursor-pointer flex items-center gap-1.5"
              title="导出当前列表数据作为备份"
            >
              <Share2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              导出数据
            </button>

            {/* Export Long Image button */}
            <button
              onClick={handleExportLongImage}
              className="col-span-2 sm:col-span-1 py-2 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg transition-all font-bold flex items-center justify-center gap-2 shadow-md text-sm cursor-pointer"
              title="一键将完整的表格渲染成精美长图，并保留所有行与设计细节"
            >
              <Camera className="w-4 h-4 text-white animate-pulse" />
              一键导出长图
            </button>
          </div>
        </div>

        {/* 自建换蛋交易看板 */}
        <div className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          {/* 标题 */}
          <div className="p-6 bg-slate-50/30 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100/50 dark:border-indigo-900/50">
                <RefreshCw className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 id="trade-center-title" className="text-lg font-bold text-slate-800 dark:text-slate-200">自建换蛋需求中心</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">发布并管理您需要的或者可以提供交换的宠物蛋信息</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200/40 dark:border-slate-700">
              共有 {trades.length} 条需求
            </span>
          </div>

          {/* 表单输入区域 */}
          <div id="trade-form-panel" className="p-6 bg-slate-50/10 dark:bg-slate-950/10 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-x-5 gap-y-4 items-start">
            {/* 第一行：核心配置 */}
            {/* 精灵选择 */}
            <div className="md:col-span-5 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">精灵名称</label>
              <div className="flex items-center gap-3 w-full">
                {(() => {
                  const trimmed = newTradeSprite.trim();
                  const [base, suffix] = trimmed.split("_");
                  const tempDetails = getPetDetails(base);
                  const finalBase = tempDetails ? (tempDetails.maxStageName || base) : base;
                  const resolvedSprite = suffix ? `${finalBase}_${suffix}` : finalBase;
                  const finalDetails = getPetDetails(resolvedSprite);
                  const spriteFileName = getSpriteFileName(resolvedSprite);

                  return (
                    <div className="w-[38px] h-[38px] bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm relative group/avatar overflow-hidden">
                      {spriteFileName ? (
                        <img
                          src={getImagePath(`images/sprites/${spriteFileName}`)}
                          alt={resolvedSprite}
                          className="w-8 h-8 object-contain transition-transform group-hover/avatar:scale-110"
                        />
                      ) : (
                        <Egg className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                      )}
                      {finalDetails?.types && finalDetails.types.length > 0 && (
                        <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-xs border border-slate-100 dark:border-slate-700 z-10">
                          <img
                            src={getImagePath(`images/attributes/${finalDetails.types[0]}.png`)}
                            alt={finalDetails.types[0]}
                            className="w-3 h-3 object-contain"
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}
                <Autocomplete
                  value={newTradeSprite.includes("_") ? newTradeSprite.split("_")[0] : newTradeSprite}
                  onChange={(val) => {
                    // When base name changes, reset selected form/variation
                    setNewTradeSprite(val);
                  }}
                  options={ALL_PET_NAMES}
                  placeholder="输入精灵名称或首字、拼音首字母..."
                  className="flex-1"
                  inputClassName="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/40 focus:border-indigo-500 transition-all font-medium h-[38px]"
                />
                {(() => {
                  const trimmed = newTradeSprite.trim();
                  const [base, suffix] = trimmed.split("_");
                  const tempDetails = getPetDetails(base);
                  const finalBase = tempDetails ? (tempDetails.maxStageName || base) : base;
                  const availableSprites = getAvailableSprites(finalBase);
                  if (availableSprites.length <= 1) return null;
                  
                  const currentVal = availableSprites.includes(trimmed) 
                    ? trimmed 
                    : (suffix ? `${finalBase}_${suffix}` : finalBase);

                  return (
                    <select
                      value={availableSprites.includes(currentVal) ? currentVal : finalBase}
                      onChange={(e) => setNewTradeSprite(e.target.value)}
                      className="px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 h-[38px] font-bold focus:outline-none focus:border-indigo-500 cursor-pointer shrink-0 max-w-[120px] transition-colors"
                    >
                      {availableSprites.map(spriteName => {
                        const displayName = getSpriteFormDisplayName(spriteName);
                        return (
                          <option key={spriteName} value={spriteName}>
                            {displayName}
                          </option>
                        );
                      })}
                    </select>
                  );
                })()}
              </div>
              {/* 精灵辅助信息提示 */}
              {(() => {
                const trimmed = newTradeSprite.trim();
                const [base, suffix] = trimmed.split("_");
                const tempDetails = getPetDetails(base);
                const finalBase = tempDetails ? (tempDetails.maxStageName || base) : base;
                const finalDetails = getPetDetails(finalBase);

                if (!finalDetails) return null;
                return (
                  <div className="text-[10px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5 leading-none">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">属性:</span>
                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 font-medium">{finalDetails.types?.join("/")}</span>
                    <span className="text-slate-200 dark:text-slate-700">|</span>
                    <span className="font-semibold text-slate-500 dark:text-slate-400">蛋组:</span>
                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 font-medium">{finalDetails.groups?.join("/")}</span>
                    {base !== finalBase && (
                      <>
                        <span className="text-slate-200 dark:text-slate-700">|</span>
                        <span className="text-slate-400 dark:text-slate-500 italic">进化链最高阶: {finalBase}</span>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* 性格需求 */}
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">性格需求</label>
              <Autocomplete
                value={newTradeNature}
                onChange={setNewTradeNature}
                options={NATURE_OPTIONS}
                placeholder="输入性格或拼音首字母..."
                className="w-full"
                inputClassName="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/40 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all font-medium h-[38px]"
              />
            </div>

            {/* 备注说明 */}
            <div className="md:col-span-5 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">备注说明</label>
              <input
                type="text"
                value={newTradeNotes}
                onChange={e => setNewTradeNotes(e.target.value)}
                placeholder="可写具体要求，例如：公母不限、用大婉换、多换一等..."
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/40 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-medium h-[38px]"
              />
            </div>

            {/* 第二行：规格与动作 */}
            {/* 牌子选择 */}
            <div className="md:col-span-7 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">牌子</label>
              <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-1.5">
                {BRAND_OPTIONS.map(brand => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => setNewTradeBrand(brand)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer h-[34px] flex items-center justify-center truncate ${getBrandStyle(brand)} ${newTradeBrand === brand
                        ? 'ring-2 ring-indigo-500 scale-100 border-transparent shadow-sm'
                        : 'opacity-60 hover:opacity-100 hover:scale-102'
                      }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            {/* 附加规格选项 */}
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">附加规格</label>
              <div className="flex items-center gap-4 h-[34px] pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer group select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={newTradeIs3V}
                      onChange={e => setNewTradeIs3V(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">3V</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer group select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={newTradeIsLimit}
                      onChange={e => setNewTradeIsLimit(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-500"></div>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">极限</span>
                </label>
              </div>
            </div>


            {/* 发布动作按钮 */}
            <div className="md:col-span-3 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-transparent select-none">操作</label>
              <button
                type="button"
                onClick={handleAddTrade}
                className="w-full h-[34px] bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg transition-all font-bold flex items-center justify-center gap-1 shadow-md text-xs cursor-pointer active:scale-98"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                加入卡片墙
              </button>
            </div>
          </div>

          {/* 卡片墙面板 */}
          <div className="p-3 sm:p-6 bg-slate-50/30 dark:bg-slate-950">
            {trades.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl py-12 px-4 flex flex-col items-center justify-center text-slate-400 dark:text-slate-550 text-center gap-2">
                <Egg className="w-10 h-10 text-slate-300 dark:text-slate-600 stroke-1" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">暂无换蛋需求看板</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">在上方填写需求表单并点击“加入换蛋卡片墙”即可生成</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {trades.map(trade => {
                  const details = getPetDetails(trade.sprite);
                  const spriteFileName = details ? getSpriteFileName(trade.sprite) : null;
                  const baseName = getBasePetName(trade.sprite);
                  const availableSprites = getAvailableSprites(baseName);

                  return (
                    <div
                      key={trade.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 relative overflow-hidden group/card"
                    >
                      {/* Delete Button at top-right */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTrade(trade.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-405 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-100 dark:hover:border-rose-900/40 transition-all opacity-100 sm:opacity-0 group-hover/card:opacity-100 cursor-pointer action-buttons z-20"
                        title="删除该条换蛋需求"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* 左侧：头像 + 详情 */}
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        {/* 头像 */}
                        <div className="relative w-14 h-14 sm:w-20 sm:h-20 bg-slate-50 dark:bg-slate-800 border border-slate-100/80 dark:border-slate-700 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 group/avatar overflow-hidden">
                          {spriteFileName ? (
                            <img
                              src={getImagePath(`images/sprites/${spriteFileName}`)}
                              alt={trade.sprite}
                              className="w-11 h-11 sm:w-16 sm:h-16 object-contain transition-transform duration-200 group-hover/avatar:scale-100"
                            />
                          ) : (
                            <Egg className="w-7 h-7 sm:w-10 sm:h-10 text-slate-300 dark:text-slate-600 transition-transform duration-200 avatar-fallback-icon" />
                          )}
                          {details?.types && details.types.length > 0 && (
                            <div className="absolute bottom-1 right-1 w-5.5 h-5.5 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm border border-slate-50 dark:border-slate-700 z-10">
                              <img
                                src={getImagePath(`images/attributes/${details.types[0]}.png`)}
                                alt={details.types[0]}
                                className="w-3.5 h-3.5 object-contain"
                              />
                            </div>
                          )}

                          {/* Form dropdown overlay for multi-form sprites */}
                          {availableSprites.length > 1 && (
                            <div className="absolute bottom-1 left-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs px-1 py-0.5 rounded shadow-2xs z-10 border border-slate-200/80 dark:border-slate-700 flex items-center hover:bg-white dark:hover:bg-slate-750 transition-colors duration-150 action-buttons">
                              <select
                                value={availableSprites.includes(trade.sprite) ? trade.sprite : (spriteFileName ? spriteFileName.slice(0, -4) : trade.sprite)}
                                onChange={(e) => handleUpdateTradeSprite(trade.id, e.target.value)}
                                className="text-[8px] font-bold text-slate-700 dark:text-slate-300 bg-transparent border-none focus:outline-none cursor-pointer pr-1 py-0.25 leading-none appearance-none"
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
                              <span className="text-[6px] text-slate-400 dark:text-slate-500 pointer-events-none select-none ml-0.5 -mt-0.5">▼</span>
                            </div>
                          )}
                        </div>

                        {/* 需求详情 */}
                        <div className="flex-1 flex flex-col min-w-0 justify-between">
                          {/* 名字 */}
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate" title={trade.sprite}>
                              {trade.sprite}
                            </h4>
                          </div>

                          {/* 属性：性格/牌子 */}
                          <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400 dark:text-slate-500">性格:</span>
                              <span className="text-slate-700 dark:text-slate-300 font-semibold">{trade.nature || "不限"}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400 dark:text-slate-500">牌子:</span>
                              <span className={`px-1.5 py-0.25 rounded text-[10px] border ${getBrandStyle(trade.brand)}`}>
                                {trade.brand}
                              </span>
                            </div>
                          </div>

                          {/* 蛋组 */}
                          <div className="flex items-center gap-1.5 my-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            <span className="text-slate-400 dark:text-slate-500">蛋组:</span>
                            <div className="flex gap-1 flex-wrap">
                              {details?.groups && details.groups.length > 0 ? (
                                details.groups.map(group => (
                                  <span key={group} className={`px-1 py-0.25 rounded text-[9px] border font-bold ${getEggGroupStyle(group)}`}>
                                    {group}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">无</span>
                              )}
                            </div>
                          </div>

                          {/* 是否3V/是否极限 */}
                          <div className="flex items-center gap-2">
                            {trade.is3V && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white shadow-sm flex items-center gap-0.5">
                                ✓ 3V
                              </span>
                            )}
                            {trade.isLimit && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white shadow-sm flex items-center gap-0.5">
                                ★ 极限
                              </span>
                            )}
                            {!trade.is3V && !trade.isLimit && (
                              <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                                常规配置
                              </span>
                            )}
                          </div>

                          {/* 备注 */}
                          {trade.notes ? (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-2 border-t border-slate-50 dark:border-slate-800 pt-1.5 line-clamp-2" title={trade.notes}>
                              “{trade.notes}”
                            </p>
                          ) : (
                            <div className="h-2"></div>
                          )}
                        </div>
                      </div>


                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </>
    )}

    {/* 蛋管理中心 */}
    {activeTab === "eggs" && (
      <div className="bg-slate-50/50 dark:bg-slate-950 p-4 sm:p-6 flex flex-col gap-6">
        {/* Statistics section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-3 sm:p-4 flex flex-col justify-between min-h-[80px] sm:min-h-[96px] relative overflow-hidden group select-none">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full pointer-events-none" />
            <div className="flex items-center justify-between z-10">
              <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold">总录入精灵蛋</span>
              <div className="w-6 h-6 bg-slate-50 dark:bg-slate-900 rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-800">
                <Database className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              </div>
            </div>
            <div className="mt-2 sm:mt-2.5 z-10 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-slate-800 dark:text-slate-200 tracking-tight">{eggs.length}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">个</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-3 sm:p-4 flex flex-col justify-between min-h-[80px] sm:min-h-[96px] relative overflow-hidden group select-none">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-rose-50/30 dark:bg-rose-950/10 rounded-full pointer-events-none" />
            <div className="flex items-center justify-between z-10">
              <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold">极限精灵蛋</span>
              <div className="w-6 h-6 bg-rose-50 dark:bg-rose-950/40 rounded-lg flex items-center justify-center border border-rose-100 dark:border-rose-900/50">
                <Award className="w-3.5 h-3.5 text-rose-500 dark:text-rose-405 animate-pulse" />
              </div>
            </div>
            <div className="mt-2 sm:mt-2.5 z-10 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400 tracking-tight">
                {eggs.filter(e => {
                  const type = getEggStatusType(e);
                  return type === "极限大" || type === "极限小";
                }).length}
              </span>
              <span className="text-xs text-rose-500 dark:text-rose-400 font-semibold">个</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-3 sm:p-4 flex flex-col justify-between min-h-[80px] sm:min-h-[96px] relative overflow-hidden group select-none">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-50/30 dark:bg-amber-950/10 rounded-full pointer-events-none" />
            <div className="flex items-center justify-between z-10">
              <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold">临界/达标蛋</span>
              <div className="w-6 h-6 bg-amber-50 dark:bg-amber-950/40 rounded-lg flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
                <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-405" />
              </div>
            </div>
            <div className="mt-2 sm:mt-2.5 z-10 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-600 tracking-tight">
                {eggs.filter(e => {
                  const type = getEggStatusType(e);
                  return type !== "普通" && type !== "极限大" && type !== "极限小";
                }).length}
              </span>
              <span className="text-xs text-amber-500 dark:text-amber-400 font-semibold">个</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-3 sm:p-4 flex flex-col justify-between min-h-[80px] sm:min-h-[96px] relative overflow-hidden group select-none">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-teal-50/30 dark:bg-teal-950/10 rounded-full pointer-events-none" />
            <div className="flex items-center justify-between z-10">
              <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold">3V性格合格蛋</span>
              <div className="w-6 h-6 bg-teal-50 dark:bg-teal-950/40 rounded-lg flex items-center justify-center border border-teal-100 dark:border-teal-900/50">
                <Dna className="w-3.5 h-3.5 text-teal-600 dark:text-teal-405" />
              </div>
            </div>
            <div className="mt-2 sm:mt-2.5 z-10 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-teal-600 dark:text-teal-400 tracking-tight">
                {eggs.filter(e => {
                  const fStats = e.fatherStats || [];
                  const mStats = e.motherStats || [];
                  const fN = e.fatherNature || "";
                  const mN = e.motherNature || "";
                  if (fStats.includes("无") || mStats.includes("无") || !fN || !mN) return false;
                  const fSorted = [...fStats].sort();
                  const mSorted = [...mStats].sort();
                  return fSorted.every((v, idx) => v === mSorted[idx]);
                }).length}
              </span>
              <span className="text-xs text-teal-500 dark:text-teal-400 font-semibold">个</span>
            </div>
          </div>
        </div>

        {/* Filters and Header inside center */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100/50 dark:border-indigo-900/50">
                <Egg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">精灵蛋管理中心</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  记录与管理极品精灵蛋的三围性格、牌子，自动判定大块头/小不点达标与极限
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 ml-auto shrink-0 justify-end">
              <button
                onClick={handleImportEggsClick}
                className="px-3 py-2 text-xs sm:text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm font-sans"
                title="从备份文件或文本导入精灵蛋数据"
              >
                <Upload className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                导入数据
              </button>
              <button
                onClick={handleExportEggsClick}
                className="px-3 py-2 text-xs sm:text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm font-sans"
                title="导出当前精灵蛋数据作为备份"
              >
                <Share2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                导出数据
              </button>
              <button
                onClick={() => handleReset("eggs")}
                className="px-3 py-2 text-xs sm:text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm font-sans"
                title="清空当前所有精灵蛋记录"
              >
                <RefreshCw className="w-4 h-4" />
                重置列表
              </button>
              <button
                onClick={handleAddEggClick}
                className="px-4 py-2 text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-600/20 dark:shadow-indigo-950/40 font-sans"
              >
                <Plus className="w-4 h-4" />
                登记精灵蛋
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* Filters row */}
          <div className="flex gap-3 items-center overflow-x-auto no-scrollbar whitespace-nowrap">
            <div className="relative flex-1 sm:w-60 sm:flex-none shrink-0">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="模糊搜索精灵名称..."
                value={eggSearchTerm}
                onChange={e => setEggSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/40 transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <select
              value={eggFilterGroup}
              onChange={e => setEggFilterGroup(e.target.value)}
              className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors w-full sm:w-auto shrink-0 whitespace-nowrap"
            >
              <option value="" className="dark:bg-slate-800">全部蛋组</option>
              {EGG_GROUPS.map(group => (
                <option key={group} value={group} className="dark:bg-slate-800">{group}</option>
              ))}
            </select>

            <select
              value={eggFilterBrand}
              onChange={e => setEggFilterBrand(e.target.value)}
              className={`text-xs border rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer font-bold transition-all w-full sm:w-auto shrink-0 whitespace-nowrap ${
                eggFilterBrand ? getBrandStyle(eggFilterBrand) : 'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <option value="" className="dark:bg-slate-800">全部牌子</option>
              {BRAND_OPTIONS.map(brand => (
                <option key={brand} value={brand} className="dark:bg-slate-800">{brand}</option>
              ))}
            </select>

            <select
              value={eggFilterLimit}
              onChange={e => setEggFilterLimit(e.target.value)}
              className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors w-full sm:w-auto shrink-0 whitespace-nowrap"
            >
              <option value="" className="dark:bg-slate-800">全部(极限/临界/达标)</option>
              <option value="极限" className="dark:bg-slate-800">仅看极限 (大/小)</option>
              <option value="达标" className="dark:bg-slate-800">仅看达标 (大块头/小不点)</option>
              <option value="临界" className="dark:bg-slate-800">仅看临界值 (10%以内)</option>
              <option value="普通" className="dark:bg-slate-800">仅看普通/未合格</option>
            </select>

            <select
              value={eggFilter3V}
              onChange={e => setEggFilter3V(e.target.value)}
              className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors w-full sm:w-auto shrink-0 whitespace-nowrap"
            >
              <option value="" className="dark:bg-slate-800">全部(是否3V)</option>
              <option value="是" className="dark:bg-slate-800">是 3V</option>
              <option value="否" className="dark:bg-slate-800">否 3V</option>
            </select>
          </div>
        </div>

        {/* Eggs list grid */}
        {filteredEggs.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 shadow-sm select-none">
            <Egg className="w-12 h-12 text-slate-350 dark:text-slate-600 stroke-1 mb-2 animate-bounce" />
            <span className="text-sm font-bold text-slate-400 dark:text-slate-300">🥚 暂无符合条件的精灵蛋记录</span>
            <span className="text-xs text-slate-350 dark:text-slate-550 mt-1">点击右上角“登记精灵蛋”录入首只蛋</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleEggDragEnd}>
              <SortableContext items={paginatedEggs.map(egg => egg.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {paginatedEggs.map((egg) => (
                    <EggCard
                      key={egg.id}
                      egg={egg}
                      handleDeleteEgg={handleDeleteEgg}
                      handleUpdateEggSprite={handleUpdateEggSprite}
                      handleUpdateEggBrand={handleUpdateEggBrand}
                      handleUpdateEggSize={handleUpdateEggSize}
                      handleUpdateEggWeight={handleUpdateEggWeight}
                      handleUpdateEggFatherNature={handleUpdateEggFatherNature}
                      handleUpdateEggMotherNature={handleUpdateEggMotherNature}
                      handleUpdateEggFatherStat={handleUpdateEggFatherStat}
                      handleUpdateEggMotherStat={handleUpdateEggMotherStat}
                      handleUpdateEggProduceTime={handleUpdateEggProduceTime}
                      isSelected={selectedCard?.id === egg.id && selectedCard?.type === "egg"}
                      onSelect={() => setSelectedCard({ id: egg.id, type: "egg" })}
                      onHover={(hovered) => setHoveredCard(hovered ? { id: egg.id, type: "egg" } : null)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-1 py-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium select-none text-left">
                共 <span className="font-bold font-mono text-slate-700 dark:text-slate-300">{filteredEggs.length}</span> 个精灵蛋，
                当前展示第 <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">{(eggCurrentPage - 1) * EGG_PAGE_SIZE + 1}-{Math.min(eggCurrentPage * EGG_PAGE_SIZE, filteredEggs.length)}</span> 个
              </div>
              
              {totalEggPages > 1 && (
                <div className="flex items-center gap-1.5 select-none">
                  <button
                    onClick={() => setEggCurrentPage(1)}
                    disabled={eggCurrentPage === 1}
                    className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-800 disabled:hover:border-slate-200 dark:disabled:hover:border-slate-700 transition-all cursor-pointer disabled:cursor-not-allowed text-xs font-semibold"
                    title="第一页"
                  >
                    首页
                  </button>
                  <button
                    onClick={() => setEggCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={eggCurrentPage === 1}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-800 disabled:hover:border-slate-200 dark:disabled:hover:border-slate-700 transition-all cursor-pointer disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    上一页
                  </button>

                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((pageNum, idx) => {
                      if (pageNum === "...") {
                        return (
                          <span key={`dots-${idx}`} className="px-2 text-slate-400 font-bold select-none text-xs">
                            ...
                          </span>
                        );
                      }
                      return (
                        <button
                          key={`page-${pageNum}`}
                          onClick={() => setEggCurrentPage(Number(pageNum))}
                          className={`w-8 h-8 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center ${
                            eggCurrentPage === pageNum
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 border border-indigo-600"
                              : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setEggCurrentPage(prev => Math.min(totalEggPages, prev + 1))}
                    disabled={eggCurrentPage === totalEggPages}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-800 disabled:hover:border-slate-200 dark:disabled:hover:border-slate-700 transition-all cursor-pointer disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1"
                  >
                    下一页
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEggCurrentPage(totalEggPages)}
                    disabled={eggCurrentPage === totalEggPages}
                    className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-800 disabled:hover:border-slate-200 dark:disabled:hover:border-slate-700 transition-all cursor-pointer disabled:cursor-not-allowed text-xs font-semibold"
                    title="最后一页"
                  >
                    末页
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )}

    {/* 父母本管理中心 */}
    {activeTab === "parents" && (
      <div className="bg-slate-50/50 dark:bg-slate-950 p-4 sm:p-6 flex flex-col gap-6">
        {/* 父母本头部 */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100/50 dark:border-indigo-900/50">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">父母本管理中心</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                登记您仓库中的父母本精灵，设置独立的身高体重、性格三围，计算跨蛋组繁育路径
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 ml-auto shrink-0">
            <div className="flex gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-200/40 dark:border-slate-700/40 select-none">
              <span>父本 (♂): {visibleFathers.length}/{parents.filter(p => p.gender === "♂").length} 只</span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span>母本 (♀): {visibleMothers.length}/{parents.filter(p => p.gender === "♀").length} 只</span>
            </div>
            <button
              onClick={() => setShowRocoImportModal(true)}
              className="px-3 py-2 text-xs sm:text-sm font-semibold bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm font-sans"
              title="从洛克王国世界助手导入精灵盒子数据"
            >
              <Download className="w-4 h-4" />
              从游戏数据导入
            </button>
            <button
              onClick={() => handleReset("parents")}
              className="px-3 py-2 text-xs sm:text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm font-sans"
              title="清空当前所有父母本登记数据"
            >
              <RefreshCw className="w-4 h-4" />
              重置列表
            </button>
          </div>
        </div>

        <WarehouseStatsTable
          parents={parents}
          activeGroup={fatherFilterGroup}
          activeNature={fatherNatureSearch ? fatherNatureSearch.substring(0, 2) : ""}
          activeBrand={fatherFilterBrand}
          onSelectGrid={handleSelectGrid}
        />

        {/* 左右分栏 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* 左侧父本栏 */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-2.5 sm:p-3.5 bg-slate-900/95 text-white rounded-xl shadow-md select-none whitespace-nowrap overflow-hidden">
              <div className="flex items-center gap-1 sm:gap-2 shrink-0 whitespace-nowrap">
                <span className="text-xs sm:text-sm font-bold tracking-wide shrink-0 whitespace-nowrap">♂️ 父本仓储库</span>
                <span className="text-[9px] sm:text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1 py-0.1 sm:px-1.5 sm:py-0.2 rounded font-mono shrink-0 whitespace-nowrap">FATHER</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 shrink-0 whitespace-nowrap">
                <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 select-none shrink-0 h-6.5 items-center mr-1">
                  <button
                    onClick={() => setFatherViewMode("card")}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer flex items-center gap-0.5 h-full ${
                      fatherViewMode === "card"
                        ? "bg-slate-700 text-sky-400 shadow-3xs"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    title="卡片网格模式"
                  >
                    <LayoutGrid className="w-2.5 h-2.5" />
                    卡片
                  </button>
                  <button
                    onClick={() => setFatherViewMode("table")}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer flex items-center gap-0.5 h-full ${
                      fatherViewMode === "table"
                        ? "bg-slate-700 text-sky-400 shadow-3xs"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    title="数据表格模式"
                  >
                    <Table className="w-2.5 h-2.5" />
                    表格
                  </button>
                </div>
                <button
                  onClick={() => {
                    const allChecked = visibleFathers.length > 0 && visibleFathers.every(p => p.checked);
                    handleToggleAllParents("♂", !allChecked, visibleFathers.map(p => p.id));
                  }}
                  className="px-2 py-1 text-[10px] sm:text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-all cursor-pointer shrink-0 whitespace-nowrap"
                >
                  {visibleFathers.length > 0 && visibleFathers.every(p => p.checked) ? "取消全选" : "全选父本"}
                </button>
                <button
                  onClick={() => handleAddParent("♂")}
                  className="px-2 py-1 text-[10px] sm:text-[11px] font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-sm shadow-sky-600/10 shrink-0 whitespace-nowrap"
                >
                  <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  添加父本
                </button>
              </div>
            </div>

            {/* 父本单独过滤栏 */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex gap-2 items-center overflow-x-auto no-scrollbar whitespace-nowrap">
              <div className="relative flex-1 min-w-[120px] flex items-center shrink-0">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 z-10 pointer-events-none" />
                <Autocomplete
                  value={fatherSearchTerm}
                  onChange={val => setFatherSearchTerm(val)}
                  options={ALL_PET_NAMES}
                  placeholder="搜索精灵名..."
                  className="w-full"
                  inputClassName="w-full pl-8 pr-2 py-1 text-xs text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 dark:focus:ring-indigo-950/40 transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 h-7"
                />
              </div>
              <div className="relative flex-1 min-w-[120px] flex items-center shrink-0">
                <Filter className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 z-10 pointer-events-none" />
                <Autocomplete
                  value={fatherNatureSearch}
                  onChange={val => setFatherNatureSearch(val)}
                  options={NATURE_OPTIONS}
                  placeholder="搜索性格..."
                  className="w-full"
                  inputClassName="w-full pl-8 pr-2 py-1 text-xs text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 dark:focus:ring-indigo-950/40 transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 h-7"
                />
              </div>
              <select
                value={fatherFilterGroup}
                onChange={e => setFatherFilterGroup(e.target.value)}
                className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 cursor-pointer font-medium hover:bg-slate-100 dark:hover:bg-slate-705 transition-colors h-7 w-auto shrink-0 whitespace-nowrap"
              >
                <option value="" className="dark:bg-slate-800">全部蛋组</option>
                {EGG_GROUPS.map(group => (
                  <option key={group} value={group} className="dark:bg-slate-800">{group}</option>
                ))}
              </select>
              <select
                value={fatherFilterBrand}
                onChange={e => setFatherFilterBrand(e.target.value)}
                className={`text-xs border rounded-lg px-2 py-0.5 focus:outline-none cursor-pointer font-bold transition-all h-7 w-auto shrink-0 whitespace-nowrap ${
                  fatherFilterBrand ? getBrandStyle(fatherFilterBrand) : 'text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <option value="" className="dark:bg-slate-800">全部牌子</option>
                {BRAND_OPTIONS.map(brand => (
                  <option key={brand} value={brand} className="dark:bg-slate-800">{brand}</option>
                ))}
              </select>
              {(fatherSearchTerm || fatherNatureSearch || fatherFilterGroup || fatherFilterBrand) && (
                <button
                  onClick={() => {
                    setFatherSearchTerm("");
                    setFatherNatureSearch("");
                    setFatherFilterGroup("");
                    setFatherFilterBrand("");
                  }}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-bold transition-colors cursor-pointer p-1 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded shrink-0 whitespace-nowrap"
                >
                  重置
                </button>
              )}
            </div>

            <div className="max-h-[680px] overflow-y-auto pr-1.5 custom-scrollbar">
              {fatherViewMode === "card" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                  {visibleFathers.length === 0 ? (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                      <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 stroke-1 mb-2 animate-bounce" />
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-300">♂️ 暂无登记的父本精灵</span>
                      <span className="text-[10px] text-slate-350 dark:text-slate-550 mt-1">点击右上方“添加父本”录入</span>
                    </div>
                  ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFatherDragEnd}>
                      <SortableContext items={paginatedFathers.map(p => p.id)} strategy={verticalListSortingStrategy}>
                        {paginatedFathers.map(parent => (
                          <ParentCard
                            key={parent.id}
                            parent={parent}
                            handleDeleteParent={handleDeleteParent}
                            handleUpdateParentSprite={handleUpdateParentSprite}
                            handleUpdateParentBrand={handleUpdateParentBrand}
                            handleUpdateParentHeight={handleUpdateParentHeight}
                            handleUpdateParentWeight={handleUpdateParentWeight}
                            handleUpdateParentNature={handleUpdateParentNature}
                            handleUpdateParentStat={handleUpdateParentStat}
                            handleUpdateParentChecked={handleUpdateParentChecked}
                            handleUpdateParentVoice={handleUpdateParentVoice}
                            isSelected={selectedCard?.id === parent.id && selectedCard?.type === "parent"}
                            onSelect={() => setSelectedCard({ id: parent.id, type: "parent" })}
                            onHover={(hovered) => setHoveredCard(hovered ? { id: parent.id, type: "parent" } : null)}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              ) : (
                // 父本表格模式
                <div className="overflow-x-auto w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-2 shadow-xs">
                  {visibleFathers.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
                      <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 stroke-1 mb-2" />
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-300">♂️ 暂无登记的父本精灵</span>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 table-fixed">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 select-none border-b border-slate-200 dark:border-slate-800">
                          <th className="px-3 py-2.5 text-left text-xs font-bold tracking-wider w-[25%]">精灵</th>
                          <th className="px-2 py-2.5 text-center text-xs font-bold tracking-wider w-[16%]">性格</th>
                          <th className="px-2 py-2.5 text-center text-xs font-bold tracking-wider w-[16%]">牌子</th>
                          <th className="px-2 py-2.5 text-center text-xs font-bold tracking-wider w-[20%]">三维</th>
                          <th className="px-2 py-2.5 text-center text-xs font-bold tracking-wider w-[15%]">位置</th>
                          <th className="px-2 py-2.5 text-center text-xs font-bold tracking-wider w-[8%]">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {paginatedFathers.map((parent, pIdx) => {
                          const petDetails = getPetDetails(parent.sprite);
                          const spriteName = petDetails ? petDetails.name : parent.sprite;
                          const spriteFile = getSpriteFileName(parent.sprite);
                          const spriteUrl = spriteFile ? getImagePath(`images/sprites/${spriteFile}`) : null;
                          const stats = parent.stats || ["无", "无", "无"];

                          // 隔行斑马线交替背景
                          const rowBg = pIdx % 2 === 1 
                            ? "bg-slate-50/50 dark:bg-slate-900/30 hover:bg-indigo-50/15 dark:hover:bg-slate-850/40" 
                            : "bg-white dark:bg-slate-950 hover:bg-indigo-50/20 dark:hover:bg-slate-850/30";

                          return (
                            <tr 
                              key={parent.id} 
                              onDoubleClick={() => handleDoubleClickParent(parent.id, "♂")}
                              className={`transition-colors duration-150 border-b border-slate-100/70 dark:border-slate-800/40 cursor-pointer ${rowBg}`}
                              title="双击自动跳转到该精灵卡片"
                            >
                              <td className="px-3 py-2 align-middle">
                                <div className="flex items-center gap-2 text-left">
                                  <input
                                    type="checkbox"
                                    checked={parent.checked}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleUpdateParentChecked(parent.id, e.target.checked);
                                    }}
                                    className="w-3.5 h-3.5 rounded text-indigo-650 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 cursor-pointer shrink-0"
                                  />
                                  <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                                    {spriteUrl ? (
                                      <img src={spriteUrl} alt={spriteName} className="w-[85%] h-[85%] object-contain" />
                                    ) : (
                                      <span className="text-xs">🧬</span>
                                    )}
                                  </div>
                                  <span className="text-[12px] font-black text-slate-850 dark:text-slate-100 truncate">{spriteName}</span>
                                </div>
                              </td>
                              <td className="px-2 py-2 text-center align-middle">
                                <span className="inline-block text-[11.5px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/20 border border-indigo-150/60 dark:border-indigo-900/40 px-2 py-0.5 rounded-full">
                                  {parent.nature.split(" ")[0] || parent.nature || "未选"}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-center align-middle">
                                <span className={`inline-block text-[11px] font-extrabold px-2.5 py-0.5 border rounded-full ${getBrandStyle(parent.brand)}`}>
                                  {parent.brand}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-center align-middle">
                                <div className="flex items-center gap-1 justify-center">
                                  {stats.map((stat, sIdx) => {
                                    const badgeColors = getStatBadgeStyle(stat);
                                    const isImageStat = ["生命", "物攻", "速度", "魔攻", "物防", "魔防"].includes(stat);
                                    return (
                                      <div 
                                        key={sIdx} 
                                        className={`w-5.5 h-5.5 rounded-full border flex items-center justify-center shadow-3xs ${badgeColors}`}
                                        title={stat}
                                      >
                                        {isImageStat ? (
                                          <img
                                            src={getImagePath(`images/6围/${stat}.png`)}
                                            alt={stat}
                                            className="w-3.5 h-3.5 object-contain"
                                          />
                                        ) : (
                                          <Minus className="w-2.5 h-2.5 text-slate-400" />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="px-2 py-2 text-center align-middle">
                                {parent.position && parent.position !== "-" ? (
                                  <span className="inline-block text-[10px] font-bold text-indigo-650 dark:text-indigo-350 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100/40 dark:border-indigo-900/30 px-1.5 py-0.5 rounded-md">
                                    {parent.position.replace("\n", " ")}
                                  </span>
                                ) : (
                                  <span className="text-slate-350 dark:text-slate-600 font-mono text-[10px]">-</span>
                                )}
                              </td>
                              <td className="px-2 py-2 text-center align-middle">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteParent(parent.id); }}
                                  className="text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 p-1 rounded-lg transition-colors cursor-pointer"
                                  title="删除"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            {/* 父本仓储分页控制器 */}
            {totalFatherPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium select-none">
                  第 {(fatherCurrentPage - 1) * PARENT_PAGE_SIZE + 1}-{Math.min(fatherCurrentPage * PARENT_PAGE_SIZE, visibleFathers.length)} 只，共 {visibleFathers.length} 只
                </div>
                <div className="flex items-center gap-1 select-none shrink-0">
                  <button
                    onClick={() => setFatherCurrentPage(1)}
                    disabled={fatherCurrentPage === 1}
                    className="px-1.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-[10px] font-bold"
                  >
                    首页
                  </button>
                  <button
                    onClick={() => setFatherCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={fatherCurrentPage === 1}
                    className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-[10px] font-bold"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-center gap-0.5">
                    {getPageNumbersHelper(fatherCurrentPage, totalFatherPages).map((pageNum, idx) => {
                      if (pageNum === "...") {
                        return (
                          <span key={`father-dots-${idx}`} className="px-0.5 text-slate-400 font-bold text-[10px]">
                            ...
                          </span>
                        );
                      }
                      return (
                        <button
                          key={`father-page-${pageNum}`}
                          onClick={() => setFatherCurrentPage(Number(pageNum))}
                          className={`w-6 h-6 rounded text-[10px] font-bold font-mono cursor-pointer flex items-center justify-center ${
                            fatherCurrentPage === pageNum
                              ? "bg-indigo-600 text-white shadow-xs border border-indigo-600"
                              : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setFatherCurrentPage(prev => Math.min(totalFatherPages, prev + 1))}
                    disabled={fatherCurrentPage === totalFatherPages}
                    className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-[10px] font-bold"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setFatherCurrentPage(totalFatherPages)}
                    disabled={fatherCurrentPage === totalFatherPages}
                    className="px-1.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-[10px] font-bold"
                  >
                    末页
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 右侧母本栏 */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-2.5 sm:p-3.5 bg-slate-900/95 text-white rounded-xl shadow-md select-none whitespace-nowrap overflow-hidden">
              <div className="flex items-center gap-1 sm:gap-2 shrink-0 whitespace-nowrap">
                <span className="text-xs sm:text-sm font-bold tracking-wide shrink-0 whitespace-nowrap">♀️ 母本仓储库</span>
                <span className="text-[9px] sm:text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/30 px-1 py-0.1 sm:px-1.5 sm:py-0.2 rounded font-mono shrink-0 whitespace-nowrap">MOTHER</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 shrink-0 whitespace-nowrap">
                <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 select-none shrink-0 h-6.5 items-center mr-1">
                  <button
                    onClick={() => setMotherViewMode("card")}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer flex items-center gap-0.5 h-full ${
                      motherViewMode === "card"
                        ? "bg-slate-700 text-pink-400 shadow-3xs"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    title="卡片网格模式"
                  >
                    <LayoutGrid className="w-2.5 h-2.5" />
                    卡片
                  </button>
                  <button
                    onClick={() => setMotherViewMode("table")}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer flex items-center gap-0.5 h-full ${
                      motherViewMode === "table"
                        ? "bg-slate-700 text-pink-400 shadow-3xs"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    title="数据表格模式"
                  >
                    <Table className="w-2.5 h-2.5" />
                    表格
                  </button>
                </div>
                <button
                  onClick={() => {
                    const allChecked = visibleMothers.length > 0 && visibleMothers.every(p => p.checked);
                    handleToggleAllParents("♀", !allChecked, visibleMothers.map(p => p.id));
                  }}
                  className="px-2 py-1 text-[10px] sm:text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-all cursor-pointer shrink-0 whitespace-nowrap"
                >
                  {visibleMothers.length > 0 && visibleMothers.every(p => p.checked) ? "取消全选" : "全选母本"}
                </button>
                <button
                  onClick={() => handleAddParent("♀")}
                  className="px-2 py-1 text-[10px] sm:text-[11px] font-bold bg-pink-600 hover:bg-pink-500 text-white rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-sm shadow-pink-600/10 shrink-0 whitespace-nowrap"
                >
                  <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  添加母本
                </button>
              </div>
            </div>

            {/* 母本单独过滤栏 */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex gap-2 items-center overflow-x-auto no-scrollbar whitespace-nowrap">
              <div className="relative flex-1 min-w-[120px] flex items-center shrink-0">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 z-10 pointer-events-none" />
                <Autocomplete
                  value={motherSearchTerm}
                  onChange={val => setMotherSearchTerm(val)}
                  options={ALL_PET_NAMES}
                  placeholder="搜索精灵名..."
                  className="w-full"
                  inputClassName="w-full pl-8 pr-2 py-1 text-xs text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-100 dark:focus:ring-pink-950/40 transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 h-7"
                />
              </div>
              <div className="relative flex-1 min-w-[120px] flex items-center shrink-0">
                <Filter className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 z-10 pointer-events-none" />
                <Autocomplete
                  value={motherNatureSearch}
                  onChange={val => setMotherNatureSearch(val)}
                  options={NATURE_OPTIONS}
                  placeholder="搜索性格..."
                  className="w-full"
                  inputClassName="w-full pl-8 pr-2 py-1 text-xs text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-100 dark:focus:ring-pink-950/40 transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 h-7"
                />
              </div>
              <select
                value={motherFilterGroup}
                onChange={e => setMotherFilterGroup(e.target.value)}
                className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-pink-500 cursor-pointer font-medium hover:bg-slate-100 dark:hover:bg-slate-705 transition-colors h-7 w-auto shrink-0 whitespace-nowrap"
              >
                <option value="" className="dark:bg-slate-800">全部蛋组</option>
                {EGG_GROUPS.map(group => (
                  <option key={group} value={group} className="dark:bg-slate-800">{group}</option>
                ))}
              </select>
              <select
                value={motherFilterBrand}
                onChange={e => setMotherFilterBrand(e.target.value)}
                className={`text-xs border rounded-lg px-2 py-0.5 focus:outline-none cursor-pointer font-bold transition-all h-7 w-auto shrink-0 whitespace-nowrap ${
                  motherFilterBrand ? getBrandStyle(motherFilterBrand) : 'text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <option value="" className="dark:bg-slate-800">全部牌子</option>
                {BRAND_OPTIONS.map(brand => (
                  <option key={brand} value={brand} className="dark:bg-slate-800">{brand}</option>
                ))}
              </select>
              {(motherSearchTerm || motherNatureSearch || motherFilterGroup || motherFilterBrand) && (
                <button
                  onClick={() => {
                    setMotherSearchTerm("");
                    setMotherNatureSearch("");
                    setMotherFilterGroup("");
                    setMotherFilterBrand("");
                  }}
                  className="text-[11px] text-pink-600 dark:text-pink-400 hover:text-pink-500 dark:hover:text-pink-300 font-bold transition-colors cursor-pointer p-1 hover:bg-pink-50 dark:hover:bg-pink-950/40 rounded shrink-0 whitespace-nowrap"
                >
                  重置
                </button>
              )}
            </div>

            <div className="max-h-[680px] overflow-y-auto pr-1.5 custom-scrollbar">
              {motherViewMode === "card" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                  {visibleMothers.length === 0 ? (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                      <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 stroke-1 mb-2 animate-bounce" />
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-300">♀️ 暂无登记的母本精灵</span>
                      <span className="text-[10px] text-slate-350 dark:text-slate-550 mt-1">点击右上方“添加母本”录入</span>
                    </div>
                  ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMotherDragEnd}>
                      <SortableContext items={paginatedMothers.map(p => p.id)} strategy={verticalListSortingStrategy}>
                        {paginatedMothers.map(parent => (
                          <ParentCard
                            key={parent.id}
                            parent={parent}
                            handleDeleteParent={handleDeleteParent}
                            handleUpdateParentSprite={handleUpdateParentSprite}
                            handleUpdateParentBrand={handleUpdateParentBrand}
                            handleUpdateParentHeight={handleUpdateParentHeight}
                            handleUpdateParentWeight={handleUpdateParentWeight}
                            handleUpdateParentNature={handleUpdateParentNature}
                            handleUpdateParentStat={handleUpdateParentStat}
                            handleUpdateParentChecked={handleUpdateParentChecked}
                            handleUpdateParentVoice={handleUpdateParentVoice}
                            isSelected={selectedCard?.id === parent.id && selectedCard?.type === "parent"}
                            onSelect={() => setSelectedCard({ id: parent.id, type: "parent" })}
                            onHover={(hovered) => setHoveredCard(hovered ? { id: parent.id, type: "parent" } : null)}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              ) : (
                // 母本表格模式
                <div className="overflow-x-auto w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-2 shadow-xs">
                  {visibleMothers.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
                      <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 stroke-1 mb-2" />
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-300">♀️ 暂无登记的母本精灵</span>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 table-fixed">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 select-none border-b border-slate-200 dark:border-slate-800">
                          <th className="px-3 py-2.5 text-left text-xs font-bold tracking-wider w-[25%]">精灵</th>
                          <th className="px-2 py-2.5 text-center text-xs font-bold tracking-wider w-[16%]">性格</th>
                          <th className="px-2 py-2.5 text-center text-xs font-bold tracking-wider w-[16%]">牌子</th>
                          <th className="px-2 py-2.5 text-center text-xs font-bold tracking-wider w-[20%]">三维</th>
                          <th className="px-2 py-2.5 text-center text-xs font-bold tracking-wider w-[15%]">位置</th>
                          <th className="px-2 py-2.5 text-center text-xs font-bold tracking-wider w-[8%]">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {paginatedMothers.map((parent, pIdx) => {
                          const petDetails = getPetDetails(parent.sprite);
                          const spriteName = petDetails ? petDetails.name : parent.sprite;
                          const spriteFile = getSpriteFileName(parent.sprite);
                          const spriteUrl = spriteFile ? getImagePath(`images/sprites/${spriteFile}`) : null;
                          const stats = parent.stats || ["无", "无", "无"];

                          // 隔行斑马线交替背景
                          const rowBg = pIdx % 2 === 1 
                            ? "bg-slate-50/50 dark:bg-slate-900/30 hover:bg-pink-50/15 dark:hover:bg-slate-850/40" 
                            : "bg-white dark:bg-slate-950 hover:bg-pink-50/20 dark:hover:bg-slate-850/30";

                          return (
                            <tr 
                              key={parent.id} 
                              onDoubleClick={() => handleDoubleClickParent(parent.id, "♀")}
                              className={`transition-colors duration-150 border-b border-slate-100/70 dark:border-slate-800/40 cursor-pointer ${rowBg}`}
                              title="双击自动跳转到该精灵卡片"
                            >
                              <td className="px-3 py-2 align-middle">
                                <div className="flex items-center gap-2 text-left">
                                  <input
                                    type="checkbox"
                                    checked={parent.checked}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleUpdateParentChecked(parent.id, e.target.checked);
                                    }}
                                    className="w-3.5 h-3.5 rounded text-pink-600 focus:ring-pink-500 border-slate-300 dark:border-slate-700 cursor-pointer shrink-0"
                                  />
                                  <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                                    {spriteUrl ? (
                                      <img src={spriteUrl} alt={spriteName} className="w-[85%] h-[85%] object-contain" />
                                    ) : (
                                      <span className="text-xs">🧬</span>
                                    )}
                                  </div>
                                  <span className="text-[12px] font-black text-slate-850 dark:text-slate-100 truncate">{spriteName}</span>
                                </div>
                              </td>
                              <td className="px-2 py-2 text-center align-middle">
                                <span className="inline-block text-[11.5px] font-bold text-pink-700 dark:text-pink-300 bg-pink-50/80 dark:bg-pink-950/20 border border-pink-150/60 dark:border-pink-900/40 px-2 py-0.5 rounded-full">
                                  {parent.nature.split(" ")[0] || parent.nature || "未选"}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-center align-middle">
                                <span className={`inline-block text-[11px] font-extrabold px-2.5 py-0.5 border rounded-full ${getBrandStyle(parent.brand)}`}>
                                  {parent.brand}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-center align-middle">
                                <div className="flex items-center gap-1 justify-center">
                                  {stats.map((stat, sIdx) => {
                                    const badgeColors = getStatBadgeStyle(stat);
                                    const isImageStat = ["生命", "物攻", "速度", "魔攻", "物防", "魔防"].includes(stat);
                                    return (
                                      <div 
                                        key={sIdx} 
                                        className={`w-5.5 h-5.5 rounded-full border flex items-center justify-center shadow-3xs ${badgeColors}`}
                                        title={stat}
                                      >
                                        {isImageStat ? (
                                          <img
                                            src={getImagePath(`images/6围/${stat}.png`)}
                                            alt={stat}
                                            className="w-3.5 h-3.5 object-contain"
                                          />
                                        ) : (
                                          <Minus className="w-2.5 h-2.5 text-slate-400" />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="px-2 py-2 text-center align-middle">
                                {parent.position && parent.position !== "-" ? (
                                  <span className="inline-block text-[10px] font-bold text-indigo-650 dark:text-indigo-350 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100/40 dark:border-indigo-900/30 px-1.5 py-0.5 rounded-md">
                                    {parent.position.replace("\n", " ")}
                                  </span>
                                ) : (
                                  <span className="text-slate-350 dark:text-slate-600 font-mono text-[10px]">-</span>
                                )}
                              </td>
                              <td className="px-2 py-2 text-center align-middle">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteParent(parent.id); }}
                                  className="text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 p-1 rounded-lg transition-colors cursor-pointer"
                                  title="删除"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            {/* 母本仓储分页控制器 */}
            {totalMotherPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium select-none">
                  第 {(motherCurrentPage - 1) * PARENT_PAGE_SIZE + 1}-{Math.min(motherCurrentPage * PARENT_PAGE_SIZE, visibleMothers.length)} 只，共 {visibleMothers.length} 只
                </div>
                <div className="flex items-center gap-1 select-none shrink-0">
                  <button
                    onClick={() => setMotherCurrentPage(1)}
                    disabled={motherCurrentPage === 1}
                    className="px-1.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-355 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-[10px] font-bold"
                  >
                    首页
                  </button>
                  <button
                    onClick={() => setMotherCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={motherCurrentPage === 1}
                    className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-[10px] font-bold"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-center gap-0.5">
                    {getPageNumbersHelper(motherCurrentPage, totalMotherPages).map((pageNum, idx) => {
                      if (pageNum === "...") {
                        return (
                          <span key={`mother-dots-${idx}`} className="px-0.5 text-slate-400 font-bold text-[10px]">
                            ...
                          </span>
                        );
                      }
                      return (
                        <button
                          key={`mother-page-${pageNum}`}
                          onClick={() => setMotherCurrentPage(Number(pageNum))}
                          className={`w-6 h-6 rounded text-[10px] font-bold font-mono cursor-pointer flex items-center justify-center ${
                            motherCurrentPage === pageNum
                              ? "bg-indigo-600 text-white shadow-xs border border-indigo-600"
                              : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setMotherCurrentPage(prev => Math.min(totalMotherPages, prev + 1))}
                    disabled={motherCurrentPage === totalMotherPages}
                    className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-[10px] font-bold"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setMotherCurrentPage(totalMotherPages)}
                    disabled={motherCurrentPage === totalMotherPages}
                    className="px-1.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-355 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-[10px] font-bold"
                  >
                    末页
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 智能配对与导入中心 */}
        <div id="parents-pairing-section" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden mt-4">
          {(() => {
            const allPairings = getPairings();
            const allPairGroups = Array.from(new Set(allPairings.flatMap(p => p.matchingGroups))).sort();
            const allPairBrands = Array.from(new Set(allPairings.map(p => p.brand))).filter(Boolean).sort();

            // 筛选逻辑
            const filteredPairings = allPairings.filter(pair => {
              const isStatsMatch = pair.father.stats.length === pair.mother.stats.length &&
                pair.father.stats.every((v, i) => v === pair.mother.stats[i] && v !== "无");

              const matchSprite = (spriteName: string) => {
                if (!spriteName) return false;
                const nameFilter = pairingFilterName.toLowerCase().trim();
                const lowerName = spriteName.toLowerCase();
                const initials = getPinyinInitials(spriteName).toLowerCase();
                return lowerName.includes(nameFilter) || initials.includes(nameFilter);
              };

              const nameMatch = !pairingFilterName ||
                matchSprite(pair.father.sprite) ||
                matchSprite(pair.mother.sprite) ||
                matchSprite(pair.eggSprite);
              const groupMatch = !pairingFilterGroup || pair.matchingGroups.includes(pairingFilterGroup);
              const brandMatch = !pairingFilterBrand || pair.brand === pairingFilterBrand;
              const natureMatch = !pairingFilterNature ||
                (pair.father.nature && pair.father.nature.includes(pairingFilterNature)) ||
                (pair.mother.nature && pair.mother.nature.includes(pairingFilterNature));

              let v3Match = true;
              if (pairingFilter3V === "sameNature") {
                v3Match = !!pair.father.nature && !!pair.mother.nature && pair.father.nature === pair.mother.nature;
              } else if (pairingFilter3V === "3V") {
                v3Match = isStatsMatch;
              } else if (pairingFilter3V === "非3V") {
                v3Match = !isStatsMatch;
              }

              return nameMatch && groupMatch && brandMatch && v3Match && natureMatch;
            });

            // 已选中的配对：只从过滤后的配对中提取勾选的！
            const selectedPairings = filteredPairings.filter(pair => !excludedPairKeys.has(pair.father.id + "-" + pair.mother.id));

            // 按子代精灵蛋 (eggSprite) 分组合并，以此实现同一进化链同样子的母本合并
            interface GroupedPairing {
              eggSprite: string;
              pairings: Array<{
                father: ParentPet;
                mother: ParentPet;
                brand: string;
                eggSprite: string;
                matchingGroups: string[];
              }>;
            }

            const groupedPairings: GroupedPairing[] = [];
            const eggMap = new Map<string, GroupedPairing>();

            for (const pair of filteredPairings) {
              const eggKey = pair.eggSprite;
              if (!eggMap.has(eggKey)) {
                const group: GroupedPairing = {
                  eggSprite: eggKey,
                  pairings: []
                };
                eggMap.set(eggKey, group);
                groupedPairings.push(group);
              }
              eggMap.get(eggKey)!.pairings.push({
                father: pair.father,
                mother: pair.mother,
                brand: pair.brand,
                eggSprite: pair.eggSprite,
                matchingGroups: pair.matchingGroups
              });
            }

            const hasFilter = pairingFilterName || pairingFilterGroup || pairingFilterBrand || pairingFilter3V || pairingFilterNature;

            return (
              <>
                {/* Header (一键导入联动) */}
                <div className="p-4 bg-slate-900 dark:bg-slate-950/60 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-indigo-500/20 rounded-lg border border-indigo-400/30">
                      <Dna className="w-4.5 h-4.5 text-indigo-300 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-wide">🧬 智能繁育配对与一键导入中心</h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-0.5">
                        同蛋组且同牌子的勾选宠物可进行繁育，子代精灵品种及形态随母本，三围相同自动判定3V
                      </p>
                    </div>
                  </div>
                  {selectedPairings.length > 0 ? (
                    <button
                      onClick={() => handleImportPairingsToNest(selectedPairings)}
                      className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-emerald-600/10 cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                      一键导入所选配对 ({selectedPairings.length} 组)
                    </button>
                  ) : null}
                </div>

                <div className="p-5">
                  {allPairings.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center select-none">
                      <Dna className="w-10 h-10 text-slate-300 dark:text-slate-650 stroke-1 mb-3" />
                      <p className="text-sm font-bold text-slate-400 dark:text-slate-355">暂无符合繁育条件的配对</p>
                      <p className="text-xs text-slate-400 dark:text-slate-550 mt-1.5 max-w-md">
                        请在上方勾选配组，且确保至少有一对父本和母本：(1) 精灵品种非空 (2) 属于同一个蛋组 (3) 牌子等级完全相同。
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* 筛选栏 */}
                      <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 flex gap-2 items-center overflow-x-auto no-scrollbar whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 whitespace-nowrap">
                          <Filter className="w-3.5 h-3.5" />
                          筛选配对
                        </div>
                        {/* 精灵名搜索 */}
                        <div className="relative flex-1 min-w-[130px] max-w-[200px] flex items-center shrink-0">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-550 z-10 pointer-events-none" />
                          <Autocomplete
                            value={pairingFilterName}
                            onChange={val => setPairingFilterName(val)}
                            options={ALL_PET_NAMES}
                            placeholder="搜索精灵名..."
                            className="w-full"
                            inputClassName="w-full pl-8 pr-2 py-1.5 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 dark:focus:ring-indigo-950/40 transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 h-8"
                          />
                        </div>
                        {/* 蛋组筛选 */}
                        <select
                          value={pairingFilterGroup}
                          onChange={e => setPairingFilterGroup(e.target.value)}
                          className="text-xs text-slate-700 dark:text-slate-355 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 h-8 focus:outline-none focus:border-indigo-400 cursor-pointer font-medium hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors w-auto shrink-0 whitespace-nowrap"
                        >
                          <option value="" className="dark:bg-slate-900">全部蛋组</option>
                          {allPairGroups.map(g => (
                            <option key={g} value={g} className="dark:bg-slate-900">{g}</option>
                          ))}
                        </select>
                        {/* 牌子筛选 */}
                        <select
                          value={pairingFilterBrand}
                          onChange={e => setPairingFilterBrand(e.target.value)}
                          className={`text-xs border rounded-lg px-2 py-1.5 h-8 focus:outline-none cursor-pointer font-bold transition-all w-auto shrink-0 whitespace-nowrap ${
                            pairingFilterBrand ? getBrandStyle(pairingFilterBrand) : 'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <option value="" className="dark:bg-slate-900">全部牌子</option>
                          {allPairBrands.map(b => (
                            <option key={b} value={b} className="dark:bg-slate-900">{b}</option>
                          ))}
                        </select>
                        {/* 3V/性格合并筛选 */}
                        <select
                          value={pairingFilter3V}
                          onChange={e => setPairingFilter3V(e.target.value)}
                          className="text-xs text-slate-700 dark:text-slate-355 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 h-8 focus:outline-none focus:border-indigo-400 cursor-pointer font-medium hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors w-auto shrink-0 whitespace-nowrap"
                        >
                          <option value="" className="dark:bg-slate-900">全部配对</option>
                          <option value="sameNature" className="dark:bg-slate-900">双亲同性格</option>
                          <option value="3V" className="dark:bg-slate-900">仅3V配对</option>
                          <option value="非3V" className="dark:bg-slate-900">仅非3V配对</option>
                        </select>
                        {/* 性格筛选 */}
                        <select
                          value={pairingFilterNature}
                          onChange={e => setPairingFilterNature(e.target.value)}
                          className="text-xs text-slate-700 dark:text-slate-350 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 h-8 focus:outline-none focus:border-indigo-400 cursor-pointer font-medium hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors w-auto shrink-0 whitespace-nowrap"
                        >
                          <option value="" className="dark:bg-slate-900">全部性格</option>
                          {NATURE_OPTIONS.map(nature => (
                            <option key={nature} value={nature} className="dark:bg-slate-900">{nature}</option>
                          ))}
                        </select>
                        {/* 筛选结果计数 & 重置 */}
                        <div className="flex items-center gap-2 ml-auto shrink-0 whitespace-nowrap">
                          <span className="text-[11px] text-slate-400 dark:text-slate-550 font-medium">
                            {hasFilter ? `筛选结果: ${filteredPairings.length} / ${allPairings.length} 组` : `共 ${allPairings.length} 组配对`}
                          </span>
                          {hasFilter && (
                            <button
                              onClick={() => {
                                setPairingFilterName("");
                                setPairingFilterGroup("");
                                setPairingFilterBrand("");
                                setPairingFilter3V("");
                                setPairingFilterNature("");
                              }}
                              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-bold transition-colors cursor-pointer px-2 py-1 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg border border-indigo-100 dark:border-indigo-900/55"
                            >
                              重置筛选
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 配对卡片列表 */}
                      {groupedPairings.length === 0 ? (
                        <div className="py-10 flex flex-col items-center justify-center text-center select-none">
                          <Search className="w-8 h-8 text-slate-300 dark:text-slate-655 stroke-1 mb-2" />
                          <p className="text-sm font-bold text-slate-400 dark:text-slate-300">没有符合筛选条件的配对</p>
                          <p className="text-xs text-slate-400 dark:text-slate-550 mt-1">请尝试调整或重置筛选条件</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {groupedPairings.map((group) => {
                            const groupKey = group.eggSprite; // 分组键使用蛋品种 (eggSprite)
                            const activeIndex = activeFatherIndices[groupKey] || 0;
                            const safeIdx = activeIndex >= group.pairings.length ? 0 : activeIndex;
                            const currentPair = group.pairings[safeIdx];

                            const isStatsMatch = currentPair.father.stats.length === currentPair.mother.stats.length &&
                              currentPair.father.stats.every((v, i) => v === currentPair.mother.stats[i] && v !== "无");

                            const fatherSpriteFile = getSpriteFileName(currentPair.father.sprite);
                            const motherSpriteFile = getSpriteFileName(currentPair.mother.sprite);

                            const pairKey = currentPair.father.id + "-" + currentPair.mother.id;
                            const isExcluded = excludedPairKeys.has(pairKey);

                            const thresholds = getPetSizeThresholds(currentPair.eggSprite);
                            const guideSize = getPetGuideSize(currentPair.eggSprite);

                            return (
                              <div
                                key={groupKey}
                                onClick={() => {
                                  const newSet = new Set(excludedPairKeys);
                                  if (newSet.has(pairKey)) {
                                    newSet.delete(pairKey);
                                  } else {
                                    newSet.add(pairKey);
                                  }
                                  setExcludedPairKeys(newSet);
                                }}
                                className={`relative border rounded-2xl p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 transition-all duration-300 shadow-3xs cursor-pointer select-none bg-white dark:bg-slate-900 ${
                                  !isExcluded
                                    ? "border-emerald-300 dark:border-emerald-900/50 ring-2 ring-emerald-300/40 dark:ring-emerald-950/20"
                                    : "border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100"
                                }`}
                              >
                                {/* Check Circle */}
                                <div className="absolute top-3 left-3 z-10 select-none">
                                  {!isExcluded ? (
                                    <div className="p-0.5 bg-emerald-500 rounded-full border border-emerald-400">
                                      <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />
                                    </div>
                                  ) : (
                                    <div className="w-4.5 h-4.5 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
                                  )}
                                </div>

                                {/* Main Parents row */}
                                <div className="grid grid-cols-2 gap-4 relative">
                                  {/* Left side: Father selection (with chevron control) */}
                                  <div className="flex flex-col gap-2 bg-slate-50/70 dark:bg-slate-900/35 p-2.5 sm:p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/30 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                        <span>♂</span>父本 (种公)
                                      </span>
                                      {group.pairings.length > 1 && (
                                        <div className="flex items-center gap-1 shrink-0 action-buttons" onClick={(e) => e.stopPropagation()}>
                                          <button
                                            onClick={() => {
                                              setActiveFatherIndices(prev => ({
                                                ...prev,
                                                [groupKey]: safeIdx === 0 ? group.pairings.length - 1 : safeIdx - 1
                                              }));
                                            }}
                                            className="p-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-55/50 dark:hover:bg-slate-700 transition-colors shadow-3xs cursor-pointer"
                                          >
                                            <ChevronLeft className="w-3 h-3 text-slate-650 dark:text-slate-355" />
                                          </button>
                                          <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 px-0.5 min-w-[22px] text-center">
                                            {safeIdx + 1}/{group.pairings.length}
                                          </span>
                                          <button
                                            onClick={() => {
                                              setActiveFatherIndices(prev => ({
                                                ...prev,
                                                [groupKey]: safeIdx === group.pairings.length - 1 ? 0 : safeIdx + 1
                                              }));
                                            }}
                                            className="p-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-55/50 dark:hover:bg-slate-700 transition-colors shadow-3xs cursor-pointer"
                                          >
                                            <ChevronRight className="w-3 h-3 text-slate-650 dark:text-slate-355" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex gap-2 items-center mt-1">
                                      <div className="w-10 h-10 sm:w-14 sm:h-14 bg-blue-50/60 dark:bg-blue-950/20 rounded-lg sm:rounded-xl border border-blue-100 dark:border-blue-900/35 flex items-center justify-center shrink-0 relative overflow-hidden shadow-sm">
                                        {fatherSpriteFile ? (
                                          <img
                                            src={getImagePath("images/sprites/" + fatherSpriteFile)}
                                            alt={currentPair.father.sprite}
                                            className="w-8 h-8 sm:w-11 sm:h-11 object-contain"
                                            loading="lazy"
                                          />
                                        ) : (
                                          <div className="text-slate-350 dark:text-slate-650 text-sm sm:text-lg">♂</div>
                                        )}
                                        <span className="absolute bottom-0 right-0 text-[8px] sm:text-[9px] bg-blue-500 text-white leading-none px-0.5 py-0.2 sm:px-1 sm:py-0.5 rounded-tl-md font-bold">♂</span>
                                      </div>
                                      <div className="min-w-0 flex-1 flex flex-col justify-center">
                                        <div className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate" title={currentPair.father.sprite}>
                                          {currentPair.father.sprite}
                                        </div>
                                        <div className="text-[10px] sm:text-[11px] font-semibold text-slate-600 dark:text-slate-400 mt-1 truncate">
                                          {currentPair.father.nature || <span className="text-slate-355 dark:text-slate-655 italic">无性格</span>}
                                        </div>
                                        <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                                          {currentPair.father.height ? `${currentPair.father.height}m` : "—"}/${currentPair.father.weight ? `${currentPair.father.weight}kg` : "—"}
                                        </div>
                                      </div>
                                    </div>
                                    {/* Father Location */}
                                    {currentPair.father.position && currentPair.father.position !== "-" && (
                                      <div className="mt-1.5 flex items-center gap-1 bg-indigo-50/40 dark:bg-indigo-950/15 p-1 rounded border border-indigo-100/30 dark:border-indigo-900/20 select-none min-w-0">
                                        <span className="text-[8px] font-bold text-indigo-750 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/30 px-1 py-0.2 rounded shrink-0">📍位置</span>
                                        <span className="text-[8.5px] font-extrabold text-indigo-600 dark:text-indigo-400 truncate flex-1" title={currentPair.father.position}>
                                          {currentPair.father.position}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Right side: Mother info */}
                                  <div className="flex flex-col gap-2 bg-slate-50/70 dark:bg-slate-900/35 p-2.5 sm:p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-extrabold text-pink-650 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 border border-pink-200/50 dark:border-pink-900/30 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 select-none">
                                        <span>♀</span>母本 (种母)
                                      </span>
                                    </div>
                                    <div className="flex gap-2 items-center mt-1">
                                      <div className="min-w-0 flex-1 flex flex-col justify-center text-right">
                                        <div className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate" title={currentPair.mother.sprite}>
                                          {currentPair.mother.sprite}
                                        </div>
                                        <div className="text-[10px] sm:text-[11px] font-semibold text-slate-600 dark:text-slate-400 mt-1 truncate">
                                          {currentPair.mother.nature || <span className="text-slate-355 dark:text-slate-655 italic">无性格</span>}
                                        </div>
                                        <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                                          {currentPair.mother.height ? `${currentPair.mother.height}m` : "—"}/${currentPair.mother.weight ? `${currentPair.mother.weight}kg` : "—"}
                                        </div>
                                      </div>
                                      <div className="w-10 h-10 sm:w-14 sm:h-14 bg-pink-50/60 dark:bg-pink-950/20 rounded-lg sm:rounded-xl border border-pink-100 dark:border-pink-900/35 flex items-center justify-center shrink-0 relative overflow-hidden shadow-sm">
                                        {motherSpriteFile ? (
                                          <img
                                            src={getImagePath("images/sprites/" + motherSpriteFile)}
                                            alt={currentPair.mother.sprite}
                                            className="w-8 h-8 sm:w-11 sm:h-11 object-contain"
                                            loading="lazy"
                                          />
                                        ) : (
                                          <div className="text-slate-350 dark:text-slate-600 text-sm sm:text-lg">♀</div>
                                        )}
                                        <span className="absolute bottom-0 right-0 text-[8px] sm:text-[9px] bg-pink-500 text-white leading-none px-0.5 py-0.2 sm:px-1 sm:py-0.5 rounded-tl-md font-bold">♀</span>
                                      </div>
                                    </div>
                                    {/* Mother Location */}
                                    {currentPair.mother.position && currentPair.mother.position !== "-" && (
                                      <div className="mt-1.5 flex items-center gap-1 bg-indigo-50/40 dark:bg-indigo-950/15 p-1 rounded border border-indigo-100/30 dark:border-indigo-900/20 select-none min-w-0">
                                        <span className="text-[8px] font-bold text-indigo-750 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/30 px-1 py-0.2 rounded shrink-0">📍位置</span>
                                        <span className="text-[8.5px] font-extrabold text-indigo-600 dark:text-indigo-400 truncate flex-1 text-right" title={currentPair.mother.position}>
                                          {currentPair.mother.position}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* 子代规格参考 */}
                                {guideSize && (
                                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3 text-xs space-y-2 font-medium select-none">
                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200/60 dark:border-slate-800 pb-2 mb-2">
                                      <span className="text-slate-800 dark:text-slate-200">【{currentPair.eggSprite}】子代规格参考</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                        <Ruler className="w-3.5 h-3.5 text-slate-400 dark:text-slate-550 shrink-0" />
                                        <span>身高:</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">{guideSize.height}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                        <Weight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-550 shrink-0" />
                                        <span>体重:</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">{guideSize.weight}</span>
                                      </div>
                                    </div>
                                    {thresholds && (
                                      <div className="grid grid-cols-2 gap-x-4 pt-2 border-t border-slate-200/50 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                                        <div className="space-y-1">
                                          <div className="flex items-center justify-between">
                                            <span>大及格身高:</span>
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">≥{thresholds.maxHeight.toFixed(2)}m</span>
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <span>大及格体重:</span>
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">≥{thresholds.giantWeightLine.toFixed(4)}kg</span>
                                          </div>
                                        </div>
                                        <div className="space-y-1 border-l border-slate-200/60 dark:border-slate-800 pl-3">
                                          <div className="flex items-center justify-between">
                                            <span>小及格身高:</span>
                                            <span className="font-bold text-amber-600 dark:text-amber-400">≤{thresholds.minHeight.toFixed(2)}m</span>
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <span>小及格体重:</span>
                                            <span className="font-bold text-amber-600 dark:text-amber-400">≤{thresholds.tinyWeightLine.toFixed(4)}kg</span>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* 底部产出信息 + 操作 */}
                                <div className="bg-gradient-to-r from-slate-50 dark:from-slate-800/40 to-indigo-50/30 dark:to-indigo-950/20 rounded-xl border border-slate-200/80 dark:border-slate-800 px-2.5 py-2 sm:px-3 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-2">
                                  <div className="flex items-center gap-1 sm:gap-2 shrink-0 whitespace-nowrap">
                                    <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">产出:</span>
                                    <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 shrink-0">{currentPair.eggSprite}蛋</span>
                                  </div>
                                  <div className="flex gap-1 sm:gap-2 items-center min-w-0">
                                    <span className="bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-900/40 px-1.5 py-0.5 sm:px-2 rounded-lg text-[10px] sm:text-[11px] font-bold select-none truncate shrink-0 max-w-[80px] xs:max-w-none" title={currentPair.matchingGroups.join("/")}>
                                      {currentPair.matchingGroups.join("/")}
                                    </span>
                                    <span className={`font-bold px-1.5 py-0.5 sm:px-2 rounded-lg border text-[10px] sm:text-[11px] select-none shrink-0 ${
                                      isStatsMatch
                                        ? "bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-900/40"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                    }`}>
                                      {isStatsMatch ? "✨3V" : "非3V"}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleImportPairingsToNest([{ father: currentPair.father, mother: currentPair.mother, brand: currentPair.brand, eggSprite: currentPair.eggSprite, matchingGroups: currentPair.matchingGroups }]);
                                      }}
                                      className="px-2.5 py-1 sm:px-4 sm:py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] sm:text-xs font-bold rounded-lg cursor-pointer transition-all shadow hover:shadow-md action-buttons shrink-0 whitespace-nowrap"
                                    >
                                      导入
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            );
          })()}
        </div>{/* Bottom Global Settings Bar */}
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap gap-2.5 items-center justify-between mt-4 select-none">
          <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            父母本中心的数据修改会自动保存至本地，也可以在下方进行全局备份操作
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleReset("parents")}
              className="py-1.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 rounded-lg transition-all font-medium flex items-center justify-center gap-1.5 shadow-xs text-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              初始化列表
            </button>
            <button
              onClick={handleImportParentsClick}
              className="py-1.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 rounded-lg transition-all font-medium flex items-center justify-center gap-1.5 shadow-xs text-xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              导入数据
            </button>
            <button
              onClick={handleExportParentsClick}
              className="py-1.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 rounded-lg transition-all font-medium flex items-center justify-center gap-1.5 shadow-xs text-xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              导出数据
            </button>
          </div>
        </div>
      </div>
    )}

      {/* Dynamic Toast Alerts */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border min-w-[320px] max-w-md"
            style={{
              backgroundColor: toast.type === "success" ? "#ecfdf5" : toast.type === "error" ? "#fff1f2" : "#f0f9ff",
              borderColor: toast.type === "success" ? "#10b981" : toast.type === "error" ? "#f43f5e" : "#0ea5e9",
              color: toast.type === "success" ? "#065f46" : toast.type === "error" ? "#9f1239" : "#075985"
            }}
          >
            {toast.type === "success" && <Check className="w-5 h-5 text-emerald-600 shrink-0" />}
            {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            {toast.type === "info" && <RefreshCw className="w-5 h-5 text-sky-600 animate-spin shrink-0" />}
            <span className="text-sm font-semibold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Dialog Modals */}
      <AnimatePresence>
        {false && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl border border-slate-100/80 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col scale-in select-none max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 py-4.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-indigo-50 rounded-lg border border-indigo-100/50">
                    <Egg className="w-4.5 h-4.5 text-indigo-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {editingEggId ? "修改精灵蛋信息" : "登记新精灵蛋"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowEggModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Scrollable Fields container */}
              <div className="overflow-y-auto p-6 flex flex-col gap-4.5">
                {/* Sprite Autocomplete */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">精灵名称</label>
                  <div className="flex gap-2.5 items-center">
                    {(() => {
                      const finalDetails = getPetDetails(eggFormSprite);
                      const spriteFile = getSpriteFileName(eggFormSprite);
                      const spriteUrl = spriteFile ? getImagePath(`images/sprites/${spriteFile}`) : null;
                      return (
                        <div className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center relative overflow-hidden shrink-0">
                          {spriteUrl ? (
                            <img src={spriteUrl} alt="" className="w-8.5 h-8.5 object-contain" />
                          ) : (
                            <span className="text-sm">🥚</span>
                          )}
                        </div>
                      );
                    })()}
                    <Autocomplete
                      value={eggFormSprite}
                      onChange={(val) => {
                        setEggFormSprite(val);
                      }}
                      options={ALL_PET_NAMES}
                      placeholder="输入精灵名称..."
                      className="flex-1"
                      inputClassName="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-semibold h-10"
                    />
                  </div>
                </div>

                {/* Auto Match Info Card */}
                {(() => {
                  const config = getEggConfig(eggFormSprite);
                  const thresholds = getEggSizeThresholds(eggFormSprite);
                  if (!config || !thresholds) return null;
                  return (
                    <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100/60 flex flex-col gap-2 select-none">
                      <span className="text-[10px] font-bold text-indigo-500 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-indigo-500" />
                        系统已匹配该精灵的蛋数据标准范围：
                      </span>
                      <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <div className="flex flex-col bg-white/70 p-2 rounded-xl border border-indigo-100/20">
                          <span className="text-slate-400 font-bold">标准尺寸</span>
                          <span className="text-slate-700 font-mono font-bold mt-0.5">
                            {(config.height_low / 100).toFixed(2)}m - {(config.height_high / 100).toFixed(2)}m
                          </span>
                        </div>
                        <div className="flex flex-col bg-white/70 p-2 rounded-xl border border-indigo-100/20">
                          <span className="text-slate-400 font-bold">标准重量</span>
                          <span className="text-slate-700 font-mono font-bold mt-0.5">
                            {(config.weight_low / 1000).toFixed(3)}kg - {(config.weight_high / 1000).toFixed(3)}kg
                          </span>
                        </div>
                        <div className="flex flex-col bg-white/70 p-2 rounded-xl border border-indigo-100/20">
                          <span className="text-slate-400 font-bold">基础孵化时间</span>
                          <span className="text-slate-700 font-bold mt-0.5">
                            {formatHatchTime(config.hatch_data)}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-500 font-medium">
                        <div>大块头及格线: <span className="font-mono text-rose-500 font-bold">{(thresholds.giantWeightLine).toFixed(3)}kg</span></div>
                        <div>小不点及格线: <span className="font-mono text-indigo-500 font-bold">{(thresholds.tinyWeightLine).toFixed(3)}kg</span></div>
                      </div>
                    </div>
                  );
                })()}

                {/* Parents details block */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-4">
                  <span className="text-[11px] font-extrabold text-slate-400 select-none block tracking-wider uppercase">父母亲信息配置</span>
                  
                  {/* Father row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-555 mb-1.5 flex items-center gap-1 text-sky-600">
                        ♂️ 父亲性格
                      </label>
                      <select
                        value={eggFormFatherNature}
                        onChange={(e) => setEggFormFatherNature(e.target.value)}
                        className="w-full px-3 py-2 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
                      >
                        <option value="">选择父亲性格 (可选)</option>
                        {NATURE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-555 mb-1.5 flex items-center gap-1 text-pink-650">
                        ♀️ 母亲性格
                      </label>
                      <select
                        value={eggFormMotherNature}
                        onChange={(e) => setEggFormMotherNature(e.target.value)}
                        className="w-full px-3 py-2 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
                      >
                        <option value="">选择母亲性格 (可选)</option>
                        {NATURE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Father Stats Selection */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-slate-555 flex items-center gap-1 text-sky-600">
                      ♂️ 父亲 3围 (请对应选择)
                    </span>
                    <div className="flex gap-2">
                      {[0, 1, 2].map((idx) => (
                        <select
                          key={idx}
                          value={eggFormFatherStats[idx] || "无"}
                          onChange={(e) => {
                            const newStats = [...eggFormFatherStats];
                            newStats[idx] = e.target.value;
                            setEggFormFatherStats(newStats);
                          }}
                          className="flex-1 px-2 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-semibold transition-all cursor-pointer"
                        >
                          {STATS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ))}
                    </div>
                  </div>

                  {/* Mother Stats Selection */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-slate-555 flex items-center gap-1 text-pink-650">
                      ♀️ 母亲 3围 (请对应选择)
                    </span>
                    <div className="flex gap-2">
                      {[0, 1, 2].map((idx) => (
                        <select
                          key={idx}
                          value={eggFormMotherStats[idx] || "无"}
                          onChange={(e) => {
                            const newStats = [...eggFormMotherStats];
                            newStats[idx] = e.target.value;
                            setEggFormMotherStats(newStats);
                          }}
                          className="flex-1 px-2 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-semibold transition-all cursor-pointer"
                        >
                          {STATS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Egg physical properties */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">
                      蛋尺寸 (单位: m)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="例如: 0.23"
                      value={eggFormSize}
                      onChange={(e) => setEggFormSize(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-semibold h-10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">
                      蛋重量 (单位: kg)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="例如: 0.046"
                      value={eggFormWeight}
                      onChange={(e) => setEggFormWeight(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-semibold h-10"
                    />
                  </div>
                </div>

                {/* Brand Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">
                      蛋牌子
                    </label>
                    <select
                      value={eggFormBrand}
                      onChange={(e) => setEggFormBrand(e.target.value)}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none font-bold transition-all h-10 cursor-pointer ${getBrandStyle(eggFormBrand)}`}
                    >
                      {BRAND_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">
                      产出时间
                    </label>
                    <input
                      type="date"
                      value={eggFormProduceTime}
                      onChange={(e) => setEggFormProduceTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-semibold h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  onClick={() => setShowEggModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  取消
                </button>
                <button
                  onClick={() => {}}
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
                >
                  确认保存
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {activeModal === "reset" && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3 text-amber-600">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <h3 className="text-lg font-bold text-left text-slate-800 dark:text-slate-100">
                  {resetTabTarget === "nest" && "确定要重置蛋窝与需求列表吗？"}
                  {resetTabTarget === "parents" && "确定要清空父母本仓库吗？"}
                  {resetTabTarget === "eggs" && "确定要清空精灵蛋管理中心吗？"}
                </h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed text-left">
                {resetTabTarget === "nest" && `这将清除您自建的所有蛋窝精灵以及最新修改的状态，并还原到出厂初始精灵列表 (共 ${INITIAL_TABLE_DATA.length} 个推荐精灵条目)，同时清空换蛋需求记录。此操作无法撤销！`}
                {resetTabTarget === "parents" && "这将清除您当前账号下登记的所有父母本精灵卡片及数据。此操作无法撤销！"}
                {resetTabTarget === "eggs" && "这将清空您当前登记的所有精灵蛋管理卡片和产出记录。此操作无法撤销！"}
              </p>
              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  onClick={() => {
                    setActiveModal("none");
                    setResetTabTarget(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer mr-0 border border-transparent"
                >
                  取消
                </button>
                <button
                  onClick={executeReset}
                  className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  确定重置
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showAccountModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4 relative max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={() => {
                  setShowAccountModal(false);
                  setEditingAccountId(null);
                }}
                className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:bg-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Settings className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-left">多账号中心与备份管理</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-left">在此新建账号、切换数据分区、或进行单账号及全量导入导出备份</p>
                </div>
              </div>

              {/* 第一部分：新建账号 */}
              <div className="bg-slate-50/60 dark:bg-slate-950/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800 text-left">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                  创建新账号 / 数据分区
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 text-left">账号昵称 (必填)</label>
                    <input
                      type="text"
                      placeholder="例如：主号 / 换蛋小号 / 派派"
                      value={newAccNickname}
                      onChange={e => setNewAccNickname(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 dark:focus:ring-indigo-950/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 text-left">游戏 UID (选填)</label>
                    <input
                      type="text"
                      placeholder="洛克王国角色 ID"
                      value={newAccUid}
                      onChange={e => setNewAccUid(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 dark:focus:ring-indigo-950/50 transition-all"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => handleCreateAccount(newAccNickname, newAccUid)}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                  >
                    新建并切换
                  </button>
                </div>
              </div>

              {/* 第二部分：账号列表 */}
              <div className="flex-1 flex flex-col min-h-[220px] text-left">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                  账号列表 ({accounts.length})
                </h4>
                
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden flex-1 overflow-y-auto max-h-60 bg-white dark:bg-slate-900">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/75 dark:bg-slate-950/45 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                        <th className="px-4 py-2">账号昵称</th>
                        <th className="px-4 py-2">UID</th>
                        <th className="px-4 py-2 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-xs">
                      {accounts.map(acc => {
                        const isActive = acc.id === activeAccountId;
                        const isEditing = editingAccountId === acc.id;

                        return (
                          <tr key={acc.id} className={`hover:bg-slate-50/45 transition-colors ${isActive ? "bg-indigo-50/20" : ""}`}>
                            <td className="px-4 py-2.5 font-medium">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingNickname}
                                  onChange={e => setEditingNickname(e.target.value)}
                                  className="border border-slate-200 rounded px-2 py-0.5 text-xs max-w-[120px] focus:outline-none focus:border-indigo-500"
                                />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-800 dark:text-slate-200 font-bold">{acc.nickname}</span>
                                  {isActive && (
                                    <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 rounded-md">
                                      当前激活
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-slate-500 dark:text-slate-400">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingNickname}
                                  onChange={e => setEditingNickname(e.target.value)}
                                  className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded px-2 py-0.5 text-xs max-w-[120px] focus:outline-none focus:border-indigo-500"
                                />
                              ) : (
                                acc.uid || "—"
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => handleUpdateAccountInfo(acc.id, editingNickname, editingUid)}
                                      className="text-emerald-600 hover:text-emerald-700 font-bold px-1.5 py-0.5 cursor-pointer border border-transparent"
                                    >
                                      保存
                                    </button>
                                    <button
                                      onClick={() => setEditingAccountId(null)}
                                      className="text-slate-400 hover:text-slate-600 dark:text-slate-350 px-1.5 py-0.5 cursor-pointer border border-transparent"
                                    >
                                      取消
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    {!isActive && (
                                      <button
                                        onClick={() => handleSwitchAccount(acc.id)}
                                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold px-1.5 py-0.5 cursor-pointer border border-transparent"
                                      >
                                        切换
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        setEditingAccountId(acc.id);
                                        setEditingNickname(acc.nickname);
                                        setEditingUid(acc.uid || "");
                                      }}
                                      className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium px-1.5 py-0.5 cursor-pointer border border-transparent"
                                    >
                                      编辑
                                    </button>
                                    <button
                                      onClick={() => handleExportSingleClick(acc.id)}
                                      className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium px-1.5 py-0.5 cursor-pointer border border-transparent"
                                      title="导出该账号的备份文件"
                                    >
                                      导出
                                    </button>
                                    {accounts.length > 1 && (
                                      <button
                                        onClick={() => {
                                          showConfirm(
                                            "删除账号确认",
                                            `确定要删除账号「${acc.nickname}」吗？此操作无法恢复，且会同步抹去其所有孵蛋数据！`,
                                            () => handleDeleteAccount(acc.id)
                                          );
                                        }}
                                        className="text-rose-500 hover:text-rose-700 font-semibold px-1.5 py-0.5 cursor-pointer border border-transparent"
                                      >
                                        删除
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 第三部分：全局全量操作 */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-wrap items-center justify-between gap-3 bg-slate-50/20 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 dark:text-slate-500 text-left">
                  💡 <strong>提示：</strong> 支持导入单个账号备份，也支持全量多账号导出/导入，实现多端同步。
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowAccountModal(false);
                      handleExportAllClick();
                    }}
                    className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg cursor-pointer transition-colors border border-slate-200/50 dark:border-slate-700"
                  >
                    导出所有账号
                  </button>
                  <button
                    onClick={() => {
                      setShowAccountModal(false);
                      handleImportClick();
                    }}
                    className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-350 text-xs font-bold rounded-lg cursor-pointer transition-colors border border-indigo-100/30 dark:border-indigo-900/40"
                  >
                    导入备份数据
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {importConfirmType !== "none" && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-55 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4 text-left"
            >
              <div className="flex items-center gap-3 text-amber-600">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <h3 className="text-lg font-bold text-left text-slate-800 dark:text-slate-100">请确认数据导入方案</h3>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/60 dark:border-amber-900/30 p-3 rounded-xl text-left">
                {importInfoText}
              </p>

              {/* 如果是单账号数据导入，我们需要让用户核对/配置作为新账号导入时的参数 */}
              {importConfirmType === "single" && (
                <div className="bg-slate-50/50 dark:bg-slate-950/20 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-xs space-y-2.5 text-left">
                  <span className="block font-bold text-slate-700 dark:text-slate-300">导入为新分区设置：</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-0.5">导入新账号昵称</label>
                      <input
                        type="text"
                        value={importAsNewNickname}
                        onChange={e => setImportAsNewNickname(e.target.value)}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-0.5">UID</label>
                      <input
                        type="text"
                        value={importAsNewUid}
                        onChange={e => setImportAsNewUid(e.target.value)}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 mt-2">
                {importConfirmType === "single" ? (
                  <>
                    <button
                      onClick={() => confirmImportSingle(true)}
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors shadow-sm text-xs cursor-pointer text-center border border-transparent"
                    >
                      作为新账号导入（保留当前账号）
                    </button>
                    <button
                      onClick={() => {
                        showConfirm(
                          "覆盖数据确认",
                          `您确定要使用导入的数据，完全覆盖当前活动的账号「${accounts.find(a => a.id === activeAccountId)?.nickname || "默认账号"}」吗？覆盖后旧数据不可恢复！`,
                          () => confirmImportSingle(false)
                        );
                      }}
                      className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors shadow-sm text-xs cursor-pointer text-center border border-transparent"
                    >
                      覆盖当前激活的账号
                    </button>
                  </>
                ) : (
                  <button
                    onClick={confirmImportAll}
                    className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors shadow-md text-xs cursor-pointer text-center border border-transparent"
                  >
                    确定全量覆盖导入
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setPendingImportData(null);
                    setImportConfirmType("none");
                  }}
                  className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center border border-transparent"
                >
                  取消
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {activeModal === "import" && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4 relative"
            >
              <button
                onClick={() => setActiveModal("none")}
                className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:bg-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                <Upload className="w-5 h-5 text-indigo-500 shrink-0" />
                <h3 className="text-lg font-bold">
                  {importContext === "nest" && "导入蛋窝精灵数据"}
                  {importContext === "parents" && "导入父母本仓储数据"}
                  {importContext === "eggs" && "导入精灵蛋数据"}
                  {importContext === "global" && "导入全量备份数据"}
                </h3>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2 text-left leading-relaxed">
                {importContext === "nest" && "💡 您当前处于局部导入模式。将仅覆盖「蛋窝中心」的精灵数据，其他标签页不受影响。支持导入蛋窝专有备份或单账号全量备份（会自动提取其中的蛋窝精灵数据）。"}
                {importContext === "parents" && "💡 您当前处于局部导入模式。将仅覆盖「父母本仓库」的数据，其他标签页不受影响。支持导入父母本专有备份或单账号全量备份（会自动提取其中的父母本数据）。"}
                {importContext === "eggs" && "💡 您当前处于局部导入模式。将仅覆盖「精灵蛋管理」的数据，其他标签页不受影响。支持导入精灵蛋专有备份或单账号全量备份（会自动提取其中的精灵蛋数据）。"}
                {importContext === "global" && "💡 您当前处于全局导入模式。导入的单账号或多账号备份将覆盖对应分区的全部标签页数据！"}
              </p>

              <div className="flex flex-col gap-3">
                {/* File dragging trigger/input */}
                <label className="border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 focus-within:border-indigo-500 rounded-xl p-5 flex flex-col items-center justify-center gap-1.5 bg-slate-50 dark:bg-slate-950/20 hover:bg-indigo-50/20 cursor-pointer transition-all text-center">
                  <Upload className="w-8 h-8 text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">加载您的备份 .json 文件</span>
                  <span className="text-[10px] text-slate-400">点击此处或拖拽数据文件到此处</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="h-[1px] bg-slate-200 flex-1"></div>
                  <span>或者在此处直接粘贴备份 JSON 文本</span>
                  <div className="h-[1px] bg-slate-200 flex-1"></div>
                </div>

                <textarea
                  value={jsonText}
                  onChange={e => {
                    setJsonText(e.target.value);
                    setImportError("");
                  }}
                  placeholder='备份 JSON 数据, 例如: [{"sprite":"水蓝蓝","natures":["聪明"],"groups":["魔力组"]}]'
                  className="w-full h-32 border border-slate-200 dark:border-slate-750 rounded-xl p-3 text-xs font-mono bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/50 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 resize-none"
                />

                {importError && (
                  <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-lg font-medium flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{importError}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  onClick={() => setActiveModal("none")}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer border border-transparent mr-0"
                >
                  取消
                </button>
                <button
                  onClick={() => executeImport(jsonText)}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  安全导入
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {activeModal === "export" && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4 relative"
            >
              <button
                onClick={() => setActiveModal("none")}
                className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:bg-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                <Share2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <h3 className="text-lg font-bold">
                  {exportType === "nest" && "备份并导出蛋窝数据"}
                  {exportType === "parents" && "备份并导出父母本仓库数据"}
                  {exportType === "eggs" && "备份并导出精灵蛋数据"}
                  {exportType === "single" && "备份并导出单账号数据"}
                  {exportType === "all" && "备份并导出全量多账号数据"}
                </h3>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed text-left">
                {exportType === "nest" && "已为您成功打包当前账号下的「蛋窝精灵」及换蛋交易数据。您可以将其下载为专有的蛋窝备份，或复制代码直接用于单独的蛋窝导入。"}
                {exportType === "parents" && "已为您成功打包当前账号下的「父母本仓库」配置数据。您可以将其下载为专有的父母本备份，或复制代码直接用于单独的父母本导入。"}
                {exportType === "eggs" && "已为您成功打包当前账号下的「精灵蛋管理」卡片及产蛋纪录数据。您可以将其下载为专有的精灵蛋备份，或复制代码直接用于单独的精灵蛋导入。"}
                {(exportType === "single" || exportType === "all") && "当前列表内所有的宠物、性格、蛋组以及窝点详情状态信息已成功打包。您可以将其保存到本地备份，也可以复制其文本在其它浏览器或账户上进行导入还原。"}
              </p>

              <div className="relative">
                <textarea
                  value={jsonText}
                  readOnly
                  className="w-full h-40 border border-slate-200 dark:border-slate-750 rounded-xl p-3 text-xs font-mono bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 resize-none select-all focus:outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="absolute bottom-3 right-3 py-1.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                  title="一键复制到剪贴板"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  复制内容
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 mt-2">
                <button
                  onClick={downloadJsonBackup}
                  className="px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200/50 dark:border-emerald-900/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  下载备份文件 (.json)
                </button>

                <button
                  onClick={() => setActiveModal("none")}
                  className="px-5 py-2 text-sm font-semibold text-white bg-slate-800 dark:bg-slate-750 hover:bg-slate-700 dark:hover:bg-slate-650 rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {activeModal === "image-preview" && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-3xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4 relative"
            >
              <button
                onClick={() => setActiveModal("none")}
                className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:bg-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                <Camera className="w-5 h-5 text-indigo-500 shrink-0" />
                <h3 className="text-lg font-bold">已为您生成超清长图</h3>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                长图包含了您当前的全部精灵匹配表格，已自动过滤操作按钮、排序控制等。您可以点击
                <strong className="text-indigo-600 dark:text-indigo-400">「直接下载图片」</strong>
                或在下方长图上 <strong className="text-indigo-600 dark:text-indigo-400">鼠标右键 / 长按选择「图片另存为」</strong> 进行保存。
              </p>

              {/* Image Preview Container */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950 h-[45vh] overflow-y-auto p-4 flex justify-center shadow-inner relative group">
                {exportedImageUrl ? (
                  <img
                    src={exportedImageUrl}
                    alt="洛克王国孵蛋数据导出"
                    className="shadow-md rounded border border-slate-200/60 dark:border-slate-800 h-auto max-w-full select-all object-contain bg-white dark:bg-slate-900"
                    style={{ minWidth: "300px" }}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                    <RefreshCw className="w-8 h-8 animate-spin text-slate-300" />
                    <span className="text-xs">加载图片预览中...</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 mt-2 flex-wrap sm:flex-nowrap">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  * 支持导出目前列表中经过搜索/筛选的完整精灵条目
                </span>
                <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
                  <button
                    onClick={() => setActiveModal("none")}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer border border-transparent mr-0"
                  >
                    取消
                  </button>

                  <button
                    onClick={() => {
                      if (!exportedImageUrl) return;
                      const link = document.createElement("a");
                      const dateStr = new Date().toLocaleDateString("zh-CN").replace(/\//g, "-");
                      link.href = exportedImageUrl;
                      link.download = `洛克王国孵蛋表格长图_${dateStr}.jpg`;
                      link.click();
                      showToast("长图已开始下载！", "success");
                    }}
                    className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    直接下载图片
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* ========== About Modal ========== */}
        {activeModal === "about" && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setActiveModal("none")}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-slate-900 px-6 py-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none" />
                <div className="flex items-center gap-3 z-10 relative">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700/50 shadow-inner">
                    <Egg className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-base tracking-tight">洛克王国孵蛋数据管理系统</h2>
                    <p className="text-slate-400 text-[11px] mt-0.5">v6.0.0 · 关于 &amp; 数据致谢</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal("none")}
                  className="absolute top-3 right-3 text-slate-500 hover:text-white hover:bg-slate-700/60 p-1.5 rounded-lg transition-all cursor-pointer z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 flex flex-col gap-4">

                {/* Data Sources */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">📦 数据来源</p>
                  <div className="flex flex-col gap-2">
                    <a
                      href="https://wiki.biligame.com/rocom/精灵图鉴/原始形态"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-900/50 px-3 py-2 rounded-lg transition-all group"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">wiki.biligame.com — 洛克王国:手游WIKI（精灵图鉴/原始形态）</span>
                    </a>
                    <a
                      href="https://roco.gptvip.chat/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-900/50 px-3 py-2 rounded-lg transition-all group"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span>roco.gptvip.chat — 精灵数据平台</span>
                    </a>
                  </div>
                </div>

                {/* Acknowledgements */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">🏅 特别鸣谢</p>
                  <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-xl px-4 py-3 flex flex-col gap-1.5">
                    <div className="flex items-start gap-2">
                      <Heart className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed">
                        精灵身高体重与精灵蛋数据由
                        <strong className="text-amber-700 dark:text-amber-400"> 孟德尔实验室群</strong>
                        的 <strong className="text-amber-700 dark:text-amber-400">cinene</strong> 精心整理，特别感谢！
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-5">感谢孟德尔实验室为洛克王国社区提供的优质数据资源。</p>
                  </div>
                </div>

                {/* Author & Contact */}
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">👤 作者 &amp; 联系方式</p>
                  <div className="flex flex-col gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-600">Presented by 派</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">QQ: 1095524934</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400">交流群：</span>
                      <span className="font-mono font-bold text-indigo-600">474567570</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="px-6 pb-5">
                <button
                  onClick={() => setActiveModal("none")}
                  className="w-full py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  知道了
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 自定义二次确认弹窗 */}
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* 背景遮罩 */}
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-200" 
            onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
          ></div>
          
          {/* 弹窗主体 */}
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-150 z-[101]">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2">{confirmConfig.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed whitespace-pre-wrap">{confirmConfig.message}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg cursor-pointer transition-colors border border-transparent"
              >
                取消
              </button>
              <button
                onClick={confirmConfig.onConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm border border-transparent"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 洛克世界盒子导入弹窗 */}
      <RocoImportModal
        isOpen={showRocoImportModal}
        onClose={() => setShowRocoImportModal(false)}
        existingParents={parents}
        onImport={(newParents) => {
          setParents(prev => [...prev, ...newParents]);
          setShowRocoImportModal(false);
          showToast(`成功导入 ${newParents.length} 只精灵到父母本仓储！`, "success");
        }}
      />
    </div>
    </div>
  );
}
