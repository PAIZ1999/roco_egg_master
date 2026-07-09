const { app, BrowserWindow, ipcMain, dialog, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec, spawn } = require('child_process');

let mainWindow;
let floatWindow = null;
let customSaveDir = null;
let rememberCloseChoice = null; // null | 'tray' | 'exit'
let tray = null;
let isQuitting = false;
let showPetEnabled = true;
const configPath = path.join(app.getPath('userData'), 'app_config.json');

// 加载持久化的自定义路径配置
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.customSaveDir && fs.existsSync(config.customSaveDir)) {
        customSaveDir = config.customSaveDir;
      }
      if (config.rememberCloseChoice) {
        rememberCloseChoice = config.rememberCloseChoice;
      }
    }
  } catch (e) {
    console.error('加载配置文件失败:', e);
  }
}

// 写入自定义路径配置
function saveCustomPath(dir) {
  customSaveDir = dir;
  try {
    let config = {};
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    config.customSaveDir = dir;
    const dirName = path.dirname(configPath);
    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  } catch (e) {
    console.error('写入配置文件失败:', e);
  }
}

// 写入关闭行为配置
function saveCloseChoice(choice) {
  rememberCloseChoice = choice;
  try {
    let config = {};
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    config.rememberCloseChoice = choice;
    const dirName = path.dirname(configPath);
    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  } catch (e) {
    console.error('写入配置文件关闭行为失败:', e);
  }
}

// 自动在后台隐藏启动 roco_helper-v3.2.2.exe 进程
function startRocoHelper() {
  const pathsToTry = [
    // 0. 特殊处理：如果是 electron-builder 制造的 portable 便携版单文件，优先从其启动时环境变量获取原始同级/父级路径
    ...(process.env.PORTABLE_EXECUTABLE_DIR ? [
      path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'roco_helper-v3.2.2.exe'),
      path.join(process.env.PORTABLE_EXECUTABLE_DIR, '..', 'roco_helper-v3.2.2.exe')
    ] : []),

    // 1. AppPath 内层及外层
    path.join(app.getAppPath(), 'roco_helper-v3.2.2.exe'),
    path.join(app.getAppPath(), '..', 'roco_helper-v3.2.2.exe'),
    path.join(app.getAppPath(), '../..', 'roco_helper-v3.2.2.exe'),
    // 2. 真实执行程序（process.execPath）的同级、上一级、上上级 (覆盖编译、分发、解压多种情况)
    path.join(path.dirname(process.execPath), 'roco_helper-v3.2.2.exe'),
    path.join(path.dirname(process.execPath), '..', 'roco_helper-v3.2.2.exe'),
    path.join(path.dirname(process.execPath), '../..', 'roco_helper-v3.2.2.exe'),
    // 3. 当前运行工作目录
    path.join(process.cwd(), 'roco_helper-v3.2.2.exe'),
    path.join(process.cwd(), '..', 'roco_helper-v3.2.2.exe'),
    path.join(process.cwd(), '../..', 'roco_helper-v3.2.2.exe')
  ];

  let helperPath = null;
  for (const p of pathsToTry) {
    if (fs.existsSync(p)) {
      helperPath = p;
      break;
    }
  }

  if (!helperPath) {
    const searchPathsText = pathsToTry.slice(0, 6).join('\n');
    dialog.showErrorBox(
      '未检测到 roco_helper 助手',
      `系统已尝试在同级和父级目录下搜寻 roco_helper-v3.2.2.exe，但均未找到。\n\n请确认该文件是否放置在正确的位置。\n\n搜索路径清单：\n${searchPathsText}`
    );
    return;
  }

  // 检查是否已经在运行，防止重复开启
  exec('tasklist /FI "IMAGENAME eq roco_helper-v3.2.2.exe"', (err, stdout) => {
    if (stdout && stdout.includes('roco_helper-v3.2.2.exe')) {
      console.log('roco_helper-v3.2.2.exe 已经在运行中，无需重复启动');
      return;
    }

    // Windows 平台使用 spawn 调用 powershell 隐藏窗口启动，并增加弹窗秒杀轮询脚本 (发送回车键关闭)
    const psCommand = `Start-Process -FilePath '${helperPath}' -WindowStyle Hidden; $ws = New-Object -ComObject wscript.shell; for ($i=0; $i -lt 50; $i++) { if ($ws.AppActivate('洛克助手 v3.2.2')) { $ws.SendKeys('{ENTER}'); break; }; Start-Sleep -Milliseconds 100; }`;
    try {
      const ps = spawn('powershell.exe', [
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-Command', psCommand
      ], {
        detached: true,
        stdio: 'ignore',
        shell: true
      });
      ps.unref();

      ps.on('error', (spawnError) => {
        dialog.showErrorBox(
          '后台启动助手失败 (Spawn)',
          `无法拉起 powershell.exe 子进程，错误信息：\n${spawnError.message}`
        );
      });
    } catch (e) {
      dialog.showErrorBox(
        '后台启动助手抛出异常',
        `系统抛出未捕获的错误：\n${e.message}`
      );
    }
  });
}

