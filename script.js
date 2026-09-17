const API_URL = 'https://script.google.com/macros/s/AKfycbxnoQ8Nm9-ZsyPk0n_QKb_PFbCiutRuuOm7lJaQv4Cix_BmLh2X5xdZU_-BstX8k_AWYA/exec';

const CHAVE_API = 'KING-CONFERENCIA-2026';

let sessao = '';
let nomeConferente = '';
let itens = [];


// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

    const sessaoSalva = sessionStorage.getItem('sessaoConferencia');
    const nomeSalvo = sessionStorage.getItem('nomeConferente');

    if (sessaoSalva && nomeSalvo) {
        sessao = sessaoSalva;
        nomeConferente = nomeSalvo;

        mostrarSistema(nomeConferente);
    }

    carregarConferentes();

    const btnEntrar = document.getElementById('btnEntrar');
    const btnBuscarPedido = document.getElementById('btnBuscarPedido');
    const btnSair = document.getElementById('btnSair');

    const btnSemErro = document.getElementById('btnSemErro');
    const btnComErro = document.getElementById('btnComErro');

    const btnAdicionarItem = document.getElementById('btnAdicionarItem');

    const btnRegistrarSemErro = document.getElementById('btnRegistrarSemErro');
    const btnRegistrarComErro = document.getElementById('btnRegistrarComErro');

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

    const campoPedido = document.getElementById('pedido');

    if (campoPedido) {
        campoPedido.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                buscarPedido();
            }
        });
    }

});


// ============================================================
// FUNÇÃO PRINCIPAL PARA CHAMAR A API
// ============================================================

async function chamarAPI(acao, dados = {}) {

    const corpo = {
        chave: CHAVE_API,
        acao: acao,
        ...dados
    };

    console.log('Enviando para API:', acao, {
        ...corpo,
        sessao: corpo.sessao ? '[SESSÃO PRESENTE]' : '[SEM SESSÃO]'
    });

    try {

        const resposta = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(corpo)
        });

        console.log('Status da API:', resposta.status);

        const texto = await resposta.text();

        console.log('Resposta da API:', texto);

        let resultado;

        try {
            resultado = JSON.parse(texto);
        } catch (erroJSON) {

            console.error('A API não retornou JSON válido:', texto);

            return {
                sucesso: false,
                mensagem: 'A API retornou uma resposta inválida.'
            };
        }

        return resultado;

    } catch (erro) {

        console.error('Erro ao chamar API:', erro);

        return {
            sucesso: false,
            mensagem: 'Não foi possível conectar ao sistema.'
        };
    }
}


// ============================================================
// CARREGAR CONFERENTES
// ============================================================

async function carregarConferentes() {

    const select = document.getElementById('conferente');

    if (!select) {
        return;
    }

    try {

        const resultado = await chamarAPI('listarConferentes');

        if (!resultado.sucesso) {

            mostrarStatusLogin(
                resultado.mensagem || 'Não foi possível carregar os conferentes.',
                true
            );

            return;
        }

        select.innerHTML = '';

        const opcaoInicial = document.createElement('option');
        opcaoInicial.value = '';
        opcaoInicial.textContent = 'Selecione o conferente';
        opcaoInicial.disabled = true;
        opcaoInicial.selected = true;

        select.appendChild(opcaoInicial);

        if (!resultado.conferentes || resultado.conferentes.length === 0) {

            mostrarStatusLogin(
                'Nenhum conferente foi cadastrado ainda.',
                true
            );

            return;
        }

        resultado.conferentes.forEach(function (nome) {

            const opcao = document.createElement('option');

            opcao.value = nome;
            opcao.textContent = nome;

            select.appendChild(opcao);
        });

    } catch (erro) {

        console.error('Erro ao carregar conferentes:', erro);

        mostrarStatusLogin(
            'Erro ao carregar os conferentes.',
            true
        );
    }
}


// ============================================================
// LOGIN
// ============================================================

