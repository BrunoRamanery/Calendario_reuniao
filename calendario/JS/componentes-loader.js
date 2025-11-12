/**
 * COMPONENTES-LOADER.JS - VERSÃO CORRIGIDA
 * @author Bruno Eduardo
 * @version 5.0-fixed
 */

class ComponentLoader {
    constructor() {
        this.components = {
            // COMPONENTES PRINCIPAIS
            'dashboard-header': 'partials/header.html',
            'dashboard-main': 'partials/dashboard-main.html',
            
            // COMPONENTES COMPLEMENTARES
            'modal': 'partials/modal-agendamento.html',
            'footer': 'partials/footer.html'
        };
        
        console.log('🔧 Carregador de componentes corrigido inicializado');
    }

    /**
     * MÉTODO PRINCIPAL CORRIGIDO
     */
    async carregarComponentes() {
        console.log('📦 Iniciando carregamento do layout...');
        
        try {
            // VERIFICAR SE ESTAMOS NA PÁGINA CORRETA
            const currentPage = window.location.pathname;
            
            if (currentPage.includes('calendario.html') || currentPage === '/' || currentPage.includes('index.html')) {
                // SÓ CARREGAR COMPONENTES NA PÁGINA DO CALENDÁRIO
                await this.carregarComponente('dashboard-header', this.components['dashboard-header']);
                await this.carregarComponente('dashboard-main', this.components['dashboard-main']);
                
                console.log('✅ Layout do calendário carregado com sucesso!');
                
                // INICIALIZAR SISTEMA APÓS CARREGAR TUDO
                this.inicializarSistema();
                
            } else {
                console.log('ℹ️  Não é página do calendário, ignorando carregamento de componentes');
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar layout:', error);
            this.mostrarErroCarregamento();
        }
    }

    /**
     * CARREGA UM COMPONENTE ESPECÍFICO
     */
    async carregarComponente(nomeComponente, caminhoArquivo) {
        try {
            console.log(`📁 Carregando: ${nomeComponente}...`);
            
            const response = await fetch(caminhoArquivo);
            
            if (!response.ok) {
                throw new Error(`Arquivo não encontrado: ${caminhoArquivo}`);
            }
            
            const html = await response.text();
            const container = document.getElementById(`${nomeComponente}-container`);
            
            if (container) {
                container.innerHTML = html;
                console.log(`✅ ${nomeComponente} carregado com sucesso`);
                
                // Executar inicializações específicas após carregar
                this.inicializarComponente(nomeComponente);
            } else {
                console.warn(`⚠️ Container não encontrado: ${nomeComponente}-container`);
            }
            
        } catch (error) {
            console.error(`❌ Falha ao carregar ${nomeComponente}:`, error);
        }
    }

    /**
     * INICIALIZAÇÕES ESPECÍFICAS POR COMPONENTE
     */
    inicializarComponente(nomeComponente) {
        switch (nomeComponente) {
            case 'dashboard-header':
                this.inicializarHeader();
                break;
                
            case 'dashboard-main':
                this.inicializarMain();
                break;
                
            case 'modal':
                this.inicializarModal();
                break;
        }
    }

    /**
     * INICIALIZAR HEADER - CORRIGIDO
     * AGORA O BOTÃO VAI PARA OUTRA PÁGINA
     */
    inicializarHeader() {
        console.log('🏷️ Inicializando header...');
        
        // Botão Novo Agendamento - AGORA VAI PARA OUTRA PÁGINA
        const btnNovoAgendamento = document.getElementById('btnNovoAgendamento');
        if (btnNovoAgendamento) {
            // REMOVER event listener antigo se existir
            btnNovoAgendamento.replaceWith(btnNovoAgendamento.cloneNode(true));
            
            // Recuperar o novo botão
            const novoBtn = document.getElementById('btnNovoAgendamento');
            
            // AGORA É UM LINK PARA OUTRA PÁGINA
            if (novoBtn.tagName === 'BUTTON') {
                // Se for button, transformar em link
                const link = document.createElement('a');
                link.href = 'novo-agendamento.html';
                link.className = novoBtn.className;
                link.innerHTML = novoBtn.innerHTML;
                link.id = 'btnNovoAgendamento';
                novoBtn.parentNode.replaceChild(link, novoBtn);
            }
        }
        
        // Botão Admin - manter funcionalidade original
        const btnAdminPanel = document.getElementById('btnAdminPanel');
        if (btnAdminPanel) {
            btnAdminPanel.addEventListener('click', () => {
                if (window.DrawindApp && typeof window.DrawindApp.toggleModoAdmin === 'function') {
                    window.DrawindApp.toggleModoAdmin();
                }
            });
        }
    }

    /**
     * INICIALIZAR MAIN
     */
    inicializarMain() {
        console.log('📊 Inicializando main...');
        
        // Navegação do calendário
        const prevMonth = document.getElementById('prevMonthDashboard');
        const nextMonth = document.getElementById('nextMonthDashboard');
        
        if (prevMonth) {
            prevMonth.addEventListener('click', () => {
                if (window.DrawindApp && typeof window.DrawindApp.navegarCalendario === 'function') {
                    window.DrawindApp.navegarCalendario(-1);
                }
            });
        }
        
        if (nextMonth) {
            nextMonth.addEventListener('click', () => {
                if (window.DrawindApp && typeof window.DrawindApp.navegarCalendario === 'function') {
                    window.DrawindApp.navegarCalendario(1);
                }
            });
        }
    }

    /**
     * INICIALIZAR MODAL
     */
    inicializarModal() {
        console.log('🎯 Inicializando modal...');
        
        // Só inicializar modal se estiver na página do calendário
        const closeBtn = document.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (window.DrawindApp && typeof window.DrawindApp.fecharModalAgendamento === 'function') {
                    window.DrawindApp.fecharModalAgendamento();
                }
            });
        }
    }

    /**
     * INICIALIZAR SISTEMA
     */
    inicializarSistema() {
        console.log('🚀 Inicializando sistema Drawind...');
        
        if (window.DrawindApp && typeof window.DrawindApp.initializeDashboard === 'function') {
            window.DrawindApp.initializeDashboard();
        } else {
            console.error('❌ Sistema principal não encontrado!');
        }
    }

    /**
     * MOSTRAR ERRO DE CARREGAMENTO
     */
    mostrarErroCarregamento() {
        const erroHTML = `
            <div class="erro-carregamento">
                <div class="erro-conteudo">
                    <h3>❌ Erro ao carregar o sistema</h3>
                    <p>Não foi possível carregar alguns componentes do sistema.</p>
                    <button onclick="location.reload()" class="btn-recarregar">
                        <i class="fas fa-redo"></i>
                        Recarregar Página
                    </button>
                </div>
            </div>
        `;
        document.body.innerHTML += erroHTML;
    }
}

// =============================================
// INICIALIZAÇÃO AUTOMÁTICA - CORRIGIDA
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🌐 Página carregada - Iniciando carregador...');
    
    // Criar uma instância do carregador
    const loader = new ComponentLoader();
    
    // Iniciar o carregamento de componentes
    loader.carregarComponentes();
});

console.log('🔧 componentes-loader.js corrigido carregado!');