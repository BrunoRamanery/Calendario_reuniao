/**
 * CEREBRO.JS - VERSÃO 5 COMPLETA
 * Sistema principal do agendamento - Layout igual ao do chefe
 * @author Seu Nome
 * @version 5.0-professional
 */

class DrawindSystem {
    constructor() {
        // Configurações do sistema
        this.versao = '5.0-professional';
        this.gaveta = null;
        this.carregando = false;
        this.agendamentos = [];
        
        // Configurações do calendário
        this.mesAtual = new Date().getMonth();
        this.anoAtual = new Date().getFullYear();
        
        // Estados do sistema
        this.modoAdmin = false;
        this.modalAberto = false;
        
        console.log(`🚀 Sistema ${this.versao} inicializando...`);
    }

    /**
     * INICIALIZAÇÃO PRINCIPAL DO SISTEMA
     * Configura todos os módulos e prepara a interface
     */
    async initializeDashboard() {
        console.log('🌐 Iniciando Sistema V5 Professional...');
        
        try {
            // 1. Configurar sistema de armazenamento
            await this.verificarGaveta();
            
            // 2. Configurar eventos da interface
            this.configurarEventosDashboard();
            
            // 3. Inicializar componentes visuais
            this.inicializarComponentesVisuais();
            
            // 4. Carregar dados iniciais
            await this.carregarDadosDashboard();
            
            // 5. Configurar detector de conexão
            this.configurarDetectorConexao();
            
            console.log('✅ Sistema V5 totalmente operacional!');
            this.mostrarNotificacao('Sistema carregado com sucesso!', 'success');
            
        } catch (error) {
            console.error('❌ Falha na inicialização do sistema:', error);
            this.mostrarNotificacao('Erro ao inicializar o sistema', 'error');
        }
    }