async function fazerLogin() {

    const campoConferente = document.getElementById('conferente');
    const campoSenha = document.getElementById('senha');

    const conferente = campoConferente ? campoConferente.value.trim() : '';
    const senha = campoSenha ? campoSenha.value : '';

    if (!conferente) {

        mostrarStatusLogin(
            'Selecione um conferente.',
            true
        );

        return;
    }

    if (!senha) {

        mostrarStatusLogin(
            'Digite a senha.',
            true
        );

        return;
    }

    mostrarStatusLogin('Entrando...', false);

    const resultado = await chamarAPI('login', {
        conferente: conferente,
        senha: senha
    });

    if (!resultado.sucesso) {

        mostrarStatusLogin(
            resultado.mensagem || 'Não foi possível fazer login.',
            true
        );

        return;
    }

    if (!resultado.sessao) {

        console.error('Login realizado, mas a API não retornou sessão.');

        mostrarStatusLogin(
            'O login foi realizado, mas a sessão não foi criada.',
            true
        );

        return;
    }

    // Guarda a sessão na memória
    sessao = resultado.sessao;

    nomeConferente = resultado.conferente || conferente;

    // Guarda também no navegador
    sessionStorage.setItem(
        'sessaoConferencia',
        sessao
    );

    sessionStorage.setItem(
        'nomeConferente',
        nomeConferente
    );

    console.log('Login realizado.');
    console.log('Conferente:', nomeConferente);
    console.log('Sessão armazenada:', sessao ? 'SIM' : 'NÃO');

    mostrarSistema(nomeConferente);

    mostrarStatusSistema(
        'Login realizado com sucesso.',
        false
    );

    limparCamposConferencia();
}


// ============================================================
// MOSTRAR SISTEMA
// ============================================================

function mostrarSistema(nome) {

    const telaLogin = document.getElementById('telaLogin');
    const telaSistema = document.getElementById('telaSistema');
    const nomeElemento = document.getElementById('nomeConferente');

    if (telaLogin) {
        telaLogin.style.display = 'none';
    }

    if (telaSistema) {
        telaSistema.style.display = 'block';
    }

    if (nomeElemento) {
        nomeElemento.textContent = nome;
    }

    const campoPedido = document.getElementById('pedido');

    if (campoPedido) {

        setTimeout(function () {
            campoPedido.focus();
        }, 100);
    }
}


// ============================================================
// SAIR
// ============================================================

function sair() {

    sessao = '';
    nomeConferente = '';
    itens = [];

    sessionStorage.removeItem('sessaoConferencia');
    sessionStorage.removeItem('nomeConferente');

    const telaLogin = document.getElementById('telaLogin');
    const telaSistema = document.getElementById('telaSistema');

    if (telaSistema) {
        telaSistema.style.display = 'none';
    }

    if (telaLogin) {
        telaLogin.style.display = 'block';
    }

    const campoSenha = document.getElementById('senha');

    if (campoSenha) {
        campoSenha.value = '';
    }

    const campoConferente = document.getElementById('conferente');

    if (campoConferente) {
        campoConferente.value = '';
    }

    limparCamposConferencia();

    mostrarStatusLogin('', false);
}


// ============================================================
// BUSCAR PEDIDO
// ============================================================

async function buscarPedido() {

    const campoPedido = document.getElementById('pedido');

    if (!campoPedido) {
        return;
    }

    const numeroPedido = campoPedido.value.trim();

    if (!numeroPedido) {

        mostrarStatusSistema(
            'Digite ou escaneie um pedido.',
            true
        );

        return;
    }

    // Recupera a sessão caso a variável tenha sido perdida
    if (!sessao) {

        const sessaoSalva = sessionStorage.getItem(
            'sessaoConferencia'
        );

        if (sessaoSalva) {
            sessao = sessaoSalva;
        }
    }

    if (!sessao) {

        mostrarStatusSistema(
            'Sua sessão expirou. Faça login novamente.',
            true
        );

        return;
    }

    mostrarStatusSistema(
        'Buscando pedido...',
        false
    );

    const resultado = await chamarAPI('pedido', {
        sessao: sessao,
        pedido: numeroPedido
    });

    console.log('Resultado da busca:', resultado);

    if (!resultado.sucesso) {

        if (
            resultado.mensagem &&
            resultado.mensagem.toLowerCase().includes('sessão')
        ) {

            sessao = '';

            sessionStorage.removeItem(
                'sessaoConferencia'
            );

            mostrarStatusSistema(
                'Sua sessão expirou. Faça login novamente.',
                true
            );

            return;
        }

        mostrarStatusSistema(
            resultado.mensagem || 'Pedido não encontrado.',
            true
        );

        return;
    }

    mostrarStatusSistema(
        'Pedido encontrado.',
        false
    );

    mostrarResultadoPedido(resultado);

    // Limpa a seleção anterior
    itens = [];

    atualizarListaItens();

    // Esconde seção de erro até o usuário escolher "Não"
    const secaoErro = document.getElementById('secaoErro');

    if (secaoErro) {
        secaoErro.style.display = 'none';
    }

    const btnRegistrarSemErro =
        document.getElementById('btnRegistrarSemErro');

    const btnRegistrarComErro =
        document.getElementById('btnRegistrarComErro');

    if (btnRegistrarSemErro) {
        btnRegistrarSemErro.style.display = 'none';
    }

    if (btnRegistrarComErro) {
        btnRegistrarComErro.style.display = 'none';
    }
}


