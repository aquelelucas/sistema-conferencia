const URL_API =
    'https://script.google.com/macros/s/AKfycbwosNZJ3V8ORxMyy9m9w_O5-DpzSuMG7k_NRdy8oCiiMJHat4F5tw8Y4xAWH0hmBaPOBA/exec';


const CHAVE_API =
    'KING-CONFERENCIA-2026';


const CHAVE_SESSAO =
    'king_conferencia_sessao';


let itens = [];


// =====================================================
// ELEMENTOS
// =====================================================

const conferente =
    document.getElementById(
        'conferente'
    );


const senha =
    document.getElementById(
        'senha'
    );


const btnEntrar =
    document.getElementById(
        'btnEntrar'
    );


const statusLogin =
    document.getElementById(
        'statusLogin'
    );


const nomeConferente =
    document.getElementById(
        'nomeConferente'
    );


const btnSair =
    document.getElementById(
        'btnSair'
    );


const pedido =
    document.getElementById(
        'pedido'
    );


const btnBuscarPedido =
    document.getElementById(
        'btnBuscarPedido'
    );


const secaoItens =
    document.getElementById(
        'secaoItens'
    );


const sku =
    document.getElementById(
        'sku'
    );


const qtdSolicitada =
    document.getElementById(
        'qtdSolicitada'
    );


const qtdSeparada =
    document.getElementById(
        'qtdSeparada'
    );


const btnAdicionarItem =
    document.getElementById(
        'btnAdicionarItem'
    );


const listaItens =
    document.getElementById(
        'listaItens'
    );


const secaoResultado =
    document.getElementById(
        'secaoResultado'
    );


const btnSemErro =
    document.getElementById(
        'btnSemErro'
    );


const btnComErro =
    document.getElementById(
        'btnComErro'
    );


const secaoErro =
    document.getElementById(
        'secaoErro'
    );


const tipoErro =
    document.getElementById(
        'tipoErro'
    );


const gravidade =
    document.getElementById(
        'gravidade'
    );


const acaoTomada =
    document.getElementById(
        'acaoTomada'
    );


const observacao =
    document.getElementById(
        'observacao'
    );


const btnRegistrarSemErro =
    document.getElementById(
        'btnRegistrarSemErro'
    );


const btnRegistrarComErro =
    document.getElementById(
        'btnRegistrarComErro'
    );


// =====================================================
// CHAMAR API
// =====================================================

async function chamarAPI(
    acao,
    dados = {}
) {

    const resposta =
        await fetch(
            URL_API,
            {
                method: 'POST',

                headers: {
                    'Content-Type':
                        'text/plain;charset=utf-8'
                },

                body:
                    JSON.stringify({

                        acao:
                            acao,

                        chave:
                            CHAVE_API,

                        ...dados

                    })
            }
        );


    if (!resposta.ok) {

        throw new Error(
            'Erro HTTP ' +
            resposta.status
        );

    }


    return await resposta.json();

}


// =====================================================
// CARREGAR CONFERENTES
// =====================================================

async function carregarConferentes() {

    conferente.innerHTML =
        '<option value="">Carregando conferentes...</option>';


    try {

        const resultado =
            await chamarAPI(
                'listarConferentes'
            );


        if (!resultado.sucesso) {

            conferente.innerHTML =
                '<option value="">Erro ao carregar</option>';


            statusLogin.textContent =
                resultado.mensagem;


            return;

        }


        conferente.innerHTML =
            '<option value="">Selecione seu nome...</option>';


        if (
            !resultado.conferentes ||
            resultado.conferentes.length === 0
        ) {

            conferente.innerHTML =
                '<option value="">Nenhum conferente cadastrado</option>';


            statusLogin.textContent =
                'Nenhum conferente foi cadastrado ainda.';


            return;

        }


        resultado.conferentes.forEach(
            function(nome) {

                const opcao =
                    document.createElement(
                        'option'
                    );


                opcao.value =
                    nome;


                opcao.textContent =
                    nome;


                conferente.appendChild(
                    opcao
                );

            }
        );


    } catch (erro) {

        console.error(
            erro
        );


        conferente.innerHTML =
            '<option value="">Erro ao carregar conferentes</option>';


        statusLogin.textContent =
            'Não foi possível carregar os conferentes.';

    }

}


// =====================================================
// LOGIN
// =====================================================

