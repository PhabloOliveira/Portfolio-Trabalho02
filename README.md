[![CI - PR checks](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)
[![CD - Deploy Pages](https://github.com/OWNER/REPO/actions/workflows/cd.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/cd.yml)

# Esteira de Produção (CI/CD) — Portfólio

Este repositório contém um site de portfólio simples e uma pipeline de validação para proteger a branch `main`.

Requisitos mínimos do projeto
- `index.html` na raiz do repositório
- `style.css` na raiz
- pasta `images/` com imagens referenciadas

O que a pipeline valida (disparada em Pull Requests para `main`)
- Verifica existência de `index.html` na raiz (falha imediata se ausente)
- Executa linter HTML (`htmlhint`)
- Bloqueia qualquer arquivo individual maior que 500KB
- Varre o código procurando por `TODO`, `FIXME`, `senha` ou `password`
- Verifica programaticamente que todas as URLs em `<a href>` e `<img src>` existem (links externos com HEAD/GET e caminhos locais)

Como rodar localmente

1. Instale Node.js 18+.
2. Execute:

```bash
npm ci
npm run lint
node scripts/validate_links.js
```

Habilitando proteção da branch (Merge bloqueado quando o CI falha)

1. No GitHub, vá em *Settings > Branches > Branch protection rules*.
2. Adicione uma nova regra para `main`.
3. Marque *Require status checks to pass before merging* e selecione o status da workflow `CI - PR checks` (ou seu nome equivalente).
4. Salve a regra — assim o botão de *Merge* ficará desativado quando a pipeline falhar.

Observações
- O workflow está em `.github/workflows/ci.yml` e é disparado apenas em Pull Requests para `main`.
- Ajuste links e informações do `index.html` para seu conteúdo real antes de publicar no GitHub Pages.

Observação: substitua `OWNER/REPO` nas URLs do badge pelo caminho do seu repositório (ex: `meuUsuario/meuRepo`).

Notificações por e-mail (opcional)

O workflow de deploy cria uma Issue automaticamente quando o deploy falha. Se preferir receber um e-mail também, configure os seguintes secrets no repositório (Settings → Secrets):

- `SMTP_HOST` — servidor SMTP (ex: smtp.gmail.com)
- `SMTP_PORT` — porta SMTP (ex: 587)
- `SMTP_USERNAME` — usuário/usuário do SMTP
- `SMTP_PASSWORD` — senha ou app password
- `NOTIFY_EMAIL_FROM` — endereço remetente (ex: ci@example.com)
- `NOTIFY_EMAIL_TO` — endereço de destino (ex: team@example.com)

Quando `SMTP_HOST` estiver definido, o workflow enviará um e-mail simples informando a falha do deploy.