// ============================================================
// MOSTRAR RESULTADO DO PEDIDO
// ============================================================

function mostrarResultadoPedido(resultado) {

    const secaoResultado =
        document.getElementById('secaoResultado');

    if (secaoResultado) {
        secaoResultado.style.display = 'block';
    }

    // Caso o HTML tenha elementos específicos para mostrar os dados
    const pedido = resultado.pedido || '';

    const data = resultado.data || '';
    const turno = resultado.turno || '';
    const separador = resultado.separador || '';

    const elementoPedido =
        document.getElementById('resultadoPedido');

    const elementoData =
        document.getElementById('resultadoData');

    const elementoTurno =
        document.getElementById('resultadoTurno');

    const elementoSeparador =
        document.getElementById('resultadoSeparador');

    if (elementoPedido) {
        elementoPedido.textContent = pedido;
    }

    if (elementoData) {
        elementoData.textContent = data;
    }

    if (elementoTurno) {
        elementoTurno.textContent = turno;
    }

    if (elementoSeparador) {
        elementoSeparador.textContent = separador;
    }
}


// ============================================================
// SELECIONAR SEM ERRO
// ============================================================

function selecionarSemErro() {

    itens = [];

    atualizarListaItens();

    const secaoErro =
        document.getElementById('secaoErro');

    const btnRegistrarSemErro =
        document.getElementById('btnRegistrarSemErro');

    const btnRegistrarComErro =
        document.getElementById('btnRegistrarComErro');

    if (secaoErro) {
        secaoErro.style.display = 'none';
    }

    if (btnRegistrarSemErro) {
        btnRegistrarSemErro.style.display = 'block';
    }

    if (btnRegistrarComErro) {
        btnRegistrarComErro.style.display = 'none';
    }

    mostrarStatusSistema(
        'Separação marcada como correta. Clique em registrar.',
        false
    );
}


// ============================================================
// SELECIONAR COM ERRO
// ============================================================

function selecionarComErro() {

    const secaoErro =
        document.getElementById('secaoErro');

    const btnRegistrarSemErro =
        document.getElementById('btnRegistrarSemErro');

    const btnRegistrarComErro =
        document.getElementById('btnRegistrarComErro');

    if (secaoErro) {
        secaoErro.style.display = 'block';
    }

    if (btnRegistrarSemErro) {
        btnRegistrarSemErro.style.display = 'none';
    }

    if (btnRegistrarComErro) {
        btnRegistrarComErro.style.display = 'block';
    }

    mostrarStatusSistema(
        'Informe os itens que possuem erro.',
        false
    );

    const campoSKU = document.getElementById('sku');

    if (campoSKU) {
        campoSKU.focus();
    }
}


// ============================================================
// ADICIONAR ITEM
// ============================================================

function adicionarItem() {

    const campoSKU =
        document.getElementById('sku');

    const campoQtdSolicitada =
        document.getElementById('qtdSolicitada');

    const campoQtdSeparada =
        document.getElementById('qtdSeparada');

    const sku = campoSKU
        ? campoSKU.value.trim()
        : '';

    const qtdSolicitada = campoQtdSolicitada
        ? campoQtdSolicitada.value.trim()
        : '';

    const qtdSeparada = campoQtdSeparada
        ? campoQtdSeparada.value.trim()
        : '';

    if (!sku) {

        mostrarStatusSistema(
            'Informe o SKU/produto.',
            true
        );

        return;
    }

    if (!qtdSolicitada) {

        mostrarStatusSistema(
            'Informe a quantidade solicitada.',
            true
        );

        return;
    }

    if (!qtdSeparada) {

        mostrarStatusSistema(
            'Informe a quantidade separada.',
            true
        );

        return;
    }

    itens.push({
        sku: sku,
        qtdSolicitada: qtdSolicitada,
        qtdSeparada: qtdSeparada
    });

    atualizarListaItens();

    // Limpa os campos para adicionar outro SKU
    if (campoSKU) {
        campoSKU.value = '';
    }

    if (campoQtdSolicitada) {
        campoQtdSolicitada.value = '';
    }

    if (campoQtdSeparada) {
        campoQtdSeparada.value = '';
    }

    if (campoSKU) {
        campoSKU.focus();
    }

    mostrarStatusSistema(
        'Item adicionado.',
        false
    );
}


