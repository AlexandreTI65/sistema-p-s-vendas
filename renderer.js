// Função global para logout do usuário e exibir tela de login
window.logoutUsuario = function() {
    if (window.firebase && window.firebase.auth) {
        window.firebase.auth().signOut().then(function() {
            var loginContainer = document.getElementById('login-container');
            var sistema = document.getElementById('sistema-pos-vendas');
            if (loginContainer) loginContainer.style.display = 'flex';
            if (sistema) sistema.style.display = 'none';
        });
    } else {
        // fallback: só mostra login
        var loginContainer = document.getElementById('login-container');
        var sistema = document.getElementById('sistema-pos-vendas');
        if (loginContainer) loginContainer.style.display = 'flex';
        if (sistema) sistema.style.display = 'none';
    }
};
// Função global para envio de mensagem do chatbot com integração IA
window.enviarMsgChatbot = async function(event) {
    event.preventDefault();
    const input = document.getElementById('chatbotInput');
    const messages = document.getElementById('chatbotMessages');
    if (input && input.value.trim() && messages) {
        const msg = input.value.trim();
        // Adiciona a mensagem do usuário ao chat
        const divUser = document.createElement('div');
        divUser.style.margin = '6px 0 6px 0';
        divUser.style.textAlign = 'right';
        divUser.innerHTML = `<span style=\"background:#1976d2;color:#fff;padding:7px 14px;border-radius:16px;display:inline-block;max-width:80%;font-size:1em;\">${msg}</span>`;
        messages.appendChild(divUser);
        messages.scrollTop = messages.scrollHeight;
        input.value = '';

        // Adiciona indicador de carregando
        const divBot = document.createElement('div');
        divBot.style.margin = '6px 0 6px 0';
        divBot.style.textAlign = 'left';
            divBot.innerHTML = `<span style=\"background:#eee;color:#1976d2;padding:7px 14px;border-radius:16px;display:inline-block;max-width:80%;font-size:1em;opacity:0.7;\">DOUD está digitando...</span>`;
        messages.appendChild(divBot);
        messages.scrollTop = messages.scrollHeight;

        // Chama backend IA
        try {
            const resp = await fetch('http://localhost:3030/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mensagem: msg })
            });
            const data = await resp.json();
            if (data.resposta) {
                divBot.innerHTML = `<span style=\"background:#43a047;color:#fff;padding:7px 14px;border-radius:16px;display:inline-block;max-width:80%;font-size:1em;\">${data.resposta.replace(/\n/g,'<br>')}</span>`;
            } else {
                divBot.innerHTML = `<span style=\"background:#e53935;color:#fff;padding:7px 14px;border-radius:16px;display:inline-block;max-width:80%;font-size:1em;\">Erro ao obter resposta da IA.</span>`;
            }
            messages.scrollTop = messages.scrollHeight;
        } catch (e) {
            divBot.innerHTML = `<span style=\"background:#e53935;color:#fff;padding:7px 14px;border-radius:16px;display:inline-block;max-width:80%;font-size:1em;\">Erro de conexão com IA.</span>`;
            messages.scrollTop = messages.scrollHeight;
        }
    }
};
// Stub para evitar erro caso algum código externo tente chamar
window.atualizarListaClientesUI = function() { /* função inexistente, mantida só para compatibilidade */ };
// Utilitário para garantir que o Firebase está pronto antes de qualquer uso
function isFirebaseReady() {
    return (
        typeof firebase !== 'undefined' &&
        firebase.apps &&
        firebase.apps.length > 0 &&
        typeof firebase.auth === 'function' &&
        typeof firebase.firestore === 'function'
    );
}
if (typeof firebase === 'undefined') {
    console.error('[FATAL] firebase NÃO está definido no início do renderer.js');
} else {
    let user = null;
    try {
        if (firebase.auth && typeof firebase.auth === 'function' && firebase.apps && firebase.apps.length > 0) {
            user = firebase.auth().currentUser;
        }
    } catch (e) {
        console.warn('[DEBUG] firebase.auth() não está pronto:', e);
    }
    console.log('[DEBUG] JS carregado - empresaId:', window._empresaIdUsuario, 'user:', user);
    console.log('[DEBUG] firebase está definido:', firebase);
}
// Função global para abrir o chatbot (evita erro de referência no HTML)
window.abrirChatbot = function() {
    var box = document.getElementById('chatbotBox');
    if (box) box.style.display = 'flex';
    console.log('Chatbot opened'); // New log statement added
};

// Função global para login Microsoft OAuth2 + Firebase
window.loginMicrosoft = async function() {
    // Aguarda o Firebase estar pronto antes de prosseguir
    if (!window.firebasePronto) {
        let tentativas = 0;
        while (!window.firebasePronto && tentativas < 50) { // até 5 segundos
            await new Promise(res => setTimeout(res, 100));
            tentativas++;
        }
        if (!window.firebasePronto) {
            alert('Firebase ainda não inicializado. Aguarde alguns segundos e tente novamente.');
            return;
        }
    }
    const { ipcRenderer } = require('electron');
    try {
        // 1. Obtenha os tokens do MSAL/Electron (main.js deve retornar { idToken, accessToken })
        const tokens = await ipcRenderer.invoke('microsoft-oauth'); // { idToken, accessToken }
        console.log('[DEBUG][Microsoft OAuth2][renderer] Tokens recebidos:', tokens);
        if (!tokens || (!tokens.idToken && !tokens.accessToken)) {
            alert('Não foi possível obter o token do Microsoft.');
            return;
        }
        // 2. Envie o idToken (JWT) ou accessToken para o backend e obtenha o custom token do Firebase
        const response = await fetch('http://localhost:4000/auth/microsoft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: tokens.idToken || tokens.accessToken })
        });
        const data = await response.json();
        if (!data.customToken) {
            alert('Erro ao obter custom token do backend: ' + (data.error || 'Erro desconhecido'));
            return;
        }
        // 3. Faça login no Firebase com o custom token
        if (!window.firebasePronto) {
            alert('Firebase não está pronto para autenticação. Tente novamente.');
            return;
        }
        if (!isFirebaseReady()) {
            alert('Firebase não está pronto para autenticação. Tente novamente.');
            return;
        }
        firebase.auth().signInWithCustomToken(data.customToken)
            .then(() => {
                // Esconde tela de login e mostra sistema
                const loginContainer = document.getElementById('login-container');
                if (loginContainer) loginContainer.style.display = 'none';
                const sistema = document.getElementById('sistema-pos-vendas');
                if (sistema) sistema.style.display = '';
                alert('Login Microsoft/Firebase realizado com sucesso!');
            })
            .catch((error) => {
                alert('Erro ao autenticar no Firebase: ' + error.message);
            });
    } catch (err) {
        alert('Erro no login Microsoft: ' + err.message);
    }
};
// --- PERFIS E PERMISSÕES DE USUÁRIO ---
// Salva o perfil do usuário no Firestore se não existir (executa no login)
async function garantirPerfilUsuario(user) {
    if (!user || !user.uid) {
        console.error('[DEBUG] Usuário inválido em garantirPerfilUsuario:', user);
        return;
    }
    const db = getFirestoreDb();
    const docRef = db.collection('usuarios').doc(user.uid);
    const doc = await docRef.get();
    // Geração de empresaId: se já existir, mantém; se não, gera a partir do email (exemplo: tudo após @)
    let empresaId = null;
    if (doc.exists && doc.data().empresaId) {
        empresaId = doc.data().empresaId;
    } else if (user.email && user.email.includes('@')) {
        empresaId = user.email.split('@')[1].replace(/\W/g, '').toLowerCase();
    } else {
        empresaId = 'empresa_padrao';
    }
    if (!doc.exists) {
        // Primeiro login: padrão "usuario" (admin só manualmente)
        await docRef.set({
            uid: user.uid,
            email: user.email || '',
            nome: user.displayName || '',
            perfil: 'usuario',
            empresaId: empresaId || 'empresa_padrao',
            criadoEm: new Date().toISOString()
        });
        window._perfilUsuario = 'usuario';
        window._empresaIdUsuario = empresaId || 'empresa_padrao';
        console.log('[DEBUG] empresaId definido (primeiro login):', window._empresaIdUsuario);
    } else {
        window._perfilUsuario = doc.data().perfil || 'usuario';
        window._empresaIdUsuario = doc.data().empresaId || empresaId || 'empresa_padrao';
        console.log('[DEBUG] empresaId definido (login existente):', window._empresaIdUsuario);
    }
}

// Função para checar se usuário é admin
function usuarioEhAdmin() {
    return window._perfilUsuario === 'admin';
}

