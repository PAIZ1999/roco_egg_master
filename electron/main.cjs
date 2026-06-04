const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

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

  // 开发模式下，存在项目根目录 of data 文件夹中
  if (!app.isPackaged) {
    const devDataDir = path.join(app.getAppPath(), 'data');
    if (!fs.existsSync(devDataDir)) {
      fs.mkdirSync(devDataDir, { recursive: true });
    }
    return path.join(devDataDir, 'roco_egg_data.json');
  }

  // 生产环境下（打包后的 exe 运行时）
  // 1. 优先使用 exe 同级目录下的 data 目录
  const exeDir = path.dirname(process.execPath);
  const localDataDir = path.join(exeDir, 'data');
  const localFilePath = path.join(localDataDir, 'roco_egg_data.json');

  try {
    // 写入权限测试
    if (!fs.existsSync(localDataDir)) {
      fs.mkdirSync(localDataDir, { recursive: true });
    }
    const testFile = path.join(localDataDir, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    return localFilePath;
  } catch (err) {
    console.error('exe同级目录不可写，降级使用用户 AppData 目录:', err);
    // 2. 权限不足时，降级使用 AppData 目录
    const appDataDir = path.join(app.getPath('userData'), 'data');
    if (!fs.existsSync(appDataDir)) {
      fs.mkdirSync(appDataDir, { recursive: true });
    }
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

app.whenReady().then(() => {
  loadConfig();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