// ============================================================
// ATUALIZAR LISTA DE ITENS
// ============================================================

function atualizarListaItens() {

    const lista =
        document.getElementById('listaItens');

    if (!lista) {
        return;
    }

    lista.innerHTML = '';

    if (itens.length === 0) {

        return;
    }

    itens.forEach(function (item, indice) {

        const div = document.createElement('div');

        div.className = 'item-conferencia';

        div.innerHTML = `
            <span>
                <strong>${escapeHTML(item.sku)}</strong>
                | Solicitada: ${escapeHTML(item.qtdSolicitada)}
                | Separada: ${escapeHTML(item.qtdSeparada)}
            </span>

            <button type="button" data-indice="${indice}">
                Remover
            </button>
        `;

        const botaoRemover =
            div.querySelector('button');

        if (botaoRemover) {

            botaoRemover.addEventListener(
                'click',
                function () {

                    const posicao =
                        Number(this.dataset.indice);

                    itens.splice(posicao, 1);

                    atualizarListaItens();
                }
            );
        }

        lista.appendChild(div);
    });
}


// ============================================================
// REGISTRAR SEM ERRO
// ============================================================

async function registrarSemErro() {

    const campoPedido =
        document.getElementById('pedido');

    const numeroPedido = campoPedido
        ? campoPedido.value.trim()
        : '';

    if (!numeroPedido) {

        mostrarStatusSistema(
            'Informe o pedido antes de registrar.',
            true
        );

        return;
    }

    if (!sessao) {

        sessao =
            sessionStorage.getItem('sessaoConferencia') || '';
    }

    if (!sessao) {

        mostrarStatusSistema(
            'Sua sessão expirou. Faça login novamente.',
            true
        );

        return;
    }

    await enviarConferencia({
        erro: false,
        itens: []
    });
}


// ============================================================
// REGISTRAR COM ERRO
// ============================================================

async function registrarComErro() {

    const campoPedido =
        document.getElementById('pedido');

    const numeroPedido = campoPedido
        ? campoPedido.value.trim()
        : '';

    if (!numeroPedido) {

        mostrarStatusSistema(
            'Informe o pedido antes de registrar.',
            true
        );

        return;
    }

    if (itens.length === 0) {

        mostrarStatusSistema(
            'Adicione pelo menos um item com erro.',
            true
        );

        return;
    }

    const tipoErro =
        obterValor('tipoErro');

    const gravidade =
        obterValor('gravidade');

    const acaoTomada =
        obterValor('acaoTomada');

    const observacao =
        obterValor('observacao');

    if (!tipoErro) {

        mostrarStatusSistema(
            'Informe o tipo de erro.',
            true
        );

        return;
    }

    if (!gravidade) {

        mostrarStatusSistema(
            'Informe a gravidade.',
            true
        );

        return;
    }

    if (!acaoTomada) {

        mostrarStatusSistema(
            'Informe a ação tomada.',
            true
        );

        return;
    }

    await enviarConferencia({
        erro: true,
        itens: itens,
        tipoErro: tipoErro,
        gravidade: gravidade,
        acaoTomada: acaoTomada,
        observacao: observacao
    });
}


// ============================================================
// ENVIAR CONFERÊNCIA
// ============================================================

