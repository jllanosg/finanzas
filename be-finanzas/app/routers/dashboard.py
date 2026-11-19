from datetime import UTC, datetime, time, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Account, Budget, Category, Transaction
from app.schemas import (
    BudgetOverview,
    CashflowOut,
    CashflowPoint,
    Currency,
    DashboardSummary,
    SpendingCategory,
    TransactionOut,
)
from app.utils import as_utc, month_bounds, parse_month, shift_month

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_summary(
    month: str | None = None,
    currency: Currency = Query(default="USD"),
    db: Session = Depends(get_db),
) -> DashboardSummary:
    try:
        month_date = parse_month(month)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    start, end = month_bounds(month_date)

    total_balance = float(
        db.scalar(
            select(func.coalesce(func.sum(Account.balance), 0)).where(
                Account.is_active.is_(True),
                Account.currency == currency,
            )
        )
        or 0
    )

    def total_for(transaction_type: str) -> float:
        value = db.scalar(
            select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                Transaction.type == transaction_type,
                Transaction.currency == currency,
                Transaction.date >= start,
                Transaction.date < end,
            )
        )
        return float(value or 0)

    income = total_for("income")
    expenses = total_for("expense")

    recent = db.scalars(
        select(Transaction)
        .where(Transaction.currency == currency)
        .options(selectinload(Transaction.category))
        .order_by(Transaction.date.desc(), Transaction.id.desc())
        .limit(5)
    ).all()

    spending_rows = db.execute(
        select(
            Category.id,
            Category.name,
            Category.color,
            func.sum(Transaction.amount),
        )
        .select_from(Transaction)
        .outerjoin(Category, Transaction.category_id == Category.id)
        .where(
            Transaction.type == "expense",
            Transaction.currency == currency,
            Transaction.date >= start,
            Transaction.date < end,
        )
        .group_by(Category.id, Category.name, Category.color)
        .order_by(func.sum(Transaction.amount).desc())
    ).all()

    spending = [
        SpendingCategory(
            category_id=category_id,
            name=name or "Uncategorized",
            color=color or "gray",
            amount=round(float(amount), 2),
            percentage=round((float(amount) / expenses) * 100, 1) if expenses else 0,
        )
        for category_id, name, color, amount in spending_rows
    ]

    total_budget = float(
        db.scalar(
            select(func.coalesce(func.sum(Budget.amount), 0)).where(
                Budget.month == month_date,
                Budget.currency == currency,
            )
        )
        or 0
    )

    return DashboardSummary(
        month=month_date.strftime("%Y-%m"),
        currency=currency,
        total_balance=round(total_balance, 2),
        income=round(income, 2),
        expenses=round(expenses, 2),
        net=round(income - expenses, 2),
        recent_transactions=[TransactionOut.model_validate(item) for item in recent],
        spending_by_category=spending,
        budget=BudgetOverview(
            total_budget=round(total_budget, 2),
            spent=round(expenses, 2),
            remaining=round(total_budget - expenses, 2),
            percent=round((expenses / total_budget) * 100, 1) if total_budget else 0,
        ),
    )


@router.get("/cashflow", response_model=CashflowOut)
def get_cashflow(
    period: Literal["week", "month", "year"] = Query(default="month"),
    currency: Currency = Query(default="USD"),
    db: Session = Depends(get_db),
) -> CashflowOut:
    today = datetime.now(UTC).date()
    monthly_buckets = period == "year"

    if period == "week":
        start = today - timedelta(days=6)
    elif period == "month":
        start = today.replace(day=1)
    else:
        start = shift_month(today.replace(day=1), -11)

    start_at = datetime.combine(start, time.min, tzinfo=UTC)
    end_at = datetime.combine(today + timedelta(days=1), time.min, tzinfo=UTC)

    rows = db.execute(
        select(Transaction.date, Transaction.type, Transaction.amount).where(
            Transaction.currency == currency,
            Transaction.date >= start_at,
            Transaction.date < end_at,
        )
    ).all()

    buckets: dict = {}
    cursor = start
    while cursor <= today:
        key = cursor.replace(day=1) if monthly_buckets else cursor
        label = key.strftime("%b %Y") if monthly_buckets else f"{key.strftime('%b')} {key.day}"
        buckets[key] = {"label": label, "income": 0.0, "expenses": 0.0}
        cursor = shift_month(cursor, 1) if monthly_buckets else cursor + timedelta(days=1)

    total_income = 0.0
    total_expenses = 0.0
    for transaction_date, transaction_type, amount in rows:
        day = as_utc(transaction_date).date()
        key = day.replace(day=1) if monthly_buckets else day
        if key not in buckets:
            continue
        value = float(amount)
        if transaction_type == "income":
            buckets[key]["income"] += value
            total_income += value
        else:
            buckets[key]["expenses"] += value
            total_expenses += value

    points = [
        CashflowPoint(
            label=bucket["label"],
            income=round(bucket["income"], 2),
            expenses=round(bucket["expenses"], 2),
            net=round(bucket["income"] - bucket["expenses"], 2),
        )
        for bucket in buckets.values()
    ]

    return CashflowOut(
        period=period,
        currency=currency,
        start=start,
        end=today,
        total_income=round(total_income, 2),
        total_expenses=round(total_expenses, 2),
        points=points,
    )
