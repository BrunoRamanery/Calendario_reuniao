/**
 * SISTEMA DE AUTENTICAÇÃO ADMIN - SIMPLES E FUNCIONAL
 * @author Bruno Eduardo
 * @version 1.0 - AUTH SYSTEM
 */

class AdminAuth {
    constructor() {
        this.adminSenha = 'admin123'; // Senha padrão - pode mudar depois
        this.isAuthenticated = false;
        this.inicializar();
    }

    inicializar() {
        console.log('🔐 Sistema de autenticação inicializado');
        
        // Verificar se já está autenticado
        this.verificarSessao();
        
        // Configurar eventos
        this.configurarEventos();
    }

    /**
     * VERIFICAR SE JÁ ESTÁ AUTENTICADO
     */
    verificarSessao() {
        const sessao = localStorage.getItem('admin_authenticated');
        const timestamp = localStorage.getItem('admin_session_timestamp');
        
        if (sessao === 'true' && timestamp) {
            // Verificar se a sessão expirou (8 horas)
            const agora = new Date().getTime();
            const tempoSessao = agora - parseInt(timestamp);
            const oitoHoras = 8 * 60 * 60 * 1000;
            
            if (tempoSessao < oitoHoras) {
                this.isAuthenticated = true;
                console.log('✅ Sessão admin ativa');
            } else {
                // Sessão expirada
                this.logout();
            }
        }
    }

    /**
     * CONFIGURAR EVENTOS
     */
    configurarEventos() {
        // Se estiver na página admin, verificar autenticação
        if (window.location.pathname.includes('admin.html')) {
            this.verificarAcessoAdmin();
        }
        
        // Se estiver na página principal, configurar botão admin
        if (window.location.pathname.includes('calendario.html') || 
            window.location.pathname === '/' || 
            window.location.pathname.includes('index.html')) {
            this.configurarBotaoAdmin();
        }
    }

    /**
     * CONFIGURAR BOTÃO ADMIN NA PÁGINA PRINCIPAL
     */
    configurarBotaoAdmin() {
        const btnAdmin = document.getElementById('btnAdminPanel');
        
        if (btnAdmin) {
            // Remover event listener anterior se existir
            btnAdmin.replaceWith(btnAdmin.cloneNode(true));
            
            const novoBtn = document.getElementById('btnAdminPanel');
            
            novoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.verificarAcessoAntesDeRedirecionar();
            });
            
