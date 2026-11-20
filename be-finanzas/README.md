# Quesito Finance API

A small FastAPI backend for the Quesito personal finance dashboard. It uses PostgreSQL, SQLAlchemy 2, Alembic migrations, and Pydantic v2.

Authentication is intentionally left out for now. Add it before deploying this anywhere public.

## Stack

- FastAPI + Uvicorn
- SQLAlchemy 2.0 (sync sessions)
- PostgreSQL 17 (Docker)
- Alembic migrations
- Pydantic v2 + pydantic-settings
- pytest + ruff

## Quick start

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

- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- Health check: http://localhost:8000/api/v1/health

Or use the included `Makefile`:

```bash
make db install migrate seed run
```

## Environment

| Variable | Default | Description |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql+psycopg://finance:finance@localhost:5432/finance` | SQLAlchemy database URL |
| `CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated frontend origins |
| `ENVIRONMENT` | `development` | Environment label |

The Docker database uses user/password/database `finance`. If port `5432` is already taken, set `POSTGRES_PORT=5433` for Docker and update `DATABASE_URL` to use port `5433`.

> This repo was tested with the standalone `docker-compose` binary. If you use the Docker Compose plugin instead, `docker compose up -d db` works the same way (and `make db COMPOSE="docker compose"` also works).

## Data model

| Table | Purpose |
| --- | --- |
| `accounts` | Checking, savings, credit, cash, or investment accounts. Each account has its own `currency`: `USD` or `CLP`. |
| `categories` | Transaction categories with a display icon/color and income/expense kind |
| `transactions` | Signed by `type` (`income` or `expense`); `amount` is always positive. Currency is inherited from the assigned account. |
| `budgets` | One monthly limit per category, month, and currency; `month` is normalized to the first day |

Creating, updating, or deleting a transaction with an `account_id` adjusts that account's balance by the signed transaction amount. The dashboard's `total_balance` is the sum of active account balances for the requested currency, so it stays in sync automatically.

Multi-currency values are **not converted**. Dashboard, transaction, cash-flow, and budget queries are scoped with `currency=USD` or `currency=CLP`, and the frontend switches between them. A transaction without an account keeps the currency sent by the client. Changing an account's currency relabels its transactions; it does not convert their amounts.

## Endpoints

All routes are under `/api/v1`.

| Method | Route | Notes |
| --- | --- | --- |
| `GET` | `/health` | Verifies the app and database connection |
| `GET/POST` | `/accounts` | List or create accounts |
| `GET/PATCH/DELETE` | `/accounts/{id}` | Read, update, or delete an account |
| `GET/POST` | `/categories` | List (`?kind=expense`) or create categories |
| `GET/PATCH/DELETE` | `/categories/{id}` | Read, update, or delete a category |
| `GET/POST` | `/transactions` | Filter with `search`, `type`, `currency`, `category_id`, `account_id`, `start_date`, `end_date`, `limit`, `offset` |
| `POST` | `/transactions/bulk-delete` | Delete up to 200 transactions by ID and reverse their account-balance effects atomically |
| `GET/PATCH/DELETE` | `/transactions/{id}` | Read, edit, or delete a transaction |
| `GET/POST` | `/budgets` | List for `?month=YYYY-MM&currency=USD` with spent totals, or create a budget |
| `GET/PATCH/DELETE` | `/budgets/{id}` | Read, update, or delete a budget |
| `GET` | `/dashboard/summary` | Balance, monthly income/expenses, recent transactions, spending by category, and budget totals for `?currency=USD\|CLP` |
| `GET` | `/dashboard/cashflow` | `?period=week\|month\|year&currency=USD\|CLP` grouped cash-flow points |

Transaction list responses include an `X-Total-Count` header for pagination.

### Example requests

```bash
# Add a CLP transaction
curl -X POST http://localhost:8000/api/v1/transactions \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Almuerzo",
    "amount": 12000,
    "type": "expense",
    "currency": "CLP",
    "account_id": 1
  }'

# Search expenses this month
curl 'http://localhost:8000/api/v1/transactions?type=expense&search=coffee&limit=20&currency=USD'

# Dashboard totals for November 2026 in CLP
curl 'http://localhost:8000/api/v1/dashboard/summary?month=2026-11&currency=CLP'

# Yearly CLP cash flow
curl 'http://localhost:8000/api/v1/dashboard/cashflow?period=year&currency=CLP'
```

## Migrations

```bash
# Apply all migrations
alembic upgrade head

# Create a migration after changing app/models.py
alembic revision --autogenerate -m "describe the change"

# Roll back one revision
alembic downgrade -1
```

The initial migration creates all four tables and their indexes/foreign keys. `alembic/env.py` reads `DATABASE_URL` from `.env`, so there is no separate database URL to maintain.

## Seed data

`python -m app.seed` is idempotent: if any account exists, it exits without changing data. It creates demo accounts, categories, current-month budgets, and transactions that match the frontend dashboard.

## Tests and lint

```bash
pytest -q
ruff check .
```

Tests use an in-memory SQLite database so they run without Docker. Development and production use PostgreSQL.

## Connecting the frontend

Point the Next.js app at this API, for example:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

The backend already allows requests from `http://localhost:3000`. Add other origins to `CORS_ORIGINS`.

## Project layout

```text
be-finanzas/
├── alembic/
│   ├── env.py
│   └── versions/
├── app/
│   ├── config.py
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── seed.py
│   ├── utils.py
│   └── routers/
├── tests/
├── alembic.ini
├── docker-compose.yml
├── Makefile
└── pyproject.toml
```
