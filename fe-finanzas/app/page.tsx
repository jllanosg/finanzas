"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AccountDialog } from "./components/account-dialog";
import { AccountsView } from "./components/accounts-view";
import { BudgetDialog } from "./components/budget-dialog";
import { BudgetsView } from "./components/budgets-view";
import { Icon } from "./components/icons";
import { OverviewView } from "./components/overview-view";
import { Sidebar, type View } from "./components/sidebar";
import { Topbar } from "./components/topbar";
import { TransactionDialog } from "./components/transaction-dialog";
import { TransactionsView } from "./components/transactions-view";
import type {
  Account,
  AccountPayload,
  Budget,
  Cashflow,
  CashflowPeriod,
  Category,
  Currency,
  DashboardSummary,
  Transaction,
  TransactionPayload,
  TransactionType,
} from "./lib/api";
import {
  API_BASE_URL,
  ApiError,
  SUPPORTED_CURRENCIES,
  createAccount,
  createBudget,
  createTransaction,
  deleteAccount,
  deleteBudget,
  deleteTransaction,
  getCashflow,
  getDashboardSummary,
  listAccounts,
  listBudgets,
  listCategories,
  listTransactions,
  updateAccount,
  updateBudget,
} from "./lib/api";
import { currentMonthValue, formatLongDate, greetingFor } from "./lib/format";
import { useHydrated } from "./lib/use-hydrated";

type TypeFilter = "all" | TransactionType;

type DialogState =
  | { kind: "transaction" }
  | { kind: "budget"; budget?: Budget }
  | { kind: "account"; account?: Account }
  | null;

