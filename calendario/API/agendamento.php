<?php
/**
 * API DE AGENDAMENTOS - VERSÃO 4.0 CORRIGIDA
 * Sistema completo com suporte a sincronização offline/online
 */

require_once 'config.php';

// Obter dados da requisição
$input = file_get_contents('php://input');
$dados = json_decode($input, true);
$method = $_SERVER['REQUEST_METHOD'];

// Log da requisição
logRequisicao($method, 'agendamento', 'inicio', $input);

header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = conectarBanco();
    
    switch ($method) {
        case 'GET':
            listarAgendamentos($pdo);
            break;

        case 'POST':
            criarAgendamento($pdo, $dados);
            break;

        case 'PUT':
            atualizarAgendamento($pdo, $dados);
            break;

        case 'DELETE':
            deletarAgendamento($pdo, $dados);
            break;

        default:
            http_response_code(405);
            echo json_encode([
                'sucesso' => false,
                'erro' => 'Método não permitido',
                'versao' => SISTEMA_VERSAO
            ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'sucesso' => false,
        'erro' => 'Erro interno do servidor',
        'versao' => SISTEMA_VERSAO,
        'detalhes' => $e->getMessage()
    ]);
    
    logRequisicao($method, 'agendamento', 'erro', $e->getMessage());
}

/**
 * LISTAR AGENDAMENTOS - CORRIGIDO
 */
function listarAgendamentos($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT 
                id,
                uuid,
                data,
                TIME_FORMAT(horario, '%H:%i') as horario,
                sala,
                solicitante,
                email,
                servico,
                observacoes,
                duracao,
                status,
                fonte,
                offline_id,
                data_criacao,
                data_atualizacao
            FROM agendamentos 
            ORDER BY data, horario
        ");
        
        $agendamentos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'sucesso' => true,
            'dados' => $agendamentos,
            'total' => count($agendamentos),
            'versao' => SISTEMA_VERSAO
        ]);
        
        logRequisicao('GET', 'agendamento', 'sucesso', count($agendamentos) . ' registros');
        
    } catch (Exception $e) {
        throw new Exception("Erro ao listar agendamentos: " . $e->getMessage());
    }
}

/**
 * CRIAR AGENDAMENTO - CORRIGIDO
 */
function criarAgendamento($pdo, $dados) {
    // Validar dados obrigatórios
    if (!validarDadosAgendamento($dados)) {
        return;
    }

    // Verificar se UUID já existe
    if (isset($dados['uuid']) && !empty($dados['uuid'])) {
        $stmt = $pdo->prepare("SELECT id FROM agendamentos WHERE uuid = ?");
        $stmt->execute([$dados['uuid']]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode([
                'sucesso' => false,
                'erro' => 'Agendamento já existe (UUID duplicado)',
                'versao' => SISTEMA_VERSAO
            ]);
            return;
        }
    }

    // Verificar conflito de horário
    if (!verificarHorarioDisponivel($pdo, $dados)) {
        http_response_code(409);
        echo json_encode([
            'sucesso' => false,
            'erro' => 'Conflito de horário - sala já ocupada neste período',
            'versao' => SISTEMA_VERSAO
        ]);
        return;
    }

    // Gerar UUID se não veio do frontend
    $uuid = isset($dados['uuid']) && !empty($dados['uuid']) ? $dados['uuid'] : gerarUUID();
    
    // Inserir no banco
    $stmt = $pdo->prepare("
        INSERT INTO agendamentos 
        (data, horario, sala, solicitante, email, servico, observacoes, duracao, status, uuid, fonte, offline_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $sucesso = $stmt->execute([
        $dados['data'],
        $dados['horario'] . ':00',
        $dados['sala'],
        $dados['solicitante'],
        $dados['email'],
        $dados['servico'],
        $dados['observacoes'] ?? '',
        intval($dados['duracao']),
        $dados['status'] ?? 'pendente',
        $uuid,
        $dados['fonte'] ?? 'web',
        $dados['offline_id'] ?? null
    ]);

    if ($sucesso) {
        $idInserido = $pdo->lastInsertId();
        
        // Buscar agendamento criado
        $stmt = $pdo->prepare("
            SELECT *, TIME_FORMAT(horario, '%H:%i') as horario 
            FROM agendamentos WHERE id = ?
        ");
        $stmt->execute([$idInserido]);
        $agendamento = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Agendamento criado com sucesso',
            'id' => $idInserido,
            'uuid' => $uuid,
            'agendamento' => $agendamento,
            'versao' => SISTEMA_VERSAO
        ]);
        
        logRequisicao('POST', 'agendamento', 'sucesso', "ID: $idInserido");
    } else {
        throw new Exception('Falha ao executar inserção no banco');
    }
}

/**
 * ATUALIZAR AGENDAMENTO - CORRIGIDO
 */
function atualizarAgendamento($pdo, $dados) {
    // Validar dados para atualização
    if (!isset($dados['id']) && !isset($dados['uuid'])) {
        http_response_code(400);
        echo json_encode([
            'sucesso' => false,
            'erro' => 'ID ou UUID é obrigatório para atualização',
            'versao' => SISTEMA_VERSAO
        ]);
        return;
    }

    // Buscar agendamento
    if (isset($dados['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM agendamentos WHERE id = ?");
        $stmt->execute([$dados['id']]);
        $where = "id = ?";
        $param = $dados['id'];
    } else {
        $stmt = $pdo->prepare("SELECT * FROM agendamentos WHERE uuid = ?");
        $stmt->execute([$dados['uuid']]);
        $where = "uuid = ?";
        $param = $dados['uuid'];
    }
    
    $agendamentoExistente = $stmt->fetch();
    
    if (!$agendamentoExistente) {
        http_response_code(404);
        echo json_encode([
            'sucesso' => false,
            'erro' => 'Agendamento não encontrado',
            'versao' => SISTEMA_VERSAO
        ]);
        return;
    }

    // Preparar campos para atualização
    $campos = [];
    $valores = [];
    
    $camposPermitidos = [
        'data', 'horario', 'sala', 'solicitante', 'email', 
        'servico', 'observacoes', 'duracao', 'status', 'fonte'
    ];
    
    foreach ($camposPermitidos as $campo) {
        if (isset($dados[$campo])) {
            $campos[] = "$campo = ?";
            if ($campo === 'horario') {
                $valores[] = $dados[$campo] . ':00';
            } else if ($campo === 'duracao') {
                $valores[] = intval($dados[$campo]);
            } else {
                $valores[] = $dados[$campo];
            }
        }
    }
    
    if (empty($campos)) {
        http_response_code(400);
        echo json_encode([
            'sucesso' => false,
            'erro' => 'Nenhum campo válido para atualização',
            'versao' => SISTEMA_VERSAO
        ]);
        return;
    }
    
    $valores[] = $param;
    $sql = "UPDATE agendamentos SET " . implode(', ', $campos) . ", data_atualizacao = NOW() WHERE $where";
    
    $stmt = $pdo->prepare($sql);
    $sucesso = $stmt->execute($valores);
    
    if ($sucesso) {
        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Agendamento atualizado com sucesso',
            'versao' => SISTEMA_VERSAO
        ]);
        logRequisicao('PUT', 'agendamento', 'sucesso', "WHERE: $where");
    } else {
        throw new Exception('Falha ao executar atualização no banco');
    }
}

/**
 * DELETAR AGENDAMENTO - CORRIGIDO
 */
function deletarAgendamento($pdo, $dados) {
    if (!isset($dados['id']) && !isset($dados['uuid'])) {
        http_response_code(400);
        echo json_encode([
            'sucesso' => false,
            'erro' => 'ID ou UUID é obrigatório para exclusão',
            'versao' => SISTEMA_VERSAO
        ]);
        return;
    }
    
    // Buscar para verificar existência
    if (isset($dados['id'])) {
        $stmt = $pdo->prepare("SELECT id FROM agendamentos WHERE id = ?");
        $stmt->execute([$dados['id']]);
        $where = "id = ?";
        $param = $dados['id'];
    } else {
        $stmt = $pdo->prepare("SELECT id FROM agendamentos WHERE uuid = ?");
        $stmt->execute([$dados['uuid']]);
        $where = "uuid = ?";
        $param = $dados['uuid'];
    }
    
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode([
            'sucesso' => false,
            'erro' => 'Agendamento não encontrado',
            'versao' => SISTEMA_VERSAO
        ]);
        return;
    }
    
    // Deletar agendamento
    $stmt = $pdo->prepare("DELETE FROM agendamentos WHERE $where");
    $sucesso = $stmt->execute([$param]);
    
    if ($sucesso) {
        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Agendamento deletado com sucesso',
            'versao' => SISTEMA_VERSAO
        ]);
        logRequisicao('DELETE', 'agendamento', 'sucesso', "WHERE: $where");
    } else {
        throw new Exception('Falha ao executar exclusão no banco');
    }
}

