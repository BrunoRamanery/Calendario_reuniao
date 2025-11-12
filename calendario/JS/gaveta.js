/**
 * GAVETA MANAGER - VERSÃO 4.0 CORRIGIDA
 * Sistema de armazenamento inteligente online/offline
 * @author Bruno Eduardo Ramanery Ferreira
 * @version 4.0-hybrid-fixed
 */

class GavetaManager {
    constructor() {
        this.CHAVES_GAVETA = {
            AGENDAMENTOS: 'drawind_agendamentos_v4_fixed',
            FILA_SINCRONIZACAO: 'drawind_fila_sincronizacao_v4_fixed',
            CONFIG: 'drawind_config_v4_fixed',
            ULTIMA_SINCRONIZACAO: 'drawind_ultima_sincronizacao_v4_fixed'
        };
        
        this.API_BASE = 'api/';
        this.online = navigator.onLine;
        this.sincronizando = false;
        this.dispositivoId = this.obterIdDispositivo();
        
        console.log('🚀 Gaveta V4 Corrigida inicializando...');
        this.inicializar();
    }

    /**
     * INICIALIZAÇÃO DO SISTEMA CORRIGIDA
     */
    async inicializar() {
        this.configurarDetectorConexao();
        
        // Testar conexão com API
        const apiOnline = await this.testarConexaoAPI();
        this.online = apiOnline && navigator.onLine;
        
        if (this.online) {
            console.log('🌐 Modo online - sincronizando...');
            await this.sincronizarFilaPendente();
            await this.carregarDadosDoBanco();
        } else {
            console.log('📴 Modo offline - usando dados locais');
            this.carregarDadosLocais();
        }
        
        console.log('✅ Gaveta V4 Corrigida pronta! Online:', this.online);
    }

    /**
     * CONFIGURAR DETECÇÃO DE CONEXÃO CORRIGIDA
     */
    configurarDetectorConexao() {
        window.addEventListener('online', async () => {
            console.log('🌐 CONEXÃO RESTAURADA - Testando API...');
            
            const apiOnline = await this.testarConexaoAPI();
            if (apiOnline) {
                this.online = true;
                this.mostrarStatus('Sincronizando dados...', 'info');
                
                await this.sincronizarFilaPendente();
                await this.carregarDadosDoBanco();
                
                this.mostrarStatus('Sincronização completa!', 'success');
            }
        });

        window.addEventListener('offline', () => {
            console.log('📴 MODO OFFLINE ATIVADO');
            this.online = false;
            this.mostrarStatus('Modo offline - Trabalhando localmente', 'warning');
        });
    }

