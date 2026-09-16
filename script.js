const API_URL = 'https://script.google.com/macros/s/AKfycbyA7taRtIZmSugdvn3IUWs5Tm2rPDGUDkZxHZRz_qKFsRemGaoY_mNr_fcSXb8PTvap4Q/exec';
const CHAVE_API = 'KING-CONFERENCIA-2026';

let sessao = null;
let pedidoAtual = null;
let itens = [];

document.addEventListener('DOMContentLoaded', iniciarSistema);

function iniciarSistema() {
  const btnEntrar = document.getElementById('btnEntrar');
  const btnBuscarPedido = document.getElementById('btnBuscarPedido');
  const btnSair = document.getElementById('btnSair');
  const btnSemErro = document.getElementById('btnSemErro');
  const btnComErro = document.getElementById('btnComErro');
  const btnAdicionarItem = document.getElementById('btnAdicionarItem');
  const btnRegistrarSemErro = document.getElementById('btnRegistrarSemErro');
  const btnRegistrarComErro = document.getElementById('btnRegistrarComErro');

  carregarConferentes();

  if (btnEntrar) {
    btnEntrar.addEventListener('click', fazerLogin);
  }

  if (btnBuscarPedido) {
    btnBuscarPedido.addEventListener('click', buscarPedido);
  }

  if (btnSair) {
    btnSair.addEventListener('click', sair);
  }

  if (btnSemErro) {
    btnSemErro.addEventListener('click', selecionarSemErro);
  }

  if (btnComErro) {
    btnComErro.addEventListener('click', selecionarComErro);
  }

  if (btnAdicionarItem) {
    btnAdicionarItem.addEventListener('click', adicionarItem);
  }

  if (btnRegistrarSemErro) {
    btnRegistrarSemErro.addEventListener('click', registrarSemErro);
  }

  if (btnRegistrarComErro) {
    btnRegistrarComErro.addEventListener('click', registrarComErro);
  }

  const senha = document.getElementById('senha');

  if (senha) {
    senha.addEventListener('keydown', function(event) {
      if (event.key === 'Enter') {
        fazerLogin();
      }
    });
  }

  const pedido = document.getElementById('pedido');

  if (pedido) {
    pedido.addEventListener('keydown', function(event) {
      if (event.key === 'Enter') {
        buscarPedido();
      }
    });
  }
}


/* =========================
   COMUNICAÇÃO COM A API
========================= */

async function chamarAPI(acao, dados = {}) {
  const resposta = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify({
      chave: CHAVE_API,
      acao: acao,
      ...dados
    })
  });

  if (!resposta.ok) {
    throw new Error('Erro HTTP ' + resposta.status);
  }

  const texto = await resposta.text();

  let resultado;

  try {
    resultado = JSON.parse(texto);
  } catch (erro) {
    console.error('Resposta recebida da API:', texto);
    throw new Error('A API retornou uma resposta inválida.');
  }

  return resultado;
}


/* =========================
   TELA DE LOGIN
========================= */

async function carregarConferentes() {
  const select = document.getElementById('conferente');

  if (!select) return;

  select.innerHTML = '<option value="">Carregando...</option>';
  select.disabled = true;

  try {
    const resultado = await chamarAPI('listarConferentes');

    if (!resultado.sucesso) {
      throw new Error(resultado.mensagem || 'Não foi possível carregar os conferentes.');
    }

    const conferentes = resultado.conferentes || [];

    select.innerHTML = '<option value="">Selecione seu nome</option>';

    conferentes.forEach(function(nome) {
      const option = document.createElement('option');
      option.value = nome;
      option.textContent = nome;
      select.appendChild(option);
    });

    select.disabled = false;

  } catch (erro) {
    console.error(erro);

    select.innerHTML = '<option value="">Erro ao carregar</option>';
    mostrarStatusLogin(erro.message, true);
  }
}


