.PHONY: install db migrate seed run test lint

COMPOSE ?= docker-compose

install:
	python3 -m venv .venv
	.venv/bin/pip install -e ".[dev]"

db:
	$(COMPOSE) up -d db

migrate:
	.venv/bin/alembic upgrade head

seed:
	.venv/bin/python -m app.seed

run:
	.venv/bin/uvicorn app.main:app --reload

test:
	.venv/bin/pytest -q

lint:
	.venv/bin/ruff check .