// 退出时强制清理 roco_helper-v3.2.2.exe 进程
function stopRocoHelper() {
  exec('taskkill /F /IM roco_helper-v3.2.2.exe', (err) => {
    if (err) {
      console.log('清理后台 roco_helper 失败或当前无对应运行实例');
    } else {
      console.log('已成功在后台清理结束 roco_helper-v3.2.2.exe 进程');
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'icon.png');
  tray = new Tray(iconPath);
  
  const updateMenu = () => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示主界面',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      {
        label: '显示桌面宠物',
        type: 'checkbox',
        checked: showPetEnabled,
        click: (menuItem) => {
          showPetEnabled = menuItem.checked;
          if (floatWindow) {
            if (showPetEnabled) {
              if (!mainWindow || !mainWindow.isVisible()) {
                floatWindow.show();
              }
            } else {
              floatWindow.hide();
            }
          } else if (showPetEnabled) {
            createFloatWindow();
          }
        }
      },
      { type: 'separator' },
      {
        label: '退出软件',
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ]);
    tray.setContextMenu(contextMenu);
  };

  updateMenu();
  tray.setToolTip('洛克王国孵蛋数据管理系统');

  // 当悬浮窗显示/隐藏时由渲染进程通知更新菜单勾选状态
  ipcMain.on('update-tray-menu', () => {
    updateMenu();
  });

  // 双击托盘图标显示主界面
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1420,
    height: 850,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    },
  });

  // 隐藏默认菜单栏
  mainWindow.setMenuBarVisibility(false);

  // 加载页面
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    mainWindow.loadURL('http://localhost:3000');
  }

  // 拦截关闭按钮事件，转为系统托盘化
  mainWindow.on('close', (event) => {
    if (isQuitting) {
      return;
    }
    
    event.preventDefault();
    
    if (rememberCloseChoice === 'tray') {
      mainWindow.hide();
      return;
    } else if (rememberCloseChoice === 'exit') {
      isQuitting = true;
      app.quit();
      return;
    }
    
    // 弹出确认选项框
    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: 'question',
      buttons: ['最小化到系统托盘', '直接退出软件', '取消'],
      defaultId: 0,
      cancelId: 2,
      title: '关闭行为确认',
      message: '您希望如何关闭软件？',
      checkboxLabel: '记住我的选择，不再提示',
      checkboxChecked: false
    });
    
    const remember = (choice === 0 || choice === 1);
    
    if (choice === 0) {
      if (remember) {
        saveCloseChoice('tray');
      }
      mainWindow.hide();
      try {
        tray.displayBalloon({
          title: '已最小化至托盘',
          content: '软件已转入后台运行，双击托盘图标可重新显示主界面。'
        });
      } catch (err) {}
    } else if (choice === 1) {
      if (remember) {
        saveCloseChoice('exit');
      }
      isQuitting = true;
      app.quit();
    }
  });

  mainWindow.on('show', () => {
    if (floatWindow) {
      floatWindow.hide();
    }
  });

  mainWindow.on('hide', () => {
    if (!isQuitting && floatWindow && showPetEnabled) {
      floatWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createFloatWindow() {
  const { screen } = require('electron');
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;
  
  floatWindow = new BrowserWindow({
    width: 70, // 初始紧凑猫头尺寸
    height: 75,
    x: width - 90, // 靠最右下角对齐
    y: height - 100,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    show: false, // 默认主窗口处于激活状态时隐藏桌宠
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      additionalArguments: ['--window-type=float']
    }
  });

  if (app.isPackaged) {
    floatWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'float' });
  } else {
    floatWindow.loadURL('http://localhost:3000/#float');
  }

  // 保证独立窗口能跨虚拟桌面展示并强制显示在顶层
  floatWindow.setVisibleOnAllWorkspaces(true);
  floatWindow.setAlwaysOnTop(true, 'screen-saver');

  floatWindow.on('closed', () => {
    floatWindow = null;
  });
}

