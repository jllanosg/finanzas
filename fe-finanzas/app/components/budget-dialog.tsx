"use client";

import { useState, type FormEvent } from "react";
import type { Budget, Category } from "../lib/api";
import { formatMonth } from "../lib/format";
import { Icon } from "./icons";
import { Modal } from "./modal";

interface BudgetDialogProps {
  month: string;
  categories: Category[];
  budget?: Budget;
  saving: boolean;
  error: string | null;
  onSave: (payload: { category_id: number; amount: number }) => void;
  onClose: () => void;
}

export function BudgetDialog({
  month,
  categories,
  budget,
  saving,
  error,
  onSave,
  onClose,
}: BudgetDialogProps) {
  const expenseCategories = categories.filter((category) => category.kind === "expense");
  const [categoryId, setCategoryId] = useState(
    () => String(budget?.category_id ?? expenseCategories[0]?.id ?? ""),
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(new FormData(event.currentTarget).get("amount"));
    if (!categoryId || !Number.isFinite(amount) || amount <= 0) return;
    onSave({ category_id: Number(categoryId), amount });
  }

  return (
    <Modal
      title={budget ? "Edit budget" : "Create a budget"}
      kicker={formatMonth(month)}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="dialog-form">
        <label className="form-label">
          Category
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            disabled={Boolean(budget)}
            required
          >
            {!expenseCategories.length && <option value="">No expense categories</option>}
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Monthly limit
          <div className="amount-input">
            <span>$</span>
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              defaultValue={budget?.amount ?? ""}
              required
              autoFocus
            />
          </div>
        </label>
        <p className="form-hint">
          Spending in this category during {formatMonth(month)} counts against this limit.
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
          <button type="submit" className="button button-dark" disabled={saving || !categoryId}>
            <Icon name={budget ? "check" : "plus"} size={17} />
            {saving ? "Saving…" : budget ? "Save budget" : "Create budget"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
