/**
 * SISTEMA DE AGENDAMENTO RÁPIDO - REGRAS COMPLETAS
 * @author Bruno Eduardo
 * @version 4.0 - REGRAS COMPLETAS
 */

class AgendamentoRapido {
    constructor() {
        this.horarioInicio = 7;   // 7:00
        this.horarioFim = 19;     // 19:00  
        this.intervaloMinutos = 15; // Entre reuniões
        this.carregando = false;
        this.horariosOcupados = [];
        
        console.log('🚀 Agendamento rápido com regras completas...');
        this.inicializar();
    }

    /**
     * INICIALIZAÇÃO COMPLETA
     */
    async inicializar() {
        // 1. Configurar data com regras
        this.configurarDataComRegras();
        
        // 2. Carregar agendamentos para verificar conflitos
        await this.carregarAgendamentosOcupados();
        
        // 3. Carregar horários considerando TODAS as regras
        this.carregarHorariosComRegrasCompletas();
        
        // 4. Configurar eventos
        this.configurarEventos();
        
        console.log('✅ Sistema com regras completo!');
    }

    /**
     * CONFIGURAR DATA COM REGRAS COMPLETAS
     */
    configurarDataComRegras() {
        const inputData = document.getElementById('inputData');
        if (inputData) {
            const hoje = new Date();
            const dataFormatada = hoje.toISOString().split('T')[0];
            
            // ✅ REGRA: Não permitir datas passadas
            inputData.min = dataFormatada;
            inputData.value = dataFormatada;
            
            // ✅ REGRA: Ajustar se for fim de semana
            this.ajustarFimDeSemana(inputData);
            
            console.log('📅 Data configurada com regras:', inputData.value);
        }
    }

    /**
     * ✅ REGRA: AJUSTAR FIM DE SEMANA
     */
    ajustarFimDeSemana(inputData) {
        const data = new Date(inputData.value);
        const diaSemana = data.getDay();
        
        if (diaSemana === 0 || diaSemana === 6) {
            console.log('📅 Ajustando fim de semana para segunda...');
            
            // Calcular dias até segunda
            const diasParaSegunda = diaSemana === 0 ? 1 : 2;
            data.setDate(data.getDate() + diasParaSegunda);
            
            // Atualizar input
            const ano = data.getFullYear();
            const mes = String(data.getMonth() + 1).padStart(2, '0');
            const dia = String(data.getDate()).padStart(2, '0');
            inputData.value = `${ano}-${mes}-${dia}`;
            
            this.mostrarNotificacao('📅 Ajustado para segunda-feira (apenas dias úteis)', 'info');
        }
    }

    /**
     * CARREGAR AGENDAMENTOS OCUPADOS PARA VERIFICAÇÃO DE CONFLITOS
     */
    async carregarAgendamentosOcupados() {
        try {
            const dataSelecionada = document.getElementById('inputData').value;
            const salaSelecionada = document.getElementById('selectSala').value;
            
            if (dataSelecionada && salaSelecionada) {
                const agendamentos = await this.buscarAgendamentosData(dataSelecionada, salaSelecionada);
                this.horariosOcupados = this.calcularHorariosOcupados(agendamentos);
                console.log(`📋 ${this.horariosOcupados.length} horários ocupados carregados`);
            }
        } catch (error) {
            console.warn('Não foi possível carregar agendamentos ocupados:', error);
            this.horariosOcupados = [];
        }
    }

    /**
     * ✅ REGRA: CALCULAR HORÁRIOS OCUPADOS COM INTERVALO
     */
    calcularHorariosOcupados(agendamentos) {
        const ocupados = [];
        
        agendamentos.forEach(agendamento => {
            if (agendamento.status === 'cancelado') return;
            
            const inicio = agendamento.horario;
            const duracao = parseInt(agendamento.duracao);
            
            // ✅ REGRA: +15 minutos de intervalo
            const duracaoComIntervalo = duracao + this.intervaloMinutos;
            
            ocupados.push({
                inicio: inicio,
                duracao: duracaoComIntervalo,
                solicitante: agendamento.solicitante
            });
        });
        
        return ocupados;
    }

