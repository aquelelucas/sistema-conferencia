/* =====================================================
   KING - SISTEMA DE CONFERÊNCIA
   SCRIPT PRINCIPAL
   ===================================================== */


/* =====================================================
   CONFIGURAÇÃO
   ===================================================== */

/*
 * A URL do novo Google Apps Script será colocada aqui
 * posteriormente.
 *
 * NÃO utilizar a URL do sistema antigo.
 */

const URL_API = '';


/*
 * Chave de comunicação com o Apps Script.
 *
 * Também será configurada posteriormente.
 */

const CHAVE_API = '';


/* =====================================================
   ESTADO DA APLICAÇÃO
   ===================================================== */

let conferenteLogado = '';

let sessaoToken = '';

let pedidoAtual = '';

let itens = [];

let processando = false;


/* =====================================================
   ELEMENTOS DA PÁGINA
   ===================================================== */

const telaLogin =
  document.getElementById('telaLogin');

const telaConferencia =
  document.getElementById('telaConferencia');

const conferenteInput =
  document.getElementById('conferente');

const senhaInput =
  document.getElementById('senha');

const btnEntrar =
  document.getElementById('btnEntrar');

const btnSair =
  document.getElementById('btnSair');

const nomeConferente =
  document.getElementById('nomeConferente');

const pedidoInput =
  document.getElementById('pedido');

const btnBuscarPedido =
  document.getElementById('btnBuscarPedido');

const secaoItens =
  document.getElementById('secaoItens');

const skuInput =
  document.getElementById('sku');

const qtdSolicitadaInput =
  document.getElementById('qtdSolicitada');

const qtdSeparadaInput =
  document.getElementById('qtdSeparada');

const btnAdicionarItem =
  document.getElementById('btnAdicionarItem');

const listaItens =
  document.getElementById('listaItens');

const secaoResultado =
  document.getElementById('secaoResultado');

const btnSemErro =
  document.getElementById('btnSemErro');

const btnComErro =
  document.getElementById('btnComErro');

const secaoErro =
  document.getElementById('secaoErro');

const tipoErro =
  document.getElementById('tipoErro');

const gravidade =
  document.getElementById('gravidade');

const acaoTomada =
  document.getElementById('acaoTomada');

const observacao =
  document.getElementById('observacao');

const btnRegistrarComErro =
  document.getElementById('btnRegistrarComErro');

const btnRegistrarSemErro =
  document.getElementById('btnRegistrarSemErro');

const statusLogin =
  document.getElementById('statusLogin');

const statusPedido =
  document.getElementById('statusPedido');

const statusGeral =
  document.getElementById('statusGeral');


/* =====================================================
   INICIALIZAÇÃO
   ===================================================== */

document.addEventListener(
  'DOMContentLoaded',
  function () {

    configurarEventos();

    restaurarSessao();

  }
);


/* =====================================================
   EVENTOS
   ===================================================== */

function configurarEventos() {

  btnEntrar.addEventListener(
    'click',
    fazerLogin
  );


  btnSair.addEventListener(
    'click',
    sair
  );


  btnBuscarPedido.addEventListener(
    'click',
    buscarPedido
  );


  btnAdicionarItem.addEventListener(
    'click',
    adicionarItem
  );


  btnSemErro.addEventListener(
    'click',
    selecionarSemErro
  );


  btnComErro.addEventListener(
    'click',
    selecionarComErro
  );


  btnRegistrarSemErro.addEventListener(
    'click',
    registrarSemErro
  );


  btnRegistrarComErro.addEventListener(
    'click',
    registrarComErro
  );


  /*
   * Enter no campo de senha
   * também realiza o login.
   */

  senhaInput.addEventListener(
    'keydown',
    function (evento) {

      if (
        evento.key === 'Enter'
      ) {

        fazerLogin();

      }

    }
  );


  /*
   * Enter no campo pedido
   * realiza a busca.
   */

  pedidoInput.addEventListener(
    'keydown',
    function (evento) {

      if (
        evento.key === 'Enter'
      ) {

        buscarPedido();

      }

    }
  );


  /*
   * Enter no SKU adiciona o item.
   */

  skuInput.addEventListener(
    'keydown',
    function (evento) {

      if (
        evento.key === 'Enter'
      ) {

        evento.preventDefault();

        qtdSolicitadaInput.focus();

      }

    }
  );


  qtdSolicitadaInput.addEventListener(
    'keydown',
    function (evento) {

      if (
        evento.key === 'Enter'
      ) {

        evento.preventDefault();

        qtdSeparadaInput.focus();

      }

    }
  );


  qtdSeparadaInput.addEventListener(
    'keydown',
    function (evento) {

      if (
        evento.key === 'Enter'
      ) {

        evento.preventDefault();

        adicionarItem();

      }

    }
  );

}