console.log('[DEBUG] renderer.js carregado:', document.location.pathname);
// --- INÍCIO: Login Google OAuth2 + Firebase ---
window.loginGoogle = async function() {
    const { ipcRenderer } = require('electron');
    try {
        const idToken = await ipcRenderer.invoke('google-oauth');
        // Use o idToken para autenticar no Firebase
        if (!isFirebaseReady()) {
            alert('Firebase não está pronto para autenticação. Tente novamente.');
            return;
        }
        const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
        firebase.auth().signInWithCredential(credential)
            .then((result) => {
                alert('Login Google/Firebase realizado com sucesso!');
                // Aqui você pode atualizar a UI conforme necessário
            })
            .catch((error) => {
                alert('Erro ao autenticar no Firebase: ' + error.message);
            });
    } catch (err) {
        alert('Erro no login Google: ' + err.message);
    }
};
// Função global para fechar modal de relatório (caso usado em algum botão)
window.fecharModalRelatorio = function() {
    const modal = document.getElementById('modalRelatorio');
    if (modal) modal.remove();
};
window.gerarRelatorioInsatisfeitos = async function() {
    const painel = document.getElementById('mensagemRelatorio');
    painel.innerHTML = `<div style='margin-bottom:18px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;'>
        <label>Empresa: <input id='filtroEmpresaInsat' type='text' style='margin-left:4px;padding:4px 8px;border-radius:6px;border:1.5px solid #e53935;'></label>
        <label>Nota: <select id='filtroNotaInsat' style='margin-left:4px;padding:4px 8px;border-radius:6px;border:1.5px solid #e53935;'>
            <option value=''>Todas</option><option value='1'>1</option><option value='2'>2</option><option value='3'>3</option><option value='4'>4</option><option value='5'>5</option>
        </select></label>
        <label>Período: <input id='filtroDataIniInsat' type='date'> a <input id='filtroDataFimInsat' type='date'></label>
        <button onclick='window.aplicarFiltroRelatorioInsatisfeitos()' style='background:#e53935;color:#fff;font-weight:bold;padding:7px 18px;border-radius:7px;border:none;cursor:pointer;'>Filtrar</button>
    </div>
    <div id='tabelaRelatorioInsatisfeitos'></div>`;
    window.aplicarFiltroRelatorioInsatisfeitos();
};
window.aplicarFiltroRelatorioInsatisfeitos = async function() {
    const empresa = document.getElementById('filtroEmpresaInsat')?.value.trim().toLowerCase();
    const nota = document.getElementById('filtroNotaInsat')?.value;
    const dataIni = document.getElementById('filtroDataIniInsat')?.value;
    const dataFim = document.getElementById('filtroDataFimInsat')?.value;
    const tabela = document.getElementById('tabelaRelatorioInsatisfeitos');
    tabela.innerHTML = '<div style="color:#888;font-size:1.1em;">Buscando...</div>';
    try {
        const db = getFirestoreDb();
        const empresaId = window._empresaIdUsuario;
        let query = db.collection('insatisfeitos').where('empresaId', '==', empresaId);
        const snap = await query.get();
        let lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (empresa) lista = lista.filter(i => (i.empresa||'').toLowerCase().includes(empresa));
        if (nota) lista = lista.filter(i => String(i.pontuacao||i.nota||'') === nota);
        if (dataIni) lista = lista.filter(i => i.dataPesquisa && i.dataPesquisa >= dataIni);
        if (dataFim) lista = lista.filter(i => i.dataPesquisa && i.dataPesquisa <= dataFim);
        if (!lista.length) {
            tabela.innerHTML = '<div style="color:#e53935;font-weight:bold;">Nenhum insatisfeito encontrado.</div>';
            return;
        }
        let html = '<table style="width:100%;border-collapse:collapse;margin-top:8px;background:#fff3e0;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px #e5393522;">';
        html += '<tr style="background:#e53935;color:#fff;font-weight:bold;"><th style="padding:8px 6px;">Empresa</th><th>Cliente</th><th>Nota</th><th>Data</th><th>Motivo</th><th>Detalhes</th></tr>';
        for (const i of lista) {
            html += `<tr style=\"border-bottom:1px solid #fbe9e7;\">
                <td style=\"padding:7px 6px;\">${i.empresa || '-'}<\/td>
                <td>${i.nomeCliente || '-'}<\/td>
                <td>${i.pontuacao || i.nota || '-'}<\/td>
                <td>${i.dataPesquisa || '-'}<\/td>
                <td>${i.motivo || '-'}<\/td>
                <td><button onclick=\"window.mostrarDetalheInsatisfeitoRelatorio && window.mostrarDetalheInsatisfeitoRelatorio('${i.id}')\" style=\"background:#e53935;color:#fff;font-weight:bold;padding:4px 12px;border-radius:6px;border:none;cursor:pointer;\">Ver</button></td>
            <\/tr>`;
        }
        html += '</table>';
        tabela.innerHTML = html;
        window._relatorioInsatisfeitosCache = lista;
    } catch (e) {
        tabela.innerHTML = '<span style="color:#e53935;font-weight:bold;">Erro ao consultar: ' + (e && e.message ? e.message : e) + '</span>';
    }
};

