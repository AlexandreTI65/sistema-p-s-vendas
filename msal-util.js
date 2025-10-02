// Utilitário para OAuth2 Microsoft (MSAL Node)
// Não é um servidor, apenas funções para uso no Electron main.js
const { PublicClientApplication } = require('@azure/msal-node');

const config = {
    auth: {
    clientId: 'e3886ba1-df57-43ef-9680-2c34394da18f',
        authority: 'https://login.microsoftonline.com/common',
        redirectUri: 'http://localhost:3002/auth/microsoft/callback',
    }
};

const pca = new PublicClientApplication(config);

async function getMicrosoftAuthUrl() {
    const authCodeUrlParameters = {
        scopes: ["openid", "profile", "email"],
        redirectUri: config.auth.redirectUri,
    };
    return await pca.getAuthCodeUrl(authCodeUrlParameters);
}

async function getMicrosoftIdToken(authCode) {
    const tokenRequest = {
        code: authCode,
        scopes: ["openid", "profile", "email"],
        redirectUri: config.auth.redirectUri,
    };
    try {
        const response = await pca.acquireTokenByCode(tokenRequest);
        return {
            idToken: response.idToken,
            accessToken: response.accessToken
        };
    } catch (err) {
        console.error('[MSAL][getMicrosoftIdToken] Erro ao trocar code por token:', err);
        throw err;
    }
}

module.exports = { getMicrosoftAuthUrl, getMicrosoftIdToken };