from datetime import UTC, date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(UTC)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class Account(TimestampMixin, Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False, default="checking")
    balance: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    institution: Mapped[str | None] = mapped_column(String(120), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="account", passive_deletes=True
    )


class Category(TimestampMixin, Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False, unique=True)
    icon: Mapped[str] = mapped_column(String(40), nullable=False, default="tag")
    color: Mapped[str] = mapped_column(String(20), nullable=False, default="green")
    kind: Mapped[str] = mapped_column(String(10), nullable=False, default="expense")

    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="category", passive_deletes=True
    )
    budgets: Mapped[list["Budget"]] = relationship(
        back_populates="category", cascade="all, delete-orphan", passive_deletes=True
    )


class Transaction(TimestampMixin, Base):
    __tablename__ = "transactions"
    __table_args__ = (Index("ix_transactions_date_type", "date", "type"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    type: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    currency: Mapped[str] = mapped_column(
        String(3), nullable=False, default="USD", server_default="USD", index=True
    )
    date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, index=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    account_id: Mapped[int | None] = mapped_column(
        ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True
    )

    category: Mapped[Category | None] = relationship(back_populates="transactions")
    account: Mapped[Account | None] = relationship(back_populates="transactions")


class Budget(TimestampMixin, Base):
    __tablename__ = "budgets"
    __table_args__ = (
        UniqueConstraint(
            "category_id", "month", "currency", name="uq_budgets_category_month_currency"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="CASCADE"), nullable=False
    )
    month: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(
        String(3), nullable=False, default="USD", server_default="USD"
    )

    category: Mapped[Category] = relationship(back_populates="budgets")
