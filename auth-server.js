// Backend Node.js/Express para autenticação customizada Microsoft + Firebase (Electron)
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

// --- CONFIG FIREBASE ADMIN ---
// Substitua pelo caminho do seu arquivo de credenciais do Firebase Admin SDK
const serviceAccount = require('./firebase-admin.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Não é necessário MSAL no backend. Apenas decodificação do accessToken recebido do Electron.

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Recebe o accessToken do MSAL/Electron e retorna um custom token do Firebase
app.post('/auth/microsoft', async (req, res) => {
    let { accessToken } = req.body;
    console.log('accessToken recebido:', accessToken);
    if (!accessToken) {
        console.error('accessToken ausente no body:', req.body);
        return res.status(400).json({ error: 'accessToken ausente' });
    }
    // Remove 'Bearer ' se vier junto
    if (accessToken.startsWith('Bearer ')) {
        accessToken = accessToken.slice(7);
    }
    try {
        // Espera receber um JWT (idToken) do frontend
        const parts = accessToken.split('.');
        if (parts.length !== 3) {
            console.error('Token recebido não é JWT:', accessToken);
            return res.status(400).json({ error: 'Token recebido não é JWT', accessToken });
        }
        let payload;
        try {
            payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        } catch (e) {
            console.error('Erro ao decodificar payload JWT:', e, parts[1]);
            return res.status(400).json({ error: 'Erro ao decodificar payload JWT', jwt: parts[1] });
        }
        console.log('Payload JWT do idToken:', payload);
        const uid = payload.oid || payload.sub || payload.email || payload.preferred_username || payload.upn;
        if (!uid) {
            console.error('Não foi possível extrair o usuário do token. Payload:', payload);
            return res.status(400).json({ error: 'Não foi possível extrair o usuário do token.', payload });
        }
        // Gera empresaId a partir do email (após @, sem caracteres especiais)
        let empresaId = 'empresa_padrao';
        if (payload.email && payload.email.includes('@')) {
            empresaId = payload.email.split('@')[1].replace(/\W/g, '').toLowerCase();
        } else if (payload.preferred_username && payload.preferred_username.includes('@')) {
            empresaId = payload.preferred_username.split('@')[1].replace(/\W/g, '').toLowerCase();
        }
        // Adiciona empresaId como custom claim
        try {
            // Seta custom claim no usuário
            await admin.auth().setCustomUserClaims(uid, { empresaId });
            console.log('Custom claim empresaId setado para UID:', uid, 'empresaId:', empresaId);
            // Aguarda 1 segundo para garantir propagação do claim
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Cria custom token com empresaId
            const customToken = await admin.auth().createCustomToken(uid, { provider: 'microsoft', rawPayload: payload, empresaId });
            console.log('Custom token criado com sucesso para UID:', uid, 'empresaId:', empresaId);
            if (!customToken) {
                console.error('Custom token retornou vazio para UID:', uid);
                return res.status(500).json({ error: 'Custom token retornou vazio', uid });
            }
            res.json({ customToken });
        } catch (e) {
            console.error('Erro ao criar custom token do Firebase ou setar claims:', e);
            return res.status(500).json({ error: 'Erro ao criar custom token do Firebase ou setar claims', details: e.message });
        }
    } catch (err) {
        console.error('Erro inesperado no /auth/microsoft:', err);
        return res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Rota protegida para fornecer config do Firebase
app.get('/api/firebase-config', (req, res) => {
  res.json({
    apiKey: "AIzaSyDVnjI8Jcrx8OMciHwODQEUVEfuECGA_E0",
    authDomain: "sistema-pos-vendas.firebaseapp.com",
    projectId: "sistema-pos-vendas",
    storageBucket: "sistema-pos-vendas.appspot.com",
    messagingSenderId: "197847775983",
    appId: "1:197847775983:web:3cec7f6611677136ad391a",
    measurementId: "G-QX43WCWT42"
  });
});

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Auth server rodando em http://localhost:${PORT}`);
});
