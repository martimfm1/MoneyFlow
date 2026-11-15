# Avaliação de fornecedores Open Banking — Portugal

> **Data da avaliação:** 15 de novembro de 2026  
> **Estado:** shortlist técnica; sujeito a validação comercial, contratual e a teste com conta elegível.  
> **Âmbito inicial:** Account Information (AIS) apenas — listar contas, obter saldos e ler movimentos. Não iniciar pagamentos.

## Decisão de trabalho

**Salt Edge Partner Program é o candidato principal para uma primeira integração sandbox/prova de conceito.** É o único da shortlist em que a documentação pública consultada reúne claramente os três pontos que interessam a este caso: programa para parceiros sem licença PSD2 própria, cobertura publicada da Revolut em Portugal e um fluxo de ligação ao banco por widget/consentimento.

Isto ainda não é uma decisão de produção. Antes de gravar credenciais, criar migrations ou anunciar a funcionalidade, é necessário obter convite/acesso de parceiro, preço, termos, DPA, requisitos de KYB e confirmação escrita sobre os dados que a ligação Revolut Portugal devolve para uma subconta Jovem.

## Comparação

| Fornecedor                    | Portugal                                                                                                                                                               | Modelo de acesso                                                                                                                                                       | Custo/produção                                                                                                                                                                                | Decisão                                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Salt Edge Partner Program** | A página de cobertura portuguesa lista Revolut e indica saldos e detalhe de transações para essa ligação.                                                              | O Partner Program anuncia acesso a dados agregados sem licença PSD2 própria do parceiro; Salt Edge trata da infraestrutura e das matérias de conformidade do programa. | Convite/onboarding comercial e orçamento individual. A documentação de Account Information recomenda o widget Connect; o Direct API está limitado a parceiros certificados e/ou selecionados. | **Primeiro candidato para sandbox e pedido comercial.**                                                  |
| Enable Banking                | Opera em 30 países do EEE, incluindo Portugal, com cobertura multi-banco. A lista pública consultada não confirmou a disponibilidade específica da ligação Revolut PT. | Pode operar como AISP sob a sua própria autorização ou como TSP para um TPP com licença própria.                                                                       | Contrato e KYB para produção; faturação por volume com mínimo mensal, sem preço público.                                                                                                      | Alternativa para bancos portugueses tradicionais; confirmar Revolut antes de o escolher para este caso.  |
| Plaid                         | Portugal consta da lista de países europeus suportados por Transactions. A cobertura exata de cada instituição deve ser confirmada na Bank Coverage Explorer/Console.  | Plaid fornece serviços AIS regulados para mercados europeus; acesso live depende de pedido e processo de compliance.                                                   | A página de preços europeia apresenta opções Free e Custom; o preço aplicável ao produto e ao volume tem de ser confirmado no processo de acesso à produção.                                  | Alternativa a cotar; não há confirmação pública suficiente da instituição Revolut PT neste levantamento. |
| TrueLayer                     | Portugal é um país suportado pela Data API; a lista de bancos concreta é disponibilizada no Console/`/providers`.                                                      | Plataforma B2B com onboarding comercial para produção.                                                                                                                 | A TrueLayer declarou em setembro de 2026 que projetos pessoais/hobby não obtêm produção; é necessário negócio comercial que passe o onboarding.                                               | Alternativa comercial, mas menos adequada para uma prova pessoal sem contrato.                           |

### Porque Salt Edge fica em primeiro lugar

1. A página portuguesa de cobertura da Salt Edge lista **Revolut** como ligação PSD2/Open Banking com AIS e apresenta suporte de saldos e detalhes de transações.
2. O produto Data Aggregation descreve o **Partner Program** como a via para empresas sem licença PSD2 própria, tratando da infraestrutura, compliance e segurança.
3. O guia de integração da Salt Edge descreve criação de customer, connection, utilização do widget Connect e callbacks para atualizar os dados.
4. O Direct API não deve ser assumido: a própria documentação diz que só é disponibilizada a parceiros certificados e/ou selecionados. A primeira implementação deve privilegiar o widget alojado/embebido permitido pelo contrato.

### Limitações conhecidas da comparação

- As páginas públicas de cobertura não garantem que todos os tipos de conta, titulares, subcontas ou históricos estejam disponíveis em qualquer consentimento.
- A cobertura geral de Revolut em Portugal **não prova** que as operações da subconta Revolut Jovem sejam devolvidas como uma conta separada.
- A disponibilidade de AIS, a frequência de atualização, o histórico por banco, a renovação de consentimento, o suporte a contas de menores e o custo final devem ser confirmados com o fornecedor.
- Os preços não são presumidos nem inventados: Salt Edge e Enable Banking exigem contacto comercial para obter a proposta aplicável.
- Esta avaliação não constitui aconselhamento jurídico. O modelo de tratamento de dados e os papéis de responsável/subcontratante devem ser validados antes de produção.

## Revolut Jovem / Kids & Teens em Portugal

A documentação oficial portuguesa consultada é explícita:

