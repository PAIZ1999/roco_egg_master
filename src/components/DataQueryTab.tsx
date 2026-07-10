import React, { useState, useEffect } from "react";
import { Search, Sparkles, BookOpen, Layers, Zap, Info, ChevronRight, HelpCircle, Activity } from "lucide-react";
import { Autocomplete } from "./Autocomplete";
import { queryPet, queryEgg, queryEggGroups, parseEggParams, parseEggGroupParams, QueryPetResult, PredictedEggResult, petsRaceMap } from "../queryHelper";
import { ALL_PET_NAMES, getImagePath, getSpriteFileName } from "../petHelper";

// 六边形内联雷达图组件
function RadarChart({ stats }: { stats: { hp: number; speed: number; atk: number; def: number; sp_atk: number; sp_def: number } }) {
  const cx = 150;
  const cy = 135;
  const R = 75;
  const M = 200;

  const keys = ['hp', 'atk', 'def', 'speed', 'sp_def', 'sp_atk'];
  const iconFileNames: Record<string, string> = {
    hp: '生命',
    atk: '物攻',
    def: '物防',
    speed: '速度',
    sp_def: '魔防',
    sp_atk: '魔攻'
  };
  const angles = [
    -Math.PI / 2,         // 生命 (正上方 12 点)
    7 * Math.PI / 6,      // 物攻 (左上方 10 点)
    5 * Math.PI / 6,      // 物防 (左下方 8 点)
    Math.PI / 2,          // 速度 (正下方 6 点)
    Math.PI / 6,          // 魔防 (右下方 4 点)
    -Math.PI / 6          // 魔攻 (右上方 2 点)
  ];

  // 绘制 5 层背景六边形网格
  const bgPolygons = [];
  for (let scale = 1; scale <= 5; scale++) {
    const ratio = scale / 5;
    const r = R * ratio;
    const points = angles.map(angle => {
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    bgPolygons.push(
      <polygon
        key={scale}
        points={points}
        className="fill-none stroke-slate-200/10 dark:stroke-slate-800/40 stroke-[0.7]"
      />
    );
  }

  // 绘制 6 条轴线
  const axisLines = angles.map((angle, i) => {
    const x = cx + R * Math.cos(angle);
    const y = cy + R * Math.sin(angle);
    return (
      <line
        key={i}
        x1={cx}
        y1={cy}
        x2={x.toFixed(1)}
        y2={y.toFixed(1)}
        className="stroke-slate-200/15 dark:stroke-slate-800/40 stroke-[0.7]"
      />
    );
  });

  // 计算数据坐标
  const dataPoints = keys.map((key, i) => {
    const val = (stats as any)[key] !== null && (stats as any)[key] !== undefined ? (stats as any)[key] : 0;
    const limitedVal = Math.min(val, M);
    const r = R * (limitedVal / M);
    const angle = angles[i];
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { x, y, val, key };
  });

  const areaPoints = dataPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // 顶点圆圈
  const dots = dataPoints.map((p, i) => (
    <circle
      key={i}
      cx={p.x.toFixed(1)}
      cy={p.y.toFixed(1)}
      r="2.5"
      className="fill-indigo-400 stroke-indigo-600 stroke-[1]"
    />
  ));

  // 标签渲染
  const labels = dataPoints.map((p, i) => {
    const angle = angles[i];
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const labelDist = R + 14;
    const anchorX = cx + labelDist * cos;
    const anchorY = cy + labelDist * sin;

    let textAnchor = "middle";
    if (cos > 0.1) textAnchor = "start";
    else if (cos < -0.1) textAnchor = "end";

    let dy = "0.33em";
    if (sin < -0.85) dy = "-0.2em"; // 顶部
    else if (sin > 0.85) dy = "0.8em"; // 底部

    const labelName = iconFileNames[p.key];

    return (
      <g key={i} className="select-none pointer-events-none">
        <text
          x={anchorX.toFixed(1)}
          y={anchorY.toFixed(1)}
          textAnchor={textAnchor}
          dy={dy}
          className="text-[10px] font-black fill-slate-400 dark:fill-slate-400"
        >
          {labelName} <tspan className="fill-emerald-400 dark:fill-emerald-300 font-extrabold">{p.val}</tspan>
        </text>
      </g>
    );
  });

  return (
    <svg viewBox="20 15 260 240" className="w-52 h-48 sm:w-60 sm:h-56 mx-auto shrink-0 select-none">
      <defs>
        <radialGradient id="radar-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(99, 102, 241, 0.05)" />
          <stop offset="100%" stopColor="rgba(99, 102, 241, 0.3)" />
        </radialGradient>
      </defs>
      {/* 背景网格 */}
      <g>
        {bgPolygons}
        {axisLines}
      </g>
      {/* 数据填充多边形 */}
      <polygon
        points={areaPoints}
        className="fill-[url(#radar-grad)] stroke-indigo-500/70 stroke-[1.5]"
      />
      {/* 顶点数据点 */}
      {dots}
      {/* 标签 */}
      {labels}
    </svg>
  );
}

export function DataQueryTab() {
  const [subTab, setSubTab] = useState<"pet" | "eggGroup" | "eggPredict">("pet");

  // ==================== 精灵图鉴状态 ====================
  const [petSearchVal, setPetSearchVal] = useState("");
  const [petResult, setPetResult] = useState<QueryPetResult | null>(null);
  const [activeForm, setActiveForm] = useState<any>(null); // 当前选中的具体形态数据

  // ==================== 蛋组筛选状态 ====================
  const [groupSearchVal, setGroupSearchVal] = useState("");
  const [groupResult, setGroupResult] = useState<any[]>([]);
  const [groupError, setGroupError] = useState("");

  // ==================== 精灵蛋预测状态 ====================
  const [eggSearchVal, setEggSearchVal] = useState("");
  const [eggResult, setEggResult] = useState<PredictedEggResult[]>([]);
  const [eggError, setEggError] = useState("");

  // 当精灵查询结果变化时，同步设置当前选中的形态为默认形态
  useEffect(() => {
    if (petResult) {
      setActiveForm(petResult.currentForm);
    } else {
      setActiveForm(null);
    }
  }, [petResult]);

  // 执行精灵查询
  const handlePetQuery = (name: string) => {
    if (!name) return;
    const result = queryPet(name);
    setPetResult(result);
  };

  // 处理形态选择切换
  const handleFormSelect = (formItem: any) => {
    const cleanFormName = formItem.name.trim();
    const raceInfo = petsRaceMap[cleanFormName];
    const race = raceInfo && raceInfo.stats ? {
      sum: raceInfo.sum,
      stats: raceInfo.stats
    } : null;

    setActiveForm({
      ...formItem,
      race
    });
  };

  // 执行蛋组查询
  const handleGroupQuery = (e: React.FormEvent) => {
    e.preventDefault();
    setGroupError("");
    setGroupResult([]);
    const parsed = parseEggGroupParams(groupSearchVal);
    if (!parsed) {
      setGroupError("无效的蛋组名称，请输入有效的蛋组（如：天空、天空 动物、海洋 龙）");
      return;
    }
    const matched = queryEggGroups(parsed);
    setGroupResult(matched);
  };

  // 执行精灵蛋预测
  const handleEggQuery = (e: React.FormEvent) => {
    e.preventDefault();
    setEggError("");
    setEggResult([]);
    const parsed = parseEggParams(eggSearchVal);
    if (!parsed) {
      setEggError("格式错误，请按照「直径 重量」输入。如：0.24 4.8 或 120cm 4500g");
      return;
    }
    const matched = queryEgg(parsed.height, parsed.weight, parsed.isRideableOnly);
    setEggResult(matched);
  };

  // 资质名称映射与进度条颜色
  const statConfig = [
    { key: "hp", name: "生命", color: "from-rose-500 to-rose-400", icon: "生命" },
    { key: "speed", name: "速度", color: "from-emerald-500 to-emerald-400", icon: "速度" },
    { key: "atk", name: "物攻", color: "from-amber-500 to-amber-400", icon: "物攻" },
    { key: "def", name: "物防", color: "from-blue-500 to-blue-400", icon: "物防" },
    { key: "sp_atk", name: "魔攻", color: "from-purple-500 to-purple-400", icon: "魔攻" },
    { key: "sp_def", name: "魔防", color: "from-cyan-500 to-cyan-400", icon: "魔防" }
  ];

  // 解析当前 activeForm 所需的图像名称
  const getActiveFormSpritePath = () => {
    if (!activeForm) return getImagePath("images/egg-icon.png");
    const fileName = getSpriteFileName(activeForm.name);
    return fileName ? getImagePath(`images/sprites/${fileName}`) : getImagePath(`images/sprites/${activeForm.name}.png`);
  };

  return (
    <div className="flex flex-col gap-6 text-left select-none relative z-10 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* 选项卡头部 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/80 dark:bg-slate-950/60 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-base font-black text-slate-800 dark:text-slate-100">高级数据集成检索</h2>
        </div>

        {/* 磨砂玻璃小导航 */}
        <div className="flex bg-slate-100 dark:bg-slate-950/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto overflow-x-auto no-scrollbar shadow-3xs">
          <button
            onClick={() => setSubTab("pet")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
              subTab === "pet"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            精灵图鉴
          </button>
          <button
            onClick={() => setSubTab("eggGroup")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
              subTab === "eggGroup"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            蛋组筛选
          </button>
          <button
            onClick={() => setSubTab("eggPredict")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
              subTab === "eggPredict"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            精灵蛋预测
          </button>
        </div>
      </div>

      {/* ================================== 1. 精灵图鉴 Tab ================================== */}
      {subTab === "pet" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          {/* 搜索框 */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-center shadow-sm">
            <span className="text-xs text-slate-550 dark:text-slate-400 whitespace-nowrap font-bold">查询精灵名:</span>
            <div className="flex-1 w-full relative">
              <Autocomplete
                value={petSearchVal}
                onChange={setPetSearchVal}
                onSelect={(val) => handlePetQuery(val)}
                options={ALL_PET_NAMES}
                placeholder="输入精灵名称，支持中文、全拼或首字母缩写..."
                inputClassName="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-950/80 dark:border-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
              />
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-555 absolute left-3 top-3.5" />
            </div>
            <button
              onClick={() => handlePetQuery(petSearchVal)}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
            >
              精灵数据查询
            </button>
          </div>

          {/* 查询结果详情 */}
          {petResult && activeForm ? (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* 左侧：精灵立绘/头像/基本属性 */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-between gap-6 text-center relative overflow-hidden shadow-sm">
                  {/* 背景霓虹光效 */}
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/5 rounded-full filter blur-3xl pointer-events-none"></div>
                  
                  <div className="flex flex-col items-center gap-4 w-full">
                    {/* 头像 */}
                    <div className="relative w-36 h-36 rounded-3xl bg-slate-50 dark:bg-gradient-to-tr dark:from-slate-950 dark:to-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-2xl group overflow-hidden">
                      <div className="absolute inset-0 bg-indigo-500/5 group-hover:scale-110 transition-all duration-300"></div>
                      <img
                        key={activeForm.name} // 样式形态变化时重新渲染，避免闪烁
                        src={getActiveFormSpritePath()}
                        alt={activeForm.name}
                        className="w-28 h-28 object-contain group-hover:scale-110 transition-all duration-300 relative z-10 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getImagePath("images/egg-icon.png");
                        }}
                      />
                      <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-all"></div>
                    </div>

                    <div className="flex flex-col gap-1.5 z-10 w-full">
                      <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2 flex-wrap">
                        {activeForm.name}
                        <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-150/60 dark:text-indigo-400 dark:bg-indigo-950/80 dark:border-indigo-500/30 px-1.5 py-0.5 rounded-md font-mono">ID: {petResult.id}</span>
                      </h3>
                      
                      {/* 系别 & 蛋组 Badge */}
                      <div className="flex gap-2 justify-center items-center mt-1">
                        {activeForm.types.map((type: string, idx: number) => (
                          <div
                            key={idx}
                            className="w-7 h-7 rounded-full bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 flex items-center justify-center shadow-lg relative cursor-help hover:scale-105 transition-all"
                            title={`系别: ${type}`}
                          >
                            <img
                              src={getImagePath(`images/attributes/${type}.png`)}
                              alt={type}
                              className="w-5 h-5 object-contain"
                            />
                          </div>
                        ))}
                        
                        {activeForm.egg_groups.map((group: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-indigo-50/60 border border-indigo-100 text-indigo-655 dark:bg-slate-950 dark:border-slate-800 dark:text-indigo-400 px-3 py-1 rounded-full font-black shadow-3xs"
                          >
                            {group}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 不同形态选择画廊 */}
                  {petResult.avatars && petResult.avatars.length > 1 && (
                    <div className="w-full border-t border-slate-150 dark:border-slate-800/80 pt-4 mt-2">
                      <span className="text-[10px] text-slate-455 dark:text-slate-550 font-black text-left block mb-2.5 uppercase tracking-wider">切换形态样式:</span>
                      <div className="flex flex-wrap gap-2 justify-center max-h-36 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
                        {petResult.avatars.map((avatar, idx) => {
                          const formItem = petResult.forms[idx];
                          const isSelected = activeForm && activeForm.name === formItem.name;
                          return (
                            <button
                              key={idx}
                              onClick={() => handleFormSelect(formItem)}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-950/65 ${
                                isSelected
                                  ? "bg-indigo-50 dark:bg-indigo-600/20 border-indigo-200 dark:border-indigo-500 text-indigo-600 dark:text-indigo-300 font-extrabold scale-102 shadow-md dark:shadow-indigo-950/50"
                                  : "bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-950/40 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-600"
                              }`}
                            >
                              <img
                                src={getImagePath(avatar.absolutePath)}
                                alt={avatar.styleName}
                                className="w-5 h-5 object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = getImagePath("images/egg-icon.png");
                                }}
                              />
                              <span className="text-[9.5px] truncate max-w-24 font-bold">{avatar.styleName}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 右侧：种族六围资质雷达图与条形图 */}
                <div className="lg:col-span-8 flex flex-col justify-between gap-6">
                  {/* 六温种族资质大表 */}
                  {activeForm.race ? (
                    <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 h-full flex flex-col justify-between shadow-sm">
                      <div className="flex items-center justify-between mb-4 border-b border-slate-150 dark:border-slate-800 pb-3">
                        <span className="text-xs text-slate-500 dark:text-slate-450 font-black flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                          种族资质数据大面板
                        </span>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-455 dark:text-slate-550 font-bold mr-1.5">资质总和:</span>
                          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-wide font-mono">{activeForm.race.sum}</span>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-center gap-6 flex-1">
                        {/* 左侧：无边框雷达图 */}
                        <div className="flex-shrink-0 w-full md:w-auto flex items-center justify-center">
                          <RadarChart stats={activeForm.race.stats} />
                        </div>

                        {/* 右侧：条形图进度条 */}
                        <div className="flex-1 w-full grid grid-cols-1 gap-4">
                          {statConfig.map((stat) => {
                            const val = (activeForm.race!.stats as any)[stat.key] || 0;
                            const pct = Math.min((val / 200) * 100, 100);
                            return (
                              <div key={stat.key} className="flex flex-col gap-1 text-xs">
                                <div className="flex items-center justify-between font-bold">
                                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                    <img
                                      src={getImagePath(`images/6围/${stat.icon}.png`)}
                                      alt={stat.name}
                                      className="w-4 h-4 object-contain"
                                    />
                                    {stat.name}
                                  </span>
                                  <span className="text-slate-800 dark:text-slate-100 font-extrabold text-[12.5px] font-mono">{val}</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
                                  <div
                                    className={`h-full rounded-full bg-gradient-to-r ${stat.color} shadow-[0_0_10px_rgba(99,102,241,0.1)] dark:shadow-[0_0_10px_rgba(99,102,241,0.2)] transition-all duration-500 ease-out`}
                                    style={{ width: `${pct}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center py-20 text-xs text-slate-500 h-full flex items-center justify-center shadow-sm">
                      暂无该形态的资质资质六围数据
                    </div>
                  )}
                </div>
              </div>

              {/* 中间：进化链走向 */}
              {petResult.evolution_chain && petResult.evolution_chain.length > 0 && (
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-black block mb-4 uppercase tracking-wider">🧬 进化链走向 (点击可跳转查询)</span>
                  <div className="flex flex-wrap items-center gap-4">
                    {petResult.evolution_chain.map((chainItem: any, idx) => {
                      if (typeof chainItem === "string") {
                        const cleanName = chainItem.split(/[（(]/)[0].trim();
                        const matchedForm = petResult.forms.find((f: any) => f.name.startsWith(cleanName));
                        const spriteName = matchedForm ? matchedForm.name : cleanName;
                        const fileName = getSpriteFileName(spriteName);
                        const iconPath = fileName ? getImagePath(`images/sprites/${fileName}`) : getImagePath(`images/sprites/${cleanName}.png`);
                        return (
                          <React.Fragment key={idx}>
                            {idx > 0 && <ChevronRight className="w-4 h-4 text-slate-450 dark:text-slate-600 shrink-0" />}
                            <button
                              onClick={() => handlePetQuery(chainItem)}
                              className={`px-4 py-3 rounded-2xl border transition-all flex items-center gap-2.5 hover:scale-103 cursor-pointer ${
                                cleanName === petResult.name
                                  ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 font-extrabold shadow-lg shadow-indigo-950/40"
                                  : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-950/60 dark:border-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100 hover:bg-slate-100"
                              }`}
                            >
                              <img
                                src={iconPath}
                                alt={cleanName}
                                className="w-6 h-6 object-contain filter drop-shadow"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = getImagePath("images/egg-icon.png");
                                }}
                              />
                              <span className="text-[11.5px] font-black">{chainItem}</span>
                            </button>
                          </React.Fragment>
                        );
                      } else if (Array.isArray(chainItem)) {
                        // 分支进化
                        return (
                          <React.Fragment key={idx}>
                            {idx > 0 && <ChevronRight className="w-4 h-4 text-slate-455 dark:text-slate-600 shrink-0" />}
                            <div className="flex flex-col gap-2">
                              {chainItem.map((subItem: string, subIdx) => {
                                const cleanSub = subItem.split(/[（(]/)[0].trim();
                                const matchedForm = petResult.forms.find((f: any) => f.name.startsWith(cleanSub));
                                const spriteName = matchedForm ? matchedForm.name : cleanSub;
                                const fileName = getSpriteFileName(spriteName);
                                const iconPath = fileName ? getImagePath(`images/sprites/${fileName}`) : getImagePath(`images/sprites/${cleanSub}.png`);
                                return (
                                  <button
                                    key={subIdx}
                                    onClick={() => handlePetQuery(subItem)}
                                    className={`px-3.5 py-2 rounded-xl border transition-all flex items-center gap-2 hover:scale-102 cursor-pointer ${
                                      cleanSub === petResult.name
                                        ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 font-extrabold shadow-lg shadow-indigo-950/40"
                                        : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-950/60 dark:border-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100 hover:bg-slate-100"
                                    }`}
                                  >
                                    <img
                                      src={iconPath}
                                      alt={cleanSub}
                                      className="w-5 h-5 object-contain filter drop-shadow"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = getImagePath("images/egg-icon.png");
                                      }}
                                    />
                                    <span className="text-[10px] font-bold">{subItem}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </React.Fragment>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}

              {/* 下方：精灵与精灵蛋尺寸指标及极端线限制 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 精灵本体体型区间 */}
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-slate-150 dark:border-slate-855 pb-3">
                    <span className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">📏</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">精灵本体尺寸指标区间</span>
                  </div>
                  <div className="flex flex-col gap-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-850/60 shadow-3xs">
                        <span className="text-[10px] text-slate-455 dark:text-slate-500 font-bold uppercase tracking-wider">身高区间:</span>
                        <span className="text-slate-850 dark:text-slate-100 font-black text-[13.5px] mt-1 font-mono">
                          {activeForm.height_min !== null ? `${activeForm.height_min}m` : '-'} ~ {activeForm.height_max !== null ? `${activeForm.height_max}m` : '-'}
                        </span>
                      </div>
                      <div className="flex flex-col bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-850/60 shadow-3xs">
                        <span className="text-[10px] text-slate-455 dark:text-slate-555 font-bold uppercase tracking-wider">体重区间:</span>
                        <span className="text-slate-850 dark:text-slate-100 font-black text-[13.5px] mt-1 font-mono">
                          {activeForm.weight_min !== null ? `${activeForm.weight_min}kg` : '-'} ~ {activeForm.weight_max !== null ? `${activeForm.weight_max}kg` : '-'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-850/60 rounded-2xl p-4 flex flex-col gap-3">
                      <span className="text-[10px] text-slate-450 dark:text-slate-500 font-black uppercase tracking-wider">体型判定及及格线:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-amber-50/60 to-transparent border border-amber-200 dark:from-amber-500/10 dark:to-transparent dark:border-amber-500/20 text-[11px] font-bold text-amber-700 dark:text-amber-450 shadow-sm">
                          <span>🔥 大块头体重达标:</span>
                          <span className="font-mono font-black text-[12px]">
                            ≥ {activeForm.giant_weight_line !== null ? `${activeForm.giant_weight_line}kg` : '-'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-cyan-50/60 to-transparent border border-cyan-200 dark:from-cyan-500/10 dark:to-transparent dark:border-cyan-500/20 text-[11px] font-bold text-cyan-700 dark:text-cyan-455 shadow-sm">
                          <span>✨ 小不点体重达标:</span>
                          <span className="font-mono font-black text-[12px]">
                            ≤ {activeForm.tiny_weight_line !== null ? `${activeForm.tiny_weight_line}kg` : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 精灵蛋体型区间 */}
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-slate-150 dark:border-slate-855 pb-3">
                    <span className="p-1.5 bg-amber-50 dark:bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400">🥚</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">精灵蛋尺寸指标区间</span>
                  </div>
                  {petResult.egg_data && !petResult.egg_data.egg_groups.includes("无法孵蛋") ? (
                    <div className="flex flex-col gap-4 text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-850/60 shadow-3xs">
                          <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">蛋直径区间:</span>
                          <span className="text-slate-850 dark:text-slate-100 font-black text-[13.5px] mt-1 font-mono">
                            {petResult.egg_data.height_min !== null ? `${petResult.egg_data.height_min}m` : '-'} ~ {petResult.egg_data.height_max !== null ? `${petResult.egg_data.height_max}m` : '-'}
                          </span>
                        </div>
                        <div className="flex flex-col bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-850/60 shadow-3xs">
                          <span className="text-[10px] text-slate-455 dark:text-slate-550 font-bold uppercase tracking-wider">蛋重量区间:</span>
                          <span className="text-slate-850 dark:text-slate-100 font-black text-[13.5px] mt-1 font-mono">
                            {petResult.egg_data.weight_min !== null ? `${petResult.egg_data.weight_min}kg` : '-'} ~ {petResult.egg_data.weight_max !== null ? `${petResult.egg_data.weight_max}kg` : '-'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-850/60 rounded-2xl p-4 flex flex-col gap-3">
                        <span className="text-[10px] text-slate-450 dark:text-slate-550 font-black uppercase tracking-wider">精灵蛋体型判定及格线:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-amber-50/60 to-transparent border border-amber-200 dark:from-amber-500/10 dark:to-transparent dark:border-amber-500/20 text-[11px] font-bold text-amber-700 dark:text-amber-455 shadow-sm">
                            <span>🔥 大块头蛋达标线:</span>
                            <span className="font-mono font-black text-[12px]">
                              ≥ {petResult.egg_data.giant_weight_line !== null ? `${petResult.egg_data.giant_weight_line}kg` : '-'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-cyan-50/60 to-transparent border border-cyan-200 dark:from-cyan-500/10 dark:to-transparent dark:border-cyan-500/20 text-[11px] font-bold text-cyan-700 dark:text-cyan-455 shadow-sm">
                            <span>✨ 小不点蛋达标线:</span>
                            <span className="font-mono font-black text-[12px]">
                              ≤ {petResult.egg_data.tiny_weight_line !== null ? `${petResult.egg_data.tiny_weight_line}kg` : '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[148px] bg-slate-50/20 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850/60 rounded-2xl flex items-center justify-center text-xs text-slate-450 dark:text-slate-500 font-bold shadow-3xs">
                      该精灵属于“无法孵蛋”分类，无对应的精灵蛋体型参数
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/60 rounded-3xl py-24 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
              <Search className="w-12 h-12 text-slate-350 dark:text-slate-700 animate-pulse" />
              <div className="text-slate-400 text-xs font-semibold">请输入上方的精灵名称进行检索</div>
              <div className="text-slate-500 dark:text-slate-600 text-[10.5px]">（支持模糊搜索，如输入“mm”或“miaomiao”也可以匹配到“喵喵”哦）</div>
            </div>
          )}
        </div>
      )}

      {/* ================================== 2. 蛋组筛选 Tab ================================== */}
      {subTab === "eggGroup" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          {/* 输入框 */}
          <form onSubmit={handleGroupQuery} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-center shadow-sm">
            <span className="text-xs text-slate-550 dark:text-slate-400 whitespace-nowrap font-bold">输入蛋组名称:</span>
            <div className="flex-1 w-full relative">
              <input
                type="text"
                value={groupSearchVal}
                onChange={(e) => setGroupSearchVal(e.target.value)}
                placeholder="如: 天空、天空 动物、两栖 拟人..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-950/80 dark:border-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
              />
              <Layers className="w-4 h-4 text-slate-400 dark:text-slate-550 absolute left-3 top-3.5" />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
            >
              检索蛋组精灵
            </button>
          </form>

          {groupError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs font-bold rounded-xl text-center shadow-3xs animate-shake">
              {groupError}
            </div>
          )}

          {/* 蛋组筛选结果 */}
          {groupResult.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {groupResult.map((pet, idx) => {
                const fileName = getSpriteFileName(pet.name);
                const spritePath = fileName ? getImagePath(`images/sprites/${fileName}`) : getImagePath(`images/sprites/${pet.name}.png`);
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSubTab("pet");
                      setPetSearchVal(pet.name);
                      handlePetQuery(pet.name);
                    }}
                    className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 hover:bg-slate-50 dark:hover:bg-slate-900/60 p-4 rounded-2xl flex items-center gap-3 cursor-pointer group transition-all shadow-3xs"
                    title="点击查询精灵图鉴与六围"
                  >
                    <div className="w-12 h-12 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative shadow-3xs">
                      <img
                        src={spritePath}
                        alt={pet.name}
                        className="w-9 h-9 object-contain group-hover:scale-110 transition-all duration-300 relative z-10"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getImagePath("images/egg-icon.png");
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <span className="text-[12.5px] font-black text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate block">
                        {pet.name}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {pet.types.map((type: string, tIdx: number) => (
                          <img
                            key={tIdx}
                            src={getImagePath(`images/attributes/${type}.png`)}
                            alt={type}
                            className="w-3.5 h-3.5 object-contain"
                          />
                        ))}
                        <span className="text-[9px] text-slate-500 dark:text-slate-500 font-medium">
                          {pet.height_min}m / {pet.weight_min}kg
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            !groupError && (
              <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/60 rounded-3xl py-24 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
                <Layers className="w-12 h-12 text-slate-300 dark:text-slate-700 animate-pulse" />
                <div className="text-slate-400 text-xs font-semibold">请输入上方的蛋组组合进行检索</div>
                <div className="text-slate-500 dark:text-slate-600 text-[10.5px]">（支持多蛋组联合过滤，多个蛋组名之间用空格分隔）</div>
              </div>
            )
          )}
        </div>
      )}

      {/* ================================== 3. 精灵蛋预测 Tab ================================== */}
      {subTab === "eggPredict" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          {/* 输入参数 */}
          <form onSubmit={handleEggQuery} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-center shadow-sm">
            <div className="flex-1 w-full flex flex-col sm:flex-row items-center gap-3">
              <span className="text-xs text-slate-555 dark:text-slate-400 whitespace-nowrap font-bold shrink-0">输入蛋体积参数:</span>
              <div className="relative w-full">
                <input
                  type="text"
                  value={eggSearchVal}
                  onChange={(e) => setEggSearchVal(e.target.value)}
                  placeholder="直径(米/厘米) 重量(公斤/克) 加上指令可仅看同乘。如: 0.24 4.8 或 120cm 4500g 同乘"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-950/80 dark:border-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                />
                <Zap className="w-4 h-4 text-slate-400 dark:text-slate-550 absolute left-3 top-3.5" />
              </div>
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
            >
              孵蛋算法预测
            </button>
          </form>

          {eggError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs font-bold rounded-xl text-center shadow-3xs animate-shake">
              {eggError}
            </div>
          )}

          {/* 孵蛋预测预测结果列表 */}
          {eggResult.length > 0 ? (
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-550 dark:text-slate-400 font-bold grid grid-cols-12 gap-2 text-center">
                <div className="col-span-4 text-left">可能孵出的精灵</div>
                <div className="col-span-3">匹配概率</div>
                <div className="col-span-2">极限体型</div>
                <div className="col-span-3 text-right">理论直径 / 重量范围</div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-850">
                {eggResult.map((egg, idx) => {
                  const fileName = getSpriteFileName(egg.name);
                  const spritePath = fileName ? getImagePath(`images/sprites/${fileName}`) : getImagePath(`images/sprites/${egg.name}.png`);
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSubTab("pet");
                        setPetSearchVal(egg.name);
                        handlePetQuery(egg.name);
                      }}
                      className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 grid grid-cols-12 gap-2 items-center text-center text-xs cursor-pointer group transition-colors"
                      title="点击查询精灵图鉴与六围"
                    >
                      {/* 精灵头像与名称 */}
                      <div className="col-span-4 flex items-center gap-3 text-left">
                        <div className="w-10 h-10 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 rounded-lg flex items-center justify-center shrink-0 overflow-hidden shadow-3xs">
                          <img
                            src={spritePath}
                            alt={egg.name}
                            className="w-7 h-7 object-contain group-hover:scale-110 transition-all duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getImagePath("images/egg-icon.png");
                            }}
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                            {egg.name}
                          </span>
                          <span className="text-[9px] text-slate-450 dark:text-slate-500 font-semibold truncate">
                            {egg.egg_groups.join(" & ")}
                          </span>
                        </div>
                      </div>

                      {/* 预测概率 */}
                      <div className="col-span-3 font-mono">
                        <span className="text-sm font-black text-amber-600 dark:text-amber-500">{egg.probability}</span>
                      </div>

                      {/* 极限体型标记 */}
                      <div className="col-span-2 flex items-center justify-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                            egg.sizeTag === "大块头"
                              ? "bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                              : egg.sizeTag === "小不点"
                              ? "bg-cyan-50 text-cyan-600 border border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20"
                              : "bg-slate-100 text-slate-550 border border-transparent dark:bg-slate-800 dark:text-slate-500"
                          }`}
                        >
                          {egg.sizeTag}
                        </span>
                      </div>

                      {/* 理论直径和重量范围 */}
                      <div className="col-span-3 text-right text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                        <div>直: {egg.height_min}m ~ {egg.height_max}m</div>
                        <div className="text-[10px] text-slate-455 dark:text-slate-550">重: {egg.weight_min}kg ~ {egg.weight_max}kg</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            !eggError && (
              <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/60 rounded-3xl py-24 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
                <Zap className="w-12 h-12 text-slate-300 dark:text-slate-700 animate-pulse" />
                <div className="text-slate-400 text-xs font-semibold">请输入上方的精灵蛋体积参数进行预测</div>
                <div className="text-slate-550 dark:text-slate-600 text-[10.5px]">（体积参数是估计蛋类型的重要指标）</div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
