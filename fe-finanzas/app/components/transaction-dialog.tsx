"use client";

import { useState, type FormEvent } from "react";
import type { Account, Category, TransactionPayload, TransactionType } from "../lib/api";
import { todayInputValue } from "../lib/format";
import { Icon } from "./icons";
import { Modal } from "./modal";

interface TransactionDialogProps {
  categories: Category[];
  accounts: Account[];
  saving: boolean;
  error: string | null;
  onSave: (payload: TransactionPayload) => void;
  onClose: () => void;
}

export function TransactionDialog({
  categories,
  accounts,
  saving,
  error,
  onSave,
  onClose,
}: TransactionDialogProps) {
  const [type, setType] = useState<TransactionType>("expense");
  const categoriesForType = categories.filter((category) => category.kind === type);
  const [categoryId, setCategoryId] = useState(
    () => String(categories.find((category) => category.kind === "expense")?.id ?? ""),
  );

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
      category_id: category ? Number(category) : null,
      account_id: account ? Number(account) : null,
      date: date ? new Date(`${date}T12:00:00`).toISOString() : undefined,
      notes: notes || null,
    });
  }

  return (
    <Modal title="Add a transaction" kicker="KEEP IT UP TO DATE" onClose={onClose}>
      <form onSubmit={handleSubmit} className="dialog-form">
        <label className="form-label">
          Name
          <input name="name" placeholder="e.g. Weekend groceries" required autoFocus />
        </label>
        <div className="form-row">
          <label className="form-label">
            Amount
            <div className="amount-input">
              <span>$</span>
              <input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required />
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
            <select name="account_id" defaultValue={String(accounts[0]?.id ?? "")}>
              <option value="">No account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="form-label">
          Date
          <input name="date" type="date" defaultValue={todayInputValue()} />
        </label>
        <label className="form-label">
          Notes <span className="optional-label">Optional</span>
          <textarea name="notes" rows={2} placeholder="Anything worth remembering?" />
        </label>
        <p className="form-hint">
          {accounts.length
            ? "The selected account balance, and the dashboard total, update automatically when you save."
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
            <Icon name="plus" size={17} />
            {saving ? "Saving…" : "Add transaction"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
