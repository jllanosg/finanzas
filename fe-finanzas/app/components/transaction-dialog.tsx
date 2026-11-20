"use client";

import { useState, type FormEvent } from "react";
import type {
  Account,
  Category,
  Currency,
  Transaction,
  TransactionPayload,
  TransactionType,
} from "../lib/api";
import { dateInputValue, todayInputValue } from "../lib/format";
import { Icon } from "./icons";
import { Modal } from "./modal";

interface TransactionDialogProps {
  categories: Category[];
  accounts: Account[];
  currency: Currency;
  transaction?: Transaction;
  saving: boolean;
  error: string | null;
  onSave: (payload: TransactionPayload) => void;
  onClose: () => void;
}

export function TransactionDialog({
  categories,
  accounts,
  currency,
  transaction,
  saving,
  error,
  onSave,
  onClose,
}: TransactionDialogProps) {
  const [type, setType] = useState<TransactionType>(transaction?.type ?? "expense");
  const categoriesForType = categories.filter((category) => category.kind === type);
  const [categoryId, setCategoryId] = useState(() =>
    transaction?.category_id
      ? String(transaction.category_id)
      : String(categories.find((category) => category.kind === type)?.id ?? ""),
  );
  const [accountId, setAccountId] = useState(() => {
    if (transaction?.account_id) {
      const existing = accounts.find((account) => account.id === transaction.account_id);
      if (existing) return String(existing.id);
    }
    const matching = accounts.find((account) => account.currency === currency);
    return String(matching?.id ?? "");
  });
  const selectedAccount = accounts.find((account) => String(account.id) === accountId);
  const transactionCurrency =
    selectedAccount?.currency ?? transaction?.currency ?? currency;

  function changeType(nextType: TransactionType) {
    setType(nextType);
    setCategoryId(String(categories.find((category) => category.kind === nextType)?.id ?? ""));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const amount = Number(data.get("amount"));
    const category = String(data.get("category_id") ?? "");
    const account = String(data.get("account_id") ?? "");
    const date = String(data.get("date") ?? "");
    const notes = String(data.get("notes") ?? "").trim();

    if (!name || !Number.isFinite(amount) || amount <= 0) return;

    onSave({
      name,
      amount,
      type,
      currency: transactionCurrency,
      category_id: category ? Number(category) : null,
      account_id: account ? Number(account) : null,
      date: date ? new Date(`${date}T12:00:00`).toISOString() : undefined,
      notes: notes || null,
    });
  }

  return (
    <Modal
      title={transaction ? "Edit transaction" : "Add a transaction"}
      kicker={transaction ? "UPDATE THE DETAILS" : "KEEP IT UP TO DATE"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="dialog-form">
        <label className="form-label">
          Name
          <input
            name="name"
            placeholder="e.g. Weekend groceries"
            defaultValue={transaction?.name ?? ""}
            required
            autoFocus
          />
        </label>
        <div className="form-row">
          <label className="form-label">
            Amount
            <div className="amount-input">
              <span>$</span>
              <input
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                defaultValue={transaction?.amount ?? ""}
                required
              />
            </div>
          </label>
          <label className="form-label">
            Type
            <select name="type" value={type} onChange={(event) => changeType(event.target.value as TransactionType)}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>
        </div>
        <div className="form-row">
          <label className="form-label">
            Category
            <select
              name="category_id"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">Uncategorized</option>
              {categoriesForType.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-label">
            Account
            <select
              name="account_id"
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
            >
              <option value="">No account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} · {account.currency}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-row">
          <label className="form-label">
            Date
            <input
              name="date"
              type="date"
              defaultValue={
                transaction ? dateInputValue(transaction.date) : todayInputValue()
              }
            />
          </label>
          <label className="form-label">
            Currency
            <div className="static-field">
              {transactionCurrency}
              <span>{selectedAccount ? "from account" : "dashboard currency"}</span>
            </div>
          </label>
        </div>
        <label className="form-label">
          Notes <span className="optional-label">Optional</span>
          <textarea
            name="notes"
            rows={2}
            placeholder="Anything worth remembering?"
            defaultValue={transaction?.notes ?? ""}
          />
        </label>
        <p className="form-hint">
          {accounts.length
            ? "The selected account balance and the dashboard total update automatically. Transactions inherit the account currency."
            : "Add an account first if you want this transaction to change your total balance."}
        </p>
        {error && (
          <p className="form-error">
            <Icon name="alert" size={15} />
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="button button-light" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="button button-dark" disabled={saving}>
            <Icon name={transaction ? "check" : "plus"} size={17} />
            {saving ? "Saving…" : transaction ? "Save changes" : "Add transaction"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
