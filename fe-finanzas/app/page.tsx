"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";

type IconName =
  | "overview"
  | "transactions"
  | "budgets"
  | "goals"
  | "accounts"
  | "settings"
  | "help"
  | "search"
  | "bell"
  | "chevron"
  | "plus"
  | "arrow-up-right"
  | "arrow-down-left"
  | "more"
  | "coffee"
  | "home"
  | "shopping"
  | "transport"
  | "utilities"
  | "calendar"
  | "close"
  | "eye"
  | "sparkle";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    overview: <><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="5" rx="2" /><rect x="13" y="10" width="8" height="11" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /></>,
    transactions: <><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /><path d="M5 5h14" /></>,
    budgets: <><path d="M4 19V5" /><path d="M4 19h17" /><path d="m7 15 4-4 3 2 6-7" /><path d="M16 6h4v4" /></>,
    goals: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
    accounts: <><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M3 10h18" /><path d="M7 15h3" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2Z" transform="translate(-1 -1)" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.5 2.5 0 1 1 4.3 1.8c-1.2 1.1-1.9 1.5-1.9 3" /><path d="M12 17h.01" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    chevron: <path d="m7 10 5 5 5-5" />,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    "arrow-up-right": <><path d="M7 17 17 7" /><path d="M8 7h9v9" /></>,
    "arrow-down-left": <><path d="M7 7 17 17" /><path d="M16 17H7V8" /></>,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    coffee: <><path d="M10 2v2" /><path d="M14 2v2" /><path d="M4 8h15v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z" /><path d="M19 10h1a2 2 0 1 1 0 4h-1" /></>,
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1Z" /></>,
    shopping: <><path d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L22 8H6" /><circle cx="10" cy="21" r="1" /><circle cx="18" cy="21" r="1" /></>,
    transport: <><path d="M5 17h14l1-6-2-5H6l-2 5 1 6Z" /><path d="M5 12h14" /><path d="M7 17v2m10-2v2" /><circle cx="8" cy="14.5" r=".5" /><circle cx="16" cy="14.5" r=".5" /></>,
    utilities: <><path d="M13 2 4 14h7l-1 8 10-13h-7Z" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
    sparkle: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z" /></>,
  };

  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

type Transaction = {
  name: string;
  category: string;
  date: string;
  amount: number;
  icon: IconName;
  color: string;
  type: "income" | "expense";
};

const initialTransactions: Transaction[] = [
  { name: "Whole Foods Market", category: "Groceries", date: "Today, 10:42 AM", amount: -84.32, icon: "shopping", color: "lavender", type: "expense" },
  { name: "Monthly salary", category: "Income", date: "Today, 9:00 AM", amount: 4_850, icon: "arrow-down-left", color: "mint", type: "income" },
  { name: "Blue Bottle Coffee", category: "Food & drink", date: "Yesterday", amount: -6.75, icon: "coffee", color: "peach", type: "expense" },
  { name: "Apartment rent", category: "Housing", date: "Oct 1, 2026", amount: -1_650, icon: "home", color: "blue", type: "expense" },
  { name: "Uber ride", category: "Transport", date: "Sep 30, 2026", amount: -18.4, icon: "transport", color: "gold", type: "expense" },
];

const navItems: { label: string; icon: IconName }[] = [
  { label: "Overview", icon: "overview" },
  { label: "Transactions", icon: "transactions" },
  { label: "Budgets", icon: "budgets" },
  { label: "Goals", icon: "goals" },
  { label: "Accounts", icon: "accounts" },
];

const chartData = {
  Week: { total: "$2,840.65", change: "+12.8%", labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], line: "0,114 70,102 140,109 210,72 280,84 350,44 420,58 490,22 560,35 630,14" },
  Month: { total: "$8,420.50", change: "+8.2%", labels: ["1 Oct", "5 Oct", "10 Oct", "15 Oct", "20 Oct", "25 Oct", "Today"], line: "0,102 70,92 140,103 210,63 280,81 350,48 420,67 490,30 560,43 630,12" },
  Year: { total: "$24,680.25", change: "+18.6%", labels: ["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"], line: "0,112 70,97 140,107 210,75 280,83 350,57 420,69 490,37 560,49 630,14" },
};

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(value));

