import type { Budget, Cashflow, CashflowPeriod, DashboardSummary, Transaction } from "../lib/api";
import {
  categoryColor,
  categoryTone,
  formatCompactCurrency,
  formatMoney,
  formatTransactionDate,
  moneyParts,
} from "../lib/format";
import { Icon, resolveCategoryIcon } from "./icons";

const rangeOptions: { label: string; value: CashflowPeriod }[] = [
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
];

const chartWidth = 630;
const chartHeight = 111;

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

function chartY(value: number, max: number): number {
  return chartHeight - (value / max) * (chartHeight - 8);
}

function chartX(index: number, count: number): number {
  return count <= 1 ? chartWidth / 2 : (index / (count - 1)) * chartWidth;
}

function sampleLabels(points: Cashflow["points"]): string[] {
  if (points.length <= 7) return points.map((point) => point.label);
  return Array.from({ length: 7 }, (_, index) => {
    const pointIndex = Math.round((index / 6) * (points.length - 1));
    return points[pointIndex].label;
  });
}

function SplitAmount({ value }: { value: number | null }) {
  if (value === null) return <>—</>;
  const parts = moneyParts(value);
  return (
    <>
      {parts.whole}
      <span>.{parts.fraction}</span>
    </>
  );
}

interface OverviewViewProps {
  summary: DashboardSummary | null;
  cashflow: Cashflow | null;
  budgets: Budget[];
  transactions: Transaction[];
  query: string;
  range: CashflowPeriod;
  onRangeChange: (range: CashflowPeriod) => void;
  onAddTransaction: () => void;
  onViewTransactions: () => void;
  onViewBudgets: () => void;
  onToggleBalance: () => void;
  showBalance: boolean;
  cashflowLoading: boolean;
  transactionsLoading: boolean;
  connected: boolean;
  dateLabel: string;
  greeting: string;
}

