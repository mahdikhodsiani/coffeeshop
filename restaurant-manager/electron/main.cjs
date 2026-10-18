// ---- پروسه اصلی Electron برای نسخه ویندوز ----
// اجرا با: npm run electron:dev (در حالت توسعه) یا بسته‌بندی با electron-builder
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'مدیر رستوران',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // حذف منوی پیش‌فرض در حالت production
  if (!process.env.VITE_DEV_SERVER_URL) Menu.setApplicationMenu(null);

  // تمام‌صفحه کلید F11
  win.webContents.on('before-input-event', (e, input) => {
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
