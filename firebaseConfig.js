const { initializeApp } = require('firebase/app');
const { getFirestore, addDoc, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

// --- INICIALIZAÇÃO FIREBASE (apenas uma vez no topo)
const firebaseConfig = {
  apiKey: "AIzaSyDvnjI8Jcrx8OMciHwODQEUVfuECGA_E0",
  authDomain: "sistema-pos-vendas.firebaseapp.com",
  projectId: "sistema-pos-vendas",
  storageBucket: "sistema-pos-vendas.firebaseapp.com",
  messagingSenderId: "197847775983",
  appId: "1:197847775983:web:3cec7f6611677136ad391a",
  measurementId: "G-QX43WCWT42"
};
const app = initializeApp(firebaseConfig);
window.db = getFirestore(app);
// Função global para registrar formulário de nota insatisfatória (placeholder)
window.registrarInsatisfeitoForm = async function () {
  function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }
  // Coleta os dados do formulário (ajuste os IDs conforme o seu HTML)
  const empresa = getVal('empresaInsatisfeito');
  const telefone = getVal('telefoneInsatisfeito');
  const endereco = getVal('enderecoInsatisfeito');
  const nomeCliente = getVal('nomeClienteInsatisfeito');
  const dataPesquisa = getVal('dataPesquisaInsatisfeito');
  const contatoEmpresa = getVal('contatoEmpresaInsatisfeito');
  const data = getVal('dataContatoInsatisfeito');
  const mx = document.getElementById('mxInsatisfeito')?.checked || false;
  const py = document.getElementById('pyInsatisfeito')?.checked || false;
  const q1 = document.querySelector('input[name="q1Insatisfeito"]:checked')?.value || '';
  const q2 = document.querySelector('input[name="q2Insatisfeito"]:checked')?.value || '';
  const q3 = document.querySelector('input[name="q3Insatisfeito"]:checked')?.value || '';
  const q4 = document.querySelector('input[name="q4Insatisfeito"]:checked')?.value || '';
  const q5 = document.querySelector('input[name="q5Insatisfeito"]:checked')?.value || '';
  const q6 = document.querySelector('input[name="q6Insatisfeito"]:checked')?.value || '';
  const q7 = document.querySelector('input[name="q7Insatisfeito"]:checked')?.value || '';
  const detalheContato = getVal('detalheContatoInsatisfeito');
  const contatoSatisfatorioSim = document.getElementById('contatoSatisfatorioSimInsatisfeito')?.checked || false;
  const contatoSatisfatorioNao = document.getElementById('contatoSatisfatorioNaoInsatisfeito')?.checked || false;
  const dataEncerramento = getVal('dataEncerramentoInsatisfeito');
  const loading = document.getElementById('loadingInsatisfeito');
  if (loading) loading.style.display = 'block';
  try {
    await addDoc(collection(window.db, 'insatisfeitos'), {
      empresa,
      telefone,
      endereco,
      nomeCliente,
      dataPesquisa,
      contatoEmpresa,
      data,
      mx,
      py,
      q1, q2, q3, q4, q5, q6, q7,
      detalheContato,
      contatoSatisfatorioSim,
      contatoSatisfatorioNao,
      dataEncerramento,
      dataRegistro: new Date().toISOString()
    });
    if (loading) loading.style.display = 'none';
    const msg = document.getElementById('mensagemSalvarInsatisfeito');
    if (msg) msg.innerHTML = '<span style="color:#43a047;font-weight:bold;font-size:16px;">Formulário salvo no sistema!</span>';
    const form = document.getElementById('formInsatisfeitoForm');
    if (form) form.reset();
    setTimeout(() => { if (msg) msg.innerHTML = ''; }, 2500);
  } catch (e) {
    if (loading) loading.style.display = 'none';
    const msg = document.getElementById('mensagemSalvarInsatisfeito');
    if (msg) msg.innerHTML = '<span style="color:#e53935;font-weight:bold;font-size:16px;">Erro ao salvar no sistema!</span>';
    setTimeout(() => { if (msg) msg.innerHTML = ''; }, 3500);
    console.error('Erro ao salvar insatisfeito:', e);
  }
};
// Exibe formulário insatisfeito completo em modal/página
window.mostrarInsatisfeitoCompleto = function (id) {
  const lista = window._insatisfeitosCache || [];
  const r = lista.find(x => x.id === id);
  if (!r) return;
  let modal = document.getElementById('modalInsatisfeitoCompleto');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modalInsatisfeitoCompleto';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.35)';
    modal.style.zIndex = '9999';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `<div style='background:#fff;padding:32px 28px;border-radius:16px;max-width:800px;width:100%;box-shadow:0 4px 24px #0003;position:relative;'>
    <button onclick='document.getElementById("modalInsatisfeitoCompleto").remove()' style='position:absolute;top:12px;right:12px;background:#e53935;color:#fff;border:none;border-radius:50%;width:32px;height:32px;font-size:18px;cursor:pointer;'>×</button>
    <h2 style='color:#e53935;margin-bottom:12px;'>Formulário Insatisfeito Completo</h2>
    <div style='display:flex;flex-wrap:wrap;gap:12px;'>
      <div style='flex:1;min-width:180px;'><b>Empresa:</b> ${r.empresa || ''}</div>
      <div style='flex:1;min-width:180px;'><b>Telefone:</b> ${r.telefone || ''}</div>
      <div style='flex:1;min-width:180px;'><b>Endereço:</b> ${r.endereco || ''}</div>
      <div style='flex:1;min-width:180px;'><b>Data Pesquisa:</b> ${r.dataPesquisa || ''}</div>
      <div style='flex:1;min-width:180px;'><b>Nome Cliente:</b> ${r.nomeCliente || ''}</div>
      <div style='flex:1;min-width:180px;'><b>Contato Empresa:</b> ${r.contatoEmpresa || ''}</div>
      <div style='flex:1;min-width:180px;'><b>Data do Contato:</b> ${r.data || ''}</div>
      <div style='flex:1;min-width:180px;'><b>MX:</b> ${r.mx ? 'Sim' : 'Não'}</div>
      <div style='flex:1;min-width:180px;'><b>PY:</b> ${r.py ? 'Sim' : 'Não'}</div>
    </div>
    <div style='margin-top:18px;'>
      <h3 style='color:#e53935;'>Notas da Pesquisa</h3>
      <ul style='list-style:none;padding:0;'>
        <li><b>1)</b> ${r.q1 || ''}</li>
        <li><b>2)</b> ${r.q2 || ''}</li>
        <li><b>3)</b> ${r.q3 || ''}</li>
        <li><b>4)</b> ${r.q4 || ''}</li>
        <li><b>5)</b> ${r.q5 || ''}</li>
        <li><b>6)</b> ${r.q6 || ''}</li>
        <li><b>7)</b> ${r.q7 || ''}</li>
      </ul>
      <div style='margin-top:12px;'><b>Detalhe do contato:</b> ${r.detalheContato || ''}</div>
      <div style='margin-top:8px;'><b>Contato Satisfatório?</b> ${r.contatoSatisfatorioSim ? 'Sim' : (r.contatoSatisfatorioNao ? 'Não' : '')}</div>
      <div style='margin-top:8px;'><b>Data de Encerramento:</b> ${r.dataEncerramento || ''}</div>
      <div style='margin-top:8px;font-size:13px;color:#888;'>Registrado em: ${r.dataRegistro ? new Date(r.dataRegistro).toLocaleString() : ''}</div>
    </div>
  </div>`;
};
// Consulta e exibe formulários insatisfeitos (notas 1 ou 2) do SAC Ativo
window.consultarInsatisfeitosFirebase = async function () {
  const lista = document.getElementById('listaInsatisfeitos');
  console.log('[DEBUG] consultarInsatisfeitosFirebase chamada');
  if (!lista) {
    if (window.mostrarNotificacao) window.mostrarNotificacao('Erro: elemento da lista de insatisfeitos não encontrado!', 'erro');
    else alert('Erro: elemento da lista de insatisfeitos não encontrado!');
    return;
  }
  lista.innerHTML = '<li>Carregando...</li>';
  try {
    const snapshot = await getDocs(collection(db, 'insatisfeitos'));
    let insatisfeitos = [];
    snapshot.forEach(doc => {
      const r = doc.data();
      r.id = doc.id;
      insatisfeitos.push(r);
    });
    console.log('[DEBUG] insatisfeitos recebidos:', insatisfeitos);
    window._insatisfeitosCache = insatisfeitos;
    const msgSem = document.getElementById('msgSemInsatisfeitos');
    if (insatisfeitos.length === 0) {
      lista.innerHTML = '';
      if (msgSem) msgSem.style.display = 'block';
      return;
    } else {
      if (msgSem) msgSem.style.display = 'none';
    }
    let html = insatisfeitos.map(r => `
      <div class="miniatura-sacativo" style="display:inline-block;background:#e3f2fd;border-radius:8px;padding:12px;margin:8px;box-shadow:0 2px 8px #0001;cursor:pointer;width:260px;vertical-align:top;position:relative;">
        <div onclick="window.mostrarInsatisfeitoCompleto('${r.id}')">
          <div style="font-weight:bold;color:#1976d2;font-size:16px;">${r.empresa || r.cliente || 'Empresa'}</div>
          <div style="color:#333;font-size:14px;">${r.nomeCliente || r.descricao || ''}</div>
          <div style="color:#888;font-size:13px;">${r.dataPesquisa || r.dataAbertura || ''}</div>
          <div style="color:#1976d2;font-size:13px;">Notas baixas: ` +
      [r.q1, r.q2, r.q3, r.q4, r.q5, r.q6, r.q7].filter(q => q === '1' || q === '2').join(', ') +
      `</div>
        </div>
      </div>
    `).join('');
    console.log('[DEBUG] HTML gerado para insatisfeitos:', html);
    if (!html.trim()) {
      lista.innerHTML = '<li style="color:#e53935;font-weight:bold;">Nenhum formulário insatisfeito para exibir.</li>';
    } else {
      lista.innerHTML = html;
    }
  } catch (e) {
    console.error('[DEBUG] Erro ao consultar insatisfeitos:', e);
    lista.innerHTML = '<li>Erro ao consultar insatisfeitos!</li>';
  }
};
// renderer.js
// Consulta SAC Ativo salvos no Firestore e exibe na lista
window.consultarSacAtivoFirebase = async function (filtro) {
  const lista = document.getElementById('listaSacAtivo');
  if (lista) lista.innerHTML = '<li>Carregando...</li>';
  try {
    const snapshot = await getDocs(collection(db, 'sacAtivo'));
    let sacAtivos = [];
    snapshot.forEach(doc => {
      const r = doc.data();
      r.id = doc.id;
      sacAtivos.push(r);
    });
    // Filtro local (empresa, cliente, telefone, nomeCliente, descricao)
    if (filtro && filtro.trim()) {
      const termo = filtro.trim().toLowerCase();
      sacAtivos = sacAtivos.filter(r => (r.empresa && r.empresa.toLowerCase().includes(termo)) ||
        (r.cliente && r.cliente.toLowerCase().includes(termo)) ||
        (r.telefone && r.telefone.toLowerCase().includes(termo)) ||
        (r.nomeCliente && r.nomeCliente.toLowerCase().includes(termo)) ||
        (r.descricao && r.descricao.toLowerCase().includes(termo))
      );
    }
    if (!lista) return;
    if (sacAtivos.length === 0) {
      lista.innerHTML = '<li style="color:#e53935;font-weight:bold;">Nenhum SAC Ativo encontrado.</li>';
      window._sacAtivoCache = [];
      return;
    }
    // Exibe miniaturas
    let html = sacAtivos.map(r => {
      return `
        <div class="miniatura-sacativo" style="display:inline-block;background:#e3f2fd;border-radius:8px;padding:12px;margin:8px;box-shadow:0 2px 8px #0001;cursor:pointer;width:260px;vertical-align:top;position:relative;transition:box-shadow 0.2s;" onclick="window.mostrarSacAtivoCompleto('${r.id}')">
          <div style="font-weight:bold;color:#1976d2;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.empresa || r.cliente || 'Empresa'}</div>
          <div style="color:#333;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.nomeCliente || r.descricao || ''}</div>
          <div style="color:#888;font-size:13px;">${r.dataPesquisa || r.dataAbertura || ''}</div>
          <div style="color:#1976d2;font-size:13px;">Perfil: ${r.perfil || ''}</div>
          <div style="color:#1976d2;font-size:13px;">Carteira: ${r.carteira || ''}</div>
        </div>
      `;
    }).join('');
    lista.innerHTML = html;
    window._sacAtivoCache = sacAtivos;
  } catch (e) {
    if (lista) lista.innerHTML = '<li>Erro ao consultar!</li>';
  }
};
// Função para excluir SAC Ativo do Firestore
window.excluirSacAtivoFirebase = async function (event, id) {
  event.stopPropagation();
  if (!confirm('Tem certeza que deseja excluir este SAC Ativo?')) return;
  try {
    await deleteDoc(doc(db, 'sacAtivo', id));
    // Atualiza a lista após exclusão
    window.consultarSacAtivoFirebase('');
  } catch (e) {
    alert('Erro ao excluir SAC Ativo!');
  }
};
// Modal para mostrar SAC Ativo completo
window.mostrarSacAtivoCompleto = function (id) {
  const sacAtivos = window._sacAtivoCache || [];
  const r = sacAtivos.find(x => x.id === id);
  if (!r) return;
  let modal = document.getElementById('modalSacAtivoCompleto');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modalSacAtivoCompleto';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.35)';
    modal.style.zIndex = '9999';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    document.body.appendChild(modal);
  }
  // Se for registro novo (formulário completo)
  if (r.empresa || r.nomeCliente || r.dataPesquisa) {
    modal.innerHTML = `<div style='background:#fff;padding:32px 28px;border-radius:16px;max-width:800px;width:100%;box-shadow:0 4px 24px #0003;position:relative;'>
      <button onclick='document.getElementById("modalSacAtivoCompleto").remove()' style='position:absolute;top:12px;right:12px;background:#e53935;color:#fff;border:none;border-radius:50%;width:32px;height:32px;font-size:18px;cursor:pointer;'>×</button>
      <h2 style='color:#1976d2;margin-bottom:12px;'>Formulário Completo do SAC Ativo</h2>
      <div style='display:flex;flex-wrap:wrap;gap:12px;'>
        <div style='flex:1;min-width:180px;'><b>Empresa:</b> ${r.empresa || ''}</div>
        <div style='flex:1;min-width:180px;'><b>Telefone:</b> ${r.telefone || ''}</div>
        <div style='flex:1;min-width:180px;'><b>Endereço:</b> ${r.endereco || ''}</div>
        <div style='flex:1;min-width:180px;'><b>Nome Cliente:</b> ${r.nomeCliente || ''}</div>
        <div style='flex:1;min-width:180px;'><b>Data Pesquisa:</b> ${r.dataPesquisa || ''}</div>
        <div style='flex:1;min-width:180px;'><b>Perfil:</b> ${r.perfil || ''}</div>
        <div style='flex:1;min-width:180px;'><b>Carteira:</b> ${r.carteira || ''}</div>
        <div style='flex:1;min-width:180px;'><b>Responsável:</b> ${r.responsavel || ''}</div>
        <div style='flex:1;min-width:180px;'><b>Email:</b> ${r.email || ''}</div>
        <div style='flex:1;min-width:180px;'><b>CNPJ:</b> ${r.cnpj || ''}</div>
        <div style='flex:1;min-width:180px;'><b>Segmento:</b> ${r.segmento || ''}</div>
        <div style='flex:1;min-width:180px;'><b>Observações:</b> ${r.observacoes || ''}</div>
      </div>
      <div style='margin-top:18px;'>
        <h3 style='color:#1976d2;'>Respostas CSAT</h3>
        <ul style='list-style:none;padding:0;'>
          <li><b>1)</b> ${r.q1 || ''}</li>
          <li><b>2)</b> ${r.q2 || ''}</li>
          <li><b>3)</b> ${r.q3 || ''}</li>
          <li><b>4)</b> ${r.q4 || ''}</li>
          <li><b>5)</b> ${r.q5 || ''}</li>
          <li><b>6)</b> ${r.q6 || ''}</li>
          <li><b>7)</b> ${r.q7 || ''}</li>
        </ul>
        <div style='margin-top:12px;'><b>Motivo Insatisfação:</b> ${r.comentarioInsatisfatorio || ''}</div>
        <div style='margin-top:8px;'><b>Informação Complementar:</b> ${r.infoComplementar || ''}</div>
        <div style='margin-top:8px;font-size:13px;color:#888;'>Registrado em: ${r.dataRegistro ? new Date(r.dataRegistro).toLocaleString() : ''}</div>
      </div>
    </div>`;
  } else {
    // Registro antigo (apenas cliente, descricao, dataAbertura)
    modal.innerHTML = `<div style='background:#fff;padding:32px 28px;border-radius:16px;max-width:700px;width:100%;box-shadow:0 4px 24px #0003;position:relative;'>
      <button onclick='document.getElementById("modalSacAtivoCompleto").remove()' style='position:absolute;top:12px;right:12px;background:#e53935;color:#fff;border:none;border-radius:50%;width:32px;height:32px;font-size:18px;cursor:pointer;'>×</button>
      <h2 style='color:#1976d2;margin-bottom:12px;'>Formulário SAC Ativo (Simples)</h2>
      <div style='display:flex;flex-wrap:wrap;gap:12px;'>
        <div style='flex:1;min-width:180px;'><b>Cliente:</b> ${r.cliente || ''}</div>
        <div style='flex:1;min-width:180px;'><b>Descrição:</b> ${r.descricao || ''}</div>
        <div style='flex:1;min-width:180px;'><b>Data de abertura:</b> ${r.dataAbertura || ''}</div>
      </div>
    </div>`;
  }
};
// Consulta reclamações salvas no Firestore e exibe na lista
window.consultarReclamacoesFirebase = async function (filtro) {
  const lista = document.getElementById('listaReclamacoes');
  lista.innerHTML = '<li>Carregando...</li>';
  try {
    const snapshot = await getDocs(collection(db, 'reclamacoes'));
    let html = '';
    let reclamacoes = [];
    snapshot.forEach(doc => {
      const r = doc.data();
      r.id = doc.id;
      reclamacoes.push(r);
    });
    if (reclamacoes.length === 0) {
      lista.innerHTML = '<li>Nenhuma reclamação encontrada.</li>';
      return;
    }
    html = reclamacoes.map(r => `
        <div class="miniatura-reclamacao" style="display:inline-block;background:#f5f5f5;border-radius:8px;padding:12px;margin:8px;box-shadow:0 2px 8px #0001;cursor:pointer;width:220px;vertical-align:top;position:relative;">
          <div onclick="window.mostrarReclamacaoCompleta('${r.id}')">
            <div style="font-weight:bold;color:#1976d2;font-size:16px;">${r.empresa || 'Empresa'}</div>
            <div style="color:#333;font-size:14px;">${r.contato || ''}</div>
            <div style="color:#888;font-size:13px;">${r.dataAbertura || ''}</div>
            <div style="margin-top:6px;color:#e53935;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;">${r.reclamacao || ''}</div>
          </div>
          <button onclick="window.excluirReclamacaoFirebase(event, '${r.id}')" style="position:absolute;top:8px;right:8px;background:#e53935;color:#fff;border:none;border-radius:50%;width:28px;height:28px;font-size:16px;cursor:pointer;">🗑️</button>
        </div>
      `).join('');
    lista.innerHTML = html;
    window._reclamacoesCache = reclamacoes;
  } catch (e) {
    lista.innerHTML = '<li>Erro ao consultar!</li>';
  }
};
// Função para excluir reclamação do Firestore
window.excluirReclamacaoFirebase = async function (event, id) {
  event.stopPropagation();
  if (!confirm('Tem certeza que deseja excluir esta reclamação?')) return;
  try {
    await deleteDoc(doc(db, 'reclamacoes', id));
    // Atualiza a lista após exclusão
    window.consultarReclamacoesFirebase('');
  } catch (e) {
    alert('Erro ao excluir reclamação!');
  }
};
// ...fim da função...
window.mostrarReclamacaoCompleta = function (id) {
  const reclamacoes = window._reclamacoesCache || [];
  const r = reclamacoes.find(x => x.id === id);
  if (!r) return;
  let modal = document.getElementById('modalReclamacaoCompleta');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modalReclamacaoCompleta';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.35)';
    modal.style.zIndex = '9999';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `<div style='background:#fff;padding:32px 28px;border-radius:16px;max-width:700px;width:100%;box-shadow:0 4px 24px #0003;position:relative;'>
    <button onclick='document.getElementById("modalReclamacaoCompleta").remove()' style='position:absolute;top:12px;right:12px;background:#e53935;color:#fff;border:none;border-radius:50%;width:32px;height:32px;font-size:18px;cursor:pointer;'>×</button>
    <h2 style='color:#1976d2;margin-bottom:12px;'>Formulário Completo da Reclamação</h2>
    <div style='display:flex;flex-wrap:wrap;gap:12px;'>
      <div style='flex:1;min-width:180px;'><b>Pedido de vendas:</b> ${r.pedido || ''}</div>
      <div style='flex:1;min-width:180px;'><b>Data de abertura:</b> ${r.dataAbertura || ''}</div>
      <div style='flex:1;min-width:180px;'><b>Empresa:</b> ${r.empresa || ''}</div>
      <div style='flex:1;min-width:180px;'><b>CNPJ do cliente:</b> ${r.cnpj || ''}</div>
    </div>
    <div style='display:flex;flex-wrap:wrap;gap:12px;margin-top:8px;'>
      <div style='flex:1;min-width:180px;'><b>Contato da empresa:</b> ${r.contato || ''}</div>
      <div style='flex:1;min-width:180px;'><b>Telefone:</b> ${r.telefone || ''}</div>
    </div>
    <div style='margin-top:8px;'><b>Reclamação:</b> ${r.reclamacao || ''}</div>
    <div style='margin-top:8px;'><b>Responsável pela abertura:</b> ${r.responsavelAbertura || ''}</div>
    <div style='margin-top:8px;'><b>Causa Raiz:</b> ${r.causaRaiz || ''}</div>
    <div style='margin-top:8px;'><b>Responsável pela causa raiz:</b> ${r.responsavelCausaRaiz || ''}</div>
    <div style='margin-top:8px;'><b>Ação Corretiva e Preventiva:</b> ${r.acaoCorretivaPreventiva || ''}</div>
    <div style='margin-top:8px;'><b>Responsável pela ação corretiva:</b> ${r.responsavelAcaoCorretiva || ''}</div>
    <div style='margin-top:8px;'><b>Fechamento da Reclamação (SAC):</b> ${r.fechamentoSAC || ''}</div>
    <div style='margin-top:8px;'><b>Departamento que originou a reclamação:</b> ${r.departamentoOrigem || ''}</div>
    <div style='margin-top:8px;'><b>Disposição:</b> ${r.disposicao || ''}</div>
    <div style='margin-top:8px;'><b>Despesas operacionais da não conformidade:</b>
      <ul style='margin:0 0 0 18px;'>
        <li><b>Venda perdida:</b> ${r.vendaPerdida || ''}</li>
        <li><b>Frete / Logística reversa:</b> ${r.freteLogistica || ''}</li>
        <li><b>Outras despesas:</b> ${r.outrasDespesas || ''}</li>
        <li><b>R$:</b> ${r.valorDespesas || ''}</li>
        <li><b>Cancelamento boletos:</b> ${r.cancelamentoBoletos || ''}</li>
      </ul>
    </div>
    <div style='margin-top:8px;'><b>Disposição concluída e cliente satisfeito?</b> ${r.disposicaoSatisfatoria ? 'Sim' : 'Não'}</div>
    <div style='margin-top:8px;'><b>Data do encerramento da reclamação:</b> ${r.dataEncerramento || ''}</div>
  </div>`;
  modal.onclick = function (e) {
    if (e.target === modal) modal.remove();
  };
};
// Função global para salvar reclamação no Firestore
window.salvarReclamacaoFirebase = async function (dados) {
  try {
    await addDoc(collection(window.db, 'reclamacoes'), dados);
  } catch (e) {
    throw e;
  }
};
// Removido o event listener antigo para 'clienteForm', pois o cadastro agora é feito via função global e formulário novo
// Funções de ação para abas e subpastas personalizadas
window.cadastrarClienteAcao = function () {
  const nome = document.getElementById('nomeCliente').value;
  const email = document.getElementById('emailCliente').value;
  const msg = document.getElementById('mensagemCliente');
  msg.style.color = '#43a047';
  msg.innerHTML = `<b>✅ Cliente "${nome}" cadastrado com sucesso!</b>`;
  msg.style.animation = 'fadeIn 0.7s';
  setTimeout(() => msg.innerHTML = '', 2500);
};
window.consultarClientesAcao = function () {
  const lista = document.getElementById('listaClientes');
  lista.innerHTML = '<li>João Silva <button onclick="editarCliente(this)">✏️</button> <button onclick="excluirCliente(this)">🗑️</button></li><li>Maria Souza <button onclick="editarCliente(this)">✏️</button> <button onclick="excluirCliente(this)">🗑️</button></li><li>Pedro Oliveira <button onclick="editarCliente(this)">✏️</button> <button onclick="excluirCliente(this)">🗑️</button></li>';
};
window.filtrarClientes = function () {
  const busca = document.getElementById('buscaCliente').value.toLowerCase();
  const lista = document.getElementById('listaClientes');
  Array.from(lista.children).forEach(li => {
    li.style.display = li.textContent.toLowerCase().includes(busca) ? '' : 'none';
  });
};
window.editarCliente = function (btn) {
  btn.parentElement.style.background = '#fffde7';
  alert('Função de edição simulada!');
};
window.excluirCliente = function (btn) {
  btn.parentElement.remove();
};
window.registrarAtendimentoAcao = function () {
  const cliente = document.getElementById('clienteAtendimento').value;
  const descricao = document.getElementById('descricaoAtendimento').value;
  const msg = document.getElementById('mensagemAtendimento');
  msg.style.color = '#43a047';
  msg.innerHTML = `<b>✅ Atendimento para "${cliente}" registrado!</b>`;
  msg.style.animation = 'fadeIn 0.7s';
  setTimeout(() => msg.innerHTML = '', 2500);
};
window.acompanharAtendimentosAcao = function () {
  const lista = document.getElementById('listaAtendimentos');
  lista.innerHTML = '<li>João Silva - Em andamento <button onclick="finalizarAtendimento(this)">✔️</button></li><li>Maria Souza - Concluído</li>';
};
window.finalizarAtendimento = function (btn) {
  btn.parentElement.innerHTML = btn.parentElement.textContent.replace('Em andamento', 'Concluído');
};
window.gerarRelatorioAcao = function () {
  const msg = document.getElementById('mensagemRelatorio');
  msg.style.color = '#43a047';
  msg.innerHTML = '<b>📊 Relatório gerado com sucesso!</b>';
  msg.style.animation = 'fadeIn 0.7s';
  setTimeout(() => msg.innerHTML = '', 2500);
};
window.exportarRelatorioAcao = function () {
  const msg = document.getElementById('mensagemExportacao');
  msg.style.color = '#1976d2';
  msg.innerHTML = '<b>📤 Relatório exportado!</b>';
  msg.style.animation = 'fadeIn 0.7s';
  setTimeout(() => msg.innerHTML = '', 2500);
};
window.cadastrarProdutoAcao = function () {
  const nome = document.getElementById('nomeProduto').value;
  const preco = document.getElementById('precoProduto').value;
  const msg = document.getElementById('mensagemProduto');
  msg.style.color = '#43a047';
  msg.innerHTML = `<b>✅ Produto "${nome}" cadastrado por R$${preco}!</b>`;
  msg.style.animation = 'fadeIn 0.7s';
  setTimeout(() => msg.innerHTML = '', 2500);
};
window.filtrarProdutos = function () {
  const busca = document.getElementById('buscaProduto').value.toLowerCase();
  const lista = document.getElementById('listaProdutos');
  Array.from(lista.children).forEach(li => {
    li.style.display = li.textContent.toLowerCase().includes(busca) ? '' : 'none';
  });
};
window.editarProduto = function (btn) {
  btn.parentElement.style.background = '#fffde7';
  alert('Função de edição simulada!');
};
window.excluirProduto = function (btn) {
  btn.parentElement.remove();
};
window.registrarReclamacaoAcao = function () {
  const cliente = document.getElementById('clienteReclamacao').value;
  const descricao = document.getElementById('descricaoReclamacao').value;
  const msg = document.getElementById('mensagemReclamacao');
  msg.style.color = '#e53935';
  msg.innerHTML = `<b>💬 Reclamação registrada para "${cliente}"!</b>`;
  msg.style.animation = 'fadeIn 0.7s';
  setTimeout(() => msg.innerHTML = '', 2500);
};
window.consultarReclamacoesAcao = function () {
  const lista = document.getElementById('listaReclamacoes');
  lista.innerHTML = '<li>Produto atrasado <button onclick="resolverReclamacao(this)">✔️</button> <button onclick="excluirReclamacao(this)">🗑️</button></li><li>Atendimento ruim <button onclick="resolverReclamacao(this)">✔️</button> <button onclick="excluirReclamacao(this)">🗑️</button></li>';
};
window.filtrarReclamacoes = function () {
  const busca = document.getElementById('buscaReclamacao').value.toLowerCase();
  const lista = document.getElementById('listaReclamacoes');
  Array.from(lista.children).forEach(li => {
    li.style.display = li.textContent.toLowerCase().includes(busca) ? '' : 'none';
  });
};
window.resolverReclamacao = function (btn) {
  btn.parentElement.innerHTML = btn.parentElement.textContent.replace('Produto atrasado', 'Resolvido').replace('Atendimento ruim', 'Resolvido');
};
window.excluirReclamacao = function (btn) {
  btn.parentElement.remove();
};
window.registrarSacAtivoAcao = function () {
  const cliente = document.getElementById('clienteSacAtivo').value;
  const descricao = document.getElementById('descricaoSacAtivo').value;
  const dataAbertura = new Date().toLocaleDateString();
  const msg = document.getElementById('mensagemSacAtivo');
  msg.style.color = '#43a047';
  msg.innerHTML = `<b>📞 SAC Ativo registrado para "${cliente}"!</b>`;
  msg.style.animation = 'fadeIn 0.7s';
  setTimeout(() => msg.innerHTML = '', 2500);
  // Salva no Firestore
  (async () => {
    try {
      await addDoc(collection(db, 'sacAtivo'), {
        cliente,
        descricao,
        dataAbertura
      });
    } catch (e) {
      console.error('Erro ao salvar SAC Ativo:', e);
    }
  })();
};
window.registrarSacReceptivoAcao = function () {
  const cliente = document.getElementById('clienteSacReceptivo').value;
  const descricao = document.getElementById('descricaoSacReceptivo').value;
  const msg = document.getElementById('mensagemSacReceptivo');
  msg.style.color = '#1976d2';
  msg.innerHTML = `<b>📞 SAC Receptivo registrado para "${cliente}"!</b>`;
  msg.style.animation = 'fadeIn 0.7s';
  setTimeout(() => msg.innerHTML = '', 2500);
};
window.registrarConsertoAcao = function () {
  const produto = document.getElementById('produtoConserto').value;
  const defeito = document.getElementById('defeitoConserto').value;
  const msg = document.getElementById('mensagemConserto');
  msg.style.color = '#43a047';
  msg.innerHTML = `<b>🛠️ Conserto registrado para "${produto}"!</b>`;
  msg.style.animation = 'fadeIn 0.7s';
  setTimeout(() => msg.innerHTML = '', 2500);
};
window.consultarConsertosAcao = function () {
  const lista = document.getElementById('listaConsertos');
  lista.innerHTML = '<li>Notebook - Tela quebrada <button onclick="finalizarConserto(this)">✔️</button> <button onclick="excluirConserto(this)">🗑️</button></li><li>Mouse - Não funciona <button onclick="finalizarConserto(this)">✔️</button> <button onclick="excluirConserto(this)">🗑️</button></li>';
};
window.filtrarConsertos = function () {
  const busca = document.getElementById('buscaConserto').value.toLowerCase();
  const lista = document.getElementById('listaConsertos');
  Array.from(lista.children).forEach(li => {
    li.style.display = li.textContent.toLowerCase().includes(busca) ? '' : 'none';
  });
};
window.finalizarConserto = function (btn) {
  btn.parentElement.innerHTML = btn.parentElement.textContent.replace('Tela quebrada', 'Conserto finalizado').replace('Não funciona', 'Conserto finalizado');
};
window.excluirConserto = function (btn) {
  btn.parentElement.remove();
};
// Função para registrar pesquisa SAC Ativo completa no Firestore
window.registrarSacAtivoPesquisa = async function () {
  function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }
  const empresa = getVal('empresaSacAtivo');
  const telefone = getVal('telefoneSacAtivo');
  const endereco = getVal('enderecoSacAtivo');
  const nomeCliente = getVal('nomeClienteSacAtivo');
  const dataPesquisa = getVal('dataPesquisaSacAtivo');
  // Corrigir seleção de perfil/carteira para <select> ou <input type=radio>
  let perfil = '';
  let carteira = '';
  const perfilEl = document.querySelector('[name="perfilClienteSacAtivo"]');
  if (perfilEl && perfilEl.tagName === 'SELECT') perfil = perfilEl.value;
  else perfil = document.querySelector('input[name="perfilClienteSacAtivo"]:checked')?.value || '';
  const carteiraEl = document.querySelector('[name="carteiraSacAtivo"]');
  if (carteiraEl && carteiraEl.tagName === 'SELECT') carteira = carteiraEl.value;
  else carteira = document.querySelector('input[name="carteiraSacAtivo"]:checked')?.value || getVal('carteiraSacAtivo');
  const q1 = document.querySelector('input[name="q1"]:checked')?.value || '';
  const q2 = document.querySelector('input[name="q2"]:checked')?.value || '';
  const q3 = document.querySelector('input[name="q3"]:checked')?.value || '';
  const q4 = document.querySelector('input[name="q4"]:checked')?.value || '';
  const q5 = document.querySelector('input[name="q5"]:checked')?.value || '';
  const q6 = document.querySelector('input[name="q6"]:checked')?.value || '';
  const q7 = document.querySelector('input[name="q7"]:checked')?.value || '';
  const comentarioInsatisfatorio = getVal('comentarioInsatisfatorio');
  const infoComplementar = getVal('infoComplementarSacAtivo');
  const loading = document.getElementById('loadingSacAtivo');
  if (loading) loading.style.display = 'block';
  try {
    await addDoc(collection(db, 'sacAtivo'), {
      empresa,
      telefone,
      endereco,
      nomeCliente,
      dataPesquisa,
      perfil,
      carteira,
      q1, q2, q3, q4, q5, q6, q7,
      comentarioInsatisfatorio,
      infoComplementar,
      dataRegistro: new Date().toISOString()
    });
    if (loading) loading.style.display = 'none';
    alert('Pesquisa SAC Ativo registrada com sucesso!');
    const form = document.getElementById('formPesquisaSACAtivo');
    if (form) form.reset();
  } catch (e) {
    if (loading) loading.style.display = 'none';
    alert('Erro ao registrar pesquisa SAC Ativo!');
    console.error(e);
  }
};
