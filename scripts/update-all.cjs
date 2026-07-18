const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const LOCAL_DATABASE_DIR = path.join(PROJECT_ROOT, 'database');
const LOCAL_AVATAR_DIR = path.join(PROJECT_ROOT, '高清精灵头像');
const SPRITES_DIR = path.join(PROJECT_ROOT, 'images', 'sprites');
const SPRITE_FILES_JSON = path.join(PROJECT_ROOT, 'src', 'sprite_files.json');
const PETS_DATA_JSON = path.join(PROJECT_ROOT, 'src', 'pets_data.json');

function cleanAndCopyAvatars() {
  console.log('▶ [1/3] 正在清空并同步高清精灵头像...');
  
  if (!fs.existsSync(LOCAL_AVATAR_DIR)) {
    console.error(`错误: 项目目录下未找到 '高清精灵头像' 文件夹: ${LOCAL_AVATAR_DIR}`);
    process.exit(1);
  }

  // 1. 创建或清空 images/sprites
  if (fs.existsSync(SPRITES_DIR)) {
    const files = fs.readdirSync(SPRITES_DIR);
    for (const f of files) {
      fs.unlinkSync(path.join(SPRITES_DIR, f));
    }
  } else {
    fs.mkdirSync(SPRITES_DIR, { recursive: true });
  }

  // 2. 复制图片
  const avatars = fs.readdirSync(LOCAL_AVATAR_DIR).filter(f => f.endsWith('.png'));
  for (const f of avatars) {
    fs.copyFileSync(path.join(LOCAL_AVATAR_DIR, f), path.join(SPRITES_DIR, f));
  }
  console.log(`✔ 成功同步了 ${avatars.length} 张超清头像至 ${SPRITES_DIR}`);
}

function rebuildSpriteIndex() {
  console.log('▶ [2/3] 正在重建头像文件名索引缓存...');
  const files = fs.readdirSync(SPRITES_DIR).filter(f => f.endsWith('.png'));
  fs.writeFileSync(SPRITE_FILES_JSON, JSON.stringify(files, null, 2), 'utf8');
  console.log(`✔ 成功重建 ${SPRITE_FILES_JSON}，含 ${files.length} 个缓存项`);
}

function mergeDatabaseData() {
  console.log('▶ [3/3] 正在清洗并物理合并本地 database 目录数据...');
  
  if (!fs.existsSync(LOCAL_DATABASE_DIR)) {
    console.error(`错误: 项目目录下未找到 'database' 文件夹: ${LOCAL_DATABASE_DIR}`);
    process.exit(1);
  }

  const jsonFiles = fs.readdirSync(LOCAL_DATABASE_DIR).filter(file => file.endsWith('.json'));
  const mergedList = [];

  for (const file of jsonFiles) {
    const filePath = path.join(LOCAL_DATABASE_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const pet = JSON.parse(fileContent);

    // 1. 提取主头像文件名
    const filename = pet.avatar ? path.basename(pet.avatar) : `${pet.id}-${pet.name}.png`;

    // 2. 过滤构建 egg_data，排除 has_egg 等无用属性，保持与 React 原结构对齐
    const egg_data = pet.egg_data && pet.egg_data.has_egg ? {
      egg_groups: pet.egg_data.egg_groups || [],
      height_min: pet.egg_data.height_min,
      height_max: pet.egg_data.height_max,
      weight_min: pet.egg_data.weight_min,
      weight_max: pet.egg_data.weight_max,
      giant_weight_line: pet.egg_data.giant_weight_line,
      tiny_weight_line: pet.egg_data.tiny_weight_line
    } : {
      egg_groups: pet.egg_groups || ["无法孵蛋"],
      height_min: null,
      height_max: null,
      weight_min: null,
      weight_max: null,
      giant_weight_line: null,
      tiny_weight_line: null
    };

    // 3. 剥离 evolution_chain 里的子分支数组，仅保留一维线性进化数组
    const evolution_chain = pet.evolution_chain.filter(item => typeof item === 'string');

    // 4. 构建 baseForm (主精灵本身形态)
    const baseForm = {
      name: pet.name,
      egg_groups: pet.egg_groups || [],
      height_min: pet.height_min,
      height_max: pet.height_max,
      weight_min: pet.weight_min,
      weight_max: pet.weight_max,
      giant_weight_line: pet.giant_weight_line,
      tiny_weight_line: pet.tiny_weight_line,
      types: pet.types || [],
      stats: pet.stats ? {
        sum: pet.stats.sum,
        stats: {
          hp: pet.stats.hp,
          speed: pet.stats.speed,
          atk: pet.stats.atk,
          def: pet.stats.def,
          sp_atk: pet.stats.sp_atk,
          sp_def: pet.stats.sp_def
        }
      } : null
    };

    // 5. 整合其它子形态 (regional_forms, lord_forms, other_forms)
    const allSubForms = [
      ...(pet.regional_forms || []),
      ...(pet.lord_forms || []),
      ...(pet.other_forms || [])
    ].map(f => {
      return {
        name: f.name,
        egg_groups: f.egg_groups || [],
        height_min: f.height_min,
        height_max: f.height_max,
        weight_min: f.weight_min,
        weight_max: f.weight_max,
        giant_weight_line: f.giant_weight_line,
        tiny_weight_line: f.tiny_weight_line,
        types: f.types || [],
        stats: f.stats ? {
          sum: f.stats.sum,
          stats: {
            hp: f.stats.hp,
            speed: f.stats.speed,
            atk: f.stats.atk,
            def: f.stats.def,
            sp_atk: f.stats.sp_atk,
            sp_def: f.stats.sp_def
          }
        } : null
      };
    });

    // 6. 对 forms 进行去重和按进化链顺序重新排序
    const formMap = new Map();
    formMap.set(baseForm.name, baseForm);
    for (const sf of allSubForms) {
      if (!formMap.has(sf.name)) {
        formMap.set(sf.name, sf);
      }
    }

    const sortedForms = [];
    // 优先按照普通进化链的顺序推入
    for (const chainName of evolution_chain) {
      if (formMap.has(chainName)) {
        sortedForms.push(formMap.get(chainName));
        formMap.delete(chainName);
      }
    }
    // 剩下的形态（首领、样子等）平铺在后面
    for (const sf of formMap.values()) {
      sortedForms.push(sf);
    }

    // 7. 组装 React 单条记录
    const mergedPet = {
      id: pet.id,
      name: pet.name,
      filename: filename,
      egg_data: egg_data,
      evolution_chain: evolution_chain,
      forms: sortedForms,
      types: pet.types || []
    };

    mergedList.push(mergedPet);
  }

  // 按照 ID 升序排列
  mergedList.sort((a, b) => a.id - b.id);

  // 写入最终 pets_data.json
  fs.writeFileSync(PETS_DATA_JSON, JSON.stringify(mergedList, null, 2), 'utf8');
  console.log(`✔ 成功合并 ${mergedList.length} 条主精灵数据至: ${PETS_DATA_JSON}`);
}

function run() {
  console.log('==================================================');
  console.log('   洛克精灵本地数据自动整合与构建初始化系统');
  console.log('==================================================\n');
  
  try {
    cleanAndCopyAvatars();
    console.log('');
    rebuildSpriteIndex();
    console.log('');
    mergeDatabaseData();
    console.log('\n==================================================');
    console.log('   🎉 数据与头像全部同步整合成功！');
    console.log('==================================================');
  } catch (err) {
    console.error('\n❌ 整合失败。错误详情:');
    console.error(err.message);
    process.exit(1);
  }
}

run();
