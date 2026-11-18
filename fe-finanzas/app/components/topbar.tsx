"use client";

import { useEffect, useRef } from "react";
import { Icon } from "./icons";

interface TopbarProps {
  activeView: string;
  query: string;
  onQueryChange: (value: string) => void;
  onNotifications: () => void;
  syncing: boolean;
}

export function Topbar({
  activeView,
  query,
  onQueryChange,
  onNotifications,
  syncing,
}: TopbarProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>My workspace</span>
        <span className="breadcrumb-slash">/</span>
        <strong>{activeView}</strong>
        {syncing && <span className="sync-state">Syncing…</span>}
      </div>
      <div className="topbar-actions">
        <label className="search-box">
          <Icon name="search" size={17} />
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search transactions..."
            aria-label="Search transactions"
          />
          <kbd>⌘ K</kbd>
        </label>
        <button className="icon-button notification-button" aria-label="Notifications" onClick={onNotifications}>
          <Icon name="bell" size={19} />
          <span className="notification-dot" />
        </button>
        <button className="top-avatar" aria-label="Open profile">
          JD
        </button>
      </div>
    </header>
  );
}
