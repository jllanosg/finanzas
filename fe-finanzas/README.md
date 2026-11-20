# Quesito frontend

Next.js dashboard for the Morrow/Quesito finance API.

## Run locally

Start the backend first (`../be-finanzas`), including PostgreSQL and the seeded demo data.

```bash
cp .env.example .env.local
bun install
bun dev
```

Open http://localhost:3000.

## API connection

The app reads `NEXT_PUBLIC_API_URL` and defaults to:

```text
http://localhost:8000/api/v1
```

If the frontend runs on a different port, update `CORS_ORIGINS` in `../be-finanzas/.env` and restart the API.

## What is wired to the backend

- Overview totals from `/dashboard/summary?currency=...`
- Cash-flow chart and range switch from `/dashboard/cashflow?currency=...`
- Recent transactions and full search from `/transactions?currency=...`
- Transaction creation, editing, and deletion; amounts inherit the account currency
- Multi-select bulk deletion that reverses every affected account balance
- Transaction amounts update the assigned account balance, so the dashboard total changes immediately
- Monthly budgets with spent/remaining totals, scoped by currency
- Budget creation, editing, and deletion, per currency
- Account listing, creation, editing, and deletion with USD or CLP
- Categories loaded from the API for transaction and budget forms
- A USD/CLP display-currency selector; currencies are never converted

The UI shows a connection banner with a retry action when the API is unreachable.

## Scripts

```bash
bun dev      # development server
bun run lint # eslint
bun run build
bun start
```