btnEntrar.addEventListener(
    'click',
    async function() {

        const nome =
            conferente.value;


        const senhaInformada =
            senha.value.trim();


        if (!nome) {

            statusLogin.textContent =
                'Selecione o seu nome.';

            return;

        }


        if (!senhaInformada) {

            statusLogin.textContent =
                'Digite sua senha.';

            return;

        }


        btnEntrar.disabled =
            true;


        statusLogin.textContent =
            'Entrando...';


        try {

            const resultado =
                await chamarAPI(
                    'login',
                    {
                        conferente:
                            nome,

                        senha:
                            senhaInformada
                    }
                );


            if (!resultado.sucesso) {

                statusLogin.textContent =
                    resultado.mensagem;

                return;

            }


            sessionStorage.setItem(
                CHAVE_SESSAO,

                JSON.stringify({

                    token:
                        resultado.token,

                    conferente:
                        resultado.conferente

                })
            );


            mostrarSistema(
                resultado.conferente
            );


        } catch (erro) {

            console.error(
                erro
            );


            statusLogin.textContent =
                'Erro ao conectar com o sistema.';


        } finally {

            btnEntrar.disabled =
                false;

        }

    }
);


// =====================================================
// OBTER SESSÃO
// =====================================================

function obterSessao() {

    const sessaoSalva =
        sessionStorage.getItem(
            CHAVE_SESSAO
        );


    if (!sessaoSalva) {

        return null;

    }


    try {

        return JSON.parse(
            sessaoSalva
        );


    } catch (erro) {

        sessionStorage.removeItem(
            CHAVE_SESSAO
        );


        return null;

    }

}


// =====================================================
// VERIFICAR SESSÃO
// =====================================================

async function verificarSessao() {

    const sessao =
        obterSessao();


    if (
        !sessao ||
        !sessao.token
    ) {

        return;

    }


    try {

        const resultado =
            await chamarAPI(
                'validarSessao',
                {
                    token:
                        sessao.token
                }
            );


        if (resultado.sucesso) {

            mostrarSistema(
                resultado.conferente
            );


        } else {

            sessionStorage.removeItem(
                CHAVE_SESSAO
            );

        }


    } catch (erro) {

        console.error(
            erro
        );

    }

}


// =====================================================
// MOSTRAR SISTEMA
// =====================================================

function mostrarSistema(nome) {

    document.getElementById(
        'telaLogin'
    ).style.display =
        'none';


    document.getElementById(
        'telaConferencia'
    ).style.display =
        'block';


    nomeConferente.textContent =
        nome;

}


// =====================================================
// SAIR
// =====================================================

btnSair.addEventListener(
    'click',
    function() {

        sessionStorage.removeItem(
            CHAVE_SESSAO
        );


        location.reload();

    }
);


// =====================================================
// BUSCAR PEDIDO
// =====================================================

btnBuscarPedido.addEventListener(
    'click',
    async function() {

        const sessao =
            obterSessao();


        if (!sessao) {

            alert(
                'Sessão expirada.'
            );

            return;

        }


        const numeroPedido =
            pedido.value.trim();


        if (!numeroPedido) {

            alert(
                'Informe o número do pedido.'
            );

            return;

        }


        btnBuscarPedido.disabled =
            true;


        try {

            const resultado =
                await chamarAPI(
                    'pedido',
                    {

                        token:
                            sessao.token,

                        pedido:
                            numeroPedido

                    }
                );


            if (!resultado.sucesso) {

                alert(
                    resultado.mensagem
                );

                return;

            }


            itens = [];


            atualizarListaItens();


            secaoItens.style.display =
                'block';


            secaoResultado.style.display =
                'none';


            secaoErro.style.display =
                'none';


        } catch (erro) {

            console.error(
                erro
            );


            alert(
                'Erro ao consultar o pedido.'
            );


        } finally {

            btnBuscarPedido.disabled =
                false;

        }

    }
);


// =====================================================
// ADICIONAR ITEM
// =====================================================

btnAdicionarItem.addEventListener(
    'click',
    function() {

        const codigo =
            sku.value.trim();


        const solicitada =
            qtdSolicitada.value;


        const separada =
            qtdSeparada.value;


        if (!codigo) {

            alert(
                'Informe o SKU/produto.'
            );

            return;

        }


        if (
            solicitada === '' ||
            separada === ''
        ) {

            alert(
                'Informe as quantidades.'
            );

            return;

        }


        itens.push({

            sku:
                codigo,

            qtdSolicitada:
                Number(
                    solicitada
                ),

            qtdSeparada:
                Number(
                    separada
                )

        });


        sku.value =
            '';


        qtdSolicitada.value =
            '';


        qtdSeparada.value =
            '';


        sku.focus();


        atualizarListaItens();


        secaoResultado.style.display =
            'block';

    }
);


// =====================================================
// ATUALIZAR LISTA
// =====================================================

