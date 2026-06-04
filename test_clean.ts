import { NATURE_OPTIONS } from './src/types';
import { filterOptions } from './src/components/Autocomplete';

console.log("=== 开始性格排序过滤测试 ===");

// 7 大优先性格列表
const PRIORITY_NATURES = ["固执", "聪明", "开朗", "胆小", "平和", "沉默", "踏实"];

// 测试1：无 query 时默认展示
console.log("\n测试 1: 无 query 时默认展示的前 10 个选项是否包含 7 大优先性格，且它们排在最前面");
const defaultResult = filterOptions(NATURE_OPTIONS, "");
console.log("默认展示前10项:", defaultResult);

// 校验前 7 项是否全都在 PRIORITY_NATURES 中
for (let i = 0; i < 7; i++) {
  const natureName = defaultResult[i].split(" ")[0];
  console.log(`第 ${i + 1} 项: ${defaultResult[i]} (优先性格校验: ${PRIORITY_NATURES.includes(natureName) ? "通过" : "失败"})`);
  if (!PRIORITY_NATURES.includes(natureName)) {
    console.error(`测试失败: 默认展示的第 ${i + 1} 项不是优先性格！`);
    process.exit(1);
  }
}

// 测试2：拼音首字母 'g' 检索
console.log("\n测试 2: 输入 'g' 进行拼音首字母检索");
// 'g' 能匹配的包括：
// 固执 (gz - 优先)
// 孤僻 (gp - 现已移除但为了验证如果是普通性格，不应在固执之上。当前版本的普通性格包括：大胆 dd, 勇敢 yg, 警惕 jt)
const resultG = filterOptions(NATURE_OPTIONS, "g");
console.log("输入 'g' 检索结果:", resultG);
// 固执是 'g' 相关的唯一优先性格，它必须在首位
if (!resultG[0].startsWith("固执")) {
  console.error(`测试失败: 输入 'g' 检索时，'固执' 应该排在首位，当前首位是: ${resultG[0]}`);
  process.exit(1);
} else {
  console.log("通过: '固执' 排在 'g' 检索结果首位！");
}

// 测试3：拼音首字母 'c' 检索
console.log("\n测试 3: 输入 'c' 进行拼音首字母检索");
// 'c' 能匹配：
// 聪明 (cm - 优先)
// 沉默 (cm - 优先)
// 逞强 (cq - 非优先)
// 专注 (zz - 包含拼音首字母中含有 c？ '专' zhuan - z, '注' zhu - z, 好像不含c。但有些包含，比如冷静 lj - 不含c。慎重 sz - 不含c。平和 ph - 不含c。)
const resultC = filterOptions(NATURE_OPTIONS, "c");
console.log("输入 'c' 检索结果:", resultC);
// 聪明、沉默是优先性格，应该排在 逞强 之前
const priorityIdxSmart = resultC.findIndex(opt => opt.startsWith("聪明"));
const priorityIdxSilent = resultC.findIndex(opt => opt.startsWith("沉默"));
const normalIdxStrong = resultC.findIndex(opt => opt.startsWith("逞强"));

console.log(`'聪明' 索引: ${priorityIdxSmart}, '沉默' 索引: ${priorityIdxSilent}, '逞强' 索引: ${normalIdxStrong}`);
if (priorityIdxSmart === -1 || priorityIdxSilent === -1 || normalIdxStrong === -1) {
  console.error("测试失败: 未在匹配结果中找到对应的性格！");
  process.exit(1);
}

if (priorityIdxSmart > normalIdxStrong || priorityIdxSilent > normalIdxStrong) {
  console.error("测试失败: 优先性格 '聪明' 或 '沉默' 没有排在非优先性格 '逞强' 之前！");
  process.exit(1);
} else {
  console.log("通过: '聪明' 和 '沉默' 成功排在 '逞强' 之前！");
}

// 测试4：拼音首字母 't' 检索
console.log("\n测试 4: 输入 't' 进行拼音首字母检索");
// 't' 能匹配：
// 踏实 (ts - 优先)
// 坦率 (ts - 非优先)
// 天真 (tz - 非优先)
const resultT = filterOptions(NATURE_OPTIONS, "t");
console.log("输入 't' 检索结果:", resultT);
const priorityIdxTashi = resultT.findIndex(opt => opt.startsWith("踏实"));
const normalIdxTanlv = resultT.findIndex(opt => opt.startsWith("坦率"));
const normalIdxTianzhen = resultT.findIndex(opt => opt.startsWith("天真"));

console.log(`'踏实' 索引: ${priorityIdxTashi}, '坦率' 索引: ${normalIdxTanlv}, '天真' 索引: ${normalIdxTianzhen}`);
if (priorityIdxTashi === -1 || normalIdxTanlv === -1 || normalIdxTianzhen === -1) {
  console.error("测试失败: 未在匹配结果中找到对应的性格！");
  process.exit(1);
}
if (priorityIdxTashi > normalIdxTanlv || priorityIdxTashi > normalIdxTianzhen) {
  console.error("测试失败: 优先性格 '踏实' 没有排在非优先性格之前！");
  process.exit(1);
} else {
  console.log("通过: '踏实' 成功排在所有其他以 't' 开头的非优先性格之前！");
}

console.log("\n=== 所有检索优先级测试用例全部通过！ ===");
