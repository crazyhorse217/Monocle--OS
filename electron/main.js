const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path  = require('path');
const { spawn } = require('child_process');
const http  = require('http');

const PORT = 3000;
let win;
let serverProcess;

// ── Spawn bundled Express server ─────────────────────────────────────────────
function startServer() {
  const serverPath = path.join(process.resourcesPath, 'app', 'dist', 'server.js');

  serverProcess = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(PORT),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProcess.stdout.on('data', d => console.log('[server]', d.toString().trim()));
  serverProcess.stderr.on('data', d => console.error('[server]', d.toString().trim()));

  serverProcess.on('exit', (code) => {
    if (code !== 0 && win) {
      dialog.showErrorBox('Server Error', `The Monocle OS backend exited unexpectedly (code ${code}).`);
    }
  });
}

// ── Wait for the server to be ready before loading the window ────────────────
function waitForServer(retries = 30, delay = 300) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      http.get(`http://localhost:${PORT}/api/health`, (res) => {
        if (res.statusCode === 200) return resolve();
        tryAgain();
      }).on('error', tryAgain);
    };
    const tryAgain = () => {
      if (retries-- <= 0) return reject(new Error('Server did not start in time'));
      setTimeout(attempt, delay);
    };
    attempt();
  });
}

// ── Create BrowserWindow ──────────────────────────────────────────────────────
function createWindow() {
  win = new BrowserWindow({
    width:  1440,
    height: 900,
    minWidth:  1024,
    minHeight: 700,
    title: 'Monocle OS',
    backgroundColor: '#09090b',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox: true,
    },
    icon: path.join(__dirname, 'icon.png'),
    show: false,
  });

  win.loadURL(`http://localhost:${PORT}`);

  win.once('ready-to-show', () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });

  win.on('closed', () => { win = null; });
}

Menu.setApplicationMenu(null);

app.whenReady().then(async () => {
  startServer();
  try {
    await waitForServer();
  } catch (err) {
    dialog.showErrorBox('Startup Error', 'Monocle OS server failed to start.\n' + err.message);
    app.quit();
    return;
  }
  createWindow();
  app.on('activate', () => { if (!win) createWindow(); });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) serverProcess.kill();
});
