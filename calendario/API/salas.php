<?php
/**
 * API DE SALAS - VERSÃO 4.0
 * Retorna informações sobre as salas disponíveis
 */

require_once 'config.php';

$pdo = conectarBanco();

// SEMPRE RETORNA AS SALAS CADASTRADAS V4
$stmt = $pdo->query("
    SELECT 
        id,
        nome,
        capacidade,
        equipamentos,
        status,
        data_criacao
    FROM salas 
    WHERE status = 'disponivel'
    ORDER BY nome
");

$salas = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Formatar resposta V4
$salasFormatadas = array_map(function($sala) {
    return [
        'id' => $sala['id'],
        'nome' => $sala['nome'],
        'capacidade' => (int)$sala['capacidade'],
        'equipamentos' => $sala['equipamentos'],
        'status' => $sala['status'],
        'dataCriacao' => $sala['data_criacao']
    ];
}, $salas);

echo json_encode([
    'salas' => $salasFormatadas,
    'total' => count($salasFormatadas),
    'versao' => SISTEMA_VERSAO,
    'timestamp' => date('Y-m-d H:i:s')
]);

logRequisicao('GET', 'salas', 'sucesso');
?>