/* =====================================================
   LOGIN
   ===================================================== */

function fazerLogin() {

  if (processando) {
    return;
  }


  const nome =
    conferenteInput.value.trim();


  const senha =
    senhaInput.value;


  if (!nome) {

    mostrarStatus(
      statusLogin,
      'Informe o conferente.',
      'erro'
    );

    conferenteInput.focus();

    return;

  }


  if (!senha) {

    mostrarStatus(
      statusLogin,
      'Informe a senha.',
      'erro'
    );

    senhaInput.focus();

    return;

  }


  /*
   * Enquanto o Apps Script ainda não estiver
   * configurado, mostramos uma mensagem clara.
   */

  if (!URL_API) {

    mostrarStatus(
      statusLogin,
      'O sistema ainda não está conectado ao Google Apps Script.',
      'erro'
    );

    return;

  }


  processando = true;

  btnEntrar.disabled = true;


  mostrarStatus(
    statusLogin,
    'Validando acesso...',
    'info'
  );


  /*
   * A chamada real ao Apps Script será
   * implementada quando criarmos a API.
   */

  chamarAPI(
    'login',
    {
      conferente: nome,
      senha: senha
    }
  )
  .then(
    function (resposta) {

      if (
        !resposta ||
        !resposta.sucesso
      ) {

        throw new Error(
          resposta &&
          resposta.erro
            ? resposta.erro
            : 'Não foi possível realizar o login.'
        );

      }


      conferenteLogado =
        resposta.conferente || nome;


      sessaoToken =
        resposta.token || '';


      salvarSessao();


      mostrarTelaConferencia();


      senhaInput.value = '';


    }
  )
  .catch(
    function (erro) {

      mostrarStatus(
        statusLogin,
        erro.message,
        'erro'
      );

    }
  )
  .finally(
    function () {

      processando = false;

      btnEntrar.disabled = false;

    }
  );

}


/* =====================================================
   SESSÃO
   ===================================================== */

function salvarSessao() {

  const sessao = {

    conferente:
      conferenteLogado,

    token:
      sessaoToken

  };


  sessionStorage.setItem(
    'king_conferencia_sessao',
    JSON.stringify(sessao)
  );

}


/* =====================================================
   RESTAURAR SESSÃO
   ===================================================== */

function restaurarSessao() {

  const dados =
    sessionStorage.getItem(
      'king_conferencia_sessao'
    );


  if (!dados) {

    return;

  }


  try {

    const sessao =
      JSON.parse(dados);


    if (
      !sessao ||
      !sessao.conferente
    ) {

      return;

    }


    conferenteLogado =
      sessao.conferente;


    sessaoToken =
      sessao.token || '';


    mostrarTelaConferencia();


  } catch (erro) {

    sessionStorage.removeItem(
      'king_conferencia_sessao'
    );

  }

}


/* =====================================================
   MOSTRAR TELA DE CONFERÊNCIA
   ===================================================== */

function mostrarTelaConferencia() {

  telaLogin.classList.add(
    'oculto'
  );


  telaConferencia.classList.remove(
    'oculto'
  );


  nomeConferente.textContent =
    conferenteLogado;


  limparPedido();


  pedidoInput.focus();

}


/* =====================================================
   SAIR
   ===================================================== */

function sair() {

  if (
    !confirm(
      'Deseja sair do sistema?'
    )
  ) {

    return;

  }


  /*
   * Depois vamos poder invalidar o token
   * no Apps Script também.
   */

  conferenteLogado = '';

  sessaoToken = '';

  pedidoAtual = '';

  itens = [];


  sessionStorage.removeItem(
    'king_conferencia_sessao'
  );


  telaConferencia.classList.add(
    'oculto'
  );


  telaLogin.classList.remove(
    'oculto'
  );


  limparPedido();


  conferenteInput.value = '';

  senhaInput.value = '';

  limparStatus(
    statusLogin
  );


  conferenteInput.focus();

}


/* =====================================================
   BUSCAR PEDIDO
   ===================================================== */

