# Security Policy

MoneyFlow trata dados financeiros como informação sensível.

## Princípios

- Supabase Row Level Security protege todos os dados pertencentes a utilizadores.
- A identidade é obtida no servidor através da sessão autenticada.
- As mutações são validadas com Zod no servidor.
- Service-role keys e outros segredos nunca devem ser expostos ao browser ou commitados.
- Erros mostrados ao utilizador não devem revelar detalhes internos da base de dados.

## Reportar uma vulnerabilidade

Não publiques uma vulnerabilidade de segurança num issue público. Contacta o mantenedor do projeto de forma privada e inclui passos para reproduzir, impacto estimado e qualquer evidência relevante.

Não incluas palavras-passe, tokens, chaves privadas ou outros segredos num relatório.
