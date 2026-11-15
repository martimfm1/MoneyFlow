# MoneyFlow — Roadmap de APIs, Open Banking e evolução da plataforma

> **Estado:** plano de execução — novembro de 2026  
> **Objetivo:** centralizar as fases, tarefas, decisões, dependências e critérios de conclusão para as próximas integrações do MoneyFlow.  
> **Âmbito:** integrações bancárias e de dados financeiros, API interna, automação, qualidade e evolução da plataforma. Este documento não ativa ligações bancárias nem altera dados de utilizadores.

---

## 1. Ponto de situação

Antes de iniciar novas integrações, esta é a linha de base confirmada no repositório.

### Já implementado

- [x] Espaços financeiros **Pessoal** e **Silentra**, com dados isolados.
- [x] Vista **Geral** agregada e de leitura, mantendo os totais separados por moeda.
- [x] Contas, movimentos, categorias, orçamentos, objetivos, contribuições e wishlist por espaço financeiro.
- [x] Entradas recorrentes e saídas recorrentes, com separadores próprios, nome livre, valor, conta, periodicidade, próxima data, edição e pausa.
- [x] Projeções mensais/anuais para compromissos recorrentes. Uma recorrência é planeamento: não cria, por si só, uma transação nem altera o saldo da conta.
- [x] Importação CSV para movimentos, incluindo ficheiros do tipo Revolut, com validação de conta, contexto e moeda, limite de tamanho/linhas, datas e valores PT/ISO, deduplicação e tratamento de movimentos pendentes.
- [x] A importação CSV não guarda o ficheiro original nem credenciais bancárias.
- [x] PWA instalável, manifest, service worker, fallback offline e sessões Supabase persistentes entre utilizações.
- [x] RLS, validação server-side e isolamento por `user_id` + `context_id`.
- [x] Dashboard e análise financeira, com a regra de não somar moedas diferentes sem uma conversão explícita.

### Ainda não implementado

- [ ] Ligação bancária automática por OAuth/Open Banking.
- [ ] Integração com um agregador bancário (AISP) ou com APIs de bancos.
- [ ] Gestão de consentimentos, tokens, ligações e revogação de acesso bancário.
- [ ] Sincronização incremental, agendada e idempotente de movimentos.
- [ ] Webhooks de provedores bancários e processamento em background.
- [ ] Reconciliação entre movimentos importados e movimentos já introduzidos manualmente.
- [ ] API pública para terceiros/desenvolvedores. A rota atual `/api/client-log` é apenas logging do cliente, não uma API financeira pública.
- [ ] Testes automatizados end-to-end e uma bateria de testes de integração bancária em sandbox.
- [ ] Criação e sincronização offline de movimentos. A PWA atual fornece fallback offline, mas não faz escrita financeira offline.

> O objetivo das próximas fases é avançar sobre a base já existente. Não se deve reimplementar recorrências, PWA, contextos financeiros ou importação CSV como se ainda não existissem.

---

## 2. Decisão crítica: Revolut e contas Kids & Teens / <18

### Revolut Open Banking

A documentação oficial da Revolut indica que o acesso de produção à Open Banking API é destinado a **Third-Party Providers (TPPs) regulados**, como AISP/PISP, e exige certificados eIDAS ou OBIE válidos. Por isso, o MoneyFlow não deve assumir que pode obter acesso direto à API apenas por criar uma aplicação no Developer Portal.

**Consequência:** não avançar com uma integração direta em produção sem confirmar a elegibilidade regulatória, certificados, âmbito territorial, termos e modelo de responsabilidade. A primeira opção a avaliar é um fornecedor de Open Banking que já tenha cobertura e autorização adequadas para Portugal; a escolha só acontece depois da avaliação técnica, legal e comercial.

### Revolut Kids & Teens

A documentação de suporte da Revolut consultada explica que o extrato Kids & Teens é obtido a partir da aplicação Revolut do pai/mãe ou tutor e que, naquele modelo, o extrato fica em nome do responsável legal e o IBAN apresentado pode corresponder à conta principal do responsável, não a um IBAN individual da criança. A documentação consultada é a página de suporte do Reino Unido; os detalhes e termos aplicáveis à conta portuguesa têm de ser confirmados com a Revolut antes de desenhar qualquer fluxo que dependa da titularidade ou do IBAN.