// 接收双击桌宠时呼出主界面的指令
ipcMain.on('show-main-window', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

// 接收折叠/展开桌宠改变窗口大小的指令，并保持右下角定位不动
ipcMain.on('resize-float-window', (event, { width, height }) => {
  if (floatWindow) {
    const { screen } = require('electron');
    const display = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = display.workAreaSize;
    
    // 对齐最右下角（右边距 20px，底边距 25px）
    const x = screenWidth - width - 20;
    const y = screenHeight - height - 25;
    
    floatWindow.setBounds({ x, y, width, height }, true);
  }
});

// 接收鼠标拖拽桌宠移动窗口位置的指令
ipcMain.on('drag-float-window', (event, { deltaX, deltaY }) => {
  if (floatWindow) {
    const { x, y, width, height } = floatWindow.getBounds();
    floatWindow.setBounds({
      x: x + deltaX,
      y: y + deltaY,
      width,
      height
    });
  }
});

// 自动保存的数据路径判定
function getDataFilePath() {
  // 1. 如果用户自定义了保存目录且该目录存在，则优先使用
  if (customSaveDir && fs.existsSync(customSaveDir)) {
    return path.join(customSaveDir, 'roco_egg_data.json');
  }

  // 开发模式下，存在项目根目录下
  if (!app.isPackaged) {
    return path.join(app.getAppPath(), 'roco_egg_data.json');
  }

  // 生产环境下（打包后的 exe 运行时）
  // 1. 优先使用 exe 同级目录
  const exeDir = path.dirname(process.execPath);
  const localFilePath = path.join(exeDir, 'roco_egg_data.json');

  try {
    // 写入权限测试
    const testFile = path.join(exeDir, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    return localFilePath;
  } catch (err) {
    console.error('exe同级目录不可写，降级使用用户 AppData 目录:', err);
    // 2. 权限不足时，降级使用 AppData 目录
    const appDataDir = path.join(app.getPath('userData'));
    return path.join(appDataDir, 'roco_egg_data.json');
  }
}

// IPC 接口监听
ipcMain.handle('load-data', async () => {
  const filePath = getDataFilePath();
  if (fs.existsSync(filePath)) {
    try {
      const dataStr = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(dataStr);
    } catch (e) {
      console.error('解析本地 JSON 失败:', e);
      return null;
    }
  }
  return null;
});

ipcMain.handle('save-data', async (event, data) => {
  const filePath = getDataFilePath();
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return { success: true, path: filePath };
  } catch (e) {
    console.error('保存数据失败:', e);
    return { success: false, error: e.message };
  }
});

ipcMain.handle('get-data-path', async () => {
  return getDataFilePath();
});

ipcMain.handle('select-save-path', async (event, currentData) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择数据自动保存的文件夹',
    properties: ['openDirectory', 'createDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  const selectedDir = result.filePaths[0];
  const targetFile = path.join(selectedDir, 'roco_egg_data.json');
  
  // 保存新配置
  saveCustomPath(selectedDir);
  
  let loadedData = null;
  if (fs.existsSync(targetFile)) {
    try {
      const dataStr = fs.readFileSync(targetFile, 'utf8');
      loadedData = JSON.parse(dataStr);
    } catch (e) {
      console.error('读取新选择目录下的数据文件失败:', e);
    }
  }
  
  // 如果新路径下没有数据文件，则将前端当前的最新数据写入，防止数据丢失
  if (!loadedData && currentData) {
    try {
      fs.writeFileSync(targetFile, JSON.stringify(currentData, null, 2), 'utf8');
    } catch (e) {
      console.error('自动保存当前数据到新路径失败:', e);
    }
  }
  
  return {
    path: targetFile,
    data: loadedData
  };
});

ipcMain.handle('http-get', async (event, url) => {
  return new Promise((resolve) => {
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      resolve({ success: false, error: '无效的协议，必须以 http:// 或 https:// 开头' });
      return;
    }
    const client = url.startsWith('https') ? require('https') : require('http');
    client.get(url, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ success: true, data: JSON.parse(data) });
        } catch (e) {
          resolve({ success: false, error: 'JSON解析失败: ' + e.message, raw: data });
        }
      });
    }).on('error', (err) => {
      resolve({ success: false, error: '网络请求失败: ' + err.message });
    });
  });
});