window.mostrarDetalheInsatisfeitoRelatorio = function(id) {
    const lista = window._relatorioInsatisfeitosCache || [];
    const insat = lista.find(i => i.id === id);
    if (!insat) return alert('Registro não encontrado!');
    const win = window.open('', '', 'width=800,height=700');
    win.document.write('<html><head><title>Detalhes do Insatisfeito</title>');
    win.document.write('<style>body{font-family:Montserrat,Segoe UI,Arial,sans-serif;background:#fff3e0;padding:32px;}h2{color:#e53935;}table{border-collapse:collapse;width:100%;margin-top:18px;}th,td{padding:10px 14px;font-size:1.13em;border-bottom:1px solid #fbe9e7;}th{background:#e53935;color:#fff;text-align:left;}tr:last-child td{border-bottom:none;}button{margin-top:24px;background:#e53935;color:#fff;font-weight:bold;padding:10px 32px;border:none;border-radius:8px;cursor:pointer;font-size:1.1em;}</style>');
    win.document.write('</head><body>');
    win.document.write('<h2>Detalhes do Insatisfeito</h2>');
    win.document.write('<table>');
    win.document.write('<tr><th>Empresa</th><td>' + (insat.empresa || '-') + '</td></tr>');
    win.document.write('<tr><th>Cliente</th><td>' + (insat.nomeCliente || '-') + '</td></tr>');
    win.document.write('<tr><th>Nota</th><td>' + (insat.pontuacao || insat.nota || '-') + '</td></tr>');
    win.document.write('<tr><th>Data</th><td>' + (insat.dataPesquisa || '-') + '</td></tr>');
    win.document.write('<tr><th>Motivo</th><td>' + (insat.motivo || '-') + '</td></tr>');
    win.document.write('<tr><th>Observações</th><td>' + (insat.observacoes || '-') + '</td></tr>');
    win.document.write('</table>');
    win.document.write('<button onclick="window.close()">Fechar</button>');
    win.document.write('</body></html>');
    win.document.close();
};
// Consulta clientes no Firestore e exibe em tabela
window.consultarClientesAcao = async function() {
    console.log('[DEBUG] consultarClientesAcao - empresaId:', window._empresaIdUsuario);
    const termo = document.getElementById('buscaCliente')?.value.trim().toLowerCase();
    const tabelaBox = document.getElementById('tabelaClientesBox');
    tabelaBox.innerHTML = '<div style="color:#888;font-size:1.1em;">Buscando...</div>';
    try {
        const db = getFirestoreDb();
        const empresaId = window._empresaIdUsuario;
        if (!empresaId) {
        tabelaBox.innerHTML = '<span style="color:#e53935;font-weight:bold;">Erro ao consultar: empresaId não definido.</span>';
            return;
        }
        let query = db.collection('clientes').where('empresaId', '==', empresaId);
        const snap = await query.get();
        let lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (termo) {
            lista = lista.filter(cli =>
                (cli.nome && cli.nome.toLowerCase().includes(termo)) ||
                (cli.email && cli.email.toLowerCase().includes(termo)) ||
                (cli.empresa && cli.empresa.toLowerCase().includes(termo)) ||
                (cli.cnpj && cli.cnpj.toLowerCase().includes(termo))
            );
        }
        if (!lista.length) {
            tabelaBox.innerHTML = '<div style="color:#e53935;font-weight:bold;">Nenhum cliente encontrado.</div>';
            return;
        }
        window._clientesCache = lista;
        let html = '<table style="width:100%;border-collapse:collapse;margin-top:8px;background:#f6f8fc;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px #1976d211;">';
        html += '<tr style="background:#1976d2;color:#fff;font-weight:bold;"><th style="padding:8px 6px;">CNPJ</th><th>Empresa</th><th>Ações</th></tr>';
        for (const cli of lista) {
            html += `<tr style=\"border-bottom:1px solid #e3e3e3;cursor:pointer;\" onclick=\"window.mostrarDetalheCliente && window.mostrarDetalheCliente('${cli.id}')\">
                <td style=\"padding:7px 6px;\">${cli.cnpj || '-'}<\/td>
                <td>${cli.empresa || '-'}<\/td>
                <td style='padding:7px 6px;'><button style='background:#e53935;color:#fff;border:none;border-radius:6px;padding:2px 10px;font-size:0.95em;cursor:pointer;' onclick='event.stopPropagation();window.excluirClienteFirebase && window.excluirClienteFirebase("${cli.id}")'>Excluir</button></td>
            <\/tr>`;
        }
        html += '</table>';
        tabelaBox.innerHTML = html;
    } catch (e) {
        tabelaBox.innerHTML = '<span style="color:#e53935;font-weight:bold;">Erro ao consultar: ' + (e && e.message ? e.message : e) + '</span>';
    }
};
// Excluir cliente do Firebase (global)
window.excluirClienteFirebase = async function(id) {
    if (!usuarioEhAdmin()) {
        alert('Apenas administradores podem excluir clientes.');
        return;
    }
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    try {
        const db = getFirestoreDb();
        await db.collection('clientes').doc(id).delete();
        window.consultarClientesAcao();
    } catch (e) {
        alert('Erro ao excluir do banco de dados.');
    }
}
// Exibe página com detalhes do cliente ao clicar na tabela
window.mostrarDetalheCliente = async function(id) {
    const lista = window._clientesCache || [];
    const cli = lista.find(c => c.id === id);
    if (!cli) return alert('Cliente não encontrado!');
    try {
        const db = getFirestoreDb();
        const user = firebase.auth().currentUser;
        // Verifica se já está em edição por outro usuário
        const docRef = db.collection('clientes').doc(id);
        const doc = await docRef.get();
        const emEdicao = doc.data() && doc.data().emEdicao;
        if (emEdicao && emEdicao.uid && emEdicao.uid !== (user ? user.uid : null) && Date.now() - (emEdicao.timestamp || 0) < 10*60*1000) {
            alert('Este registro está sendo editado por outro usuário. Aguarde ou tente novamente mais tarde.');
            return;
        }
        // Marca como em edição
        await docRef.update({ emEdicao: { uid: user ? user.uid : null, timestamp: Date.now() } });
        // Ao fechar, remove o lock
        const removerLock = async () => { try { await docRef.update({ emEdicao: null }); } catch(e){} };
        const win = window.open('', '', 'width=700,height=600');
        win.onbeforeunload = removerLock;
        win.document.write('<html><head><title>Detalhes do Cliente</title>');
        win.document.write('<style>body{font-family:Montserrat,Segoe UI,Arial,sans-serif;background:#f6f8fc;padding:32px;}h2{color:#1976d2;}table{border-collapse:collapse;width:100%;margin-top:18px;}th,td{padding:10px 14px;font-size:1.13em;border-bottom:1px solid #e3e3e3;}th{background:#1976d2;color:#fff;text-align:left;}tr:last-child td{border-bottom:none;}button{margin-top:24px;background:#1976d2;color:#fff;font-weight:bold;padding:10px 32px;border:none;border-radius:8px;cursor:pointer;font-size:1.1em;}</style>');
        win.document.write('</head><body>');
        win.document.write('<h2>Detalhes do Cliente</h2>');
        win.document.write('<table>');
        win.document.write('<tr><th>Nome</th><td>' + (cli.nome || '-') + '</td></tr>');
        win.document.write('<tr><th>Email</th><td>' + (cli.email || '-') + '</td></tr>');
        win.document.write('<tr><th>CNPJ</th><td>' + (cli.cnpj || '-') + '</td></tr>');
        win.document.write('<tr><th>Empresa</th><td>' + (cli.empresa || '-') + '</td></tr>');
        win.document.write('<tr><th>Endereço</th><td>' + (cli.endereco || '-') + '</td></tr>');
        win.document.write('</table>');
        win.document.write('<button onclick="window.close()">Fechar</button>');
        win.document.write('</body></html>');
        win.document.close();
    } catch (e) {
        alert('Erro ao consultar detalhes do cliente: ' + (e && e.message ? e.message : e));
    }
}
// Salvar cadastro de cliente no Firestore
window.cadastrarClienteAcao = async function() {
    const nome = document.getElementById('nomeCliente')?.value.trim();
    const email = document.getElementById('emailCliente')?.value.trim();
    const cnpj = document.getElementById('cnpjCliente')?.value.trim();
    const empresa = document.getElementById('empresaCliente')?.value.trim();
    const endereco = document.getElementById('enderecoCliente')?.value.trim();
    if (!nome || !email) {
        document.getElementById('mensagemCliente').innerHTML = '<span style="color:#e53935;font-weight:bold;">Preencha nome e e-mail!</span>';
        return;
    }
    try {
        const db = getFirestoreDb();
        const user = firebase.auth().currentUser;
        const empresaId = window._empresaIdUsuario || (user && user.email ? user.email.split('@')[1].replace(/\W/g, '').toLowerCase() : 'empresa_padrao');
        await db.collection('clientes').add({
            nome,
            email,
            cnpj,
            empresa,
            endereco,
            criadoEm: new Date(),
            uid: user ? user.uid : null,
            empresaId: empresaId
        });
        document.getElementById('mensagemCliente').innerHTML = '<span style="color:#43a047;font-weight:bold;">Cliente cadastrado com sucesso!</span>';
        document.getElementById('nomeCliente').value = '';
        document.getElementById('emailCliente').value = '';
        document.getElementById('cnpjCliente').value = '';
        document.getElementById('empresaCliente').value = '';
        document.getElementById('enderecoCliente').value = '';
    } catch (e) {
        document.getElementById('mensagemCliente').innerHTML = '<span style="color:#e53935;font-weight:bold;">Erro ao cadastrar: ' + (e && e.message ? e.message : e) + '</span>';
    }
}
// Imprimir Insatisfeito em layout profissional
window.imprimirInsatisfeito = function(id) {
    const insat = (window._insatisfeitosCache || []).find(s => s.id === id);
    if (!insat) return alert('Registro não encontrado!');
    const win = window.open('', '', 'width=900,height=1200');
    win.document.write('<html><head><title>Formulário Insatisfeito</title>');
    win.document.write('<style>@media print {html,body{width:210mm;height:297mm;margin:0;padding:0;background:#fff;}body{box-sizing:border-box;width:210mm;height:297mm;margin:0 auto;padding:18mm 12mm 18mm 12mm;display:flex;flex-direction:column;justify-content:flex-start;align-items:stretch;}.titulo-form{margin-top:0;}table{page-break-inside:avoid;}}body{font-family:Arial,Segoe UI,sans-serif;padding:24px;background:#fff;}table{border-collapse:collapse;width:100%;margin-bottom:18px;}th,td{border:1px solid #222;padding:6px 8px;font-size:1em;}th{background:#f6f8fc;}.titulo-form{font-size:1.25em;font-weight:bold;text-align:center;margin-bottom:18px;}</style>');
    win.document.write('</head><body>');
        win.document.write('<div class="titulo-form">FORMULÁRIO DE ANÁLISE DE NOTA INSATISFEITA</div>');
        win.document.write('<table><tr><th>Empresa</th><th>Telefone</th><th>Endereço</th><th>Data Pesquisa</th></tr>');
        win.document.write('<tr><td>' + (insat.empresa || '') + '</td><td>' + (insat.telefone || '') + '</td><td>' + (insat.endereco || '') + '</td><td>' + (insat.dataPesquisa || '') + '</td></tr></table>');
        win.document.write('<table><tr><th>Nome Cliente</th><th>Contato Empresa</th><th>Data do Contato</th></tr>');
        win.document.write('<tr><td>' + (insat.nomeCliente || '') + '</td><td>' + (insat.contatoEmpresa || '') + '</td><td>' + (insat.dataContato || '') + '</td></tr></table>');
        win.document.write('<div><b>MAXIFORCE:</b> ' + (insat.mx ? 'Sim' : 'Não') + ' | <b>PYRAMID:</b> ' + (insat.py ? 'Sim' : 'Não') + '</div>');
        win.document.write('<div style="margin-top:18px;font-size:1.13em;"><b>Respostas da Pesquisa:</b></div>');
        const perguntas = [
            'Referente ao atendimento do Depto de Vendas, qual o seu nível de satisfação?',
            'Referente ao Prazo de Entrega dos produtos, qual o seu nível de satisfação?',
            'Referente à Qualidade dos Produtos, qual o seu nível de satisfação?',
            'Referente ao Suporte do Pós Venda, qual o seu nível de satisfação?',
            'Referente ao atendimento do Depto Financeiro (Negociações / Emissão dos Boletos....etc.), qual o seu nível de satisfação?',
            'Qual o seu nível de satisfação com a relação ao custo-benefício dos produtos adquiridos?',
            'Qual o seu nível de satisfação com a experiência de compra junto à nossa Empresa?'
        ];
        const emojiscale = {
            '1': '😡 1 - Pouco Satisfeito',
            '2': '😕 2 - Baixa Satisfação',
            '3': '😐 3 - Regular',
            '4': '🙂 4 - Satisfeito',
            '5': '😃 5 - Muito Satisfeito'
        };
        win.document.write('<table style="margin-top:8px;width:100%"><tr><th style="width:60%">Pergunta</th><th style="width:40%">Resposta</th></tr>');
        for (let i = 1; i <= 7; i++) {
            const val = insat['q'+i+'i'] || '-';
            win.document.write('<tr><td>' + perguntas[i-1] + '</td><td>' + (emojiscale[val] || '-') + '</td></tr>');
        }
        win.document.write('</table>');
        win.document.write('<div style="margin-top:10px;"><b>Observações:</b> ' + (insat.observacoes || '') + '</div>');
    win.document.write('</body></html>');
    win.document.close();
    win.onload = function() { win.print(); };
    setTimeout(() => { try { win.print(); } catch(e){} }, 500);
}
// Salvar formulário de insatisfeito no Firestore
window.registrarInsatisfeitoForm = async function() {
    // O formulário correto é o formInsatisfeitoForm
    const form = document.getElementById('formInsatisfeitoForm');
    if (!form) return;
    const user = firebase.auth().currentUser;
    const empresaId = window._empresaIdUsuario || (user && user.email ? user.email.split('@')[1].replace(/\W/g, '').toLowerCase() : 'empresa_padrao');
    const data = {
        empresa: form.empresaInsatisfeito?.value || '',
        nomeCliente: form.nomeClienteInsatisfeito?.value || '',
        telefone: form.telefoneInsatisfeito?.value || '',
        email: form.emailInsatisfeito?.value || '',
        endereco: form.enderecoInsatisfeito?.value || '',
        dataPesquisa: form.dataPesquisaInsatisfeito?.value || '',
        produto: form.produtoInsatisfeito?.value || '',
        quantidade: form.quantidadeInsatisfeito?.value || '',
        lote: form.loteInsatisfeito?.value || '',
        valor: form.valorInsatisfeito?.value || '',
        motivo: form.motivoInsatisfeito?.value || '',
        status: form.statusInsatisfeito?.value || '',
        pontuacao: form.pontuacaoInsatisfeito?.value || '',
        observacoes: form.observacoesInsatisfeito?.value || '',
        contatoEmpresa: form.contatoEmpresaInsatisfeito?.value || '',
        dataContato: form.dataContatoInsatisfeito?.value || '',
        mx: form.mxInsatisfeito?.checked || false,
        py: form.pyInsatisfeito?.checked || false,
        q1i: form.q1i?.value || '',
        q2i: form.q2i?.value || '',
        q3i: form.q3i?.value || '',
        q4i: form.q4i?.value || '',
        q5i: form.q5i?.value || '',
        q6i: form.q6i?.value || '',
        q7i: form.q7i?.value || '',
        criadoEm: new Date().toISOString(),
        uid: user ? user.uid : null,
        empresaId: empresaId
    };
    try {
        const db = getFirestoreDb();
        await db.collection('insatisfeitos').add(data);
        alert('Formulário Insatisfeito salvo com sucesso!');
        form.reset();
        window.consultarInsatisfeitosFirebase();
    } catch (e) {
        alert('Erro ao salvar Insatisfeito: ' + (e && e.message ? e.message : e));
    }
}
// Excluir insatisfeito do Firestore
window.excluirInsatisfeitoFirebase = async function(id) {
    if (!id) return alert('ID do insatisfeito não informado!');
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;
    try {
        const db = getFirestoreDb();
        await db.collection('insatisfeitos').doc(id).delete();
        window._insatisfeitosCache = (window._insatisfeitosCache || []).filter(s => s.id !== id);
        if (typeof atualizarListaInsatisfeitosUI === 'function') atualizarListaInsatisfeitosUI(window._insatisfeitosCache);
        // Fecha janela de detalhe se aberta
        if (window.close) try { window.close(); } catch(e){}
        alert('Registro excluído com sucesso!');
    } catch (e) {
        alert('Erro ao excluir: ' + (e && e.message ? e.message : e));
    }
}
// Exibe detalhes do insatisfeito inline abaixo da lista
window.mostrarDetalheInsatisfeito = function(id) {
        const insat = (window._insatisfeitosCache || []).find(s => s.id === id);
        if (!insat) return alert('Registro não encontrado!');
        // Cria nova página com detalhes
        const win = window.open('', '_blank');
        if (!win) return alert('Não foi possível abrir nova janela.');
        win.document.write(`
            <html><head><title>Detalhes do Insatisfeito</title>
            <style>
                body { font-family: Arial, sans-serif; background: #fff3e0; margin:0; padding:0; }
                .container { max-width: 650px; margin: 32px auto; background: #fff; border:2px solid #e53935; border-radius:16px; box-shadow:0 2px 12px #e5393522; padding:32px 32px 24px 32px; }
                h2 { color:#e53935; font-size:2em; margin-bottom:18px; display:flex; align-items:center; gap:10px; }
                .info { margin-bottom:10px; font-size:1.13em; }
                .label { color:#e53935; font-weight:bold; min-width:120px; display:inline-block; }
                .botoes { margin-top:32px; display:flex; gap:18px; }
                button { font-size:1.1em; padding:10px 28px; border-radius:8px; cursor:pointer; font-weight:bold; border:none; }
                .imprimir { background:#1976d2; color:#fff; }
                .excluir { background:#fff; color:#e53935; border:2px solid #e53935; }
                .grupo { margin-bottom:18px; }
                .grupo-titulo { color:#b71c1c; font-size:1.08em; font-weight:bold; margin-bottom:6px; }
                .campo { margin-bottom:6px; }
            </style>
            </head><body><div class='container'>
                <h2><span style='font-size:1.3em;'>😡</span> Detalhes do Insatisfeito</h2>
                                <div class='grupo'>
                                    <div class='grupo-titulo'>Dados do Cliente</div>
                                    <div class='campo'><span class='label'>Empresa:</span> ${insat.empresa || '-'}</div>
                                    <div class='campo'><span class='label'>Cliente:</span> ${insat.nomeCliente || '-'}</div>
                                    <div class='campo'><span class='label'>Telefone:</span> ${insat.telefone || '-'}</div>
                                    <div class='campo'><span class='label'>E-mail:</span> ${insat.email || '-'}</div>
                                    <div class='campo'><span class='label'>Endereço:</span> ${insat.endereco || '-'}</div>
                                    <div class='campo'><span class='label'>Data da Pesquisa:</span> ${insat.dataPesquisa || '-'}</div>
                                    <div class='campo'><span class='label'>Contato Empresa:</span> ${insat.contatoEmpresa || '-'}</div>
                                    <div class='campo'><span class='label'>Data do Contato:</span> ${insat.dataContato || '-'}</div>
                                    <div class='campo'><span class='label'>MAXIFORCE:</span> ${insat.mx ? 'Sim' : 'Não'}</div>
                                    <div class='campo'><span class='label'>PYRAMID:</span> ${insat.py ? 'Sim' : 'Não'}</div>
                                </div>
                                <div class='grupo'>
                                    <div class='grupo-titulo'>Respostas da Pesquisa</div>
                                    <div class='campo'><span class='label'>1) Atendimento Vendas:</span> ${insat.q1i || '-'}</div>
                                    <div class='campo'><span class='label'>2) Prazo Entrega:</span> ${insat.q2i || '-'}</div>
                                    <div class='campo'><span class='label'>3) Qualidade Produtos:</span> ${insat.q3i || '-'}</div>
                                    <div class='campo'><span class='label'>4) Suporte Pós Venda:</span> ${insat.q4i || '-'}</div>
                                    <div class='campo'><span class='label'>5) Atendimento Financeiro:</span> ${insat.q5i || '-'}</div>
                                    <div class='campo'><span class='label'>6) Custo-benefício:</span> ${insat.q6i || '-'}</div>
                                    <div class='campo'><span class='label'>7) Experiência de Compra:</span> ${insat.q7i || '-'}</div>
                                </div>
                <div class='botoes'>
                    <button class='imprimir' onclick='window.opener && window.opener.imprimirInsatisfeito && window.opener.imprimirInsatisfeito("${insat.id}")'>Imprimir</button>
                    <button class='excluir' onclick='window.opener && window.opener.excluirInsatisfeitoFirebase && window.opener.excluirInsatisfeitoFirebase("${insat.id}"); window.close();'>Excluir</button>
                </div>
            </div></body></html>
        `);
        win.document.close();
}
// --- CRUD VISUAL PARA SAC ATIVO ---
// Salvar SAC Ativo no Firestore
window.registrarSacAtivoPesquisa = async function() {
    const form = document.getElementById('formPesquisaSACAtivo');
    if (!form) return;
    const user = firebase.auth().currentUser;
    const empresaId = window._empresaIdUsuario || (user && user.email ? user.email.split('@')[1].replace(/\W/g, '').toLowerCase() : 'empresa_padrao');
    const data = {
        empresa: form.empresaSacAtivo?.value || '',
        telefone: form.telefoneSacAtivo?.value || '',
        endereco: form.enderecoSacAtivo?.value || '',
        dataPesquisa: form.dataPesquisaSacAtivo?.value || '',
        nomeCliente: form.nomeClienteSacAtivo?.value || '',
        perfilCliente: form.perfilClienteSacAtivo?.value || '',
        pontuacao: form.pontuacaoSacAtivo?.value || '',
        carteira: form.carteiraSacAtivo?.value || '',
        maxiforce: form.maxiforceSacAtivo?.checked || false,
        pyramid: form.pyramidSacAtivo?.checked || false,
        q1: form.q1?.value || '',
        q2: form.q2?.value || '',
        q3: form.q3?.value || '',
        q4: form.q4?.value || '',
        q5: form.q5?.value || '',
        q6: form.q6?.value || '',
        q7: form.q7?.value || '',
        infoComplementar: form.infoComplementarSacAtivo?.value || '',
        criadoEm: new Date().toISOString(),
        uid: user ? user.uid : null,
        empresaId: empresaId
    };
    try {
        const db = getFirestoreDb();
        await db.collection('sacAtivo').add(data);
        alert('Formulário SAC Ativo salvo com sucesso!');
        form.reset();
        window.consultarSacAtivoFirebase();
    } catch (e) {
        alert('Erro ao salvar SAC Ativo: ' + (e && e.message ? e.message : e));
    }
}

