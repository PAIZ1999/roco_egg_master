import React, { useState, useEffect } from "react";
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
  Settings
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
  THREE_V_OPTIONS
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableRow } from "./components/SortableRow";

const migratePets = (rawList: any[]): EggPet[] => {
  return rawList.map((p, index) => {
    const fatherNatures = p.fatherNatures || p.natures || [NATURE_OPTIONS[0]];
    const motherNatures = p.motherNatures || [NATURE_OPTIONS[0]];
    const fatherStats = p.fatherStats || ["生命", "物攻", "速度"];
    const motherStats = p.motherStats || ["生命", "物攻", "速度"];
    return {
      ...p,
      id: p.id || `pet-init-${index}-${Math.random().toString(36).substr(2, 5)}`,
      fatherNatures: Array.isArray(fatherNatures) ? fatherNatures : [NATURE_OPTIONS[0]],
      motherNatures: Array.isArray(motherNatures) ? motherNatures : [NATURE_OPTIONS[0]],
      fatherStats: Array.isArray(fatherStats) ? fatherStats : ["生命", "物攻", "速度"],
      motherStats: Array.isArray(motherStats) ? motherStats : ["生命", "物攻", "速度"],
      sprite: p.sprite || "",
      groups: p.groups || [EGG_GROUPS[0]],
      brand: p.brand || BRAND_OPTIONS[0],
      status: p.status || NEST_STATUS_OPTIONS[0],
      isLimit: p.isLimit === "是" ? "极限" : (p.isLimit === "否" ? "非极限" : (p.isLimit || "非极限")),
      is3V: p.is3V === "是" ? "3V" : (p.is3V === "" || !p.is3V ? "否" : p.is3V),
      hideStats: !!p.hideStats
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
              setPets(result.data.pets);
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
              setPets(loadedData.pets);
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
  }, [pets, showWatermarkPanel, enableWatermark, watermarkText, watermarkOpacity, watermarkDensity, watermarkSize, isLoaded]);

  // Statistics calculation
  const totalPets = pets.length;
  const brandStats = BRAND_OPTIONS.reduce((acc, current) => {
    acc[current] = pets.filter(p => p.brand === current).length;
    return acc;
  }, {} as Record<string, number>);

  const hasEggsCount = pets.filter(p => p.status === "有现蛋").length;
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
  const handleUpdateSprite = (index: number, name: string) => {
    const updated = [...pets];
    updated[index].sprite = name;
    setPets(updated);
  };

  const handleUpdateBrand = (index: number, brand: string) => {
    const updated = [...pets];
    updated[index].brand = brand;
    setPets(updated);
  };

  const handleUpdateStatus = (index: number, status: string) => {
    const updated = [...pets];
    updated[index].status = status;
    setPets(updated);
  };

  const handleUpdateLimit = (index: number, limit: string) => {
    const updated = [...pets];
    updated[index].isLimit = limit;
    setPets(updated);
  };

  const handleUpdate3V = (index: number, is3V: string) => {
    const updated = [...pets];
    updated[index].is3V = is3V;
    setPets(updated);
  };

  const handleUpdateHideStats = (index: number, hide: boolean) => {
    const updated = [...pets];
    updated[index].hideStats = hide;
    setPets(updated);
  };

  // Natures list update
  const handleAddNature = (index: number, parent: "father" | "mother") => {
    const updated = [...pets];
    if (parent === "father") {
      updated[index].fatherNatures = [...(updated[index].fatherNatures || [])];
      updated[index].fatherNatures.push(NATURE_OPTIONS[0]);
    } else {
      updated[index].motherNatures = [...(updated[index].motherNatures || [])];
      updated[index].motherNatures.push(NATURE_OPTIONS[0]);
    }
    setPets(updated);
  };

  const handleRemoveNature = (index: number, parent: "father" | "mother", natureIndex: number) => {
    const updated = [...pets];
    if (parent === "father") {
      const list = [...(updated[index].fatherNatures || [])];
      if (list.length > 1) {
        list.splice(natureIndex, 1);
        updated[index].fatherNatures = list;
        setPets(updated);
      }
    } else {
      const list = [...(updated[index].motherNatures || [])];
      if (list.length > 1) {
        list.splice(natureIndex, 1);
        updated[index].motherNatures = list;
        setPets(updated);
      }
    }
  };

  const handleUpdateNature = (index: number, parent: "father" | "mother", natureIndex: number, value: string) => {
    const updated = [...pets];
    if (parent === "father") {
      const list = [...(updated[index].fatherNatures || [])];
      list[natureIndex] = value;
      updated[index].fatherNatures = list;
    } else {
      const list = [...(updated[index].motherNatures || [])];
      list[natureIndex] = value;
      updated[index].motherNatures = list;
    }
    setPets(updated);
  };

  // Stats list update
  const handleUpdateStat = (index: number, parent: "father" | "mother", statIndex: number, value: string) => {
    const updated = [...pets];
    if (parent === "father") {
      const list = [...(updated[index].fatherStats || ["生命", "物攻", "速度"])];
      list[statIndex] = value;
      updated[index].fatherStats = list;
    } else {
      const list = [...(updated[index].motherStats || ["生命", "物攻", "速度"])];
      list[statIndex] = value;
      updated[index].motherStats = list;
    }
    setPets(updated);
  };

  // Egg Groups list update
  const handleAddGroup = (index: number) => {
    const updated = [...pets];
    if (updated[index].groups.length < 3) {
      updated[index].groups.push(EGG_GROUPS[0]);
      setPets(updated);
    }
  };

  const handleRemoveGroup = (index: number, groupIndex: number) => {
    const updated = [...pets];
    if (updated[index].groups.length > 1) {
      updated[index].groups.splice(groupIndex, 1);
      setPets(updated);
    }
  };

  const handleUpdateGroup = (index: number, groupIndex: number, value: string) => {
    const updated = [...pets];
    updated[index].groups[groupIndex] = value;
    setPets(updated);
  };

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
      hideStats: false
    };
    setPets([...pets, newPet]);
  };

  const handleDeletePet = (index: number) => {
    const updated = pets.filter((_, i) => i !== index);
    setPets(updated);
  };

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
      div.style.justifyContent = "center";
      div.style.minHeight = "28px";
      div.style.whiteSpace = "nowrap";
      div.style.width = "100%";
      div.style.boxSizing = "border-box";
      div.textContent = displayVal || "—";

      if (!value) {
        div.classList.add("text-slate-400"); // placeholder styling color
      }

      // Add left padding preservation if it is the filter search bar input
      if (inputEl.placeholder === "搜索精灵名字...") {
        div.style.paddingLeft = "2.25rem";
        div.style.textAlign = "left";
        div.style.justifyContent = "flex-start";
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
      div.style.minHeight = "24px";
      div.style.width = "100%";
      div.style.boxSizing = "border-box";
      // Clear extra right/left padding that was reserved for select arrows to prevent squeezing & wrapping
      div.style.paddingLeft = "8px";
      div.style.paddingRight = "8px";
      div.textContent = selectedText;

      selectEl.parentNode?.replaceChild(div, selectEl);
    });

    // Physical cleanup of the cloned DOM structure to prevent misalignments & overlapping
    // 1. Remove sorting (drag handle) columns completely
    const clonedDragHandles = clone.querySelectorAll(".drag-handle-column");
    clonedDragHandles.forEach(el => el.remove());

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
        const remainingWidths = ["12.5%", "16.5%", "18.5%", "16.5%", "11%", "12.5%", "12.5%"];
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

  // Get color classes for Egg Groups
  const getEggGroupStyle = (group: string) => {
    const colors: Record<string, string> = {
      "海洋组": "bg-blue-50 text-blue-700 border-blue-200",
      "天空组": "bg-orange-50 text-orange-700 border-orange-200",
      "魔力组": "bg-cyan-50 text-cyan-700 border-cyan-200",
      "妖精组": "bg-pink-50 text-pink-700 border-pink-200",
      "软体组": "bg-teal-50 text-teal-700 border-teal-200",
      "植物组": "bg-emerald-50 text-emerald-700 border-emerald-200",
      "两栖组": "bg-yellow-50 text-yellow-800 border-yellow-200",
      "巨灵组": "bg-amber-50 text-amber-800 border-amber-200",
      "龙组": "bg-rose-50 text-rose-700 border-rose-200",
      "昆虫组": "bg-indigo-50 text-indigo-700 border-indigo-200",
      "拟人组": "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
      "机械组": "bg-sky-50 text-sky-700 border-sky-200",
      "大地组": "bg-stone-100 text-stone-700 border-stone-200"
    };
    return colors[group] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  // Get color classes for Nest Statuses
  const getStatusStyle = (status: string) => {
    if (status.includes("有现蛋")) return "bg-emerald-500 text-white border-transparent";
    if (status.includes("正在孵")) return "bg-sky-500 text-white border-transparent";
    if (status.includes("已撤窝")) return "bg-slate-400 text-white border-transparent";
    if (status.includes("投资")) return "bg-purple-500 text-white border-transparent";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  // Get brand color classes
  const getBrandStyle = (brand: string) => {
    const colors: Record<string, string> = {
      "大粗": "bg-violet-150 text-violet-700 border-violet-200 font-bold",
      "大婉": "bg-indigo-150 text-indigo-700 border-indigo-200 font-bold",
      "小粗": "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 font-semibold",
      "小婉": "bg-sky-50 text-sky-700 border-sky-200 font-semibold",
      "单牌": "bg-rose-150 text-rose-700 border-rose-200 font-bold",
      "普通": "bg-slate-100 text-slate-600 border-slate-200 font-medium"
    };
    return colors[brand] || "bg-gray-100 text-gray-600 border-gray-200";
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
        <div className="grid grid-cols-2 md:grid-cols-5 bg-slate-50/50 border-b border-slate-100 divide-x divide-y md:divide-y-0 divide-slate-100">
          <div className="p-4 text-center">
            <span className="text-xs text-slate-500 block mb-0.5 font-medium">总收录精灵</span>
            <span className="text-xl font-bold font-mono text-slate-800">{totalPets} 件</span>
          </div>
          <div className="p-4 text-center">
            <span className="text-xs text-slate-500 block mb-0.5 font-medium">大婉/大粗/单牌/小婉/小粗</span>
            <span className="text-sm font-semibold font-mono text-indigo-600 block mt-1">
              {brandStats["大婉"] || 0} / {brandStats["大粗"] || 0} / {brandStats["单牌"] || 0} / {brandStats["小婉"] || 0} / {brandStats["小粗"] || 0}
            </span>
          </div>
          <div className="p-4 text-center">
            <span className="text-xs text-slate-500 block mb-0.5 font-medium">现有现蛋窝点</span>
            <span className="text-xl font-bold font-mono text-emerald-600">{hasEggsCount} 窝</span>
          </div>
          <div className="p-4 text-center">
            <span className="text-xs text-slate-500 block mb-0.5 font-medium">极限蛋</span>
            <span className="text-xl font-bold font-mono text-amber-600">{limitsCount} 只</span>
          </div>
          <div className="p-4 text-center">
            <span className="text-xs text-slate-500 block mb-0.5 font-medium">3V 蛋</span>
            <span className="text-xl font-bold font-mono text-rose-600">{threeVsCount} 只</span>
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
              className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium hover:bg-slate-50/50 transition-colors"
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
              className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium hover:bg-slate-50/50 transition-colors"
            >
              <option value="">全部状态/窝点</option>
              {NEST_STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>{status}</option>
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

        {/* Main Editable Table Container */}
        <div className="w-full overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full text-center border-collapse table-fixed min-w-[1300px]">
              <colgroup>
                <col style={{ width: "4%" }} />
                <col style={{ width: "11.5%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "10.5%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
              </colgroup>
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="px-1 py-3 text-xs font-semibold text-slate-600 tracking-wider text-center drag-handle-column">排序</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 tracking-wider text-center text-xs">精灵名称</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 tracking-wider text-center text-xs">对应性格与方向</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 tracking-wider text-center text-xs">三围</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 tracking-wider text-center text-xs">宠物蛋组类别</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 tracking-wider text-center text-xs">牌子</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 tracking-wider text-center text-xs">窝点详情</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 tracking-wider text-center text-xs">是否极限</th>
                </tr>
              </thead>
              <tbody id="table-editable-body" className="divide-y divide-slate-100">
                <SortableContext
                  items={filteredPets.map(p => p.id as string)}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredPets.map((pet) => {
                    const originalIndex = pets.findIndex(p => p.id === pet.id);
                    return (
                      <SortableRow
                        key={pet.id}
                        pet={pet}
                        originalIndex={originalIndex}
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
                        getEggGroupStyle={getEggGroupStyle}
                        getStatusStyle={getStatusStyle}
                        getBrandStyle={getBrandStyle}
                      />
                    );
                  })}
                </SortableContext>
              </tbody>
            </table>
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
