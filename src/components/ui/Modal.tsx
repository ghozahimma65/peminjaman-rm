import React from "react";

export interface ModalProps {
  isOpen: boolean;
  title: string;
  description?: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string | null;
  isDanger?: boolean;
  isLoading?: boolean;
  variant?: "edit" | "delete" | "logout" | "return" | "download" | "cancel" | "notfound" | "success" | "save";
  secondaryAction?: () => void;
  secondaryText?: string;
}

export function Modal({
  isOpen,
  title,
  description,
  onClose,
  onConfirm,
  confirmText = "Ya",
  cancelText = "Tidak",
  isDanger = false,
  isLoading = false,
  variant,
  secondaryAction,
  secondaryText,
}: ModalProps) {
  if (!isOpen) return null;

  const t = title.toLowerCase();
  const inferredVariant =
    variant ||
    (t.includes("logout")
      ? "logout"
      : t.includes("hapus") || isDanger
      ? "delete"
      : t.includes("edit")
      ? "edit"
      : t.includes("kembalikan") || t.includes("pengembalian")
      ? "return"
      : t.includes("unduh")
      ? "download"
      : t.includes("batal")
      ? "cancel"
      : t.includes("tidak ditemukan")
      ? "notfound"
      : t.includes("ringkasan") || t.includes("simpan") || t.includes("berhasil")
      ? "success"
      : "edit");

  const renderIcon = () => {
    switch (inferredVariant) {
      case "edit":
        return (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400 text-white shadow-sm">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
        );
      case "delete":
        return (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-sm">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </div>
        );
      case "logout":
        return (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-sm">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>
        );
      case "cancel":
        return (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-red-600 bg-white text-red-600 shadow-sm">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        );
      case "notfound":
        return (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="3">
              <circle cx="12" cy="12" r="9" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
        );
      case "return":
        return (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              <polyline points="12 11 12 17 9 14" />
              <polyline points="12 17 15 14" />
            </svg>
          </div>
        );
      case "download":
        return (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#345344] text-white shadow-sm">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
        );
      case "success":
      case "save":
      default:
        return (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        );
    }
  };

  const handlePrimary = () => {
    if (onConfirm) onConfirm();
    else onClose();
  };

  const handleSecondary = () => {
    if (secondaryAction) secondaryAction();
    else onClose();
  };

  const showCancelBtn = cancelText !== null && cancelText !== "";

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/35 px-4 backdrop-blur-[2px]"
      onMouseDown={onClose}
    >
      <div
        className="flex w-full max-w-[380px] flex-col rounded-[26px] bg-white p-7 text-center shadow-[0_20px_50px_rgba(15,23,42,0.18)]"
        style={{ maxHeight: "90vh" }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto">
          {renderIcon()}
          <h3 className="mt-5 text-center text-[22px] font-bold leading-tight text-slate-900">{title}</h3>
          {description && (
            <div className="mx-auto mt-2 w-full text-center text-sm leading-6 text-slate-500">
              {description}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 w-full">
          <button
            type="button"
            className="w-full rounded-xl bg-[#345344] py-3.5 px-5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(52,83,68,0.2)] transition hover:bg-[#2b4539] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handlePrimary}
            disabled={isLoading}
          >
            {isLoading ? "Memproses..." : confirmText}
          </button>

          {showCancelBtn && (
            <button
              type="button"
              className="w-full rounded-xl border border-slate-200 bg-white py-3.5 px-5 text-sm font-medium text-slate-600 shadow-[0_2px_5px_rgba(15,23,42,0.04)] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleSecondary}
              disabled={isLoading}
            >
              {secondaryText || cancelText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