// 纯 JS 执行 Python 代码直连读取 SQLite
function runPythonCommand(pyScript) {
  return new Promise((resolve) => {
    const { spawn } = require('child_process');
    const child = spawn('python', ['-c', pyScript]);
    
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (data) => { stdout += data; });
    child.stderr.on('data', (data) => { stderr += data; });
    
    child.on('error', (err) => {
      resolve({ success: false, error: '未检测到 Python 运行环境: ' + err.message });
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, stdout });
      } else {
        resolve({ success: false, error: stderr.trim() || `Exit code ${code}` });
      }
    });
  });
}

ipcMain.handle('get-roco-users', async () => {
  const pyScript = `
import sqlite3, os, json
db_path = os.path.expandvars(r"%APPDATA%\\roco_helper\\roco_helper.sqlite")
if not os.path.exists(db_path):
    print(json.dumps({"success": False, "error": "Database file not found"}))
    exit(0)
try:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
    if not cur.fetchone():
        print(json.dumps({"success": False, "error": "Users table not found"}))
        exit(0)
    cur.execute("SELECT uid, name FROM users;")
    rows = cur.fetchall()
    res = [{"uid": r[0], "name": r[1]} for r in rows]
    print(json.dumps({"success": True, "data": res}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`.trim();

  const result = await runPythonCommand(pyScript);
  if (result.success) {
    try {
      return JSON.parse(result.stdout);
    } catch (e) {
      return { success: false, error: 'JSON解析失败: ' + e.message, raw: result.stdout };
    }
  } else {
    return { success: false, error: result.error };
  }
});

