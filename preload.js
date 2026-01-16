const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pensionBackup', {
  // Get list of backup files from the backup directory
  getBackupFiles: () => ipcRenderer.invoke('get-backup-files'),

  // Read a specific backup file
  readBackupFile: (filePath) => ipcRenderer.invoke('read-backup-file', filePath),

  // Write backup files to the backup directory
  writeBackupFiles: (files) => ipcRenderer.invoke('write-backup-files', files),

  // Get the backup directory path
  getBackupDir: () => ipcRenderer.invoke('get-backup-dir'),

  // Show confirmation dialog
  showConfirmDialog: (options) => ipcRenderer.invoke('show-confirm-dialog', options)
});