function buscarPedido() {

  if (processando) {
    return;
  }


  const pedido =
    pedidoInput.value.trim();


  if (!pedido) {

    mostrarStatus(
      statusPedido,
      'Informe ou bipe o número do pedido.',
      'erro'
    );

    pedidoInput.focus();

    return;

  }


  if (!conferenteLogado) {

    mostrarStatus(
      statusPedido,
      'Sua sessão não está mais ativa.',
      'erro'
    );

    voltarParaLogin();

    return;

  }


  if (!URL_API) {

    mostrarStatus(
      statusPedido,
      'O sistema ainda não está conectado ao Google Apps Script.',
      'erro'
    );

    return;

  }


  processando = true;

  btnBuscarPedido.disabled = true;


  mostrarStatus(
    statusPedido,
    'Buscando pedido ' + pedido + '...',
    'info'
  );


  chamarAPI(
    'pedido',
    {
      pedido: pedido,
      token: sessaoToken,
      conferente: conferenteLogado
    }
  )
  .then(
    function (resposta) {

      if (
        !resposta ||
        !resposta.sucesso
      ) {

        throw new Error(
          resposta &&
          resposta.erro
            ? resposta.erro
            : 'Pedido não encontrado.'
        );

      }


      pedidoAtual =
        String(
          resposta.pedido || pedido
        );


      mostrarSecaoItens();


      mostrarStatus(
        statusPedido,
        'Pedido ' +
        pedidoAtual +
        ' carregado.',
        'sucesso'
      );


      skuInput.focus();

    }
  )
  .catch(
    function (erro) {

      mostrarStatus(
        statusPedido,
        erro.message,
        'erro'
      );

    }
  )
  .finally(
    function () {

      processando = false;

      btnBuscarPedido.disabled = false;

    }
  );

}


/* =====================================================
   MOSTRAR SEÇÃO DE ITENS
   ===================================================== */

function mostrarSecaoItens() {

  secaoItens.classList.remove(
    'oculto'
  );


  secaoResultado.classList.add(
    'oculto'
  );


  secaoErro.classList.add(
    'oculto'
  );


  btnRegistrarSemErro.classList.add(
    'oculto'
  );


  limparCamposItem();

}


/* =====================================================
   ADICIONAR ITEM
   ===================================================== */

function adicionarItem() {

  const sku =
    skuInput.value.trim();


  const qtdSolicitada =
    qtdSolicitadaInput.value;


  const qtdSeparada =
    qtdSeparadaInput.value;


  if (!sku) {

    mostrarStatus(
      statusGeral,
      'Informe o SKU / Produto.',
      'erro'
    );

    skuInput.focus();

    return;

  }


  if (
    qtdSolicitada === '' ||
    Number(qtdSolicitada) < 0
  ) {

    mostrarStatus(
      statusGeral,
      'Informe a quantidade solicitada.',
      'erro'
    );

    qtdSolicitadaInput.focus();

    return;

  }


  if (
    qtdSeparada === '' ||
    Number(qtdSeparada) < 0
  ) {

    mostrarStatus(
      statusGeral,
      'Informe a quantidade separada.',
      'erro'
    );

    qtdSeparadaInput.focus();

    return;

  }


  const item = {

    sku: sku,

    qtdSolicitada:
      Number(qtdSolicitada),

    qtdSeparada:
      Number(qtdSeparada)

  };


  itens.push(item);


  renderizarItens();


  limparCamposItem();


  mostrarStatus(
    statusGeral,
    'Item adicionado.',
    'sucesso'
  );


  skuInput.focus();


  /*
   * Depois de adicionar pelo menos um item,
   * podemos finalizar a conferência.
   */

  atualizarBotoesResultado();

}


/* =====================================================
   RENDERIZAR ITENS
   ===================================================== */

function renderizarItens() {

  listaItens.innerHTML = '';


  if (itens.length === 0) {

    return;

  }


  itens.forEach(
    function (item, indice) {

      const elemento =
        document.createElement(
          'div'
        );


      elemento.className =
        'item';


      elemento.innerHTML = `

        <div class="item-cabecalho">

          <div>

            <div class="item-numero">
              Item ${indice + 1}
            </div>

            <div class="item-sku">
              ${escaparHTML(item.sku)}
            </div>

          </div>

          <button
            type="button"
            class="btn-remover-item"
            data-indice="${indice}"
          >
            REMOVER
          </button>

        </div>

        <div class="item-dados">

          <div class="item-dado">
            Solicitada:
            <strong>
              ${item.qtdSolicitada}
            </strong>
          </div>

          <div class="item-dado">
            Separada:
            <strong>
              ${item.qtdSeparada}
            </strong>
          </div>

        </div>

      `;


      const botaoRemover =
        elemento.querySelector(
          '.btn-remover-item'
        );


      botaoRemover.addEventListener(
        'click',
        function () {

          removerItem(indice);

        }
      );


      listaItens.appendChild(
        elemento
      );

    }
  );

}


/* =====================================================
   REMOVER ITEM
   ===================================================== */

