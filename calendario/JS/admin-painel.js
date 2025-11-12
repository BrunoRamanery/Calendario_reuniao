/**
 * PAINEL ADMINISTRATIVO - SISTEMA COMPLETO
 * @author Bruno Eduardo
 * @version 1.0 - ADMIN PANEL
 */

class AdminPanel {
    constructor() {
        this.agendamentos = [];
        this.agendamentosFiltrados = [];
        this.filtrosAtivos = {
            status: 'todos',
            data: '',
            sala: 'todos',
            busca: ''
        };
        this.paginaAtual = 1;
        this.itensPorPagina = 10;
        this.agendamentoSelecionado = null;
        
        console.log('🛡️ Iniciando Painel Administrativo...');
        this.inicializar();
    }

    /**
     * INICIALIZAÇÃO DO PAINEL
     */
    async inicializar() {
        // 1. Configurar eventos
        this.configurarEventos();
        
        // 2. Carregar dados
        await this.carregarDados();
        
        // 3. Atualizar interface
        this.atualizarInterface();
        
        console.log('✅ Painel Administrativo pronto!');
    }

    /**
     * CONFIGURAR EVENTOS
     */
    configurarEventos() {
        console.log('🔧 Configurando eventos do admin...');
        
        // Filtros
        document.getElementById('filterStatus').addEventListener('change', (e) => {
            this.filtrosAtivos.status = e.target.value;
            this.aplicarFiltros();
        });
        
        document.getElementById('filterData').addEventListener('change', (e) => {
            this.filtrosAtivos.data = e.target.value;
            this.aplicarFiltros();
        });
        
        document.getElementById('filterSala').addEventListener('change', (e) => {
            this.filtrosAtivos.sala = e.target.value;
            this.aplicarFiltros();
        });
        
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filtrosAtivos.busca = e.target.value.toLowerCase();
            this.aplicarFiltros();
        });
        
        // Botões de ação dos filtros
        document.getElementById('btnAplicarFiltros').addEventListener('click', () => {
            this.aplicarFiltros();
        });
        
        document.getElementById('btnLimparFiltros').addEventListener('click', () => {
            this.limparFiltros();
        });
        
        // Paginação
        document.getElementById('prevPage').addEventListener('click', () => {
            this.paginaAnterior();
        });
        
        document.getElementById('nextPage').addEventListener('click', () => {
            this.proximaPagina();
        });
        
        // Configurar modais
        this.configurarModais();
        
        console.log('✅ Eventos do admin configurados');
    }

    /**
     * CONFIGURAR MODAIS
     */
    configurarModais() {
        // Modal de Aprovação
        document.getElementById('btnConfirmarAprovacao').addEventListener('click', () => {
            this.confirmarAprovacao();
        });
        
        document.getElementById('btnCancelarAprovacao').addEventListener('click', () => {
            this.fecharModal('modalAprovar');
        });
        
        // Modal de Cancelamento
        document.getElementById('btnConfirmarCancelamento').addEventListener('click', () => {
            this.confirmarCancelamento();
        });
        
        document.getElementById('btnCancelarCancelamento').addEventListener('click', () => {
            this.fecharModal('modalCancelar');
        });
        
        // Modal de Edição
        document.getElementById('btnConfirmarEdicao').addEventListener('click', () => {
            this.confirmarEdicao();
        });
        
        document.getElementById('btnCancelarEdicao').addEventListener('click', () => {
            this.fecharModal('modalEditar');
        });
        
        // Modal de Detalhes
        document.getElementById('btnFecharDetalhes').addEventListener('click', () => {
            this.fecharModal('modalDetalhes');
        });
        
        // Fechar modais ao clicar no X
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        // Fechar modais ao clicar fora
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }

    /**
     * CARREGAR DADOS DO SISTEMA
     */
    async carregarDados() {
        console.log('📂 Carregando dados administrativos...');
        
        try {
            // Usar Gaveta ou API
            if (window.Gaveta && window.Gaveta.pegarAgendamentosLocais) {
                this.agendamentos = window.Gaveta.pegarAgendamentosLocais();
            } else {
                const response = await fetch('api/agendamento.php');
                if (response.ok) {
                    const data = await response.json();
                    this.agendamentos = data.dados || [];
                } else {
                    throw new Error('Erro ao carregar agendamentos');
                }
            }
            
            console.log(`✅ ${this.agendamentos.length} agendamentos carregados`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            this.mostrarNotificacao('❌ Erro ao carregar dados do sistema', 'erro');
            this.agendamentos = [];
        }
    }

    /**
     * ATUALIZAR INTERFACE COMPLETA
     */
    atualizarInterface() {
        this.atualizarEstatisticas();
        this.aplicarFiltros();
    }

    /**
     * ATUALIZAR ESTATÍSTICAS
     */
    atualizarEstatisticas() {
        const totalPendentes = this.agendamentos.filter(a => a.status === 'pendente').length;
        const totalAprovados = this.agendamentos.filter(a => a.status === 'confirmado').length;
        const totalCancelados = this.agendamentos.filter(a => a.status === 'cancelado').length;
        
        document.getElementById('totalPendentes').textContent = totalPendentes;
        document.getElementById('totalAprovados').textContent = totalAprovados;
        document.getElementById('totalCancelados').textContent = totalCancelados;
        document.getElementById('totalAgendamentos').textContent = this.agendamentos.length;
        
        console.log('📊 Estatísticas atualizadas');
    }

    /**
     * APLICAR FILTROS
     */
    aplicarFiltros() {
        console.log('🔍 Aplicando filtros...', this.filtrosAtivos);
        
        let filtrados = [...this.agendamentos];
        
        // Filtro por status
        if (this.filtrosAtivos.status !== 'todos') {
            filtrados = filtrados.filter(a => a.status === this.filtrosAtivos.status);
        }
        
        // Filtro por data
        if (this.filtrosAtivos.data) {
            filtrados = filtrados.filter(a => a.data === this.filtrosAtivos.data);
        }
        
        // Filtro por sala
        if (this.filtrosAtivos.sala !== 'todos') {
            filtrados = filtrados.filter(a => a.sala === this.filtrosAtivos.sala);
        }
        
        // Filtro por busca
        if (this.filtrosAtivos.busca) {
            const busca = this.filtrosAtivos.busca.toLowerCase();
            filtrados = filtrados.filter(a => 
                a.solicitante.toLowerCase().includes(busca) ||
                a.email.toLowerCase().includes(busca) ||
                a.servico.toLowerCase().includes(busca)
            );
        }
        
        this.agendamentosFiltrados = filtrados;
        this.paginaAtual = 1; // Resetar para primeira página
        this.atualizarTabela();
        
        console.log(`✅ ${filtrados.length} agendamentos após filtros`);
    }

    /**
     * LIMPAR FILTROS
     */
    limparFiltros() {
        console.log('🧹 Limpando filtros...');
        
        document.getElementById('filterStatus').value = 'todos';
        document.getElementById('filterData').value = '';
        document.getElementById('filterSala').value = 'todos';
        document.getElementById('searchInput').value = '';
        
        this.filtrosAtivos = {
            status: 'todos',
            data: '',
            sala: 'todos',
            busca: ''
        };
        
        this.aplicarFiltros();
        this.mostrarNotificacao('✅ Filtros limpos', 'sucesso');
    }

    /**
     * ATUALIZAR TABELA DE AGENDAMENTOS
     */
    atualizarTabela() {
        const tbody = document.querySelector('#tabelaAgendamentosAdmin tbody');
        if (!tbody) return;
        
        // Calcular itens para a página atual
        const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
        const fim = inicio + this.itensPorPagina;
        const agendamentosPagina = this.agendamentosFiltrados.slice(inicio, fim);
        
        tbody.innerHTML = '';
        
        if (agendamentosPagina.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="no-data">
                        <i class="fas fa-inbox"></i>
                        <br>
                        Nenhum agendamento encontrado
                        <br>
                        <small>Tente ajustar os filtros</small>
                    </td>
                </tr>
            `;
        } else {
            agendamentosPagina.forEach(agendamento => {
                const linha = this.criarLinhaTabela(agendamento);
                tbody.appendChild(linha);
            });
        }
        
        this.atualizarPaginacao();
        
        console.log(`📋 Tabela atualizada: ${agendamentosPagina.length} itens na página ${this.paginaAtual}`);
    }

    /**
     * CRIAR LINHA DA TABELA
     */
    criarLinhaTabela(agendamento) {
        const linha = document.createElement('tr');
        
        // Formatar data e hora
        const dataObj = new Date(agendamento.data + 'T' + agendamento.horario);
        const dataFormatada = dataObj.toLocaleDateString('pt-BR');
        const horaFormatada = dataObj.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        linha.innerHTML = `
            <td>
                <div class="data-hora-cell">
                    <strong>${dataFormatada}</strong>
                    <br>
                    <small>${horaFormatada}</small>
                </div>
            </td>
            <td>
                <div class="solicitante-cell">
                    <strong>${this.escapeHtml(agendamento.solicitante)}</strong>
                    <br>
                    <small class="email-text">${this.escapeHtml(agendamento.email)}</small>
                </div>
            </td>
            <td>${this.escapeHtml(agendamento.email)}</td>
            <td>${this.escapeHtml(agendamento.sala)}</td>
            <td>
                <div class="assunto-cell" title="${this.escapeHtml(agendamento.servico)}">
                    ${this.escapeHtml(agendamento.servico)}
                </div>
            </td>
            <td>${agendamento.duracao} min</td>
            <td>
                <span class="status-badge status-${agendamento.status}">
                    <i class="fas fa-${this.obterIconeStatus(agendamento.status)}"></i>
                    ${agendamento.status}
                </span>
            </td>
            <td>
                <div class="btn-actions">
                    ${agendamento.status === 'pendente' ? `
                        <button class="btn-acao btn-aprovar" data-id="${agendamento.id}" title="Aprovar">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                    
                    <button class="btn-acao btn-cancelar" data-id="${agendamento.id}" title="Cancelar">
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <button class="btn-acao btn-editar" data-id="${agendamento.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    
                    <button class="btn-acao btn-detalhes" data-id="${agendamento.id}" title="Detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        `;
        
        // Adicionar eventos aos botões
        this.adicionarEventosLinha(linha, agendamento);
        
        return linha;
    }

    /**
     * ADICIONAR EVENTOS AOS BOTÕES DA LINHA
     */
    adicionarEventosLinha(linha, agendamento) {
        // Botão Aprovar
        const btnAprovar = linha.querySelector('.btn-aprovar');
        if (btnAprovar) {
            btnAprovar.addEventListener('click', () => {
                this.abrirModalAprovar(agendamento);
            });
        }
        
        // Botão Cancelar
        const btnCancelar = linha.querySelector('.btn-cancelar');
        if (btnCancelar) {
            btnCancelar.addEventListener('click', () => {
                this.abrirModalCancelar(agendamento);
            });
        }
        
        // Botão Editar
        const btnEditar = linha.querySelector('.btn-editar');
        if (btnEditar) {
            btnEditar.addEventListener('click', () => {
                this.abrirModalEditar(agendamento);
            });
        }
        
        // Botão Detalhes
        const btnDetalhes = linha.querySelector('.btn-detalhes');
        if (btnDetalhes) {
            btnDetalhes.addEventListener('click', () => {
                this.abrirModalDetalhes(agendamento);
            });
        }
    }

    /**
     * ATUALIZAR PAGINAÇÃO
     */
    atualizarPaginacao() {
        const totalPaginas = Math.ceil(this.agendamentosFiltrados.length / this.itensPorPagina);
        const paginationInfo = document.getElementById('paginationInfo');
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');
        
        paginationInfo.textContent = `Página ${this.paginaAtual} de ${totalPaginas}`;
        prevPage.disabled = this.paginaAtual === 1;
        nextPage.disabled = this.paginaAtual === totalPaginas || totalPaginas === 0;
    }

    /**
     * PAGINAÇÃO - PRÓXIMA PÁGINA
     */
    proximaPagina() {
        const totalPaginas = Math.ceil(this.agendamentosFiltrados.length / this.itensPorPagina);
        if (this.paginaAtual < totalPaginas) {
            this.paginaAtual++;
            this.atualizarTabela();
        }
    }

    /**
     * PAGINAÇÃO - PÁGINA ANTERIOR
     */
    paginaAnterior() {
        if (this.paginaAtual > 1) {
            this.paginaAtual--;
            this.atualizarTabela();
        }
    }

    /**
     * MODAL: APROVAR AGENDAMENTO
     */
    abrirModalAprovar(agendamento) {
        this.agendamentoSelecionado = agendamento;
        
        // Preencher informações
        const infoAprovar = document.getElementById('infoAprovar');
        infoAprovar.innerHTML = this.criarHTMLInfoAgendamento(agendamento);
        
        // Abrir modal
        this.abrirModal('modalAprovar');
    }

    /**
     * CONFIRMAR APROVAÇÃO
     */
    async confirmarAprovacao() {
        if (!this.agendamentoSelecionado) return;
        
        try {
            console.log('✅ Aprovando agendamento:', this.agendamentoSelecionado.id);
            
            // Atualizar status no sistema
            const sucesso = await this.atualizarStatusAgendamento(
                this.agendamentoSelecionado.id, 
                'confirmado'
            );
            
            if (sucesso) {
                // ✅ ENVIAR EMAIL DE APROVAÇÃO
                await this.enviarEmailAprovacao(this.agendamentoSelecionado);
                
                this.mostrarNotificacao('✅ Agendamento aprovado e email enviado!', 'sucesso');
                this.fecharModal('modalAprovar');
                
                // Recarregar dados
                await this.carregarDados();
                this.atualizarInterface();
            } else {
                throw new Error('Falha ao atualizar status');
            }
            
        } catch (error) {
            console.error('❌ Erro ao aprovar agendamento:', error);
            this.mostrarNotificacao('❌ Erro ao aprovar agendamento', 'erro');
        }
    }

    /**
     * MODAL: CANCELAR AGENDAMENTO
     */
    abrirModalCancelar(agendamento) {
        this.agendamentoSelecionado = agendamento;
        
        // Preencher informações
        const infoCancelar = document.getElementById('infoCancelar');
        infoCancelar.innerHTML = this.criarHTMLInfoAgendamento(agendamento);
        
        // Limpar campo de motivo
        document.getElementById('motivoCancelamento').value = '';
        
        // Abrir modal
        this.abrirModal('modalCancelar');
    }

    /**
     * CONFIRMAR CANCELAMENTO
     */
    async confirmarCancelamento() {
        if (!this.agendamentoSelecionado) return;
        
        const motivo = document.getElementById('motivoCancelamento').value.trim();
        
        if (!motivo) {
            this.mostrarNotificacao('❌ Informe o motivo do cancelamento', 'erro');
            return;
        }
        
        try {
            console.log('❌ Cancelando agendamento:', this.agendamentoSelecionado.id);
            
            // Atualizar status no sistema
            const sucesso = await this.atualizarStatusAgendamento(
                this.agendamentoSelecionado.id, 
                'cancelado'
            );
            
            if (sucesso) {
                // ✅ ENVIAR EMAIL DE CANCELAMENTO
                await this.enviarEmailCancelamento(this.agendamentoSelecionado, motivo);
                
                this.mostrarNotificacao('✅ Agendamento cancelado e email enviado!', 'sucesso');
                this.fecharModal('modalCancelar');
                
                // Recarregar dados
                await this.carregarDados();
                this.atualizarInterface();
            } else {
                throw new Error('Falha ao atualizar status');
            }
            
        } catch (error) {
            console.error('❌ Erro ao cancelar agendamento:', error);
            this.mostrarNotificacao('❌ Erro ao cancelar agendamento', 'erro');
        }
    }

    /**
     * MODAL: EDITAR AGENDAMENTO
     */
    abrirModalEditar(agendamento) {
        this.agendamentoSelecionado = agendamento;
        
        // Preencher formulário com dados atuais
        document.getElementById('editData').value = agendamento.data;
        document.getElementById('editSolicitante').value = agendamento.solicitante;
        document.getElementById('editEmail').value = agendamento.email;
        document.getElementById('editSala').value = agendamento.sala;
        document.getElementById('editServico').value = agendamento.servico;
        document.getElementById('editDuracao').value = agendamento.duracao;
        document.getElementById('editObservacoes').value = agendamento.observacoes || '';
        document.getElementById('editJustificativa').value = '';
        
        // Carregar horários disponíveis
        this.carregarHorariosEdicao(agendamento.data, agendamento.sala, agendamento.horario);
        
        // Abrir modal
        this.abrirModal('modalEditar');
    }

    /**
     * CARREGAR HORÁRIOS PARA EDIÇÃO
     */
    async carregarHorariosEdicao(data, sala, horarioAtual) {
        const selectHorario = document.getElementById('editHorario');
        selectHorario.innerHTML = '<option value="">Carregando horários...</option>';
        
        try {
            // Buscar agendamentos para verificar conflitos
            const agendamentos = await this.buscarAgendamentosData(data, sala);
            
            // Gerar horários disponíveis
            const horariosDisponiveis = this.gerarHorariosDisponiveis(data, agendamentos);
            
            selectHorario.innerHTML = '';
            
            // Adicionar horário atual como primeira opção (mesmo se ocupado)
            const optionAtual = document.createElement('option');
            optionAtual.value = horarioAtual;
            optionAtual.textContent = `${horarioAtual} (atual)`;
            optionAtual.selected = true;
            selectHorario.appendChild(optionAtual);
            
            // Adicionar outros horários disponíveis
            horariosDisponiveis.forEach(horario => {
                if (horario !== horarioAtual) {
                    const option = document.createElement('option');
                    option.value = horario;
                    option.textContent = horario;
                    selectHorario.appendChild(option);
                }
            });
            
        } catch (error) {
            console.error('Erro ao carregar horários para edição:', error);
            selectHorario.innerHTML = '<option value="">Erro ao carregar horários</option>';
        }
    }

    /**
     * GERAR HORÁRIOS DISPONÍVEIS PARA EDIÇÃO
     */
    gerarHorariosDisponiveis(data, agendamentosExistentes) {
        const horarios = [];
        const intervalo = 15; // minutos entre reuniões
        
        // Horário comercial: 7:00 às 19:00
        for (let hora = 7; hora <= 19; hora++) {
            for (let minuto = 0; minuto < 60; minuto += 30) {
                if (hora === 19 && minuto > 0) break;
                
                const horario = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
                const horarioMinutos = this.horarioParaMinutos(horario);
                
                // Verificar se horário está disponível
                let disponivel = true;
                
                for (const ag of agendamentosExistentes) {
                    const inicioExistente = this.horarioParaMinutos(ag.horario);
                    const duracaoExistente = parseInt(ag.duracao);
                    const fimComIntervalo = inicioExistente + duracaoExistente + intervalo;
                    
                    if (horarioMinutos < fimComIntervalo) {
                        disponivel = false;
                        break;
                    }
                }
                
                if (disponivel) {
                    horarios.push(horario);
                }
            }
        }
        
        return horarios;
    }

    /**
     * CONFIRMAR EDIÇÃO
     */
    async confirmarEdicao() {
        if (!this.agendamentoSelecionado) return;
        
        const justificativa = document.getElementById('editJustificativa').value.trim();
        
        if (!justificativa) {
            this.mostrarNotificacao('❌ Informe a justificativa das alterações', 'erro');
            return;
        }
        
        // Coletar dados do formulário
        const dadosAtualizados = {
            id: this.agendamentoSelecionado.id,
            data: document.getElementById('editData').value,
            horario: document.getElementById('editHorario').value,
            sala: document.getElementById('editSala').value,
            solicitante: document.getElementById('editSolicitante').value,
            email: document.getElementById('editEmail').value,
            servico: document.getElementById('editServico').value,
            duracao: document.getElementById('editDuracao').value,
            observacoes: document.getElementById('editObservacoes').value
        };
        
        try {
            console.log('✏️ Editando agendamento:', dadosAtualizados);
            
            // Atualizar no sistema
            const sucesso = await this.atualizarAgendamento(dadosAtualizados);
            
            if (sucesso) {
                // ✅ ENVIAR EMAIL DE EDIÇÃO
                await this.enviarEmailEdicao(this.agendamentoSelecionado, dadosAtualizados, justificativa);
                
                this.mostrarNotificacao('✅ Agendamento atualizado e email enviado!', 'sucesso');
                this.fecharModal('modalEditar');
                
                // Recarregar dados
                await this.carregarDados();
                this.atualizarInterface();
            } else {
                throw new Error('Falha ao atualizar agendamento');
            }
            
        } catch (error) {
            console.error('❌ Erro ao editar agendamento:', error);
            this.mostrarNotificacao('❌ Erro ao editar agendamento', 'erro');
        }
    }

    /**
     * MODAL: DETALHES DO AGENDAMENTO
     */
    abrirModalDetalhes(agendamento) {
        const detalhes = document.getElementById('detalhesAgendamento');
        
        detalhes.innerHTML = `
            <div class="info-item">
                <span class="info-label">Data:</span>
                <span class="info-value">${new Date(agendamento.data + 'T' + agendamento.horario).toLocaleDateString('pt-BR')}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Horário:</span>
                <span class="info-value">${agendamento.horario}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Sala:</span>
                <span class="info-value">${agendamento.sala}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Duração:</span>
                <span class="info-value">${agendamento.duracao} minutos</span>
            </div>
            <div class="info-item">
                <span class="info-label">Solicitante:</span>
                <span class="info-value">${agendamento.solicitante}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Email:</span>
                <span class="info-value">${agendamento.email}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Assunto:</span>
                <span class="info-value">${agendamento.servico}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Observações:</span>
                <span class="info-value">${agendamento.observacoes || 'Nenhuma'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Status:</span>
                <span class="info-value">
                    <span class="status-badge status-${agendamento.status}">
                        ${agendamento.status}
                    </span>
                </span>
            </div>
            <div class="info-item">
                <span class="info-label">Data de Criação:</span>
                <span class="info-value">${new Date(agendamento.data_criacao).toLocaleString('pt-BR')}</span>
            </div>
        `;
        
        this.abrirModal('modalDetalhes');
    }

    /**
     * MÉTODOS DE COMUNICAÇÃO COM API/ARMAZENAMENTO
     */
    async atualizarStatusAgendamento(id, novoStatus) {
        try {
            if (window.Gaveta && window.Gaveta.atualizarAgendamento) {
                return await window.Gaveta.atualizarAgendamento(id, { status: novoStatus });
            } else {
                // Usar API diretamente
                const response = await fetch('api/agendamento.php', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, status: novoStatus })
                });
                
                return response.ok;
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            return false;
        }
    }

    async atualizarAgendamento(dados) {
        try {
            if (window.Gaveta && window.Gaveta.atualizarAgendamento) {
                return await window.Gaveta.atualizarAgendamento(dados.id, dados);
            } else {
                // Usar API diretamente
                const response = await fetch('api/agendamento.php', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dados)
                });
                
                return response.ok;
            }
        } catch (error) {
            console.error('Erro ao atualizar agendamento:', error);
            return false;
        }
    }

    async buscarAgendamentosData(data, sala) {
        try {
            if (window.Gaveta && window.Gaveta.pegarAgendamentosLocais) {
                const todos = window.Gaveta.pegarAgendamentosLocais();
                return todos.filter(a => a.data === data && a.sala === sala && a.status !== 'cancelado');
            } else {
                const response = await fetch('api/agendamento.php');
                if (response.ok) {
                    const data = await response.json();
                    return data.dados.filter(a => a.data === data && a.sala === sala && a.status !== 'cancelado');
                }
            }
        } catch (error) {
            console.error('Erro ao buscar agendamentos:', error);
        }
        return [];
    }

    /**
     * MÉTODOS DE EMAIL (SIMULAÇÃO)
     */
    async enviarEmailAprovacao(agendamento) {
        console.log('📧 Enviando email de aprovação para:', agendamento.email);
        
        // Simular envio de email
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('✅ Email de aprovação enviado com sucesso');
        
        // Em produção, aqui iria a integração real com serviço de email
        return true;
    }

    async enviarEmailCancelamento(agendamento, motivo) {
        console.log('📧 Enviando email de cancelamento para:', agendamento.email);
        console.log('📝 Motivo:', motivo);
        
        // Simular envio de email
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('✅ Email de cancelamento enviado com sucesso');
        
        return true;
    }

    async enviarEmailEdicao(agendamentoOriginal, dadosAtualizados, justificativa) {
        console.log('📧 Enviando email de edição para:', dadosAtualizados.email);
        console.log('📝 Justificativa:', justificativa);
        console.log('🔄 Alterações:', dadosAtualizados);
        
        // Simular envio de email
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('✅ Email de edição enviado com sucesso');
        
        return true;
    }

    /**
     * MÉTODOS AUXILIARES
     */
    criarHTMLInfoAgendamento(agendamento) {
        const dataFormatada = new Date(agendamento.data + 'T' + agendamento.horario).toLocaleDateString('pt-BR');
        
        return `
            <div class="info-item">
                <span class="info-label">Data:</span>
                <span class="info-value">${dataFormatada} às ${agendamento.horario}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Solicitante:</span>
                <span class="info-value">${agendamento.solicitante}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Email:</span>
                <span class="info-value">${agendamento.email}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Sala:</span>
                <span class="info-value">${agendamento.sala}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Assunto:</span>
                <span class="info-value">${agendamento.servico}</span>
            </div>
        `;
    }

    obterIconeStatus(status) {
        const icones = {
            pendente: 'clock',
            confirmado: 'check-circle',
            cancelado: 'times-circle'
        };
        return icones[status] || 'question-circle';
    }

    horarioParaMinutos(horario) {
        const [hora, minuto] = horario.split(':').map(Number);
        return hora * 60 + minuto;
    }

    abrirModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    fecharModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    escapeHtml(texto) {
        if (!texto) return '';
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }

    mostrarNotificacao(mensagem, tipo = 'info') {
        const notificacao = document.createElement('div');
        notificacao.className = `notificacao-temporaria notificacao-${tipo}`;
        notificacao.innerHTML = `
            <div class="notificacao-conteudo">
                <i class="fas fa-${tipo === 'sucesso' ? 'check-circle' : tipo === 'erro' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${mensagem}</span>
            </div>
        `;
        document.body.appendChild(notificacao);
        setTimeout(() => notificacao.classList.add('show'), 100);
        setTimeout(() => {
            notificacao.classList.remove('show');
            setTimeout(() => notificacao.parentNode?.removeChild(notificacao), 300);
        }, 5000);
    }
}

// 🚀 INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    new AdminPanel();
});

console.log('🛡️ Sistema Administrativo carregado!');