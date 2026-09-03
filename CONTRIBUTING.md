# Contributing to MoneyFlow

Obrigado por contribuir para o MoneyFlow.

## Desenvolvimento

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Antes de abrir uma alteração, executa:

```bash
pnpm qa
```

## Pull requests

Mantém cada alteração focada e usa commits descritivos, por exemplo:

- `feat: add recurring expense simulator`
- `fix: prevent invalid goal contribution`
- `refactor: simplify dashboard data loading`
- `docs: update setup instructions`

As alterações de dados devem incluir uma migration Supabase nova e incremental. Nunca reutilizes um número de migration já existente.

## Segurança

Nunca coloques segredos, service-role keys ou credenciais no repositório. Para vulnerabilidades, consulta `SECURITY.md`.