ipcMain.handle('get-roco-pets', async (event, uid) => {
  if (!uid || isNaN(Number(uid))) {
    return { success: false, error: '无效的角色 UID' };
  }
  const cleanUid = String(parseInt(uid));
  const pyScript = `
import sqlite3, os, json
db_path = os.path.expandvars(r"%APPDATA%\\roco_helper\\roco_helper.sqlite")
if not os.path.exists(db_path):
    print(json.dumps({"success": False, "error": "Database file not found"}))
    exit(0)
try:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # 1. 建立宠物在盒子里的位置映射 (ID -> position)
    box_table = "box_" + "${cleanUid}"
    pet_positions = {}
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?;", (box_table,))
    if cur.fetchone():
        cur.execute(f"SELECT id, data FROM {box_table};")
        box_rows = cur.fetchall()
        for b_id, b_data_str in box_rows:
            try:
                b_data = json.loads(b_data_str)
                if isinstance(b_data, list):
                    for grid_idx, p_id in enumerate(b_data):
                        if p_id and p_id > 0:
                            row = (grid_idx // 6) + 1
                            col = (grid_idx % 6) + 1
                            pet_positions[p_id] = f"{b_id + 1}盒\\n{row}行{col}列"
            except:
                pass

    # 2. 获取宠物数据
    table_name = "pet_info_" + "${cleanUid}"
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?;", (table_name,))
    if not cur.fetchone():
        print(json.dumps({"success": False, "error": "Table not found: " + table_name}))
        exit(0)
    cur.execute(f"SELECT id, data FROM {table_name};")
    rows = cur.fetchall()
    res = []
    for r in rows:
        try:
            pet_id = r[0]
            pet_data = json.loads(r[1])
            # 填入位置信息
            pet_data["position"] = pet_positions.get(pet_id, "-")
            res.append({"id": pet_id, "data": pet_data})
        except:
            pass
    print(json.dumps({"success": True, "data": res}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`.trim();

  const result = await runPythonCommand(pyScript);
  if (result.success) {
    try {
      return JSON.parse(result.stdout);
    } catch (e) {
      return { success: false, error: 'JSON解析失败: ' + e.message, raw: result.stdout };
    }
  } else {
    return { success: false, error: result.error };
  }
});


// ==========================================
// 环境依赖自动探测与引导安装系统
// ==========================================

