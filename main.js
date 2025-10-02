// Inicia o backend IA automaticamente ao abrir o app Electron

const { spawn } = require('child_process');
// Usa o require('path') apenas uma vez
const path = require('path');
const backendPath = path.join(__dirname, 'backend-ia.js');
const backendProcess = spawn('node', [backendPath], {
  stdio: 'ignore',
  detached: true
});
backendProcess.unref();

// Inicia backend ANTES de qualquer require do Electron
try { require('./auth-server.js'); } catch(e) { /* ignora se já rodando */ }

// --- INÍCIO: Requires do Electron e dependências ---
const { app, BrowserWindow, ipcMain, autoUpdater } = require('electron');
// --- INÍCIO: AutoUpdater GitHub Releases ---
const server = 'https://update.electronjs.org';
const feed = `${server}/AlexandreTI65/sistema-pos-vendas/${process.platform}-${process.arch}/${app.getVersion()}`;

app.on('ready', () => {
  try {
    autoUpdater.setFeedURL({ url: feed });
    autoUpdater.checkForUpdates();
    autoUpdater.on('update-available', () => {
      console.log('[AutoUpdater] Nova atualização disponível. Baixando...');
    });
    autoUpdater.on('update-downloaded', () => {
      console.log('[AutoUpdater] Atualização baixada. Reiniciando para instalar...');
      autoUpdater.quitAndInstall();
    });
    autoUpdater.on('error', (err) => {
      console.error('[AutoUpdater] Erro:', err);
    });
  } catch (e) {
    console.error('[AutoUpdater] Falha ao inicializar:', e);
  }
});
// --- FIM: AutoUpdater ---
// const path = require('path'); // já declarado acima
const { getMicrosoftAuthUrl, getMicrosoftIdToken } = require('./msal-util');
// --- FIM: Requires do Electron e dependências ---

const MICROSOFT_REDIRECT_URI = 'http://localhost:3002/auth/microsoft/callback';

// --- INÍCIO: Login Microsoft OAuth2 ---
ipcMain.handle('microsoft-oauth', async () => {
  const authUrl = await getMicrosoftAuthUrl();
  let authWin = new BrowserWindow({ width: 500, height: 600, show: true });
  authWin.loadURL(authUrl);

  return new Promise((resolve, reject) => {
    let finished = false;
    authWin.webContents.on('will-redirect', async (event, url) => {
      console.log('[DEBUG][Microsoft OAuth2] will-redirect URL:', url);
      if (url.startsWith(MICROSOFT_REDIRECT_URI)) {
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code');
        console.log('[DEBUG][Microsoft OAuth2] code:', code);
        if (code) {
          try {
            console.log('[DEBUG][Microsoft OAuth2] Chamando getMicrosoftIdToken com code:', code);
            const tokens = await getMicrosoftIdToken(code); // { idToken, accessToken }
            console.log('[DEBUG][Microsoft OAuth2] Tokens recebidos:', tokens);
            if (!finished) {
              finished = true;
              resolve(tokens);
              if (authWin && !authWin.isDestroyed()) authWin.close();
            }
          } catch (err) {
            console.error('[DEBUG][Microsoft OAuth2] Erro ao obter tokens:', err);
            if (!finished) {
              finished = true;
              reject(err);
              if (authWin && !authWin.isDestroyed()) authWin.close();
            }
          }
        }
      }
    });
    authWin.on('closed', () => {
      if (!finished) {
        finished = true;
        reject(new Error('Login Microsoft cancelado ou janela fechada.'));
      }
    });
  }).catch(err => {
    // Evita UnhandledPromiseRejection
    console.error('[Microsoft OAuth2] Erro no fluxo:', err);
    throw err;
  });
});
// --- FIM: Login Microsoft OAuth2 ---

function createWindow() {
  const win = new BrowserWindow({
    fullscreen: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  win.loadFile('index.html');
}
// Integração OAuth2: recebe token do renderer
ipcMain.on('oauth-token', (event, token) => {
  // Aqui você pode salvar o token, validar, ou usar para autenticação global
  console.log('Token OAuth2 recebido do renderer:', token);
  // Exemplo: salvar em variável global
  global.oauthToken = token;
});


// --- INÍCIO: Login Google OAuth2 ---
const { google } = require('googleapis');
const CLIENT_ID = '628212872044-ju0umqmlj8clhv347jjq8skgkc0c8a0b.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:3001/auth/google/callback';

ipcMain.handle('google-oauth', async () => {
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email', 'openid']
  });

  let authWin = new BrowserWindow({ width: 500, height: 600, show: true });
  authWin.loadURL(authUrl);

  return new Promise((resolve, reject) => {
    authWin.webContents.on('will-redirect', async (event, url) => {
      if (url.startsWith(REDIRECT_URI)) {
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code');
        if (code) {
          try {
            const { tokens } = await oauth2Client.getToken(code);
            resolve(tokens.id_token);
            authWin.close();
          } catch (err) {
            reject(err);
            authWin.close();
          }
        }
      }
    });
  });
});
// --- FIM: Login Google OAuth2 ---


app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