/**
 * FUNÇÕES AUXILIARES - CORRIGIDAS
 */
function validarDadosAgendamento($dados) {
    $camposObrigatorios = ['data', 'horario', 'sala', 'solicitante', 'email', 'servico', 'duracao'];
    
    foreach ($camposObrigatorios as $campo) {
        if (!isset($dados[$campo]) || empty(trim($dados[$campo]))) {
            http_response_code(400);
            echo json_encode([
                'sucesso' => false,
                'erro' => "Campo obrigatório faltando: $campo",
                'versao' => SISTEMA_VERSAO
            ]);
            return false;
        }
    }
    
    // Validar email
    if (!filter_var($dados['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode([
            'sucesso' => false,
            'erro' => 'Email inválido',
            'versao' => SISTEMA_VERSAO
        ]);
        return false;
    }
    
    // Validar data (não pode ser no passado)
    $hoje = date('Y-m-d');
    if ($dados['data'] < $hoje) {
        http_response_code(400);
        echo json_encode([
            'sucesso' => false,
            'erro' => 'Não é possível agendar para datas passadas',
            'versao' => SISTEMA_VERSAO
        ]);
        return false;
    }
    
    // Validar duração
    if (!is_numeric($dados['duracao']) || $dados['duracao'] <= 0) {
        http_response_code(400);
        echo json_encode([
            'sucesso' => false,
            'erro' => 'Duração inválida',
            'versao' => SISTEMA_VERSAO
        ]);
        return false;
    }
    
    return true;
}

function verificarHorarioDisponivel($pdo, $dados) {
    $sql = "
        SELECT id FROM agendamentos 
        WHERE data = ? 
        AND sala = ? 
        AND status != 'cancelado'
        AND id != ?
        AND (
            (horario <= ? AND ADDTIME(horario, SEC_TO_TIME(duracao * 60)) > ?) OR
            (horario < ADDTIME(?, SEC_TO_TIME(? * 60)) AND ADDTIME(horario, SEC_TO_TIME(duracao * 60)) >= ADDTIME(?, SEC_TO_TIME(? * 60)))
        )
        LIMIT 1
    ";
    
    $id = isset($dados['id']) ? $dados['id'] : 0;
    $horarioComSegundos = $dados['horario'] . ':00';
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $dados['data'], 
        $dados['sala'],
        $id,
        $horarioComSegundos, $horarioComSegundos,
        $horarioComSegundos, $dados['duracao'], $horarioComSegundos, $dados['duracao']
    ]);
    
    return $stmt->fetch() === false;
}

function gerarUUID() {
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}
?>