// 在各可能路径中搜寻对应的离线安装包
function findInstaller(fileName) {
  const pathsToTry = [
    ...(process.env.PORTABLE_EXECUTABLE_DIR ? [path.join(process.env.PORTABLE_EXECUTABLE_DIR, fileName)] : []),
    path.join(path.dirname(process.execPath), fileName),
    path.join(app.getAppPath(), 'dist-electron', fileName),
    path.join(process.cwd(), fileName),
    path.join(process.cwd(), 'dist-electron', fileName)
  ];
  for (const p of pathsToTry) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

// 探测本地 Python 3 是否已就绪
function checkPython() {
  return new Promise((resolve) => {
    exec('python --version', (err, stdout, stderr) => {
      if (err) {
        return resolve(false);
      }
      const output = (stdout + stderr).trim();
      if (output.startsWith('Python 3')) {
        return resolve(true);
      }
      resolve(false);
    });
  });
}

// 动态检索系统常用安装路径，并将新安装的 Python 临时刷新至当前进程的 PATH 中
function refreshProcessPathForPython() {
  const commonDirs = [
    'C:\\Program Files',
    path.join(process.env.LOCALAPPDATA || '', 'Programs\\Python')
  ];

  const foundPaths = [];
  for (const baseDir of commonDirs) {
    if (fs.existsSync(baseDir)) {
      try {
        const files = fs.readdirSync(baseDir);
        for (const file of files) {
          if (file.toLowerCase().startsWith('python')) {
            const fullPath = path.join(baseDir, file);
            const scriptsPath = path.join(fullPath, 'Scripts');
            if (fs.existsSync(path.join(fullPath, 'python.exe'))) {
              foundPaths.push(fullPath);
            }
            if (fs.existsSync(scriptsPath)) {
              foundPaths.push(scriptsPath);
            }
          }
        }
      } catch (e) {
        console.error('扫描 Python 目录失败:', e);
      }
    }
  }

  const existingPaths = (process.env.PATH || '').split(path.delimiter);
  const newPaths = foundPaths.filter(fp => !existingPaths.includes(fp));
  
  if (newPaths.length > 0) {
    process.env.PATH = [...newPaths, ...existingPaths].join(path.delimiter);
    console.log('已动态刷新当前进程的 PATH 环境变量，加入新安装的 Python:', newPaths);
  }
}

// 引导运行 Python 安装
function installPython() {
  return new Promise((resolve) => {
    const installer = findInstaller('python-3.12.10-amd64.exe');
    if (!installer) {
      dialog.showErrorBox(
        '未找到 Python 安装包',
        '系统检测到您未安装 Python 3 环境，且在软件同级目录下未找到“python-3.12.10-amd64.exe”离线安装包。\n\n请手动前往官网 https://www.python.org/ 下载并安装（务必勾选 Add Python to PATH）。'
      );
      return resolve(false);
    }

    const choice = dialog.showMessageBoxSync({
      type: 'question',
      buttons: ['一键自动安装 (推荐)', '手动打开安装包', '取消安装'],
      defaultId: 0,
      title: '安装 Python 环境',
      message: '系统检测到您未安装 Python 3 环境。\n\n建议选择“一键自动安装”，系统将在后台自动为您安装并配置环境变量（大约需要 1-2 分钟）。\n\n您是否同意安装？'
    });

    if (choice === 0) {
      // 弹出提示框告知用户后台正在安装
      dialog.showMessageBoxSync({
        type: 'info',
        buttons: ['我知道了'],
        title: '正在安装 Python',
        message: 'Python 环境正在后台安装中，期间请勿关闭软件。安装完成后本软件将自动继续启动。\n\n这可能需要 1~2 分钟，请点击确定耐心等待。'
      });

      // 静默安装参数：/quiet InstallAllUsers=1 PrependPath=1
      exec(`"${installer}" /quiet InstallAllUsers=1 PrependPath=1`, (err) => {
        if (err) {
          dialog.showErrorBox('安装 Python 失败', `静默安装失败，可能是被杀毒软件拦截或取消了管理员授权。错误信息：\n${err.message}`);
          return resolve(false);
        }
        
        // 动态刷新进程 PATH
        refreshProcessPathForPython();

        // 再次检测
        checkPython().then((ok) => {
          if (ok) {
            dialog.showMessageBoxSync({
              type: 'info',
              buttons: ['确定'],
              title: '安装成功',
              message: 'Python 3 环境已成功安装并配置完毕！'
            });
            resolve(true);
          } else {
            dialog.showErrorBox('安装验证失败', 'Python 安装程序已运行完毕，但系统依然无法检测到 Python 3 环境变量。\n\n请尝试重启电脑或手动将 Python 添加到系统 PATH 中。');
            resolve(false);
          }
        });
      });
    } else if (choice === 1) {
      const { shell } = require('electron');
      shell.openPath(installer).then((err) => {
        if (err) {
          dialog.showErrorBox('启动安装程序失败', err);
          return resolve(false);
        }
        
        dialog.showMessageBoxSync({
          type: 'info',
          buttons: ['我已安装完成'],
          title: '等待 Python 安装',
          message: '请在弹出的 Python 安装程序中勾选“Add python.exe to PATH”并完成安装。\n\n完成安装后，请点击下方“我已安装完成”按钮。'
        });

        // 刷新环境变量并验证检测
        refreshProcessPathForPython();
        checkPython().then((ok) => {
          if (ok) {
            resolve(true);
          } else {
            dialog.showErrorBox('验证失败', '未检测到 Python 3，请确保您在安装时勾选了“Add python.exe to PATH”并成功完成了安装。');
            resolve(false);
          }
        });
      });
    } else {
      resolve(false);
    }
  });
}

// 探测本地 Npcap 驱动是否已就绪
function checkNpcap() {
  return new Promise((resolve) => {
    // 1. 调用 sc query npcap 服务状态
    exec('sc query npcap', (err, stdout, stderr) => {
      if (!err && (stdout || '').includes('SERVICE_NAME: npcap')) {
        return resolve(true);
      }
      
      // 2. DLL 文件与文件夹检测兜底
      const winDir = process.env.SystemRoot || 'C:\\Windows';
      const dllPath = path.join(winDir, 'System32', 'wpcap.dll');
      const npcapDir = path.join(winDir, 'System32', 'Npcap');
      if (fs.existsSync(dllPath) || fs.existsSync(npcapDir)) {
        return resolve(true);
      }
      
      resolve(false);
    });
  });
}

// 引导运行 Npcap 安装
function installNpcap() {
  return new Promise((resolve) => {
    const installer = findInstaller('npcap-1.88.exe');
    if (!installer) {
      dialog.showErrorBox(
        '未找到 Npcap 安装包',
        '系统检测到您未安装 Npcap 网卡驱动，且在软件同级目录下未找到“npcap-1.88.exe”离线安装包。\n\n请手动前往官网 https://npcap.com/ 下载并安装（安装时务必勾选兼容 WinPcap 模式）。'
      );
      return resolve(false);
    }

    dialog.showMessageBoxSync({
      type: 'warning',
      buttons: ['我知道了，启动安装'],
      title: '准备安装 Npcap 驱动',
      message: '系统检测到您未安装 Npcap 驱动。\n\n即将为您启动安装程序，请在随后的安装界面中务必勾选以下选项：\n\n👉  "Install Npcap in WinPcap API-compatible Mode"\n（兼容 WinPcap API 模式，通常在安装的第二页，这是嗅探数据的前置条件）。'
    });

    const { shell } = require('electron');
    shell.openPath(installer).then((err) => {
      if (err) {
        dialog.showErrorBox('启动安装程序失败', err);
        return resolve(false);
      }

      dialog.showMessageBoxSync({
        type: 'info',
        buttons: ['我已安装完成'],
        title: '等待 Npcap 安装',
        message: '请在弹出的 Npcap 安装程序中完成引导。\n\n安装完成后，请点击下方“我已安装完成”按钮。'
      });

      // 再次检测
      checkNpcap().then((ok) => {
        if (ok) {
          resolve(true);
        } else {
          dialog.showErrorBox('验证失败', '未检测到已启用的 Npcap 驱动，请重新尝试安装并确认是否已安装成功。');
          resolve(false);
        }
      });
    });
  });
}

// 核心引导调度，检测并确保各项环境就绪
async function ensureDependencies() {
  const pythonOk = await checkPython();
  if (!pythonOk) {
    const installed = await installPython();
    if (!installed) {
      const choice = dialog.showMessageBoxSync({
        type: 'warning',
        buttons: ['继续运行软件', '退出软件'],
        defaultId: 0,
        title: '缺少 Python 环境',
        message: '未检测到 Python 3 运行环境。本软件的“本地数据库直连”功能将无法使用，但您仍可以使用“手动粘贴 JSON”功能。\n\n是否继续运行软件？'
      });
      if (choice === 1) {
        app.quit();
        return false;
      }
    }
  }

  const npcapOk = await checkNpcap();
  if (!npcapOk) {
    const installed = await installNpcap();
    if (!installed) {
      const choice = dialog.showMessageBoxSync({
        type: 'warning',
        buttons: ['继续运行软件', '退出软件'],
        defaultId: 0,
        title: '缺少 Npcap 驱动',
        message: '未检测到 Npcap 驱动。本软件将无法自动监听和捕获游戏封包以更新本地数据库，但您仍可以使用“手动粘贴 JSON”功能。\n\n是否继续运行软件？'
      });
      if (choice === 1) {
        app.quit();
        return false;
      }
    }
  }

  return true;
}


app.whenReady().then(async () => {
  loadConfig();
  
  // 在启动主进程与助手之前，确保依赖检测流程完毕
  const depsOk = await ensureDependencies();
  if (!depsOk) {
    return;
  }

  startRocoHelper(); // 启动时在后台静默隐藏拉起 roco_helper-v3.2.2.exe
  createTray();      // 物理构造系统托盘
  createWindow();
  createFloatWindow(); // 创建独立桌面宠物悬浮窗

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  stopRocoHelper(); // 退出时自动清理杀死后台的 roco_helper-v3.2.2.exe 进程
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
