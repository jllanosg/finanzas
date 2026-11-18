const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const API_BASE_URL = rawBaseUrl.replace(/\/$/, "");
export const API_DOCS_URL = `${API_BASE_URL.replace(/\/api\/v1$/, "")}/docs`;

export type TransactionType = "income" | "expense";
export type CategoryKind = TransactionType;
export type AccountType = "checking" | "savings" | "credit" | "cash" | "investment";
export type CashflowPeriod = "week" | "month" | "year";

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  institution: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  kind: CategoryKind;
  created_at: string;
}

export interface Transaction {
  id: number;
  name: string;
  amount: number;
  type: TransactionType;
  date: string;
  notes: string | null;
  category_id: number | null;
  account_id: number | null;
  category: Category | null;
  created_at: string;
}

export interface Budget {
  id: number;
  category_id: number;
  month: string;
  amount: number;
  category: Category | null;
  spent: number;
  remaining: number;
  percent: number;
}

export interface SpendingCategory {
  category_id: number | null;
  name: string;
  color: string;
  amount: number;
  percentage: number;
}

export interface BudgetOverview {
  total_budget: number;
  spent: number;
  remaining: number;
  percent: number;
}

export interface DashboardSummary {
  month: string;
  total_balance: number;
  income: number;
  expenses: number;
  net: number;
  recent_transactions: Transaction[];
  spending_by_category: SpendingCategory[];
  budget: BudgetOverview;
}

export interface CashflowPoint {
  label: string;
  income: number;
  expenses: number;
  net: number;
}

export interface Cashflow {
  period: CashflowPeriod;
  start: string;
  end: string;
  total_income: number;
  total_expenses: number;
  points: CashflowPoint[];
}

export interface TransactionPayload {
  name: string;
  amount: number;
  type: TransactionType;
  date?: string;
  notes?: string | null;
  category_id?: number | null;
  account_id?: number | null;
}

export interface AccountPayload {
  name: string;
  type: AccountType;
  balance: number;
  currency?: string;
  institution?: string | null;
  is_active?: boolean;
}

export interface BudgetPayload {
  category_id: number;
  month: string;
  amount: number;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getErrorMessage(body: unknown): string {
  if (typeof body === "object" && body !== null && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (typeof item === "object" && item !== null && "msg" in item) {
            return String((item as { msg: unknown }).msg);
          }
          return String(item);
        })
        .join(". ");
    }
  }
  return "The API request failed.";
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    throw new ApiError(getErrorMessage(body), response.status);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  return parseResponse<T>(response);
}

function queryString(params: Record<string, string | number | undefined>): string {
  const values = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") values.set(key, String(value));
  });
  const query = values.toString();
  return query ? `?${query}` : "";
}

export function listAccounts(signal?: AbortSignal): Promise<Account[]> {
  return request<Account[]>("/accounts", { signal });
}

export function createAccount(payload: AccountPayload): Promise<Account> {
  return request<Account>("/accounts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAccount(id: number, payload: Partial<AccountPayload>): Promise<Account> {
  return request<Account>(`/accounts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteAccount(id: number): Promise<void> {
  return request<void>(`/accounts/${id}`, { method: "DELETE" });
}

export function listCategories(signal?: AbortSignal): Promise<Category[]> {
  return request<Category[]>("/categories", { signal });
}

export interface TransactionQuery {
  search?: string;
  type?: TransactionType;
  categoryId?: number;
  accountId?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export async function listTransactions(
  params: TransactionQuery = {},
  signal?: AbortSignal,
): Promise<{ items: Transaction[]; total: number }> {
  const path = `/transactions${queryString({
    search: params.search,
    type: params.type,
    category_id: params.categoryId,
    account_id: params.accountId,
    start_date: params.startDate,
    end_date: params.endDate,
    limit: params.limit ?? 100,
    offset: params.offset,
  })}`;
  const response = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store", signal });
  const total = Number(response.headers.get("X-Total-Count") ?? 0);
  const items = await parseResponse<Transaction[]>(response);
  return { items, total };
}

export function createTransaction(payload: TransactionPayload): Promise<Transaction> {
  return request<Transaction>("/transactions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteTransaction(id: number): Promise<void> {
  return request<void>(`/transactions/${id}`, { method: "DELETE" });
}

export function listBudgets(month: string, signal?: AbortSignal): Promise<Budget[]> {
  return request<Budget[]>(`/budgets${queryString({ month })}`, { signal });
}

export function createBudget(payload: BudgetPayload): Promise<Budget> {
  return request<Budget>("/budgets", {
    method: "POST",
    body: JSON.stringify({ ...payload, month: `${payload.month.slice(0, 7)}-01` }),
  });
}

export function updateBudget(id: number, payload: Partial<BudgetPayload>): Promise<Budget> {
  return request<Budget>(`/budgets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteBudget(id: number): Promise<void> {
  return request<void>(`/budgets/${id}`, { method: "DELETE" });
}

export function getDashboardSummary(month?: string, signal?: AbortSignal): Promise<DashboardSummary> {
  return request<DashboardSummary>(`/dashboard/summary${queryString({ month })}`, { signal });
}

export function getCashflow(period: CashflowPeriod, signal?: AbortSignal): Promise<Cashflow> {
  return request<Cashflow>(`/dashboard/cashflow${queryString({ period })}`, { signal });
}
