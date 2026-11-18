"use client";

import { useEffect, type ReactNode } from "react";
import { Icon } from "./icons";

interface ModalProps {
  title: string;
  kicker: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function Modal({ title, kicker, onClose, children, className = "" }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={`transaction-modal ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className="modal-heading">
          <div>
            <p className="section-kicker">{kicker}</p>
            <h2 id="dialog-title">{title}</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close dialog" type="button">
            <Icon name="close" size={19} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
