"use client";

import { useState } from "react";
import type { Currency, Transaction, TransactionType } from "../lib/api";
import { categoryTone, formatMoney, formatTransactionDate } from "../lib/format";
import { Icon, resolveCategoryIcon } from "./icons";

type TypeFilter = "all" | TransactionType;

interface TransactionsViewProps {
  transactions: Transaction[];
  total: number;
  query: string;
  typeFilter: TypeFilter;
  loading: boolean;
  deletingId: number | null;
  bulkDeleting: boolean;
  currency: Currency;
  onTypeFilterChange: (filter: TypeFilter) => void;
  onAdd: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onBulkDelete: (ids: number[]) => Promise<boolean>;
}

const filters: { label: string; value: TypeFilter }[] = [
  { label: "All", value: "all" },
  { label: "Income", value: "income" },
  { label: "Expenses", value: "expense" },
];

export function TransactionsView({
  transactions,
  total,
  query,
  typeFilter,
  loading,
  deletingId,
  bulkDeleting,
  currency,
  onTypeFilterChange,
  onAdd,
  onEdit,
  onDelete,
  onBulkDelete,
}: TransactionsViewProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const selectedTransactions = transactions.filter((transaction) => selected.has(transaction.id));
  const allSelected =
    transactions.length > 0 && selectedTransactions.length === transactions.length;

  function toggleAll() {
    setSelected(
      allSelected ? new Set() : new Set(transactions.map((transaction) => transaction.id)),
    );
  }

  function toggleOne(id: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    if (!selectedTransactions.length) return;
    const deleted = await onBulkDelete(selectedTransactions.map((transaction) => transaction.id));
    if (deleted) setSelected(new Set());
  }

  return (
    <>
      <section className="view-heading">
        <div>
          <p className="eyebrow">
            EVERY MOVEMENT <span className="sun-mark">✳</span>
          </p>
          <h1>Transactions</h1>
          <p className="welcome-subtitle">
            {query
              ? `${total} ${currency} result${total === 1 ? "" : "s"} for “${query}”`
              : `${total} ${currency} transaction${total === 1 ? "" : "s"} in your workspace`}
          </p>
        </div>
        <button className="button button-dark" onClick={onAdd}>
          <Icon name="plus" size={18} /> Add transaction
        </button>
      </section>

      <section className="panel transactions-panel full">
        <div className="list-toolbar">
          <div className="filter-chips" role="group" aria-label="Filter transactions by type">
            {filters.map((filter) => (
              <button
                key={filter.value}
                className={`filter-chip ${typeFilter === filter.value ? "selected" : ""}`}
                onClick={() => onTypeFilterChange(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <span className="list-count">{loading ? "Loading…" : `${transactions.length} shown`}</span>
        </div>

        {selectedTransactions.length > 0 && (
          <div className="bulk-bar">
            <span>
              <strong>{selectedTransactions.length}</strong> selected
            </span>
            <div className="bulk-actions">
              <button className="text-link" onClick={() => setSelected(new Set())}>
                Clear
              </button>
              <button
                className="button button-danger"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
              >
                <Icon name="trash" size={15} />
                {bulkDeleting ? "Deleting…" : "Delete selected"}
              </button>
            </div>
          </div>
        )}

        <div className="transaction-table">
          <div className="table-header with-actions">
            <span className="checkbox-cell">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                disabled={!transactions.length}
                aria-label="Select all transactions"
              />
            </span>
            <span>TRANSACTION</span>
            <span>CATEGORY</span>
            <span>DATE</span>
            <span>AMOUNT</span>
            <span />
          </div>
          {loading ? (
            <div className="empty-state">Loading transactions…</div>
          ) : transactions.length ? (
            transactions.map((transaction) => (
              <div
                className={`transaction-row with-actions ${
                  selected.has(transaction.id) ? "selected" : ""
                }`}
                key={transaction.id}
              >
                <span className="checkbox-cell">
                  <input
                    type="checkbox"
                    checked={selected.has(transaction.id)}
                    onChange={() => toggleOne(transaction.id)}
                    aria-label={`Select ${transaction.name}`}
                  />
                </span>
                <span className="transaction-name">
                  <i className={`transaction-icon ${categoryTone(transaction.category?.color)}`}>
                    <Icon name={resolveCategoryIcon(transaction.category?.icon)} size={17} />
                  </i>
                  <span className="transaction-name-text">
                    <strong>{transaction.name}</strong>
                    {transaction.notes && <small>{transaction.notes}</small>}
                  </span>
                </span>
                <span className="category-cell">{transaction.category?.name ?? "Uncategorized"}</span>
                <span className="date-cell">{formatTransactionDate(transaction.date)}</span>
                <span className={`amount-cell ${transaction.type}`}>
                  {transaction.type === "income" ? "+" : "−"}
                  {formatMoney(transaction.amount, transaction.currency)}
                </span>
                <span className="row-actions">
                  <button
                    className="icon-action"
                    aria-label={`Edit ${transaction.name}`}
                    title="Edit transaction"
                    onClick={() => onEdit(transaction)}
                  >
                    <Icon name="edit" size={15} />
                  </button>
                  <button
                    className="icon-action danger"
                    aria-label={`Delete ${transaction.name}`}
                    title="Delete transaction"
                    disabled={deletingId === transaction.id || bulkDeleting}
                    onClick={() => onDelete(transaction)}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </span>
              </div>
            ))
          ) : (
            <div className="empty-state">
              {query
                ? `No transactions match “${query}”.`
                : "No transactions yet. Add your first one to get started."}
            </div>
          )}
        </div>

        <div className="list-footer">
          <span>
            Showing {transactions.length} of {total}
          </span>
          <span>
            Select multiple transactions with the checkboxes, or use the edit icon to update one.
          </span>
        </div>
      </section>
    </>
  );
}