            console.log('✅ Botão admin configurado');
        }
    }

    /**
     * VERIFICAR ACESSO ANTES DE REDIRECIONAR PARA ADMIN
     */
    verificarAcessoAntesDeRedirecionar() {
        if (this.isAuthenticated) {
            // Já autenticado, redirecionar direto
            window.location.href = 'admin.html';
        } else {
            // Precisa autenticar
            this.mostrarModalLogin();
        }
    }

    /**
     * MOSTRAR MODAL DE LOGIN
     */
    mostrarModalLogin() {
        // Criar modal de login
        const modalHTML = `
            <div id="modalLoginAdmin" class="modal" style="display: block;">
                <div class="modal-content modal-sm">
                    <div class="modal-header">
                        <h3><i class="fas fa-user-shield"></i> Acesso Administrativo</h3>
                        <span class="close-btn" onclick="adminAuth.fecharModalLogin()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="login-form">
                            <div class="form-group">
                                <label for="adminSenha">Senha de Administrador:</label>
                                <input type="password" id="adminSenha" placeholder="Digite a senha" autocomplete="off">
                                <small class="help-text">Senha padrão: admin123</small>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="adminAuth.fecharModalLogin()">
                            <i class="fas fa-times"></i>
                            Cancelar
                        </button>
                        <button class="btn btn-primary" onclick="adminAuth.fazerLogin()">
                            <i class="fas fa-sign-in-alt"></i>
                            Entrar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar modal ao body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Focar no campo de senha
        setTimeout(() => {
            const inputSenha = document.getElementById('adminSenha');
            if (inputSenha) inputSenha.focus();
        }, 100);
        
        // Permitir Enter para login
        document.getElementById('adminSenha').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.fazerLogin();
            }
        });
    }

    /**
     * FECHAR MODAL DE LOGIN
     */
    fecharModalLogin() {
        const modal = document.getElementById('modalLoginAdmin');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * FAZER LOGIN
     */
    fazerLogin() {
        const senhaInput = document.getElementById('adminSenha');
        const senha = senhaInput.value.trim();
        
        if (!senha) {
            this.mostrarNotificacao('❌ Digite a senha de administrador', 'erro');
            senhaInput.focus();
            return;
        }
        
        if (senha === this.adminSenha) {
            // Login bem-sucedido
            this.isAuthenticated = true;
            
            // Salvar sessão
            localStorage.setItem('admin_authenticated', 'true');
            localStorage.setItem('admin_session_timestamp', new Date().getTime().toString());
            
            this.mostrarNotificacao('✅ Acesso administrativo concedido!', 'sucesso');
            this.fecharModalLogin();
            
            // Redirecionar para admin
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1000);
            
        } else {
            this.mostrarNotificacao('❌ Senha incorreta', 'erro');
            senhaInput.value = '';
            senhaInput.focus();
        }
    }

    /**
     * VERIFICAR ACESSO NA PÁGINA ADMIN
     */
    verificarAcessoAdmin() {
        if (!this.isAuthenticated) {
            console.log('🚫 Acesso não autorizado à página admin');
            
            // Mostrar tela de login
            this.mostrarTelaLoginAdmin();
        } else {
            console.log('✅ Acesso autorizado à página admin');
        }
    }

    /**
     * MOSTRAR TELA DE LOGIN NO ADMIN
     */
    mostrarTelaLoginAdmin() {
        // Substituir todo o conteúdo da página por tela de login
        document.body.innerHTML = `
            <div class="login-admin-page">
                <div class="login-container">
                    <div class="login-card">
                        <div class="login-header">
                            <i class="fas fa-user-shield"></i>
                            <h1>Acesso Administrativo</h1>
                            <p>Sistema de Agendamento</p>
                        </div>
                        
                        <div class="login-body">
                            <div class="form-group">
                                <label for="adminSenhaPage">Senha de Administrador:</label>
                                <input type="password" id="adminSenhaPage" placeholder="Digite a senha" autocomplete="off">
                                <small class="help-text">Entre com a senha de administrador para continuar</small>
                            </div>
                            
                            <button class="btn btn-primary btn-block" onclick="adminAuth.fazerLoginPage()">
                                <i class="fas fa-sign-in-alt"></i>
                                Entrar no Painel
                            </button>
                            
                            <div class="login-actions">
                                <a href="calendario.html" class="btn-link">
                                    <i class="fas fa-arrow-left"></i>
                                    Voltar ao Sistema
                                </a>
                            </div>
                        </div>
                        
                        <div class="login-footer">
                            <p><small>Sistema de Agendamento Comercial</small></p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Focar no campo de senha
        setTimeout(() => {
            const inputSenha = document.getElementById('adminSenhaPage');
            if (inputSenha) inputSenha.focus();
        }, 100);
        
        // Permitir Enter para login
        document.getElementById('adminSenhaPage').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.fazerLoginPage();
            }
        });
    }

    /**
     * FAZER LOGIN NA PÁGINA ADMIN
     */
    fazerLoginPage() {
        const senhaInput = document.getElementById('adminSenhaPage');
        const senha = senhaInput.value.trim();
        
        if (!senha) {
            this.mostrarNotificacaoPage('❌ Digite a senha de administrador', 'erro');
            senhaInput.focus();
            return;
        }
        
        if (senha === this.adminSenha) {
            // Login bem-sucedido
            this.isAuthenticated = true;
            
            // Salvar sessão
            localStorage.setItem('admin_authenticated', 'true');
            localStorage.setItem('admin_session_timestamp', new Date().getTime().toString());
            
            this.mostrarNotificacaoPage('✅ Acesso concedido! Carregando painel...', 'sucesso');
            
            // Recarregar a página para carregar o admin normal
            setTimeout(() => {
                window.location.reload();
            }, 1500);
            
        } else {
            this.mostrarNotificacaoPage('❌ Senha incorreta', 'erro');
            senhaInput.value = '';
            senhaInput.focus();
        }
    }

    /**
     * LOGOUT
     */
    logout() {
        this.isAuthenticated = false;
        localStorage.removeItem('admin_authenticated');
        localStorage.removeItem('admin_session_timestamp');
        
        console.log('🚪 Logout realizado');
        
        // Se estiver na página admin, redirecionar
        if (window.location.pathname.includes('admin.html')) {
            window.location.href = 'calendario.html';
        }
    }

    /**
     * MÉTODOS DE NOTIFICAÇÃO
     */
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
        }, 4000);
    }

    mostrarNotificacaoPage(mensagem, tipo) {
        // Criar notificação simples para a página de login
        const notificacao = document.createElement('div');
        notificacao.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${tipo === 'erro' ? '#f8d7da' : '#d4edda'};
            color: ${tipo === 'erro' ? '#721c24' : '#155724'};
            padding: 12px 20px;
            border-radius: 6px;
            border: 1px solid ${tipo === 'erro' ? '#f5c6cb' : '#c3e6cb'};
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;
        notificacao.textContent = mensagem;
        document.body.appendChild(notificacao);
        
        setTimeout(() => {
            notificacao.remove();
        }, 4000);
    }
}

// 🚀 CRIAR INSTÂNCIA GLOBAL
const adminAuth = new AdminAuth();
window.AdminAuth = adminAuth;

console.log('🔐 Sistema de autenticação admin carregado!');