**Consequências para o MoneyFlow:**

- [ ] Confirmar com a Revolut Portugal como são emitidos os extratos Kids & Teens para a região/conta concreta.
- [ ] Confirmar quem é o titular legal, que identificadores aparecem no extrato e se existe exportação de movimentos apropriada.
- [ ] Não usar o IBAN do responsável para inferir que a conta pertence ao menor.
- [ ] Não pedir nem armazenar credenciais da aplicação Revolut, PINs, códigos de autenticação ou palavras-passe.
- [ ] Manter a importação CSV manual disponível como alternativa segura.
- [ ] Mostrar uma explicação clara sobre a origem e a titularidade dos dados importados, sem prometer sincronização automática Kids & Teens antes de ser tecnicamente e legalmente confirmada.

### Fontes de referência

- [Revolut — Who can access the Open Banking API](https://developer.revolut.com/docs/guides/build-banking-apps/introduction-to-the-open-banking-api/who-can-access-the-api)
- [Revolut — Open Banking API reference](https://developer.revolut.com/docs/api/open-banking)
- [Revolut — Global customer access controls and certificates](https://developer.revolut.com/docs/guides/build-banking-apps/introduction-to-the-open-banking-api/global-customer-access-controls)
- [Revolut Help — Kids & Teens statements](https://help.revolut.com/help/profile-and-plan/revolut-junior/revolut-18-statements/)
- [Banco de Portugal — Interfaces de comunicação PSD2](https://www.bportugal.pt/)

---

## 3. Arquitetura alvo

A implementação deve suportar vários provedores sem espalhar lógica específica de um banco pelas páginas e server actions.

### Fluxo de dados proposto

```text
Utilizador
   |
   v
MoneyFlow UI (Next.js)
   |
   | sessão autenticada / pedido explícito de ligação
   v
Route Handlers / camada de integração (server-only)
   |
   +---- OAuth / consentimento do fornecedor
   |
   +---- API do fornecedor / agregador
   |
   +---- Webhooks verificados
   |
   v
Normalização + deduplicação + reconciliação
   |
   v
Supabase / PostgreSQL
   |
   +---- financial_contexts
   +---- accounts
   +---- transactions
   +---- metadados de ligação e sincronização
   |
   v
Dashboard / relatórios / notificações
```

### Regras de arquitetura

- [ ] Definir um contrato comum de provedor (por exemplo: descobrir contas, ler saldos, ler movimentos, renovar consentimento, revogar ligação e verificar estado).
- [ ] Manter adaptadores específicos por provedor atrás desse contrato.
- [ ] Manter toda a comunicação bancária e credenciais no servidor. O browser nunca chama o banco com credenciais privadas.
- [ ] Usar OAuth Authorization Code + PKCE quando suportado, estado assinado/aleatório de utilização única, validação rigorosa do callback e scopes mínimos.
- [ ] Separar autenticação do utilizador, consentimento bancário e autorização interna do MoneyFlow.
- [ ] Resolver sempre o utilizador a partir da sessão autenticada; nunca confiar em `user_id` enviado pelo cliente.
- [ ] Ligar cada conexão e conta externa a um `financial_context` e a uma conta MoneyFlow escolhida pelo utilizador.
- [ ] Preservar a separação Pessoal/Silentra; uma conexão nunca pode importar para um contexto diferente do que foi autorizado.
- [ ] Reutilizar os campos de origem/referência de importação existentes quando adequados; desenhar uma extensão incremental para origens bancárias e IDs externos estáveis.
- [ ] Guardar apenas os dados necessários para sincronizar, deduplicar e explicar a origem do movimento. Evitar guardar payloads bancários brutos sem necessidade.
- [ ] Garantir idempotência em todas as importações, webhooks, retries e execuções agendadas.
- [ ] Registar auditoria suficiente para saber quem ligou, sincronizou, desligou ou revogou uma conta, sem registar tokens ou dados bancários sensíveis em logs.

### Modelo de dados a desenhar na Fase 1

O modelo final deve ser validado com o provedor selecionado. Como ponto de partida:

- `financial_connections`: utilizador, contexto, provedor, estado, scopes, datas de consentimento/expiração, última sincronização e referência segura ao segredo.
- `financial_connection_accounts`: contas externas descobertas e respetiva associação a uma conta MoneyFlow.
- `financial_sync_runs`: início/fim, estado, contagens, cursor e erro sanitizado de cada sincronização.
- `financial_connection_events`: IDs de eventos de webhook, estado de processamento e chave de idempotência.
- Movimentos normalizados: referência externa estável, origem, conta, moeda, montante, data/hora, descrição normalizada e estado de reconciliação.

Não implementar este esquema por antecipação: fechar primeiro o contrato do provedor e os requisitos de retenção; depois criar migrations incrementais com RLS, chaves estrangeiras compostas e índices de deduplicação.

---

## 4. Fases de implementação

As fases devem ser entregues por marcos pequenos e verificáveis. As fases 0 e 1 bloqueiam as integrações reais; as seguintes podem avançar em paralelo quando as respetivas dependências estiverem fechadas.

### Fase 0 — Descoberta, elegibilidade e escolha do fornecedor

**Objetivo:** escolher uma via realista para Portugal e perceber se a conta Kids & Teens pode ser suportada.

- [x] Inventariar o que já existe no MoneyFlow e evitar duplicar funcionalidades.
- [x] Confirmar que a importação CSV e recorrências já estão implementadas.
- [x] Confirmar que a Revolut Open Banking API não é uma API pública de uso livre para qualquer aplicação.
- [ ] Documentar requisitos legais e regulatórios para o MoneyFlow atuar como AISP, caso se avalie acesso direto.
- [ ] Pedir confirmação escrita à Revolut sobre disponibilidade e limitações de contas Kids & Teens em Portugal.
- [ ] Avaliar provedores/agregadores que suportem Portugal, com pelo menos duas alternativas.
- [ ] Comparar cobertura de bancos, elegibilidade para menores/Kids & Teens, histórico disponível, atualização, consentimento, webhooks, sandbox, SLA, preços, limites, residência/localização dos dados e contrato/DPA.
- [ ] Decidir entre agregador, acesso direto regulado, CSV melhorado ou combinação destas opções.
- [ ] Definir a primeira instituição e o primeiro caso de uso de produção.
- [ ] Definir explicitamente que a primeira versão só lê saldos e movimentos; não inicia pagamentos.

**Critério de saída:** fornecedor e âmbito escolhidos, custos e requisitos documentados, cobertura de Portugal confirmada e decisão explícita sobre Kids & Teens. Se a conta Kids & Teens não for suportada, a importação CSV continua a ser o caminho oficial para essa conta.

### Fase 1 — Fundação de integrações, segurança e gestão de ligações

**Objetivo:** criar uma camada reutilizável, sem ainda sincronizar dinheiro real.

- [ ] Criar o contrato TypeScript de provedor e o registo de adaptadores.
- [ ] Definir estados de ligação: pendente, ligada, consentimento a expirar, expirada, erro, desligada e revogada.
- [ ] Desenhar e rever o modelo de dados da secção anterior.
- [ ] Criar migrations novas, incrementais, com RLS em todas as tabelas expostas e políticas por utilizador/contexto.
- [ ] Definir armazenamento cifrado para access/refresh tokens e respetivas chaves; a base de dados guarda apenas ciphertext ou uma referência segura.
- [ ] Guardar segredos de aplicação apenas em variáveis de ambiente/secret manager server-side; nunca em `NEXT_PUBLIC_*`.
- [ ] Implementar ações de ligar, listar estado, renovar consentimento, desligar e eliminar conexão.
- [ ] Implementar validação de propriedade e de contexto em todas as mutações.
- [ ] Definir rate limiting, timeouts, limites de payload e respostas de erro sem dados sensíveis.
- [ ] Definir retenção, exportação e eliminação dos dados e tokens quando o utilizador desliga ou apaga a conta.
- [ ] Adicionar testes unitários aos contratos e testes RLS para isolamento entre utilizadores e contextos.

**Critério de saída:** é possível criar e remover ligações de teste; nenhum token aparece no browser, logs, analytics ou base de dados em texto simples; testes demonstram isolamento Pessoal/Silentra.

### Fase 2 — Importação CSV robusta e experiência de reconciliação manual

**Objetivo:** melhorar a alternativa manual antes de depender de um fornecedor bancário.

- [ ] Criar fluxo de pré-visualização antes de gravar: total de linhas, válidas, pendentes, duplicadas, moeda incompatível e rejeitadas.
- [ ] Mostrar exemplos das primeiras linhas e a conta/contexto de destino antes da confirmação.
- [ ] Separar análise do ficheiro da gravação das transações; cancelar a pré-visualização não deve alterar dados.
- [ ] Suportar formatos documentados de mais bancos/ficheiros, sem assumir que todos os CSV são iguais.
- [ ] Adicionar mapeamento manual de colunas quando a deteção automática falhar.
- [ ] Tornar o parser robusto a delimitadores, aspas, BOM, datas, timezone, separadores decimais e valores negativos.
- [ ] Mostrar o resultado da importação com contagens e linhas ignoradas, sem apresentar dados bancários sensíveis em URLs.
- [ ] Manter o limite de tamanho/linhas e validar MIME/extensão/conteúdo.
- [ ] Preservar a deduplicação no servidor e na base de dados; não depender apenas de verificações no browser.
- [ ] Rever a importação de extratos Kids & Teens com a documentação da região correta e avisar quando o titular/IBAN do extrato seja o do responsável.
- [ ] Adicionar testes com fixtures anonimizadas de cada formato suportado, incluindo ficheiro repetido e moedas diferentes.

**Critério de saída:** importação previsível, com preview e confirmação, sem duplicações em reenvios e com relatório claro do que foi importado ou ignorado.

### Fase 3 — Primeiro provedor bancário em sandbox

**Objetivo:** completar uma integração de leitura ponta a ponta em ambiente de teste.

- [ ] Criar aplicação e ambiente sandbox no provedor selecionado.
- [ ] Implementar o fluxo OAuth/consentimento e callback seguro.
- [ ] Descobrir contas externas, saldos, moedas e identificadores.
- [ ] Permitir ao utilizador associar uma conta externa a uma conta MoneyFlow existente ou criar uma conta nova.
- [ ] Implementar leitura inicial de movimentos e respetiva paginação/cursor.
- [ ] Normalizar tipos, sinais, estados, descrições, datas, moedas e identificadores.
- [ ] Implementar cancelamento/revogação e tratamento de consentimento expirado.
- [ ] Construir a página de gestão de ligações com estado, última sincronização e ação de desligar.
- [ ] Testar falhas do provedor, timeouts, autorização recusada, conta sem movimentos, várias moedas e reautorização.
- [ ] Garantir que o modo sandbox não pode escrever no ambiente financeiro de produção.

**Critério de saída:** utilizador de teste liga uma conta sandbox, associa-a a uma conta MoneyFlow, sincroniza movimentos sem duplicações e consegue revogar a ligação.

### Fase 4 — Sincronização incremental e operação em produção

**Objetivo:** manter as contas ligadas atualizadas com segurança e previsibilidade.

- [ ] Implementar sincronização manual pelo utilizador.
- [ ] Implementar sincronização em background com agendamento, sem depender de uma página aberta.
- [ ] Usar cursores/IDs do provedor e checkpoints por conta; suportar sincronização incremental e reprocessamento.
- [ ] Aplicar limites de chamadas e janelas de histórico impostos por cada provedor.
- [ ] Adicionar retries com backoff exponencial e jitter; não repetir erros permanentes indefinidamente.
- [ ] Criar fila/outbox ou mecanismo equivalente para processar eventos de forma durável.
- [ ] Validar assinatura, timestamp e replay protection de todos os webhooks.
- [ ] Deduplicar webhooks e movimentos com chaves únicas na base de dados.
- [ ] Guardar estado, duração, contagens e erros sanitizados por execução.
- [ ] Implementar alertas para falhas sucessivas, consentimentos expirados e ligações sem atualização.
- [ ] Definir limites por utilizador/conta e impedir sincronizações concorrentes da mesma ligação.
- [ ] Fazer rollout gradual por provedor/contas de teste antes de ativar a ligação a todos os utilizadores.

**Critério de saída:** sincronização repetível, idempotente, observável e limitada por consentimento/quotas, com forma de recuperar de falhas sem criar movimentos duplicados.

### Fase 5 — Reconciliação, recorrências e automatização assistida

**Objetivo:** ligar os dados bancários ao fluxo de gestão pessoal sem criar movimentos incorretos.

- [ ] Associar movimento externo a movimento manual existente quando houver correspondência inequívoca.
- [ ] Calcular confiança de correspondência usando conta, moeda, montante, data, referência e descrição; permitir confirmação manual quando houver ambiguidade.
- [ ] Nunca apagar nem substituir silenciosamente um movimento introduzido pelo utilizador.
- [ ] Distinguir movimento pendente, contabilizado, revertido, devolvido e cancelado quando o provedor disponibilizar esses estados.
- [ ] Mostrar origem e ligação da transação ao movimento externo.
- [ ] Atualizar saldos a partir do provedor apenas quando a conta tiver essa fonte definida; explicar diferenças entre saldo do banco e saldo calculado localmente.
- [ ] Sugerir padrões recorrentes a partir de movimentos observados, mas pedir confirmação antes de criar/ativar uma entrada ou saída recorrente.
- [ ] Preservar a regra atual: uma recorrência planeada não gera uma transação real por si só.
- [ ] Permitir ao utilizador ignorar, corrigir ou remover uma sugestão.

**Critério de saída:** não existem duplicações silenciosas; movimentos de origem bancária são rastreáveis; sugestões automáticas não alteram os dados sem confirmação do utilizador.

### Fase 6 — APIs de produto, câmbio e exportação

**Objetivo:** consolidar as interfaces internas e decidir o que, se algum dia, será disponibilizado a terceiros.

- [ ] Documentar os endpoints internos de integração e os seus contratos (OpenAPI ou equivalente).
- [ ] Uniformizar validação, autenticação, autorização, erros e versionamento dos Route Handlers.
- [ ] Implementar limites de utilização, quotas e proteção contra abuso.
- [ ] Definir se existe necessidade real de uma API pública para aplicações externas; não expor dados financeiros por omissão.
- [ ] Se uma API pública for aprovada, desenhar scopes, consentimento, chaves revogáveis, quotas, logs de auditoria e documentação para developers.
- [ ] Avaliar uma API de taxas de câmbio apenas para conversões explícitas.
- [ ] Guardar moeda de origem, moeda de destino, taxa, fonte e timestamp da conversão.
- [ ] Nunca somar moedas diferentes em Geral sem conversão explícita e claramente identificada.
- [ ] Rever exportação CSV de dados do MoneyFlow e relatórios por espaço/moeda.

**Critério de saída:** contratos versionados e protegidos; qualquer API externa tem autorização explícita e documentação; qualquer conversão de moeda é transparente, rastreável e opcional.

### Fase 7 — Qualidade, privacidade e produção

**Objetivo:** tornar as integrações sustentáveis e seguras.

- [ ] Criar testes unitários para parsers, normalizadores, adaptadores e idempotência.
- [ ] Criar testes de integração para OAuth, callbacks, webhooks, sincronização e revogação em sandbox.
- [ ] Criar testes end-to-end para ligar, sincronizar, reconciliar, desligar e apagar uma ligação.
- [ ] Testar RLS com dois utilizadores e com os contextos Pessoal/Silentra/Geral.
- [ ] Adicionar observabilidade de erros, latência, sincronizações e quotas, sem PII ou tokens nos logs.
- [ ] Rever RGPD: base legal, consentimento, minimização, finalidade, retenção, exportação, apagamento e subprocessadores.
- [ ] Documentar resposta a incidentes e rotação/revogação de segredos.
- [ ] Fazer revisão de segurança das migrations, views, funções e Edge Functions.
- [ ] Rever acessibilidade, teclado, leitores de ecrã e feedback de carregamento/erro.
- [ ] Melhorar performance do dashboard e evitar chamadas em cascata no servidor.
- [ ] Avaliar persistência offline de formulários sem guardar tokens ou informação financeira sensível em Cache Storage.
- [ ] Documentar rollback, feature flags e passos para desligar um provedor sem afetar movimentos existentes.

**Critério de saída:** suite de testes verde, sem vulnerabilidades críticas conhecidas, telemetria suficiente e plano de rollback validado.

---

## 5. Ordem de prioridade e dependências

| Ordem | Entrega | Depende de | Prioridade |
|---|---|---|---|
| 1 | Descoberta e escolha do provedor (Fase 0) | Confirmação de elegibilidade/custos | Bloqueante |
| 2 | Fundação de integrações (Fase 1) | Fase 0 | Bloqueante |
| 3 | Preview e reforço de CSV (Fase 2) | Pode avançar em paralelo à Fase 1 | Alta |
| 4 | Primeiro adaptador sandbox (Fase 3) | Fases 0 e 1 | Alta |
| 5 | Sincronização e webhooks (Fase 4) | Fase 3 | Alta |
| 6 | Reconciliação e sugestões (Fase 5) | Fases 2 e 4 | Média |
| 7 | APIs públicas, FX e exportação (Fase 6) | Decisões de produto e segurança | Média / decisão |
| 8 | Hardening e rollout (Fase 7) | Todas as fases em produção | Bloqueante para lançamento |

### Critérios globais de aceitação

- [ ] Nenhum segredo, token, certificado ou credencial bancária é enviado ao browser ou ao repositório.
- [ ] Todas as operações financeiras respeitam RLS, o utilizador autenticado e o contexto financeiro selecionado.
- [ ] A mesma transação/evento nunca é importada duas vezes, mesmo com retry ou webhook repetido.
- [ ] As moedas não são agregadas sem conversão explícita e taxa datada.
- [ ] O utilizador consegue ver, renovar e revogar cada consentimento/ligação.
- [ ] A conta Kids & Teens não é anunciada como suportada até haver confirmação do fornecedor para Portugal.
- [ ] A importação CSV continua disponível mesmo que um provedor fique indisponível.
- [ ] Nenhuma integração inicia pagamentos ou transferências nesta roadmap.
- [ ] `pnpm qa` passa e as migrations são revistas antes de serem aplicadas a produção.

---

## 6. Regras de release e operação

1. Cada fase deve ser dividida em PRs pequenos, mantendo este documento como roadmap mestre.
2. Não criar migrations até o modelo de dados e o provedor estarem aprovados; migrations devem ser novas e incrementais.
3. Aplicar primeiro em ambiente de desenvolvimento/sandbox e verificar RLS, constraints e idempotência.
4. Nunca usar credenciais reais em CI; usar sandbox e fixtures anonimizadas.
5. Não ativar um provedor para todos os utilizadores sem feature flag e rollout controlado.
6. Se um fornecedor não suportar Portugal ou Kids & Teens, não contornar a limitação por scraping, partilha de palavras-passe ou automação de login.
7. Rever a documentação atual de Supabase, do fornecedor e do enquadramento PSD2 antes de cada implementação; APIs, scopes e limites mudam.
8. A produção mantém sempre a importação CSV como mecanismo de contingência.

## 7. Referências técnicas Supabase

- [Edge Functions](https://supabase.com/docs/guides/functions) — webhooks e integrações server-side.
- [Securing Edge Functions](https://supabase.com/docs/guides/functions/auth) — autenticação adequada para chamadas de utilizador e serviço.
- [Environment variables / secrets](https://supabase.com/docs/guides/functions/secrets) — segredos fora do cliente e do repositório.
- [Supabase Cron](https://supabase.com/docs/guides/cron) — possibilidade de agendar sincronizações e jobs.
- [Database Webhooks](https://supabase.com/docs/guides/database/webhooks) — eventos assíncronos após alterações de dados.
- [Supabase changelog — breaking changes](https://supabase.com/changelog?types=breaking-change) — rever antes de atualizar CLI, SDKs ou funcionalidades de plataforma.

O backend pode usar Route Handlers Next.js para fluxos OAuth e chamadas de utilizador e Edge Functions/Cron para webhooks ou jobs, mas a escolha final deve considerar o fornecedor escolhido, duração dos jobs, quotas e observabilidade. Não duplicar lógica de negócio em dois runtimes.
