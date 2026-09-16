// ======================================================
// CONFIGURAÇÕES
// ======================================================

const URL_API =
    'https://script.google.com/macros/s/AKfycbyA7taRtIZmSugdvn3IUWs5Tm2rPDGUDkZxHZRz_qKFsRemGaoY_mNr_fcSXb8PTvap4Q/exec';

const CHAVE_API = 'KING-CONFERENCIA-2026';
const CHAVE_SESSAO = 'king_conferencia_sessao';


// ======================================================
// VARIÁVEIS
// ======================================================

let sessao = null;
let pedidoAtual = null;
let erroSelecionado = false;


// ======================================================
// ELEMENTOS
// ======================================================

const telaLogin = document.getElementById('telaLogin');
const telaSistema = document.getElementById('telaSistema');

const conferente = document.getElementById('conferente');
const senha = document.getElementById('senha');
const btnEntrar = document.getElementById('btnEntrar');
const statusLogin = document.getElementById('statusLogin');

const nomeConferente =
    document.getElementById('nomeConferente');

const btnSair =
    document.getElementById('btnSair');

const pedido =
    document.getElementById('pedido');

const btnBuscarPedido =
    document.getElementById('btnBuscarPedido');

const secaoResultado =
    document.getElementById('secaoResultado');

const btnSemErro =
    document.getElementById('btnSemErro');

const btnComErro =
    document.getElementById('btnComErro');

const secaoErro =
    document.getElementById('secaoErro');

const sku =
    document.getElementById('sku');

const qtdSolicitada =
    document.getElementById('qtdSolicitada');

const qtdSeparada =
    document.getElementById('qtdSeparada');

const btnAdicionarItem =
    document.getElementById('btnAdicionarItem');

const listaItens =
    document.getElementById('listaItens');

const tipoErro =
    document.getElementById('tipoErro');

const gravidade =
    document.getElementById('gravidade');

const acaoTomada =
    document.getElementById('acaoTomada');

const observacao =
    document.getElementById('observacao');

const btnRegistrarSemErro =
    document.getElementById('btnRegistrarSemErro');

const btnRegistrarComErro =
    document.getElementById('btnRegistrarComErro');

const statusSistema =
    document.getElementById('statusSistema');


// ======================================================
// INICIALIZAÇÃO
// ======================================================

document.addEventListener('DOMContentLoaded', () => {

    esconderTudo();

    carregarConferentes();

    const sessaoSalva =
        sessionStorage.getItem(CHAVE_SESSAO);

    if (sessaoSalva) {

        try {

            sessao = JSON.parse(sessaoSalva);

            validarSessao();

        } catch (erro) {

            sessionStorage.removeItem(
                CHAVE_SESSAO
            );

        }

    }

});


// ======================================================
// ESCONDER SEÇÕES
// ======================================================

function esconderTudo() {

    if (secaoResultado) {
        secaoResultado.style.display = 'none';
    }

    if (secaoErro) {
        secaoErro.style.display = 'none';
    }

    if (btnRegistrarSemErro) {
        btnRegistrarSemErro.style.display = 'none';
    }

}


// ======================================================
// API
// ======================================================

async function chamarAPI(acao, dados = {}) {

    const resposta = await fetch(URL_API, {

        method: 'POST',

        headers: {
            'Content-Type':
                'text/plain;charset=utf-8'
        },

        body: JSON.stringify({

            chave: CHAVE_API,

            acao: acao,

            dados: dados

        })

    });

    const texto = await resposta.text();

    let resultado;

    try {

        resultado = JSON.parse(texto);

    } catch (erro) {

        console.error(
            'Resposta da API:',
            texto
        );

        throw new Error(
            'A API retornou uma resposta inválida.'
        );

    }

    return resultado;

}


// ======================================================
// CARREGAR CONFERENTES
// ======================================================

async function carregarConferentes() {

    try {

        conferente.innerHTML =
            '<option value="">Carregando conferentes...</option>';

        const resultado =
            await chamarAPI(
                'listarConferentes'
            );

        if (!resultado.sucesso) {

            conferente.innerHTML =
                '<option value="">Nenhum conferente disponível</option>';

            statusLogin.textContent =
                resultado.mensagem || '';

            return;

        }

        const lista =
            resultado.conferentes || [];

        conferente.innerHTML =
            '<option value="">Selecione seu nome</option>';

        lista.forEach(nome => {

            const option =
                document.createElement('option');

            option.value = nome;

            option.textContent = nome;

            conferente.appendChild(option);

        });

    } catch (erro) {

        console.error(erro);

        conferente.innerHTML =
            '<option value="">Erro ao carregar</option>';

        statusLogin.textContent =
            erro.message;

    }

}