// Consultar e listar miniaturas SAC Ativo
window.consultarSacAtivoFirebase = async function() {
    try {
    if (!isFirebaseReady()) {
        alert('Firebase não está pronto para acessar o Firestore. Tente novamente.');
        return;
    }
    const db = getFirestoreDb();
    const empresaId = window._empresaIdUsuario;
    const snap = await db.collection('sacAtivo').where('empresaId', '==', empresaId).orderBy('criadoEm', 'desc').get();
    window._sacAtivoCache = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    atualizarListaSacAtivoUI(window._sacAtivoCache);
    } catch (e) {
        alert('Erro ao consultar SAC Ativo: ' + (e && e.message ? e.message : e));
    }
}

function atualizarListaSacAtivoUI(lista) {
    const el = document.getElementById('listaSacAtivo');
    if (!el) return;
    if (!lista || lista.length === 0) {
        el.innerHTML = '<div style="color:#e53935;font-weight:bold;">Nenhum SAC Ativo encontrado.</div>';
        return;
    }
    el.innerHTML = lista.map(sac => `
        <div class="miniatura-sacativo" style="background:#f6f8fc;border:1.5px solid #1976d2;border-radius:10px;padding:12px 16px;margin-bottom:10px;box-shadow:0 2px 8px #1976d222;cursor:pointer;transition:box-shadow 0.18s;min-width:220px;max-width:260px;" onclick="window.mostrarDetalheSacAtivo('${sac.id}')">
            <div class="titulo">${sac.empresa || '(Sem empresa)'}</div>
            <div class="sub">${sac.nomeCliente || ''}</div>
            <div class="data">${sac.dataPesquisa || ''}</div>
            <div class="notas">Nota: ${sac.pontuacao || '-'}</div>
        </div>
    `).join('');
}

// Modal detalhado SAC Ativo
window.mostrarDetalheSacAtivo = function(id) {
    const sac = (window._sacAtivoCache || []).find(s => s.id === id);
    if (!sac) return alert('Registro não encontrado!');
    let modal = document.getElementById('modalDetalheSacAtivo');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'modalDetalheSacAtivo';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(25, 118, 210, 0.18)';
    modal.style.zIndex = '10010';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.animation = 'fadeInSACModal 0.4s cubic-bezier(.4,1.4,.6,1)';
    modal.innerHTML = `
    <div id='modalDetalheSacAtivoBox' style='background:#fff;border-radius:28px;max-width:540px;width:96vw;box-shadow:0 10px 40px #232a3a33,0 2px 8px #1976d233;position:relative;font-family:Montserrat,Segoe UI,Arial,sans-serif;overflow:hidden;padding:0;display:flex;flex-direction:column;max-height:96vh;animation:cardFadeIn 0.7s cubic-bezier(.4,1.4,.6,1);'>
        <div style='background:linear-gradient(90deg,#1976d2 60%,#43a047 100%);padding:28px 32px 18px 32px;border-radius:28px 28px 0 0;display:flex;align-items:center;gap:16px;box-shadow:0 2px 12px #1976d244;'>
            <span style="font-size:2.1em;">💼</span>
            <div style="flex:1;">
                <div style="font-size:1.25em;font-weight:800;letter-spacing:1px;color:#fff;text-shadow:0 2px 8px #1976d288;">${sac.empresa || '(Sem empresa)'}</div>
                <span style="background:#fff;color:#1976d2;font-weight:700;padding:2px 14px 2px 10px;border-radius:12px;font-size:0.98em;box-shadow:0 2px 8px #1976d211;">${sac.perfilCliente || 'Cliente'}</span>
            </div>
            <button onclick='document.getElementById("modalDetalheSacAtivo").remove()' style='background:#e53935;color:#fff;border:none;border-radius:50%;width:38px;height:38px;font-size:22px;cursor:pointer;box-shadow:0 2px 8px #e5393533;transition:background 0.2s;z-index:2;display:flex;align-items:center;justify-content:center;'>×</button>
        </div>
        <div style='padding:32px 28px 18px 28px;display:flex;flex-direction:column;gap:14px;font-size:1.13em;overflow-y:auto;flex:1 1 auto;'>
            <div style="display:flex;align-items:center;gap:10px;"><span style='color:#1976d2;font-size:1.2em;'>📞</span> <b>Telefone:</b> <span style='color:#232a3a;'>${sac.telefone || '-'}</span></div>
            <div style="display:flex;align-items:center;gap:10px;"><span style='color:#43a047;font-size:1.2em;'>📍</span> <b>Endereço:</b> <span style='color:#232a3a;'>${sac.endereco || '-'}</span></div>
            <div style="display:flex;align-items:center;gap:10px;"><span style='color:#1976d2;font-size:1.2em;'>📅</span> <b>Data da pesquisa:</b> <span style='color:#232a3a;'>${sac.dataPesquisa || '-'}</span></div>
            <div style="display:flex;align-items:center;gap:10px;"><span style='color:#1976d2;font-size:1.2em;'>👤</span> <b>Nome do cliente:</b> <span style='color:#232a3a;'>${sac.nomeCliente || '-'}</span></div>
            <div style="display:flex;align-items:center;gap:10px;"><span style='color:#1976d2;font-size:1.2em;'>🏷️</span> <b>Carteira:</b> <span style='color:#232a3a;'>${sac.carteira || '-'}</span></div>
            <div style="display:flex;align-items:center;gap:10px;"><span style='color:#f7c873;font-size:1.2em;'>⭐</span> <b>Pontuação:</b> <span style='color:${(sac.pontuacao||0)>=30?'#43a047':'#e53935'};font-weight:700;'>${sac.pontuacao || '-'}</span></div>
            <div style="display:flex;align-items:center;gap:10px;"><span style='color:#1976d2;font-size:1.2em;'>🔖</span> <b>MAXIFORCE:</b> <span style='color:${sac.maxiforce?'#43a047':'#e53935'};font-weight:700;'>${sac.maxiforce ? 'Sim' : 'Não'}</span> <b style='margin-left:10px;'>PYRAMID:</b> <span style='color:${sac.pyramid?'#43a047':'#e53935'};font-weight:700;'>${sac.pyramid ? 'Sim' : 'Não'}</span></div>
            <div style="margin-top:8px;"><b>Respostas:</b><br>
                <span style='display:inline-block;background:#f6f8fc;border-radius:8px;padding:8px 12px;font-size:1.08em;color:#1976d2;font-weight:600;box-shadow:0 1px 4px #1976d211;'>1) ${sac.q1 || '-'} | 2) ${sac.q2 || '-'} | 3) ${sac.q3 || '-'} | 4) ${sac.q4 || '-'} | 5) ${sac.q5 || '-'} | 6) ${sac.q6 || '-'} | 7) ${sac.q7 || '-'}</span>
            </div>
            <div style="margin-top:8px;"><b>Info complementar:</b> <span style='color:#232a3a;'>${sac.infoComplementar || '-'}</span></div>
        </div>
        <div style='border-top:1.5px solid #1976d233;padding:18px 32px 18px 32px;display:flex;gap:18px;justify-content:flex-end;background:#f6f8fc;'>
            <button onclick='window.excluirSacAtivoFirebase && window.excluirSacAtivoFirebase("${sac.id}")' style='background:#e53935;color:#fff;font-weight:bold;padding:12px 32px;border:none;border-radius:10px;cursor:pointer;font-size:1.08em;box-shadow:0 2px 8px #e5393533;transition:background 0.18s;'>Excluir</button>
            <button onclick='document.getElementById("modalDetalheSacAtivo").remove()' style='background:#1976d2;color:#fff;font-weight:bold;padding:12px 32px;border:none;border-radius:10px;cursor:pointer;font-size:1.08em;box-shadow:0 2px 8px #1976d233;transition:background 0.18s;'>Fechar</button>
            <button onclick='window.imprimirSacAtivo && window.imprimirSacAtivo("${sac.id}")' style='background:#43a047;color:#fff;font-weight:bold;padding:12px 32px;border:none;border-radius:10px;cursor:pointer;font-size:1.08em;box-shadow:0 2px 8px #43a04733;transition:background 0.18s;'>Imprimir</button>
        </div>
    </div>`;
    document.body.appendChild(modal);
    window.scrollTo(0, 0);
    modal.style.boxShadow = '0 0 0 6px #1976d2, 0 10px 40px #232a3a33';
    setTimeout(() => { modal.style.boxShadow = ''; }, 1200);
    // Animação CSS global se não existir
    if (!document.getElementById('fadeInSACModalStyle')) {
        const style = document.createElement('style');
        style.id = 'fadeInSACModalStyle';
        style.innerHTML = `@keyframes fadeInSACModal { from { opacity:0; transform:scale(0.97) translateY(40px);} to { opacity:1; transform:none; } }`;
        document.head.appendChild(style);
    }
}

