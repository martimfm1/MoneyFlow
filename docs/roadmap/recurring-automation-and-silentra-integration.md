# MoneyFlow — Automatização de recorrências e integração Silentra for Barbers

> **Estado:** plano de execução — 15 de novembro de 2026  
> **Objetivo:** automatizar lançamentos de entradas/saídas recorrentes e ligar as receitas confirmadas das subscrições Silentra ao espaço financeiro Silentra do MoneyFlow.

## Decisão de produto: importação bancária manual

- [x] Manter importação de movimentos externos por CSV.
- [x] Não integrar agregadores Open Banking nem fornecedores bancários.
- [x] Não pedir, receber ou armazenar credenciais bancárias.
- [x] Não iniciar pagamentos a partir do MoneyFlow.
- [x] Não inferir titularidade ou movimentos de contas de terceiros.

Não há trabalho de seleção de fornecedor bancário nem de ligação automática de contas. As importações externas continuam manuais.

## Fase 1 — Lançamentos automáticos de recorrências

**Objetivo:** transformar cada ocorrência vencida numa transação real, refletindo-a no saldo da conta associada.

- [x] Adicionar referência única por recorrência e data prevista, usando o mecanismo de deduplicação já existente em transactions.
- [x] Processar automaticamente entradas e saídas ativas e vencidas.
- [x] Criar transações income para entradas recorrentes e expense para saídas recorrentes.
- [x] Reutilizar o trigger existente de saldo: entrada soma, saída subtrai; nunca alterar accounts.balance diretamente.
- [x] Recuperar ocorrências vencidas se a aplicação esteve fechada, sem criar duplicados.
- [x] Preservar o dia/mês de referência ao avançar recorrências mensais, trimestrais e anuais (por exemplo, dia 31 e fevereiro).
- [x] Pausar uma recorrência impede futuros lançamentos; apagar/editar não apaga os movimentos já registados.
- [x] Validar que a moeda da recorrência corresponde à conta selecionada.
- [x] Processar vencimentos no acesso ao dashboard e em background através de Supabase Cron.
- [ ] Adicionar testes com datas-limite, anos bissextos, meses de 28/29/30/31 dias, atrasos, pausas e execuções repetidas.
- [ ] Validar a migração e a execução agendada no projeto Supabase de produção antes de ativar o deploy.

**Critério de saída:** cada ocorrência vencida produz no máximo uma transação; os saldos são atualizados pelo trigger existente e as datas seguintes avançam sem drift.

## Fase 2 — Ligação Silentra for Barbers → MoneyFlow

**Objetivo:** registar receitas reais da plataforma no contexto Silentra, sem misturar receitas operacionais das barbearias.

### Incluído

- [x] Emparelhamento entre apps com código aleatório de utilização única, validade de 15 minutos e conta EUR escolhida no contexto Silentra.
- [x] Guardar apenas o hash da credencial na base de dados MoneyFlow.
- [x] Guardar o segredo de envio apenas no servidor Silentra for Barbers, numa tabela acessível exclusivamente ao service role.
- [x] Registar faturas Stripe pagas através do evento invoice.paid.
- [x] Registar pagamentos manuais apenas depois da confirmação e criação do comprovativo interno de pagamento.
- [x] Usar outbox, retries, estados de entrega e IDs de evento idempotentes.
- [x] Mostrar estado, conta ligada, última sincronização, pendentes e falhas no painel administrativo.
- [x] Permitir desligar a integração e revogar a credencial.
- [x] Manter receitas em EUR; não converter moedas automaticamente.

### Excluído

- [x] Marcações e serviços pagos pelos clientes das barbearias.
- [x] Vendas POS de cada barbearia.
- [x] Movimentos de contas bancárias externas.
- [x] Pagamentos iniciados pelo MoneyFlow.

**Critério de saída:** uma subscrição efetivamente paga cria uma única entrada na conta selecionada do contexto Silentra; eventos repetidos não duplicam nem o movimento nem o saldo.

## Fase 3 — Revisão, testes e operação

- [ ] Executar lint, TypeScript, build e Prettier nos dois repositórios.
- [ ] Rever as políticas RLS e privilégios das funções RPC em ambas as bases de dados.
- [ ] Aplicar primeiro as migrations em ambiente controlado e validar cron/outbox antes de produção.
- [ ] Configurar o endpoint Stripe para enviar invoice.paid além dos eventos já usados para sincronizar subscrições.
- [ ] Confirmar que CRON_SECRET existe no deployment Silentra for Barbers para o retry diário da outbox.
- [ ] Fazer uma ligação real de teste com uma conta EUR do contexto Silentra.
- [ ] Confirmar um pagamento manual de teste e um pagamento Stripe de teste e verificar o movimento e o saldo no MoneyFlow.
- [ ] Testar desligar/religar, falha temporária de rede, repetição do mesmo evento e moeda não suportada.
- [ ] Fazer deploy coordenado: migrations MoneyFlow, app MoneyFlow, migration Barbers, app Barbers.
- [ ] Monitorizar a primeira sincronização e reconciliar os totais de receitas confirmadas.

## Segurança e integridade financeira

- As rotas de emparelhamento e eventos não expõem segredos ao browser.
- O código de emparelhamento é aleatório, expirável e de utilização única.
- A credencial de eventos não é guardada em texto claro no MoneyFlow; apenas o hash é armazenado.
- O segredo de eventos da plataforma é guardado apenas numa tabela protegida por service role no Silentra for Barbers.
- A fila de eventos evita perder pagamentos quando o MoneyFlow está indisponível temporariamente.
- IDs de invoice Stripe e de pedidos manuais são usados para deduplicação.
- Os saldos são alterados exclusivamente pelo trigger transacional existente do MoneyFlow.
- Nenhum pagamento não confirmado é enviado.
- Nenhum movimento de cliente de uma barbearia é registado como receita da Silentra.

## Configuração e dependências

| Recurso | Utilização |
|---|---|
| MoneyFlow Supabase | Migration de recorrências, pg_cron, ligações e RPC de eventos |
| Silentra for Barbers Supabase | Credencial server-side, outbox, trigger de comprovativo e RPC de claim |
| Stripe Webhook | Ativar o evento invoice.paid para o endpoint já existente |
| Vercel Silentra for Barbers | Cron diário para retries; requer o CRON_SECRET já usado pelos restantes crons |
| MONEYFLOW_API_URL | Opcional; por omissão usa https://moneyflow.silentra.me |

## Estado atual

As alterações estão organizadas em duas PRs separadas porque os repositórios e as bases de dados são independentes. As migrations ainda não foram aplicadas em produção e a integração ainda não deve ser considerada ativa até ao merge, migrations, deploy e teste de ponta a ponta.
