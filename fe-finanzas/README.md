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

- Overview totals from `/dashboard/summary`
- Cash-flow chart and range switch from `/dashboard/cashflow`
- Recent transactions and full search from `/transactions`
- Transaction creation and deletion
- Monthly budgets with spent/remaining totals
- Budget creation, editing, and deletion
- Account listing, creation, editing, and deletion
- Categories loaded from the API for transaction and budget forms

The UI shows a connection banner with a retry action when the API is unreachable.

## Scripts

```bash
bun dev      # development server
bun run lint # eslint
bun run build
bun start
```
