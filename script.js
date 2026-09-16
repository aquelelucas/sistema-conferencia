const API_URL = 'https://script.google.com/macros/s/AKfycbxnoQ8Nm9-ZsyPk0n_QKb_PFbCiutRuuOm7lJaQv4Cix_BmLh2X5xdZU_-BstX8k_AWYA/exec';
const CHAVE_API = 'KING-CONFERENCIA-2026';

let sessao = '';
let pedidoAtual = null;
let itens = [];

document.addEventListener('DOMContentLoaded', () => {
    const btnEntrar = document.getElementById('btnEntrar');
    const btnSair = document.getElementById('btnSair');
    const btnBuscarPedido = document.getElementById('btnBuscarPedido');
    const btnSemErro = document.getElementById('btnSemErro');
    const btnComErro = document.getElementById('btnComErro');
    const btnAdicionarItem = document.getElementById('btnAdicionarItem');
    const btnRegistrarSemErro = document.getElementById('btnRegistrarSemErro');
    const btnRegistrarComErro = document.getElementById('btnRegistrarComErro');

    carregarConferentes();

    if (btnEntrar) {
        btnEntrar.addEventListener('click', fazerLogin);
    }

    if (btnSair) {
        btnSair.addEventListener('click', sair);
    }

    if (btnBuscarPedido) {
        btnBuscarPedido.addEventListener('click', buscarPedido);
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

    const pedidoInput = document.getElementById('pedido');

    if (pedidoInput) {
        pedidoInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                buscarPedido();
            }
        });
    }

    const skuInput = document.getElementById('sku');

    if (skuInput) {
        skuInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();

                const qtd = document.getElementById('qtdSolicitada');

                if (qtd) {
                    qtd.focus();
                }
            }
        });
    }

    const qtdSeparada = document.getElementById('qtdSeparada');

    if (qtdSeparada) {
        qtdSeparada.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                adicionarItem();
            }
        });
    }
});


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
        throw new Error(`Erro HTTP ${resposta.status}`);
    }

    return await resposta.json();
}


async function carregarConferentes() {
    const select = document.getElementById('conferente');

    if (!select) {
        return;
    }

    select.innerHTML = '<option value="">Carregando conferentes...</option>';
    select.disabled = true;

    try {
        const resultado = await chamarAPI('listarConferentes');

        if (!resultado.sucesso) {
            throw new Error(resultado.mensagem || 'Não foi possível carregar os conferentes.');
        }

        select.innerHTML = '<option value="">Selecione seu nome</option>';

        if (!resultado.conferentes || resultado.conferentes.length === 0) {
            select.innerHTML = '<option value="">Nenhum conferente cadastrado</option>';
            return;
        }

        resultado.conferentes.forEach(nome => {
            const option = document.createElement('option');
            option.value = nome;
            option.textContent = nome;
            select.appendChild(option);
        });

        select.disabled = false;

    } catch (erro) {
        console.error(erro);

        select.innerHTML = '<option value="">Erro ao carregar conferentes</option>';

        mostrarStatusLogin(
            'Não foi possível carregar os conferentes.',
            true
        );
    }
}


async function fazerLogin() {
    const conferente = document.getElementById('conferente');
    const senha = document.getElementById('senha');
    const btnEntrar = document.getElementById('btnEntrar');

    if (!conferente || !senha) {
        return;
    }

    const nome = conferente.value.trim();
    const senhaInformada = senha.value.trim();

    if (!nome) {
        mostrarStatusLogin('Selecione seu nome.', true);
        conferente.focus();
        return;
    }

    if (!senhaInformada) {
        mostrarStatusLogin('Digite sua senha.', true);
        senha.focus();
        return;
    }

    if (btnEntrar) {
        btnEntrar.disabled = true;
        btnEntrar.textContent = 'Entrando...';
    }

    try {
        const resultado = await chamarAPI('login', {
            conferente: nome,
            senha: senhaInformada
        });

        if (!resultado.sucesso) {
            mostrarStatusLogin(
                resultado.mensagem || 'Usuário ou senha incorretos.',
                true
            );
            return;
        }

        sessao = resultado.sessao;

        mostrarSistema(nome);

    } catch (erro) {
        console.error(erro);

        mostrarStatusLogin(
            'Não foi possível conectar ao sistema.',
            true
        );

    } finally {
        if (btnEntrar) {
            btnEntrar.disabled = false;
            btnEntrar.textContent = 'Entrar';
        }
    }
}


