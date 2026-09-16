// ============================================================
// CONFIGURAÇÃO DA API
// ============================================================

const URL_API = 'https://script.google.com/macros/s/AKfycbwosNZJ3V8ORxMyy9m9w_O5-DpzSuMG7k_NRdy8oCiiMJHat4F5tw8Y4xAWH0hmBaPOBA/exec';

const CHAVE_API = 'KING-CONFERENCIA-2026';

const CHAVE_SESSAO = 'king_conferencia_sessao';


// ============================================================
// ESTADO DO SISTEMA
// ============================================================

let conferenteLogado = null;
let sessaoToken = null;
let pedidoAtual = null;
let itens = [];
let processando = false;


// ============================================================
// ELEMENTOS DA TELA
// ============================================================

const telaLogin = document.getElementById('telaLogin');
const telaConferencia = document.getElementById('telaConferencia');

const conferenteInput = document.getElementById('conferente');
const senhaInput = document.getElementById('senha');
const btnEntrar = document.getElementById('btnEntrar');
const statusLogin = document.getElementById('statusLogin');

const nomeConferente = document.getElementById('nomeConferente');
const btnSair = document.getElementById('btnSair');

const pedidoInput = document.getElementById('pedido');
const btnBuscarPedido = document.getElementById('btnBuscarPedido');

const secaoItens = document.getElementById('secaoItens');
const skuInput = document.getElementById('sku');
const qtdSolicitadaInput = document.getElementById('qtdSolicitada');
const qtdSeparadaInput = document.getElementById('qtdSeparada');
const btnAdicionarItem = document.getElementById('btnAdicionarItem');
const listaItens = document.getElementById('listaItens');

const secaoResultado = document.getElementById('secaoResultado');
const btnSemErro = document.getElementById('btnSemErro');
const btnComErro = document.getElementById('btnComErro');

const secaoErro = document.getElementById('secaoErro');

const tipoErroInput = document.getElementById('tipoErro');
const gravidadeInput = document.getElementById('gravidade');
const acaoTomadaInput = document.getElementById('acaoTomada');
const observacaoInput = document.getElementById('observacao');

const btnRegistrarSemErro = document.getElementById('btnRegistrarSemErro');
const btnRegistrarComErro = document.getElementById('btnRegistrarComErro');


// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    carregarSessao();
    configurarEventos();
});


// ============================================================
// EVENTOS
// ============================================================

function configurarEventos() {

    // Login
    if (btnEntrar) {
        btnEntrar.addEventListener('click', fazerLogin);
    }

    if (senhaInput) {
        senhaInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                fazerLogin();
            }
        });
    }

    if (conferenteInput) {
        conferenteInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                senhaInput.focus();
            }
        });
    }


    // Logout
    if (btnSair) {
        btnSair.addEventListener('click', fazerLogout);
    }


    // Buscar pedido
    if (btnBuscarPedido) {
        btnBuscarPedido.addEventListener('click', buscarPedido);
    }

    if (pedidoInput) {
        pedidoInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                buscarPedido();
            }
        });
    }


    // Adicionar SKU
    if (btnAdicionarItem) {
        btnAdicionarItem.addEventListener('click', adicionarItem);
    }

    if (skuInput) {
        skuInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                qtdSolicitadaInput.focus();
            }
        });
    }

    if (qtdSolicitadaInput) {
        qtdSolicitadaInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                qtdSeparadaInput.focus();
            }
        });
    }

    if (qtdSeparadaInput) {
        qtdSeparadaInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                adicionarItem();
            }
        });
    }


    // Resultado da conferência
    if (btnSemErro) {
        btnSemErro.addEventListener('click', () => {
            selecionarResultado(false);
        });
    }

    if (btnComErro) {
        btnComErro.addEventListener('click', () => {
            selecionarResultado(true);
        });
    }


    // Registro
    if (btnRegistrarSemErro) {
        btnRegistrarSemErro.addEventListener('click', registrarSemErro);
    }

    if (btnRegistrarComErro) {
        btnRegistrarComErro.addEventListener('click', registrarComErro);
    }
}


// ============================================================
// COMUNICAÇÃO COM A API
// ============================================================

async function chamarAPI(acao, dados = {}) {

    if (!URL_API) {
        throw new Error('URL da API não configurada.');
    }

    try {

        const resposta = await fetch(URL_API, {
            method: 'POST',

            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },

            body: JSON.stringify({
                acao: acao,
                chave: CHAVE_API,
                ...dados
            })
        });


        const texto = await resposta.text();

        let resultado;

        try {
            resultado = JSON.parse(texto);
        } catch (erro) {

            console.error('Resposta recebida da API:', texto);

            throw new Error(
                'A API retornou uma resposta inválida.'
            );
        }


        if (!resultado.sucesso) {
            throw new Error(
                resultado.mensagem || 'Erro ao comunicar com a API.'
            );
        }


        return resultado;

    } catch (erro) {

        console.error('Erro na comunicação com a API:', erro);

        throw erro;
    }
}