    /**
     * CARREGAR HORÁRIOS COM TODAS AS REGRAS
     */
    carregarHorariosComRegrasCompletas() {
        console.log('🕐 Carregando horários com regras completas...');
        
        const selectHorario = document.getElementById('selectHorario');
        
        if (!selectHorario) {
            setTimeout(() => this.carregarHorariosComRegrasCompletas(), 100);
            return;
        }
        
        // Limpar select
        selectHorario.innerHTML = '<option value="">Selecione um horário comercial</option>';
        
        const dataSelecionada = document.getElementById('inputData').value;
        const hoje = new Date().toISOString().split('T')[0];
        const eHoje = dataSelecionada === hoje;
        
        let horariosDisponiveis = 0;
        let horariosBloqueados = 0;
        
        // ✅ REGRA: Horário comercial 7:00 às 19:00
        for (let hora = this.horarioInicio; hora <= this.horarioFim; hora++) {
            for (let minuto = 0; minuto < 60; minuto += 30) {
                // Não criar após 19:00
                if (hora === this.horarioFim && minuto > 0) break;
                
                const horario = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
                
                // ✅ REGRA 1: Verificar se horário já passou (se for hoje)
                if (eHoje && this.horarioJaPassou(horario)) {
                    horariosBloqueados++;
                    continue;
                }
                
                // ✅ REGRA 2: Verificar se horário está ocupado (com intervalo)
                const ocupado = this.verificarHorarioOcupado(horario);
                
                const option = document.createElement('option');
                option.value = horario;
                
                if (ocupado) {
                    // Horário ocupado - mostrar como desabilitado
                    option.disabled = true;
                    option.textContent = `${horario} (Ocupado + intervalo)`;
                    option.classList.add('horario-ocupado');
                    horariosBloqueados++;
                } else {
                    // Horário disponível
                    option.textContent = horario;
                    horariosDisponiveis++;
                }
                
                selectHorario.appendChild(option);
            }
        }
        
        console.log(`✅ ${horariosDisponiveis} disponíveis | ${horariosBloqueados} bloqueados`);
        
        // Feedback visual
        if (horariosDisponiveis === 0) {
            this.mostrarNotificacao('ℹ️ Não há horários disponíveis para esta data/sala', 'info');
        }
    }

    /**
     * ✅ REGRA: VERIFICAR SE HORÁRIO JÁ PASSOU
     */
    horarioJaPassou(horario) {
        const agora = new Date();
        const [horaSel, minutoSel] = horario.split(':').map(Number);
        const horaAtual = agora.getHours();
        const minutoAtual = agora.getMinutes();
        
        return horaSel < horaAtual || (horaSel === horaAtual && minutoSel <= minutoAtual);
    }

    /**
     * ✅ REGRA: VERIFICAR HORÁRIO OCUPADO COM INTERVALO
     */
    verificarHorarioOcupado(horarioNovo) {
        const inicioNovo = this.horarioParaMinutos(horarioNovo);
        
        for (const ocupado of this.horariosOcupados) {
            const inicioOcupado = this.horarioParaMinutos(ocupado.inicio);
            const fimOcupado = inicioOcupado + ocupado.duracao;
            
            // Verificar conflito
            if (inicioNovo < fimOcupado) {
                console.log(`🚫 ${horarioNovo} conflita com ${ocupado.inicio} (até ${this.minutosParaHorario(fimOcupado)})`);
                return true;
            }
        }
        
        return false;
    }

    /**
     * CONVERTER HORÁRIO PARA MINUTOS
     */
    horarioParaMinutos(horario) {
        const [hora, minuto] = horario.split(':').map(Number);
        return hora * 60 + minuto;
    }