async function fazerLogin() {
  const conferente = document.getElementById('conferente');
  const senha = document.getElementById('senha');
  const botao = document.getElementById('btnEntrar');

  if (!conferente || !senha) return;

  const nome = conferente.value.trim();
  const senhaDigitada = senha.value.trim();

  if (!nome) {
    mostrarStatusLogin('Selecione seu nome.', true);
    return;
  }

  if (!senhaDigitada) {
    mostrarStatusLogin('Digite sua senha.', true);
    return;
  }

  if (botao) {
    botao.disabled = true;
    botao.textContent = 'Entrando...';
  }

  try {
    const resultado = await chamarAPI('login', {
      conferente: nome,
      senha: senhaDigitada
    });

    if (!resultado.sucesso) {
      throw new Error(resultado.mensagem || 'Login inválido.');
    }

    sessao = resultado;

    mostrarSistema(nome);
    limparTelaConferencia();

  } catch (erro) {
    console.error(erro);
    mostrarStatusLogin(erro.message, true);

  } finally {
    if (botao) {
      botao.disabled = false;
      botao.textContent = 'Entrar';
    }
  }
}


function mostrarStatusLogin(mensagem, erro = false) {
  const status = document.getElementById('statusLogin');

  if (!status) return;

  status.textContent = mensagem;
  status.className = erro ? 'status erro' : 'status sucesso';
}


function mostrarSistema(nome) {
  const telaLogin = document.getElementById('telaLogin');
  const telaSistema = document.getElementById('telaSistema');
  const nomeConferente = document.getElementById('nomeConferente');

  if (telaLogin) {
    telaLogin.classList.add('oculto');
  }

  if (telaSistema) {
    telaSistema.classList.remove('oculto');
  }

  if (nomeConferente) {
    nomeConferente.textContent = nome;
  }
}


function sair() {
  sessao = null;
  pedidoAtual = null;
  itens = [];

  const telaLogin = document.getElementById('telaLogin');
  const telaSistema = document.getElementById('telaSistema');
  const senha = document.getElementById('senha');
  const pedido = document.getElementById('pedido');

  if (telaSistema) {
    telaSistema.classList.add('oculto');
  }

  if (telaLogin) {
    telaLogin.classList.remove('oculto');
  }

  if (senha) senha.value = '';
  if (pedido) pedido.value = '';

  limparTelaConferencia();

  mostrarStatusLogin('', false);
}


/* =========================
   BUSCA DO PEDIDO
========================= */

async function buscarPedido() {
  const campoPedido = document.getElementById('pedido');
  const botao = document.getElementById('btnBuscarPedido');

  if (!campoPedido) return;

  const numeroPedido = campoPedido.value.trim();

  if (!numeroPedido) {
    mostrarStatusSistema('Digite ou escaneie um pedido.', true);
    return;
  }

  if (!sessao || !sessao.token) {
    mostrarStatusSistema('Sua sessão expirou. Faça login novamente.', true);
    return;
  }

  if (botao) {
    botao.disabled = true;
    botao.textContent = 'Buscando...';
  }

  try {
    const resultado = await chamarAPI('pedido', {
      token: sessao.token,
      pedido: numeroPedido
    });

    if (!resultado.sucesso) {
      throw new Error(resultado.mensagem || 'Pedido não encontrado.');
    }

    pedidoAtual = resultado.pedido || resultado;

    itens = [];

    esconderSecaoErro();
    esconderBotoesRegistro();

    const secaoResultado = document.getElementById('secaoResultado');

    if (secaoResultado) {
      secaoResultado.classList.remove('oculto');
    }

    mostrarStatusSistema(
      'Pedido ' + numeroPedido + ' encontrado. Informe se a separação está correta.',
      false
    );

  } catch (erro) {
    console.error(erro);
    pedidoAtual = null;
    mostrarStatusSistema(erro.message, true);

  } finally {
    if (botao) {
      botao.disabled = false;
      botao.textContent = 'Buscar pedido';
    }
  }
}


/* =========================
   ESCOLHA:
   SEPARAÇÃO CORRETA
========================= */

function selecionarSemErro() {
  esconderSecaoErro();

  itens = [];

  esconderBotoesRegistro();

  const botao = document.getElementById('btnRegistrarSemErro');

  if (botao) {
    botao.classList.remove('oculto');
  }

  mostrarStatusSistema(
    'Separação marcada como correta. Clique em "Registrar conferência".',
    false
  );
}


/* =========================
   ESCOLHA:
   EXISTE ERRO
========================= */