// ============================================================
// LOGIN
// ============================================================

async function fazerLogin() {

    if (processando) {
        return;
    }

    const conferente = conferenteInput.value.trim();
    const senha = senhaInput.value;

    if (!conferente) {
        mostrarStatus(
            statusLogin,
            'Informe o nome do conferente.',
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


    processando = true;

    btnEntrar.disabled = true;

    mostrarStatus(
        statusLogin,
        'Validando acesso...',
        'info'
    );


    try {

        const resultado = await chamarAPI('login', {
            conferente: conferente,
            senha: senha
        });


        conferenteLogado =
            resultado.conferente ||
            resultado.nome ||
            conferente;


        sessaoToken =
            resultado.token ||
            resultado.sessao ||
            '';


        if (!sessaoToken) {
            throw new Error(
                'A API não retornou uma sessão válida.'
            );
        }


        // Guarda a sessão somente neste navegador
        sessionStorage.setItem(
            CHAVE_SESSAO,
            JSON.stringify({
                conferente: conferenteLogado,
                token: sessaoToken
            })
        );


        mostrarTelaConferencia();

    } catch (erro) {

        mostrarStatus(
            statusLogin,
            erro.message,
            'erro'
        );

    } finally {

        processando = false;

        btnEntrar.disabled = false;
    }
}


// ============================================================
// CARREGAR SESSÃO EXISTENTE
// ============================================================

async function carregarSessao() {

    const sessaoSalva =
        sessionStorage.getItem(CHAVE_SESSAO);

    if (!sessaoSalva) {
        mostrarTelaLogin();
        return;
    }


    try {

        const sessao =
            JSON.parse(sessaoSalva);


        if (!sessao.token || !sessao.conferente) {
            throw new Error('Sessão inválida.');
        }


        // Valida a sessão diretamente na API
        const resultado = await chamarAPI('validarSessao', {
            token: sessao.token,
            conferente: sessao.conferente
        });


        if (!resultado.sucesso) {
            throw new Error('Sessão expirada.');
        }


        conferenteLogado = sessao.conferente;
        sessaoToken = sessao.token;


        mostrarTelaConferencia();

    } catch (erro) {

        console.warn(
            'Não foi possível restaurar a sessão:',
            erro
        );

        sessionStorage.removeItem(CHAVE_SESSAO);

        conferenteLogado = null;
        sessaoToken = null;

        mostrarTelaLogin();
    }
}


// ============================================================
// MOSTRAR TELA DE LOGIN
// ============================================================

function mostrarTelaLogin() {

    if (telaLogin) {
        telaLogin.classList.remove('oculto');
    }

    if (telaConferencia) {
        telaConferencia.classList.add('oculto');
    }
}


// ============================================================
// MOSTRAR TELA DE CONFERÊNCIA
// ============================================================

function mostrarTelaConferencia() {

    if (telaLogin) {
        telaLogin.classList.add('oculto');
    }

    if (telaConferencia) {
        telaConferencia.classList.remove('oculto');
    }


    if (nomeConferente) {
        nomeConferente.textContent = conferenteLogado;
    }


    limparConferencia();


    if (pedidoInput) {
        pedidoInput.focus();
    }
}


// ============================================================
// LOGOUT
// ============================================================

function fazerLogout() {

    sessionStorage.removeItem(CHAVE_SESSAO);

    conferenteLogado = null;
    sessaoToken = null;
    pedidoAtual = null;
    itens = [];


    if (conferenteInput) {
        conferenteInput.value = '';
    }

    if (senhaInput) {
        senhaInput.value = '';
    }


    limparConferencia();

    mostrarTelaLogin();


    mostrarStatus(
        statusLogin,
        'Sessão encerrada.',
        'info'
    );


    conferenteInput.focus();
}


// ============================================================
// BUSCAR PEDIDO
// ============================================================

async function buscarPedido() {

    if (processando) {
        return;
    }

    if (!sessaoToken || !conferenteLogado) {

        mostrarStatus(
            statusLogin,
            'Sua sessão expirou. Faça login novamente.',
            'erro'
        );

        fazerLogout();

        return;
    }


    const pedido = pedidoInput.value.trim();


    if (!pedido) {

        mostrarStatus(
            statusLogin,
            'Informe ou leia um pedido.',
            'erro'
        );

        pedidoInput.focus();

        return;
    }


    processando = true;

    btnBuscarPedido.disabled = true;


    try {

        const resultado = await chamarAPI('pedido', {

            pedido: pedido,

            token: sessaoToken,

            conferente: conferenteLogado

        });


        pedidoAtual =
            resultado.pedido ||
            pedido;


        itens = [];


        limparListaItens();


        if (secaoItens) {
            secaoItens.classList.remove('oculto');
        }


        if (secaoResultado) {
            secaoResultado.classList.add('oculto');
        }

        if (secaoErro) {
            secaoErro.classList.add('oculto');
        }


        limparCamposItem();


        skuInput.focus();


    } catch (erro) {

        alert(erro.message);

    } finally {

        processando = false;

        btnBuscarPedido.disabled = false;
    }
}


// ============================================================
// ADICIONAR ITEM
// ============================================================

function adicionarItem() {

    const sku = skuInput.value.trim();

    const qtdSolicitada =
        Number(qtdSolicitadaInput.value);

    const qtdSeparada =
        Number(qtdSeparadaInput.value);


    if (!sku) {

        alert('Informe o SKU/produto.');

        skuInput.focus();

        return;
    }


    if (
        qtdSolicitadaInput.value === '' ||
        isNaN(qtdSolicitada) ||
        qtdSolicitada < 0
    ) {

        alert('Informe uma quantidade solicitada válida.');

        qtdSolicitadaInput.focus();

        return;
    }


    if (
        qtdSeparadaInput.value === '' ||
        isNaN(qtdSeparada) ||
        qtdSeparada < 0
    ) {

        alert('Informe uma quantidade separada válida.');

        qtdSeparadaInput.focus();

        return;
    }


    itens.push({

        sku: sku,

        qtdSolicitada: qtdSolicitada,

        qtdSeparada: qtdSeparada

    });


    renderizarItens();

    limparCamposItem();

    skuInput.focus();


    // Mostra a área de resultado depois que existe pelo menos um SKU
    if (secaoResultado) {
        secaoResultado.classList.remove('oculto');
    }
}


// ============================================================
// RENDERIZAR LISTA DE ITENS
// ============================================================

function renderizarItens() {

    if (!listaItens) {
        return;
    }


    listaItens.innerHTML = '';


    itens.forEach((item, index) => {

        const div = document.createElement('div');

        div.className = 'item';


        div.innerHTML = `

            <div class="item-cabecalho">

                <span class="item-numero">
                    Item ${index + 1}
                </span>

                <span class="item-sku">
                    ${escaparHTML(item.sku)}
                </span>

            </div>


            <div class="item-dados">

                <div>
                    <strong>Solicitada:</strong>
                    ${formatarNumero(item.qtdSolicitada)}
                </div>

                <div>
                    <strong>Separada:</strong>
                    ${formatarNumero(item.qtdSeparada)}
                </div>

            </div>


            <button
                type="button"
                class="btn-remover-item"
                data-index="${index}"
            >
                Remover
            </button>

        `;


        listaItens.appendChild(div);
    });


    // Eventos dos botões remover
    const botoesRemover =
        document.querySelectorAll('.btn-remover-item');


    botoesRemover.forEach(botao => {

        botao.addEventListener('click', () => {

            const index =
                Number(botao.dataset.index);

            removerItem(index);
        });
    });
}


// ============================================================
// REMOVER ITEM
// ============================================================

function removerItem(index) {

    itens.splice(index, 1);

    renderizarItens();


    if (itens.length === 0) {

        if (secaoResultado) {
            secaoResultado.classList.add('oculto');
        }

        if (secaoErro) {
            secaoErro.classList.add('oculto');
        }
    }
}


// ============================================================
// RESULTADO DA CONFERÊNCIA
// ============================================================

function selecionarResultado(comErro) {

    if (itens.length === 0) {

        alert(
            'Adicione pelo menos um SKU antes de finalizar a conferência.'
        );

        return;
    }


    if (comErro) {

        if (secaoErro) {
            secaoErro.classList.remove('oculto');
        }

        if (tipoErroInput) {
            tipoErroInput.focus();
        }

    } else {

        if (secaoErro) {
            secaoErro.classList.add('oculto');
        }
    }
}


// ============================================================
// REGISTRAR SEM ERRO
// ============================================================

async function registrarSemErro() {

    if (processando) {
        return;
    }


    if (itens.length === 0) {

        alert(
            'Adicione pelo menos um SKU antes de registrar.'
        );

        return;
    }


    await registrarConferencia({

        erroDetectado: 'Não',

        tipoErro: '',

        gravidade: '',

        acaoTomada: '',

        observacao: '',

        conferenciaCorreta: 'Sim'

    });
}


// ============================================================
// REGISTRAR COM ERRO
// ============================================================

async function registrarComErro() {

    if (processando) {
        return;
    }


    if (itens.length === 0) {

        alert(
            'Adicione pelo menos um SKU antes de registrar.'
        );

        return;
    }


    const tipoErro =
        tipoErroInput.value.trim();

    const gravidade =
        gravidadeInput.value.trim();

    const acaoTomada =
        acaoTomadaInput.value.trim();

    const observacao =
        observacaoInput.value.trim();


    if (!tipoErro) {

        alert('Selecione o tipo de erro.');

        tipoErroInput.focus();

        return;
    }


    if (!gravidade) {

        alert('Selecione a gravidade.');

        gravidadeInput.focus();

        return;
    }


    if (!acaoTomada) {

        alert('Selecione a ação tomada.');

        acaoTomadaInput.focus();

        return;
    }


    await registrarConferencia({

        erroDetectado: 'Sim',

        tipoErro: tipoErro,

        gravidade: gravidade,

        acaoTomada: acaoTomada,

        observacao: observacao,

        conferenciaCorreta: 'Não'

    });
}


// ============================================================
// REGISTRAR CONFERÊNCIA NA API
// ============================================================

async function registrarConferencia(dadosResultado) {

    processando = true;


    if (btnRegistrarSemErro) {
        btnRegistrarSemErro.disabled = true;
    }

    if (btnRegistrarComErro) {
        btnRegistrarComErro.disabled = true;
    }


    try {

        const dados = {

            token: sessaoToken,

            conferente: conferenteLogado,

            pedido: pedidoAtual,

            itens: itens,

            erroDetectado:
                dadosResultado.erroDetectado,

            tipoErro:
                dadosResultado.tipoErro,

            gravidade:
                dadosResultado.gravidade,

            acaoTomada:
                dadosResultado.acaoTomada,

            observacao:
                dadosResultado.observacao,

            conferenciaCorreta:
                dadosResultado.conferenciaCorreta
        };


        const resultado =
            await chamarAPI(
                'registrarConferencia',
                dados
            );


        alert(
            resultado.mensagem ||
            'Conferência registrada com sucesso!'
        );


        limparConferencia();


        pedidoInput.focus();


    } catch (erro) {

        alert(
            'Não foi possível registrar a conferência.\n\n' +
            erro.message
        );

    } finally {

        processando = false;


        if (btnRegistrarSemErro) {
            btnRegistrarSemErro.disabled = false;
        }

        if (btnRegistrarComErro) {
            btnRegistrarComErro.disabled = false;
        }
    }
}


// ============================================================
// LIMPAR CONFERÊNCIA
// ============================================================

function limparConferencia() {

    pedidoAtual = null;

    itens = [];


    if (pedidoInput) {
        pedidoInput.value = '';
    }


    limparCamposItem();

    limparListaItens();


    if (secaoItens) {
        secaoItens.classList.add('oculto');
    }

    if (secaoResultado) {
        secaoResultado.classList.add('oculto');
    }

    if (secaoErro) {
        secaoErro.classList.add('oculto');
    }


    if (tipoErroInput) {
        tipoErroInput.value = '';
    }

    if (gravidadeInput) {
        gravidadeInput.value = '';
    }

    if (acaoTomadaInput) {
        acaoTomadaInput.value = '';
    }

    if (observacaoInput) {
        observacaoInput.value = '';
    }
}


// ============================================================
// LIMPAR CAMPOS DO ITEM
// ============================================================

function limparCamposItem() {

    if (skuInput) {
        skuInput.value = '';
    }

    if (qtdSolicitadaInput) {
        qtdSolicitadaInput.value = '';
    }

    if (qtdSeparadaInput) {
        qtdSeparadaInput.value = '';
    }
}


// ============================================================
// LIMPAR LISTA
// ============================================================

function limparListaItens() {

    if (listaItens) {
        listaItens.innerHTML = '';
    }
}


// ============================================================
// STATUS
// ============================================================

function mostrarStatus(elemento, mensagem, tipo) {

    if (!elemento) {
        return;
    }


    elemento.textContent = mensagem;

    elemento.className = 'status';


    if (tipo) {
        elemento.classList.add(tipo);
    }
}


// ============================================================
// ESCAPAR HTML
// ============================================================

function escaparHTML(valor) {

    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


// ============================================================
// FORMATAÇÃO DE NÚMEROS
// ============================================================

function formatarNumero(numero) {

    if (Number.isInteger(numero)) {
        return numero.toString();
    }

    return numero.toLocaleString('pt-BR');
}
