import React from "react";
import { Icons } from "../Icons";

export interface ModalProps {
  isOpen: boolean;
  title: string;
  description?: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
}

export function Modal({ 
  isOpen, title, description, onClose, onConfirm, 
  confirmText = "Ya", cancelText = "Batal", isDanger = false, isLoading = false 
}: ModalProps) {
  if (!isOpen) return null;

  const isLogout = title.toLowerCase().includes("logout");
  const isReturn = title.toLowerCase().includes("pengembalian");
  const isDownload = title.toLowerCase().includes("unduh");
  const iconClass = isDanger || isLogout ? "bg-red-600" : isReturn ? "bg-amber-400" : isDownload ? "bg-cyan-500" : "bg-yellow-400";
  const confirmClass = "w-full rounded-2xl bg-[#345344] px-5 py-3.5 text-base font-semibold text-white shadow-[0_8px_18px_rgba(52,83,68,0.2)] transition hover:bg-[#2b4539] disabled:cursor-not-allowed disabled:opacity-60";
  const cancelClass = "w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-base font-medium text-slate-600 shadow-[0_3px_10px_rgba(15,23,42,0.06)] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/35 px-4 backdrop-blur-[2px]" onMouseDown={onClose}>
      <div
        className="flex w-full max-w-[400px] flex-col rounded-[26px] bg-white shadow-[0_22px_50px_rgba(15,23,42,0.18)]"
        style={{ maxHeight: "90vh" }}
        onMouseDown={event => event.stopPropagation()}
      >
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-7 pt-7">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-white shadow-sm ${iconClass}`}>
            {isLogout ? <Icons.Logout /> : isReturn || isDownload ? <Icons.Pengembalian /> : isDanger ? <Icons.AlertCircle /> : <Icons.User />}
          </div>
          <h3 className="mt-6 text-center text-[22px] font-bold leading-tight text-slate-900">{title}</h3>
          {description && (
            <div className="mx-auto mt-3 w-full text-center text-[14px] leading-6 text-slate-500">
              {description}
            </div>
          )}
        </div>
        {/* Sticky footer — always visible */}
        <div className="shrink-0 px-7 pb-7 pt-4">
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
            <button type="button" className={confirmClass} onClick={onConfirm} disabled={isLoading}>{isLoading ? "Memproses..." : confirmText}</button>
            <button type="button" className={cancelClass} onClick={onClose} disabled={isLoading}>{cancelText}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