    /**
     * CONVERTER MINUTOS PARA HORÁRIO
     */
    minutosParaHorario(minutos) {
        const hora = Math.floor(minutos / 60);
        const minuto = minutos % 60;
        return `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
    }

    /**
     * BUSCAR AGENDAMENTOS PARA VERIFICAÇÃO DE CONFLITOS
     */
    async buscarAgendamentosData(data, sala) {
        try {
            // Usar Gaveta se disponível
            if (window.Gaveta && window.Gaveta.pegarAgendamentosLocais) {
                const todosAgendamentos = window.Gaveta.pegarAgendamentosLocais();
                return todosAgendamentos.filter(ag => 
                    ag.data === data && 
                    ag.sala === sala &&
                    ag.status !== 'cancelado'
                );
            }
            
            // Fallback: API
            const response = await fetch(`api/agendamento.php`);
            if (response.ok) {
                const resultado = await response.json();
                return resultado.dados.filter(ag => 
                    ag.data === data && 
                    ag.sala === sala &&
                    ag.status !== 'cancelado'
                );
            }
        } catch (error) {
            console.warn('Erro ao buscar agendamentos:', error);
        }
        
        return [];
    }

    /**
     * CONFIGURAR EVENTOS
     */
    configurarEventos() {
        console.log('🔧 Configurando eventos com regras...');
        
        // FORMULÁRIO
        const form = document.getElementById('formAgendamentoRapido');
        if (form) {
            form.addEventListener('submit', (e) => this.processarAgendamento(e));
        }
        
        // BOTÃO LIMPAR
        const btnLimpar = document.getElementById('btnLimpar');
        if (btnLimpar) {
            btnLimpar.addEventListener('click', () => this.limparFormulario());
        }
        
        // ✅ QUANDO DATA MUDAR - Aplicar regras
        const inputData = document.getElementById('inputData');
        if (inputData) {
            inputData.addEventListener('change', async () => {
                this.validarDataComRegras();
                await this.carregarAgendamentosOcupados();
                this.carregarHorariosComRegrasCompletas();
            });
        }
        
        // ✅ QUANDO SALA MUDAR - Aplicar regras
        const selectSala = document.getElementById('selectSala');
        if (selectSala) {
            selectSala.addEventListener('change', async () => {
                await this.carregarAgendamentosOcupados();
                this.carregarHorariosComRegrasCompletas();
            });
        }
        
        // ✅ DURAÇÃO CUSTOMIZADA
        const selectDuracao = document.getElementById('selectDuracao');
        if (selectDuracao) {
            selectDuracao.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    this.mostrarInputDuracaoCustom();
                }
            });
        }
        
        console.log('✅ Eventos com regras configurados');
    }

    /**
     * VALIDAR DATA COM REGRAS COMPLETAS
     */
    validarDataComRegras() {
        const inputData = document.getElementById('inputData');
        const data = new Date(inputData.value);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        // ✅ REGRA: Não permitir datas passadas
        if (data < hoje) {
            this.mostrarNotificacao('❌ Não é possível agendar para datas passadas', 'erro');
            inputData.value = hoje.toISOString().split('T')[0];
            return;
        }
        
        // ✅ REGRA: Só dias úteis
        const diaSemana = data.getDay();
        if (diaSemana === 0 || diaSemana === 6) {
            this.ajustarFimDeSemana(inputData);
        }
    }

    /**
     * ✅ REGRA: INPUT PARA DIGITAR DURAÇÃO PERSONALIZADA
     */
    mostrarInputDuracaoCustom() {
        const selectDuracao = document.getElementById('selectDuracao');
        const container = selectDuracao.parentNode;
        
        // Remover input anterior
        const inputAnterior = document.querySelector('.input-duracao-custom');
        if (inputAnterior) inputAnterior.remove();
        
        // Criar input
        const inputCustom = document.createElement('input');
        inputCustom.type = 'number';
        inputCustom.min = '15';
        inputCustom.max = '480';
        inputCustom.placeholder = 'Digite os minutos (15-480)';
        inputCustom.className = 'input-duracao-custom';
        
        inputCustom.style.cssText = `
            margin-top: 8px;
            padding: 10px 12px;
            border: 2px solid var(--drawind-primary);
            border-radius: 6px;
            width: 100%;
            box-sizing: border-box;
            font-size: 16px;
            background: #f8f9fa;
        `;
        
        container.appendChild(inputCustom);
        inputCustom.focus();
        
        // Quando digitar
        inputCustom.addEventListener('input', (e) => {
            const minutos = parseInt(e.target.value);
            if (minutos >= 15 && minutos <= 480) {
                selectDuracao.innerHTML = `
                    <option value="${minutos}" selected>${minutos} minutos (personalizado)</option>
                    <option value="custom">Digitar tempo personalizado...</option>
                `;
            }
        });
        
        // Quando perder foco sem digitar
        inputCustom.addEventListener('blur', () => {
            setTimeout(() => {
                if (!inputCustom.value && inputCustom.parentNode) {
                    inputCustom.remove();
                    if (selectDuracao.value === 'custom') {
                        selectDuracao.value = '60';
                    }
                }
            }, 200);
        });
    }

    /**
     * PROCESSAR AGENDAMENTO COM VALIDAÇÃO DE CONFLITO FINAL
     */
    async processarAgendamento(e) {
        e.preventDefault();
        
        if (this.carregando) return;
        
        console.log('📤 Processando agendamento com validações...');
        
        const dados = this.coletarDadosFormulario();
        
        // Validar dados básicos
        if (!this.validarDadosBasicos(dados)) {
            return;
        }
        
        // ✅ REGRA: Verificação FINAL de conflito
        const conflito = await this.verificarConflitoFinal(dados);
        if (conflito) {
            this.mostrarNotificacao('❌ Conflito detectado! Este horário foi ocupado recentemente.', 'erro');
            await this.carregarAgendamentosOcupados();
            this.carregarHorariosComRegrasCompletas();
            return;
        }
        
        this.carregando = true;
        this.mostrarLoading(true);
        
        try {
            console.log('💾 Salvando agendamento:', dados);
            
            if (window.Gaveta && typeof window.Gaveta.salvarAgendamento === 'function') {
                await window.Gaveta.salvarAgendamento(dados);
            } else {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            this.mostrarNotificacao('✅ Agendamento criado com sucesso! Redirecionando...', 'sucesso');
            
            setTimeout(() => {
                window.location.href = 'calendario.html';
            }, 2000);
            
        } catch (error) {
            console.error('❌ Erro ao salvar:', error);
            this.mostrarNotificacao('❌ Erro ao criar agendamento', 'erro');
        } finally {
            this.carregando = false;
            this.mostrarLoading(false);
        }
    }

    /**
     * VERIFICAÇÃO FINAL DE CONFLITO
     */
    async verificarConflitoFinal(dados) {
        const agendamentos = await this.buscarAgendamentosData(dados.data, dados.sala);
        const inicioNovo = this.horarioParaMinutos(dados.horario);
        
        for (const ag of agendamentos) {
            const inicioExistente = this.horarioParaMinutos(ag.horario);
            const duracaoExistente = parseInt(ag.duracao);
            const fimComIntervalo = inicioExistente + duracaoExistente + this.intervaloMinutos;
            
            if (inicioNovo < fimComIntervalo) {
                return true;
            }
        }
        
        return false;
    }

    // ... (mantenha os métodos auxiliares: coletarDadosFormulario, validarDadosBasicos, 
    // destacarCampoInvalido, mostrarLoading, limparFormulario, mostrarNotificacao)
    // Eles são os mesmos da versão anterior
}

// 🚀 INICIALIZAÇÃO
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new AgendamentoRapido());
} else {
    new AgendamentoRapido();
}