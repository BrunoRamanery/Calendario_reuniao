<?php
/**
 * CONFIGURAÇÃO DO SISTEMA - VERSÃO 4.0 CORRIGIDA
 * Sistema Híbrido de Agendamento Drawind
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Configurações do banco de dados
define('DB_HOST', 'localhost');
define('DB_NAME', 'drawind_agendamentos'); 
define('DB_USER', 'root');
define('DB_PASS', '');
define('SISTEMA_VERSAO', '4.0-hybrid-fixed');

// Handler para requisições OPTIONS (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Função para conectar ao banco
function conectarBanco() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'sucesso' => false,
            'erro' => 'Erro de conexão com o banco', 
            'versao' => SISTEMA_VERSAO,
            'detalhes' => $e->getMessage()
        ]);
        exit;
    }
}

// Log de requisições
function logRequisicao($metodo, $endpoint, $status = 'sucesso', $detalhes = '') {
    try {
        $pdo = conectarBanco();
        $stmt = $pdo->prepare("INSERT INTO logs_sistema (metodo, endpoint, status, detalhes) VALUES (?, ?, ?, ?)");
        $stmt->execute([$metodo, $endpoint, $status, $detalhes]);
    } catch (Exception $e) {
        // Falha silenciosa no log
    }
}
?>