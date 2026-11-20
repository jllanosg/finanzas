from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

AccountType = Literal["checking", "savings", "credit", "cash", "investment"]
TransactionType = Literal["income", "expense"]
CategoryKind = Literal["income", "expense"]
Currency = Literal["USD", "CLP"]


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# Accounts


class AccountCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    type: AccountType = "checking"
    balance: float = 0
    currency: Currency = "USD"
    institution: str | None = Field(default=None, max_length=120)
    is_active: bool = True


class AccountUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    type: AccountType | None = None
    balance: float | None = None
    currency: Currency | None = None
    institution: str | None = Field(default=None, max_length=120)
    is_active: bool | None = None


class AccountOut(ORMModel):
    id: int
    name: str
    type: AccountType
    balance: float
    currency: Currency
    institution: str | None
    is_active: bool
    created_at: datetime


# Categories


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    icon: str = Field(default="tag", max_length=40)
    color: str = Field(default="green", max_length=20)
    kind: CategoryKind = "expense"


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    icon: str | None = Field(default=None, max_length=40)
    color: str | None = Field(default=None, max_length=20)
    kind: CategoryKind | None = None


class CategoryOut(ORMModel):
    id: int
    name: str
    icon: str
    color: str
    kind: CategoryKind
    created_at: datetime


# Transactions


class TransactionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    amount: float = Field(gt=0)
    type: TransactionType
    currency: Currency = "USD"
    date: datetime | None = None
    notes: str | None = None
    category_id: int | None = None
    account_id: int | None = None


class TransactionUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    amount: float | None = Field(default=None, gt=0)
    type: TransactionType | None = None
    currency: Currency | None = None
    date: datetime | None = None
    notes: str | None = None
    category_id: int | None = None
    account_id: int | None = None


class TransactionOut(ORMModel):
    id: int
    name: str
    amount: float
    type: TransactionType
    currency: Currency
    date: datetime
    notes: str | None
    category_id: int | None
    account_id: int | None
    category: CategoryOut | None = None
    created_at: datetime


class TransactionBulkDelete(BaseModel):
    ids: list[int] = Field(min_length=1, max_length=200)


class TransactionBulkDeleteResult(BaseModel):
    deleted: int
    missing: list[int] = Field(default_factory=list)


# Budgets


class BudgetCreate(BaseModel):
    category_id: int
    month: date
    amount: float = Field(gt=0)
    currency: Currency = "USD"

    @field_validator("month")
    @classmethod
    def normalize_month(cls, value: date) -> date:
        return value.replace(day=1)


class BudgetUpdate(BaseModel):
    amount: float | None = Field(default=None, gt=0)
    month: date | None = None
    currency: Currency | None = None

    @field_validator("month")
    @classmethod
    def normalize_month(cls, value: date | None) -> date | None:
        return value.replace(day=1) if value else value


class BudgetOut(ORMModel):
    id: int
    category_id: int
    month: date
    amount: float
    currency: Currency
    category: CategoryOut | None = None
    spent: float = 0
    remaining: float = 0
    percent: float = 0


# Dashboard


class SpendingCategory(BaseModel):
    category_id: int | None
    name: str
    color: str
    amount: float
    percentage: float


class BudgetOverview(BaseModel):
    total_budget: float
    spent: float
    remaining: float
    percent: float


class DashboardSummary(BaseModel):
    month: str
    currency: Currency
    total_balance: float
    income: float
    expenses: float
    net: float
    recent_transactions: list[TransactionOut]
    spending_by_category: list[SpendingCategory]
    budget: BudgetOverview


class CashflowPoint(BaseModel):
    label: str
    income: float
    expenses: float
    net: float


class CashflowOut(BaseModel):
    period: Literal["week", "month", "year"]
    currency: Currency
    start: date
    end: date
    total_income: float
    total_expenses: float
    points: list[CashflowPoint]