function selecionarComErro() {
  const secaoErro = document.getElementById('secaoErro');

  esconderBotoesRegistro();

  if (secaoErro) {
    secaoErro.classList.remove('oculto');
  }

  const sku = document.getElementById('sku');

  if (sku) {
    sku.focus();
  }

  mostrarStatusSistema(
    'Informe os itens que apresentaram erro na separação.',
    false
  );
}


/* =========================
   ITENS / SKU
========================= */

function adicionarItem() {
  const skuCampo = document.getElementById('sku');
  const qtdSolicitadaCampo = document.getElementById('qtdSolicitada');
  const qtdSeparadaCampo = document.getElementById('qtdSeparada');

  if (!skuCampo || !qtdSolicitadaCampo || !qtdSeparadaCampo) return;

  const sku = skuCampo.value.trim();
  const qtdSolicitada = qtdSolicitadaCampo.value.trim();
  const qtdSeparada = qtdSeparadaCampo.value.trim();

  if (!sku) {
    mostrarStatusSistema('Informe o SKU/produto.', true);
    skuCampo.focus();
    return;
  }

  if (qtdSolicitada === '') {
    mostrarStatusSistema('Informe a quantidade solicitada.', true);
    qtdSolicitadaCampo.focus();
    return;
  }

  if (qtdSeparada === '') {
    mostrarStatusSistema('Informe a quantidade separada.', true);
    qtdSeparadaCampo.focus();
    return;
  }

  const item = {
    sku: sku,
    qtdSolicitada: Number(qtdSolicitada),
    qtdSeparada: Number(qtdSeparada)
  };

  itens.push(item);

  atualizarListaItens();

  skuCampo.value = '';
  qtdSolicitadaCampo.value = '';
  qtdSeparadaCampo.value = '';

  skuCampo.focus();

  mostrarStatusSistema('Item adicionado.', false);
}


function atualizarListaItens() {
  const lista = document.getElementById('listaItens');

  if (!lista) return;

  lista.innerHTML = '';

  if (itens.length === 0) {
    lista.innerHTML = '<p class="lista-vazia">Nenhum item adicionado.</p>';
    return;
  }

  itens.forEach(function(item, index) {
    const div = document.createElement('div');

    div.className = 'item-conferencia';

    div.innerHTML = `
      <div>
        <strong>${escaparHTML(item.sku)}</strong>
        <span>Solicitada: ${item.qtdSolicitada}</span>
        <span>Separada: ${item.qtdSeparada}</span>
      </div>

      <button type="button" class="btn-remover" data-index="${index}">
        Remover
      </button>
    `;

    lista.appendChild(div);
  });

  lista.querySelectorAll('.btn-remover').forEach(function(botao) {
    botao.addEventListener('click', function() {
      const index = Number(botao.dataset.index);

      itens.splice(index, 1);

      atualizarListaItens();
    });
  });
}


/* =========================
   REGISTRO SEM ERRO
========================= */

async function registrarSemErro() {
  if (!pedidoAtual) {
    mostrarStatusSistema('Nenhum pedido selecionado.', true);
    return;
  }

  await enviarConferencia({
    erro: false,
    itens: [],
    tipoErro: '',
    gravidade: '',
    acaoTomada: '',
    observacao: ''
  });
}


/* =========================
   REGISTRO COM ERRO
========================= */

async function registrarComErro() {
  if (!pedidoAtual) {
    mostrarStatusSistema('Nenhum pedido selecionado.', true);
    return;
  }

  if (itens.length === 0) {
    mostrarStatusSistema(
      'Adicione pelo menos um SKU com erro.',
      true
    );
    return;
  }

  const tipoErro = document.getElementById('tipoErro');
  const gravidade = document.getElementById('gravidade');
  const acaoTomada = document.getElementById('acaoTomada');
  const observacao = document.getElementById('observacao');

  const tipo = tipoErro ? tipoErro.value.trim() : '';
  const grav = gravidade ? gravidade.value.trim() : '';
  const acao = acaoTomada ? acaoTomada.value.trim() : '';
  const obs = observacao ? observacao.value.trim() : '';

  if (!tipo) {
    mostrarStatusSistema('Selecione o tipo de erro.', true);
    return;
  }

  if (!grav) {
    mostrarStatusSistema('Selecione a gravidade.', true);
    return;
  }

  if (!acao) {
    mostrarStatusSistema('Informe a ação tomada.', true);
    return;
  }

  await enviarConferencia({
    erro: true,
    itens: itens,
    tipoErro: tipo,
    gravidade: grav,
    acaoTomada: acao,
    observacao: obs
  });
}