interface ToastState {
  message: string;
  tone: "success" | "error";
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof TypeError) {
    return `Could not reach the API at ${API_BASE_URL}. Is the FastAPI server running?`;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

export default function Home() {
  const [activeView, setActiveView] = useState<View>("Overview");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [overviewBudgets, setOverviewBudgets] = useState<Budget[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionTotal, setTransactionTotal] = useState(0);
  const [cashflow, setCashflow] = useState<Cashflow | null>(null);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [range, setRange] = useState<CashflowPeriod>("month");
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>("USD");
  const [showBalance, setShowBalance] = useState(true);
  const hydrated = useHydrated();
  const today = useMemo(() => (hydrated ? new Date() : null), [hydrated]);
  const effectiveMonth = selectedMonth ?? (hydrated ? currentMonthValue() : "");

  const availableCurrencies = useMemo(() => {
    const inUse = new Set(accounts.map((account) => account.currency));
    const matching = SUPPORTED_CURRENCIES.filter((option) => inUse.has(option));
    return matching.length ? matching : (["USD"] as Currency[]);
  }, [accounts]);
  const activeCurrency = availableCurrencies.includes(currency)
    ? currency
    : (availableCurrencies[0] ?? "USD");

  const [coreLoading, setCoreLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [budgetsLoading, setBudgetsLoading] = useState(true);
  const [cashflowLoading, setCashflowLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialog, setDialog] = useState<DialogState>(null);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((current) => current + 1), []);
  const closeDialog = useCallback(() => {
    setDialog(null);
    setDialogError(null);
  }, []);
  const pushToast = useCallback((message: string, tone: ToastState["tone"] = "success") => {
    setToast({ message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadCore() {
      setCoreLoading(true);
      try {
        const [summaryData, categoryData, accountData, budgetData] = await Promise.all([
          getDashboardSummary(activeCurrency, undefined, controller.signal),
          listCategories(controller.signal),
          listAccounts(controller.signal),
          listBudgets(currentMonthValue(), activeCurrency, controller.signal),
        ]);
        if (!active) return;
        setSummary(summaryData);
        setCategories(categoryData);
        setAccounts(accountData);
        setOverviewBudgets(budgetData);
        setError(null);
      } catch (loadError) {
        if (!active || isAbortError(loadError)) return;
        setError(errorMessage(loadError));
      } finally {
        if (active) setCoreLoading(false);
      }
    }

    loadCore();
    return () => {
      active = false;
      controller.abort();
    };
  }, [version, activeCurrency]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timer = setTimeout(
      async () => {
        setTransactionsLoading(true);
        try {
          const result = await listTransactions(
            {
              search: query.trim() || undefined,
              type: typeFilter === "all" ? undefined : typeFilter,
              currency: activeCurrency,
              limit: 100,
            },
            controller.signal,
          );
          if (!active) return;
          setTransactions(result.items);
          setTransactionTotal(result.total);
          setError(null);
        } catch (loadError) {
          if (!active || isAbortError(loadError)) return;
          setError(errorMessage(loadError));
        } finally {
          if (active) setTransactionsLoading(false);
        }
      },
      query.trim() ? 300 : 0,
    );

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, typeFilter, version, activeCurrency]);

  useEffect(() => {
    if (!effectiveMonth) return;
    const controller = new AbortController();
    let active = true;

    async function loadBudgets() {
      setBudgetsLoading(true);
      try {
        const data = await listBudgets(effectiveMonth, activeCurrency, controller.signal);
        if (!active) return;
        setBudgets(data);
        setError(null);
      } catch (loadError) {
        if (!active || isAbortError(loadError)) return;
        setError(errorMessage(loadError));
      } finally {
        if (active) setBudgetsLoading(false);
      }
    }

    loadBudgets();
    return () => {
      active = false;
      controller.abort();
    };
  }, [effectiveMonth, version, activeCurrency]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadCashflow() {
      setCashflowLoading(true);
      try {
        const data = await getCashflow(range, activeCurrency, controller.signal);
        if (!active) return;
        setCashflow(data);
        setError(null);
      } catch (loadError) {
        if (!active || isAbortError(loadError)) return;
        setError(errorMessage(loadError));
      } finally {
        if (active) setCashflowLoading(false);
      }
    }

    loadCashflow();
    return () => {
      active = false;
      controller.abort();
    };
  }, [range, version, activeCurrency]);

  const visibleSummary = summary?.currency === activeCurrency ? summary : null;
  const visibleCashflow = cashflow?.currency === activeCurrency ? cashflow : null;
  const visibleBudgets = useMemo(
    () => budgets.filter((budget) => budget.currency === activeCurrency),
    [budgets, activeCurrency],
  );
  const visibleOverviewBudgets = useMemo(
    () => overviewBudgets.filter((budget) => budget.currency === activeCurrency),
    [overviewBudgets, activeCurrency],
  );
  const visibleTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.currency === activeCurrency),
    [transactions, activeCurrency],
  );

  const overviewTransactions = useMemo(() => {
    if (query.trim()) return visibleTransactions.slice(0, 5);
    return visibleSummary?.recent_transactions ?? [];
  }, [query, visibleSummary, visibleTransactions]);

  const syncing =
    coreLoading || transactionsLoading || budgetsLoading || cashflowLoading;

  function navigate(view: View) {
    setActiveView(view);
  }

  function handleSearch(value: string) {
    setQuery(value);
    if (value.trim() && activeView !== "Overview" && activeView !== "Transactions") {
      setActiveView("Transactions");
    }
  }

  function openTransactionDialog() {
    setDialog({ kind: "transaction" });
    setDialogError(null);
  }

  function openBudgetDialog(budget?: Budget) {
    setDialog({ kind: "budget", budget });
    setDialogError(null);
  }

  function openAccountDialog(account?: Account) {
    setDialog({ kind: "account", account });
    setDialogError(null);
  }

  async function saveTransaction(payload: TransactionPayload) {
    setSaving(true);
    setDialogError(null);
    try {
      await createTransaction(payload);
      closeDialog();
      refresh();
      pushToast("Transaction added. Dashboard totals are up to date.");
    } catch (saveError) {
      setDialogError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function saveBudget(payload: { category_id: number; amount: number }) {
    if (dialog?.kind !== "budget") return;
    setSaving(true);
    setDialogError(null);
    try {
      if (dialog.budget) {
        await updateBudget(dialog.budget.id, { amount: payload.amount });
      } else {
        await createBudget({
          category_id: payload.category_id,
          month: effectiveMonth,
          amount: payload.amount,
          currency: activeCurrency,
        });
      }
      closeDialog();
      refresh();
      pushToast(dialog.budget ? "Budget updated." : "Budget created.");
    } catch (saveError) {
      setDialogError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function saveAccount(payload: AccountPayload) {
    if (dialog?.kind !== "account") return;
    setSaving(true);
    setDialogError(null);
    try {
      if (dialog.account) {
        await updateAccount(dialog.account.id, payload);
      } else {
        await createAccount(payload);
      }
      if (payload.currency) setCurrency(payload.currency);
      closeDialog();
      refresh();
      pushToast(dialog.account ? "Account updated." : "Account added.");
    } catch (saveError) {
      setDialogError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function removeTransaction(transaction: Transaction) {
    if (!window.confirm(`Delete “${transaction.name}”? This cannot be undone.`)) return;
    setDeletingId(transaction.id);
    try {
      await deleteTransaction(transaction.id);
      refresh();
      pushToast("Transaction deleted.");
    } catch (deleteError) {
      pushToast(errorMessage(deleteError), "error");
    } finally {
      setDeletingId(null);
    }
  }

  async function removeBudget(budget: Budget) {
    if (!window.confirm(`Delete the budget for “${budget.category?.name ?? "this category"}”?`)) {
      return;
    }
    setDeletingId(budget.id);
    try {
      await deleteBudget(budget.id);
      refresh();
      pushToast("Budget deleted.");
    } catch (deleteError) {
      pushToast(errorMessage(deleteError), "error");
    } finally {
      setDeletingId(null);
    }
  }

  async function removeAccount(account: Account) {
    if (
      !window.confirm(
        `Delete “${account.name}”? Its transactions will stay, but without an account.`,
      )
    ) {
      return;
    }
    setDeletingId(account.id);
    try {
      await deleteAccount(account.id);
      refresh();
      pushToast("Account deleted.");
    } catch (deleteError) {
      pushToast(errorMessage(deleteError), "error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        activeView={activeView}
        onNavigate={navigate}
        transactionCount={transactionsLoading ? undefined : transactionTotal}
      />
      <main className="main-area" id="overview">
        <Topbar
          activeView={activeView}
          query={query}
          onQueryChange={handleSearch}
          onNotifications={() => pushToast("You're all caught up. Have a lovely day!")}
          syncing={syncing}
          currency={activeCurrency}
          currencies={availableCurrencies}
          onCurrencyChange={setCurrency}
        />

        <div className="dashboard-content">
          {error && (
            <div className="connection-banner" role="alert">
              <span className="connection-icon">
                <Icon name="alert" size={19} />
              </span>
              <div>
                <strong>Connection issue</strong>
                <span>{error}</span>
              </div>
              <button className="button button-light" onClick={refresh}>
                <Icon name="refresh" size={15} /> Retry
              </button>
            </div>
          )}

          <div className="view-stage" key={activeView}>
            {activeView === "Overview" && (
              <OverviewView
                summary={visibleSummary}
                cashflow={visibleCashflow}
                budgets={visibleOverviewBudgets}
                transactions={overviewTransactions}
                query={query.trim()}
                range={range}
                onRangeChange={setRange}
                onAddTransaction={openTransactionDialog}
                onViewTransactions={() => setActiveView("Transactions")}
                onViewBudgets={() => setActiveView("Budgets")}
                onToggleBalance={() => setShowBalance((current) => !current)}
                showBalance={showBalance}
                cashflowLoading={cashflowLoading}
                transactionsLoading={transactionsLoading}
                connected={!error && Boolean(summary)}
                dateLabel={today ? formatLongDate(today) : ""}
                greeting={today ? greetingFor(today) : ""}
                currency={activeCurrency}
              />
            )}

            {activeView === "Transactions" && (
              <TransactionsView
                transactions={visibleTransactions}
                total={transactionsLoading ? visibleTransactions.length : transactionTotal}
                query={query.trim()}
                typeFilter={typeFilter}
                loading={transactionsLoading}
                deletingId={deletingId}
                currency={activeCurrency}
                onTypeFilterChange={setTypeFilter}
                onAdd={openTransactionDialog}
                onDelete={removeTransaction}
              />
            )}

            {activeView === "Budgets" && (
              <BudgetsView
                budgets={visibleBudgets}
                month={effectiveMonth}
                loading={budgetsLoading}
                deletingId={deletingId}
                currency={activeCurrency}
                onMonthChange={setSelectedMonth}
                onAdd={() => openBudgetDialog()}
                onEdit={openBudgetDialog}
                onDelete={removeBudget}
              />
            )}

            {activeView === "Accounts" && (
              <AccountsView
                accounts={accounts}
                loading={coreLoading}
                deletingId={deletingId}
                onAdd={() => openAccountDialog()}
                onEdit={openAccountDialog}
                onDelete={removeAccount}
              />
            )}
          </div>
        </div>
      </main>

      {toast && (
        <div className={`toast ${toast.tone}`} role="status">
          <span className="toast-check">{toast.tone === "success" ? "✓" : "!"}</span>
          {toast.message}
        </div>
      )}

      {dialog?.kind === "transaction" && (
        <TransactionDialog
          categories={categories}
          accounts={accounts}
          currency={activeCurrency}
          saving={saving}
          error={dialogError}
          onSave={saveTransaction}
          onClose={closeDialog}
        />
      )}

      {dialog?.kind === "budget" && (
        <BudgetDialog
          month={effectiveMonth}
          categories={categories}
          budget={dialog.budget}
          currency={activeCurrency}
          saving={saving}
          error={dialogError}
          onSave={saveBudget}
          onClose={closeDialog}
        />
      )}

      {dialog?.kind === "account" && (
        <AccountDialog
          account={dialog.account}
          saving={saving}
          error={dialogError}
          onSave={saveAccount}
          onClose={closeDialog}
        />
      )}
    </div>
  );
}
