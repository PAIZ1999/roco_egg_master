import React, { useState, useEffect } from "react";
import { Store, X, RotateCw, HelpCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { getLiveMerchantData, MerchantData, MerchantItem } from "../merchantHelper";

export function MerchantFloatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [merchantData, setMerchantData] = useState<MerchantData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 定时刷新与加载
  const fetchMerchant = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await getLiveMerchantData();
      if (data && data.items && data.items.length > 0) {
        setMerchantData(data);
      } else {
        setError("暂无商人售卖数据或加载失败，请重试");
      }
    } catch (err: any) {
      setError("请求行商数据出错");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchant(true);
    // 每 3 分钟自动刷新一次
    const timer = setInterval(() => {
      fetchMerchant(false);
    }, 180 * 1000);
    return () => clearInterval(timer);
  }, []);

  // 获取时段的友好文案
  const getPeriodText = (period: number) => {
    switch (period) {
      case 1: return "08:00 - 12:00";
      case 2: return "12:00 - 16:00";
      case 3: return "16:00 - 20:00";
      case 4: return "20:00 - 24:00";
      default: return "未在售卖时段 (00:00-08:00)";
    }
  };

  return (
    <div className="fixed right-4 bottom-24 z-50 flex items-end justify-end select-none">
      {/* 悬浮图标 (折叠态) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-amber-500 to-orange-600 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer relative border border-orange-400 group"
          title="点击查看远行商人售卖物品"
        >
          <Store className="w-6 h-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border border-white flex items-center justify-center animate-bounce">
            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
          </span>
          {/* 悬浮气泡提示 */}
          <span className="absolute right-16 scale-0 group-hover:scale-100 bg-slate-900/90 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg border border-slate-700 transition-all">
            💰 远行商人现已营业！
          </span>
        </button>
      )}

      {/* 商人卡片 (展开态) */}
      {isOpen && (
        <div className="w-80 sm:w-96 max-h-[500px] flex flex-col bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 dark:border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 transform scale-100 origin-bottom-right">
          {/* 头部 */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-orange-600/30 to-amber-600/10 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
              <div className="flex flex-col">
                <span className="text-[13px] font-black text-amber-400 flex items-center gap-1.5">
                  远行商人售卖清单
                </span>
                <span className="text-[10px] text-slate-400">
                  {merchantData ? getPeriodText(merchantData.period) : "正在获取时段..."}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchMerchant(true)}
                disabled={loading}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 active:scale-95 transition-all cursor-pointer"
                title="手动刷新行商售卖数据"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-500" : ""}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-850 active:scale-95 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 内容区 */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3 max-h-[380px]">
            {loading && !merchantData && (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <RotateCw className="w-8 h-8 text-amber-500 animate-spin" />
                <span className="text-xs text-slate-400">正在与行商接头，请稍候...</span>
              </div>
            )}

            {error && (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-center">
                <HelpCircle className="w-8 h-8 text-rose-500/80" />
                <span className="text-xs text-rose-300 font-semibold">{error}</span>
                <button
                  onClick={() => fetchMerchant(true)}
                  className="mt-2 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold rounded-lg transition-all active:scale-95 cursor-pointer"
                >
                  重新加载
                </button>
              </div>
            )}

            {!loading && !error && merchantData && merchantData.items.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-400">
                当前时段行商没有货物，请等下个时段再来看看吧！
              </div>
            )}

            {!error && merchantData && merchantData.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/40 dark:bg-slate-900/40 border border-slate-700/50 hover:border-amber-500/30 hover:bg-slate-800/60 dark:hover:bg-slate-900/60 transition-all group"
              >
                {/* 物品图片 */}
                <div className="w-12 h-12 rounded-lg bg-slate-950 flex items-center justify-center overflow-hidden border border-slate-700/60 shrink-0">
                  {item.sourceImage ? (
                    <img
                      src={item.sourceImage}
                      alt={item.name}
                      className="w-10 h-10 object-contain group-hover:scale-110 transition-all duration-300"
                      onError={(e) => {
                        // 兜底图片为 Lucide Store 图标
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <Store className="w-5 h-5 text-slate-600" />
                  )}
                </div>

                {/* 详细信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12.5px] font-extrabold text-slate-200 group-hover:text-amber-400 transition-colors truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md font-bold shrink-0">
                      {item.price}
                    </span>
                  </div>
                  
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                    {item.limit && (
                      <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded-md font-semibold text-slate-300">
                        {item.limit}
                      </span>
                    )}
                    {item.type && (
                      <span className="bg-slate-800/60 text-slate-400 px-1.5 py-0.5 rounded-md font-medium">
                        {item.type}
                      </span>
                    )}
                  </div>

                  {item.description && (
                    <div className="text-[9.5px] text-slate-500 mt-1 truncate group-hover:text-slate-400 transition-colors">
                      {item.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 底部信息栏 */}
          <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-850 flex items-center justify-between text-[9px] text-slate-500">
            <span>数据源: 游民星空/好游快爆</span>
            <span>更新于 {merchantData?.updatedAt}</span>
          </div>
        </div>
      )}
    </div>
  );
}