/* =========================
   ENVIO PARA O GOOGLE SHEETS
========================= */

async function enviarConferencia(dados) {
  const botaoSemErro = document.getElementById('btnRegistrarSemErro');
  const botaoComErro = document.getElementById('btnRegistrarComErro');

  if (botaoSemErro) {
    botaoSemErro.disabled = true;
    botaoSemErro.textContent = 'Registrando...';
  }

  if (botaoComErro) {
    botaoComErro.disabled = true;
    botaoComErro.textContent = 'Registrando...';
  }

  try {
    const numeroPedido =
      pedidoAtual.pedido ||
      pedidoAtual.numeroPedido ||
      document.getElementById('pedido').value.trim();

    const resultado = await chamarAPI('registrarConferencia', {
      token: sessao.token,
      pedido: numeroPedido,
      itens: dados.itens,
      erro: dados.erro,
      tipoErro: dados.tipoErro,
      gravidade: dados.gravidade,
      acaoTomada: dados.acaoTomada,
      observacao: dados.observacao
    });

    if (!resultado.sucesso) {
      throw new Error(
        resultado.mensagem || 'Não foi possível registrar a conferência.'
      );
    }

    mostrarStatusSistema(
      'Conferência registrada com sucesso!',
      false
    );

    limparTelaConferencia();

  } catch (erro) {
    console.error(erro);

    mostrarStatusSistema(
      erro.message || 'Erro ao registrar a conferência.',
      true
    );

  } finally {
    if (botaoSemErro) {
      botaoSemErro.disabled = false;
      botaoSemErro.textContent = 'Registrar conferência';
    }

    if (botaoComErro) {
      botaoComErro.disabled = false;
      botaoComErro.textContent = 'Registrar conferência';
    }
  }
}


/* =========================
   LIMPEZA DA TELA
========================= */

function limparTelaConferencia() {
  pedidoAtual = null;
  itens = [];

  const pedido = document.getElementById('pedido');
  const sku = document.getElementById('sku');
  const qtdSolicitada = document.getElementById('qtdSolicitada');
  const qtdSeparada = document.getElementById('qtdSeparada');
  const tipoErro = document.getElementById('tipoErro');
  const gravidade = document.getElementById('gravidade');
  const acaoTomada = document.getElementById('acaoTomada');
  const observacao = document.getElementById('observacao');

  if (pedido) pedido.value = '';
  if (sku) sku.value = '';
  if (qtdSolicitada) qtdSolicitada.value = '';
  if (qtdSeparada) qtdSeparada.value = '';
  if (tipoErro) tipoErro.value = '';
  if (gravidade) gravidade.value = '';
  if (acaoTomada) acaoTomada.value = '';
  if (observacao) observacao.value = '';

  esconderSecaoResultado();
  esconderSecaoErro();
  esconderBotoesRegistro();

  atualizarListaItens();

  const status = document.getElementById('statusSistema');

  if (status) {
    status.textContent = '';
    status.className = 'status';
  }
}


function esconderSecaoResultado() {
  const secao = document.getElementById('secaoResultado');

  if (secao) {
    secao.classList.add('oculto');
  }
}


function esconderSecaoErro() {
  const secao = document.getElementById('secaoErro');

  if (secao) {
    secao.classList.add('oculto');
  }
}


function esconderBotoesRegistro() {
  const semErro = document.getElementById('btnRegistrarSemErro');
  const comErro = document.getElementById('btnRegistrarComErro');

  if (semErro) {
    semErro.classList.add('oculto');
  }

  if (comErro) {
    comErro.classList.add('oculto');
  }
}


function mostrarStatusSistema(mensagem, erro = false) {
  const status = document.getElementById('statusSistema');

  if (!status) return;

  status.textContent = mensagem;
  status.className = erro ? 'status erro' : 'status sucesso';
}


function escaparHTML(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
