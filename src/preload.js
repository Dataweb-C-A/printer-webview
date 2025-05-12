const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  sendToWebSocket: (data) => {
    ipcRenderer.send('send-to-websocket', data);
  },

  checkForUpdates: () => {
    ipcRenderer.send('check-for-updates');
  },
  
  onUpdateMessage: (callback) => {
    ipcRenderer.on('update-message', (_, message) => callback(message));
  }
});