function removerItem(indice) {

  if (
    indice < 0 ||
    indice >= itens.length
  ) {

    return;

  }


  itens.splice(
    indice,
    1
  );


  renderizarItens();


  atualizarBotoesResultado();


  mostrarStatus(
    statusGeral,
    'Item removido.',
    'info'
  );

}


/* =====================================================
   ATUALIZAR BOTÕES DE RESULTADO
   ===================================================== */

function atualizarBotoesResultado() {

  if (
    itens.length === 0
  ) {

    secaoResultado.classList.add(
      'oculto'
    );

    return;

  }


  secaoResultado.classList.remove(
    'oculto'
  );

}


/* =====================================================
   SEM ERRO
   ===================================================== */

function selecionarSemErro() {

  secaoErro.classList.add(
    'oculto'
  );


  btnRegistrarSemErro.classList.remove(
    'oculto'
  );


  mostrarStatus(
    statusGeral,
    'Conferência marcada como correta.',
    'sucesso'
  );

}


/* =====================================================
   COM ERRO
   ===================================================== */

function selecionarComErro() {

  btnRegistrarSemErro.classList.add(
    'oculto'
  );


  secaoErro.classList.remove(
    'oculto'
  );


  mostrarStatus(
    statusGeral,
    'Informe os detalhes do erro.',
    'erro'
  );


  tipoErro.focus();

}


/* =====================================================
   REGISTRAR SEM ERRO
   ===================================================== */

function registrarSemErro() {

  if (
    itens.length === 0
  ) {

    mostrarStatus(
      statusGeral,
      'Adicione pelo menos um item.',
      'erro'
    );

    return;

  }


  registrarConferencia({

    erroDetectado: 'Não',

    tipoErro: '',

    gravidade: '',

    acaoTomada: '',

    observacao: '',

    conferenciaCorreta: 'Sim'

  });

}


/* =====================================================
   REGISTRAR COM ERRO
   ===================================================== */

function registrarComErro() {

  if (
    itens.length === 0
  ) {

    mostrarStatus(
      statusGeral,
      'Adicione pelo menos um item.',
      'erro'
    );

    return;

  }


  if (!tipoErro.value) {

    mostrarStatus(
      statusGeral,
      'Selecione o tipo de erro.',
      'erro'
    );

    tipoErro.focus();

    return;

  }


  if (!gravidade.value) {

    mostrarStatus(
      statusGeral,
      'Selecione a gravidade.',
      'erro'
    );

    gravidade.focus();

    return;

  }


  if (!acaoTomada.value) {

    mostrarStatus(
      statusGeral,
      'Selecione a ação tomada.',
      'erro'
    );

    acaoTomada.focus();

    return;

  }


  registrarConferencia({

    erroDetectado: 'Sim',

    tipoErro:
      tipoErro.value,

    gravidade:
      gravidade.value,

    acaoTomada:
      acaoTomada.value,

    observacao:
      observacao.value.trim(),

    conferenciaCorreta: 'Não'

  });

}


/* =====================================================
   REGISTRAR CONFERÊNCIA
   ===================================================== */

function registrarConferencia(resultado) {

  if (processando) {
    return;
  }


  if (!pedidoAtual) {

    mostrarStatus(
      statusGeral,
      'Nenhum pedido está carregado.',
      'erro'
    );

    return;

  }


  if (!conferenteLogado) {

    mostrarStatus(
      statusGeral,
      'Sua sessão não está mais ativa.',
      'erro'
    );

    voltarParaLogin();

    return;

  }


  if (!URL_API) {

    mostrarStatus(
      statusGeral,
      'O sistema ainda não está conectado ao Google Apps Script.',
      'erro'
    );

    return;

  }


  processando = true;


  btnRegistrarSemErro.disabled =
    true;

  btnRegistrarComErro.disabled =
    true;

  btnSemErro.disabled =
    true;

  btnComErro.disabled =
    true;


  mostrarStatus(
    statusGeral,
    'Registrando conferência...',
    'info'
  );


  const dados = {

    token:
      sessaoToken,

    conferente:
      conferenteLogado,

    pedido:
      pedidoAtual,

    itens:
      itens,

    erroDetectado:
      resultado.erroDetectado,

    tipoErro:
      resultado.tipoErro,

    gravidade:
      resultado.gravidade,

    acaoTomada:
      resultado.acaoTomada,

    observacao:
      resultado.observacao,

    conferenciaCorreta:
      resultado.conferenciaCorreta

  };


  chamarAPI(
    'registrarConferencia',
    dados
  )
  .then(
    function (resposta) {

      if (
        !resposta ||
        !resposta.sucesso
      ) {

        throw new Error(
          resposta &&
          resposta.erro
            ? resposta.erro
            : 'Não foi possível registrar a conferência.'
        );

      }


      mostrarStatus(
        statusGeral,
        '✓ Conferência registrada com sucesso.',
        'sucesso'
      );


      /*
       * Prepara automaticamente
       * o próximo pedido.
       */

      prepararProximoPedido();

    }
  )
  .catch(
    function (erro) {

      mostrarStatus(
        statusGeral,
        erro.message,
        'erro'
      );

    }
  )
  .finally(
    function () {

      processando = false;

      btnRegistrarSemErro.disabled =
        false;

      btnRegistrarComErro.disabled =
        false;

      btnSemErro.disabled =
        false;

      btnComErro.disabled =
        false;

    }
  );

}