function atualizarListaItens() {

    listaItens.innerHTML =
        '';


    itens.forEach(
        function(item, indice) {

            const div =
                document.createElement(
                    'div'
                );


            div.className =
                'item-conferencia';


            div.innerHTML = `

                <strong>
                    ${item.sku}
                </strong>

                <span>
                    Solicitada:
                    ${item.qtdSolicitada}

                    |

                    Separada:
                    ${item.qtdSeparada}
                </span>

                <button
                    type="button"
                    onclick="removerItem(${indice})"
                >
                    Remover
                </button>

            `;


            listaItens.appendChild(
                div
            );

        }
    );

}


// =====================================================
// REMOVER ITEM
// =====================================================

function removerItem(indice) {

    itens.splice(
        indice,
        1
    );


    atualizarListaItens();

}


// =====================================================
// SEM ERRO
// =====================================================

btnSemErro.addEventListener(
    'click',
    function() {

        if (itens.length === 0) {

            alert(
                'Adicione pelo menos um SKU.'
            );

            return;

        }


        secaoErro.style.display =
            'none';


        btnRegistrarSemErro.style.display =
            'block';


        btnRegistrarComErro.style.display =
            'none';

    }
);


// =====================================================
// COM ERRO
// =====================================================

btnComErro.addEventListener(
    'click',
    function() {

        if (itens.length === 0) {

            alert(
                'Adicione pelo menos um SKU.'
            );

            return;

        }


        secaoErro.style.display =
            'block';


        btnRegistrarSemErro.style.display =
            'none';


        btnRegistrarComErro.style.display =
            'block';

    }
);


// =====================================================
// REGISTRAR SEM ERRO
// =====================================================

btnRegistrarSemErro.addEventListener(
    'click',
    function() {

        registrarConferencia(
            false
        );

    }
);


// =====================================================
// REGISTRAR COM ERRO
// =====================================================

btnRegistrarComErro.addEventListener(
    'click',
    function() {

        registrarConferencia(
            true
        );

    }
);


// =====================================================
// REGISTRAR CONFERÊNCIA
// =====================================================

async function registrarConferencia(
    comErro
) {

    const sessao =
        obterSessao();


    if (!sessao) {

        alert(
            'Sessão expirada.'
        );

        return;

    }


    if (itens.length === 0) {

        alert(
            'Nenhum item foi adicionado.'
        );

        return;

    }


    if (comErro) {

        if (!tipoErro.value) {

            alert(
                'Informe o tipo de erro.'
            );

            return;

        }


        if (!gravidade.value) {

            alert(
                'Informe a gravidade.'
            );

            return;

        }


        if (!acaoTomada.value.trim()) {

            alert(
                'Informe a ação tomada.'
            );

            return;

        }

    }


    const itensParaEnviar =
        itens.map(
            function(item) {

                return {

                    sku:
                        item.sku,

                    qtdSolicitada:
                        item.qtdSolicitada,

                    qtdSeparada:
                        item.qtdSeparada,

                    erro:
                        comErro,

                    tipoErro:
                        comErro
                            ? tipoErro.value
                            : '',

                    gravidade:
                        comErro
                            ? gravidade.value
                            : '',

                    acaoTomada:
                        comErro
                            ? acaoTomada.value.trim()
                            : '',

                    observacao:
                        comErro
                            ? observacao.value.trim()
                            : ''

                };

            }
        );


    const botao =
        comErro
            ? btnRegistrarComErro
            : btnRegistrarSemErro;


    botao.disabled =
        true;


    try {

        const resultado =
            await chamarAPI(
                'registrarConferencia',
                {

                    token:
                        sessao.token,

                    pedido:
                        pedido.value.trim(),

                    itens:
                        itensParaEnviar

                }
            );


        if (!resultado.sucesso) {

            alert(
                resultado.mensagem
            );

            return;

        }


        alert(
            'Conferência registrada com sucesso!'
        );


        limparConferencia();


    } catch (erro) {

        console.error(
            erro
        );


        alert(
            'Erro ao registrar a conferência.'
        );


    } finally {

        botao.disabled =
            false;

    }

}


// =====================================================
// LIMPAR CONFERÊNCIA
// =====================================================

function limparConferencia() {

    pedido.value =
        '';


    sku.value =
        '';


    qtdSolicitada.value =
        '';


    qtdSeparada.value =
        '';


    itens = [];


    atualizarListaItens();


    secaoItens.style.display =
        'none';


    secaoResultado.style.display =
        'none';


    secaoErro.style.display =
        'none';


    tipoErro.value =
        '';


    gravidade.value =
        '';


    acaoTomada.value =
        '';


    observacao.value =
        '';

}


// =====================================================
// INICIALIZAÇÃO
// =====================================================

document.addEventListener(
    'DOMContentLoaded',
    function() {

        carregarConferentes();

        verificarSessao();

    }
);