export default function Home() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [range, setRange] = useState<keyof typeof chartData>("Month");
  const [query, setQuery] = useState("");
  const [showBalance, setShowBalance] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [notice, setNotice] = useState(false);

  const filteredTransactions = useMemo(() => transactions.filter((transaction) =>
    `${transaction.name} ${transaction.category}`.toLowerCase().includes(query.toLowerCase()),
  ), [transactions, query]);

  function addTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const amount = Number(formData.get("amount"));
    const type = String(formData.get("type")) as "income" | "expense";
    const name = String(formData.get("name")).trim();
    const category = String(formData.get("category"));
    setTransactions((current) => [{
      name,
      category,
      date: "Just now",
      amount: type === "income" ? amount : -amount,
      icon: category === "Housing" ? "home" : category === "Transport" ? "transport" : category === "Income" ? "arrow-down-left" : "shopping",
      color: "mint",
      type,
    }, ...current]);
    setShowDialog(false);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="Quesito home">
          <span className="brand-mark"><span /><span /><span /><span /></span>
          <span>Quesito<span className="brand-period">.</span></span>
        </a>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button key={item.label} className={`nav-item ${activeNav === item.label ? "active" : ""}`} onClick={() => setActiveNav(item.label)}>
              <Icon name={item.icon} size={19} /><span>{item.label}</span>
              {item.label === "Transactions" && <span className="nav-count">5</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-promo">
            <div className="promo-icon"><Icon name="sparkle" size={19} /></div>
            <p>Your money,<br />with a little more <em>meaning.</em></p>
            <button className="promo-link" onClick={() => setActiveNav("Goals")}>Explore goals <span>↗</span></button>
            <div className="promo-orbit orbit-one" /><div className="promo-orbit orbit-two" />
          </div>
          <div className="utility-nav">
            <button className="nav-item" onClick={() => setActiveNav("Settings")}><Icon name="settings" size={19} /><span>Settings</span></button>
            <button className="nav-item" onClick={() => setActiveNav("Help & support")}><Icon name="help" size={19} /><span>Help &amp; support</span></button>
          </div>
          <button className="profile-card" onClick={() => setActiveNav("Settings")}>
            <span className="avatar">JD</span><span className="profile-copy"><strong>Jamie Davis</strong><small>Personal account</small></span><Icon name="more" size={19} />
          </button>
        </div>
      </aside>

      <main className="main-area" id="overview">
        <header className="topbar">
          <div className="breadcrumb"><span>My workspace</span><span className="breadcrumb-slash">/</span><strong>{activeNav}</strong></div>
          <div className="topbar-actions">
            <label className="search-box"><Icon name="search" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search anything..." aria-label="Search transactions" /><kbd>⌘ K</kbd></label>
            <button className={`icon-button notification-button ${notice ? "has-notice" : ""}`} aria-label="Notifications" onClick={() => setNotice((current) => !current)}><Icon name="bell" size={19} /><span className="notification-dot" /></button>
            <button className="top-avatar" aria-label="Open profile" onClick={() => setActiveNav("Settings")}>JD</button>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="welcome-row">
            <div><p className="eyebrow">SUNDAY, NOVEMBER 1, 2026 <span className="sun-mark">✳</span></p><h1>Good morning, Jamie<span className="wave">✦</span></h1><p className="welcome-subtitle">Here&apos;s what&apos;s happening with your money.</p></div>
            <button className="button button-dark" onClick={() => setShowDialog(true)}><Icon name="plus" size={18} /> Add transaction</button>
          </section>

          <section className="overview-grid" aria-label="Financial overview">
            <article className="balance-card">
              <div className="balance-topline"><span>Total balance <button className="balance-eye" aria-label={showBalance ? "Hide balance" : "Show balance"} onClick={() => setShowBalance((current) => !current)}><Icon name="eye" size={16} /></button></span><span className="balance-period"><span className="live-dot" /> Updated just now</span></div>
              <div className="balance-amount">{showBalance ? "$24,680" : "••••••"}<span>{showBalance ? ".25" : ""}</span></div>
              <div className="balance-foot"><span className="balance-change"><Icon name="arrow-up-right" size={14} /> 8.2%</span><span>vs. last month</span></div>
              <div className="balance-chart" aria-hidden="true"><svg viewBox="0 0 500 95" preserveAspectRatio="none"><defs><linearGradient id="balanceFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#b5f276" stopOpacity=".26" /><stop offset="100%" stopColor="#b5f276" stopOpacity="0" /></linearGradient></defs><path d="M0 77 C30 72 43 80 68 65 S105 70 130 53 S164 69 191 43 S226 57 248 47 S286 53 312 34 S350 47 375 28 S412 39 435 20 S472 24 500 8 V95 H0Z" fill="url(#balanceFill)" /><path d="M0 77 C30 72 43 80 68 65 S105 70 130 53 S164 69 191 43 S226 57 248 47 S286 53 312 34 S350 47 375 28 S412 39 435 20 S472 24 500 8" fill="none" stroke="#b5f276" strokeWidth="2.5" /></svg></div>
              <div className="balance-card-decoration" />
            </article>

            <article className="stat-card income-card"><div className="stat-heading"><span className="stat-icon income-icon"><Icon name="arrow-down-left" size={18} /></span><button className="more-button" aria-label="Income options"><Icon name="more" size={18} /></button></div><p className="stat-label">Income <span>This month</span></p><p className="stat-amount">$5,240<span>.00</span></p><div className="stat-foot"><span className="trend-up">↗ 12.4%</span><span>vs last month</span></div></article>

            <article className="stat-card expense-card"><div className="stat-heading"><span className="stat-icon expense-icon"><Icon name="arrow-up-right" size={18} /></span><button className="more-button" aria-label="Spending options"><Icon name="more" size={18} /></button></div><p className="stat-label">Spent <span>This month</span></p><p className="stat-amount">$2,184<span>.35</span></p><div className="stat-foot"><span className="trend-down">↘ 4.8%</span><span>vs last month</span></div></article>
          </section>

          <section className="middle-grid">
            <article className="panel cashflow-panel">
              <div className="panel-heading"><div><p className="section-kicker">YOUR MONEY, IN MOTION</p><h2>Cash flow</h2></div><div className="range-switch" role="group" aria-label="Cash flow time range">{(["Week", "Month", "Year"] as const).map((item) => <button key={item} className={range === item ? "selected" : ""} onClick={() => setRange(item)}>{item}</button>)}</div></div>
              <div className="cashflow-summary"><strong>{chartData[range].total}</strong><span className="cashflow-positive">↗ {chartData[range].change}</span><span className="summary-caption"> compared to previous {range.toLowerCase()}</span></div>
              <div className="chart-wrap"><div className="chart-y-labels"><span>$10k</span><span>$7.5k</span><span>$5k</span><span>$2.5k</span><span>$0</span></div><div className="chart-main"><div className="chart-grid"><i /><i /><i /><i /><i /></div><svg className="cashflow-chart" viewBox="0 0 630 130" preserveAspectRatio="none" role="img" aria-label={`${range} cash flow trend`}><defs><linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#83a992" stopOpacity=".19" /><stop offset="100%" stopColor="#83a992" stopOpacity="0" /></linearGradient></defs><path d={`M${chartData[range].line} L630 130 L0 130 Z`} fill="url(#chartGradient)"/><polyline points={chartData[range].line} fill="none" stroke="#477963" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/><circle cx="490" cy={range === "Week" ? "22" : range === "Month" ? "30" : "37"} r="4" fill="#fff" stroke="#477963" strokeWidth="2.5" vectorEffect="non-scaling-stroke" /></svg><div className="chart-x-labels">{chartData[range].labels.map((label) => <span key={label}>{label}</span>)}</div></div></div>
              <div className="chart-legend"><span><i className="legend-dot income-legend" /> Income <strong>$5,240</strong></span><span><i className="legend-dot expense-legend" /> Expenses <strong>$2,184</strong></span></div>
            </article>

            <article className="panel spending-panel"><div className="panel-heading"><div><p className="section-kicker">WHERE IT GOES</p><h2>Spending</h2></div><button className="round-more" aria-label="Spending options"><Icon name="more" size={18} /></button></div><div className="spending-content"><div className="donut-chart"><div className="donut-center"><strong>$2,184</strong><span>Total spent</span></div></div><div className="spending-legend"><div><i className="spend-dot housing-dot" /><span>Housing</span><strong>42%</strong></div><div><i className="spend-dot food-dot" /><span>Food</span><strong>26%</strong></div><div><i className="spend-dot lifestyle-dot" /><span>Lifestyle</span><strong>18%</strong></div><div><i className="spend-dot other-dot" /><span>Other</span><strong>14%</strong></div></div></div><button className="text-link" onClick={() => setActiveNav("Transactions")}>View spending breakdown <span>→</span></button></article>
          </section>

          <section className="bottom-grid">
            <article className="panel transactions-panel"><div className="panel-heading transaction-heading"><div><p className="section-kicker">THE LATEST</p><h2>Recent transactions</h2></div><button className="text-link" onClick={() => setActiveNav("Transactions")}>See all <span>→</span></button></div><div className="transaction-table"><div className="table-header"><span>TRANSACTION</span><span>CATEGORY</span><span>DATE</span><span>AMOUNT</span></div>{filteredTransactions.length ? filteredTransactions.slice(0, 5).map((transaction, index) => <div className="transaction-row" key={`${transaction.name}-${index}`}><span className="transaction-name"><i className={`transaction-icon ${transaction.color}`}><Icon name={transaction.icon} size={17} /></i><strong>{transaction.name}</strong></span><span className="category-cell">{transaction.category}</span><span className="date-cell">{transaction.date}</span><span className={`amount-cell ${transaction.type}`}>{transaction.type === "income" ? "+" : "−"}{money(transaction.amount)}</span></div>) : <div className="empty-state">No transactions found for “{query}”.</div>}</div></article>

            <article className="panel budget-panel"><div className="panel-heading"><div><p className="section-kicker">STAY ON TRACK</p><h2>Monthly budget</h2></div><button className="round-more" aria-label="Budget options"><Icon name="more" size={18} /></button></div><div className="budget-total"><strong>$2,184</strong><span> of $3,500</span></div><div className="budget-progress"><span /></div><div className="budget-caption"><span>$1,316 left to spend</span><strong>62%</strong></div><div className="budget-divider" /><div className="budget-mini-list"><div><i className="budget-category-icon housing-mini"><Icon name="home" size={15} /></i><span>Housing</span><div className="mini-track"><i style={{ width: "82%" }} /></div><strong>$1,650</strong></div><div><i className="budget-category-icon food-mini"><Icon name="shopping" size={15} /></i><span>Food</span><div className="mini-track"><i style={{ width: "48%" }} /></div><strong>$348</strong></div><div><i className="budget-category-icon utility-mini"><Icon name="utilities" size={15} /></i><span>Utilities</span><div className="mini-track"><i style={{ width: "27%" }} /></div><strong>$186</strong></div></div><button className="text-link budget-link" onClick={() => setActiveNav("Budgets")}>Manage budgets <span>→</span></button></article>
          </section>

          <footer className="dashboard-footer"><span>Made for your next chapter <i>✳</i></span><span>All accounts synced <i className="footer-sync" /></span></footer>
        </div>
      </main>

      {notice && <div className="toast" role="status"><span className="toast-check">✓</span> You&apos;re all caught up. Have a lovely day!</div>}

      {showDialog && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowDialog(false); }}><section className="transaction-modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div className="modal-heading"><div><p className="section-kicker">KEEP IT UP TO DATE</p><h2 id="dialog-title">Add a transaction</h2></div><button className="modal-close" onClick={() => setShowDialog(false)} aria-label="Close dialog"><Icon name="close" size={19} /></button></div><form onSubmit={addTransaction}><label className="form-label">Name<input name="name" placeholder="e.g. Weekend groceries" required autoFocus /></label><div className="form-row"><label className="form-label">Amount<div className="amount-input"><span>$</span><input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required /></div></label><label className="form-label">Type<select name="type"><option value="expense">Expense</option><option value="income">Income</option></select></label></div><label className="form-label">Category<select name="category"><option>Food &amp; drink</option><option>Groceries</option><option>Housing</option><option>Transport</option><option>Utilities</option><option>Income</option><option>Other</option></select></label><div className="modal-actions"><button type="button" className="button button-light" onClick={() => setShowDialog(false)}>Cancel</button><button type="submit" className="button button-dark"><Icon name="plus" size={17} /> Add transaction</button></div></form></section></div>}
    </div>
  );
}