/* =====================================================
   PREPARAR PRÓXIMO PEDIDO
   ===================================================== */

function prepararProximoPedido() {

  pedidoAtual = '';

  itens = [];


  pedidoInput.value = '';


  limparCamposItem();


  listaItens.innerHTML = '';


  secaoItens.classList.add(
    'oculto'
  );


  secaoResultado.classList.add(
    'oculto'
  );


  secaoErro.classList.add(
    'oculto'
  );


  btnRegistrarSemErro.classList.add(
    'oculto'
  );


  limparStatus(
    statusPedido
  );


  limparStatus(
    statusGeral
  );


  pedidoInput.focus();

}


/* =====================================================
   LIMPAR PEDIDO
   ===================================================== */

function limparPedido() {

  pedidoAtual = '';

  itens = [];


  pedidoInput.value = '';

  listaItens.innerHTML = '';


  secaoItens.classList.add(
    'oculto'
  );


  secaoResultado.classList.add(
    'oculto'
  );


  secaoErro.classList.add(
    'oculto'
  );


  btnRegistrarSemErro.classList.add(
    'oculto'
  );


  limparCamposItem();


  limparStatus(
    statusPedido
  );


  limparStatus(
    statusGeral
  );

}


/* =====================================================
   LIMPAR CAMPOS DO ITEM
   ===================================================== */

function limparCamposItem() {

  skuInput.value = '';

  qtdSolicitadaInput.value = '';

  qtdSeparadaInput.value = '';

}


/* =====================================================
   VOLTAR PARA LOGIN
   ===================================================== */

function voltarParaLogin() {

  conferenteLogado = '';

  sessaoToken = '';

  pedidoAtual = '';

  itens = [];


  sessionStorage.removeItem(
    'king_conferencia_sessao'
  );


  telaConferencia.classList.add(
    'oculto'
  );


  telaLogin.classList.remove(
    'oculto'
  );


  limparPedido();

}


/* =====================================================
   STATUS
   ===================================================== */

function mostrarStatus(
  elemento,
  mensagem,
  tipo
) {

  if (!elemento) {
    return;
  }


  elemento.textContent =
    mensagem;


  elemento.classList.remove(
    'oculto',
    'sucesso',
    'erro',
    'info'
  );


  elemento.classList.add(
    tipo || 'info'
  );

}


function limparStatus(
  elemento
) {

  if (!elemento) {
    return;
  }


  elemento.textContent = '';


  elemento.classList.add(
    'oculto'
  );


  elemento.classList.remove(
    'sucesso',
    'erro',
    'info'
  );

}


/* =====================================================
   ESCAPAR HTML
   ===================================================== */

function escaparHTML(
  valor
) {

  return String(valor)
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    )
    .replace(
      /'/g,
      '&#039;'
    );

}


/* =====================================================
   COMUNICAÇÃO COM API
   ===================================================== */

/*
 * Esta função será responsável pela comunicação
 * com o novo Google Apps Script.
 *
 * Por enquanto ela está preparada para receber
 * a API, mas não executa nenhuma chamada enquanto
 * URL_API estiver vazia.
 *
 * Vamos implementar a comunicação real depois
 * que criarmos o projeto do Apps Script.
 */

function chamarAPI(
  acao,
  dados
) {

  return new Promise(
    function (
      resolve,
      reject
    ) {

      if (!URL_API) {

        reject(
          new Error(
            'URL da API ainda não configurada.'
          )
        );

        return;

      }


      /*
       * A implementação definitiva ficará aqui.
       *
       * Vamos definir o método de comunicação
       * junto com o Apps Script para evitar expor
       * informações sensíveis no navegador.
       */


      reject(
        new Error(
          'A comunicação com a API ainda não foi configurada.'
        )
      );

    }
  );

}
