import type { Account, AccountType } from "../lib/api";
import { formatMoney } from "../lib/format";
import { Icon } from "./icons";

const accountTypeLabels: Record<AccountType, string> = {
  checking: "Checking",
  savings: "Savings",
  credit: "Credit card",
  cash: "Cash",
  investment: "Investment",
};

interface AccountsViewProps {
  accounts: Account[];
  loading: boolean;
  deletingId: number | null;
  onAdd: () => void;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

export function AccountsView({
  accounts,
  loading,
  deletingId,
  onAdd,
  onEdit,
  onDelete,
}: AccountsViewProps) {
  const totalBalance = accounts.reduce((total, account) => total + account.balance, 0);

  return (
    <>
      <section className="view-heading">
        <div>
          <p className="eyebrow">
            ALL IN ONE PLACE <span className="sun-mark">✳</span>
          </p>
          <h1>Accounts</h1>
          <p className="welcome-subtitle">
            Your active balances feed the total shown across the dashboard.
          </p>
        </div>
        <button className="button button-dark" onClick={onAdd}>
          <Icon name="plus" size={18} /> Add account
        </button>
      </section>

      <section className="panel accounts-summary-card">
        <span className="accounts-summary-icon">
          <Icon name="wallet" size={24} />
        </span>
        <div>
          <p className="section-kicker">TOTAL ACROSS ACTIVE ACCOUNTS</p>
          <div className="accounts-summary-amount">{formatMoney(totalBalance)}</div>
        </div>
        <div className="accounts-summary-count">
          <strong>{accounts.length}</strong>
          <span>active account{accounts.length === 1 ? "" : "s"}</span>
        </div>
      </section>

      {loading ? (
        <section className="panel">
          <div className="empty-state">Loading accounts…</div>
        </section>
      ) : accounts.length ? (
        <section className="accounts-grid">
          {accounts.map((account) => (
            <article className="panel account-card" key={account.id}>
              <div className="account-card-heading">
                <span className="account-card-icon">
                  <Icon name="accounts" size={20} />
                </span>
                <div className="budget-card-actions">
                  <button
                    className="icon-action"
                    aria-label={`Edit ${account.name}`}
                    title="Edit account"
                    onClick={() => onEdit(account)}
                  >
                    <Icon name="edit" size={15} />
                  </button>
                  <button
                    className="icon-action danger"
                    aria-label={`Delete ${account.name}`}
                    title="Delete account"
                    disabled={deletingId === account.id}
                    onClick={() => onDelete(account)}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </div>
              <h2>{account.name}</h2>
              <p className="account-institution">{account.institution || "No institution"}</p>
              <div className="account-card-footer">
                <span className="account-type-tag">{accountTypeLabels[account.type]}</span>
                <strong className={account.balance < 0 ? "negative" : ""}>
                  {formatMoney(account.balance)}
                </strong>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="panel empty-panel">
          <span className="empty-icon">
            <Icon name="accounts" size={26} />
          </span>
          <h2>No accounts yet</h2>
          <p>Add a checking, savings, or credit account to start building your picture.</p>
          <button className="button button-dark" onClick={onAdd}>
            <Icon name="plus" size={17} /> Add your first account
          </button>
        </section>
      )}
    </>
  );
}