// ======================================================
// LOGIN
// ======================================================

btnEntrar.addEventListener(
    'click',
    fazerLogin
);


senha.addEventListener(
    'keydown',
    event => {

        if (event.key === 'Enter') {

            fazerLogin();

        }

    }
);


async function fazerLogin() {

    const nome =
        conferente.value;

    const senhaDigitada =
        senha.value;

    if (!nome) {

        statusLogin.textContent =
            'Selecione seu nome.';

        conferente.focus();

        return;

    }

    if (!senhaDigitada) {

        statusLogin.textContent =
            'Digite sua senha.';

        senha.focus();

        return;

    }

    btnEntrar.disabled = true;

    statusLogin.textContent =
        'Entrando...';

    try {

        const resultado =
            await chamarAPI(
                'login',
                {
                    conferente: nome,
                    senha: senhaDigitada
                }
            );

        if (!resultado.sucesso) {

            statusLogin.textContent =
                resultado.mensagem ||
                'Usuário ou senha inválidos.';

            btnEntrar.disabled = false;

            return;

        }

        sessao =
            resultado.sessao;

        sessionStorage.setItem(
            CHAVE_SESSAO,
            JSON.stringify(sessao)
        );

        senha.value = '';

        mostrarSistema();

    } catch (erro) {

        console.error(erro);

        statusLogin.textContent =
            erro.message;

    }

    btnEntrar.disabled = false;

}


// ======================================================
// VALIDAR SESSÃO
// ======================================================

async function validarSessao() {

    try {

        const resultado =
            await chamarAPI(
                'validarSessao',
                {
                    token: sessao.token
                }
            );

        if (!resultado.sucesso) {

            encerrarSessao();

            return;

        }

        mostrarSistema();

    } catch (erro) {

        encerrarSessao();

    }

}


// ======================================================
// MOSTRAR SISTEMA
// ======================================================

function mostrarSistema() {

    telaLogin.style.display =
        'none';

    telaSistema.style.display =
        'block';

    nomeConferente.textContent =
        sessao.conferente;

    limparTelaConferencia();

    pedido.focus();

}


// ======================================================
// SAIR
// ======================================================

btnSair.addEventListener(
    'click',
    encerrarSessao
);


function encerrarSessao() {

    sessao = null;

    sessionStorage.removeItem(
        CHAVE_SESSAO
    );

    telaSistema.style.display =
        'none';

    telaLogin.style.display =
        'block';

    senha.value = '';

    statusLogin.textContent = '';

    limparTelaConferencia();

}


// ======================================================
// BUSCAR PEDIDO
// ======================================================

btnBuscarPedido.addEventListener(
    'click',
    buscarPedido
);


pedido.addEventListener(
    'keydown',
    event => {

        if (event.key === 'Enter') {

            buscarPedido();

        }

    }
);


async function buscarPedido() {

    const numero =
        pedido.value.trim();

    if (!numero) {

        mostrarStatus(
            'Digite ou escaneie o número do pedido.'
        );

        pedido.focus();

        return;

    }

    btnBuscarPedido.disabled = true;

    mostrarStatus(
        'Buscando pedido...'
    );

    try {

        const resultado =
            await chamarAPI(
                'pedido',
                {
                    token: sessao.token,
                    pedido: numero
                }
            );

        if (!resultado.sucesso) {

            mostrarStatus(
                resultado.mensagem ||
                'Pedido não encontrado.'
            );

            btnBuscarPedido.disabled = false;

            return;

        }

        pedidoAtual =
            resultado.pedido;

        erroSelecionado = false;

        esconderTudo();

        /*
         * IMPORTANTE:
         *
         * Depois de encontrar o pedido,
         * NÃO abrimos SKU.
         *
         * Primeiro perguntamos se
         * a separação está correta.
         */

        secaoResultado.style.display =
            'block';

        mostrarStatus(
            'Pedido encontrado. Informe o resultado da conferência.'
        );

    } catch (erro) {

        console.error(erro);

        mostrarStatus(
            erro.message
        );

    }

    btnBuscarPedido.disabled = false;

}