export function OverviewView({
  summary,
  cashflow,
  budgets,
  transactions,
  query,
  range,
  onRangeChange,
  onAddTransaction,
  onViewTransactions,
  onViewBudgets,
  onToggleBalance,
  showBalance,
  cashflowLoading,
  transactionsLoading,
  connected,
  dateLabel,
  greeting,
}: OverviewViewProps) {
  const spending = summary?.spending_by_category ?? [];
  const displaySpending =
    spending.length > 4
      ? [
          ...spending.slice(0, 3),
          {
            category_id: null,
            name: "Other",
            color: "gray",
            amount: spending.slice(3).reduce((total, item) => total + item.amount, 0),
            percentage: spending.slice(3).reduce((total, item) => total + item.percentage, 0),
          },
        ]
      : spending;

  let gradientCursor = 0;
  const donutStops = displaySpending.map((item) => {
    const end = Math.min(100, gradientCursor + item.percentage);
    const stop = `${categoryColor(item.color)} ${gradientCursor}% ${end}%`;
    gradientCursor = end;
    return stop;
  });
  if (gradientCursor < 100) donutStops.push(`#edf0eb ${gradientCursor}% 100%`);
  const donutBackground = displaySpending.length
    ? `conic-gradient(${donutStops.join(", ")})`
    : "#edf0eb";

  const points = cashflow?.points ?? [];
  const chartMax = niceMax(
    Math.max(1, ...points.flatMap((point) => [point.income, point.expenses])),
  );
  const coordinates = points.map((point, index) => ({
    x: chartX(index, points.length),
    incomeY: chartY(point.income, chartMax),
    expensesY: chartY(point.expenses, chartMax),
  }));
  const incomeLine = coordinates.map((point) => `${point.x},${point.incomeY}`).join(" ");
  const expensesLine = coordinates.map((point) => `${point.x},${point.expensesY}`).join(" ");
  const incomeArea = coordinates.length
    ? `M${coordinates.map((point) => `${point.x} ${point.incomeY}`).join(" L")} L${chartWidth} ${chartHeight} L0 ${chartHeight} Z`
    : "";
  const lastPoint = coordinates[coordinates.length - 1];
  const netCashflow = (cashflow?.total_income ?? 0) - (cashflow?.total_expenses ?? 0);
  const budget = summary?.budget;
  const miniBudgets = budgets.slice().sort((a, b) => b.percent - a.percent).slice(0, 3);
  const budgetPercent = Math.min(100, Math.max(0, budget?.percent ?? 0));

  return (
    <>
      <section className="welcome-row">
        <div>
          <p className="eyebrow">
            {dateLabel || "TODAY"} <span className="sun-mark">✳</span>
          </p>
          <h1>
            {greeting || "Welcome back"}, Jamie<span className="wave">✦</span>
          </h1>
          <p className="welcome-subtitle">Here&apos;s what&apos;s happening with your money.</p>
        </div>
        <button className="button button-dark" onClick={onAddTransaction}>
          <Icon name="plus" size={18} /> Add transaction
        </button>
      </section>

      <section className="overview-grid" aria-label="Financial overview">
        <article className={`balance-card ${!connected ? "is-stale" : ""}`}>
          <div className="balance-topline">
            <span>
              Total balance{" "}
              <button
                className="balance-eye"
                aria-label={showBalance ? "Hide balance" : "Show balance"}
                onClick={onToggleBalance}
              >
                <Icon name="eye" size={16} />
              </button>
            </span>
            <span className="balance-period">
              <span className="live-dot" /> {connected ? "Synced with your accounts" : "API unavailable"}
            </span>
          </div>
          <div className="balance-amount">
            {showBalance ? <SplitAmount value={summary?.total_balance ?? null} /> : "••••••"}
          </div>
          <div className="balance-foot">
            <span className={`balance-change ${(summary?.net ?? 0) < 0 ? "negative" : ""}`}>
              <Icon name={(summary?.net ?? 0) >= 0 ? "arrow-up-right" : "arrow-down-left"} size={14} />
              {summary ? formatMoney(summary.net) : "—"}
            </span>
            <span>net this month</span>
          </div>
          <div className="balance-chart" aria-hidden="true">
            <svg viewBox="0 0 500 95" preserveAspectRatio="none">
              <defs>
                <linearGradient id="balanceFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#b5f276" stopOpacity=".26" />
                  <stop offset="100%" stopColor="#b5f276" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 77 C30 72 43 80 68 65 S105 70 130 53 S164 69 191 43 S226 57 248 47 S286 53 312 34 S350 47 375 28 S412 39 435 20 S472 24 500 8 V95 H0Z"
                fill="url(#balanceFill)"
              />
              <path
                d="M0 77 C30 72 43 80 68 65 S105 70 130 53 S164 69 191 43 S226 57 248 47 S286 53 312 34 S350 47 375 28 S412 39 435 20 S472 24 500 8"
                fill="none"
                stroke="#b5f276"
                strokeWidth="2.5"
              />
            </svg>
          </div>
          <div className="balance-card-decoration" />
        </article>

        <article className="stat-card income-card">
          <div className="stat-heading">
            <span className="stat-icon income-icon">
              <Icon name="arrow-down-left" size={18} />
            </span>
            <span className="stat-month-tag">This month</span>
          </div>
          <p className="stat-label">Income</p>
          <p className="stat-amount">
            <SplitAmount value={summary?.income ?? null} />
          </p>
          <div className="stat-foot">
            <span className={(summary?.net ?? 0) >= 0 ? "trend-up" : "trend-down"}>
              {(summary?.net ?? 0) >= 0 ? "↗" : "↘"} {summary ? formatMoney(summary.net) : "—"}
            </span>
            <span>net this month</span>
          </div>
        </article>

        <article className="stat-card expense-card">
          <div className="stat-heading">
            <span className="stat-icon expense-icon">
              <Icon name="arrow-up-right" size={18} />
            </span>
            <span className="stat-month-tag">This month</span>
          </div>
          <p className="stat-label">Spent</p>
          <p className="stat-amount">
            <SplitAmount value={summary?.expenses ?? null} />
          </p>
          <div className="stat-foot">
            <span className={(budget?.percent ?? 0) > 100 ? "trend-down" : "trend-up"}>
              {(budget?.percent ?? 0) > 100 ? "↘" : "↗"} {budget ? `${Math.round(budget.percent)}%` : "—"}
            </span>
            <span>of monthly budget</span>
          </div>
        </article>
      </section>

      <section className="middle-grid">
        <article className="panel cashflow-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">YOUR MONEY, IN MOTION</p>
              <h2>Cash flow</h2>
            </div>
            <div className="range-switch" role="group" aria-label="Cash flow time range">
              {rangeOptions.map((option) => (
                <button
                  key={option.value}
                  className={range === option.value ? "selected" : ""}
                  onClick={() => onRangeChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="cashflow-summary" aria-busy={cashflowLoading}>
            <strong>
              {cashflow ? `${netCashflow >= 0 ? "+" : ""}${formatMoney(netCashflow)}` : "—"}
            </strong>
            <span className={netCashflow >= 0 ? "cashflow-positive" : "cashflow-negative"}>
              {netCashflow >= 0 ? "↗" : "↘"} net cash flow
            </span>
            <span className="summary-caption">
              {cashflow ? `${formatMoney(cashflow.total_income)} in · ${formatMoney(cashflow.total_expenses)} out` : "Loading…"}
            </span>
          </div>
          <div className={`chart-wrap ${cashflowLoading ? "is-loading" : ""}`}>
            <div className="chart-y-labels">
              {[1, 0.75, 0.5, 0.25, 0].map((fraction) => (
                <span key={fraction}>{formatCompactCurrency(chartMax * fraction)}</span>
              ))}
            </div>
            <div className="chart-main">
              <div className="chart-grid">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              {points.length > 0 ? (
                <svg
                  className="cashflow-chart"
                  viewBox={`0 0 ${chartWidth} 130`}
                  preserveAspectRatio="none"
                  role="img"
                  aria-label="Cash flow trend"
                >
                  <defs>
                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#83a992" stopOpacity=".19" />
                      <stop offset="100%" stopColor="#83a992" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {incomeArea && <path d={incomeArea} fill="url(#chartGradient)" />}
                  <polyline
                    points={expensesLine}
                    fill="none"
                    stroke="#c9a178"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="4 4"
                    vectorEffect="non-scaling-stroke"
                  />
                  <polyline
                    points={incomeLine}
                    fill="none"
                    stroke="#477963"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  {lastPoint && (
                    <circle
                      cx={lastPoint.x}
                      cy={lastPoint.incomeY}
                      r="4"
                      fill="#fff"
                      stroke="#477963"
                      strokeWidth="2.5"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                </svg>
              ) : (
                <div className="chart-empty">No cash-flow data for this period yet.</div>
              )}
              <div className="chart-x-labels">
                {sampleLabels(points).map((label, index) => (
                  <span key={`${label}-${index}`}>{label}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="chart-legend">
            <span>
              <i className="legend-dot income-legend" /> Income{" "}
              <strong>{formatMoney(cashflow?.total_income ?? 0)}</strong>
            </span>
            <span>
              <i className="legend-dot expense-legend" /> Expenses{" "}
              <strong>{formatMoney(cashflow?.total_expenses ?? 0)}</strong>
            </span>
          </div>
        </article>

        <article className="panel spending-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">WHERE IT GOES</p>
              <h2>Spending</h2>
            </div>
            <button className="round-more" aria-label="View transactions" onClick={onViewTransactions}>
              <Icon name="arrow-right" size={17} />
            </button>
          </div>
          <div className="spending-content">
            <div className="donut-chart" style={{ background: donutBackground }}>
              <div className="donut-center">
                <strong>{summary ? formatMoney(summary.expenses) : "—"}</strong>
                <span>Total spent</span>
              </div>
            </div>
            <div className="spending-legend">
              {displaySpending.length ? (
                displaySpending.map((item) => (
                  <div key={item.name}>
                    <i className="spend-dot" style={{ background: categoryColor(item.color) }} />
                    <span>{item.name}</span>
                    <strong>{Math.round(item.percentage)}%</strong>
                  </div>
                ))
              ) : (
                <span className="legend-empty">No spending yet.</span>
              )}
            </div>
          </div>
          <button className="text-link" onClick={onViewTransactions}>
            View spending breakdown <span>→</span>
          </button>
        </article>
      </section>

      <section className="bottom-grid">
        <article className="panel transactions-panel">
          <div className="panel-heading transaction-heading">
            <div>
              <p className="section-kicker">{query ? "SEARCH RESULTS" : "THE LATEST"}</p>
              <h2>{query ? `Results for “${query}”` : "Recent transactions"}</h2>
            </div>
            <button className="text-link" onClick={onViewTransactions}>
              See all <span>→</span>
            </button>
          </div>
          <div className="transaction-table">
            <div className="table-header">
              <span>TRANSACTION</span>
              <span>CATEGORY</span>
              <span>DATE</span>
              <span>AMOUNT</span>
            </div>
            {transactionsLoading ? (
              <div className="empty-state">Loading transactions…</div>
            ) : transactions.length ? (
              transactions.map((transaction) => (
                <div className="transaction-row" key={transaction.id}>
                  <span className="transaction-name">
                    <i
                      className={`transaction-icon ${categoryTone(transaction.category?.color)}`}
                    >
                      <Icon name={resolveCategoryIcon(transaction.category?.icon)} size={17} />
                    </i>
                    <strong>{transaction.name}</strong>
                  </span>
                  <span className="category-cell">{transaction.category?.name ?? "Uncategorized"}</span>
                  <span className="date-cell">{formatTransactionDate(transaction.date)}</span>
                  <span className={`amount-cell ${transaction.type}`}>
                    {transaction.type === "income" ? "+" : "−"}
                    {formatMoney(transaction.amount)}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-state">
                {query ? `No transactions found for “${query}”.` : "No transactions yet."}
              </div>
            )}
          </div>
        </article>

        <article className="panel budget-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">STAY ON TRACK</p>
              <h2>Monthly budget</h2>
            </div>
            <button className="round-more" aria-label="Manage budgets" onClick={onViewBudgets}>
              <Icon name="arrow-right" size={17} />
            </button>
          </div>
          <div className="budget-total">
            <strong>{budget ? formatMoney(budget.spent) : "—"}</strong>
            <span> of {budget ? formatMoney(budget.total_budget) : "—"}</span>
          </div>
          <div className="budget-progress">
            <span style={{ width: `${budgetPercent}%` }} />
          </div>
          <div className="budget-caption">
            <span>
              {budget
                ? budget.remaining >= 0
                  ? `${formatMoney(budget.remaining)} left to spend`
                  : `${formatMoney(Math.abs(budget.remaining))} over budget`
                : "No budget yet"}
            </span>
            <strong>{budget ? `${Math.round(budget.percent)}%` : "—"}</strong>
          </div>
          <div className="budget-divider" />
          <div className="budget-mini-list">
            {miniBudgets.length ? (
              miniBudgets.map((item) => (
                <div key={item.id}>
                  <i className={`budget-category-icon ${categoryTone(item.category?.color)}`}>
                    <Icon name={resolveCategoryIcon(item.category?.icon)} size={15} />
                  </i>
                  <span>{item.category?.name ?? "Other"}</span>
                  <div className="mini-track">
                    <i style={{ width: `${Math.min(100, Math.max(0, item.percent))}%` }} />
                  </div>
                  <strong>{formatMoney(item.spent)}</strong>
                </div>
              ))
            ) : (
              <div className="budget-empty">Create a budget to track your categories.</div>
            )}
          </div>
          <button className="text-link budget-link" onClick={onViewBudgets}>
            Manage budgets <span>→</span>
          </button>
        </article>
      </section>

      <footer className="dashboard-footer">
        <span>
          Made for your next chapter <i>✳</i>
        </span>
        <span>
          {connected ? "Connected to FastAPI" : "Waiting for the API"}{" "}
          <i className={connected ? "footer-sync" : "footer-sync offline"} />
        </span>
      </footer>
    </>
  );
}
