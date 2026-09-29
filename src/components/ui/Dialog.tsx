"use client";
import { useEffect, useRef, type ReactNode } from "react";
export function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = oldOverflow;
      trigger?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="dialog-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-content">
        <div className="section-heading">
          <h2 id="dialog-title">{title}</h2>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Mbyll dritaren"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