// ======================================================
// SEPARAÇÃO SEM ERRO
// ======================================================

btnSemErro.addEventListener(
    'click',
    selecionarSemErro
);


function selecionarSemErro() {

    if (!pedidoAtual) {

        mostrarStatus(
            'Nenhum pedido foi carregado.'
        );

        return;

    }

    erroSelecionado = false;

    secaoErro.style.display =
        'none';

    btnRegistrarSemErro.style.display =
        'block';

    mostrarStatus(
        'A separação está correta. Clique em registrar.'
    );

}


// ======================================================
// SEPARAÇÃO COM ERRO
// ======================================================

btnComErro.addEventListener(
    'click',
    selecionarComErro
);


function selecionarComErro() {

    if (!pedidoAtual) {

        mostrarStatus(
            'Nenhum pedido foi carregado.'
        );

        return;

    }

    erroSelecionado = true;

    /*
     * Agora sim aparece o formulário
     * do SKU com problema.
     */

    secaoErro.style.display =
        'block';

    btnRegistrarSemErro.style.display =
        'none';

    mostrarStatus(
        'Informe o item que apresentou o erro.'
    );

    sku.focus();

}


// ======================================================
// ADICIONAR SKU COM ERRO
// ======================================================

btnAdicionarItem.addEventListener(
    'click',
    adicionarItem
);


sku.addEventListener(
    'keydown',
    event => {

        if (event.key === 'Enter') {

            event.preventDefault();

            qtdSolicitada.focus();

        }

    }
);


qtdSolicitada.addEventListener(
    'keydown',
    event => {

        if (event.key === 'Enter') {

            event.preventDefault();

            qtdSeparada.focus();

        }

    }
);


qtdSeparada.addEventListener(
    'keydown',
    event => {

        if (event.key === 'Enter') {

            event.preventDefault();

            adicionarItem();

        }

    }
);


function adicionarItem() {

    if (!erroSelecionado) {

        mostrarStatus(
            'Primeiro informe que a separação possui erro.'
        );

        return;

    }

    const skuValor =
        sku.value.trim();

    const solicitada =
        Number(qtdSolicitada.value);

    const separada =
        Number(qtdSeparada.value);

    if (!skuValor) {

        mostrarStatus(
            'Informe o SKU ou produto.'
        );

        sku.focus();

        return;

    }

    if (
        qtdSolicitada.value === '' ||
        isNaN(solicitada) ||
        solicitada < 0
    ) {

        mostrarStatus(
            'Informe a quantidade solicitada.'
        );

        qtdSolicitada.focus();

        return;

    }

    if (
        qtdSeparada.value === '' ||
        isNaN(separada) ||
        separada < 0
    ) {

        mostrarStatus(
            'Informe a quantidade separada.'
        );

        qtdSeparada.focus();

        return;

    }

    /*
     * O item é armazenado temporariamente
     * para ser enviado junto com o registro.
     */

    const item = {

        sku: skuValor,

        qtdSolicitada: solicitada,

        qtdSeparada: separada

    };

    /*
     * Guardamos os itens em uma propriedade
     * do pedido atual.
     */

    if (!pedidoAtual.itens) {

        pedidoAtual.itens = [];

    }

    pedidoAtual.itens.push(item);

    renderizarItens();

    sku.value = '';

    qtdSolicitada.value = '';

    qtdSeparada.value = '';

    sku.focus();

    mostrarStatus(
        'Item adicionado. Você pode adicionar outro SKU.'
    );

}


// ======================================================
// MOSTRAR ITENS
// ======================================================

