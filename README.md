# Minerador

Dashboard pra monitorar anúncios de concorrentes na Biblioteca de Anúncios do Meta. Coleta diária automática via Apify, histórico em gráfico, alertas quando a quantidade de ativos cai.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind + shadcn/ui** (tema dark nativo)
- **Prisma + Postgres** (use Neon: https://neon.tech)
- **Apify** (actor `curious_coder/facebook-ads-library-scraper`) — $0.75 / 1.000 ads
- **Vercel Cron** (1x/dia, 10:00 UTC)

## Setup local

```bash
# 1. Dependências (já instaladas se você seguiu o fluxo)
npm install

# 2. Variáveis de ambiente
cp .env.example .env.local
# edite .env.local com DATABASE_URL, APIFY_TOKEN, CRON_SECRET

# 3. Criar as tabelas no Postgres
npm run db:push

# 4. Rodar
npm run dev
```

## Variáveis necessárias

| Var              | Onde pegar                                                                  |
| ---------------- | --------------------------------------------------------------------------- |
| `DATABASE_URL`   | Neon → projeto → Connection string (pooled)                                 |
| `APIFY_TOKEN`    | https://console.apify.com/account/integrations → Personal API token         |
| `APIFY_ACTOR_ID` | opcional, default `curious_coder~facebook-ads-library-scraper`              |
| `CRON_SECRET`    | qualquer string aleatória longa (Vercel usa isso pra autenticar o cron)     |

## Deploy no Vercel

1. Suba o repo no GitHub.
2. Crie o projeto no Vercel apontando pra esse repo.
3. Em **Settings → Environment Variables**, cole as 4 vars acima.
4. Em **Settings → Functions**, garanta que `maxDuration` tá no mínimo 60s (plano Hobby). Se a coleta demorar mais, upgrade pra Pro.
5. O `vercel.json` já registra o cron — na primeira deploy o job aparece em **Settings → Cron Jobs**.

## Como usar

1. Na home, clique **Adicionar alvo**.
2. Cole:
   - URL da busca da Biblioteca (ex: `https://www.facebook.com/ads/library/?country=BR&q=marca`)
   - URL de uma página (ex: `https://www.facebook.com/nomepagina`)
   - ou o ID numérico da página
3. Clique no card → **Rodar agora** pra primeira coleta.
4. A partir daí, o cron roda 1x/dia e o gráfico começa a crescer.

## Modelo de dados

- `Target` — o que monitora (URL + apelido + status)
- `Snapshot` — snapshot diário: `{activeCount, totalCount, capturedAt}` → alimenta o gráfico
- `Ad` — cada anúncio individual com `startDate`, `isActive`, `firstSeenAt`, `becameInactiveAt`

## Custos estimados

- **Neon**: free tier (0.5 GB) cabe folgado.
- **Vercel**: free tier.
- **Apify**: $0.75 por 1.000 ads coletados. Um alvo médio tem 10–100 ads → ~$0.01–0.08 por alvo/dia. 10 alvos por 30 dias ≈ $3–24/mês.

## Scripts

| Script          | O que faz                                |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Next em dev (turbopack)                  |
| `npm run build` | `prisma generate` + build                |
| `npm run db:push` | Aplica o schema no Postgres            |
| `npm run db:studio` | Prisma Studio pra inspecionar dados  |