// Excluir SAC Ativo
window.excluirSacAtivoFirebase = async function(id) {
    if (!id) return alert('ID do SAC Ativo não informado!');
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;
    try {
        const db = getFirestoreDb();
        await db.collection('sacAtivo').doc(id).delete();
        window._sacAtivoCache = (window._sacAtivoCache || []).filter(s => s.id !== id);
        atualizarListaSacAtivoUI(window._sacAtivoCache);
        document.getElementById('modalDetalheSacAtivo')?.remove();
        alert('Registro excluído com sucesso!');
    } catch (e) {
        alert('Erro ao excluir: ' + (e && e.message ? e.message : e));
    }
}

// Imprimir SAC Ativo
window.imprimirSacAtivo = function(id) {
    const sac = (window._sacAtivoCache || []).find(s => s.id === id);
    if (!sac) return;
    const win = window.open('', '', 'width=900,height=1200');
    win.document.write('<html><head><title>Formulário SAC Ativo</title>');
    win.document.write(`
    <style>
    @media print {
        html,body{width:210mm;height:297mm;margin:0;padding:0;background:#fff;}
        body{box-sizing:border-box;width:210mm;height:297mm;margin:0 auto;padding:18mm 12mm 18mm 12mm;display:flex;flex-direction:column;justify-content:flex-start;align-items:stretch;}
        .print-header{margin-top:0;}
        table{page-break-inside:avoid;}
    }
    body{font-family:Montserrat,Arial,sans-serif;padding:24px;background:#fff;}
    .print-header{
        background:linear-gradient(90deg,#1976d2 60%,#43a047 100%);
        color:#fff;
        border-radius:18px 18px 0 0;
        padding:24px 32px 18px 32px;
        font-size:1.45em;
        font-weight:800;
        text-align:center;
        letter-spacing:1px;
        margin-bottom:18px;
        box-shadow:0 2px 12px #1976d244;
        display:flex;align-items:center;gap:18px;justify-content:center;
    }
    .badge { display:inline-block; background:#1976d2; color:#fff; border-radius:12px; padding:2px 14px 2px 10px; font-size:0.98em; font-weight:700; margin-left:8px; }
    .badge-vip { background:#43a047; }
    .badge-carteira { background:#f7c873; color:#232a3a; }
    .tabela-slim th, .tabela-slim td { border:1.5px solid #1976d2; padding:8px 12px; font-size:1.08em; }
    .tabela-slim th { background:#f6f8fc; color:#1976d2; font-weight:700; }
    .tabela-slim tr:nth-child(even) td { background:#f8fafc; }
    .tabela-slim { border-radius:12px; overflow:hidden; margin-bottom:18px; width:100%; border-collapse:separate; border-spacing:0; }
    .campo-icone { font-size:1.15em; margin-right:6px; }
    .respostas { background:#f6f8fc; border-radius:8px; padding:10px 14px; font-size:1.08em; color:#1976d2; font-weight:600; box-shadow:0 1px 4px #1976d211; margin-bottom:10px; }
    .info-comp { margin-top:10px; font-size:1.08em; }
    .footer-print { margin-top:32px; color:#888; font-size:0.98em; text-align:right; }
    </style>`);
    win.document.write('</head><body>');
    win.document.write('<div class="print-header"><span style="font-size:1.5em;">💼</span> FORMULÁRIO DE PESQUISA DE SATISFAÇÃO - SAC ATIVO</div>');
    win.document.write('<table class="tabela-slim"><tr><th><span class="campo-icone">🏢</span>Empresa</th><th><span class="campo-icone">📞</span>Telefone</th><th><span class="campo-icone">📍</span>Endereço</th><th><span class="campo-icone">📅</span>Data Pesquisa</th></tr>');
    win.document.write('<tr><td>' + (sac.empresa || '') + '</td><td>' + (sac.telefone || '') + '</td><td>' + (sac.endereco || '') + '</td><td>' + (sac.dataPesquisa || '') + '</td></tr></table>');
    win.document.write('<table class="tabela-slim"><tr><th><span class="campo-icone">👤</span>Nome Cliente</th><th><span class="campo-icone">🏷️</span>Perfil</th><th><span class="campo-icone">⭐</span>Pontuação</th><th><span class="campo-icone">💳</span>Carteira</th></tr>');
    win.document.write('<tr><td>' + (sac.nomeCliente || '') + '</td><td>' + (sac.perfilCliente ? `<span class="badge${sac.perfilCliente==='VIP'?' badge-vip':''}">`+sac.perfilCliente+'</span>' : '-') + '</td><td>' + (sac.pontuacao ? `<span style="color:${(sac.pontuacao||0)>=30?'#43a047':'#e53935'};font-weight:700;">${sac.pontuacao}</span>` : '-') + '</td><td>' + (sac.carteira ? `<span class="badge badge-carteira">${sac.carteira}</span>` : '-') + '</td></tr></table>');
    win.document.write('<div style="margin-bottom:8px;"><b>MAXIFORCE:</b> <span style="color:' + (sac.maxiforce?'#43a047':'#e53935') + ';font-weight:700;">' + (sac.maxiforce ? 'Sim' : 'Não') + '</span> | <b>PYRAMID:</b> <span style="color:' + (sac.pyramid?'#43a047':'#e53935') + ';font-weight:700;">' + (sac.pyramid ? 'Sim' : 'Não') + '</span></div>');
    const perguntas = [
        'Referente ao atendimento do Depto de Vendas, qual o seu nível de satisfação?',
        'Referente ao Prazo de Entrega dos produtos, qual o seu nível de satisfação?',
        'Referente à Qualidade dos Produtos, qual o seu nível de satisfação?',
        'Referente ao Suporte do Pós Venda, qual o seu nível de satisfação?',
        'Referente ao atendimento do Depto Financeiro (Negociações / Emissão dos Boletos....etc.), qual o seu nível de satisfação?',
        'Qual o seu nível de satisfação com a relação ao custo-benefício dos produtos adquiridos?',
        'Qual o seu nível de satisfação com a experiência de compra junto à nossa Empresa?'
    ];
    const emojiscale = {
        '1': '😡',
        '2': '😕',
        '3': '😐',
        '4': '🙂',
        '5': '😃',
        '-': '❓'
    };
    win.document.write('<div class="respostas"><b>Respostas:</b><br><div style="margin-top:6px;">');
    for (let i = 1; i <= 7; i++) {
        let val = sac['q'+i] || '-';
        let cor = '#1976d2';
        if (val == '5') cor = '#43a047';
        else if (val == '1') cor = '#e53935';
        else if (val == '4') cor = '#f7c873';
        else if (val == '3') cor = '#ffa726';
        else if (val == '2') cor = '#fb8c00';
        win.document.write(`
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <span style="font-size:1.25em;">${emojiscale[val] || '❓'}</span>
            <span style="color:#232a3a;font-size:1.05em;flex:1;">${i}) ${perguntas[i-1]}</span>
            <span style="display:inline-block;min-width:32px;text-align:center;background:${cor}22;color:${cor};font-weight:700;border-radius:8px;padding:6px 14px;font-size:1.08em;box-shadow:0 1px 4px ${cor}22;">${val}</span>
        </div>
        `);
    }
    win.document.write('</div></div>');
    win.document.write('<div class="info-comp" style="background:#f6f8fc;border-radius:8px;padding:10px 14px 10px 14px;margin-top:12px;font-size:1.08em;"><b style="color:#1976d2;">Info complementar:</b> ' + (sac.infoComplementar || '-') + '</div>');
    win.document.write('<div class="footer-print">Impresso em: ' + (new Date()).toLocaleString('pt-BR') + '</div>');
    win.document.write('</body></html>');
    win.document.close();
    win.onload = function() { win.print(); };
    setTimeout(() => { try { win.print(); } catch(e){} }, 500);
}
// Função global stub para consulta de SAC Ativo (evita erro caso não implementado)
window.consultarSacAtivoFirebase = async function() {
    try {
        const db = getFirestoreDb();
        const snap = await db.collection('sacAtivo').orderBy('criadoEm', 'desc').get();
        window._sacAtivoCache = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        atualizarListaSacAtivoUI(window._sacAtivoCache);
    } catch (e) {
        alert('Erro ao consultar SAC Ativo: ' + (e && e.message ? e.message : e));
    }
}
// Função global stub para consulta de insatisfeitos (evita erro caso não implementado)
window.consultarInsatisfeitosFirebase = async function(filtro) {
    try {
        const db = getFirestoreDb();
        let query = db.collection('insatisfeitos').orderBy('criadoEm', 'desc');
        if (filtro && filtro.trim()) {
            // Busca por nome, empresa ou telefone (ajuste os campos conforme o modelo)
            query = query.where('busca', 'array-contains', filtro.toLowerCase());
        }
        const snap = await query.get();
        window._insatisfeitosCache = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        atualizarListaInsatisfeitosUI(window._insatisfeitosCache);
    } catch (e) {
        alert('Erro ao consultar insatisfeitos: ' + (e && e.message ? e.message : e));
    }
}

