import { API_DOCS_URL } from "../lib/api";
import { Icon, type IconName } from "./icons";

export type View = "Overview" | "Transactions" | "Budgets" | "Accounts";

const navItems: { label: View; icon: IconName }[] = [
  { label: "Overview", icon: "overview" },
  { label: "Transactions", icon: "transactions" },
  { label: "Budgets", icon: "budgets" },
  { label: "Accounts", icon: "accounts" },
];

interface SidebarProps {
  activeView: View;
  onNavigate: (view: View) => void;
  transactionCount?: number;
}

export function Sidebar({ activeView, onNavigate, transactionCount }: SidebarProps) {
  return (
    <aside className="sidebar">
      <a className="brand" href="#overview" aria-label="Quesito home" onClick={() => onNavigate("Overview")}>
        <span className="brand-mark">
          <span />
          <span />
          <span />
          <span />
        </span>
        <span>
          Quesito<span className="brand-period">.</span>
        </span>
      </a>

      <div className="workspace-label">WORKSPACE</div>
      <nav className="primary-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`nav-item ${activeView === item.label ? "active" : ""}`}
            onClick={() => onNavigate(item.label)}
            aria-current={activeView === item.label ? "page" : undefined}
          >
            <Icon name={item.icon} size={19} />
            <span>{item.label}</span>
            {item.label === "Transactions" && Boolean(transactionCount) && (
              <span className="nav-count">{transactionCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-promo">
          <div className="promo-icon">
            <Icon name="sparkle" size={19} />
          </div>
          <p>
            Your money,
            <br />
            with a little more <em>meaning.</em>
          </p>
          <button className="promo-link" onClick={() => onNavigate("Budgets")}>
            Explore budgets <span>↗</span>
          </button>
          <div className="promo-orbit orbit-one" />
          <div className="promo-orbit orbit-two" />
        </div>
        <div className="utility-nav">
          <a className="nav-item" href={API_DOCS_URL} target="_blank" rel="noreferrer">
            <Icon name="help" size={19} />
            <span>API docs</span>
            <Icon name="external" size={13} />
          </a>
        </div>
        <div className="profile-card">
          <span className="avatar">JD</span>
          <span className="profile-copy">
            <strong>Jamie Davis</strong>
            <small>Personal workspace</small>
          </span>
          <Icon name="more" size={19} />
        </div>
      </div>
    </aside>
  );
}
