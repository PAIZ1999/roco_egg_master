import React, { useState } from "react";
import { Search, Sparkles, BookOpen, Layers, Zap, Info, ChevronRight, HelpCircle, Activity } from "lucide-react";
import { Autocomplete } from "./Autocomplete";
import { queryPet, queryEgg, queryEggGroups, parseEggParams, parseEggGroupParams, QueryPetResult, PredictedEggResult } from "../queryHelper";
import { ALL_PET_NAMES, getImagePath } from "../petHelper";

export function DataQueryTab() {
  const [subTab, setSubTab] = useState<"pet" | "eggGroup" | "eggPredict">("pet");

  // ==================== 精灵图鉴状态 ====================
  const [petSearchVal, setPetSearchVal] = useState("");
  const [petResult, setPetResult] = useState<QueryPetResult | null>(null);

  // ==================== 蛋组筛选状态 ====================
  const [groupSearchVal, setGroupSearchVal] = useState("");
  const [groupResult, setGroupResult] = useState<any[]>([]);
  const [groupError, setGroupError] = useState("");

  // ==================== 精灵蛋预测状态 ====================
  const [eggSearchVal, setEggSearchVal] = useState("");
  const [eggResult, setEggResult] = useState<PredictedEggResult[]>([]);
  const [eggError, setEggError] = useState("");

  // 执行精灵查询
  const handlePetQuery = (name: string) => {
    if (!name) return;
    const result = queryPet(name);
    setPetResult(result);
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

  return (
    <div className="flex flex-col gap-6 text-left select-none relative z-10 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* 选项卡头部 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 dark:bg-slate-950/60 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-black text-slate-100">高级数据集成检索</h2>
        </div>

        {/* 磨砂玻璃小导航 */}
        <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSubTab("pet")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
              subTab === "pet"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
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
                : "text-slate-400 hover:text-slate-200"
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
                : "text-slate-400 hover:text-slate-200"
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
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-center">
            <span className="text-xs text-slate-400 whitespace-nowrap font-bold">查询精灵名:</span>
            <div className="flex-1 w-full relative">
              <Autocomplete
                value={petSearchVal}
                onChange={setPetSearchVal}
                onSelect={(val) => handlePetQuery(val)}
                options={ALL_PET_NAMES}
                placeholder="输入精灵名称，支持中文、全拼或首字母缩写..."
                inputClassName="w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            </div>
            <button
              onClick={() => handlePetQuery(petSearchVal)}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-950/40 shrink-0"
            >
              精灵数据查询
            </button>
          </div>

          {/* 查询结果详情 */}
          {petResult ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* 左侧：精灵立绘/头像/基本属性 */}
              <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col items-center gap-4 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-2xl"></div>
                {/* 头像 */}
                <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-tr from-slate-950 to-slate-900 flex items-center justify-center border border-slate-800 shadow-2xl group overflow-hidden">
                  <img
                    src={getImagePath(`images/sprites/${petResult.name}.png`)}
                    alt={petResult.name}
                    className="w-24 h-24 object-contain group-hover:scale-110 transition-all duration-300 relative z-10"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getImagePath("images/egg-icon.png");
                    }}
                  />
                  <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-all"></div>
                </div>

                <div className="flex flex-col gap-1 z-10">
                  <h3 className="text-lg font-black text-slate-100 flex items-center justify-center gap-1.5">
                    {petResult.currentForm.name}
                    <span className="text-[10px] text-slate-500 font-mono">ID: {petResult.id}</span>
                  </h3>
                  
                  {/* 系别 Badge */}
                  <div className="flex gap-1.5 justify-center items-center mt-1">
                    {petResult.currentForm.types.map((type, idx) => (
                      <div
                        key={idx}
                        className="w-6 h-6 rounded-full bg-slate-950 border border-slate-850 flex items-center justify-center relative cursor-help"
                        title={`系别: ${type}`}
                      >
                        <img
                          src={getImagePath(`images/attributes/${type}.png`)}
                          alt={type}
                          className="w-4 h-4 object-contain"
                        />
                      </div>
                    ))}
                    
                    {/* 蛋组 Badge */}
                    {petResult.currentForm.egg_groups.map((group, idx) => (
                      <span
                        key={idx}
                        className="text-[9.5px] bg-slate-950 border border-slate-800 text-indigo-400 px-2 py-0.5 rounded-full font-bold"
                      >
                        {group}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 精灵蛋理论区间 */}
                {petResult.egg_data && (
                  <div className="w-full bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5 mt-2 flex flex-col gap-2 text-xs">
                    <span className="font-extrabold text-amber-400/90 text-left text-[11px]">🥚 精灵蛋体积参数</span>
                    <div className="grid grid-cols-2 gap-3 text-left">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-bold">直径理论区间:</span>
                        <span className="text-slate-300 font-extrabold text-[11px] mt-0.5">
                          {petResult.egg_data.height_min}m ~ {petResult.egg_data.height_max}m
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-bold">重量理论区间:</span>
                        <span className="text-slate-300 font-extrabold text-[11px] mt-0.5">
                          {petResult.egg_data.weight_min}kg ~ {petResult.egg_data.weight_max}kg
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 右侧：种族六围与进化链 */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                {/* 六围种族资质 */}
                {petResult.currentForm.race ? (
                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                      <span className="text-xs text-slate-400 font-black flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        精灵六围种族资质大表
                      </span>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 font-bold mr-1.5">资质总和:</span>
                        <span className="text-base font-black text-emerald-400">{petResult.currentForm.race.sum}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      {statConfig.map((stat) => {
                        const val = (petResult.currentForm.race!.stats as any)[stat.key] || 0;
                        const pct = Math.min((val / 200) * 100, 100);
                        return (
                          <div key={stat.key} className="flex flex-col gap-1 text-xs">
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-slate-400 flex items-center gap-2">
                                <img
                                  src={getImagePath(`images/6围/${stat.icon}.png`)}
                                  alt={stat.name}
                                  className="w-4 h-4 object-contain"
                                />
                                {stat.name}
                              </span>
                              <span className="text-slate-200 font-extrabold">{val}</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${stat.color} transition-all duration-500 ease-out`}
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-center py-12 text-xs text-slate-500">
                    暂无该形态的资质资质六围数据
                  </div>
                )}

                {/* 进化链 */}
                {petResult.evolution_chain && petResult.evolution_chain.length > 0 && (
                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                    <span className="text-xs text-slate-400 font-black block mb-4">🧬 进化链走向 (点击可跳转查询)</span>
                    <div className="flex flex-wrap items-center gap-3.5">
                      {petResult.evolution_chain.map((chainItem: any, idx) => {
                        // chainItem 可能是 string，也可能是分支进化数组，我们只显示串联的 string
                        if (typeof chainItem === "string") {
                          const cleanName = chainItem.split(/[（(]/)[0].trim();
                          return (
                            <React.Fragment key={idx}>
                              {idx > 0 && <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />}
                              <button
                                onClick={() => handlePetQuery(chainItem)}
                                className={`px-3.5 py-2.5 rounded-xl border transition-all flex items-center gap-2 hover:scale-103 cursor-pointer ${
                                  cleanName === petResult.name
                                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 font-extrabold"
                                    : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-slate-100"
                                }`}
                              >
                                <img
                                  src={getImagePath(`images/sprites/${cleanName}.png`)}
                                  alt={cleanName}
                                  className="w-6 h-6 object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = getImagePath("images/egg-icon.png");
                                  }}
                                />
                                <span className="text-[11.5px] font-bold">{chainItem}</span>
                              </button>
                            </React.Fragment>
                          );
                        } else if (Array.isArray(chainItem)) {
                          // 分支进化渲染成一个包裹列
                          return (
                            <React.Fragment key={idx}>
                              {idx > 0 && <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />}
                              <div className="flex flex-col gap-1.5">
                                {chainItem.map((subItem: string, subIdx) => {
                                  const cleanSub = subItem.split(/[（(]/)[0].trim();
                                  return (
                                    <button
                                      key={subIdx}
                                      onClick={() => handlePetQuery(subItem)}
                                      className={`px-3 py-2 rounded-lg border transition-all flex items-center gap-1.5 hover:scale-102 cursor-pointer ${
                                        cleanSub === petResult.name
                                          ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 font-extrabold"
                                          : "bg-slate-950/60 border-slate-800 text-slate-350 hover:border-slate-600 hover:text-slate-100"
                                      }`}
                                    >
                                      <img
                                        src={getImagePath(`images/sprites/${cleanSub}.png`)}
                                        alt={cleanSub}
                                        className="w-5 h-5 object-contain"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = getImagePath("images/egg-icon.png");
                                        }}
                                      />
                                      <span className="text-[10px] font-semibold">{subItem}</span>
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
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/20 border border-slate-800/60 rounded-3xl py-24 text-center flex flex-col items-center justify-center gap-3">
              <Search className="w-12 h-12 text-slate-700 animate-pulse" />
              <div className="text-slate-400 text-xs font-semibold">请输入上方的精灵名称进行检索</div>
              <div className="text-slate-600 text-[10.5px]">（支持模糊搜索，如输入“mm”或“miaomiao”也可以匹配到“喵喵”哦）</div>
            </div>
          )}
        </div>
      )}

      {/* ================================== 2. 蛋组筛选 Tab ================================== */}
      {subTab === "eggGroup" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          {/* 输入框 */}
          <form onSubmit={handleGroupQuery} className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-center">
            <span className="text-xs text-slate-400 whitespace-nowrap font-bold">输入蛋组名称:</span>
            <div className="flex-1 w-full relative">
              <input
                type="text"
                value={groupSearchVal}
                onChange={(e) => setGroupSearchVal(e.target.value)}
                placeholder="如: 天空、天空 动物、两栖 拟人..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <Layers className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-950/40 shrink-0"
            >
              检索蛋组精灵
            </button>
          </form>

          {groupError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl text-center">
              {groupError}
            </div>
          )}

          {/* 蛋组筛选结果 */}
          {groupResult.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {groupResult.map((pet, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSubTab("pet");
                    setPetSearchVal(pet.name);
                    handlePetQuery(pet.name);
                  }}
                  className="bg-slate-900/40 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900/60 p-4 rounded-2xl flex items-center gap-3 cursor-pointer group transition-all"
                  title="点击查询精灵图鉴与六围"
                >
                  <div className="w-12 h-12 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative">
                    <img
                      src={getImagePath(`images/sprites/${pet.name}.png`)}
                      alt={pet.name}
                      className="w-9 h-9 object-contain group-hover:scale-110 transition-all duration-300 relative z-10"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getImagePath("images/egg-icon.png");
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <span className="text-[12.5px] font-black text-slate-200 group-hover:text-indigo-400 truncate block">
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
                      <span className="text-[9px] text-slate-500">
                        {pet.height_min}m / {pet.weight_min}kg
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !groupError && (
              <div className="bg-slate-900/20 border border-slate-800/60 rounded-3xl py-24 text-center flex flex-col items-center justify-center gap-3">
                <Layers className="w-12 h-12 text-slate-700 animate-pulse" />
                <div className="text-slate-400 text-xs font-semibold">请输入上方的蛋组组合进行检索</div>
                <div className="text-slate-600 text-[10.5px]">（支持多蛋组联合过滤，多个蛋组名之间用空格分隔）</div>
              </div>
            )
          )}
        </div>
      )}

      {/* ================================== 3. 精灵蛋预测 Tab ================================== */}
      {subTab === "eggPredict" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          {/* 输入参数 */}
          <form onSubmit={handleEggQuery} className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex-1 w-full flex flex-col sm:flex-row items-center gap-3">
              <span className="text-xs text-slate-400 whitespace-nowrap font-bold shrink-0">输入蛋体积参数:</span>
              <div className="relative w-full">
                <input
                  type="text"
                  value={eggSearchVal}
                  onChange={(e) => setEggSearchVal(e.target.value)}
                  placeholder="直径(米/厘米) 重量(公斤/克) 加上指令可仅看同乘。如: 0.24 4.8 或 120cm 4500g 同乘"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <Zap className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              </div>
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-950/40 shrink-0"
            >
              孵蛋算法预测
            </button>
          </form>

          {eggError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl text-center">
              {eggError}
            </div>
          )}

          {/* 孵蛋预测预测结果列表 */}
          {eggResult.length > 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800 text-[11px] text-slate-400 font-bold grid grid-cols-12 gap-2 text-center">
                <div className="col-span-4 text-left">可能孵出的精灵</div>
                <div className="col-span-3">匹配概率</div>
                <div className="col-span-2">极限体型</div>
                <div className="col-span-3 text-right">理论直径 / 重量范围</div>
              </div>

              <div className="divide-y divide-slate-850">
                {eggResult.map((egg, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSubTab("pet");
                      setPetSearchVal(egg.name);
                      handlePetQuery(egg.name);
                    }}
                    className="px-4 py-3 hover:bg-slate-800/40 grid grid-cols-12 gap-2 items-center text-center text-xs cursor-pointer group"
                    title="点击查询精灵图鉴与六围"
                  >
                    {/* 精灵头像与名称 */}
                    <div className="col-span-4 flex items-center gap-3 text-left">
                      <div className="w-10 h-10 bg-slate-950 border border-slate-850 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                        <img
                          src={getImagePath(`images/sprites/${egg.name}.png`)}
                          alt={egg.name}
                          className="w-7 h-7 object-contain group-hover:scale-110 transition-all duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getImagePath("images/egg-icon.png");
                          }}
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-extrabold text-slate-200 group-hover:text-indigo-400 truncate">
                          {egg.name}
                        </span>
                        <span className="text-[9px] text-slate-500 font-semibold truncate">
                          {egg.egg_groups.join(" & ")}
                        </span>
                      </div>
                    </div>

                    {/* 预测概率 */}
                    <div className="col-span-3">
                      <span className="text-sm font-black text-amber-500">{egg.probability}</span>
                    </div>

                    {/* 极限体型标记 */}
                    <div className="col-span-2 flex items-center justify-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                          egg.sizeTag === "大块头"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-xs"
                            : egg.sizeTag === "小不点"
                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-xs"
                            : "bg-slate-800 text-slate-500 border border-transparent"
                        }`}
                      >
                        {egg.sizeTag}
                      </span>
                    </div>

                    {/* 理论直径和重量范围 */}
                    <div className="col-span-3 text-right text-[11px] text-slate-400 font-semibold">
                      <div>直: {egg.height_min}m ~ {egg.height_max}m</div>
                      <div className="text-[10px] text-slate-500">重: {egg.weight_min}kg ~ {egg.weight_max}kg</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            !eggError && (
              <div className="bg-slate-900/20 border border-slate-800/60 rounded-3xl py-24 text-center flex flex-col items-center justify-center gap-3">
                <Zap className="w-12 h-12 text-slate-700 animate-pulse" />
                <div className="text-slate-400 text-xs font-semibold">请输入上方的精灵蛋体积参数进行预测</div>
                <div className="text-slate-600 text-[10.5px]">（体积参数是估计蛋类型的重要指标）</div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
