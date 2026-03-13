# Guia de Deploy - Shark Tools (Vercel)

Siga os passos abaixo para colocar o sistema em produção com segurança.

## 1. Configurar Variáveis de Ambiente no Vercel

No painel do seu projeto na Vercel, vá em **Settings > Environment Variables** e adicione as seguintes chaves (copie os valores do seu arquivo `.env` local):

| Chave | Descrição |
| :--- | :--- |
| `VITE_SUPABASE_URL` | URL do seu projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima publica do Supabase |
| `VITE_APP_NAME` | Nome da aplicação (ex: SharkTools) |
| `VITE_APP_ENV` | Mude para `production` |

## 2. Comandos de Build

A Vercel deve detectar automaticamente as configurações do Vite, mas certifique-se de que os comandos coincidam:

- **Framework Preset:** `Vite` (ou Other se não detectar)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

## 3. Segurança (Já configurada)

O arquivo `vercel.json` na raiz do projeto já inclui:
- **SPAs Rewrites**: Redirecionamento de todas as rotas para o `index.html`.
- **Security Headers**: HSTS, CSP, X-Frame-Options, etc., para máxima segurança SaaS.

## 4. Deploy

Conecte seu repositório Git (GitHub/GitLab) à Vercel e faça o deploy. O sistema aplicará automaticamente todas as regras de segurança configuradas.

---
**Shark Tools** — A força da sua obra.
