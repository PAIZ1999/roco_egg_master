const SOURCE_URL = 'https://www.onebiji.com/hykb_tools/comm/lkwgmerchant/preview.php?id=1&immgj=0';

export interface MerchantItem {
  name: string;
  price: string;
  limit: string;
  type: string;
  description: string;
  sourceImage: string;
  period: number;
}

export interface MerchantData {
  items: MerchantItem[];
  period: number;
  hour: number;
  updatedAt: string;
}

function currentMerchantPeriod(): number {
  const hour = new Date().getHours();
  if (hour >= 8 && hour < 12) return 1;
  if (hour >= 12 && hour < 16) return 2;
  if (hour >= 16 && hour < 20) return 3;
  if (hour >= 20 && hour < 24) return 4;
  return 0; // 00:00 - 08:00
}

/**
 * 用正则提取 HTML 内容中的商品数据
 */
export function parseMerchantHtml(html: string): MerchantData {
  const periodMatch = html.match(/var\s+index\s*=\s*(\d+)/);
  const hourMatch = html.match(/var\s+hour\s*=\s*(\d+)/);
  const remotePeriod = periodMatch ? Number(periodMatch[1]) : currentMerchantPeriod();
  const remoteHour = hourMatch ? Number(hourMatch[1]) : new Date().getHours();

  const items: MerchantItem[] = [];
  
  // 提取所有 <li> 项
  const liRegex = /<li\b([^>]*)>([\s\S]*?)<\/li>/gi;
  let match;
  while ((match = liRegex.exec(html)) !== null) {
    const liAttrs = match[1];
    const liContent = match[2];

    // 从 onclick 中提取参数
    const onclickMatch = liAttrs.match(/onclick\s*=\s*"([^"]*)"/i);
    let sourceImage = "";
    let type = "";
    let description = "";

    if (onclickMatch) {
      const onclickVal = onclickMatch[1];
      const args: string[] = [];
      // 提取单引号里的值
      onclickVal.replace(/'((?:\\'|[^'])*)'/g, (_, value) => {
        args.push(value.replace(/\\'/g, "'"));
        return _;
      });
      sourceImage = args[0] || "";
      if (sourceImage.startsWith('//')) {
        sourceImage = 'https:' + sourceImage;
      }
      type = args[2] || "";
      description = args[3] || "";
    }

    // 提取商品名字
    const nameMatch = liContent.match(/<em[^>]*class="[^"]*shop_name[^"]*"[^>]*>([\s\S]*?)<\/em>/i);
    let name = nameMatch ? nameMatch[1].trim() : "";
    name = name.replace(/<[^>]+>/g, '').trim(); // 剔除 html 标签

    // 提取商品价格
    const priceMatch = liContent.match(/<em[^>]*class="[^"]*shop_price[^"]*"[^>]*>([\s\S]*?)<\/em>/i);
    let price = priceMatch ? priceMatch[1].trim() : "";
    price = price.replace(/<[^>]+>/g, '') // 剔除 html 标签
                 .replace(/^价格[:：]\s*/, '')
                 .replace(/\s+/g, '');

    // 提取限购
    const limitMatch = liContent.match(/<div[^>]*class="[^"]*gitem[^"]*"[^>]*>[\s\S]*?<em>([\s\S]*?)<\/em>/i);
    let limit = limitMatch ? limitMatch[1].trim() : "";
    limit = limit.replace(/<[^>]+>/g, '').trim();

    // 提取时段
    const classMatch = liAttrs.match(/class\s*=\s*"([^"]*)"/i);
    let period = 0;
    let className = classMatch ? classMatch[1] : "";
    const showPeriodMatch = className.match(/show_(\d)/);
    if (showPeriodMatch) {
      period = Number(showPeriodMatch[1]);
    }

    if (name) {
      items.push({
        name,
        price,
        limit,
        type,
        description,
        sourceImage,
        period
      });
    }
  }

  // 按照时段进行过滤
  let currentItems = items;
  if (remotePeriod > 0) {
    currentItems = items.filter(item => item.period === remotePeriod);
  }

  return {
    items: currentItems,
    period: remotePeriod,
    hour: remoteHour,
    updatedAt: new Date().toLocaleTimeString()
  };
}

/**
 * 抓取并解析行商数据
 */
export async function getLiveMerchantData(): Promise<MerchantData | null> {
  if (window.electronAPI && window.electronAPI.httpGet) {
    try {
      const response = await window.electronAPI.httpGet(SOURCE_URL);
      // 由于主进程强制进行了 JSON.parse，如果返回 false 但有 raw，我们直接用 raw 字段
      const html = response.raw || response.data || "";
      if (html && html.includes('shop-list')) {
        return parseMerchantHtml(html);
      }
    } catch (e) {
      console.error("[Merchant] Fetch live html error:", e);
    }
  }
  return null;
}
