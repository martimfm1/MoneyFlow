# Automatização de entradas e saídas recorrentes

## Comportamento

- As recorrências novas ficam preparadas para lançamentos automáticos e são ativadas no momento da criação.
- As recorrências existentes ficam em modo de planeamento após a migration. O utilizador tem de ativar explicitamente os lançamentos automáticos em cada registo.
- Uma entrada vencida cria uma transação `income`; uma saída vencida cria uma transação `expense`.
- O saldo da conta é atualizado pelos triggers existentes de `transactions`. A função de recorrências nunca altera `accounts.balance` diretamente.
- Cada ocorrência usa uma referência determinística e uma chave única. Repetições do cron não duplicam transações.
- Pausar uma recorrência ou os lançamentos automáticos impede novos movimentos. Os movimentos já criados permanecem no histórico.
- Ao ativar uma recorrência antiga, a próxima data é avançada para a próxima data futura. Não são criados movimentos retroativos inesperados.
- O cálculo mensal, trimestral e anual preserva o dia de referência e limita datas impossíveis ao último dia do mês.

## Configuração de produção

1. Aplicar `supabase/migrations/0018_recurring_transaction_automation.sql`.
2. Gerar um segredo aleatório forte e configurar a variável server-side `MONEYFLOW_RECURRING_CRON_SECRET` no ambiente Production da Vercel. Não usar prefixo `NEXT_PUBLIC_`.
3. Guardar o mesmo valor no Supabase Vault com o nome exato `moneyflow_recurring_cron_secret`. Exemplo SQL (executar no SQL Editor com o valor real substituído localmente):
   `select vault.create_secret('<SEGREDO>', 'moneyflow_recurring_cron_secret');`
4. Fazer deploy de produção para ativar o cron definido em `vercel.json` (`03:00 UTC), que chama `/api/cron/recurring-transactions`.
5. Confirmar no primeiro ciclo que o endpoint devolve `ok: true` e que os totais de entradas/saídas e saldos correspondem às ocorrências processadas.

O endpoint exige `Authorization: Bearer <MONEYFLOW_RECURRING_CRON_SECRET>`. A função SQL compara o segredo com o valor guardado no Vault. Sem ambos configurados, a automatização em background não processa movimentos.

## Verificações antes de produção

- Testar mensalidades com dias 28, 29, 30 e 31.
- Testar recorrências trimestrais e anuais, incluindo 29 de fevereiro.
- Executar o endpoint duas vezes para a mesma data e confirmar que a segunda execução não cria movimentos duplicados.
- Testar entradas e saídas com contas e moedas correspondentes.
- Confirmar que contas arquivadas ou com moeda incompatível são ignoradas.
- Confirmar que recorrências antigas não são lançadas até o utilizador ativar explicitamente a opção.
- Confirmar que pausar e reativar não duplica a ocorrência já registada.

## Limites

A automatização depende do cron de produção e do segredo no Vault. Não é uma execução local nem depende de o utilizador manter a PWA aberta. A importação bancária continua manual por CSV; esta funcionalidade não liga bancos nem inicia pagamentos.
