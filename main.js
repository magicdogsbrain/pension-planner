const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Set consistent app name to ensure userData path is stable
app.setName('pension-planner');

// Enforce single instance - only one Pension Tool can run at a time
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Another instance is already running, quit this one
  app.quit();
} else {
  // This is the primary instance
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

let mainWindow;
const BACKUP_DIR_NAME = 'PensionPlannerBackups';

function getBackupDir() {
  const homeDir = app.getPath('home');
  return path.join(homeDir, BACKUP_DIR_NAME);
}

function ensureBackupDir() {
  const dir = getBackupDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f0f1a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');

  // Track if we're in the process of closing (to avoid infinite loop)
  let isClosing = false;

  // Handle close event - auto-backup if there are unsaved changes
  // This fires for both red X button and Quit menu
  mainWindow.on('close', async (e) => {
    if (isClosing) return; // Already handling close

    // Prevent default close
    e.preventDefault();
    isClosing = true;

    // Ask renderer to check and backup if needed, then close
    try {
      await mainWindow.webContents.executeJavaScript('autoBackupOnExit()');
    } catch (err) {
      console.log('Auto-backup skipped:', err.message);
    }

    // Force close after backup completes (or fails)
    mainWindow.destroy();
    app.quit();
  });
  
  // Build menu
  const template = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'Export Backup',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.executeJavaScript('showExitBackupPrompt()');
          }
        },
        {
          label: 'Open Backup Folder',
          click: () => {
            const { shell } = require('electron');
            const dir = getBackupDir();
            ensureBackupDir();
            shell.openPath(dir);
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    }
  ];
  
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC Handlers for backup/restore functionality

// Get list of backup files with their dates
ipcMain.handle('get-backup-files', async () => {
  try {
    const dir = getBackupDir();
    if (!fs.existsSync(dir)) return { decision: [], stress: [], history: [], taxYears: [] };

    const files = fs.readdirSync(dir);
    const result = { decision: [], stress: [], history: [], taxYears: [] };

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      const fileInfo = { name: file, path: filePath, mtime: stats.mtime.toISOString() };

      if (file.startsWith('pension-decision-') && file.endsWith('.json')) {
        result.decision.push(fileInfo);
      } else if (file.startsWith('pension-stress-') && file.endsWith('.json')) {
        result.stress.push(fileInfo);
      } else if (file.startsWith('pension-history-') && file.endsWith('.csv')) {
        result.history.push(fileInfo);
      } else if (file.startsWith('pension-taxyears-') && file.endsWith('.json')) {
        result.taxYears.push(fileInfo);
      }
    });

    // Sort by mtime descending (newest first)
    Object.keys(result).forEach(key => {
      result[key].sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
    });

    return result;
  } catch (err) {
    console.error('Error reading backup files:', err);
    return { decision: [], stress: [], history: [], taxYears: [] };
  }
});

// Read a specific backup file
ipcMain.handle('read-backup-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Write backup files to the backup directory
ipcMain.handle('write-backup-files', async (event, files) => {
  try {
    const dir = ensureBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const written = [];

    if (files.decision) {
      const filename = `pension-decision-${timestamp}.json`;
      fs.writeFileSync(path.join(dir, filename), files.decision);
      written.push(filename);
    }
    if (files.stress) {
      const filename = `pension-stress-${timestamp}.json`;
      fs.writeFileSync(path.join(dir, filename), files.stress);
      written.push(filename);
    }
    if (files.history) {
      const filename = `pension-history-${timestamp}.csv`;
      fs.writeFileSync(path.join(dir, filename), files.history);
      written.push(filename);
    }
    if (files.taxYears) {
      const filename = `pension-taxyears-${timestamp}.json`;
      fs.writeFileSync(path.join(dir, filename), files.taxYears);
      written.push(filename);
    }

    return { success: true, dir, written };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Get the backup directory path
ipcMain.handle('get-backup-dir', async () => {
  return getBackupDir();
});

// Show confirmation dialog
ipcMain.handle('show-confirm-dialog', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: options.type || 'question',
    buttons: options.buttons || ['Yes', 'No'],
    defaultId: 0,
    title: options.title || 'Confirm',
    message: options.message
  });
  return result.response;
});