function mostrarSistema(nome) {
    const telaLogin = document.getElementById('telaLogin');
    const telaSistema = document.getElementById('telaSistema');
    const nomeConferente = document.getElementById('nomeConferente');
    const pedido = document.getElementById('pedido');

    if (telaLogin) {
        telaLogin.style.display = 'none';
    }

    if (telaSistema) {
        telaSistema.style.display = 'block';
    }

    if (nomeConferente) {
        nomeConferente.textContent = nome;
    }

    limparTelaConferencia();

    if (pedido) {
        pedido.focus();
    }
}


function sair() {
    sessao = '';
    pedidoAtual = null;
    itens = [];

    const telaLogin = document.getElementById('telaLogin');
    const telaSistema = document.getElementById('telaSistema');
    const senha = document.getElementById('senha');
    const conferente = document.getElementById('conferente');

    if (telaSistema) {
        telaSistema.style.display = 'none';
    }

    if (telaLogin) {
        telaLogin.style.display = 'block';
    }

    if (senha) {
        senha.value = '';
    }

    if (conferente) {
        conferente.value = '';
    }

    limparTelaConferencia();

    mostrarStatusLogin('', false);

    if (conferente) {
        conferente.focus();
    }
}


async function buscarPedido() {
    const pedidoInput = document.getElementById('pedido');
    const btnBuscarPedido = document.getElementById('btnBuscarPedido');

    if (!pedidoInput) {
        return;
    }

    const numeroPedido = pedidoInput.value.trim();

    if (!numeroPedido) {
        mostrarStatusSistema('Informe ou escaneie o número do pedido.', true);
        pedidoInput.focus();
        return;
    }

    if (!sessao) {
        mostrarStatusSistema('Sua sessão expirou. Faça login novamente.', true);
        return;
    }

    if (btnBuscarPedido) {
        btnBuscarPedido.disabled = true;
        btnBuscarPedido.textContent = 'Buscando...';
    }

    esconderResultado();
    esconderSecaoErro();

    try {
        const resultado = await chamarAPI('pedido', {
            sessao: sessao,
            pedido: numeroPedido
        });

        if (!resultado.sucesso) {
            mostrarStatusSistema(
                resultado.mensagem || 'Pedido não encontrado.',
                true
            );
            return;
        }

        pedidoAtual = resultado;

        mostrarResultado();

        mostrarStatusSistema(
            `Pedido ${resultado.pedido || numeroPedido} encontrado.`
        );

    } catch (erro) {
        console.error(erro);

        mostrarStatusSistema(
            'Erro ao consultar o pedido.',
            true
        );

    } finally {
        if (btnBuscarPedido) {
            btnBuscarPedido.disabled = false;
            btnBuscarPedido.textContent = 'Buscar pedido';
        }
    }
}


function mostrarResultado() {
    const secaoResultado = document.getElementById('secaoResultado');

    if (secaoResultado) {
        secaoResultado.style.display = 'block';
    }

    esconderSecaoErro();

    const btnRegistrarSemErro = document.getElementById('btnRegistrarSemErro');

    if (btnRegistrarSemErro) {
        btnRegistrarSemErro.style.display = 'none';
    }

    const btnRegistrarComErro = document.getElementById('btnRegistrarComErro');

    if (btnRegistrarComErro) {
        btnRegistrarComErro.style.display = 'none';
    }
}


function esconderResultado() {
    const secaoResultado = document.getElementById('secaoResultado');

    if (secaoResultado) {
        secaoResultado.style.display = 'none';
    }
}


function selecionarSemErro() {
    itens = [];
    atualizarListaItens();

    esconderSecaoErro();

    const btnRegistrarSemErro = document.getElementById('btnRegistrarSemErro');

    if (btnRegistrarSemErro) {
        btnRegistrarSemErro.style.display = 'block';
    }

    const btnRegistrarComErro = document.getElementById('btnRegistrarComErro');

    if (btnRegistrarComErro) {
        btnRegistrarComErro.style.display = 'none';
    }

    mostrarStatusSistema(
        'Separação marcada como correta. Clique em "Registrar conferência".'
    );
}


