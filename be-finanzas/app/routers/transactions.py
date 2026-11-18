from datetime import UTC, date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Account, Category, Transaction
from app.schemas import TransactionCreate, TransactionOut, TransactionType, TransactionUpdate

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _validate_relations(
    db: Session,
    category_id: int | None,
    account_id: int | None,
) -> None:
    if category_id is not None and not db.get(Category, category_id):
        raise HTTPException(status_code=404, detail="Category not found")
    if account_id is not None and not db.get(Account, account_id):
        raise HTTPException(status_code=404, detail="Account not found")


@router.get("", response_model=list[TransactionOut])
def list_transactions(
    response: Response,
    search: str | None = None,
    transaction_type: TransactionType | None = Query(default=None, alias="type"),
    category_id: int | None = None,
    account_id: int | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[Transaction]:
    filters = []

    if search:
        pattern = f"%{search}%"
        filters.append(or_(Transaction.name.ilike(pattern), Transaction.notes.ilike(pattern)))
    if transaction_type:
        filters.append(Transaction.type == transaction_type)
    if category_id is not None:
        filters.append(Transaction.category_id == category_id)
    if account_id is not None:
        filters.append(Transaction.account_id == account_id)
    if start_date:
        filters.append(Transaction.date >= datetime.combine(start_date, time.min, tzinfo=UTC))
    if end_date:
        filters.append(
            Transaction.date < datetime.combine(end_date + timedelta(days=1), time.min, tzinfo=UTC)
        )

    total = db.scalar(select(func.count(Transaction.id)).where(*filters)) or 0
    stmt = (
        select(Transaction)
        .where(*filters)
        .options(selectinload(Transaction.category))
        .order_by(Transaction.date.desc(), Transaction.id.desc())
        .offset(offset)
        .limit(limit)
    )
    response.headers["X-Total-Count"] = str(total)
    return list(db.scalars(stmt).all())


@router.get("/{transaction_id}", response_model=TransactionOut)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)) -> Transaction:
    transaction = db.scalar(
        select(Transaction)
        .where(Transaction.id == transaction_id)
        .options(selectinload(Transaction.category))
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


@router.post("", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
) -> Transaction:
    data = payload.model_dump()
    _validate_relations(db, data["category_id"], data["account_id"])
    if data["date"] is None:
        data["date"] = datetime.now(UTC)

    transaction = Transaction(**data)
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.patch("/{transaction_id}", response_model=TransactionOut)
def update_transaction(
    transaction_id: int,
    payload: TransactionUpdate,
    db: Session = Depends(get_db),
) -> Transaction:
    transaction = db.get(Transaction, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    data = payload.model_dump(exclude_unset=True)
    if "category_id" in data or "account_id" in data:
        _validate_relations(
            db,
            data.get("category_id", transaction.category_id),
            data.get("account_id", transaction.account_id),
        )
    if data.get("date") is None:
        data.pop("date", None)

    for field, value in data.items():
        setattr(transaction, field, value)

    db.commit()
    db.refresh(transaction)
    return transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)) -> Response:
    transaction = db.get(Transaction, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(transaction)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
