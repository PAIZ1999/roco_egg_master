import React, { useState, useEffect, useCallback } from "react";
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
  Trash2,
  Database,
  LayoutGrid,
  Zap,
  Award
} from "lucide-react";
import { domToPng } from "modern-screenshot";
import {
  EggPet,
  NATURE_OPTIONS,
  EGG_GROUPS,
  BRAND_OPTIONS,
  NEST_STATUS_OPTIONS,
  INITIAL_TABLE_DATA,
  LIMIT_OPTIONS,
  THREE_V_OPTIONS,
  EggTrade,
  TRADE_TYPE_OPTIONS,
  cleanNature
} from "./types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableCard } from "./components/SortableCard";
import { Autocomplete } from "./components/Autocomplete";
import { getPetDetails, ALL_PET_NAMES, getSpriteFileName, getImagePath, getBrandStyle, getEggGroupStyle, getStatusStyle, getAvailableSprites, getBasePetName, getSpriteFormDisplayName } from "./petHelper";


const migratePets = (rawList: any[]): EggPet[] => {
  return rawList.map((p, index) => {
    let fatherNatures = p.fatherNatures || p.natures || [NATURE_OPTIONS[0]];
    let motherNatures = p.motherNatures || [NATURE_OPTIONS[0]];
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
      status: p.status || NEST_STATUS_OPTIONS[0],
      isLimit: p.isLimit === "是" ? "极限" : (p.isLimit === "否" ? "非极限" : (p.isLimit || "非极限")),
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

export default function App() {
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

  // Egg trade form states
  const [newTradeSprite, setNewTradeSprite] = useState("");
  const [newTradeNature, setNewTradeNature] = useState("");
  const [newTradeBrand, setNewTradeBrand] = useState("单大块头");
  const [newTradeIs3V, setNewTradeIs3V] = useState(false);
  const [newTradeIsLimit, setNewTradeIsLimit] = useState(false);
  const [newTradeType, setNewTradeType] = useState("1换1");
  const [newTradeNotes, setNewTradeNotes] = useState("");

  // Configure dnd-kit sensors with distance activation constraint
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Avoids block-clicks; click works normally unless dragged 8px
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter conditions
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNature, setFilterNature] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterLimit, setFilterLimit] = useState("");
  const [filter3V, setFilter3V] = useState("");

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
            if (Array.isArray(loadedData.pets)) {
              setPets(migratePets(loadedData.pets));
            }
            if (Array.isArray(loadedData.trades)) {
              setTrades(migrateTrades(loadedData.trades));
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
        } finally {
          setIsLoaded(true);
        }
      } else {
        setIsLoaded(true);
      }
    };
    loadLocalData();
  }, []);

  // Sync to localStorage and local file with visible auto-save status feedback
  useEffect(() => {
    if (!isLoaded) return;

    setIsSaving(true);
    localStorage.setItem("roco_egg_data_v2", JSON.stringify(pets));
    localStorage.setItem("roco_egg_trades_v1", JSON.stringify(trades));
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
            pets,
            trades,
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
  }, [pets, trades, showWatermarkPanel, enableWatermark, watermarkText, watermarkOpacity, watermarkDensity, watermarkSize, isLoaded]);

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
  const limitsCount = pets.filter(p => p.isLimit === "极限" && p.status === "有现蛋").length;
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

  // Natures list update
  const handleAddNature = useCallback((id: string, parent: "father" | "mother") => {
    setPets(prev => prev.map(p => {
      if (p.id === id) {
        if (parent === "father") {
          return {
            ...p,
            fatherNatures: [...(p.fatherNatures || []), NATURE_OPTIONS[0]]
          };
        } else {
          return {
            ...p,
            motherNatures: [...(p.motherNatures || []), NATURE_OPTIONS[0]]
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
      fatherNatures: [NATURE_OPTIONS[0]],
      motherNatures: [NATURE_OPTIONS[0]],
      fatherStats: ["生命", "物攻", "速度"],
      motherStats: ["生命", "物攻", "速度"],
      groups: [EGG_GROUPS[0]],
      brand: BRAND_OPTIONS[0],
      status: NEST_STATUS_OPTIONS[0],
      isLimit: "非极限",
      is3V: "否",
      hideStats: false,
      eggCount: "1"
    };
    setPets([...pets, newPet]);
  };

  const handleDeletePet = useCallback((id: string) => {
    setPets(prev => prev.filter(p => p.id !== id));
  }, []);

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
      tradeType: newTradeType,
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

  const handleReset = () => {
    setActiveModal("reset");
  };

  const executeReset = () => {
    const resetList = migratePets(INITIAL_TABLE_DATA);
    setPets(resetList);
    setActiveModal("none");
    showToast("成功还原到初始默认精灵列表！", "success");
  };

  const handleImportClick = () => {
    setJsonText("");
    setImportError("");
    setActiveModal("import");
  };

  const executeImport = (pastedText: string) => {
    try {
      if (!pastedText.trim()) {
        setImportError("请粘贴或选择有效的 JSON 备份数据流");
        return;
      }
      const parsed = JSON.parse(pastedText);
      if (!Array.isArray(parsed)) {
        setImportError("内容错误：数据根节点必须是一个包含精灵数据的数组 [ ... ]");
        return;
      }

      const validatedList = migratePets(parsed);

      setPets(validatedList);
      setActiveModal("none");
      showToast(`成功导入 ${validatedList.length} 只精灵备份数据！`, "success");
    } catch (err: any) {
      setImportError(`导入失败：${err.message || "无效的 JSON 字段/语法格式"}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonText(text);
      setImportError("");
    };
    reader.readAsText(file);
  };

  const handleExportClick = () => {
    const backupData = JSON.stringify(pets, null, 2);
    setJsonText(backupData);
    setActiveModal("export");
  };

  const downloadJsonBackup = () => {
    const blob = new Blob([jsonText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toLocaleDateString("zh-CN").replace(/\//g, "-");
    link.href = url;
    link.download = `洛克王国孵蛋数据备份_${dateStr}.json`;
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

  const handleExportLongImage = async () => {
    showToast("正在生成高品质长图，请稍候...", "info");

    const dpr = window.devicePixelRatio || 1;
    const adjustPx = (valStr: string): string => {
      if (!valStr || dpr === 1) return valStr;
      if (valStr.trim().includes(" ")) {
        return valStr.trim().split(/\s+/).map(adjustPx).join(" ");
      }
      if (!valStr.endsWith("px")) return valStr;
      const val = parseFloat(valStr);
      if (isNaN(val)) return valStr;
      return `${val / dpr}px`;
    };

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
    // to bypass Chrome input-rendering bugs & avoid downward text-shifting inside foreignObject
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
        div.style.fontSize = adjustPx(computedStyle.fontSize);
        div.style.fontWeight = computedStyle.fontWeight;
        div.style.lineHeight = adjustPx(computedStyle.lineHeight);
        div.style.color = computedStyle.color;
        div.style.padding = adjustPx(computedStyle.padding);
        div.style.height = adjustPx(computedStyle.height);
        div.style.minHeight = adjustPx(computedStyle.minHeight);
        
        // Custom width: keep auto-width for w-full elements to adapt to 1200px container,
        // otherwise lock in the computed width to prevent collapse of fixed-width elements (like w-10)
        if (!originalEl.classList.contains("w-full")) {
          div.style.width = adjustPx(computedStyle.width);
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
        // Default alignment based on input's natural alignment or center
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
    // to rendering nicely inside the canvas/SVG vector, preventing baseline shifts
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
        div.style.fontSize = adjustPx(computedStyle.fontSize);
        div.style.fontWeight = computedStyle.fontWeight;
        div.style.lineHeight = adjustPx(computedStyle.lineHeight);
        div.style.color = computedStyle.color;
        
        // If it's a full-width select (status, brand, limit), clear excess padding to avoid wrapping.
        // For pill-badges (egg groups), keep computed padding.
        if (originalEl.classList.contains("w-full")) {
          div.style.paddingLeft = "4px";
          div.style.paddingRight = "4px";
        } else {
          div.style.padding = adjustPx(computedStyle.padding);
        }
        div.style.height = adjustPx(computedStyle.height);
        div.style.minHeight = adjustPx(computedStyle.minHeight);

        // Custom width: keep auto-width for w-full elements, otherwise lock in computed width
        if (!originalEl.classList.contains("w-full")) {
          div.style.width = adjustPx(computedStyle.width);
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
      // Calculate pattern tile bounds depending on density setting:
      // dense: 180x120, normal: 260x180, sparse: 360x260
      let wWidth = 260;
      let wHeight = 180;
      if (watermarkDensity === "dense") {
        wWidth = 180;
        wHeight = 120;
      } else if (watermarkDensity === "sparse") {
        wWidth = 360;
        wHeight = 260;
      }

      // Create inline SVG pattern tile
      const svgText = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${wWidth}" height="${wHeight}" opacity="${watermarkOpacity}">
          <text x="${wWidth / 2}" y="${wHeight / 2}" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="${watermarkSize}" font-weight="600" transform="rotate(-23 ${wWidth / 2} ${wHeight / 2})" text-anchor="middle">
            ${watermarkText}
          </text>
        </svg>
      `;
      const svgBase64 = "data:image/svg+xml;utf8," + encodeURIComponent(svgText);

      // Create full-screen pattern overlay div on top of cloned spreadsheet
      const watermarkDiv = document.createElement("div");
      watermarkDiv.style.position = "absolute";
      watermarkDiv.style.top = "0";
      watermarkDiv.style.left = "0";
      watermarkDiv.style.width = "100%";
      watermarkDiv.style.height = "100%";
      watermarkDiv.style.pointerEvents = "none";
      watermarkDiv.style.backgroundImage = `url("${svgBase64}")`;
      watermarkDiv.style.backgroundRepeat = "repeat";
      watermarkDiv.style.zIndex = "80"; // Cover table content elegantly

      clone.style.position = "relative";
      clone.appendChild(watermarkDiv);
    }

    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);
    document.body.classList.add("exporting");

    try {
      // Use modern-screenshot for oklch-compatible, hyper-sharp, vector rendering from offscreen DOM
      const dataUrl = await domToPng(clone, {
        backgroundColor: "#f8fafc",
        scale: 2, // Double resolution for crystal-sharp text and borders
        quality: 1
      });

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

  return (
    <div className="bg-slate-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-900 selection:bg-indigo-500 selection:text-white">
      <div
        id="export-container"
        className="max-w-[1400px] mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
      >
        {/* Banner Section */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          {/* Decorative background radial glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none" />

          <div className="flex items-center gap-6 z-10 w-full md:w-auto">
            {/* Logo box */}
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center bg-slate-800 rounded-2xl shadow-inner border border-slate-700/50">
              <Egg className="w-10 h-10 text-emerald-400 animate-pulse" />
              <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-indigo-400" />
            </div>

            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                洛克王国孵蛋数据管理系统
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-xl font-normal leading-relaxed">
                全属性宠物、蛋组和性格匹配中心。<br />支持本地持久化存储并附带实时蛋组信息与性格加减状态。
              </p>
            </div>
          </div>

          {/* Credits section */}
          <div className="flex flex-col text-right items-end gap-2 z-10 shrink-0 w-full md:w-auto border-t md:border-t-0 border-slate-800/80 pt-4 md:pt-0">
            {/* Auto-save Status Badge */}
            <div className="flex items-center gap-2 bg-slate-800/85 border border-slate-700/50 rounded-full px-3 py-1 shadow-inner select-none transition-all whitespace-nowrap">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSaving ? "bg-amber-400" : "bg-emerald-400"}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isSaving ? "bg-amber-500" : "bg-emerald-500"}`}></span>
              </span>
              <span className="text-[11px] font-semibold text-slate-300 font-sans tracking-wide whitespace-nowrap">
                {isSaving ? "正在实时保存..." : `数据已自动保存于：${lastSaved}`}
              </span>
            </div>
            {localSavePath && (
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono bg-slate-900/60 border border-slate-800/80 px-2 py-0.5 rounded max-w-[260px]">
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

            <span className="text-xs text-slate-400">
              Presented by <strong className="text-indigo-400 font-semibold font-display text-sm">派 (QQ: 1095524934)</strong>
            </span>
            <span className="text-[10px] text-slate-500 tracking-wider font-mono">
              © 2026 Roco Incubator Table
            </span>
          </div>
        </div>
        {/* Real-time stats section */}
        <div className="p-5 bg-slate-50/30 border-b border-slate-100">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Card 1: 总收录 */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-4 flex flex-col justify-between min-h-[96px] relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-slate-50 rounded-full group-hover:scale-110 transition-transform duration-300 pointer-events-none" />
              <div className="flex items-center justify-between z-10">
                <span className="text-xs text-slate-500 font-bold">总收录精灵</span>
                <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                  <Database className="w-4 h-4 text-slate-450 shrink-0" />
                </div>
              </div>
              <div className="mt-2.5 z-10 flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-slate-800 tracking-tight">{totalPets}</span>
                <span className="text-xs text-slate-400 font-semibold">只</span>
              </div>
            </div>

            {/* Card 2: 牌子规格 */}
            <div className="col-span-2 md:col-span-1 lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-4 flex flex-col justify-between min-h-[96px] relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-indigo-50/30 rounded-full group-hover:scale-110 transition-transform duration-300 pointer-events-none" />
              <div className="flex items-center justify-between z-10">
                <span className="text-xs text-slate-500 font-bold">牌子规格统计</span>
                <div className="w-7 h-7 bg-indigo-50/50 rounded-lg flex items-center justify-center border border-indigo-100/50">
                  <LayoutGrid className="w-4 h-4 text-indigo-500 shrink-0" />
                </div>
              </div>
              <div className="grid grid-cols-6 gap-1 mt-2.5 z-10">
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
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-4 flex flex-col justify-between min-h-[96px] relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform duration-300 pointer-events-none" />
              <div className="flex items-center justify-between z-10">
                <span className="text-xs text-slate-500 font-bold">现有现蛋窝点</span>
                <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100">
                  <Egg className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>
              </div>
              <div className="mt-2.5 z-10 flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-emerald-600 tracking-tight">{hasEggsCount}</span>
                <span className="text-xs text-emerald-500 font-semibold">窝 (共 {totalEggsCount} 个蛋)</span>
              </div>
            </div>

            {/* Card 4: 极限蛋 */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-4 flex flex-col justify-between min-h-[96px] relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-50 rounded-full group-hover:scale-110 transition-transform duration-300 pointer-events-none" />
              <div className="flex items-center justify-between z-10">
                <span className="text-xs text-slate-500 font-bold">极限精灵蛋</span>
                <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100">
                  <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                </div>
              </div>
              <div className="mt-2.5 z-10 flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-amber-500 tracking-tight">{limitsCount}</span>
                <span className="text-xs text-amber-500 font-semibold">只</span>
              </div>
            </div>

            {/* Card 5: 3V蛋 */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-4 flex flex-col justify-between min-h-[96px] relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-rose-50 rounded-full group-hover:scale-110 transition-transform duration-300 pointer-events-none" />
              <div className="flex items-center justify-between z-10">
                <span className="text-xs text-slate-500 font-bold">3V 精灵蛋</span>
                <div className="w-7 h-7 bg-rose-50 rounded-lg flex items-center justify-center border border-rose-100">
                  <Award className="w-4 h-4 text-rose-500 shrink-0" />
                </div>
              </div>
              <div className="mt-2.5 z-10 flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-rose-600 tracking-tight">{threeVsCount}</span>
                <span className="text-xs text-rose-500 font-semibold">只</span>
              </div>
            </div>
          </div>
        </div>        {/* Filters Header Row */}
        <div id="filter-header-bar" className="p-4 bg-slate-50/20 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center w-full">
            {/* Search filter input */}
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索精灵名字..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium placeholder:text-slate-400"
              />
            </div>

            {/* Filter by nature */}
            <select
              value={filterNature}
              onChange={e => setFilterNature(e.target.value)}
              className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium hover:bg-slate-50/50 transition-colors"
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
              className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium hover:bg-slate-50/50 transition-colors"
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
              className={`text-xs border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-250 cursor-pointer font-bold transition-all ${
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
              className={`text-xs border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-350 cursor-pointer font-bold transition-all ${
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
              className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium hover:bg-slate-50/50 transition-colors"
            >
              <option value="">全部(极限与非极限)</option>
              {LIMIT_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            {/* Watermark custom configuration toggle */}
            <button
              id="header-watermark-btn"
              onClick={() => setShowWatermarkPanel(!showWatermarkPanel)}
              className={`sm:ml-auto text-xs font-semibold py-1.5 px-3 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${showWatermarkPanel
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-inner"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
                }`}
              title="配置长图导出时的防盗水印样式"
            >
              <Settings className={`w-3.5 h-3.5 ${showWatermarkPanel ? "rotate-45" : ""} transition-transform duration-300`} />
              水印配置
            </button>
          </div>
        </div>

        {/* Collapsible Custom Watermark Control Panel */}
        <AnimatePresence>
          {showWatermarkPanel && (
            <motion.div
              id="watermark-control-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-slate-100 bg-slate-50/40"
            >
              <div className="p-4 px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs font-sans">
                <div className="flex flex-wrap items-center gap-5">
                  {/* Enable Status checkbox */}
                  <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={enableWatermark}
                      onChange={e => setEnableWatermark(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 accent-indigo-600 cursor-pointer"
                    />
                    <span>添加斜向防盗水印</span>
                  </label>

                  {enableWatermark && (
                    <div className="flex flex-wrap items-center gap-4 border-l border-slate-200 pl-4">
                      {/* Text Input */}
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-semibold whitespace-nowrap">水印文字:</span>
                        <input
                          type="text"
                          value={watermarkText}
                          onChange={e => setWatermarkText(e.target.value)}
                          placeholder="请输入水印文本内容..."
                          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:border-indigo-500 transition-all font-semibold text-xs w-52 shadow-sm"
                        />
                      </div>

                      {/* Density selectors */}
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-semibold whitespace-nowrap">格子密度:</span>
                        <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm overflow-hidden">
                          {(["dense", "normal", "sparse"] as const).map(d => {
                            const labels: Record<string, string> = {
                              dense: "密集",
                              normal: "普通",
                              sparse: "稀疏"
                            };
                            return (
                              <button
                                key={d}
                                onClick={() => setWatermarkDensity(d)}
                                className={`px-2.5 py-1 rounded text-[10px] font-extrabold transition-all cursor-pointer ${watermarkDensity === d
                                  ? "bg-slate-800 text-white shadow-sm font-bold"
                                  : "text-slate-500 hover:text-slate-800"
                                  }`}
                              >
                                {labels[d]}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Opacity slider */}
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-semibold whitespace-nowrap">
                          不透明度 ({(watermarkOpacity * 100).toFixed(0)}%):
                        </span>
                        <input
                          type="range"
                          min="0.04"
                          max="0.40"
                          step="0.02"
                          value={watermarkOpacity}
                          onChange={e => setEnableWatermark(true) || setWatermarkOpacity(parseFloat(e.target.value))}
                          className="w-20 accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      {/* Font Size slider */}
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-semibold whitespace-nowrap">
                          字号 ({watermarkSize}px):
                        </span>
                        <input
                          type="range"
                          min="10"
                          max="24"
                          step="1"
                          value={watermarkSize}
                          onChange={e => setEnableWatermark(true) || setWatermarkSize(parseInt(e.target.value))}
                          className="w-20 accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 font-medium shrink-0 bg-indigo-50/50 border border-indigo-100/50 px-2.5 py-1 rounded-lg">
                  ⚡ 网页操作时背景清晰无碍，仅在导出长图渲染时，会加入防盗重影水印。
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredPets.map((pet) => (
                  <SortableCard
                    key={pet.id}
                    pet={pet}
                    handleDeletePet={handleDeletePet}
                    handleUpdateSprite={handleUpdateSprite}
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
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Bottom utility controls */}
        <div id="footer-actions" className="p-5 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="flex flex-wrap gap-2.5 items-center w-full sm:w-auto">
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
              onClick={handleReset}
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
              className="py-2 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg transition-all font-bold flex items-center justify-center gap-2 shadow-md text-sm cursor-pointer flex items-center gap-1.5"
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
            <div className="md:col-span-3 flex flex-col gap-1.5">
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
            <div className="md:col-span-4 flex flex-col gap-1.5">
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
            <div className="md:col-span-5 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">牌子</label>
              <div className="flex flex-wrap gap-1.5">
                {BRAND_OPTIONS.map(brand => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => setNewTradeBrand(brand)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer h-[34px] flex items-center justify-center ${getBrandStyle(brand)} ${newTradeBrand === brand
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

            {/* 换蛋类型 */}
            <div className="md:col-span-3 flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-700">换蛋类型</span>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50 w-full h-[34px] items-center">
                {TRADE_TYPE_OPTIONS.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewTradeType(type)}
                    className={`flex-1 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer text-center h-full flex items-center justify-center ${newTradeType === type
                        ? 'bg-white text-slate-850 shadow-xs border border-slate-200/20'
                        : 'text-slate-500 hover:text-slate-850'
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* 发布动作按钮 */}
            <div className="md:col-span-2 flex flex-col gap-1.5">
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
          <div className="p-6 bg-slate-50/30">
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
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-4 flex items-center justify-between gap-4 relative overflow-hidden group/card"
                    >
                      {/* Delete Button at top-right */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTrade(trade.id);
                        }}
                        className="absolute top-2 right-2 p-1 rounded-lg text-slate-350 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all opacity-0 group-hover/card:opacity-100 cursor-pointer action-buttons z-20"
                        title="删除该条换蛋需求"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* 左侧：头像 + 详情 */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* 头像 */}
                        <div className="relative w-20 h-20 bg-slate-50 border border-slate-100/80 rounded-2xl flex items-center justify-center shrink-0 group/avatar overflow-hidden">
                          {spriteFileName ? (
                            <img
                              src={getImagePath(`images/sprites/${spriteFileName}`)}
                              alt={trade.sprite}
                              className="w-16 h-16 object-contain transition-transform duration-200 group-hover/avatar:scale-105"
                            />
                          ) : (
                            <Egg className="w-10 h-10 text-slate-300 transition-transform duration-200 avatar-fallback-icon" />
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

                      {/* 右侧：更显眼、放大的换蛋类型 */}
                      <div className="flex items-center justify-center shrink-0 pl-1 z-10">
                        <span
                          className={`text-xs font-extrabold px-3 py-1 rounded-full border shadow-sm shrink-0 tracking-wider transition-colors ${trade.tradeType === "包公"
                              ? "bg-blue-50 text-blue-600 border-blue-150"
                              : trade.tradeType === "包母"
                                ? "bg-pink-50 text-pink-650 border-pink-150"
                                : "bg-purple-50 text-purple-650 border-purple-150"
                            }`}
                        >
                          {trade.tradeType}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

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
                <h3 className="text-lg font-bold">确定要重置孵蛋列表吗？</h3>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                这将清除您自建的所有精灵以及最新修改的状态，并还原到出厂初始精灵列表 (共 {INITIAL_TABLE_DATA.length} 个推荐精灵条目)。此操作无法撤销！
              </p>
              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  onClick={() => setActiveModal("none")}
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
                      link.download = `洛克王国孵蛋表格长图_${dateStr}.png`;
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
      </AnimatePresence>
    </div>
  );
}