function selecionarComErro() {
    const secaoErro = document.getElementById('secaoErro');

    if (secaoErro) {
        secaoErro.style.display = 'block';
    }

    const btnRegistrarSemErro = document.getElementById('btnRegistrarSemErro');

    if (btnRegistrarSemErro) {
        btnRegistrarSemErro.style.display = 'none';
    }

    const btnRegistrarComErro = document.getElementById('btnRegistrarComErro');

    if (btnRegistrarComErro) {
        btnRegistrarComErro.style.display = 'block';
    }

    mostrarStatusSistema(
        'Informe os itens que apresentaram erro na separação.'
    );

    const sku = document.getElementById('sku');

    if (sku) {
        sku.focus();
    }
}


function esconderSecaoErro() {
    const secaoErro = document.getElementById('secaoErro');

    if (secaoErro) {
        secaoErro.style.display = 'none';
    }

    const btnRegistrarSemErro = document.getElementById('btnRegistrarSemErro');

    if (btnRegistrarSemErro) {
        btnRegistrarSemErro.style.display = 'none';
    }

    const btnRegistrarComErro = document.getElementById('btnRegistrarComErro');

    if (btnRegistrarComErro) {
        btnRegistrarComErro.style.display = 'none';
    }
}


function adicionarItem() {
    const sku = document.getElementById('sku');
    const qtdSolicitada = document.getElementById('qtdSolicitada');
    const qtdSeparada = document.getElementById('qtdSeparada');

    if (!sku || !qtdSolicitada || !qtdSeparada) {
        return;
    }

    const skuValor = sku.value.trim();
    const solicitadaValor = qtdSolicitada.value.trim();
    const separadaValor = qtdSeparada.value.trim();

    if (!skuValor) {
        mostrarStatusSistema('Informe o SKU/produto.', true);
        sku.focus();
        return;
    }

    if (!solicitadaValor) {
        mostrarStatusSistema('Informe a quantidade solicitada.', true);
        qtdSolicitada.focus();
        return;
    }

    if (!separadaValor) {
        mostrarStatusSistema('Informe a quantidade separada.', true);
        qtdSeparada.focus();
        return;
    }

    const quantidadeSolicitada = Number(solicitadaValor);
    const quantidadeSeparada = Number(separadaValor);

    if (
        !Number.isFinite(quantidadeSolicitada) ||
        quantidadeSolicitada < 0
    ) {
        mostrarStatusSistema(
            'A quantidade solicitada é inválida.',
            true
        );
        qtdSolicitada.focus();
        return;
    }

    if (
        !Number.isFinite(quantidadeSeparada) ||
        quantidadeSeparada < 0
    ) {
        mostrarStatusSistema(
            'A quantidade separada é inválida.',
            true
        );
        qtdSeparada.focus();
        return;
    }

    itens.push({
        sku: skuValor,
        qtdSolicitada: quantidadeSolicitada,
        qtdSeparada: quantidadeSeparada
    });

    atualizarListaItens();

    sku.value = '';
    qtdSolicitada.value = '';
    qtdSeparada.value = '';

    sku.focus();

    mostrarStatusSistema(
        'Item adicionado à conferência.'
    );
}


function atualizarListaItens() {
    const listaItens = document.getElementById('listaItens');

    if (!listaItens) {
        return;
    }

    listaItens.innerHTML = '';

    if (itens.length === 0) {
        listaItens.innerHTML = '<p class="lista-vazia">Nenhum item adicionado.</p>';
        return;
    }

    itens.forEach((item, indice) => {
        const card = document.createElement('div');

        card.className = 'item-conferencia';

        card.innerHTML = `
            <div class="item-info">
                <strong>${escaparHTML(item.sku)}</strong>
                <span>
                    Solicitada: ${item.qtdSolicitada}
                    |
                    Separada: ${item.qtdSeparada}
                </span>
            </div>

            <button
                type="button"
                class="btn-remover"
                onclick="removerItem(${indice})"
            >
                Remover
            </button>
        `;

        listaItens.appendChild(card);
    });
}


function removerItem(indice) {
    if (indice < 0 || indice >= itens.length) {
        return;
    }

    itens.splice(indice, 1);

    atualizarListaItens();

    mostrarStatusSistema(
        'Item removido.'
    );
}