- A Revolut descreve a conta Jovem como uma **subconta** da conta pessoal do pai/mãe ou responsável, sem dados bancários individuais próprios.
- O extrato da subconta Jovem é obtido na aplicação Revolut principal do responsável.
- O extrato é emitido em nome do responsável legal e o IBAN apresentado corresponde à conta principal do responsável, não a um IBAN individual do menor.
- Os termos portugueses da subconta Jovem indicam que o contrato é celebrado entre a Revolut e o titular da conta principal; o utilizador da subconta não é a parte contratante.

**Implicação de produto:** não apresentar a Revolut Jovem como uma conta bancária individual do menor, nem associar o IBAN do responsável à pessoa menor. O titular legal terá de autorizar qualquer ligação da conta principal. Mesmo com esse consentimento, não está documentado que a API exponha as operações da subconta Jovem isoladamente; isso deve ser testado e confirmado com a Revolut e a Salt Edge.

Enquanto esse ponto não estiver confirmado, manter a importação manual do extrato exportado pelo responsável. Não solicitar credenciais, PINs, palavras-passe, códigos de autenticação ou acesso à sessão Revolut.

## Perguntas comerciais e técnicas a enviar à Salt Edge

Antes de iniciar o adaptador de produção, obter resposta por escrito a estas questões:

- O Partner Program está disponível para uma aplicação de gestão financeira pessoal com utilizadores finais em Portugal?
- Que entidade contratante tem de assinar o acordo e que documentos de empresa/KYB são obrigatórios?
- Qual é o custo de setup, mensalidade mínima, preço por conexão/refresh/utilizador e limites mínimos de volume?
- Revolut Portugal está ativa para novas conexões AIS? A ligação devolve contas, saldos e movimentos? Qual é o histórico e frequência de atualização?
- Uma ligação autorizada pelo titular legal da conta principal inclui movimentos da subconta Revolut Jovem? Se sim, como são identificados e separados? Se não, existe alguma via suportada?
- Que consentimentos, scopes e durações existem? Como se faz refresh, reconexão e revogação?
- Quais são as políticas de retenção, região de processamento, subcontratantes, DPA, resposta a incidentes e eliminação dos dados?
- O sandbox cobre o mesmo contrato de dados, callbacks e estados de ligação da produção? Que dados/fornecedores fake estão disponíveis?
- O widget Connect pode ser integrado numa aplicação Next.js/PWA e que requisitos de abertura em browser externo existem em iOS?

## Próximos passos

- [ ] Solicitar acesso ao Salt Edge Partner Program e à documentação/credenciais sandbox.
- [ ] Obter proposta comercial e confirmar a elegibilidade contratual da entidade que opera MoneyFlow.
- [ ] Confirmar por escrito a cobertura Revolut Portugal e o comportamento de subcontas Jovem.
- [ ] Comparar a proposta com Enable Banking e Plaid antes de assumir custos recorrentes.
- [ ] Apenas depois, selecionar o provedor e iniciar a Fase 1 (modelo de ligações, consentimentos, segredos e RLS).
- [ ] Construir primeiro uma ligação read-only em sandbox, com fixtures e testes; não introduzir pagamentos.

## Fontes oficiais

- [Salt Edge — Data Aggregation / Partner Program](https://www.saltedge.com/products/account_information)
- [Salt Edge — Cobertura de instituições em Portugal](https://www.saltedge.com/products/account_information/coverage/pt)
- [Salt Edge — Account Information API v5](https://docs.saltedge.com/account_information/v5/)
- [Salt Edge — General API documentation and Partner flow](https://docs.saltedge.com/)
- [Enable Banking — Coverage, pricing, onboarding and compliance](https://enablebanking.com/knowledge-base)
- [Enable Banking — FAQ: pricing, production and KYB](https://enablebanking.com/docs/faq)
- [Plaid — European country and product coverage](https://support.plaid.com/hc/en-us/articles/27895826947735-What-Plaid-products-are-supported-in-each-country-and-region)
- [Plaid — EU pricing](https://plaid.com/en-eu/pricing/)
- [Plaid — Production access](https://support.plaid.com/hc/en-us/articles/39917307426967-How-do-I-upgrade-from-the-Trial-plan-to-a-paid-Production-plan)
- [TrueLayer — Production access limitations for personal projects](https://support.truelayer.com/hc/en-us/articles/51026317780881-Can-I-get-production-access-for-a-personal-project-I-built-in-Sandbox)
- [Revolut Portugal — Gerir uma subconta Jovem](https://help.revolut.com/pt-PT/help/profile-and-plan/revolut-junior/18-account-management/)
- [Revolut Portugal — Extratos Jovem](https://help.revolut.com/pt-PT/help/profile-and-plan/revolut-junior/revolut-18-statements/)
- [Revolut Portugal — Termos da subconta Jovem](https://cdn.revolut.com/terms_and_conditions/pdf/revolut_kids_teens_account_29bd48b5_2.1.1_1772702018_en.pdf)