async function enviarConferencia(dados) {

    const campoPedido =
        document.getElementById('pedido');

    const numeroPedido = campoPedido
        ? campoPedido.value.trim()
        : '';

    if (!sessao) {

        sessao =
            sessionStorage.getItem('sessaoConferencia') || '';
    }

    if (!sessao) {

        mostrarStatusSistema(
            'Sua sessão expirou. Faça login novamente.',
            true
        );

        return;
    }

    mostrarStatusSistema(
        'Registrando conferência...',
        false
    );

    const resultado = await chamarAPI(
        'registrarConferencia',
        {
            sessao: sessao,
            pedido: numeroPedido,
            erro: dados.erro,
            itens: dados.itens,
            tipoErro: dados.tipoErro || '',
            gravidade: dados.gravidade || '',
            acaoTomada: dados.acaoTomada || '',
            observacao: dados.observacao || ''
        }
    );

    console.log(
        'Resultado do registro:',
        resultado
    );

    if (!resultado.sucesso) {

        if (
            resultado.mensagem &&
            resultado.mensagem.toLowerCase().includes('sessão')
        ) {

            sessao = '';

            sessionStorage.removeItem(
                'sessaoConferencia'
            );

            mostrarStatusSistema(
                'Sua sessão expirou. Faça login novamente.',
                true
            );

            return;
        }

        mostrarStatusSistema(
            resultado.mensagem ||
            'Não foi possível registrar a conferência.',
            true
        );

        return;
    }

    mostrarStatusSistema(
        resultado.mensagem ||
        'Conferência registrada com sucesso!',
        false
    );

    alert(
        resultado.mensagem ||
        'Conferência registrada com sucesso!'
    );

    limparCamposConferencia();
}


// ============================================================
// LIMPAR CAMPOS DA CONFERÊNCIA
// ============================================================

function limparCamposConferencia() {

    itens = [];

    const campoPedido =
        document.getElementById('pedido');

    const campoSKU =
        document.getElementById('sku');

    const campoQtdSolicitada =
        document.getElementById('qtdSolicitada');

    const campoQtdSeparada =
        document.getElementById('qtdSeparada');

    const campoTipoErro =
        document.getElementById('tipoErro');

    const campoGravidade =
        document.getElementById('gravidade');

    const campoAcao =
        document.getElementById('acaoTomada');

    const campoObservacao =
        document.getElementById('observacao');

    if (campoPedido) {
        campoPedido.value = '';
    }

    if (campoSKU) {
        campoSKU.value = '';
    }

    if (campoQtdSolicitada) {
        campoQtdSolicitada.value = '';
    }

    if (campoQtdSeparada) {
        campoQtdSeparada.value = '';
    }

    if (campoTipoErro) {
        campoTipoErro.value = '';
    }

    if (campoGravidade) {
        campoGravidade.value = '';
    }

    if (campoAcao) {
        campoAcao.value = '';
    }

    if (campoObservacao) {
        campoObservacao.value = '';
    }

    atualizarListaItens();

    const secaoResultado =
        document.getElementById('secaoResultado');

    const secaoErro =
        document.getElementById('secaoErro');

    const btnRegistrarSemErro =
        document.getElementById('btnRegistrarSemErro');

    const btnRegistrarComErro =
        document.getElementById('btnRegistrarComErro');

    if (secaoResultado) {
        secaoResultado.style.display = 'none';
    }

    if (secaoErro) {
        secaoErro.style.display = 'none';
    }

    if (btnRegistrarSemErro) {
        btnRegistrarSemErro.style.display = 'none';
    }

    if (btnRegistrarComErro) {
        btnRegistrarComErro.style.display = 'none';
    }

    if (campoPedido) {

        setTimeout(function () {
            campoPedido.focus();
        }, 100);
    }
}


// ============================================================
// PEGAR VALOR DE CAMPO
// ============================================================

function obterValor(id) {

    const elemento =
        document.getElementById(id);

    if (!elemento) {
        return '';
    }

    return elemento.value.trim();
}


// ============================================================
// STATUS DO LOGIN
// ============================================================

function mostrarStatusLogin(mensagem, erro) {

    const elemento =
        document.getElementById('statusLogin');

    if (!elemento) {
        return;
    }

    elemento.textContent = mensagem || '';

    if (erro) {
        elemento.classList.add('erro');
    } else {
        elemento.classList.remove('erro');
    }
}


// ============================================================
// STATUS DO SISTEMA
// ============================================================

function mostrarStatusSistema(mensagem, erro) {

    const elemento =
        document.getElementById('statusSistema');

    if (!elemento) {
        return;
    }

    elemento.textContent = mensagem || '';

    if (erro) {
        elemento.classList.add('erro');
    } else {
        elemento.classList.remove('erro');
    }
}


// ============================================================
// PROTEÇÃO CONTRA HTML
// ============================================================

function escapeHTML(valor) {

    const div =
        document.createElement('div');

    div.textContent =
        valor == null ? '' : String(valor);

    return div.innerHTML;
}
