"""Seed the database with demo data for the finance dashboard.

Run after `alembic upgrade head`:
    python -m app.seed
"""

from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal

from sqlalchemy import select

from app.database import SessionLocal
from app.models import Account, Budget, Category, Transaction
from app.utils import shift_month


def at(value: date, hour: int = 12) -> datetime:
    return datetime.combine(value, time(hour=hour), tzinfo=UTC)


def current_month_day(today: date, day: int) -> date:
    return today.replace(day=min(day, today.day))


def days_ago(today: date, days: int) -> date:
    return max(today - timedelta(days=days), today.replace(day=1))


def main() -> None:
    with SessionLocal() as db:
        if db.scalar(select(Account).limit(1)):
            print("Database already contains data. Seed skipped.")
            return

        checking = Account(
            name="Everyday Checking",
            type="checking",
            balance=Decimal("18420.25"),
            currency="USD",
            institution="Quesito Bank",
        )
        savings = Account(
            name="High-yield Savings",
            type="savings",
            balance=Decimal("6260.00"),
            currency="USD",
            institution="Quesito Bank",
        )
        db.add_all([checking, savings])

        category_data = [
            ("Housing", "home", "blue", "expense"),
            ("Groceries", "shopping", "gold", "expense"),
            ("Food & drink", "coffee", "peach", "expense"),
            ("Transport", "transport", "blue", "expense"),
            ("Utilities", "utilities", "lavender", "expense"),
            ("Lifestyle", "sparkle", "purple", "expense"),
            ("Income", "arrow-down-left", "mint", "income"),
            ("Other", "tag", "gray", "expense"),
        ]
        categories = {
            name: Category(name=name, icon=icon, color=color, kind=kind)
            for name, icon, color, kind in category_data
        }
        db.add_all(categories.values())

        today = datetime.now(UTC).date()
        month = today.replace(day=1)

        budget_amounts = {
            "Housing": "1800.00",
            "Groceries": "600.00",
            "Food & drink": "300.00",
            "Transport": "250.00",
            "Utilities": "300.00",
            "Lifestyle": "250.00",
        }
        for name, amount in budget_amounts.items():
            db.add(
                Budget(
                    category=categories[name],
                    month=month,
                    amount=Decimal(amount),
                )
            )

        transactions = [
            ("Monthly salary", "4850.00", "income", at(current_month_day(today, 1), 9), "Income"),
            ("Freelance design", "390.00", "income", at(current_month_day(today, 2), 15), "Income"),
            ("Apartment rent", "1650.00", "expense", at(current_month_day(today, 1)), "Housing"),
            ("Whole Foods Market", "84.32", "expense", at(today, 10), "Groceries"),
            ("Blue Bottle Coffee", "6.75", "expense", at(days_ago(today, 1), 8), "Food & drink"),
            ("Uber ride", "18.40", "expense", at(days_ago(today, 2), 20), "Transport"),
            ("Electricity bill", "186.00", "expense", at(current_month_day(today, 3)), "Utilities"),
            (
                "Dinner at Nopa",
                "68.50",
                "expense",
                at(current_month_day(today, 2), 19),
                "Food & drink",
            ),
            ("Gym membership", "45.00", "expense", at(current_month_day(today, 4), 7), "Lifestyle"),
            ("New sneakers", "125.38", "expense", at(days_ago(today, 3), 16), "Lifestyle"),
        ]

        for name, amount, kind, when, category in transactions:
            db.add(
                Transaction(
                    name=name,
                    amount=Decimal(amount),
                    type=kind,
                    date=when,
                    category=categories[category],
                    account=checking,
                )
            )

        # A little history so the yearly cash-flow chart has data.
        for offset in range(1, 4):
            previous = shift_month(month, -offset)
            db.add(
                Transaction(
                    name="Monthly salary",
                    amount=Decimal("4850.00"),
                    type="income",
                    date=at(previous.replace(day=1), 9),
                    category=categories["Income"],
                    account=checking,
                )
            )
            db.add(
                Transaction(
                    name="Apartment rent",
                    amount=Decimal("1650.00"),
                    type="expense",
                    date=at(previous.replace(day=1)),
                    category=categories["Housing"],
                    account=checking,
                )
            )

        db.commit()
        print("Seeded demo accounts, categories, transactions, and budgets.")


if __name__ == "__main__":
    main()
