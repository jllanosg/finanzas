from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Account, Transaction
from app.schemas import AccountCreate, AccountOut, AccountUpdate

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("", response_model=list[AccountOut])
def list_accounts(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
) -> list[Account]:
    stmt = select(Account).order_by(Account.created_at)
    if not include_inactive:
        stmt = stmt.where(Account.is_active.is_(True))
    return list(db.scalars(stmt).all())


@router.get("/{account_id}", response_model=AccountOut)
def get_account(account_id: int, db: Session = Depends(get_db)) -> Account:
    account = db.get(Account, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.post("", response_model=AccountOut, status_code=status.HTTP_201_CREATED)
def create_account(payload: AccountCreate, db: Session = Depends(get_db)) -> Account:
    account = Account(**payload.model_dump())
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.patch("/{account_id}", response_model=AccountOut)
def update_account(
    account_id: int,
    payload: AccountUpdate,
    db: Session = Depends(get_db),
) -> Account:
    account = db.get(Account, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    data = payload.model_dump(exclude_unset=True)
    if "currency" in data and data["currency"] != account.currency:
        # Transactions follow the account's currency.
        db.execute(
            update(Transaction)
            .where(Transaction.account_id == account.id)
            .values(currency=data["currency"])
        )

    for field, value in data.items():
        setattr(account, field, value)

    db.commit()
    db.refresh(account)
    return account


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(account_id: int, db: Session = Depends(get_db)) -> None:
    account = db.get(Account, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    db.delete(account)
    db.commit()
