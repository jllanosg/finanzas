from datetime import UTC, datetime


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


def test_currency_scoped_totals_and_budgets(client):
    current_month = datetime.now(UTC).date().replace(day=1)
    usd_account = client.post(
        "/api/v1/accounts",
        json={"name": "USD account", "balance": 1000, "currency": "USD"},
    ).json()
    clp_account = client.post(
        "/api/v1/accounts",
        json={"name": "CLP account", "balance": 500000, "currency": "CLP"},
    ).json()
    category = client.post("/api/v1/categories", json={"name": "Travel"}).json()

    usd_transaction = client.post(
        "/api/v1/transactions",
        json={
            "name": "USD trip",
            "amount": 100,
            "type": "expense",
            "account_id": usd_account["id"],
            "category_id": category["id"],
        },
    )
    clp_transaction = client.post(
        "/api/v1/transactions",
        json={
            "name": "CLP trip",
            "amount": 50000,
            "type": "expense",
            "account_id": clp_account["id"],
            "category_id": category["id"],
        },
    )
    assert usd_transaction.json()["currency"] == "USD"
    assert clp_transaction.json()["currency"] == "CLP"

    usd_summary = client.get(
        "/api/v1/dashboard/summary", params={"currency": "USD"}
    ).json()
    clp_summary = client.get(
        "/api/v1/dashboard/summary", params={"currency": "CLP"}
    ).json()
    assert usd_summary["currency"] == "USD"
    assert usd_summary["total_balance"] == 900.0
    assert usd_summary["expenses"] == 100.0
    assert [item["name"] for item in usd_summary["recent_transactions"]] == ["USD trip"]
    assert clp_summary["currency"] == "CLP"
    assert clp_summary["total_balance"] == 450000.0
    assert clp_summary["expenses"] == 50000.0
    assert [item["name"] for item in clp_summary["recent_transactions"]] == ["CLP trip"]

    clp_cashflow = client.get(
        "/api/v1/dashboard/cashflow", params={"period": "month", "currency": "CLP"}
    ).json()
    assert clp_cashflow["currency"] == "CLP"
    assert clp_cashflow["total_expenses"] == 50000.0
    assert clp_cashflow["total_income"] == 0.0

    for currency, amount in (("USD", 200), ("CLP", 100000)):
        response = client.post(
            "/api/v1/budgets",
            json={
                "category_id": category["id"],
                "month": current_month.isoformat(),
                "amount": amount,
                "currency": currency,
            },
        )
        assert response.status_code == 201
        assert response.json()["currency"] == currency

    usd_budgets = client.get(
        "/api/v1/budgets", params={"month": current_month.strftime("%Y-%m"), "currency": "USD"}
    ).json()
    clp_budgets = client.get(
        "/api/v1/budgets", params={"month": current_month.strftime("%Y-%m"), "currency": "CLP"}
    ).json()
    assert len(usd_budgets) == 1
    assert usd_budgets[0]["spent"] == 100.0
    assert len(clp_budgets) == 1
    assert clp_budgets[0]["spent"] == 50000.0


def test_transaction_without_account_keeps_requested_currency(client):
    response = client.post(
        "/api/v1/transactions",
        json={
            "name": "Unlinked CLP expense",
            "amount": 12000,
            "type": "expense",
            "currency": "CLP",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["currency"] == "CLP"
    assert body["account_id"] is None
    clp_summary = client.get(
        "/api/v1/dashboard/summary", params={"currency": "CLP"}
    ).json()
    assert clp_summary["expenses"] == 12000.0
    assert clp_summary["total_balance"] == 0.0


def test_account_currency_change_relabels_its_transactions(client):
    account = client.post(
        "/api/v1/accounts",
        json={"name": "Relabel account", "balance": 100, "currency": "USD"},
    ).json()
    transaction = client.post(
        "/api/v1/transactions",
        json={
            "name": "Relabel expense",
            "amount": 10,
            "type": "expense",
            "account_id": account["id"],
        },
    ).json()

    updated = client.patch(
        f"/api/v1/accounts/{account['id']}", json={"currency": "CLP"}
    )
    assert updated.status_code == 200
    assert updated.json()["currency"] == "CLP"
    assert client.get(f"/api/v1/transactions/{transaction['id']}").json()["currency"] == "CLP"

    usd_summary = client.get(
        "/api/v1/dashboard/summary", params={"currency": "USD"}
    ).json()
    clp_summary = client.get(
        "/api/v1/dashboard/summary", params={"currency": "CLP"}
    ).json()
    assert usd_summary["total_balance"] == 0.0
    assert clp_summary["total_balance"] == 90.0
    assert clp_summary["expenses"] == 10.0
    filtered = client.get("/api/v1/transactions", params={"currency": "CLP"}).json()
    assert [item["id"] for item in filtered] == [transaction["id"]]


def test_bulk_delete_transactions_reverses_account_balances(client):
    account = client.post(
        "/api/v1/accounts",
        json={"name": "Bulk account", "balance": 1000, "currency": "USD"},
    ).json()
    expense = client.post(
        "/api/v1/transactions",
        json={
            "name": "Bulk expense",
            "amount": 100,
            "type": "expense",
            "account_id": account["id"],
        },
    ).json()
    income = client.post(
        "/api/v1/transactions",
        json={
            "name": "Bulk income",
            "amount": 50,
            "type": "income",
            "account_id": account["id"],
        },
    ).json()
    unlinked = client.post(
        "/api/v1/transactions",
        json={"name": "Bulk unlinked", "amount": 20, "type": "expense"},
    ).json()

    assert client.get(f"/api/v1/accounts/{account['id']}").json()["balance"] == 950.0

    response = client.post(
        "/api/v1/transactions/bulk-delete",
        json={"ids": [expense["id"], income["id"], unlinked["id"], 99999]},
    )
    assert response.status_code == 200
    assert response.json() == {"deleted": 3, "missing": [99999]}
    assert client.get(f"/api/v1/accounts/{account['id']}").json()["balance"] == 1000.0
    assert client.get("/api/v1/transactions").json() == []
    assert client.get("/api/v1/dashboard/summary").json()["expenses"] == 0.0
