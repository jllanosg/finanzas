# Finanzas

A small monorepo for a personal finance dashboard.

| Folder | Stack | Purpose |
| --- | --- | --- |
| [`fe-finanzas`](./fe-finanzas) | Next.js, React, Tailwind CSS | Dashboard UI |
| [`be-finanzas`](./be-finanzas) | FastAPI, SQLAlchemy, PostgreSQL, Alembic | REST API and data layer |

## Backend quick start

```bash
cd be-finanzas
cp .env.example .env
docker-compose up -d db

python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs

## Frontend quick start

Keep the backend running, then:

```bash
cd fe-finanzas
cp .env.example .env.local
bun install
bun dev
```

Open http://localhost:3000. The dashboard loads real data from the API: accounts, transactions, budgets, monthly summary, and cash-flow ranges. You can add, edit, and delete transactions, delete several transactions at once, manage budgets, and add/edit/delete accounts.

Accounts can use **USD** or **CLP**. The display-currency selector scopes dashboard totals, transactions, cash flow, and budgets to one currency at a time; amounts are never converted between currencies.

`NEXT_PUBLIC_API_URL` defaults to `http://localhost:8000/api/v1`. If you run the frontend on another port, add that origin to `CORS_ORIGINS` in `be-finanzas/.env`.

See [`fe-finanzas/README.md`](./fe-finanzas/README.md) for frontend details and [`be-finanzas/README.md`](./be-finanzas/README.md) for endpoints, migrations, tests, and configuration.
