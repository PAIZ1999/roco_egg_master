const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec, spawn } = require('child_process');

let mainWindow;
let customSaveDir = null;
const configPath = path.join(app.getPath('userData'), 'app_config.json');

// 加载持久化的自定义路径配置
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.customSaveDir && fs.existsSync(config.customSaveDir)) {
        customSaveDir = config.customSaveDir;
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
    const dirName = path.dirname(configPath);
    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify({ customSaveDir: dir }), 'utf8');
  } catch (e) {
    console.error('写入配置文件失败:', e);
  }
}

// 自动在后台隐藏启动 roco_helper-v3.2.2.exe 进程
function startRocoHelper() {
  const pathsToTry = [
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

    // Windows 平台使用 spawn 调用 powershell 隐藏窗口启动 (添加 shell: true 寻找环境变量)
    const psCommand = `Start-Process -FilePath '${helperPath}' -WindowStyle Hidden`;
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

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

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


app.whenReady().then(() => {
  loadConfig();
  startRocoHelper(); // 启动时在后台静默隐藏拉起 roco_helper-v3.2.2.exe
  createWindow();

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
