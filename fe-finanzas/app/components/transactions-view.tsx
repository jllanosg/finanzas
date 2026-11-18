import type { Transaction, TransactionType } from "../lib/api";
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
  onTypeFilterChange: (filter: TypeFilter) => void;
  onAdd: () => void;
  onDelete: (transaction: Transaction) => void;
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
  onTypeFilterChange,
  onAdd,
  onDelete,
}: TransactionsViewProps) {
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
              ? `${total} result${total === 1 ? "" : "s"} for “${query}”`
              : `${total} transaction${total === 1 ? "" : "s"} in your workspace`}
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

        <div className="transaction-table">
          <div className="table-header with-actions">
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
              <div className="transaction-row with-actions" key={transaction.id}>
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
                  {formatMoney(transaction.amount)}
                </span>
                <span className="row-actions">
                  <button
                    className="icon-action danger"
                    aria-label={`Delete ${transaction.name}`}
                    title="Delete transaction"
                    disabled={deletingId === transaction.id}
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
          <span>Amounts always stay positive in the API; the type defines the sign.</span>
        </div>
      </section>
    </>
  );
}