function renderizarItens() {

    listaItens.innerHTML = '';

    const itens =
        pedidoAtual.itens || [];

    itens.forEach(
        (item, index) => {

            const div =
                document.createElement('div');

            div.className =
                'item-conferencia';

            div.innerHTML = `

                <div>
                    <strong>
                        ${escapeHTML(item.sku)}
                    </strong>
                </div>

                <div>
                    Solicitada:
                    <strong>
                        ${item.qtdSolicitada}
                    </strong>
                </div>

                <div>
                    Separada:
                    <strong>
                        ${item.qtdSeparada}
                    </strong>
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

        }
    );

    document
        .querySelectorAll('.btn-remover-item')
        .forEach(botao => {

            botao.addEventListener(
                'click',
                () => {

                    const index =
                        Number(
                            botao.dataset.index
                        );

                    pedidoAtual.itens.splice(
                        index,
                        1
                    );

                    renderizarItens();

                }
            );

        });

}


// ======================================================
// REGISTRAR SEM ERRO
// ======================================================

btnRegistrarSemErro.addEventListener(
    'click',
    async () => {

        await registrarConferencia({

            erro: false,

            itens: [],

            tipoErro: '',

            gravidade: '',

            acaoTomada: '',

            observacao: ''

        });

    }
);


// ======================================================
// REGISTRAR COM ERRO
// ======================================================

btnRegistrarComErro.addEventListener(
    'click',
    async () => {

        const itens =
            pedidoAtual &&
            pedidoAtual.itens
                ? pedidoAtual.itens
                : [];

        if (itens.length === 0) {

            mostrarStatus(
                'Adicione pelo menos um SKU com erro.'
            );

            sku.focus();

            return;

        }

        if (!tipoErro.value) {

            mostrarStatus(
                'Selecione o tipo de erro.'
            );

            tipoErro.focus();

            return;

        }

        if (!gravidade.value) {

            mostrarStatus(
                'Selecione a gravidade.'
            );

            gravidade.focus();

            return;

        }

        if (!acaoTomada.value.trim()) {

            mostrarStatus(
                'Informe a ação tomada.'
            );

            acaoTomada.focus();

            return;

        }

        await registrarConferencia({

            erro: true,

            itens: itens,

            tipoErro:
                tipoErro.value,

            gravidade:
                gravidade.value,

            acaoTomada:
                acaoTomada.value.trim(),

            observacao:
                observacao.value.trim()

        });

    }
);


// ======================================================
// ENVIAR PARA A API
// ======================================================

async function registrarConferencia(dados) {

    if (!pedidoAtual) {

        mostrarStatus(
            'Nenhum pedido selecionado.'
        );

        return;

    }

    btnRegistrarSemErro.disabled =
        true;

    btnRegistrarComErro.disabled =
        true;

    mostrarStatus(
        'Registrando conferência...'
    );

    try {

        const resultado =
            await chamarAPI(
                'registrarConferencia',
                {

                    token:
                        sessao.token,

                    pedido:
                        pedidoAtual.pedido,

                    itens:
                        dados.itens,

                    erro:
                        dados.erro,

                    tipoErro:
                        dados.tipoErro,

                    gravidade:
                        dados.gravidade,

                    acaoTomada:
                        dados.acaoTomada,

                    observacao:
                        dados.observacao

                }
            );

        if (!resultado.sucesso) {

            mostrarStatus(
                resultado.mensagem ||
                'Erro ao registrar.'
            );

            btnRegistrarSemErro.disabled =
                false;

            btnRegistrarComErro.disabled =
                false;

            return;

        }

        mostrarStatus(
            resultado.mensagem ||
            'Conferência registrada com sucesso!'
        );

        limparTelaConferencia();

    } catch (erro) {

        console.error(erro);

        mostrarStatus(
            erro.message
        );

    }

    btnRegistrarSemErro.disabled =
        false;

    btnRegistrarComErro.disabled =
        false;

}


// ======================================================
// LIMPAR CONFERÊNCIA
// ======================================================

function limparTelaConferencia() {

    pedidoAtual = null;

    erroSelecionado = false;

    pedido.value = '';

    sku.value = '';

    qtdSolicitada.value = '';

    qtdSeparada.value = '';

    listaItens.innerHTML = '';

    tipoErro.value = '';

    gravidade.value = '';

    acaoTomada.value = '';

    observacao.value = '';

    esconderTudo();

}


// ======================================================
// STATUS
// ======================================================

function mostrarStatus(mensagem) {

    if (statusSistema) {

        statusSistema.textContent =
            mensagem;

    }

}


// ======================================================
// PROTEÇÃO DE TEXTO
// ======================================================

function escapeHTML(valor) {

    return String(valor)

        .replace(/&/g, '&amp;')

        .replace(/</g, '&lt;')

        .replace(/>/g, '&gt;')

        .replace(/"/g, '&quot;')

        .replace(/'/g, '&#039;');

}
