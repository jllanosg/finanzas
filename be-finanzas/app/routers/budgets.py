from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Budget, Category, Transaction
from app.schemas import BudgetCreate, BudgetOut, BudgetUpdate, Currency
from app.utils import month_bounds, parse_month

router = APIRouter(prefix="/budgets", tags=["budgets"])


def _spent_by_category(db: Session, month: date, currency: Currency) -> dict[int | None, float]:
    start, end = month_bounds(month)
    rows = db.execute(
        select(Transaction.category_id, func.sum(Transaction.amount))
        .where(
            Transaction.type == "expense",
            Transaction.currency == currency,
            Transaction.date >= start,
            Transaction.date < end,
        )
        .group_by(Transaction.category_id)
    ).all()
    return {category_id: float(total) for category_id, total in rows}


def _to_out(budget: Budget, spent: float) -> BudgetOut:
    amount = float(budget.amount)
    return BudgetOut(
        id=budget.id,
        category_id=budget.category_id,
        month=budget.month,
        amount=amount,
        currency=budget.currency,
        category=budget.category,
        spent=round(spent, 2),
        remaining=round(amount - spent, 2),
        percent=round((spent / amount) * 100, 2) if amount else 0,
    )


def _ensure_available(
    db: Session,
    category_id: int,
    month: date,
    currency: Currency,
    exclude_id: int | None = None,
) -> None:
    stmt = select(Budget).where(
        Budget.category_id == category_id,
        Budget.month == month,
        Budget.currency == currency,
    )
    if exclude_id is not None:
        stmt = stmt.where(Budget.id != exclude_id)
    if db.scalar(stmt):
        raise HTTPException(
            status_code=409,
            detail="A budget already exists for that category, month, and currency",
        )


@router.get("", response_model=list[BudgetOut])
def list_budgets(
    month: str | None = None,
    currency: Currency = Query(default="USD"),
    db: Session = Depends(get_db),
) -> list[BudgetOut]:
    try:
        month_date = parse_month(month)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    budgets = db.scalars(
        select(Budget)
        .where(Budget.month == month_date, Budget.currency == currency)
        .options(selectinload(Budget.category))
        .order_by(Budget.amount.desc(), Budget.id)
    ).all()
    spent = _spent_by_category(db, month_date, currency)
    return [_to_out(budget, spent.get(budget.category_id, 0)) for budget in budgets]


@router.get("/{budget_id}", response_model=BudgetOut)
def get_budget(budget_id: int, db: Session = Depends(get_db)) -> BudgetOut:
    budget = db.scalar(
        select(Budget).where(Budget.id == budget_id).options(selectinload(Budget.category))
    )
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    spent = _spent_by_category(db, budget.month, budget.currency)
    return _to_out(budget, spent.get(budget.category_id, 0))


@router.post("", response_model=BudgetOut, status_code=status.HTTP_201_CREATED)
def create_budget(payload: BudgetCreate, db: Session = Depends(get_db)) -> BudgetOut:
    if not db.get(Category, payload.category_id):
        raise HTTPException(status_code=404, detail="Category not found")
    _ensure_available(db, payload.category_id, payload.month, payload.currency)

    budget = Budget(**payload.model_dump())
    db.add(budget)
    db.commit()
    db.refresh(budget)
    spent = _spent_by_category(db, budget.month, budget.currency)
    return _to_out(budget, spent.get(budget.category_id, 0))


@router.patch("/{budget_id}", response_model=BudgetOut)
def update_budget(
    budget_id: int,
    payload: BudgetUpdate,
    db: Session = Depends(get_db),
) -> BudgetOut:
    budget = db.get(Budget, budget_id)
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    data = payload.model_dump(exclude_unset=True)
    target_month = data.get("month", budget.month)
    target_currency = data.get("currency", budget.currency)
    if "month" in data or "currency" in data:
        _ensure_available(
            db,
            budget.category_id,
            target_month,
            target_currency,
            exclude_id=budget.id,
        )
    for field, value in data.items():
        setattr(budget, field, value)

    db.commit()
    db.refresh(budget)
    spent = _spent_by_category(db, budget.month, budget.currency)
    return _to_out(budget, spent.get(budget.category_id, 0))


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(budget_id: int, db: Session = Depends(get_db)) -> Response:
    budget = db.get(Budget, budget_id)
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(budget)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