function atualizarListaInsatisfeitosUI(lista) {
    const el = document.getElementById('listaInsatisfeitos');
    const msg = document.getElementById('msgSemInsatisfeitos');
    if (!el) return;
    if (!lista || lista.length === 0) {
        el.innerHTML = '';
        if (msg) msg.style.display = 'block';
        return;
    }
    if (msg) msg.style.display = 'none';
    el.innerHTML = lista.map(insat => `
        <div class="miniatura-sacativo" style="background:#fff3e0;border:1.5px solid #e53935;border-radius:10px;padding:12px 16px;margin-bottom:10px;box-shadow:0 2px 8px #e5393522;cursor:pointer;transition:box-shadow 0.18s;min-width:220px;max-width:260px;" onclick="window.mostrarDetalheInsatisfeito('${insat.id}')">
            <div class="titulo">${insat.empresa || '(Sem empresa)'}</div>
            <div class="sub">${insat.nomeCliente || ''}</div>
            <div class="data">${insat.dataPesquisa || ''}</div>
            <div class="notas">Nota: ${insat.pontuacao || '-'}</div>
        </div>
    `).join('');
}

// Campo de pesquisa: filtra lista de insatisfeitos por nome ou empresa
window.filtrarInsatisfeitosUI = function(valor) {
    valor = (valor || '').toLowerCase();
    const lista = (window._insatisfeitosCache || []);
    if (!valor) {
        atualizarListaInsatisfeitosUI(lista);
        return;
    }
    const filtrada = lista.filter(item =>
        (item.nomeCliente && item.nomeCliente.toLowerCase().includes(valor)) ||
        (item.empresa && item.empresa.toLowerCase().includes(valor))
    );
    atualizarListaInsatisfeitosUI(filtrada);
}
// Função global para gerar relatório (stub)
window.gerarRelatorioAcao = function() {
    alert('Função de geração de relatório ainda não implementada.');
}
// Função global para excluir reclamação do Firestore
window.excluirReclamacaoFirebase = async function(id) {
    if (!id) return alert('ID da reclamação não informado!');
    if (!confirm('Tem certeza que deseja excluir esta reclamação? Esta ação não pode ser desfeita.')) return;
    try {
        const db = getFirestoreDb();
        await db.collection('reclamacoes').doc(id).delete();
        // Remove da lista em cache
        if (window._reclamacoesCache) {
            window._reclamacoesCache = window._reclamacoesCache.filter(r => r.id !== id);
        }
    window.atualizarListaReclamacoesUI(window._reclamacoesCache || []);
        alert('Reclamação excluída com sucesso!');
        // Fecha modal se estiver aberto
        document.getElementById('modalDetalheReclamacao')?.remove();
    } catch (erro) {
        console.error('Erro ao excluir reclamação:', erro);
        alert('Erro ao excluir reclamação: ' + erro.message);
    }
}
// Importações do Firebase - mantenha apenas UMA VEZ no topo!
// Carregue o Firebase via <script> em index.html, NÃO use import aqui.
// Remova as linhas abaixo:
// import firebase from "firebase/app";
// import "firebase/firestore";

// Inicialização do Firebase: só executa listeners e login após firebase.initializeApp
if (typeof window.firebaseConfig === "undefined") {
    window.firebaseConfig = null;
    window.onFirebaseReady = [];
    fetch('http://localhost:4000/api/firebase-config')
        .then(res => {
            if (!res.ok) throw new Error('Configuração do Firebase não encontrada');
            return res.json();
        })
        .then(cfg => {
            console.log('[DEBUG] Config Firebase recebida:', cfg);
            if (!cfg.apiKey || !cfg.authDomain || !cfg.projectId) {
                throw new Error('Configuração do Firebase inválida');
            }
            window.firebaseConfig = cfg;
            if (typeof firebase !== "undefined" && (!firebase.apps || !firebase.apps.length)) {
                firebase.initializeApp(window.firebaseConfig);
            }
            // Executa todos os callbacks pendentes
            setTimeout(() => {
                window.firebasePronto = true;
                if (Array.isArray(window.onFirebaseReady)) {
                    window.onFirebaseReady.forEach(fn => { try { fn(); } catch(e) { console.error('[FATAL] Erro em onFirebaseReady:', e); } });
                    window.onFirebaseReady = [];
                }
            }, 0);
        })
        .catch(err => {
            alert('Erro ao carregar configuração do Firebase: ' + err.message);
        });
}

// Aguarda o carregamento do Firebase antes de inicializar
function aguardarFirebasePronto(callback) {
    if (typeof firebase !== "undefined" && firebase && firebase.firestore) {
        callback();
    } else {
        setTimeout(() => aguardarFirebasePronto(callback), 100);
    }
}



