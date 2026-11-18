"use client";

import type { FormEvent } from "react";
import type { Account, AccountPayload, AccountType } from "../lib/api";
import { Icon } from "./icons";
import { Modal } from "./modal";

const accountTypes: { value: AccountType; label: string }[] = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "credit", label: "Credit card" },
  { value: "cash", label: "Cash" },
  { value: "investment", label: "Investment" },
];

interface AccountDialogProps {
  account?: Account;
  saving: boolean;
  error: string | null;
  onSave: (payload: AccountPayload) => void;
  onClose: () => void;
}

export function AccountDialog({ account, saving, error, onSave, onClose }: AccountDialogProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const balance = Number(data.get("balance"));
    if (!name || !Number.isFinite(balance)) return;

    onSave({
      name,
      type: String(data.get("type") ?? "checking") as AccountType,
      balance,
      currency: String(data.get("currency") ?? "USD").toUpperCase(),
      institution: String(data.get("institution") ?? "").trim() || null,
    });
  }

  return (
    <Modal title={account ? "Edit account" : "Add an account"} kicker="YOUR ACCOUNTS" onClose={onClose}>
      <form onSubmit={handleSubmit} className="dialog-form">
        <label className="form-label">
          Account name
          <input
            name="name"
            placeholder="e.g. Everyday Checking"
            defaultValue={account?.name ?? ""}
            required
            autoFocus
          />
        </label>
        <div className="form-row">
          <label className="form-label">
            Type
            <select name="type" defaultValue={account?.type ?? "checking"}>
              {accountTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-label">
            Currency
            <input
              name="currency"
              defaultValue={account?.currency ?? "USD"}
              minLength={3}
              maxLength={3}
              required
            />
          </label>
        </div>
        <label className="form-label">
          Current balance
          <div className="amount-input">
            <span>$</span>
            <input
              name="balance"
              type="number"
              step="0.01"
              placeholder="0.00"
              defaultValue={account?.balance ?? 0}
              required
            />
          </div>
        </label>
        <label className="form-label">
          Institution <span className="optional-label">Optional</span>
          <input
            name="institution"
            placeholder="e.g. Morrow Bank"
            defaultValue={account?.institution ?? ""}
          />
        </label>
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
            <Icon name={account ? "check" : "plus"} size={17} />
            {saving ? "Saving…" : account ? "Save account" : "Add account"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
