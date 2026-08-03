# Manual de Procedimentos Operacionais — ÓrbitaTech

*Área: Operações & Logística | Documento interno de apoio ao agente operacional (RAG)*

## 1. Fluxo de atendimento ao cliente

O atendimento é estruturado em três níveis, com SLA (tempo máximo de primeira resposta) definido por prioridade:

| Nível | Escopo | Prioridade | SLA de 1ª resposta |
|---|---|---|---|
| N1 | Dúvidas gerais, status de pedido, trocas simples | Baixa/Média | 4 horas úteis |
| N2 | Reclamações, produto com defeito, extravio | Média/Alta | 2 horas úteis |
| N3 | Casos jurídicos, fraude, reincidência, mídia/imprensa | Crítica | 1 hora útil |

Chamados sem resposta dentro do SLA são escalados automaticamente pelo sistema de tickets para o(a) supervisor(a) do turno.

## 2. Processo de gestão de pedidos

1. **Confirmação de pagamento** — o sistema financeiro valida a transação (cartão, Pix ou boleto compensado).
2. **Separação (picking)** — o centro de distribuição recebe a ordem de separação em até 2 horas após a confirmação.
3. **Conferência (checking)** — dupla checagem de item e quantidade antes da embalagem, obrigatória para pedidos acima de R$ 1.000.
4. **Expedição** — etiquetagem, geração de código de rastreio e handoff para a transportadora, em até 24h após a confirmação de pagamento (48h em datas de pico).
5. **Notificação ao cliente** — envio automático do código de rastreio por e-mail e app.

## 3. Processo de devolução interno

Quando uma devolução é aprovada pelo atendimento (ver Política de Reembolso e Devoluções):

- O produto retorna ao Centro de Distribuição e passa por **inspeção técnica** em até 3 dias úteis após o recebimento.
- Produtos aprovados na inspeção (sem sinais de mau uso) retornam ao estoque disponível ou são enviados à categoria "Recondicionados", conforme o estado.
- Produtos reprovados (mau uso comprovado) geram um chamado para a área Jurídica antes da liberação do reembolso.
- O status da inspeção é atualizado no sistema, disparando a liberação automática do reembolso ao cliente.

## 4. Gestão de estoque

- **Contagem cíclica**: 20% do estoque é contado semanalmente, cobrindo 100% dos itens a cada 5 semanas.
- **Ponto de pedido**: reposição automática é disparada quando o estoque de um SKU atinge o nível mínimo calculado com base na média de vendas dos últimos 30 dias mais 7 dias de margem de segurança.
- **Itens de giro rápido** (eletrônicos populares, acessórios) têm contagem cíclica semanal adicional às sextas-feiras.
- Divergências acima de 2% entre estoque físico e sistêmico geram investigação obrigatória pelo time de Operações.

## 5. Escalonamento de incidentes operacionais

| Tipo de incidente | Exemplo | Escalonamento |
|---|---|---|
| Operacional leve | Atraso pontual de transportadora | Supervisor(a) de turno |
| Operacional moderado | Falha em lote de produtos, erro sistêmico de estoque | Head de Operações |
| Operacional crítico | Interrupção total do centro de distribuição, falha de segurança no CD | Head de Operações + Diretoria, em até 1 hora |

Todo incidente crítico deve ser registrado no canal `#incidentes-operacao` com horário, impacto estimado e responsável pela resolução, além de um post-mortem em até 5 dias úteis após a resolução.

## 6. Horários e turnos do Centro de Distribuição

- Turno 1: 06h às 14h
- Turno 2: 14h às 22h
- Turno 3 (apenas em datas de pico — Black Friday e Natal): 22h às 06h

## 7. Contatos operacionais

Coordenação do CD: cd-operacoes@orbitatech.com.br | Escalonamento de incidentes: incidentes@orbitatech.com.br