async function registrarSemErro() {
    if (!pedidoAtual) {
        mostrarStatusSistema(
            'Nenhum pedido foi consultado.',
            true
        );
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


async function registrarComErro() {
    if (!pedidoAtual) {
        mostrarStatusSistema(
            'Nenhum pedido foi consultado.',
            true
        );
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
        mostrarStatusSistema(
            'Selecione o tipo de erro.',
            true
        );
        tipoErro.focus();
        return;
    }

    if (!grav) {
        mostrarStatusSistema(
            'Selecione a gravidade.',
            true
        );
        gravidade.focus();
        return;
    }

    if (!acao) {
        mostrarStatusSistema(
            'Informe a ação tomada.',
            true
        );
        acaoTomada.focus();
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


async function enviarConferencia(dadosConferencia) {
    const btnRegistrarSemErro = document.getElementById('btnRegistrarSemErro');
    const btnRegistrarComErro = document.getElementById('btnRegistrarComErro');

    if (!sessao) {
        mostrarStatusSistema(
            'Sua sessão expirou. Faça login novamente.',
            true
        );
        return;
    }

    const pedido =
        (pedidoAtual && (
            pedidoAtual.pedido ||
            pedidoAtual.numeroPedido
        )) ||
        document.getElementById('pedido').value.trim();

    if (!pedido) {
        mostrarStatusSistema(
            'Número do pedido não identificado.',
            true
        );
        return;
    }

    if (btnRegistrarSemErro) {
        btnRegistrarSemErro.disabled = true;
        btnRegistrarSemErro.textContent = 'Registrando...';
    }

    if (btnRegistrarComErro) {
        btnRegistrarComErro.disabled = true;
        btnRegistrarComErro.textContent = 'Registrando...';
    }

    mostrarStatusSistema(
        'Registrando conferência...'
    );

    try {
        const resultado = await chamarAPI(
            'registrarConferencia',
            {
                sessao: sessao,
                pedido: pedido,
                erro: dadosConferencia.erro,
                itens: dadosConferencia.itens,
                tipoErro: dadosConferencia.tipoErro,
                gravidade: dadosConferencia.gravidade,
                acaoTomada: dadosConferencia.acaoTomada,
                observacao: dadosConferencia.observacao
            }
        );

        if (!resultado.sucesso) {
            throw new Error(
                resultado.mensagem ||
                'Não foi possível registrar a conferência.'
            );
        }

        mostrarStatusSistema(
            '✓ Conferência registrada com sucesso!'
        );

        limparTelaConferencia();

    } catch (erro) {
        console.error(erro);

        mostrarStatusSistema(
            erro.message ||
            'Erro ao registrar a conferência.',
            true
        );

    } finally {
        if (btnRegistrarSemErro) {
            btnRegistrarSemErro.disabled = false;
            btnRegistrarSemErro.textContent = 'Registrar conferência';
        }

        if (btnRegistrarComErro) {
            btnRegistrarComErro.disabled = false;
            btnRegistrarComErro.textContent = 'Registrar conferência';
        }
    }
}


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

    if (pedido) {
        pedido.value = '';
    }

    if (sku) {
        sku.value = '';
    }

    if (qtdSolicitada) {
        qtdSolicitada.value = '';
    }

    if (qtdSeparada) {
        qtdSeparada.value = '';
    }

    if (tipoErro) {
        tipoErro.value = '';
    }

    if (gravidade) {
        gravidade.value = '';
    }

    if (acaoTomada) {
        acaoTomada.value = '';
    }

    if (observacao) {
        observacao.value = '';
    }

    esconderResultado();
    esconderSecaoErro();

    atualizarListaItens();

    if (pedido) {
        pedido.focus();
    }
}


function mostrarStatusSistema(mensagem, erro = false) {
    const elemento = document.getElementById('statusSistema');

    if (!elemento) {
        return;
    }

    elemento.textContent = mensagem || '';
    elemento.className = erro
        ? 'status erro'
        : 'status sucesso';
}


function mostrarStatusLogin(mensagem, erro = false) {
    const elemento = document.getElementById('statusLogin');

    if (!elemento) {
        return;
    }

    elemento.textContent = mensagem || '';
    elemento.className = erro
        ? 'status erro'
        : 'status sucesso';
}


function escaparHTML(valor) {
    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