    /**
     * TESTAR CONEXÃO COM API
     */
    async testarConexaoAPI() {
        try {
            const response = await fetch(`${this.API_BASE}agendamento.php`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            return data.sucesso !== false;
            
        } catch (error) {
            console.warn('❌ API offline:', error.message);
            return false;
        }
    }

    /**
     * SALVAR AGENDAMENTO - CORRIGIDO
     */
    async salvarAgendamento(dadosAgendamento) {
        console.log('💾 Salvando agendamento...', dadosAgendamento);
        
        // Gerar IDs únicos
        const uuid = this.gerarUUID();
        const offlineId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const agendamento = {
            ...dadosAgendamento,
            id: offlineId,
            uuid: uuid,
            offline_id: offlineId,
            dataCriacao: new Date().toISOString(),
            status: 'pendente',
            sincronizado: false,
            fonte: 'web'
        };

        try {
            let salvoNoBanco = false;
            
            // Tentar salvar no banco se online
            if (this.online) {
                salvoNoBanco = await this.salvarNoBanco(agendamento);
                if (salvoNoBanco) {
                    agendamento.sincronizado = true;
                    agendamento.fonte = 'web';
                    console.log('✅ Salvo diretamente no banco');
                }
            }
            
            // Salvar na gaveta local (sempre)
            this.salvarNaGavetaLocal(agendamento);
            
            // Se não sincronizou, adicionar na fila
            if (!salvoNoBanco) {
                this.adicionarNaFilaSincronizacao('criar', agendamento);
                this.mostrarStatus('Salvo localmente (offline)', 'warning');
            } else {
                this.mostrarStatus('Agendamento salvo com sucesso!', 'success');
            }
            
            return agendamento;
            
        } catch (error) {
            console.error('❌ Erro ao salvar agendamento:', error);
            // Fallback: garantir que salva localmente
            this.salvarNaGavetaLocal(agendamento);
            this.adicionarNaFilaSincronizacao('criar', agendamento);
            this.mostrarStatus('Salvo localmente (erro de rede)', 'warning');
            return agendamento;
        }
    }

    /**
     * SALVAR NO BANCO DE DADOS - CORRIGIDO
     */
    async salvarNoBanco(agendamento) {
        try {
            // Converter para estrutura do backend
            const dadosParaBackend = {
                data: agendamento.data,
                horario: agendamento.horario,
                sala: agendamento.sala,
                solicitante: agendamento.solicitante,
                email: agendamento.email,
                servico: agendamento.servico,
                observacoes: agendamento.observacoes || '',
                duracao: parseInt(agendamento.duracao),
                status: agendamento.status,
                uuid: agendamento.uuid,
                fonte: agendamento.fonte,
                offline_id: agendamento.offline_id
            };

            console.log('📤 Enviando para API:', dadosParaBackend);

            const response = await fetch(`${this.API_BASE}agendamento.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dadosParaBackend)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const resultado = await response.json();
            console.log('📥 Resposta da API:', resultado);
            
            return resultado.sucesso === true;
            
        } catch (error) {
            console.error('❌ Erro na comunicação com API:', error);
            throw error;
        }
    }

    /**
     * ATUALIZAR NO BANCO - CORRIGIDO
     */
    async atualizarNoBanco(dados) {
        try {
            const response = await fetch(`${this.API_BASE}agendamento.php`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(dados)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const resultado = await response.json();
            return resultado.sucesso === true;
            
        } catch (error) {
            console.error('❌ Erro ao atualizar no banco:', error);
            throw error;
        }
    }

    /**
     * DELETAR NO BANCO - CORRIGIDO
     */
    async deletarNoBanco(id) {
        try {
            const response = await fetch(`${this.API_BASE}agendamento.php`, {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ id: id })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const resultado = await response.json();
            return resultado.sucesso === true;
            
        } catch (error) {
            console.error('❌ Erro ao deletar no banco:', error);
            throw error;
        }
    }

    /**
     * SINCRONIZAR FILA PENDENTE - CORRIGIDA
     */
    async sincronizarFilaPendente() {
        if (!this.online || this.sincronizando) return;
        
        this.sincronizando = true;
        const fila = this.pegarFilaSincronizacao();
        
        if (fila.length === 0) {
            this.sincronizando = false;
            return;
        }
        
        console.log(`🔄 Sincronizando ${fila.length} itens pendentes...`);
        this.mostrarStatus(`Sincronizando ${fila.length} itens...`, 'info');
        
        const filaAtualizada = [];
        let sucessos = 0;

        for (const item of fila) {
            try {
                let sucesso = false;
                
                switch (item.acao) {
                    case 'criar':
                        sucesso = await this.salvarNoBanco(item.dados);
                        break;
                    case 'atualizar':
                        sucesso = await this.atualizarNoBanco(item.dados);
                        break;
                    case 'deletar':
                        sucesso = await this.deletarNoBanco(item.dados.id);
                        break;
                }
                
                if (sucesso) {
                    sucessos++;
                    console.log(`✅ Sincronizado: ${item.acao} ${item.dados.uuid}`);
                    
                    // Atualizar status local se for criação
                    if (item.acao === 'criar') {
                        this.marcarComoSincronizado(item.dados.offline_id);
                    }
                } else {
                    // Manter na fila se falhou
                    item.tentativas = (item.tentativas || 0) + 1;
                    if (item.tentativas < 3) {
                        filaAtualizada.push(item);
                    } else {
                        console.warn(`❌ Item removido da fila após 3 tentativas: ${item.dados.uuid}`);
                    }
                }
                
            } catch (error) {
                console.warn(`❌ Falha na sincronização: ${item.dados.uuid}`, error);
                item.tentativas = (item.tentativas || 0) + 1;
                if (item.tentativas < 3) {
                    filaAtualizada.push(item);
                } else {
                    console.warn(`❌ Item removido da fila após 3 tentativas: ${item.dados.uuid}`);
                }
            }
            
            // Pequena pausa entre requisições
            await this.delay(100);
        }

        // Atualizar fila
        localStorage.setItem(this.CHAVES_GAVETA.FILA_SINCRONIZACAO, JSON.stringify(filaAtualizada));
        this.sincronizando = false;

        if (sucessos > 0) {
            console.log(`🎉 ${sucessos} itens sincronizados com sucesso!`);
            this.mostrarStatus(`${sucessos} itens sincronizados!`, 'success');
            
            // Recarregar dados atualizados do banco
            await this.carregarDadosDoBanco();
        }
        
        if (filaAtualizada.length > 0) {
            console.warn(`⚠️ ${filaAtualizada.length} itens ainda pendentes`);
        }
    }

    /**
     * CARREGAR DADOS DO BANCO - CORRIGIDO
     */
    async carregarDadosDoBanco() {
        try {
            const response = await fetch(`${this.API_BASE}agendamento.php`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const resultado = await response.json();
            
            if (resultado.sucesso && Array.isArray(resultado.dados)) {
                // Adicionar campos do frontend
                const agendamentosFormatados = resultado.dados.map(ag => ({
                    ...ag,
                    sincronizado: true,
                    dataCriacao: ag.data_criacao
                }));
                
                localStorage.setItem(this.CHAVES_GAVETA.AGENDAMENTOS, JSON.stringify(agendamentosFormatados));
                localStorage.setItem(this.CHAVES_GAVETA.ULTIMA_SINCRONIZACAO, new Date().toISOString());
                
                console.log('📥 Dados atualizados do banco:', agendamentosFormatados.length);
                return agendamentosFormatados;
            } else {
                throw new Error('Resposta inválida da API');
            }
            
        } catch (error) {
            console.warn('📴 Não foi possível carregar dados do banco:', error);
            return this.pegarAgendamentosLocais();
        }
    }

    /**
     * MÉTODOS AUXILIARES CORRIGIDOS
     */
    
    // Gerar UUID único
    gerarUUID() {
        return 'v4_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Obter ID único do dispositivo
    obterIdDispositivo() {
        let id = localStorage.getItem('drawind_dispositivo_id');
        if (!id) {
            id = 'device_' + Math.random().toString(36).substr(2, 16);
            localStorage.setItem('drawind_dispositivo_id', id);
        }
        return id;
    }
    
    // Salvar na gaveta local
    salvarNaGavetaLocal(agendamento) {
        const agendamentos = this.pegarAgendamentosLocais();
        
        // Remover se já existe (atualização)
        const index = agendamentos.findIndex(a => 
            a.id === agendamento.id || a.uuid === agendamento.uuid
        );
        
        if (index !== -1) {
            agendamentos[index] = agendamento;
        } else {
            agendamentos.push(agendamento);
        }
        
        localStorage.setItem(this.CHAVES_GAVETA.AGENDAMENTOS, JSON.stringify(agendamentos));
    }
    
    // Pegar agendamentos locais
    pegarAgendamentosLocais() {
        try {
            const agendamentos = localStorage.getItem(this.CHAVES_GAVETA.AGENDAMENTOS);
            return agendamentos ? JSON.parse(agendamentos) : [];
        } catch (error) {
            console.error('❌ Erro ao carregar dados locais:', error);
            return [];
        }
    }
    
    // Adicionar na fila de sincronização
    adicionarNaFilaSincronizacao(acao, dados) {
        const fila = this.pegarFilaSincronizacao();
        fila.push({
            id: this.gerarUUID(),
            acao: acao,
            dados: dados,
            timestamp: new Date().toISOString(),
            tentativas: 0
        });
        localStorage.setItem(this.CHAVES_GAVETA.FILA_SINCRONIZACAO, JSON.stringify(fila));
    }
    
    // Pegar fila de sincronização
    pegarFilaSincronizacao() {
        try {
            const fila = localStorage.getItem(this.CHAVES_GAVETA.FILA_SINCRONIZACAO);
            return fila ? JSON.parse(fila) : [];
        } catch (error) {
            return [];
        }
    }
    
    // Marcar como sincronizado
    marcarComoSincronizado(offlineId) {
        const agendamentos = this.pegarAgendamentosLocais();
        const agendamento = agendamentos.find(a => a.id === offlineId);
        if (agendamento) {
            agendamento.sincronizado = true;
            localStorage.setItem(this.CHAVES_GAVETA.AGENDAMENTOS, JSON.stringify(agendamentos));
        }
    }
    
    // Delay helper
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Mostrar status para usuário
    mostrarStatus(mensagem, tipo = 'info') {
        console.log(`📢 [${tipo}] ${mensagem}`);
        if (window.DrawindApp && window.DrawindApp.mostrarNotificacao) {
            window.DrawindApp.mostrarNotificacao(mensagem, tipo);
        }
    }

    /**
     * MÉTODOS DE ATUALIZAÇÃO CORRIGIDOS
     */
    async atualizarAgendamento(id, atualizacoes) {
        const agendamentos = this.pegarAgendamentosLocais();
        const index = agendamentos.findIndex(ag => ag.id === id || ag.uuid === id);
        
        if (index !== -1) {
            const agendamentoAtualizado = { 
                ...agendamentos[index], 
                ...atualizacoes 
            };
            agendamentos[index] = agendamentoAtualizado;
            
            // Se online, tentar atualizar no banco
            if (this.online) {
                try {
                    await this.atualizarNoBanco(agendamentoAtualizado);
                    agendamentoAtualizado.sincronizado = true;
                } catch (error) {
                    this.adicionarNaFilaSincronizacao('atualizar', agendamentoAtualizado);
                    agendamentoAtualizado.sincronizado = false;
                }
            } else {
                this.adicionarNaFilaSincronizacao('atualizar', agendamentoAtualizado);
                agendamentoAtualizado.sincronizado = false;
            }
            
            localStorage.setItem(this.CHAVES_GAVETA.AGENDAMENTOS, JSON.stringify(agendamentos));
            return agendamentoAtualizado;
        }
        return null;
    }

    /**
     * VERIFICAÇÃO DE HORÁRIO LIVRE CORRIGIDA
     */
    verificarHorarioLivre(data, horario, duracao, agendamentoId = null) {
        const agendamentos = this.pegarAgendamentosLocais();
        const agendamentosDia = agendamentos.filter(ag => 
            ag.data === data && 
            ag.status !== 'cancelado' &&
            ag.sincronizado !== false
        );
        
        const [hora, minuto] = horario.split(':').map(Number);
        const inicioMinutos = hora * 60 + minuto;
        const fimMinutos = inicioMinutos + parseInt(duracao);
        
        for (const ag of agendamentosDia) {
            // Pular o próprio agendamento em caso de edição
            if (agendamentoId && (ag.id === agendamentoId || ag.uuid === agendamentoId)) continue;
            
            const [agHora, agMinuto] = ag.horario.split(':').map(Number);
            const agInicioMinutos = agHora * 60 + agMinuto;
            const agFimMinutos = agInicioMinutos + parseInt(ag.duracao);
            
            // Verificar sobreposição
            if (inicioMinutos < agFimMinutos && fimMinutos > agInicioMinutos) {
                return false;
            }
        }
        
        return true;
    }
}

// Criar instância global
const gavetaV4 = new GavetaManager();
window.Gaveta = gavetaV4;

console.log('🗄️ Gaveta.js V4 Corrigida carregada - Sistema online/offline pronto!');