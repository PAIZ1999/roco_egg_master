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
  Ruler,
  Weight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Calendar
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
import petEggConf from "../images/蛋数据/PET_EGG_CONF.json";
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
import { Autocomplete } from "./components/Autocomplete";
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
  getPetSizeThresholds
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
  const [exportType, setExportType] = useState<"single" | "all">("single");
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
  // 配对中心筛选状态
  const [pairingFilterName, setPairingFilterName] = useState("");
  const [pairingFilterGroup, setPairingFilterGroup] = useState("");
  const [pairingFilterBrand, setPairingFilterBrand] = useState("");
  const [pairingFilter3V, setPairingFilter3V] = useState(""); // "" | "3V" | "非3V"

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

  // Sync to localStorage and local file with visible auto-save status feedback
  useEffect(() => {
    if (!isLoaded || !activeAccountId) return;

    // 1. 账号切换拦截：如果 activeAccountId 改变，说明正在切换账号。
    // 这时我们仅同步 ref 值并退出，不做保存，避免将旧账号的数据覆写到新账号上！
    if (lastActiveAccountIdRef.current !== activeAccountId) {
      lastActiveAccountIdRef.current = activeAccountId;
      return;
    }

    // 2. 强校验：如果当前 activeAccountId 在 accounts 列表中已不存在，说明该账号已经被删除，绝对不保存！
    if (!accounts.some(a => a.id === activeAccountId)) {
      return;
    }

    setIsSaving(true);
    
    const mergedDataMap = {
      ...accountDataMap,
      [activeAccountId]: { pets, trades, parents, eggs }
    };

    localStorage.setItem("roco_accounts_v1", JSON.stringify(accounts));
    localStorage.setItem("roco_active_account_id_v1", activeAccountId);
    localStorage.setItem("roco_account_data_map_v1", JSON.stringify(mergedDataMap));
    
    // 同时也保留单账号缓存以备不时之需（兼容老代码可能的加载）
    localStorage.setItem("roco_egg_data_v2", JSON.stringify(pets));
    localStorage.setItem("roco_egg_trades_v1", JSON.stringify(trades));
    localStorage.setItem("roco_egg_parents_v1", JSON.stringify(parents));
    localStorage.setItem("roco_egg_eggs_v1", JSON.stringify(eggs));

    localStorage.setItem("roco_watermark_panel_open", String(showWatermarkPanel));
    localStorage.setItem("roco_watermark_enabled", String(enableWatermark));
    localStorage.setItem("roco_watermark_text", watermarkText);
    localStorage.setItem("roco_watermark_opacity", String(watermarkOpacity));
    localStorage.setItem("roco_watermark_density", watermarkDensity);
    localStorage.setItem("roco_watermark_size", String(watermarkSize));

    if (window.electronAPI) {
      const saveDataAsync = async () => {
        try {
          const res = await window.electronAPI.saveData({
            accounts,
            activeAccountId,
            accountDataMap: mergedDataMap,
            settings: {
              showWatermarkPanel,
              enableWatermark,
              watermarkText,
              watermarkOpacity,
              watermarkDensity,
              watermarkSize
            }
          });
          if (res && res.success) {
            setLocalSavePath(res.path);
          }
        } catch (e) {
          console.error("自动保存到本地文件失败:", e);
        }
      };
      saveDataAsync();
    }

    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    setLastSaved(timeStr);

    const timer = setTimeout(() => {
      setIsSaving(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [
    pets, trades, parents, eggs, 
    accounts, activeAccountId, accountDataMap,
    showWatermarkPanel, enableWatermark, watermarkText, watermarkOpacity, watermarkDensity, watermarkSize, 
    isLoaded
  ]);

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
    setEggs(prev => prev.filter(e => e.id !== id));
    showToast("精灵蛋删除成功！", "success");
  }, []);

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
      produceTime: localISODate
    };

    // 4. 新增到精灵蛋管理中心
    setEggs(prev => [newEgg, ...prev]);

    // 5. 扣减当前蛋窝现蛋数量或切换状态
    const currentCount = parseInt(nest.eggCount || "1", 10);
    if (currentCount > 1) {
      // 扣减 1
      setPets(prev => prev.map(p => p.id === nest.id ? { ...p, eggCount: (currentCount - 1).toString() } : p));
      showToast(`产蛋成功！精灵蛋[${lowestName}]已录入蛋管理中心，窝点数量减1`, "success");
    } else {
      // 数量归 0，且状态设为已撤窝
      setPets(prev => prev.map(p => p.id === nest.id ? { ...p, eggCount: "0", status: "已撤窝" } : p));
      showToast(`产蛋成功！精灵蛋[${lowestName}]已录入，该蛋窝现蛋已产完，状态切换为“已撤窝”`, "success");
    }
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

    for (const father of checkedFathers) {
      for (const mother of checkedMothers) {
        const matchingGroups = father.groups.filter(g => mother.groups.includes(g));
        if (matchingGroups.length === 0) continue;

        let brand = "";
        const isFatherCoarse = father.brand === "大粗" || father.brand === "单粗嗓门";
        const isMotherCoarse = mother.brand === "大粗" || mother.brand === "单粗嗓门";
        const isFatherSoft = father.brand === "大婉" || father.brand === "单婉转声";
        const isMotherSoft = mother.brand === "大婉" || mother.brand === "单婉转声";

        if (isFatherCoarse && isMotherCoarse) {
          // 粗嗓门组：大粗/单粗嗓门
          // 如果双方都是大粗且未判定为接近临界值，子代是大粗
          if (father.brand === "大粗" && mother.brand === "大粗" && !isNearGiantLimit(father) && !isNearGiantLimit(mother)) {
            brand = "大粗";
          } else {
            // 一方为单粗嗓门，或者有任意一方接近临界值。有接近临界值则生出概率大粗，否则是单粗嗓门
            if (isNearGiantLimit(father) || isNearGiantLimit(mother)) {
              brand = "概率大粗";
            } else {
              brand = "单粗嗓门";
            }
          }
        } else if (isFatherSoft && isMotherSoft) {
          // 婉转声组：大婉/单婉转声
          // 如果双方都是大婉且未判定为接近临界值，子代是大婉
          if (father.brand === "大婉" && mother.brand === "大婉" && !isNearGiantLimit(father) && !isNearGiantLimit(mother)) {
            brand = "大婉";
          } else {
            // 一方为单婉转声，或者有任意一方接近临界值。有接近临界值则生出概率大婉，否则是单婉转声
            if (isNearGiantLimit(father) || isNearGiantLimit(mother)) {
              brand = "概率大婉";
            } else {
              brand = "单婉转声";
            }
          }
        } else if (
          (father.brand === "普通" && isNearGiantLimit(father) && mother.brand === "单大块头") ||
          (mother.brand === "普通" && isNearGiantLimit(mother) && father.brand === "单大块头")
        ) {
          // 父母有一方是接近大块头临界值的普通精灵，另一方是单大块头 -> 概率大块头
          brand = "概率大块头";
        } else if (
          father.brand === "普通" && isNearGiantLimit(father) &&
          mother.brand === "普通" && isNearGiantLimit(mother)
        ) {
          // 父母双方都是接近大块头临界值的普通精灵 -> 概率大块头
          brand = "概率大块头";
        } else if (
          (father.brand === "普通" && (mother.brand === "单粗嗓门" || mother.brand === "单婉转声")) ||
          (mother.brand === "普通" && (father.brand === "单粗嗓门" || father.brand === "单婉转声"))
        ) {
          // 普通 + 单声音 = 普通
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
        brand: pair.brand === "概率大块头" ? "普通" : pair.brand,
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
    const prefix = exportType === "all" ? "全部账号备份" : `单账号备份_${accounts.find(a => a.id === activeAccountId)?.nickname || "默认"}`;
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
    wrapper.style.backgroundColor = "#f8fafc";

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

    try {
      // Use html2canvas to render the offscreen clone with fixed scaling and size parameters
      const canvas = await html2canvas(clone, {
        backgroundColor: "#f8fafc",
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
    return matchSprite && matchNature && matchGroup && matchBrand && matchStatus && matchLimit && match3V;
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
  const paginatedEggs = filteredEggs.slice((eggCurrentPage - 1) * EGG_PAGE_SIZE, eggCurrentPage * EGG_PAGE_SIZE);

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

  return (
    <div className="bg-slate-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-900 selection:bg-indigo-500 selection:text-white">
      <div
        id="export-container"
        className="max-w-[1400px] mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
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
                  className="text-indigo-450 hover:text-indigo-350 cursor-pointer font-sans font-bold border-l border-slate-800 pl-1.5 shrink-0 transition-colors select-none"
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
                className="flex items-center gap-1 text-[10px] text-slate-450 hover:text-white bg-slate-800/60 hover:bg-slate-850 border border-slate-700/60 hover:border-slate-500/50 px-2 py-1 rounded-lg transition-all cursor-pointer"
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
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105"
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
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105"
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
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="sm:hidden">精灵蛋库</span>
              <span className="hidden sm:inline">蛋管理中心</span>
            </button>
          </div>

          {/* 账号快速切换下拉菜单 */}
          <div className="w-full sm:w-auto flex justify-center sm:justify-end relative">
            <div className="relative inline-block text-left select-none">
              <button
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="flex items-center gap-2 text-xs text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 hover:border-indigo-500/50 px-3 py-2 rounded-xl transition-all cursor-pointer font-medium shadow-sm hover:shadow shadow-indigo-950/20"
                title="点击切换账号或进行账号管理"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-450 shrink-0 animate-pulse"></span>
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
            <div className="p-5 bg-slate-50/30 border-b border-slate-100">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
            {/* Card 1: 总收录 */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-3 sm:p-4 flex flex-col justify-between min-h-[80px] sm:min-h-[96px] relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-slate-50 rounded-full group-hover:scale-110 transition-transform duration-300 pointer-events-none" />
              <div className="flex items-center justify-between z-10">
                <span className="text-[11px] sm:text-xs text-slate-500 font-bold">总收录精灵</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                  <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-450 shrink-0" />
                </div>
              </div>
              <div className="mt-2 sm:mt-2.5 z-10 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black font-mono text-slate-800 tracking-tight">{totalPets}</span>
                <span className="text-xs text-slate-400 font-semibold">只</span>
              </div>
            </div>

            {/* Card 2: 牌子规格 */}
            <div className="col-span-2 md:col-span-1 lg:col-span-1 order-last bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-3 sm:p-4 flex flex-col justify-between min-h-[80px] sm:min-h-[96px] relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-indigo-50/30 rounded-full group-hover:scale-110 transition-transform duration-300 pointer-events-none" />
              <div className="flex items-center justify-between z-10">
                <span className="text-[11px] sm:text-xs text-slate-500 font-bold">牌子规格统计</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-indigo-50/50 rounded-lg flex items-center justify-center border border-indigo-100/50">
                  <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 mt-2 sm:mt-2.5 z-10">
                {(["大婉", "大粗", "普通", "小婉", "小粗", "单大块头"] as const).map((brand, idx) => {
                  const colors = [
                    "bg-rose-50/60 text-rose-700 border-rose-100/60",
                    "bg-amber-50/60 text-amber-700 border-amber-100/60",
                    "bg-emerald-50/60 text-emerald-700 border-emerald-100/60",
                    "bg-blue-50/60 text-blue-700 border-blue-100/60",
                    "bg-purple-50/60 text-purple-700 border-purple-100/60",
                    "bg-slate-50/60 text-slate-700 border-slate-100/60"
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
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-3 sm:p-4 flex flex-col justify-between min-h-[80px] sm:min-h-[96px] relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform duration-300 pointer-events-none" />
              <div className="flex items-center justify-between z-10">
                <span className="text-[11px] sm:text-xs text-slate-500 font-bold">现有现蛋窝点</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100">
                  <Egg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
                </div>
              </div>
              <div className="mt-2 sm:mt-2.5 z-10 flex items-baseline gap-1 flex-wrap">
                <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 tracking-tight">{hasEggsCount}</span>
                <span className="text-[10px] sm:text-xs text-emerald-500 font-semibold">窝({totalEggsCount}蛋)</span>
              </div>
            </div>

            {/* Card 4: 极限蛋 */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-3 sm:p-4 flex flex-col justify-between min-h-[80px] sm:min-h-[96px] relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-50 rounded-full group-hover:scale-110 transition-transform duration-300 pointer-events-none" />
              <div className="flex items-center justify-between z-10">
                <span className="text-[11px] sm:text-xs text-slate-500 font-bold">极限精灵蛋</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100">
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
                </div>
              </div>
              <div className="mt-2 sm:mt-2.5 z-10 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black font-mono text-amber-500 tracking-tight">{limitsCount}</span>
                <span className="text-xs text-amber-500 font-semibold">只</span>
              </div>
            </div>

            {/* Card 5: 3V蛋 */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-3 sm:p-4 flex flex-col justify-between min-h-[80px] sm:min-h-[96px] relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-rose-50 rounded-full group-hover:scale-110 transition-transform duration-300 pointer-events-none" />
              <div className="flex items-center justify-between z-10">
                <span className="text-[11px] sm:text-xs text-slate-500 font-bold">3V 精灵蛋</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-rose-50 rounded-lg flex items-center justify-center border border-rose-100">
                  <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 shrink-0" />
                </div>
              </div>
              <div className="mt-2 sm:mt-2.5 z-10 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black font-mono text-rose-600 tracking-tight">{threeVsCount}</span>
                <span className="text-xs text-rose-500 font-semibold">只</span>
              </div>
            </div>
          </div>
        </div>        {/* Filters Header Row */}
        <div id="filter-header-bar" className="p-4 bg-slate-50/20 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center w-full">
            {/* Search filter input and mobile toggle */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48 sm:flex-none">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索精灵名字..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium placeholder:text-slate-400"
                />
              </div>
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="sm:hidden px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 flex items-center gap-1 active:bg-indigo-100 transition-all shrink-0"
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
                className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium hover:bg-slate-50/50 transition-colors w-full sm:w-auto"
              >
                <option value="">全部性格</option>
                {NATURE_OPTIONS.map(nature => (
                  <option key={nature} value={nature}>{nature}</option>
                ))}
              </select>

              {/* Filter by egg group */}
              <select
                value={filterGroup}
                onChange={e => setFilterGroup(e.target.value)}
                className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium hover:bg-slate-50/50 transition-colors w-full sm:w-auto"
              >
                <option value="">全部蛋组</option>
                {EGG_GROUPS.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>

              {/* Filter by brand */}
              <select
                value={filterBrand}
                onChange={e => setFilterBrand(e.target.value)}
                className={`text-xs border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-250 cursor-pointer font-bold transition-all w-full sm:w-auto ${
                  filterBrand ? getBrandStyle(filterBrand) : 'text-slate-700 bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <option value="">全部牌子</option>
                {BRAND_OPTIONS.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>

              {/* Filter by status */}
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className={`text-xs border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-350 cursor-pointer font-bold transition-all w-full sm:w-auto ${
                  filterStatus ? getStatusStyle(filterStatus) : 'text-slate-700 bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <option value="" className="bg-white text-slate-800 font-semibold py-1">全部状态/窝点</option>
                {NEST_STATUS_OPTIONS.map(status => (
                  <option key={status} value={status} className="bg-white text-slate-850 font-semibold py-1">
                    {status}
                  </option>
                ))}
              </select>

              {/* Filter by limit */}
              <select
                value={filterLimit}
                onChange={e => setFilterLimit(e.target.value)}
                className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium hover:bg-slate-50/50 transition-colors w-full sm:w-auto"
              >
                <option value="">全部(有无极限蛋)</option>
                {LIMIT_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>

              {/* Watermark toggle */}
              <label
                id="header-watermark-btn"
                className={`sm:ml-auto text-xs font-bold py-1.5 px-3 rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-2 w-full sm:w-auto select-none ${
                  enableWatermark
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
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
        <div className="p-6 bg-slate-50/30 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100/50">
              <Egg className="w-5 h-5 text-indigo-600 animate-pulse" />
            </div>
            <div>
              <h2 id="nest-center-title" className="text-lg font-bold text-slate-800">我的精灵蛋窝中心</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">管理与培育您的极品精灵蛋与蛋窝状态</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200/40">
            当前有 {filteredPets.length} 个蛋窝
          </span>
        </div>

        {/* Main Editable Card Grid Container */}
        <div className="p-4 bg-slate-50/50">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredPets.map(p => p.id as string)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {filteredPets.map((pet) => (
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
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Bottom utility controls */}
        <div id="footer-actions" className="p-4 sm:p-5 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-between">
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
              className="py-2 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-all font-medium flex items-center justify-center gap-2 shadow-sm text-sm cursor-pointer"
              title="一键还原到默认精灵列表"
            >
              <RefreshCw className="w-4 h-4" />
              初始化列表
            </button>

            {/* Import JSON button */}
            <button
              onClick={handleImportClick}
              className="py-2 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-all font-medium flex items-center justify-center gap-2 shadow-sm text-sm cursor-pointer flex items-center gap-1.5"
              title="从备份文件或文本导入数据"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              导入数据
            </button>

            {/* Export JSON button */}
            <button
              onClick={handleExportClick}
              className="py-2 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-all font-medium flex items-center justify-center gap-2 shadow-sm text-sm cursor-pointer flex items-center gap-1.5"
              title="导出当前列表数据作为备份"
            >
              <Share2 className="w-4 h-4 text-slate-500" />
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
        <div className="border-t border-slate-100 bg-white">
          {/* 标题 */}
          <div className="p-6 bg-slate-50/30 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100/50">
                <RefreshCw className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 id="trade-center-title" className="text-lg font-bold text-slate-800">自建换蛋需求中心</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">发布并管理您需要的或者可以提供交换的宠物蛋信息</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200/40">
              共有 {trades.length} 条需求
            </span>
          </div>

          {/* 表单输入区域 */}
          <div id="trade-form-panel" className="p-6 bg-slate-50/10 border-b border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-x-5 gap-y-4 items-start">
            {/* 第一行：核心配置 */}
            {/* 精灵选择 */}
            <div className="md:col-span-5 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">精灵名称</label>
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
                    <div className="w-[38px] h-[38px] bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0 shadow-sm relative group/avatar overflow-hidden">
                      {spriteFileName ? (
                        <img
                          src={getImagePath(`images/sprites/${spriteFileName}`)}
                          alt={resolvedSprite}
                          className="w-8 h-8 object-contain transition-transform group-hover/avatar:scale-110"
                        />
                      ) : (
                        <Egg className="w-5 h-5 text-slate-300" />
                      )}
                      {finalDetails?.types && finalDetails.types.length > 0 && (
                        <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-white rounded-full flex items-center justify-center shadow-xs border border-slate-100 z-10">
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
                  inputClassName="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium h-[38px]"
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
                      className="px-2 py-1 text-xs border border-slate-200 rounded-lg text-slate-700 bg-white h-[38px] font-bold focus:outline-none focus:border-indigo-500 cursor-pointer shrink-0 max-w-[120px] transition-colors"
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
                    <span className="font-semibold text-slate-500">属性:</span>
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">{finalDetails.types?.join("/")}</span>
                    <span className="text-slate-200">|</span>
                    <span className="font-semibold text-slate-500">蛋组:</span>
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">{finalDetails.groups?.join("/")}</span>
                    {base !== finalBase && (
                      <>
                        <span className="text-slate-200">|</span>
                        <span className="text-slate-400 italic">进化链最高阶: {finalBase}</span>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* 性格需求 */}
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">性格需求</label>
              <Autocomplete
                value={newTradeNature}
                onChange={setNewTradeNature}
                options={NATURE_OPTIONS}
                placeholder="输入性格或拼音首字母..."
                className="w-full"
                inputClassName="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium h-[38px]"
              />
            </div>

            {/* 备注说明 */}
            <div className="md:col-span-5 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">备注说明</label>
              <input
                type="text"
                value={newTradeNotes}
                onChange={e => setNewTradeNotes(e.target.value)}
                placeholder="可写具体要求，例如：公母不限、用大婉换、多换一等..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-800 placeholder-slate-400 font-medium h-[38px]"
              />
            </div>

            {/* 第二行：规格与动作 */}
            {/* 牌子选择 */}
            <div className="md:col-span-7 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">牌子</label>
              <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-1.5">
                {BRAND_OPTIONS.map(brand => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => setNewTradeBrand(brand)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer h-[34px] flex items-center justify-center truncate ${getBrandStyle(brand)} ${newTradeBrand === brand
                        ? 'ring-2 ring-indigo-500 scale-105 border-transparent shadow-sm'
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
              <label className="text-xs font-bold text-slate-700">附加规格</label>
              <div className="flex items-center gap-4 h-[34px] pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer group select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={newTradeIs3V}
                      onChange={e => setNewTradeIs3V(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">3V</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer group select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={newTradeIsLimit}
                      onChange={e => setNewTradeIsLimit(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-500"></div>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">极限</span>
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
          <div className="p-3 sm:p-6 bg-slate-50/30">
            {trades.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-2xl py-12 px-4 flex flex-col items-center justify-center text-slate-400 text-center gap-2">
                <Egg className="w-10 h-10 text-slate-300 stroke-1" />
                <span className="text-xs font-semibold text-slate-500">暂无换蛋需求看板</span>
                <span className="text-[10px] text-slate-450">在上方填写需求表单并点击“加入换蛋卡片墙”即可生成</span>
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
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 relative overflow-hidden group/card"
                    >
                      {/* Delete Button at top-right */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTrade(trade.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all opacity-100 sm:opacity-0 group-hover/card:opacity-100 cursor-pointer action-buttons z-20"
                        title="删除该条换蛋需求"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* 左侧：头像 + 详情 */}
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        {/* 头像 */}
                        <div className="relative w-14 h-14 sm:w-20 sm:h-20 bg-slate-50 border border-slate-100/80 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 group/avatar overflow-hidden">
                          {spriteFileName ? (
                            <img
                              src={getImagePath(`images/sprites/${spriteFileName}`)}
                              alt={trade.sprite}
                              className="w-11 h-11 sm:w-16 sm:h-16 object-contain transition-transform duration-200 group-hover/avatar:scale-105"
                            />
                          ) : (
                            <Egg className="w-7 h-7 sm:w-10 sm:h-10 text-slate-300 transition-transform duration-200 avatar-fallback-icon" />
                          )}
                          {details?.types && details.types.length > 0 && (
                            <div className="absolute bottom-1 right-1 w-5.5 h-5.5 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-50 z-10">
                              <img
                                src={getImagePath(`images/attributes/${details.types[0]}.png`)}
                                alt={details.types[0]}
                                className="w-3.5 h-3.5 object-contain"
                              />
                            </div>
                          )}

                          {/* Form dropdown overlay for multi-form sprites */}
                          {availableSprites.length > 1 && (
                            <div className="absolute bottom-1 left-1 bg-white/90 backdrop-blur-xs px-1 py-0.5 rounded shadow-2xs z-10 border border-slate-200/80 flex items-center hover:bg-white transition-colors duration-150 action-buttons">
                              <select
                                value={availableSprites.includes(trade.sprite) ? trade.sprite : (spriteFileName ? spriteFileName.slice(0, -4) : trade.sprite)}
                                onChange={(e) => handleUpdateTradeSprite(trade.id, e.target.value)}
                                className="text-[8px] font-bold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer pr-1 py-0.25 leading-none appearance-none"
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
                              <span className="text-[6px] text-slate-450 pointer-events-none select-none ml-0.5 -mt-0.5">▼</span>
                            </div>
                          )}
                        </div>

                        {/* 需求详情 */}
                        <div className="flex-1 flex flex-col min-w-0 justify-between">
                          {/* 名字 */}
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-slate-800 truncate" title={trade.sprite}>
                              {trade.sprite}
                            </h4>
                          </div>

                          {/* 属性：性格/牌子 */}
                          <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-1.5 text-[11px] font-medium text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">性格:</span>
                              <span className="text-slate-700 font-semibold">{trade.nature || "不限"}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">牌子:</span>
                              <span className={`px-1.5 py-0.25 rounded text-[10px] border ${getBrandStyle(trade.brand)}`}>
                                {trade.brand}
                              </span>
                            </div>
                          </div>

                          {/* 蛋组 */}
                          <div className="flex items-center gap-1.5 my-1 text-[11px] font-medium text-slate-500">
                            <span className="text-slate-400">蛋组:</span>
                            <div className="flex gap-1 flex-wrap">
                              {details?.groups && details.groups.length > 0 ? (
                                details.groups.map(group => (
                                  <span key={group} className={`px-1 py-0.25 rounded text-[9px] border font-bold ${getEggGroupStyle(group)}`}>
                                    {group}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-slate-400">无</span>
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
                              <span className="text-[9px] font-semibold text-slate-400">
                                常规配置
                              </span>
                            )}
                          </div>

                          {/* 备注 */}
                          {trade.notes ? (
                            <p className="text-[10px] text-slate-400 italic mt-2 border-t border-slate-50 pt-1.5 line-clamp-2" title={trade.notes}>
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
      <div className="bg-slate-50/50 p-4 sm:p-6 flex flex-col gap-6">
        {/* Statistics section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm p-3 sm:p-4 flex flex-col justify-between min-h-[80px] sm:min-h-[96px] relative overflow-hidden group select-none">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-slate-50 rounded-full pointer-events-none" />
            <div className="flex items-center justify-between z-10">
              <span className="text-[11px] sm:text-xs text-slate-500 font-bold">总录入精灵蛋</span>
              <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                <Database className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
            <div className="mt-2 sm:mt-2.5 z-10 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-slate-800 tracking-tight">{eggs.length}</span>
              <span className="text-xs text-slate-400 font-semibold">个</span>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm p-3 sm:p-4 flex flex-col justify-between min-h-[80px] sm:min-h-[96px] relative overflow-hidden group select-none">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-rose-50/30 rounded-full pointer-events-none" />
            <div className="flex items-center justify-between z-10">
              <span className="text-[11px] sm:text-xs text-slate-500 font-bold">极限精灵蛋</span>
              <div className="w-6 h-6 bg-rose-50 rounded-lg flex items-center justify-center border border-rose-100">
                <Award className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              </div>
            </div>
            <div className="mt-2 sm:mt-2.5 z-10 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-rose-600 tracking-tight">
                {eggs.filter(e => {
                  const type = getEggStatusType(e);
                  return type === "极限大" || type === "极限小";
                }).length}
              </span>
              <span className="text-xs text-rose-500 font-semibold">个</span>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm p-3 sm:p-4 flex flex-col justify-between min-h-[80px] sm:min-h-[96px] relative overflow-hidden group select-none">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-50/30 rounded-full pointer-events-none" />
            <div className="flex items-center justify-between z-10">
              <span className="text-[11px] sm:text-xs text-slate-500 font-bold">临界/达标蛋</span>
              <div className="w-6 h-6 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
              </div>
            </div>
            <div className="mt-2 sm:mt-2.5 z-10 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-600 tracking-tight">
                {eggs.filter(e => {
                  const type = getEggStatusType(e);
                  return type !== "普通" && type !== "极限大" && type !== "极限小";
                }).length}
              </span>
              <span className="text-xs text-amber-500 font-semibold">个</span>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm p-3 sm:p-4 flex flex-col justify-between min-h-[80px] sm:min-h-[96px] relative overflow-hidden group select-none">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-teal-50/30 rounded-full pointer-events-none" />
            <div className="flex items-center justify-between z-10">
              <span className="text-[11px] sm:text-xs text-slate-500 font-bold">3V性格合格蛋</span>
              <div className="w-6 h-6 bg-teal-50 rounded-lg flex items-center justify-center border border-teal-100">
                <Dna className="w-3.5 h-3.5 text-teal-600" />
              </div>
            </div>
            <div className="mt-2 sm:mt-2.5 z-10 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-teal-600 tracking-tight">
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
              <span className="text-xs text-teal-500 font-semibold">个</span>
            </div>
          </div>
        </div>

        {/* Filters and Header inside center */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100/50">
                <Egg className="w-5 h-5 text-indigo-600 animate-pulse" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-slate-800">精灵蛋管理中心</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  记录与管理极品精灵蛋的三围性格、牌子，自动判定大块头/小不点达标与极限
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 ml-auto shrink-0">
              <button
                onClick={() => handleReset("eggs")}
                className="px-3 py-2 text-xs sm:text-sm font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm font-sans"
                title="清空当前所有精灵蛋记录"
              >
                <RefreshCw className="w-4 h-4" />
                重置列表
              </button>
              <button
                onClick={handleAddEggClick}
                className="px-4 py-2 text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-600/20 font-sans"
              >
                <Plus className="w-4 h-4" />
                登记精灵蛋
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Filters row */}
          <div className="flex gap-3 items-center overflow-x-auto no-scrollbar whitespace-nowrap">
            <div className="relative flex-1 sm:w-60 sm:flex-none shrink-0">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="模糊搜索精灵名称..."
                value={eggSearchTerm}
                onChange={e => setEggSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium placeholder:text-slate-400"
              />
            </div>

            <select
              value={eggFilterGroup}
              onChange={e => setEggFilterGroup(e.target.value)}
              className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium hover:bg-slate-50/50 transition-colors w-full sm:w-auto shrink-0 whitespace-nowrap"
            >
              <option value="">全部蛋组</option>
              {EGG_GROUPS.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>

            <select
              value={eggFilterBrand}
              onChange={e => setEggFilterBrand(e.target.value)}
              className={`text-xs border rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer font-bold transition-all w-full sm:w-auto shrink-0 whitespace-nowrap ${
                eggFilterBrand ? getBrandStyle(eggFilterBrand) : 'text-slate-700 bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <option value="">全部牌子</option>
              {BRAND_OPTIONS.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>

            <select
              value={eggFilterLimit}
              onChange={e => setEggFilterLimit(e.target.value)}
              className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium hover:bg-slate-50/50 transition-colors w-full sm:w-auto shrink-0 whitespace-nowrap"
            >
              <option value="">全部(极限/临界/达标)</option>
              <option value="极限">仅看极限 (大/小)</option>
              <option value="达标">仅看达标 (大块头/小不点)</option>
              <option value="临界">仅看临界值 (10%以内)</option>
              <option value="普通">仅看普通/未合格</option>
            </select>

            <select
              value={eggFilter3V}
              onChange={e => setEggFilter3V(e.target.value)}
              className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium hover:bg-slate-50/50 transition-colors w-full sm:w-auto shrink-0 whitespace-nowrap"
            >
              <option value="">全部(是否3V)</option>
              <option value="是">是 3V</option>
              <option value="否">否 3V</option>
            </select>
          </div>
        </div>

        {/* Eggs list grid */}
        {filteredEggs.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200 p-6 shadow-sm select-none">
            <Egg className="w-12 h-12 text-slate-350 stroke-1 mb-2 animate-bounce" />
            <span className="text-sm font-bold text-slate-400">🥚 暂无符合条件的精灵蛋记录</span>
            <span className="text-xs text-slate-350 mt-1">点击右上角“登记精灵蛋”录入首只蛋</span>
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
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-1 py-3 border-t border-slate-100">
              <div className="text-xs text-slate-500 font-medium select-none text-left">
                共 <span className="font-bold font-mono text-slate-700">{filteredEggs.length}</span> 个精灵蛋，
                当前展示第 <span className="font-bold font-mono text-indigo-600">{(eggCurrentPage - 1) * EGG_PAGE_SIZE + 1}-{Math.min(eggCurrentPage * EGG_PAGE_SIZE, filteredEggs.length)}</span> 个
              </div>
              
              {totalEggPages > 1 && (
                <div className="flex items-center gap-1.5 select-none">
                  <button
                    onClick={() => setEggCurrentPage(1)}
                    disabled={eggCurrentPage === 1}
                    className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-slate-200 transition-all cursor-pointer disabled:cursor-not-allowed text-xs font-semibold"
                    title="第一页"
                  >
                    首页
                  </button>
                  <button
                    onClick={() => setEggCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={eggCurrentPage === 1}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-slate-200 transition-all cursor-pointer disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1"
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
                              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
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
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-slate-200 transition-all cursor-pointer disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1"
                  >
                    下一页
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEggCurrentPage(totalEggPages)}
                    disabled={eggCurrentPage === totalEggPages}
                    className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-slate-200 transition-all cursor-pointer disabled:cursor-not-allowed text-xs font-semibold"
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
      <div className="bg-slate-50/50 p-4 sm:p-6 flex flex-col gap-6">
        {/* 父母本头部 */}
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100/50">
              <Users className="w-5 h-5 text-indigo-600 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">父母本管理中心</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                登记您仓库中的父母本精灵，设置独立的身高体重、性格三围，计算跨蛋组繁育路径
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 ml-auto shrink-0">
            <div className="flex gap-2 text-xs font-semibold text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200/40 select-none">
              <span>父本 (♂): {visibleFathers.length}/{parents.filter(p => p.gender === "♂").length} 只</span>
              <span className="text-slate-300">|</span>
              <span>母本 (♀): {visibleMothers.length}/{parents.filter(p => p.gender === "♀").length} 只</span>
            </div>
            <button
              onClick={() => handleReset("parents")}
              className="px-3 py-2 text-xs sm:text-sm font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm font-sans"
              title="清空当前所有父母本登记数据"
            >
              <RefreshCw className="w-4 h-4" />
              重置列表
            </button>
          </div>
        </div>



        {/* 左右分栏 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* 左侧父本栏 */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-2.5 sm:p-3.5 bg-slate-900/95 text-white rounded-xl shadow-md select-none whitespace-nowrap overflow-hidden">
              <div className="flex items-center gap-1 sm:gap-2 shrink-0 whitespace-nowrap">
                <span className="text-xs sm:text-sm font-bold tracking-wide shrink-0 whitespace-nowrap">♂️ 父本仓储库</span>
                <span className="text-[9px] sm:text-[10px] bg-sky-500/20 text-sky-305 border border-sky-500/30 px-1 py-0.1 sm:px-1.5 sm:py-0.2 rounded font-mono shrink-0 whitespace-nowrap">FATHER</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 shrink-0 whitespace-nowrap">
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
            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm flex gap-2 items-center overflow-x-auto no-scrollbar whitespace-nowrap">
              <div className="relative flex-1 min-w-[120px] flex items-center shrink-0">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400 z-10 pointer-events-none" />
                <Autocomplete
                  value={fatherSearchTerm}
                  onChange={val => setFatherSearchTerm(val)}
                  options={ALL_PET_NAMES}
                  placeholder="搜索精灵名..."
                  className="w-full"
                  inputClassName="w-full pl-8 pr-2 py-1 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all font-medium placeholder:text-slate-400 h-7"
                />
              </div>
              <div className="relative flex-1 min-w-[120px] flex items-center shrink-0">
                <Filter className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400 z-10 pointer-events-none" />
                <Autocomplete
                  value={fatherNatureSearch}
                  onChange={val => setFatherNatureSearch(val)}
                  options={NATURE_OPTIONS}
                  placeholder="搜索性格..."
                  className="w-full"
                  inputClassName="w-full pl-8 pr-2 py-1 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all font-medium placeholder:text-slate-400 h-7"
                />
              </div>
              <select
                value={fatherFilterGroup}
                onChange={e => setFatherFilterGroup(e.target.value)}
                className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:bg-white focus:border-indigo-500 cursor-pointer font-medium hover:bg-slate-100 transition-colors h-7 w-auto shrink-0 whitespace-nowrap"
              >
                <option value="">全部蛋组</option>
                {EGG_GROUPS.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
              <select
                value={fatherFilterBrand}
                onChange={e => setFatherFilterBrand(e.target.value)}
                className={`text-xs border rounded-lg px-2 py-0.5 focus:outline-none cursor-pointer font-bold transition-all h-7 w-auto shrink-0 whitespace-nowrap ${
                  fatherFilterBrand ? getBrandStyle(fatherFilterBrand) : 'text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <option value="">全部牌子</option>
                {BRAND_OPTIONS.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
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
                  className="text-[11px] text-indigo-600 hover:text-indigo-500 font-bold transition-colors cursor-pointer p-1 hover:bg-indigo-50 rounded shrink-0 whitespace-nowrap"
                >
                  重置
                </button>
              )}
            </div>

            <div className="max-h-[680px] overflow-y-auto pr-1.5 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                {visibleFathers.length === 0 ? (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200 p-6 shadow-sm">
                    <Users className="w-10 h-10 text-slate-300 stroke-1 mb-2 animate-bounce" />
                    <span className="text-xs font-bold text-slate-400">♂️ 暂无登记的父本精灵</span>
                    <span className="text-[10px] text-slate-350 mt-1">点击右上方“添加父本”录入</span>
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFatherDragEnd}>
                    <SortableContext items={visibleFathers.map(p => p.id)} strategy={verticalListSortingStrategy}>
                      {visibleFathers.map(parent => (
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
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>
          </div>

          {/* 右侧母本栏 */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-2.5 sm:p-3.5 bg-slate-900/95 text-white rounded-xl shadow-md select-none whitespace-nowrap overflow-hidden">
              <div className="flex items-center gap-1 sm:gap-2 shrink-0 whitespace-nowrap">
                <span className="text-xs sm:text-sm font-bold tracking-wide shrink-0 whitespace-nowrap">♀️ 母本仓储库</span>
                <span className="text-[9px] sm:text-[10px] bg-pink-500/20 text-pink-305 border border-pink-500/30 px-1 py-0.1 sm:px-1.5 sm:py-0.2 rounded font-mono shrink-0 whitespace-nowrap">MOTHER</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 shrink-0 whitespace-nowrap">
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
            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm flex gap-2 items-center overflow-x-auto no-scrollbar whitespace-nowrap">
              <div className="relative flex-1 min-w-[120px] flex items-center shrink-0">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400 z-10 pointer-events-none" />
                <Autocomplete
                  value={motherSearchTerm}
                  onChange={val => setMotherSearchTerm(val)}
                  options={ALL_PET_NAMES}
                  placeholder="搜索精灵名..."
                  className="w-full"
                  inputClassName="w-full pl-8 pr-2 py-1 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-pink-500 focus:ring-1 focus:ring-pink-100 transition-all font-medium placeholder:text-slate-400 h-7"
                />
              </div>
              <div className="relative flex-1 min-w-[120px] flex items-center shrink-0">
                <Filter className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400 z-10 pointer-events-none" />
                <Autocomplete
                  value={motherNatureSearch}
                  onChange={val => setMotherNatureSearch(val)}
                  options={NATURE_OPTIONS}
                  placeholder="搜索性格..."
                  className="w-full"
                  inputClassName="w-full pl-8 pr-2 py-1 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-pink-500 focus:ring-1 focus:ring-pink-100 transition-all font-medium placeholder:text-slate-400 h-7"
                />
              </div>
              <select
                value={motherFilterGroup}
                onChange={e => setMotherFilterGroup(e.target.value)}
                className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:bg-white focus:border-pink-500 cursor-pointer font-medium hover:bg-slate-100 transition-colors h-7 w-auto shrink-0 whitespace-nowrap"
              >
                <option value="">全部蛋组</option>
                {EGG_GROUPS.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
              <select
                value={motherFilterBrand}
                onChange={e => setMotherFilterBrand(e.target.value)}
                className={`text-xs border rounded-lg px-2 py-0.5 focus:outline-none cursor-pointer font-bold transition-all h-7 w-auto shrink-0 whitespace-nowrap ${
                  motherFilterBrand ? getBrandStyle(motherFilterBrand) : 'text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <option value="">全部牌子</option>
                {BRAND_OPTIONS.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
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
                  className="text-[11px] text-pink-600 hover:text-pink-500 font-bold transition-colors cursor-pointer p-1 hover:bg-pink-50 rounded shrink-0 whitespace-nowrap"
                >
                  重置
                </button>
              )}
            </div>

            <div className="max-h-[680px] overflow-y-auto pr-1.5 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                {visibleMothers.length === 0 ? (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200 p-6 shadow-sm">
                    <Users className="w-10 h-10 text-slate-300 stroke-1 mb-2 animate-bounce" />
                    <span className="text-xs font-bold text-slate-400">♀️ 暂无登记的母本精灵</span>
                    <span className="text-[10px] text-slate-350 mt-1">点击右上方“添加母本”录入</span>
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMotherDragEnd}>
                    <SortableContext items={visibleMothers.map(p => p.id)} strategy={verticalListSortingStrategy}>
                      {visibleMothers.map(parent => (
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
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 智能配对与导入中心 */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-4">
          <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-500/20 rounded-lg border border-indigo-400/30">
                <Dna className="w-4.5 h-4.5 text-indigo-300 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-wide">🧬 智能繁育配对与一键导入中心</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  同蛋组且同牌子的勾选宠物可进行繁育，子代精灵品种及形态随母本，三围相同自动判定3V
                </p>
              </div>
            </div>
            {(() => {
              const pairings = getPairings();
              const selectedPairings = pairings.filter(pair => !excludedPairKeys.has(`${pair.father.id}-${pair.mother.id}`));
              return selectedPairings.length > 0 ? (
                <button
                  onClick={() => handleImportPairingsToNest(selectedPairings)}
                  className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-emerald-600/10 cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                  一键导入所选配对 ({selectedPairings.length} 组)
                </button>
              ) : null;
            })()}
          </div>

          <div className="p-5">
            {(() => {
              const allPairings = getPairings();
              if (allPairings.length === 0) {
                return (
                  <div className="py-12 flex flex-col items-center justify-center text-center select-none">
                    <Dna className="w-10 h-10 text-slate-300 stroke-1 mb-3" />
                    <p className="text-sm font-bold text-slate-400">暂无符合繁育条件的配对</p>
                    <p className="text-xs text-slate-400 mt-1.5 max-w-md">
                      请在上方勾选配组，且确保至少有一对父本和母本：(1) 精灵品种非空 (2) 属于同一个蛋组 (3) 牌子等级完全相同。
                    </p>
                  </div>
                );
              }

              // 计算所有蛋组选项（仅从当前配对结果中收集）
              const allPairGroups = Array.from(new Set(allPairings.flatMap(p => p.matchingGroups))).sort();
              const allPairBrands = Array.from(new Set(allPairings.map(p => p.brand))).sort();

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
                const v3Match = !pairingFilter3V ||
                  (pairingFilter3V === "3V" && isStatsMatch) ||
                  (pairingFilter3V === "非3V" && !isStatsMatch);
                return nameMatch && groupMatch && brandMatch && v3Match;
              });

              const hasFilter = pairingFilterName || pairingFilterGroup || pairingFilterBrand || pairingFilter3V;

              return (
                <>
                  {/* 筛选栏 */}
                  <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex gap-2 items-center overflow-x-auto no-scrollbar whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 shrink-0 whitespace-nowrap">
                      <Filter className="w-3.5 h-3.5" />
                      筛选配对
                    </div>
                    {/* 精灵名搜索 */}
                    <div className="relative flex-1 min-w-[130px] max-w-[200px] flex items-center shrink-0">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10 pointer-events-none" />
                      <Autocomplete
                        value={pairingFilterName}
                        onChange={val => setPairingFilterName(val)}
                        options={ALL_PET_NAMES}
                        placeholder="搜索精灵名..."
                        className="w-full"
                        inputClassName="w-full pl-8 pr-2 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all font-medium placeholder:text-slate-400 h-8"
                      />
                    </div>
                    {/* 蛋组筛选 */}
                    <select
                      value={pairingFilterGroup}
                      onChange={e => setPairingFilterGroup(e.target.value)}
                      className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1.5 h-8 focus:outline-none focus:border-indigo-400 cursor-pointer font-medium hover:bg-slate-50 transition-colors w-auto shrink-0 whitespace-nowrap"
                    >
                      <option value="">全部蛋组</option>
                      {allPairGroups.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    {/* 牌子筛选 */}
                    <select
                      value={pairingFilterBrand}
                      onChange={e => setPairingFilterBrand(e.target.value)}
                      className={`text-xs border rounded-lg px-2 py-1.5 h-8 focus:outline-none cursor-pointer font-bold transition-all w-auto shrink-0 whitespace-nowrap ${
                        pairingFilterBrand ? getBrandStyle(pairingFilterBrand) : 'text-slate-700 bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <option value="">全部牌子</option>
                      {allPairBrands.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    {/* 3V筛选 */}
                    <select
                      value={pairingFilter3V}
                      onChange={e => setPairingFilter3V(e.target.value)}
                      className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1.5 h-8 focus:outline-none focus:border-indigo-400 cursor-pointer font-medium hover:bg-slate-50 transition-colors w-auto shrink-0 whitespace-nowrap"
                    >
                      <option value="">全部配对</option>
                      <option value="3V">仅3V配对</option>
                      <option value="非3V">仅非3V配对</option>
                    </select>
                    {/* 筛选结果计数 & 重置 */}
                    <div className="flex items-center gap-2 ml-auto shrink-0 whitespace-nowrap">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {hasFilter ? `筛选结果: ${filteredPairings.length} / ${allPairings.length} 组` : `共 ${allPairings.length} 组配对`}
                      </span>
                      {hasFilter && (
                        <button
                          onClick={() => {
                            setPairingFilterName("");
                            setPairingFilterGroup("");
                            setPairingFilterBrand("");
                            setPairingFilter3V("");
                          }}
                          className="text-[11px] text-indigo-600 hover:text-indigo-500 font-bold transition-colors cursor-pointer px-2 py-1 hover:bg-indigo-50 rounded-lg border border-indigo-100"
                        >
                          重置筛选
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 配对卡片列表 */}
                  {filteredPairings.length === 0 ? (
                    <div className="py-10 flex flex-col items-center justify-center text-center select-none">
                      <Search className="w-8 h-8 text-slate-300 stroke-1 mb-2" />
                      <p className="text-sm font-bold text-slate-400">没有符合筛选条件的配对</p>
                      <p className="text-xs text-slate-400 mt-1">请尝试调整或重置筛选条件</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                      {filteredPairings.map((pair, idx) => {
                        const fatherSpriteFile = getSpriteFileName(pair.father.sprite);
                        const motherSpriteFile = getSpriteFileName(pair.mother.sprite);
                        const isStatsMatch = pair.father.stats.length === pair.mother.stats.length &&
                          pair.father.stats.every((v, i) => v === pair.mother.stats[i] && v !== "无");

                        const pairKey = `${pair.father.id}-${pair.mother.id}`;
                        const isSelected = !excludedPairKeys.has(pairKey);

                        const thresholds = getPetSizeThresholds(pair.eggSprite);
                        const guideSize = getPetGuideSize(pair.eggSprite);

                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              setExcludedPairKeys(prev => {
                                const next = new Set(prev);
                                if (next.has(pairKey)) {
                                  next.delete(pairKey);
                                } else {
                                  next.add(pairKey);
                                }
                                return next;
                              });
                            }}
                            className={`rounded-2xl border p-3 sm:p-4 hover:shadow-lg transition-all flex flex-col gap-2.5 sm:gap-3.5 relative overflow-hidden group cursor-pointer ${
                              isSelected
                                ? "bg-white border-emerald-300 ring-1 ring-emerald-200 shadow-sm"
                                : "bg-slate-50/60 border-slate-200 opacity-60 hover:opacity-90"
                            }`}
                          >
                            {/* 选中角标 */}
                            <div className="absolute left-3 top-3 z-10 select-none pointer-events-none">
                              {isSelected ? (
                                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow border border-emerald-600/10">
                                  <Check className="w-4 h-4 text-white stroke-[3]" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 bg-white border-2 border-slate-300 rounded-full" />
                              )}
                            </div>

                            {/* 右上角装饰 */}
                            {isSelected && (
                              <div className="absolute right-0 top-0 w-16 h-16 bg-gradient-to-bl from-indigo-50/60 to-transparent rounded-bl-full pointer-events-none" />
                            )}

                            {/* 父母信息行 */}
                            <div className="flex items-center gap-2 sm:gap-3 mt-4">
                              {/* 父本 */}
                              <div className="flex items-center gap-1.5 sm:gap-2.5 flex-1 min-w-0">
                                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-sky-50/60 rounded-lg sm:rounded-xl border border-sky-100 flex items-center justify-center shrink-0 relative overflow-hidden shadow-sm">
                                  {fatherSpriteFile ? (
                                    <img
                                      src={getImagePath(`images/sprites/${fatherSpriteFile}`)}
                                      alt={pair.father.sprite}
                                      className="w-8 h-8 sm:w-11 sm:h-11 object-contain"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="text-slate-350 text-sm sm:text-lg">♂</div>
                                  )}
                                  <span className="absolute bottom-0 right-0 text-[8px] sm:text-[9px] bg-sky-500 text-white leading-none px-0.5 py-0.2 sm:px-1 sm:py-0.5 rounded-tl-md font-bold">♂</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs sm:text-sm font-extrabold text-slate-800 truncate" title={pair.father.sprite}>
                                    {pair.father.sprite}
                                  </div>
                                  <div className="text-[10px] sm:text-[11px] text-slate-500 truncate mt-0.5">
                                    {pair.father.nature || <span className="text-slate-350 italic">无性格</span>}
                                  </div>
                                  <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 mt-0.5">
                                    {pair.father.height ? `${pair.father.height}m` : "—"}/{pair.father.weight ? `${pair.father.weight}kg` : "—"}
                                  </div>
                                </div>
                              </div>

                              {/* 中间牌子 + 爱心 */}
                              <div className="flex flex-col items-center justify-center shrink-0 gap-0.5 sm:gap-1 select-none">
                                <span className={`text-[9.5px] sm:text-[11px] font-extrabold px-1.5 py-0.5 sm:px-2 rounded-lg border shadow-sm ${getBrandStyle(pair.brand)}`}>
                                  {pair.brand}
                                </span>
                                <div className="text-base text-rose-400 font-bold leading-none">❤</div>
                              </div>

                              {/* 母本 */}
                              <div className="flex items-center gap-1.5 sm:gap-2.5 flex-1 min-w-0 justify-end text-right">
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs sm:text-sm font-extrabold text-slate-800 truncate" title={pair.mother.sprite}>
                                    {pair.mother.sprite}
                                  </div>
                                  <div className="text-[10px] sm:text-[11px] text-slate-500 truncate mt-0.5">
                                    {pair.mother.nature || <span className="text-slate-350 italic">无性格</span>}
                                  </div>
                                  <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 mt-0.5">
                                    {pair.mother.height ? `${pair.mother.height}m` : "—"}/{pair.mother.weight ? `${pair.mother.weight}kg` : "—"}
                                  </div>
                                </div>
                                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-pink-50/60 rounded-lg sm:rounded-xl border border-pink-100 flex items-center justify-center shrink-0 relative overflow-hidden shadow-sm">
                                  {motherSpriteFile ? (
                                    <img
                                      src={getImagePath(`images/sprites/${motherSpriteFile}`)}
                                      alt={pair.mother.sprite}
                                      className="w-8 h-8 sm:w-11 sm:h-11 object-contain"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="text-slate-350 text-sm sm:text-lg">♀</div>
                                  )}
                                  <span className="absolute bottom-0 right-0 text-[8px] sm:text-[9px] bg-pink-500 text-white leading-none px-0.5 py-0.2 sm:px-1 sm:py-0.5 rounded-tl-md font-bold">♀</span>
                                </div>
                              </div>
                            </div>

                            {/* 子代规格参考 */}
                            {guideSize && (
                              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-2 font-medium select-none">
                                <div className="flex items-center gap-1.5 text-slate-600 font-bold border-b border-slate-200/60 pb-2 mb-2">
                                  <span className="text-slate-800">【{pair.eggSprite}】子代规格参考</span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                  <div className="flex items-center gap-1.5 text-slate-600">
                                    <Ruler className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>身高:</span>
                                    <span className="font-bold text-slate-800">{guideSize.height}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-slate-600">
                                    <Weight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>体重:</span>
                                    <span className="font-bold text-slate-800">{guideSize.weight}</span>
                                  </div>
                                </div>
                                {thresholds && (
                                  <div className="grid grid-cols-2 gap-x-4 pt-2 border-t border-slate-200/50 text-[11px] text-slate-500">
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span>大及格身高:</span>
                                        <span className="font-bold text-emerald-600">≥{thresholds.maxHeight.toFixed(2)}m</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span>大及格体重:</span>
                                        <span className="font-bold text-emerald-600">≥{thresholds.giantWeightLine.toFixed(4)}kg</span>
                                      </div>
                                    </div>
                                    <div className="space-y-1 border-l border-slate-200/60 pl-3">
                                      <div className="flex items-center justify-between">
                                        <span>小及格身高:</span>
                                        <span className="font-bold text-amber-600">≤{thresholds.minHeight.toFixed(2)}m</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span>小及格体重:</span>
                                        <span className="font-bold text-amber-600">≤{thresholds.tinyWeightLine.toFixed(4)}kg</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 底部产出信息 + 操作 */}
                            <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-xl border border-slate-200/80 px-2.5 py-2 sm:px-3 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-2">
                              <div className="flex items-center gap-1 sm:gap-2 shrink-0 whitespace-nowrap">
                                <span className="text-[10px] sm:text-xs font-bold text-slate-500 shrink-0">产出:</span>
                                <span className="text-xs sm:text-sm font-extrabold text-slate-800 shrink-0">{pair.eggSprite}蛋</span>
                              </div>
                              <div className="flex gap-1 sm:gap-2 items-center min-w-0">
                                <span className="bg-indigo-100 text-indigo-700 border border-indigo-200/80 px-1.5 py-0.5 sm:px-2 rounded-lg text-[10px] sm:text-[11px] font-bold select-none truncate shrink-0 max-w-[80px] xs:max-w-none" title={pair.matchingGroups.join("/")}>
                                  {pair.matchingGroups.join("/")}
                                </span>
                                <span className={`font-bold px-1.5 py-0.5 sm:px-2 rounded-lg border text-[10px] sm:text-[11px] select-none shrink-0 ${
                                  isStatsMatch
                                    ? "bg-rose-50 text-rose-600 border-rose-200"
                                    : "bg-slate-100 text-slate-500 border-slate-200"
                                }`}>
                                  {isStatsMatch ? "✨3V" : "非3V"}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleImportPairingsToNest([pair]);
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
              );
            })()}
          </div>
        </div>

        {/* Bottom Global Settings Bar */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-2.5 items-center justify-between mt-4 select-none">
          <div className="text-xs text-slate-400 font-medium">
            父母本中心的数据修改会自动保存至本地，也可以在下方进行全局备份操作
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleReset("parents")}
              className="py-1.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-all font-medium flex items-center justify-center gap-1.5 shadow-xs text-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              初始化列表
            </button>
            <button
              onClick={() => setActiveModal("import")}
              className="py-1.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-all font-medium flex items-center justify-center gap-1.5 shadow-xs text-xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              导入数据
            </button>
            <button
              onClick={() => setActiveModal("export")}
              className="py-1.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-all font-medium flex items-center justify-center gap-1.5 shadow-xs text-xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
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
                  <h3 className="text-sm font-bold text-slate-805">
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
                        <div className="w-10 h-10 rounded-lg border border-slate-205 bg-slate-50 flex items-center justify-center relative overflow-hidden shrink-0">
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
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3 text-amber-600">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <h3 className="text-lg font-bold text-left">
                  {resetTabTarget === "nest" && "确定要重置蛋窝与需求列表吗？"}
                  {resetTabTarget === "parents" && "确定要清空父母本仓库吗？"}
                  {resetTabTarget === "eggs" && "确定要清空精灵蛋管理中心吗？"}
                </h3>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed text-left">
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
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer mr-0 border border-transparent"
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
              className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-slate-100 flex flex-col gap-4 relative max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={() => {
                  setShowAccountModal(false);
                  setEditingAccountId(null);
                }}
                className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 text-slate-800 border-b border-slate-100 pb-3">
                <Settings className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-left">多账号中心与备份管理</h3>
                  <p className="text-xs text-slate-400 text-left">在此新建账号、切换数据分区、或进行单账号及全量导入导出备份</p>
                </div>
              </div>

              {/* 第一部分：新建账号 */}
              <div className="bg-slate-50/60 rounded-xl p-4 border border-slate-100 text-left">
                <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                  创建新账号 / 数据分区
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 text-left">账号昵称 (必填)</label>
                    <input
                      type="text"
                      placeholder="例如：主号 / 换蛋小号 / 派派"
                      value={newAccNickname}
                      onChange={e => setNewAccNickname(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 text-left">游戏 UID (选填)</label>
                    <input
                      type="text"
                      placeholder="洛克王国角色 ID"
                      value={newAccUid}
                      onChange={e => setNewAccUid(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all"
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
                <h4 className="text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                  账号列表 ({accounts.length})
                </h4>
                
                <div className="border border-slate-100 rounded-xl overflow-hidden flex-1 overflow-y-auto max-h-60 bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-450 uppercase">
                        <th className="px-4 py-2">账号昵称</th>
                        <th className="px-4 py-2">UID</th>
                        <th className="px-4 py-2 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs">
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
                                  <span className="text-slate-800 font-bold">{acc.nickname}</span>
                                  {isActive && (
                                    <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md">
                                      当前激活
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-slate-500">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingUid}
                                  onChange={e => setEditingUid(e.target.value)}
                                  className="border border-slate-200 rounded px-2 py-0.5 text-xs max-w-[100px] font-mono focus:outline-none focus:border-indigo-500"
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
                                      className="text-slate-400 hover:text-slate-600 px-1.5 py-0.5 cursor-pointer border border-transparent"
                                    >
                                      取消
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    {!isActive && (
                                      <button
                                        onClick={() => handleSwitchAccount(acc.id)}
                                        className="text-indigo-600 hover:text-indigo-700 font-bold px-1.5 py-0.5 cursor-pointer border border-transparent"
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
                                      className="text-slate-500 hover:text-slate-700 font-medium px-1.5 py-0.5 cursor-pointer border border-transparent"
                                    >
                                      编辑
                                    </button>
                                    <button
                                      onClick={() => handleExportSingleClick(acc.id)}
                                      className="text-slate-500 hover:text-emerald-600 font-medium px-1.5 py-0.5 cursor-pointer border border-transparent"
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
              <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-3 bg-slate-50/20 p-2.5 rounded-xl border">
                <div className="text-[10px] text-slate-400 text-left">
                  💡 <strong>提示：</strong> 支持导入单个账号备份，也支持全量多账号导出/导入，实现多端同步。
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowAccountModal(false);
                      handleExportAllClick();
                    }}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors border border-slate-200/50"
                  >
                    导出所有账号
                  </button>
                  <button
                    onClick={() => {
                      setShowAccountModal(false);
                      handleImportClick();
                    }}
                    className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg cursor-pointer transition-colors border border-indigo-100/30"
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
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col gap-4 text-left"
            >
              <div className="flex items-center gap-3 text-amber-600">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <h3 className="text-lg font-bold text-left">请确认数据导入方案</h3>
              </div>

              <p className="text-sm text-slate-550 leading-relaxed bg-amber-50/50 border border-amber-100/60 p-3 rounded-xl text-left">
                {importInfoText}
              </p>

              {/* 如果是单账号数据导入，我们需要让用户核对/配置作为新账号导入时的参数 */}
              {importConfirmType === "single" && (
                <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 text-xs space-y-2.5 text-left">
                  <span className="block font-bold text-slate-700">导入为新分区设置：</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-450 font-bold mb-0.5">导入新账号昵称</label>
                      <input
                        type="text"
                        value={importAsNewNickname}
                        onChange={e => setImportAsNewNickname(e.target.value)}
                        className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-450 font-bold mb-0.5">UID</label>
                      <input
                        type="text"
                        value={importAsNewUid}
                        onChange={e => setImportAsNewUid(e.target.value)}
                        className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 bg-white"
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
              className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col gap-4 relative"
            >
              <button
                onClick={() => setActiveModal("none")}
                className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 text-slate-800">
                <Upload className="w-5 h-5 text-indigo-500 shrink-0" />
                <h3 className="text-lg font-bold">导入孵蛋备份数据</h3>
              </div>

              <div className="flex flex-col gap-3">
                {/* File dragging trigger/input */}
                <label className="border border-dashed border-slate-300 hover:border-indigo-400 focus-within:border-indigo-500 rounded-xl p-5 flex flex-col items-center justify-center gap-1.5 bg-slate-50 hover:bg-indigo-50/20 cursor-pointer transition-all text-center">
                  <Upload className="w-8 h-8 text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-700">加载您的备份 .json 文件</span>
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
                  className="w-full h-32 border border-slate-200 rounded-xl p-3 text-xs font-mono bg-slate-50 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-300 resize-none"
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
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer border border-transparent mr-0"
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
              className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col gap-4 relative"
            >
              <button
                onClick={() => setActiveModal("none")}
                className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 text-slate-800">
                <Share2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <h3 className="text-lg font-bold">备份并导出孵蛋数据</h3>
              </div>

              <p className="text-sm text-slate-500 leading-relaxed">
                当前列表内所有的宠物、性格、蛋组以及窝点详情状态信息已成功打包。您可以将其保存到本地备份，也可以复制其文本在其它浏览器或账户上进行导入还原。
              </p>

              <div className="relative">
                <textarea
                  value={jsonText}
                  readOnly
                  className="w-full h-40 border border-slate-200 rounded-xl p-3 text-xs font-mono bg-slate-50 text-slate-700 resize-none select-all focus:outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="absolute bottom-3 right-3 py-1.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                  title="一键复制到剪贴板"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  复制内容
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 mt-2">
                <button
                  onClick={downloadJsonBackup}
                  className="px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  下载备份文件 (.json)
                </button>

                <button
                  onClick={() => setActiveModal("none")}
                  className="px-5 py-2 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer shadow-sm"
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
              className="bg-white rounded-2xl p-6 max-w-3xl w-full shadow-2xl border border-slate-100 flex flex-col gap-4 relative"
            >
              <button
                onClick={() => setActiveModal("none")}
                className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 text-slate-800">
                <Camera className="w-5 h-5 text-indigo-500 shrink-0" />
                <h3 className="text-lg font-bold">已为您生成超清长图</h3>
              </div>

              <p className="text-sm text-slate-500 leading-relaxed">
                长图包含了您当前的全部精灵匹配表格，已自动过滤操作按钮、排序控制等。您可以点击
                <strong className="text-indigo-600">「直接下载图片」</strong>
                或在下方长图上 <strong className="text-indigo-600">鼠标右键 / 长按选择「图片另存为」</strong> 进行保存。
              </p>

              {/* Image Preview Container */}
              <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50 h-[45vh] overflow-y-auto p-4 flex justify-center shadow-inner relative group">
                {exportedImageUrl ? (
                  <img
                    src={exportedImageUrl}
                    alt="洛克王国孵蛋数据导出"
                    className="shadow-md rounded border border-slate-200/60 h-auto max-w-full select-all object-contain bg-white"
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
                <span className="text-[11px] text-slate-400">
                  * 支持导出目前列表中经过搜索/筛选的完整精灵条目
                </span>
                <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
                  <button
                    onClick={() => setActiveModal("none")}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer border border-transparent mr-0"
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
              className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden"
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
                    <p className="text-slate-400 text-[11px] mt-0.5">v4.0.0 · 关于 &amp; 数据致谢</p>
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
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">📦 数据来源</p>
                  <div className="flex flex-col gap-2">
                    <a
                      href="https://wiki.biligame.com/rocom/精灵图鉴/原始形态"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-2 rounded-lg transition-all group"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">wiki.biligame.com — 洛克王国:手游WIKI（精灵图鉴/原始形态）</span>
                    </a>
                    <a
                      href="https://roco.gptvip.chat/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-2 rounded-lg transition-all group"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span>roco.gptvip.chat — 精灵数据平台</span>
                    </a>
                  </div>
                </div>

                {/* Acknowledgements */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">🏅 特别鸣谢</p>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex flex-col gap-1.5">
                    <div className="flex items-start gap-2">
                      <Heart className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-700 leading-relaxed">
                        精灵身高体重与精灵蛋数据由
                        <strong className="text-amber-700"> 孟德尔实验室群（群号：1101858898）</strong>
                        的 <strong className="text-amber-700">cinene</strong> 精心整理，特别感谢！
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-500 pl-5">感谢孟德尔实验室为洛克王国社区提供的优质数据资源。</p>
                  </div>
                </div>

                {/* Author & Contact */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">👤 作者 &amp; 联系方式</p>
                  <div className="flex flex-col gap-1.5 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-600">Presented by 派</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-mono text-slate-500">QQ: 1095524934</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">交流群：</span>
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
    </div>
    </div>
  );
}
