from datetime import UTC


def test_health(client):
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "connected"}


def test_account_category_transaction_and_summary(client):
    account = client.post(
        "/api/v1/accounts",
        json={"name": "Checking", "type": "checking", "balance": 1200.50},
    )
    assert account.status_code == 201

    category = client.post(
        "/api/v1/categories",
        json={"name": "Food & drink", "icon": "coffee", "color": "peach"},
    )
    assert category.status_code == 201

    transaction = client.post(
        "/api/v1/transactions",
        json={
            "name": "Coffee",
            "amount": 5.75,
            "type": "expense",
            "category_id": category.json()["id"],
            "account_id": account.json()["id"],
        },
    )
    assert transaction.status_code == 201
    assert transaction.json()["category"]["name"] == "Food & drink"

    summary = client.get("/api/v1/dashboard/summary")
    assert summary.status_code == 200
    body = summary.json()
    assert body["total_balance"] == 1194.75
    assert body["income"] == 0
    assert body["expenses"] == 5.75
    assert body["net"] == -5.75
    assert body["spending_by_category"][0]["name"] == "Food & drink"
    assert body["recent_transactions"][0]["name"] == "Coffee"


def test_transactions_keep_account_balance_in_sync(client):
    account = client.post(
        "/api/v1/accounts",
        json={"name": "Main account", "type": "checking", "balance": 1000},
    ).json()

    income = client.post(
        "/api/v1/transactions",
        json={
            "name": "Salary",
            "amount": 250,
            "type": "income",
            "account_id": account["id"],
        },
    ).json()
    assert client.get(f"/api/v1/accounts/{account['id']}").json()["balance"] == 1250.0
    assert client.get("/api/v1/dashboard/summary").json()["total_balance"] == 1250.0

    expense = client.post(
        "/api/v1/transactions",
        json={
            "name": "Groceries",
            "amount": 40,
            "type": "expense",
            "account_id": account["id"],
        },
    ).json()
    assert client.get(f"/api/v1/accounts/{account['id']}").json()["balance"] == 1210.0

    updated = client.patch(f"/api/v1/transactions/{income['id']}", json={"amount": 300})
    assert updated.status_code == 200
    assert client.get(f"/api/v1/accounts/{account['id']}").json()["balance"] == 1260.0

    assert client.delete(f"/api/v1/transactions/{expense['id']}").status_code == 204
    assert client.get(f"/api/v1/accounts/{account['id']}").json()["balance"] == 1300.0

    assert client.delete(f"/api/v1/transactions/{income['id']}").status_code == 204
    assert client.get(f"/api/v1/accounts/{account['id']}").json()["balance"] == 1000.0
    assert client.get("/api/v1/dashboard/summary").json()["total_balance"] == 1000.0


def test_transaction_filters_and_search(client):
    client.post(
        "/api/v1/transactions",
        json={"name": "Salary", "amount": 3000, "type": "income"},
    )
    client.post(
        "/api/v1/transactions",
        json={"name": "Groceries", "amount": 70, "type": "expense"},
    )

    response = client.get("/api/v1/transactions", params={"type": "expense"})
    assert response.status_code == 200
    assert response.headers["X-Total-Count"] == "1"
    assert response.json()[0]["name"] == "Groceries"

    search = client.get("/api/v1/transactions", params={"search": "sal"})
    assert search.status_code == 200
    assert search.json()[0]["name"] == "Salary"


def test_budget_returns_spent_total(client):
    from datetime import datetime

    current_month = datetime.now(UTC).date().replace(day=1)
    category = client.post("/api/v1/categories", json={"name": "Housing"}).json()
    client.post(
        "/api/v1/transactions",
        json={
            "name": "Rent",
            "amount": 650,
            "type": "expense",
            "category_id": category["id"],
        },
    )

    budget = client.post(
        "/api/v1/budgets",
        json={
            "category_id": category["id"],
            "month": current_month.isoformat(),
            "amount": 1000,
        },
    )
    assert budget.status_code == 201
    body = budget.json()
    assert body["month"] == current_month.isoformat()
    assert body["spent"] == 650
    assert body["remaining"] == 350


def test_missing_transaction_returns_404(client):
    response = client.get("/api/v1/transactions/999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Transaction not found"
