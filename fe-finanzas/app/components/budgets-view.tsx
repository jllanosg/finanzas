import type { Budget, Currency } from "../lib/api";
import { categoryTone, formatMoney, formatMonth } from "../lib/format";
import { Icon, resolveCategoryIcon } from "./icons";

interface BudgetsViewProps {
  budgets: Budget[];
  month: string;
  currency: Currency;
  loading: boolean;
  deletingId: number | null;
  onMonthChange: (month: string) => void;
  onAdd: () => void;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
}

export function BudgetsView({
  budgets,
  month,
  currency,
  loading,
  deletingId,
  onMonthChange,
  onAdd,
  onEdit,
  onDelete,
}: BudgetsViewProps) {
  const totalBudget = budgets.reduce((total, budget) => total + budget.amount, 0);
  const totalSpent = budgets.reduce((total, budget) => total + budget.spent, 0);
  const remaining = totalBudget - totalSpent;
  const percent = totalBudget ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <>
      <section className="view-heading">
        <div>
          <p className="eyebrow">
            PLAN WITH INTENTION <span className="sun-mark">✳</span>
          </p>
          <h1>Budgets</h1>
          <p className="welcome-subtitle">Set monthly limits and watch them update as you spend.</p>
        </div>
        <div className="view-heading-actions">
          <label className="month-picker">
            <Icon name="calendar" size={15} />
            <input
              type="month"
              value={month}
              onChange={(event) => onMonthChange(event.target.value)}
              aria-label="Budget month"
            />
          </label>
          <button className="button button-dark" onClick={onAdd}>
            <Icon name="plus" size={18} /> Add budget
          </button>
        </div>
      </section>

      <section className="panel budget-summary-card">
        <div className="budget-summary-copy">
          <p className="section-kicker">
            {formatMonth(month).toUpperCase()} · {currency}
          </p>
          <div className="budget-summary-amount">{formatMoney(totalSpent, currency)}</div>
          <p className="welcome-subtitle">
            spent of {formatMoney(totalBudget, currency)} across {budgets.length}{" "}
            {budgets.length === 1 ? "category" : "categories"}
          </p>
        </div>
        <div className="budget-summary-stats">
          <div>
            <span>Remaining</span>
            <strong className={remaining < 0 ? "negative" : ""}>
              {formatMoney(remaining, currency)}
            </strong>
          </div>
          <div>
            <span>Utilization</span>
            <strong>{Math.round(percent)}%</strong>
          </div>
        </div>
        <div className="budget-progress large">
          <span style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
        </div>
      </section>

      {loading ? (
        <section className="panel">
          <div className="empty-state">Loading budgets…</div>
        </section>
      ) : budgets.length ? (
        <section className="budgets-grid">
          {budgets.map((budget) => (
            <article className="panel budget-card" key={budget.id}>
              <div className="budget-card-heading">
                <span className={`budget-category-icon large ${categoryTone(budget.category?.color)}`}>
                  <Icon name={resolveCategoryIcon(budget.category?.icon)} size={18} />
                </span>
                <div className="budget-card-title">
                  <h2>{budget.category?.name ?? "Uncategorized"}</h2>
                  <span>{Math.round(budget.percent)}% used</span>
                </div>
                <div className="budget-card-actions">
                  <button
                    className="icon-action"
                    aria-label={`Edit ${budget.category?.name ?? "budget"}`}
                    title="Edit budget"
                    onClick={() => onEdit(budget)}
                  >
                    <Icon name="edit" size={15} />
                  </button>
                  <button
                    className="icon-action danger"
                    aria-label={`Delete ${budget.category?.name ?? "budget"}`}
                    title="Delete budget"
                    disabled={deletingId === budget.id}
                    onClick={() => onDelete(budget)}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </div>
              <div className="budget-card-amounts">
                <strong>{formatMoney(budget.spent, budget.currency)}</strong>
                <span>of {formatMoney(budget.amount, budget.currency)}</span>
              </div>
              <div className="budget-progress">
                <span
                  style={{ width: `${Math.min(100, Math.max(0, budget.percent))}%` }}
                  className={budget.percent > 100 ? "over-budget" : ""}
                />
              </div>
              <div className="budget-card-foot">
                <span>
                  {budget.remaining >= 0
                    ? `${formatMoney(budget.remaining, budget.currency)} left`
                    : `${formatMoney(Math.abs(budget.remaining), budget.currency)} over`}
                </span>
                <strong>{formatMoney(budget.amount, budget.currency)} limit</strong>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="panel empty-panel">
          <span className="empty-icon">
            <Icon name="budgets" size={26} />
          </span>
          <h2>
            No {currency} budgets for {formatMonth(month)}
          </h2>
          <p>Create a limit for a category and start tracking your pace.</p>
          <button className="button button-dark" onClick={onAdd}>
            <Icon name="plus" size={17} /> Create a budget
          </button>
        </section>
      )}
    </>
  );
}
