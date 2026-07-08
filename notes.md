# Notes: Python & Npcap 检测与引导安装技术研究

## 1. 检测 Python 3 是否已安装且加入 PATH
在 Windows 下，最稳妥的方法是通过执行 `python --version` 命令或 `python -c "import sys; print(sys.version_info.major)"`。
* **执行命令**：可以使用 Node.js 的 `exec`：
  ```javascript
  const { exec } = require('child_process');
  exec('python --version', (err, stdout, stderr) => {
    if (err) {
      // 找不到 Python 或者执行报错，判定为未安装
    } else {
      // 检查版本是否为 3.x
      const versionStr = (stdout || stderr).trim(); // 有些版本输出在 stderr
      if (versionStr.startsWith('Python 3')) {
        // Python 3 已安装
      }
    }
  });
  ```

## 2. 检测 Npcap 驱动是否已安装
Npcap 驱动安装后，会在系统服务中注册 `npcap` 驱动，同时会在 Windows 系统目录下部署 `wpcap.dll`。
* **方法 A：查询 Windows 服务列表**
  执行 `sc query npcap`。
  * 如果已安装且正在运行（或者已被注册），命令返回码为 `0` 并且输出包含 `npcap` 相关字样。
  * 如果未安装，会返回错误代码。
* **方法 B：文件路径检查**
  Npcap 通常把 `wpcap.dll` 放置在 `%SystemRoot%\System32\wpcap.dll`。
  另外，Npcap 自身的注册表路径为：`HKLM\Software\Npcap`。
* **联合判定逻辑**：
  ```javascript
  const fs = require('fs');
  const path = require('path');
  
  function isNpcapInstalled() {
    return new Promise((resolve) => {
      // 1. 服务检查
      exec('sc query npcap', (err, stdout) => {
        if (!err && stdout.includes('SERVICE_NAME: npcap')) {
          return resolve(true);
        }
        // 2. DLL 文件检查兜底
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
  ```

## 3. 定位安装包路径
安装包应当随着主 `.exe` 一起打包分发。在便携版单文件环境下，`app.getAppPath()` 可能会指向临时解压目录，为了能在与真正的桌面快捷方式（便携版 EXE）相同的目录下寻找文件，我们需要提取 `process.env.PORTABLE_EXECUTABLE_DIR` 环境变量。
* **搜寻函数**：
  ```javascript
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
  ```

## 4. 静默执行 Python 安装
Python 安装程序命令行参数：
* `/quiet`：静默运行，无 UI。
* `InstallAllUsers=1`：为所有用户安装。
* `PrependPath=1`：将 Python 添加至环境变量 PATH，省去用户配置麻烦。
* **执行命令**：
  ```javascript
  const installerPath = findInstaller('python-3.12.10-amd64.exe');
  exec(`"${installerPath}" /quiet InstallAllUsers=1 PrependPath=1`, (err) => {
     if (err) {
       // 静默安装失败，可能是被杀毒软件拦截
     } else {
       // 安装成功
     }
  });
  ```
为了体验更佳，我们在静默安装前应使用 `dialog.showMessageBox` 让用户确认，并在安装过程中显示一个弹窗说明。

## 5. 执行 Npcap 安装
由于 Npcap 免费版不支持 `/S` 静默安装参数，我们只能以普通模式启动：
```javascript
const installerPath = findInstaller('npcap-1.88.exe');
// 使用 shell.openPath 或直接 spawn 运行
const { shell } = require('electron');
shell.openPath(installerPath);
```
在拉起 Npcap 安装程序前，弹窗提示用户：“在接下来的 Npcap 安装过程中，请务必勾选‘Install Npcap in WinPcap API-compatible Mode’兼容模式，否则直连抓包将无法工作。”
