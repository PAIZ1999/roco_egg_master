const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadData: () => ipcRenderer.invoke('load-data'),
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  getDataPath: () => ipcRenderer.invoke('get-data-path'),
  selectSavePath: (currentData) => ipcRenderer.invoke('select-save-path', currentData),
  httpGet: (url) => ipcRenderer.invoke('http-get', url),
  getRocoUsers: () => ipcRenderer.invoke('get-roco-users'),
  getRocoPets: (uid) => ipcRenderer.invoke('get-roco-pets', uid),
  showMainWindow: () => ipcRenderer.send('show-main-window'),
  resizeFloatWindow: (size) => ipcRenderer.send('resize-float-window', size)
});
