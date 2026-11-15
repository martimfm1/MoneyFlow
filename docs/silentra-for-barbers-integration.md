# Integração Silentra for Barbers

## Âmbito

A integração regista apenas receitas efetivamente recebidas pela plataforma Silentra for Barbers no espaço financeiro **Silentra** do MoneyFlow.

Incluído:
- Faturas/subscrições Stripe pagas (`invoice.paid`).
- Pagamentos manuais da subscrição depois de confirmados e de existir comprovativo interno.

Excluído:
- Pagamentos de marcações ou serviços dos clientes das barbearias.
- Vendas POS das barbearias.
- Contas bancárias externas ou Open Banking.
- Pagamentos iniciados pelo MoneyFlow.

## Ligação

1. O utilizador abre **Definições → Integrações** no MoneyFlow.
2. Escolhe uma conta ativa em EUR no contexto Silentra e gera um código aleatório de utilização única.
3. O código expira em 15 minutos e só é guardado como SHA-256 no MoneyFlow.
4. A aplicação Silentra for Barbers envia o código para `POST /api/integrations/silentra-for-barbers/pair`.
5. O MoneyFlow consome o código atomicamente, cria a integração e devolve um token de sincronização. A aplicação Silentra for Barbers deve guardar esse token apenas no servidor.
6. O utilizador pode desligar a ligação em Definições; o token anterior é invalidado.

## Contratos HTTP

### Consumir código de ligação

`POST /api/integrations/silentra-for-barbers/pair`

```json
{ "pairingToken": "<código de utilização única>" }
```

Resposta de sucesso: `{ "ok": true, "syncToken": "...", "accountName": "...", "currencyCode": "EUR", "connectedAt": "..." }`.

### Registar receita confirmada

`POST /api/integrations/silentra-for-barbers/events`

Header: `Authorization: Bearer <syncToken>`.

```json
{
  "eventId": "invoice-paid:in_123",
  "amount": 9.9,
  "currency": "EUR",
  "occurredAt": "2026-11-15T12:00:00.000Z",
  "description": "Subscrição Silentra for Barbers",
  "externalReference": "in_123"
}
```

O `eventId` tem de ser estável e único na origem. A resposta indica `created` ou `duplicate`; repetir o mesmo evento não cria outro movimento nem altera o saldo novamente.

### Requisitos de implementação na plataforma

- Enviar eventos apenas depois da confirmação do pagamento.
- Usar uma outbox persistente com retries; não depender de uma chamada HTTP síncrona no webhook Stripe.
- Deduplicar por ID de invoice Stripe ou ID interno do comprovativo manual.
- Guardar o token de sincronização apenas no servidor, nunca no browser, logs ou analytics.
- Nunca enviar dados de clientes das barbearias.
- Configurar `SUPABASE_SERVICE_ROLE_KEY` apenas no ambiente server-side do MoneyFlow. Nunca usar prefixo `NEXT_PUBLIC_`.

## Operação

A integração não fica ativa até a aplicação Silentra for Barbers implementar o emissor de eventos, aplicar a sua própria migration e configurar o evento `invoice.paid` no endpoint Stripe existente. Testar com pagamentos de teste, retries, duplicados, desligar/religar e falhas temporárias antes de produção.