    /**
     * VERIFICAR E CONFIGURAR SISTEMA DE ARMAZENAMENTO
     * Integra com a Gaveta para dados online/offline
     */
    async verificarGaveta() {
        console.log('🗄️ Verificando sistema de armazenamento...');
        
        if (window.Gaveta) {
            this.gaveta = window.Gaveta;
            console.log('✅ Gaveta integrada com sucesso');
        } else {
            console.warn('⚠️ Gaveta não encontrada - usando fallback');
            // Fallback básico para desenvolvimento
            this.gaveta = {
                online: navigator.onLine,
                pegarAgendamentosLocais: () => {
                    const local = localStorage.getItem('drawind_agendamentos_fallback');
                    return local ? JSON.parse(local) : [];
                },
                carregarDadosDoBanco: async () => {
                    try {
                        const response = await fetch('api/agendamento.php');
                        if (response.ok) {
                            const data = await response.json();
                            return data.dados || [];
                        }
                        throw new Error('API offline');
                    } catch (error) {
                        return this.gaveta.pegarAgendamentosLocais();
                    }
                },
                salvarAgendamento: async (dados) => {
                    try {
                        const response = await fetch('api/agendamento.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(dados)
                        });
                        return response.ok;
                    } catch (error) {
                        // Salvar localmente
                        const agendamentos = this.gaveta.pegarAgendamentosLocais();
                        agendamentos.push({
                            ...dados,
                            id: 'temp_' + Date.now(),
                            sincronizado: false
                        });
                        localStorage.setItem('drawind_agendamentos_fallback', JSON.stringify(agendamentos));
                        return true;
                    }
                }
            };
        }
    }

    /**
     * CONFIGURAR EVENTOS DA INTERFACE
     * Define todas as interações do usuário
     */
    configurarEventosDashboard() {
        console.log('🔧 Configurando eventos da interface...');
        
        // BOTÕES PRINCIPAIS
        this.addEventListener('btnNovoAgendamento', 'click', () => {
            this.abrirModalAgendamento();
        });
        
        this.addEventListener('btnAdminPanel', 'click', () => {
            this.toggleModoAdmin();
        });
        
        // NAVEGAÇÃO DO CALENDÁRIO
        this.addEventListener('prevMonthDashboard', 'click', () => {
            this.navegarCalendario(-1);
        });
        
        this.addEventListener('nextMonthDashboard', 'click', () => {
            this.navegarCalendario(1);
        });
        
        // CONTROLES DO MODAL
        this.addEventListener('close-btn', 'click', () => {
            this.fecharModalAgendamento();
        });
        
        this.addEventListener('btnCancelar', 'click', () => {
            this.fecharModalAgendamento();
        });
        
        this.addEventListener('modalAgendamento', 'click', (e) => {
            if (e.target === e.currentTarget) {
                this.fecharModalAgendamento();
            }
        });
        
        // FORMULÁRIO DE AGENDAMENTO
        this.addEventListener('formAgendamento', 'submit', (e) => {
            this.processarFormularioAgendamento(e);
        });
        
        // EVENTOS DE FORMULÁRIO (validações em tempo real)
        this.addEventListener('inputData', 'change', () => {
            this.validarDataAgendamento();
        });
        
        this.addEventListener('inputEmail', 'blur', () => {
            this.validarEmail();
        });
        
        console.log('✅ Eventos configurados com sucesso');
    }

    /**
     * INICIALIZAR COMPONENTES VISUAIS
     * Prepara elementos que requerem configuração inicial
     */
    inicializarComponentesVisuais() {
        console.log('🎨 Inicializando componentes visuais...');
        
        // Relógio em tempo real
        this.inicializarRelogioTempoReal();
        
        // Calendário interativo
        this.inicializarCalendario();
        
        // Tooltips e interações
        this.inicializarTooltips();
        
        // Animações de entrada
        this.inicializarAnimacoes();
        
        console.log('✅ Componentes visuais inicializados');
    }

    /**
     * CARREGAR DADOS DO SISTEMA
     * Busca e processa dados locais e remotos
     */
    async carregarDadosDashboard() {
        if (this.carregando) {
            console.warn('⚠️ Sistema já está carregando dados');
            return;
        }
        
        this.carregando = true;
        console.log('📂 Carregando dados do sistema...');
        
        try {
            // Mostrar estado de carregamento
            this.mostrarEstadoCarregamento(true);
            
            // Buscar dados atualizados
            const agendamentos = await this.gaveta.carregarDadosDoBanco();
            this.agendamentos = agendamentos;
            
            // Atualizar interface com novos dados
            this.atualizarEstatisticas(agendamentos);
            this.atualizarTabelaAgendamentos(agendamentos);
            this.atualizarCalendario();
            
            console.log(`✅ Dados carregados: ${agendamentos.length} agendamentos`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            
            // Fallback para dados locais
            const agendamentos = this.gaveta.pegarAgendamentosLocais();
            this.agendamentos = agendamentos;
            this.atualizarEstatisticas(agendamentos);
            this.atualizarTabelaAgendamentos(agendamentos);
            
            this.mostrarNotificacao('Modo offline - usando dados locais', 'warning');
        } finally {
            this.carregando = false;
            this.mostrarEstadoCarregamento(false);
        }
    }

    /**
     * ATUALIZAR ESTATÍSTICAS DO PAINEL
     * Calcula e exibe métricas em tempo real
     */
    atualizarEstatisticas(agendamentos) {
        console.log('📊 Atualizando estatísticas...');
        
        const hoje = new Date().toISOString().split('T')[0];
        const agora = new Date();
        
        // Calcular métricas principais
        const estatisticas = {
            total: agendamentos.length,
            hoje: agendamentos.filter(ag => ag.data === hoje).length,
            pendentes: agendamentos.filter(ag => ag.status === 'pendente').length,
            confirmados: agendamentos.filter(ag => ag.status === 'confirmado').length,
            cancelados: agendamentos.filter(ag => ag.status === 'cancelado').length,
            estaSemana: agendamentos.filter(ag => {
                const dataAg = new Date(ag.data);
                const diffTempo = dataAg - agora;
                const diffDias = diffTempo / (1000 * 3600 * 24);
                return diffDias >= 0 && diffDias <= 7;
            }).length
        };
        
        // Atualizar elementos da interface
        this.atualizarElemento('totalAgendamentosDashboard', estatisticas.total);
        this.atualizarElemento('agendamentosHojeDashboard', estatisticas.hoje);
        this.atualizarElemento('pendentesDashboard', estatisticas.pendentes);
        
        // Animar mudanças nos números
        this.animarMudancaNumeros(estatisticas);
        
        console.log('📈 Estatísticas atualizadas:', estatisticas);
    }

    /**
     * ATUALIZAR TABELA DE AGENDAMENTOS
     * Renderiza a lista de agendamentos na interface
     */
    atualizarTabelaAgendamentos(agendamentos) {
        console.log('📋 Atualizando tabela de agendamentos...');
        
        const tbody = document.querySelector('#tabelaAgendamentosDashboard tbody');
        if (!tbody) {
            console.warn('❌ Tabela não encontrada');
            return;
        }
        
        // Filtrar e ordenar agendamentos
        const hoje = new Date().toISOString().split('T')[0];
        const agendamentosExibir = agendamentos
            .filter(ag => ag.data >= hoje && ag.status !== 'cancelado')
            .sort((a, b) => new Date(a.data + 'T' + a.horario) - new Date(b.data + 'T' + b.horario))
            .slice(0, 20); // Limitar para performance
        
        tbody.innerHTML = '';
        
        // Estado vazio
        if (agendamentosExibir.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data">
                        <i class="fas fa-calendar-times"></i>
                        <br>
                        Nenhum agendamento encontrado
                        <br>
                        <small>Clique em "Novo Agendamento" para começar</small>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Renderizar cada agendamento
        agendamentosExibir.forEach((agendamento, index) => {
            const linha = this.criarLinhaTabela(agendamento, index);
            tbody.appendChild(linha);
        });
        
        console.log(`✅ Tabela atualizada: ${agendamentosExibir.length} agendamentos`);
    }

    /**
     * CRIAR LINHA DA TABELA
     * Cria elemento HTML para um agendamento
     */
    criarLinhaTabela(agendamento, index) {
        const linha = document.createElement('tr');
        
        // Adicionar classe para itens não sincronizados
        if (!agendamento.sincronizado) {
            linha.classList.add('offline-pending');
        }
        
        // Adicionar classe para agendamentos próximos
        const dataAgendamento = new Date(agendamento.data + 'T' + agendamento.horario);
        const agora = new Date();
        const diffHoras = (dataAgendamento - agora) / (1000 * 3600);
        
        if (diffHoras > 0 && diffHoras < 24) {
            linha.classList.add('agendamento-proximo');
        }
        
        const dataFormatada = this.formatarDataExibicao(agendamento.data, agendamento.horario);
        
        linha.innerHTML = `
            <td>
                <div class="data-hora-cell">
                    <strong>${dataFormatada.data}</strong>
                    <br>
                    <small>${dataFormatada.hora}</small>
                    ${!agendamento.sincronizado ? 
                        '<div class="offline-badge"><i class="fas fa-cloud-upload-alt"></i> Pendente</div>' : 
                        ''
                    }
                </div>
            </td>
            <td>
                <div class="solicitante-cell">
                    <strong>${this.escapeHtml(agendamento.solicitante)}</strong>
                    <br>
                    <small class="email-text">${this.escapeHtml(agendamento.email)}</small>
                </div>
            </td>
            <td>${this.escapeHtml(agendamento.sala)}</td>
            <td>
                <div class="assunto-cell" title="${this.escapeHtml(agendamento.servico)}">
                    ${this.escapeHtml(agendamento.servico)}
                </div>
            </td>
            <td>
                <span class="status-badge status-${agendamento.status}">
                    <i class="fas fa-${this.obterIconeStatus(agendamento.status)}"></i>
                    ${agendamento.status}
                </span>
            </td>
            <td>
                <div class="acoes-cell">
                    <button class="btn-acao btn-editar" data-id="${agendamento.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-acao btn-cancelar" data-id="${agendamento.id}" title="Cancelar">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </td>
        `;
        
        // Adicionar eventos aos botões de ação
        this.configurarEventosLinhaTabela(linha, agendamento);
        
        return linha;
    }

    /**
     * CONFIGURAR EVENTOS DA LINHA DA TABELA
     * Adiciona interações para cada agendamento
     */
    configurarEventosLinhaTabela(linha, agendamento) {
        // Botão editar
        const btnEditar = linha.querySelector('.btn-editar');
        if (btnEditar) {
            btnEditar.addEventListener('click', () => {
                this.editarAgendamento(agendamento.id);
            });
        }
        
        // Botão cancelar
        const btnCancelar = linha.querySelector('.btn-cancelar');
        if (btnCancelar) {
            btnCancelar.addEventListener('click', () => {
                this.cancelarAgendamento(agendamento.id);
            });
        }
        
        // Clique na linha (visualização rápida)
        linha.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-acao')) {
                this.visualizarAgendamento(agendamento.id);
            }
        });
    }

    /**
     * INICIALIZAR CALENDÁRIO INTERATIVO
     * Configura e exibe o calendário mensal
     */
    inicializarCalendario() {
        console.log('📅 Inicializando calendário...');
        this.atualizarCalendario();
    }

    /**
     * ATUALIZAR CALENDÁRIO
     * Gera os dias do mês atual
     */
    atualizarCalendario() {
        const calendarioElement = document.getElementById('miniCalendarDashboard');
        const mesElement = document.getElementById('currentMonthDashboard');
        
        if (!calendarioElement || !mesElement) {
            console.warn('❌ Elementos do calendário não encontrados');
            return;
        }
        
        // Atualizar título do mês
        const meses = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        mesElement.textContent = `${meses[this.mesAtual]} ${this.anoAtual}`;
        
        // Gerar dias do calendário
        const primeiroDia = new Date(this.anoAtual, this.mesAtual, 1);
        const ultimoDia = new Date(this.anoAtual, this.mesAtual + 1, 0);
        const hoje = new Date();
        
        let calendarioHTML = '';
        
        // Header - Dias da semana
        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        diasSemana.forEach(dia => {
            calendarioHTML += `<div class="weekday">${dia}</div>`;
        });
        
        // Dias vazios no início
        for (let i = 0; i < primeiroDia.getDay(); i++) {
            calendarioHTML += `<div class="day empty"></div>`;
        }
        
        // Dias do mês
        for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
            const dataAtual = new Date(this.anoAtual, this.mesAtual, dia);
            const isHoje = dataAtual.toDateString() === hoje.toDateString();
            const temAgendamentos = this.verificarAgendamentosDia(dataAtual);
            
            let classeDia = 'day';
            if (isHoje) classeDia += ' today';
            if (temAgendamentos) classeDia += ' has-events';
            if (dataAtual < hoje && !isHoje) classeDia += ' past-day';
            
            calendarioHTML += `
                <div class="${classeDia}" data-date="${dataAtual.toISOString().split('T')[0]}">
                    ${dia}
                    ${temAgendamentos ? '<div class="event-dot"></div>' : ''}
                </div>
            `;
        }
        
        calendarioElement.innerHTML = calendarioHTML;
        
        // Adicionar eventos de clique nos dias
        this.adicionarEventosDiasCalendario();
    }

    /**
     * NAVEGAR ENTRE MESES DO CALENDÁRIO
     * @param {number} direcao -1 para anterior, 1 para próximo
     */
    navegarCalendario(direcao) {
        this.mesAtual += direcao;
        
        // Ajustar ano se necessário
        if (this.mesAtual > 11) {
            this.mesAtual = 0;
            this.anoAtual++;
        } else if (this.mesAtual < 0) {
            this.mesAtual = 11;
            this.anoAtual--;
        }
        
        this.atualizarCalendario();
    }

    /**
     * ADICIONAR EVENTOS AOS DIAS DO CALENDÁRIO
     * Permite interação com os dias clicáveis
     */
    adicionarEventosDiasCalendario() {
        const dias = document.querySelectorAll('#miniCalendarDashboard .day:not(.empty):not(.past-day)');
        
        dias.forEach(dia => {
            dia.addEventListener('click', () => {
                const dataSelecionada = dia.getAttribute('data-date');
                this.selecionarDiaCalendario(dataSelecionada);
            });
            
            // Efeitos hover
            dia.addEventListener('mouseenter', () => {
                if (!dia.classList.contains('today')) {
                    dia.style.backgroundColor = 'var(--hover-bg)';
                }
            });
            
            dia.addEventListener('mouseleave', () => {
                if (!dia.classList.contains('today')) {
                    dia.style.backgroundColor = '';
                }
            });
        });
    }

    /**
     * SELECIONAR DIA NO CALENDÁRIO
     * Ação ao clicar em um dia específico
     */
    selecionarDiaCalendario(data) {
        console.log('📅 Dia selecionado:', data);
        
        // Filtrar agendamentos do dia selecionado
        const agendamentosDia = this.agendamentos.filter(ag => 
            ag.data === data && ag.status !== 'cancelado'
        );
        
        if (agendamentosDia.length > 0) {
            this.mostrarNotificacao(
                `${agendamentosDia.length} agendamento(s) para ${this.formatarData(data)}`,
                'info'
            );
            
            // Opcional: filtrar tabela para mostrar apenas este dia
            // this.filtrarTabelaPorData(data);
        } else {
            // Abrir modal de agendamento com data pré-selecionada
            this.abrirModalAgendamentoComData(data);
        }
    }

    /**
     * ABRIR MODAL DE AGENDAMENTO
     * Exibe o formulário para novo agendamento
     */
    abrirModalAgendamento(dataPredefinida = null) {
        console.log('📝 Abrindo modal de agendamento...');
        
        const modal = document.getElementById('modalAgendamento');
        if (!modal) {
            console.warn('❌ Modal não encontrado');
            return;
        }
        
        // Resetar formulário
        this.limparFormularioAgendamento();
        
        // Predefinir data se fornecida
        if (dataPredefinida) {
            const inputData = document.getElementById('inputData');
            if (inputData) {
                inputData.value = dataPredefinida;
            }
        } else {
            // Data mínima = hoje
            const inputData = document.getElementById('inputData');
            if (inputData) {
                const hoje = new Date().toISOString().split('T')[0];
                inputData.min = hoje;
                inputData.value = hoje;
            }
        }
        
        // Carregar horários disponíveis
        this.carregarHorariosDisponiveis();
        
        // Mostrar modal
        modal.style.display = 'block';
        this.modalAberto = true;
        
        // Focar no primeiro campo
        setTimeout(() => {
            const primeiroCampo = modal.querySelector('input, select, textarea');
            if (primeiroCampo) primeiroCampo.focus();
        }, 100);
        
        // Adicionar evento ESC para fechar
        this.adicionarEventoEscModal();
    }

    /**
     * ABRIR MODAL COM DATA PRÉ-DEFINIDA
     * Usado quando se clica em um dia no calendário
     */
    abrirModalAgendamentoComData(data) {
        this.abrirModalAgendamento(data);
        
        // Feedback visual
        this.mostrarNotificacao(`Data ${this.formatarData(data)} selecionada`, 'info');
    }

    /**
     * FECHAR MODAL DE AGENDAMENTO
     * Fecha o modal e limpa o formulário
     */
    fecharModalAgendamento() {
        console.log('📝 Fechando modal...');
        
        const modal = document.getElementById('modalAgendamento');
        if (modal) {
            modal.style.display = 'none';
            this.modalAberto = false;
        }
        
        // Remover evento ESC
        this.removerEventoEscModal();
    }

    /**
     * PROCESSAR FORMULÁRIO DE AGENDAMENTO
     * Valida e envia os dados do formulário
     */
    async processarFormularioAgendamento(e) {
        e.preventDefault();
        console.log('📤 Processando formulário de agendamento...');
        
        // Coletar dados do formulário
        const formData = this.coletarDadosFormulario();
        
        // Validar dados
        if (!this.validarDadosFormulario(formData)) {
            return;
        }
        
        // Verificar conflitos de horário
        if (!this.verificarConflitoHorario(formData)) {
            this.mostrarNotificacao('Conflito de horário - sala já ocupada neste período', 'error');
            return;
        }
        
        try {
            // Mostrar loading
            this.mostrarLoadingFormulario(true);
            
            // Salvar agendamento
            const resultado = await this.gaveta.salvarAgendamento(formData);
            
            if (resultado) {
                this.mostrarNotificacao('Agendamento criado com sucesso!', 'success');
                this.fecharModalAgendamento();
                
                // Recarregar dados
                await this.carregarDadosDashboard();
            } else {
                throw new Error('Falha ao salvar agendamento');
            }
            
        } catch (error) {
            console.error('❌ Erro ao salvar agendamento:', error);
            this.mostrarNotificacao('Erro ao criar agendamento: ' + error.message, 'error');
        } finally {
            this.mostrarLoadingFormulario(false);
        }
    }

    /**
     * COLETAR DADOS DO FORMULÁRIO
     * Extrai dados dos campos do formulário
     */
    coletarDadosFormulario() {
        return {
            data: document.getElementById('inputData')?.value,
            horario: document.getElementById('selectHorario')?.value,
            sala: document.getElementById('selectSala')?.value,
            solicitante: document.getElementById('inputSolicitante')?.value,
            email: document.getElementById('inputEmail')?.value,
            servico: document.getElementById('inputServico')?.value,
            observacoes: document.getElementById('inputObservacoes')?.value,
            duracao: document.getElementById('selectDuracao')?.value,
            status: 'pendente'
        };
    }

    /**
     * VALIDAR DADOS DO FORMULÁRIO
     * Realiza validações completas nos dados
     */
    validarDadosFormulario(dados) {
        const camposObrigatorios = ['data', 'horario', 'sala', 'solicitante', 'email', 'servico', 'duracao'];
        
        // Verificar campos obrigatórios
        for (const campo of camposObrigatorios) {
            if (!dados[campo] || dados[campo].toString().trim() === '') {
                this.mostrarNotificacao(`Preencha o campo: ${campo}`, 'error');
                this.destacarCampoInvalido(campo);
                return false;
            }
        }
        
        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(dados.email)) {
            this.mostrarNotificacao('Email inválido', 'error');
            this.destacarCampoInvalido('email');
            return false;
        }
        
        // Validar data (não pode ser no passado)
        const hoje = new Date().toISOString().split('T')[0];
        if (dados.data < hoje) {
            this.mostrarNotificacao('Não é possível agendar para datas passadas', 'error');
            this.destacarCampoInvalido('data');
            return false;
        }
        
        // Validar duração
        if (dados.duracao <= 0 || dados.duracao > 480) { // Máximo 8 horas
            this.mostrarNotificacao('Duração inválida', 'error');
            this.destacarCampoInvalido('duracao');
            return false;
        }
        
        return true;
    }

    /**
     * VERIFICAR CONFLITO DE HORÁRIO
     * Verifica se a sala está disponível no horário solicitado
     */
    verificarConflitoHorario(novoAgendamento) {
        // Implementação básica - pode ser aprimorada
        const conflito = this.agendamentos.some(ag => 
            ag.data === novoAgendamento.data &&
            ag.sala === novoAgendamento.sala &&
            ag.status !== 'cancelado' &&
            ag.horario === novoAgendamento.horario
        );
        
        return !conflito;
    }

    /**
     * CARREGAR HORÁRIOS DISPONÍVEIS
     * Preenche o select de horários baseado na data selecionada
     */
    carregarHorariosDisponiveis() {
        // Horários padrão do sistema
        const horarios = [
            '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
            '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
            '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
            '17:00', '17:30', '18:00'
        ];
        
        const selectHorario = document.getElementById('selectHorario');
        if (!selectHorario) return;
        
        // Limpar opções atuais
        selectHorario.innerHTML = '<option value="">Selecione um horário</option>';
        
        // Adicionar horários disponíveis
        horarios.forEach(horario => {
            const option = document.createElement('option');
            option.value = horario;
            option.textContent = horario;
            selectHorario.appendChild(option);
        });
    }

    /**
     * EDITAR AGENDAMENTO
     * Abre o modal para editar agendamento existente
     */
    editarAgendamento(id) {
        console.log('✏️ Editando agendamento:', id);
        
        const agendamento = this.agendamentos.find(ag => ag.id === id);
        if (!agendamento) {
            this.mostrarNotificacao('Agendamento não encontrado', 'error');
            return;
        }
        
        // Abrir modal com dados do agendamento
        this.abrirModalEdicao(agendamento);
    }

    /**
     * CANCELAR AGENDAMENTO
     * Cancela um agendamento existente
     */
    async cancelarAgendamento(id) {
        console.log('❌ Cancelando agendamento:', id);
        
        if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
            return;
        }
        
        try {
            // Buscar agendamento
            const agendamento = this.agendamentos.find(ag => ag.id === id);
            if (!agendamento) {
                throw new Error('Agendamento não encontrado');
            }
            
            // Atualizar status para cancelado
            agendamento.status = 'cancelado';
            
            // Recarregar dados
            await this.carregarDadosDashboard();
            
            this.mostrarNotificacao('Agendamento cancelado com sucesso', 'success');
            
        } catch (error) {
            console.error('❌ Erro ao cancelar agendamento:', error);
            this.mostrarNotificacao('Erro ao cancelar agendamento', 'error');
        }
    }

    /**
     * VISUALIZAR AGENDAMENTO
     * Exibe detalhes de um agendamento
     */
    visualizarAgendamento(id) {
        const agendamento = this.agendamentos.find(ag => ag.id === id);
        if (!agendamento) return;
        
        // Criar modal de visualização
        this.mostrarModalVisualizacao(agendamento);
    }

    /**
     * ALTERNAR MODO ADMINISTRATIVO
     * Ativa/desativa funcionalidades administrativas
     */
    toggleModoAdmin() {
        this.modoAdmin = !this.modoAdmin;
        
        if (this.modoAdmin) {
            console.log('⚙️ Modo administrativo ativado');
            this.mostrarNotificacao('Modo administrativo ativado', 'info');
            document.body.classList.add('admin-mode');
        } else {
            console.log('⚙️ Modo administrativo desativado');
            this.mostrarNotificacao('Modo administrativo desativado', 'info');
            document.body.classList.remove('admin-mode');
        }
        
        // Atualizar interface para modo admin
        this.atualizarInterfaceModoAdmin();
    }

    /**
     * ATUALIZAR INTERFACE PARA MODO ADMIN
     * Mostra/oculta elementos administrativos
     */
    atualizarInterfaceModoAdmin() {
        const elementosAdmin = document.querySelectorAll('.admin-only');
        elementosAdmin.forEach(el => {
            el.style.display = this.modoAdmin ? 'block' : 'none';
        });
        
        // Atualizar botão admin
        const btnAdmin = document.getElementById('btnAdminPanel');
        if (btnAdmin) {
            if (this.modoAdmin) {
                btnAdmin.classList.add('active');
                btnAdmin.innerHTML = '<i class="fas fa-user-shield"></i> Admin Ativo';
            } else {
                btnAdmin.classList.remove('active');
                btnAdmin.innerHTML = '<i class="fas fa-cog"></i> Administrativo';
            }
        }
    }

    /**
     * INICIALIZAR RELÓGIO EM TEMPO REAL
     * Atualiza data e hora continuamente
     */
    inicializarRelogioTempoReal() {
        const atualizarRelogio = () => {
            const agora = new Date();
            const elementoData = document.getElementById('currentDateTimeDashboard');
            
            if (elementoData) {
                elementoData.textContent = agora.toLocaleString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            }
        };
        
        // Atualizar imediatamente e a cada segundo
        atualizarRelogio();
        setInterval(atualizarRelogio, 1000);
    }

    /**
     * CONFIGURAR DETECTOR DE CONEXÃO
     * Monitora status online/offline
     */
    configurarDetectorConexao() {
        window.addEventListener('online', () => {
            console.log('🌐 Conexão restaurada');
            this.mostrarNotificacao('Conexão restaurada - sincronizando...', 'success');
            this.atualizarStatusConexao(true);
            
            // Tentar sincronizar dados pendentes
            setTimeout(() => this.carregarDadosDashboard(), 1000);
        });

        window.addEventListener('offline', () => {
            console.log('📴 Conexão perdida');
            this.mostrarNotificacao('Modo offline ativado', 'warning');
            this.atualizarStatusConexao(false);
        });

        // Status inicial
        this.atualizarStatusConexao(navigator.onLine);
    }

    /**
     * ATUALIZAR STATUS DE CONEXÃO
     * Atualiza indicador visual de online/offline
     */
    atualizarStatusConexao(online) {
        const elementoStatus = document.querySelector('.info-value.online');
        if (elementoStatus) {
            if (online) {
                elementoStatus.innerHTML = '<i class="fas fa-wifi"></i> Sistema Online';
                elementoStatus.style.color = 'var(--status-confirmado)';
            } else {
                elementoStatus.innerHTML = '<i class="fas fa-wifi-slash"></i> Sistema Offline';
                elementoStatus.style.color = 'var(--status-cancelado)';
            }
        }
    }

    /**
     * INICIALIZAR TOOLTIPS
     * Configura dicas de ferramenta
     */
    inicializarTooltips() {
        // Tooltips básicos podem ser implementados aqui
        // Pode usar uma biblioteca ou implementação customizada
    }

    /**
     * INICIALIZAR ANIMAÇÕES
     * Configura animações de entrada
     */
    inicializarAnimacoes() {
        // Animações de entrada para elementos
        const elementos = document.querySelectorAll('.stat-card, .agendamentos-section, .calendar-widget');
        
        elementos.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                el.style.transition = 'all 0.6s ease';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    /**
     * VERIFICAR AGENDAMENTOS NO DIA
     * Verifica se existem agendamentos em uma data específica
     */
    verificarAgendamentosDia(data) {
        const dataString = data.toISOString().split('T')[0];
        return this.agendamentos.some(ag => 
            ag.data === dataString && ag.status !== 'cancelado'
        );
    }

    /**
     * OBTER ÍCONE DO STATUS
     * Retorna ícone apropriado para cada status
     */
    obterIconeStatus(status) {
        const icones = {
            pendente: 'clock',
            confirmado: 'check-circle',
            cancelado: 'times-circle'
        };
        return icones[status] || 'question-circle';
    }

    /**
     * FORMATAR DATA PARA EXIBIÇÃO
     * Formata data no formato brasileiro
     */
    formatarDataExibicao(data, horario) {
        const dataObj = new Date(data + 'T' + horario);
        return {
            data: dataObj.toLocaleDateString('pt-BR'),
            hora: dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
    }

    /**
     * FORMATAR DATA SIMPLES
     * Formata apenas a data
     */
    formatarData(data) {
        return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
    }

    /**
     * MOSTRAR NOTIFICAÇÃO
     * Exibe mensagens para o usuário
     */
    mostrarNotificacao(mensagem, tipo = 'info') {
        console.log(`📢 [${tipo.toUpperCase()}] ${mensagem}`);
        
        // Criar elemento de notificação
        const notificacao = document.createElement('div');
        notificacao.className = `notificacao notificacao-${tipo}`;
        notificacao.innerHTML = `
            <div class="notificacao-conteudo">
                <i class="fas fa-${this.obterIconeNotificacao(tipo)}"></i>
                <span>${mensagem}</span>
                <button class="notificacao-fechar" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Adicionar ao container de notificações
        let container = document.getElementById('notificacoes-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificacoes-container';
            container.className = 'notificacoes-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(notificacao);
        
        // Mostrar com animação
        setTimeout(() => notificacao.classList.add('show'), 100);
        
        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            if (notificacao.parentElement) {
                notificacao.classList.remove('show');
                setTimeout(() => {
                    if (notificacao.parentElement) {
                        notificacao.parentElement.removeChild(notificacao);
                    }
                }, 300);
            }
        }, 5000);
    }

    /**
     * OBTER ÍCONE DA NOTIFICAÇÃO
     * Retorna ícone baseado no tipo
     */
    obterIconeNotificacao(tipo) {
        const icones = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icones[tipo] || 'info-circle';
    }

    /**
     * MOSTRAR ESTADO DE CARREGAMENTO
     * Exibe/oculta indicador de carregamento
     */
    mostrarEstadoCarregamento(carregando) {
        const loader = document.getElementById('loading-indicator');
        if (loader) {
            loader.style.display = carregando ? 'flex' : 'none';
        }
    }

    /**
     * MOSTRAR LOADING NO FORMULÁRIO
     * Ativa/desativa estado de loading no formulário
     */
    mostrarLoadingFormulario(carregando) {
        const btnSubmit = document.querySelector('#formAgendamento button[type="submit"]');
        if (btnSubmit) {
            if (carregando) {
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
            } else {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = '<i class="fas fa-check"></i> Solicitar Agendamento';
            }
        }
    }

    /**
     * DESTACAR CAMPO INVÁLIDO
     * Adiciona estilo de erro a campo inválido
     */
    destacarCampoInvalido(campoId) {
        const campo = document.getElementById(campoId);
        if (campo) {
            campo.classList.add('campo-invalido');
            campo.focus();
            
            // Remover destaque após 3 segundos
            setTimeout(() => {
                campo.classList.remove('campo-invalido');
            }, 3000);
        }
    }

    /**
     * LIMPAR FORMULÁRIO DE AGENDAMENTO
     * Reseta todos os campos do formulário
     */
    limparFormularioAgendamento() {
        const form = document.getElementById('formAgendamento');
        if (form) {
            form.reset();
            
            // Remover classes de erro
            const camposInvalidos = form.querySelectorAll('.campo-invalido');
            camposInvalidos.forEach(campo => {
                campo.classList.remove('campo-invalido');
            });
        }
    }

    /**
     * VALIDAR DATA DO AGENDAMENTO
     * Validações em tempo real para a data
     */
    validarDataAgendamento() {
        const inputData = document.getElementById('inputData');
        if (!inputData || !inputData.value) return;
        
        const hoje = new Date().toISOString().split('T')[0];
        if (inputData.value < hoje) {
            this.mostrarNotificacao('Não é possível agendar para datas passadas', 'error');
            inputData.value = hoje;
        }
    }

    /**
     * VALIDAR EMAIL
     * Validações em tempo real para o email
     */
    validarEmail() {
        const inputEmail = document.getElementById('inputEmail');
        if (!inputEmail || !inputEmail.value) return;
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(inputEmail.value)) {
            inputEmail.classList.add('campo-invalido');
        } else {
            inputEmail.classList.remove('campo-invalido');
        }
    }

    /**
     * ANIMAR MUDANÇA DE NÚMEROS
     * Efeito de contagem para mudanças numéricas
     */
    animarMudancaNumeros(estatisticas) {
        const elementos = {
            total: document.getElementById('totalAgendamentosDashboard'),
            hoje: document.getElementById('agendamentosHojeDashboard'),
            pendentes: document.getElementById('pendentesDashboard')
        };
        
        Object.keys(elementos).forEach(chave => {
            const elemento = elementos[chave];
            if (elemento) {
                const valorAtual = parseInt(elemento.textContent) || 0;
                const valorNovo = estatisticas[chave];
                
                if (valorAtual !== valorNovo) {
                    this.animarContagem(elemento, valorAtual, valorNovo, 1000);
                }
            }
        });
    }

    /**
     * ANIMAR CONTAGEM
     * Animação de contagem para números
     */
    animarContagem(elemento, inicio, fim, duracao) {
        const incremento = (fim - inicio) / (duracao / 16);
        let current = inicio;
        
        const timer = setInterval(() => {
            current += incremento;
            
            if ((incremento > 0 && current >= fim) || (incremento < 0 && current <= fim)) {
                clearInterval(timer);
                current = fim;
            }
            
            elemento.textContent = Math.round(current);
        }, 16);
    }

    /**
     * ADICIONAR EVENTO ESC PARA MODAL
     * Fecha modal ao pressionar ESC
     */
    adicionarEventoEscModal() {
        this.eventoEscModal = (e) => {
            if (e.key === 'Escape' && this.modalAberto) {
                this.fecharModalAgendamento();
            }
        };
        document.addEventListener('keydown', this.eventoEscModal);
    }

    /**
     * REMOVER EVENTO ESC DO MODAL
     * Remove listener quando modal fecha
     */
    removerEventoEscModal() {
        if (this.eventoEscModal) {
            document.removeEventListener('keydown', this.eventoEscModal);
            this.eventoEscModal = null;
        }
    }

    /**
     * ADICIONAR EVENT LISTENER
     * Helper para adicionar eventos de forma segura
     */
    addEventListener(elementId, event, callback) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, callback);
        } else {
            console.warn(`❌ Elemento não encontrado: ${elementId}`);
        }
    }

    /**
     * ATUALIZAR ELEMENTO
     * Helper para atualizar conteúdo de elemento
     */
    atualizarElemento(elementId, valor) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = valor;
        }
    }

    /**
     * ESCAPAR HTML
     * Previne XSS escapando caracteres especiais
     */
    escapeHtml(texto) {
        if (!texto) return '';
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }
}

// =============================================
// INICIALIZAÇÃO DO SISTEMA
// =============================================

// Criar instância global do sistema
const sistemaAgendamento = new DrawindSystem();
window.DrawindApp = sistemaAgendamento;

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM Carregado - Iniciando Sistema V5...');
    sistemaAgendamento.initializeDashboard();
});

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DrawindSystem;
}

console.log('🧠 Sistema de Agendamento V5 carregado - Pronto para inicialização!');