// Só registra listeners e lógica de autenticação após o Firebase estar realmente pronto
window.onFirebaseReady = window.onFirebaseReady || [];
window.onFirebaseReady.push(function() {
    // Força o carregamento do Auth se não estiver disponível
    if (typeof firebase !== "undefined" && !firebase.auth) {
        try {
            if (typeof window !== 'undefined' && window.firebase && window.firebase.default && window.firebase.default.auth) {
                window.firebase.auth = window.firebase.default.auth;
            }
        } catch (e) {}
    }
    if (typeof firebase !== "undefined" && firebase.auth) {
        window.firebase = firebase;
    }
    if (isFirebaseReady()) {
        console.log('[DEBUG] Registrando onAuthStateChanged (Firebase pronto)');
        firebase.auth().onAuthStateChanged(async function(user) {
            console.log('[DEBUG] onAuthStateChanged:', user);
            if (user) {
                await garantirPerfilUsuario(user);
                console.log('[DEBUG] empresaId após login:', window._empresaIdUsuario);
                window.setTimeout(() => {
                    console.log('[DEBUG] empresaId global (timeout):', window._empresaIdUsuario);
                }, 1000);
                // Atualiza saudação e avatar na interface
                const nome = user.displayName || user.email || 'Usuário';
                const perfil = window._perfilUsuario || 'usuario';
                if (document.getElementById('saudacaoUsuario')) {
                    document.getElementById('saudacaoUsuario').textContent = `Olá, ${nome} (${perfil})! | DOUDGE PÓS-VENDAS`;
                }
                if (document.getElementById('avatarUsuario')) {
                    document.getElementById('avatarUsuario').src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=1976d2&color=fff&rounded=true&size=48`;
                }
                // Mostra sistema, esconde login
                const loginContainer = document.getElementById('login-container');
                if (loginContainer) loginContainer.style.display = 'none';
                const sistema = document.getElementById('sistema-pos-vendas');
                if (sistema) sistema.style.display = '';
                // Diagnóstico: força refresh do token para garantir custom claims atualizados
                firebase.auth().currentUser.getIdToken(true).then(() => {
                    firebase.auth().currentUser.getIdTokenResult().then(tokenResult => {
                        console.log('[DEBUG] Custom claims (forçado):', tokenResult.claims);
                    });
                });
            } else {
                window._perfilUsuario = null;
                window._empresaIdUsuario = null;
                // Esconde sistema, mostra login
                const loginContainer = document.getElementById('login-container');
                if (loginContainer) loginContainer.style.display = '';
                const sistema = document.getElementById('sistema-pos-vendas');
                if (sistema) sistema.style.display = 'none';
            }
        });
    } else {
        console.warn('[DEBUG] Firebase NÃO pronto ao tentar registrar onAuthStateChanged');
    }
// ...existing code...

// Função para obter o Firestore já inicializado
window.getFirestoreDb = function() {
    if (!isFirebaseReady()) {
        console.error('[FATAL] getFirestoreDb: Firebase NÃO inicializado!', {
            firebase: typeof firebase,
            apps: firebase && firebase.apps,
            auth: firebase && firebase.auth,
            firestore: firebase && firebase.firestore
        });
        alert("Firebase não carregado corretamente. Verifique os scripts no index.html.");
        throw new Error("Firebase não carregado.");
    }
    return firebase.firestore();
}

// Exemplo de função global para salvar reclamação no Firebase
window.salvarReclamacaoFirebase = async function(reclamacao) {
    try {
        const db = getFirestoreDb();
        await db.collection('reclamacoes').add(reclamacao);
        alert('Reclamação salva com sucesso!');
    } catch (erro) {
        console.error('Erro ao salvar reclamação:', erro);
        alert('Erro ao salvar reclamação: ' + erro.message);
    }
}

// Função global para filtrar reclamações na interface
window.filtrarReclamacoes = function(termo) {
    termo = (termo || '').toLowerCase();
    // Supondo que as reclamações estão em window._reclamacoesCache
    const reclamacoes = window._reclamacoesCache || [];
    const reclamacoesFiltradas = reclamacoes.filter(r =>
        (r.cliente && r.cliente.toLowerCase().includes(termo)) ||
        (r.descricao && r.descricao.toLowerCase().includes(termo))
    );
    // Atualize a lista na UI conforme seu padrão
    window.atualizarListaReclamacoesUI(reclamacoesFiltradas);
}

// Função auxiliar para atualizar a lista na UI (implemente conforme seu HTML)
window.atualizarListaReclamacoesUI = function(reclamacoes) {
    // Atualize o innerHTML da UL correta
        const lista = document.getElementById('listaReclamacoes');
        if (!lista) return;
        if (reclamacoes.length === 0) {
            lista.innerHTML = '<li style="color:#e53935;font-weight:bold;">Nenhuma reclamação encontrada.</li>';
            return;
        }
        lista.innerHTML = reclamacoes.map((r, idx) => `
            <li class="miniatura-reclamacao" style="background:#f6f8fc;border:1.5px solid #1976d2;border-radius:10px;padding:12px 16px;margin-bottom:10px;box-shadow:0 2px 8px #1976d222;cursor:pointer;transition:box-shadow 0.18s;" onclick="window.mostrarDetalheReclamacao('${r.id}')">
                <div style="font-weight:bold;color:#1976d2;font-size:1.1em;">${r.empresa || '(Sem empresa)'}</div>
                <div style="color:#1976d2;font-size:0.98em;">${r.cliente || '(Sem cliente)'}</div>
                <div style="color:#232a3a;font-size:0.98em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px;"><span style='color:#888;font-size:0.97em;'>${r.descricao || '(Sem descrição)'}</span></div>
                <div style="color:#888;font-size:0.93em;">${r.dataAbertura || ''}</div>
            </li>
        `).join('');
    }

    // Função global para mostrar detalhes completos da reclamação em um modal
    window.mostrarDetalheReclamacao = function(id) {
        console.log('[DEBUG] mostrarDetalheReclamacao chamada para id:', id);
        // Remove .hidden do body e força overflow visível
        document.body.classList.remove('hidden');
        document.body.classList.remove('no-scroll');
        document.body.style.overflow = 'visible';
        // Remove qualquer modal antigo
        let modal = document.getElementById('modalDetalheReclamacao');
        if (modal) modal.remove();
        // Busca reclamação
        const reclamacao = (window._reclamacoesCache || []).find(r => r.id === id);
        if (!reclamacao) {
            console.warn('[DEBUG] Reclamação não encontrada no cache para id:', id, window._reclamacoesCache);
            // Log visual
            let warn = document.createElement('div');
            warn.innerText = 'Reclamação não encontrada!';
            warn.style.position = 'fixed';
            warn.style.top = '10px';
            warn.style.left = '50%';
            warn.style.transform = 'translateX(-50%)';
            warn.style.background = '#e53935';
            warn.style.color = '#fff';
            warn.style.padding = '12px 32px';
            warn.style.borderRadius = '8px';
            warn.style.zIndex = '9999999';
            document.body.appendChild(warn);
            setTimeout(()=>warn.remove(), 2000);
            return alert('Reclamação não encontrada!');
        }
        console.log('[DEBUG] Objeto reclamacao encontrado:', reclamacao);
        // Cria modal estilizado e interativo
        modal = document.createElement('div');
        modal.id = 'modalDetalheReclamacao';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.35)';
        modal.style.zIndex = '999999';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.border = '2px solid #1976d2';
        // Layout igual ao formulário de impressão
        modal.innerHTML = `
        <div id='modalDetalheReclamacaoBox' style='background:#fff;border-radius:22px;max-width:760px;width:98vw;box-shadow:0 10px 40px #232a3a33,0 2px 8px #1976d233;position:relative;font-family:Montserrat,Segoe UI,Arial,sans-serif;overflow:hidden;padding:0;display:flex;flex-direction:column;max-height:94vh;'>
            <button onclick='document.getElementById("modalDetalheReclamacao").remove()' style='position:absolute;top:18px;right:18px;background:#e53935;color:#fff;border:none;border-radius:50%;width:38px;height:38px;font-size:22px;cursor:pointer;box-shadow:0 2px 8px #e5393533;transition:background 0.2s;z-index:2;'>×</button>
            <div style='position:absolute;left:50%;top:0;transform:translate(-50%,-50%);background:#1976d2;color:#fff;padding:10px 36px 8px 36px;border-radius:18px 18px 32px 32px;box-shadow:0 2px 12px #1976d244;font-size:1.25rem;font-weight:800;letter-spacing:1px;z-index:1;display:flex;align-items:center;gap:10px;'>
                <span style="font-size:1.3em;">📄</span> Reclamação do Cliente via SAC
            </div>
            <div style='padding:54px 24px 24px 24px;display:flex;flex-direction:column;gap:18px;font-size:1.11em;overflow-y:auto;flex:1 1 auto;'>
                <div style="font-weight:700;font-size:1.13em;color:#232a3a;margin:0 0 2px 0;">Procedente: <span style="color:${reclamacao.procedente==='Sim' ? '#43a047' : '#e53935'};font-weight:800;">${reclamacao.procedente || 'Não informado'}</span></div>
                <table style="border-collapse:collapse;width:100%;margin-bottom:10px;">
                    <tr style="background:#f6f8fc;font-size:1.08em;">
                        <th style="width:22%">Nº Pedido de Vendas</th>
                        <th style="width:22%">Data de Abertura</th>
                        <th style="width:34%">Nome da Empresa</th>
                        <th style="width:22%">CNPJ do Cliente</th>
                    </tr>
                    <tr>
                        <td>${reclamacao.pedido || ''}</td>
                        <td>${reclamacao.dataAbertura || ''}</td>
                        <td>${reclamacao.empresa || ''}</td>
                        <td>${reclamacao.cnpj || ''}</td>
                    </tr>
                    <tr style="background:#f6f8fc;font-size:1.08em;">
                        <th>Contato da Empresa</th>
                        <th>Telefone</th>
                        <th colspan="2">Responsável Abertura</th>
                    </tr>
                    <tr>
                        <td>${reclamacao.contato || ''}</td>
                        <td>${reclamacao.telefone || ''}</td>
                        <td colspan="2">${reclamacao.responsavelAbertura || ''}</td>
                    </tr>
                </table>
                <div style="font-weight:700;font-size:1.13em;color:#232a3a;margin:10px 0 2px 0;">RECLAMAÇÃO</div>
                <div style="background:#f6f8fc;border-radius:8px;padding:10px 14px 10px 14px;font-size:1.08em;">${reclamacao.reclamacao || reclamacao.descricao || ''}</div>
                <div style="font-weight:700;font-size:1.13em;color:#232a3a;margin:10px 0 2px 0;">CAUSA RAIZ</div>
                <div style="background:#f6f8fc;border-radius:8px;padding:10px 14px 10px 14px;font-size:1.08em;">${reclamacao.causaRaiz || ''}</div>
                <div style="margin-bottom:2px;"><b style="color:#1976d2;">Responsável Causa Raiz:</b> ${reclamacao.responsavelCausaRaiz || ''}</div>
                <div style="font-weight:700;font-size:1.13em;color:#232a3a;margin:10px 0 2px 0;">AÇÃO CORRETIVA E PREVENTIVA</div>
                <div style="background:#f6f8fc;border-radius:8px;padding:10px 14px 10px 14px;font-size:1.08em;">${reclamacao.acaoCorretivaPreventiva || ''}</div>
                <div style="margin-bottom:2px;"><b style="color:#1976d2;">Responsável Ação Corretiva:</b> ${reclamacao.responsavelAcaoCorretiva || ''}</div>
                <table style="border-collapse:collapse;width:100%;margin-bottom:10px;">
                    <tr style="background:#f6f8fc;font-size:1.08em;">
                        <th style="width:33%">Procedente?</th>
                        <th style="width:33%">Departamento Origem</th>
                        <th style="width:34%">Fechamento SAC</th>
                    </tr>
                    <tr>
                        <td>${reclamacao.procedente || ''}</td>
                        <td>${reclamacao.departamentoOrigem || ''}</td>
                        <td>${reclamacao.fechamentoSAC || ''}</td>
                    </tr>
                </table>
                <div style="font-weight:700;font-size:1.13em;color:#232a3a;margin:10px 0 2px 0;">DISPOSIÇÃO</div>
                <div style="background:#f6f8fc;border-radius:8px;padding:10px 14px 10px 14px;font-size:1.08em;">${reclamacao.disposicao || ''}</div>
                <table style="border-collapse:collapse;width:100%;margin-bottom:10px;">
                    <tr style="background:#f6f8fc;font-size:1.08em;">
                        <th>Venda Perdida</th>
                        <th>Frete/Logística</th>
                        <th>Outras Despesas</th>
                        <th>Valor Despesas</th>
                        <th>Cancelamento Boletos</th>
                    </tr>
                    <tr>
                        <td>${reclamacao.vendaPerdida || ''}</td>
                        <td>${reclamacao.freteLogistica || ''}</td>
                        <td>${reclamacao.outrasDespesas || ''}</td>
                        <td>${reclamacao.valorDespesas || ''}</td>
                        <td>${reclamacao.cancelamentoBoletos || ''}</td>
                    </tr>
                </table>
                <table style="border-collapse:collapse;width:100%;margin-bottom:10px;">
                    <tr style="background:#f6f8fc;font-size:1.08em;">
                        <th style="width:50%">Disposição Satisfatória</th>
                        <th style="width:50%">Data Encerramento</th>
                    </tr>
                    <tr>
                        <td style="text-align:center;vertical-align:middle;"><span style="display:inline-block;width:18px;height:18px;border:1.5px solid #222;margin-right:6px;vertical-align:middle;">${reclamacao.disposicaoSatisfatoria ? '✔️' : ''}</span></td>
                        <td style="text-align:center;vertical-align:middle;">${reclamacao.dataEncerramento || ''}</td>
                    </tr>
                </table>
            </div>
            <div style='border-top:1.5px solid #1976d233;padding:14px 32px 14px 32px;display:flex;gap:16px;justify-content:flex-end;background:#f6f8fc;'>
                <button onclick='window.excluirReclamacaoFirebase && window.excluirReclamacaoFirebase("${reclamacao.id}")' style='background:#e53935;color:#fff;font-weight:bold;padding:8px 24px;border:none;border-radius:8px;cursor:pointer;font-size:15px;'>Excluir</button>
                <button onclick='document.getElementById("modalDetalheReclamacao").remove()' style='background:#1976d2;color:#fff;font-weight:bold;padding:8px 24px;border:none;border-radius:8px;cursor:pointer;font-size:15px;'>Fechar</button>
                <button onclick='window.imprimirReclamacao && window.imprimirReclamacao("${reclamacao.id}")' style='background:#43a047;color:#fff;font-weight:bold;padding:8px 24px;border:none;border-radius:8px;cursor:pointer;font-size:15px;'>Imprimir</button>
            </div>
        </div>
        `;

        document.body.appendChild(modal);
        // Log visual de debug
        let debug = document.createElement('div');
        debug.innerText = 'MODAL DETALHE RECLAMAÇÃO ATIVO';
        debug.style.position = 'fixed';
        debug.style.top = '0';
        debug.style.left = '0';
        debug.style.background = '#1976d2';
        debug.style.color = '#fff';
        debug.style.padding = '4px 18px';
        debug.style.zIndex = '10000000';
        debug.style.fontWeight = 'bold';
        debug.style.fontSize = '1.2em';
        document.body.appendChild(debug);
        setTimeout(()=>debug.remove(), 2000);

        // Fechar ao clicar fora da caixa
        modal.addEventListener('mousedown', function(e) {
            const box = document.getElementById('modalDetalheReclamacaoBox');
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Função de impressão (simples)
        window.imprimirReclamacao = function(id) {
                        const rec = (window._reclamacoesCache || []).find(r => r.id === id);
                        if (!rec) return;
                        const win = window.open('', '', 'width=900,height=1200');
                        win.document.write('<html><head><title>Formulário Reclamação</title>');
                        win.document.write(`
<style>
@media print {
    html, body {
        width: 210mm;
        height: 297mm;
        margin: 0;
        padding: 0;
        background: #fff;
    }
    body {
        box-sizing: border-box;
        width: 210mm;
        height: 297mm;
        margin: 0 auto;
        padding: 18mm 12mm 18mm 12mm;
        /* Centraliza e deixa espaço para impressora */
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: stretch;
    }
    .titulo-form {
        margin-top: 0;
    }
    .assinatura {
        margin-top: 32px;
        gap: 60px;
        justify-content: space-between;
    }
    .assinatura div {
        border-top: 1px solid #222;
        width: 220px;
        text-align: center;
        padding-top: 4px;
        font-size: 0.98em;
    }
    table {
        page-break-inside: avoid;
    }
}
body{
    font-family:Arial,Segoe UI,sans-serif;
    padding:24px;
    background:#fff;
}
table{border-collapse:collapse;width:100%;margin-bottom:18px;}
th,td{border:1px solid #222;padding:6px 8px;font-size:1em;}
th{background:#f6f8fc;}
h2{margin:0 0 12px 0;font-size:1.2em;}
label{font-weight:bold;}
.secao{margin-bottom:18px;}
.titulo-form{font-size:1.25em;font-weight:bold;text-align:center;margin-bottom:18px;}
.linha{display:flex;gap:12px;}
.campo{flex:1;}
.subtitulo{font-weight:bold;font-size:1.08em;margin:8px 0 4px 0;}
.caixa{border:1px solid #222;padding:8px 10px;min-height:32px;margin-bottom:6px;}
.assinatura{margin-top:32px;display:flex;gap:60px;justify-content:space-between;}
.assinatura div{border-top:1px solid #222;width:220px;text-align:center;padding-top:4px;font-size:0.98em;}
.checkbox{display:inline-block;width:18px;height:18px;border:1.5px solid #222;margin-right:6px;vertical-align:middle;}
</style>`);
                        win.document.write('</head><body>');
            win.document.write('<div class="titulo-form">FORMULÁRIO PARA ANÁLISE DA RECLAMAÇÃO DO CLIENTE VIA SAC</div>');
            // Seção 1: Cabeçalho
            win.document.write('<table style="margin-bottom:10px;">');
            win.document.write('<tr><th style="width:22%">Nº Pedido de Vendas</th><th style="width:22%">Data de Abertura</th><th style="width:34%">Nome da Empresa</th><th style="width:22%">CNPJ do Cliente</th></tr>');
            win.document.write(`<tr><td>${rec.pedido || ''}</td><td>${rec.dataAbertura || ''}</td><td>${rec.empresa || ''}</td><td>${rec.cnpj || ''}</td></tr>`);
            win.document.write('<tr><th>Contato da Empresa</th><th>Telefone</th><th colspan="2">Responsável Abertura</th></tr>');
            win.document.write(`<tr><td>${rec.contato || ''}</td><td>${rec.telefone || ''}</td><td colspan="2">${rec.responsavelAbertura || ''}</td></tr>`);
            win.document.write('</table>');
            // Seção 2: Reclamação
            win.document.write('<table style="margin-bottom:10px;"><tr><th style="width:100%">RECLAMAÇÃO</th></tr>');
            win.document.write(`<tr><td style="height:48px;vertical-align:top;">${rec.reclamacao || rec.descricao || ''}</td></tr></table>`);
            // Seção 3: Causa Raiz
            win.document.write('<table style="margin-bottom:10px;"><tr><th style="width:100%">CAUSA RAIZ</th></tr>');
            win.document.write(`<tr><td style="height:48px;vertical-align:top;">${rec.causaRaiz || ''}</td></tr></table>`);
            win.document.write('<div style="margin-bottom:8px;"><b>Responsável Causa Raiz:</b> ' + (rec.responsavelCausaRaiz || '') + '</div>');
            // Seção 4: Ação Corretiva e Preventiva
            win.document.write('<table style="margin-bottom:10px;"><tr><th style="width:100%">AÇÃO CORRETIVA E PREVENTIVA</th></tr>');
            win.document.write(`<tr><td style="height:48px;vertical-align:top;">${rec.acaoCorretivaPreventiva || ''}</td></tr></table>`);
            win.document.write('<div style="margin-bottom:8px;"><b>Responsável Ação Corretiva:</b> ' + (rec.responsavelAcaoCorretiva || '') + '</div>');
            // Seção 5: Fechamento SAC
            win.document.write('<table style="margin-bottom:10px;"><tr><th style="width:33%">Procedente?</th><th style="width:33%">Departamento Origem</th><th style="width:34%">Fechamento SAC</th></tr>');
            win.document.write(`<tr><td>${rec.procedente || ''}</td><td>${rec.departamentoOrigem || ''}</td><td>${rec.fechamentoSAC || ''}</td></tr></table>`);
            // Seção 6: Disposição
            win.document.write('<table style="margin-bottom:10px;"><tr><th style="width:100%">DISPOSIÇÃO</th></tr>');
            win.document.write(`<tr><td style="height:48px;vertical-align:top;">${rec.disposicao || ''}</td></tr></table>`);
            // Seção 7: Despesas
            win.document.write('<table style="margin-bottom:10px;"><tr><th>Venda Perdida</th><th>Frete/Logística</th><th>Outras Despesas</th><th>Valor Despesas</th><th>Cancelamento Boletos</th></tr>');
            win.document.write(`<tr><td>${rec.vendaPerdida || ''}</td><td>${rec.freteLogistica || ''}</td><td>${rec.outrasDespesas || ''}</td><td>${rec.valorDespesas || ''}</td><td>${rec.cancelamentoBoletos || ''}</td></tr></table>`);
            // Seção 8: Satisfação e Encerramento
            win.document.write('<table style="margin-bottom:10px;width:100%"><tr>');
            win.document.write('<th style="width:50%">Disposição Satisfatória</th><th style="width:50%">Data Encerramento</th></tr>');
            win.document.write('<tr>');
            win.document.write('<td style="text-align:center;vertical-align:middle;"><span class="checkbox">' + (rec.disposicaoSatisfatoria ? '✔️' : '') + '</span></td>');
            win.document.write('<td style="text-align:center;vertical-align:middle;">' + (rec.dataEncerramento || '') + '</td>');
            win.document.write('</tr></table>');
            // Assinaturas
            win.document.write('<div class="assinatura"><div>Assinatura SAC</div><div>Assinatura do Responsável</div></div>');
            win.document.write('</body></html>');
            win.onload = function() { win.print(); };
            setTimeout(() => { try { win.print(); } catch(e){} }, 500);
        }
    }
});

// Função global para consultar reclamações no Firestore e atualizar a UI
// Função global para alternar módulos (sidebar)
// Função global para trocar de conta (logout e exibir tela de login)
window.trocarContaAcao = function() {
        if (firebase && firebase.auth) {
            firebase.auth().signOut().then(() => {
                // Limpa todos os caches e dados sensíveis
                window._perfilUsuario = null;
                window._empresaIdUsuario = null;
                window._clientesCache = null;
                window._relatorioInsatisfeitosCache = null;
                window._sacAtivoCache = null;
                window._reclamacoesCache = null;
                // Esconde sistema e mostra tela de login
                var sistema = document.getElementById('sistema-pos-vendas');
                if (sistema) sistema.style.display = 'none';
                var login = document.getElementById('login-container');
                if (login) login.style.display = '';
                if (window.mostrarNotificacao) window.mostrarNotificacao('Conta desconectada!', 'sucesso');
                // Redireciona para login (opcional)
                // window.location.reload();
            });
        }
};
window.mostrarModulo = function(modulo, elMenu) {
    // Lista de todos os módulos principais
    var nomes = [
        'clientes',
        'reclamacoes',
        'sac',
        'conserto',
        'relatorios',
        'configuracoes'
    ];
    nomes.forEach(function(m) {
        // Oculta TODOS os cards de cada módulo, mesmo se houver duplicados
        var els = document.querySelectorAll('#modulo-' + m);
        els.forEach(function(el) {
            el.classList.add('hidden');
            el.style.display = 'none';
        });
    });
    // Mostra TODOS os cards do módulo selecionado (deve ser só um, mas cobre duplicatas)
    var moduloEls = document.querySelectorAll('#modulo-' + modulo);
    moduloEls.forEach(function(moduloEl) {
        moduloEl.classList.remove('hidden');
        moduloEl.style.display = '';
    });

    // Destaque visual no menu lateral (opcional)
    if (elMenu) {
        var menuLinks = document.querySelectorAll('a[id^="menu-"]');
        menuLinks.forEach(function(link) {
            link.classList.remove('ativo');
        });
        elMenu.classList.add('ativo');
    }
};
window.consultarReclamacoesFirebase = async function(filtro) {
    try {
        const db = getFirestoreDb();
        let query = db.collection('reclamacoes');
        // Se houver filtro, buscar por cliente OU descricao contendo o termo (case-insensitive)
        if (filtro && filtro.trim() !== "") {
            // Firestore não suporta OR direto, então busca tudo e filtra no JS
            const snapshot = await query.get();
            const todos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const termo = filtro.trim().toLowerCase();
            window._reclamacoesCache = todos.filter(r =>
                (r.cliente && r.cliente.toLowerCase().includes(termo)) ||
                (r.descricao && r.descricao.toLowerCase().includes(termo)) ||
                (r.empresa && r.empresa.toLowerCase().includes(termo)) ||
                (r.cnpj && r.cnpj.toLowerCase().includes(termo))
            );
        } else {
            const snapshot = await query.get();
            window._reclamacoesCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
    window.atualizarListaReclamacoesUI(window._reclamacoesCache);
    } catch (erro) {
        console.error('Erro ao consultar reclamações:', erro);
        alert('Erro ao consultar reclamações: ' + erro.message);
    }
}

// Função global de ação para ser chamada pelo botão/HTML

window.consultarReclamacoesAcao = function() {
    const filtro = document.getElementById('buscaReclamacao')?.value || '';
    window.consultarReclamacoesFirebase(filtro);
};
