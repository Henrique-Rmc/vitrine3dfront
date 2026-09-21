Resumo das Novas Rotas — Backend PDV
Contexto Geral
Duas features foram adicionadas ao módulo PDV. Todas as rotas exigem autenticação de loja com plano Pro ou superior. O token JWT da loja deve ser enviado em todas as requisições.

1. Sistema de Gastos Operacionais
   Base: GET|POST|PATCH /api/pdv/expenses/...

O objetivo é permitir que a loja registre e acompanhe seus custos operacionais: compras de insumos (material de limpeza, embalagens, etc.) e contas fixas recorrentes (aluguel, luz, água).

1.1 Catálogo de Produtos de Gasto
O catálogo é um registro leve de insumos/produtos de custo da loja. Ao registrar uma compra, o produto é buscado por nome — se não existir, é criado automaticamente.

O catalogo de Produtos de Gasto deve ter um design semelhante ao do criaçao de Venda. Os produtos sao Seleconados da mesma formaa, caso nao exista deve ser criado Expense Product para que entao seja montada a Expense Batch Items , e Expense Batch

GET /api/pdv/expenses/products
Lista todos os produtos do catálogo da loja.

Query params opcionais:

q — filtra por nome (busca parcial, case-insensitive). Se omitido, retorna todos.
Response (array):

[
  {
    "id": 1,
    "name": "Luvas descartáveis",
    "unit": "caixa",
    "stockQuantity": 3,
    "lowStock": false
  }
]
lowStock: true quando stockQuantity <= 1 — use para exibir alerta visual no dashboard.

POST /api/pdv/expenses/products
Cria um produto no catálogo. Se já existir um com o mesmo nome (case-insensitive), retorna o existente sem duplicar.

Body:

{ "name": "Luvas descartáveis", "unit": "caixa" }
PATCH /api/pdv/expenses/products/{id}/stock
Ajusta o estoque manualmente (entrada ou consumo).

Body:

{ "quantityDelta": -1 }
quantityDelta positivo = entrada de estoque; negativo = consumo/retirada. O estoque nunca fica negativo.

GET /api/pdv/expenses/products/low-stock
Retorna apenas os produtos com stockQuantity <= 1. Use para o painel de alertas de reposição.

1.2 Batches de Compra (Gastos Unitários)
Um "batch" é uma compra de insumos, análogo a um cupom fiscal. O frontend monta a lista de itens localmente e envia tudo de uma vez. Suporta modo offline: o offlineId gerado no dispositivo garante idempotência no sync.

Ao criar um batch, automaticamente:

O estoque de cada produto é incrementado
Uma saída (OUT / EXPENSE) é criada no fluxo de caixa com o valor total
POST /api/pdv/expenses/batches
Registra uma compra de insumos.

Body:

{
  "offlineId": "uuid-gerado-no-dispositivo",
  "batchDate": "2026-09-11T14:00:00Z",
  "operatorId": "uuid-opcional",
  "note": "Compra mensal de materiais",
  "items": [
    {
      "productName": "Luvas descartáveis",
      "unit": "caixa",
      "unitPrice": 25.00,
      "quantity": 2
    },
    {
      "productName": "Detergente",
      "unit": "litro",
      "unitPrice": 4.50,
      "quantity": 3
    }
  ]
}
Response: batch completo com id, totalAmount, e todos os itens expandidos.

Atenção: reenviar o mesmo offlineId retorna erro 422 DUPLICATE_EXPENSE_BATCH.

GET /api/pdv/expenses/batches
Lista os batches paginados, do mais recente ao mais antigo.

Query params:

from / to — filtro de data (formato YYYY-MM-DD). Se omitidos, retorna tudo.
page (default 0), size (default 20)
GET /api/pdv/expenses/batches/{id}
Retorna um batch específico com todos os seus itens.

GET /api/pdv/expenses/batches/summary
Retorna o total gasto no período.

Query params: from / to (opcionais)

Response:

{ "totalSpent": 81.50 }
1.3 Gastos Recorrentes (Contas Fixas)
Contas com vencimento periódico: aluguel, energia, internet. O sistema guarda a frequência e calcula automaticamente a próxima data de vencimento ao marcar como pago.

Ao marcar como paga:

lastPaidDate é atualizado para hoje
nextDueDate avança conforme a frequência (MONTHLY, QUARTERLY, SEMIANNUAL, ANNUAL)
Uma saída (OUT / EXPENSE) é criada no fluxo de caixa
GET /api/pdv/expenses/recurring
Lista todas as contas recorrentes ativas da loja.

Response (item):

{
  "id": "uuid",
  "name": "Conta de luz",
  "amount": 350.00,
  "frequency": "MONTHLY",
  "dueDay": 10,
  "alertDaysBefore": 5,
  "nextDueDate": "2026-10-10",
  "lastPaidDate": "2026-09-11",
  "daysUntilDue": 29
}
daysUntilDue é calculado dinamicamente (pode ser negativo se vencida).

POST /api/pdv/expenses/recurring
Cria uma conta recorrente.

Body:

{
  "name": "Conta de luz",
  "description": "Opcional",
  "amount": 350.00,
  "frequency": "MONTHLY",
  "dueDay": 10,
  "alertDaysBefore": 5,
  "nextDueDate": "2026-10-10"
}
frequency aceita: MONTHLY, QUARTERLY, SEMIANNUAL, ANNUAL.

PUT /api/pdv/expenses/recurring/{id}
Atualiza os dados de uma recorrente (mesmo body do POST).

DELETE /api/pdv/expenses/recurring/{id}
Desativa a recorrente (soft delete — não apaga do banco).

POST /api/pdv/expenses/recurring/{id}/pay
Marca a conta como paga. Avança nextDueDate e cria o lançamento no caixa.
Sem body. Retorna a recorrente atualizada.

GET /api/pdv/expenses/recurring/alerts
Retorna as recorrentes cujo vencimento está dentro da janela de alerta configurada (alertDaysBefore). Use para o banner/notificação de "contas a vencer" no dashboard.

1.4 Sync Offline — Extensão
O endpoint de sync já existente foi estendido para incluir batches de gasto:

POST /api/pdv/sync
Body (adicionado):

{
  "sales": [...],
  "cashFlows": [...],
  "expenseBatches": [
    {
      "offlineId": "...",
      "batchDate": "...",
      "items": [...]
    }
  ]
}
Response (adicionado):

{
  "expenseBatchesProcessed": 2,
  "expenseBatchesSkipped": 1
}
