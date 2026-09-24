import { useState, useEffect } from "react";
import { Icons } from "./Icons";
import {
  NotificationRowWithRm,
  getNotificationsWithRm,
  markAsRead,
} from "../lib/database/notificationService";

interface NotificationPanelProps {
  onClose: () => void;
  onNavigate: (page: string, nomorRm?: string) => void;
  onRead: () => void;
}

function formatNotifDateShort(createdAt: string): string {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return createdAt;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function extractNomorRm(notif: NotificationRowWithRm): string {
  if (notif.nomorRm) return notif.nomorRm;
  const match = notif.message.match(/RM\s+([\w-]+)/i);
  return match ? match[1] : "-";
}

function IconWarningTriangle({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function NotificationPanel({ onClose, onNavigate, onRead }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<NotificationRowWithRm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const data = await getNotificationsWithRm();
        setNotifications(data);
      } catch (err: unknown) {
        setErrorMsg((err as Error).message || "Gagal memuat");
      } finally {
        setIsLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  const handleNotificationClick = async (notif: NotificationRowWithRm) => {
    if (!notif.isRead) {
      try {
        await markAsRead(notif.id);
        onRead();
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error("Failed to mark as read", err);
      }
    }

    if (notif.type === "TERLAMBAT") {
      const rm = extractNomorRm(notif);
      onNavigate("proses-pengembalian", rm !== "-" ? rm : "");
    } else {
      onNavigate("daftar-peminjaman");
    }
    onClose();
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  // Preview: tampilkan max 5 notifikasi di popover
  const preview = notifications.slice(0, 5);

  return (
    <div
      className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      style={{ minWidth: 300 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900">Notifikasi</span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
              {unreadCount} Baru
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
        >
          ×
        </button>
      </div>

      {/* List */}
      <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">Memuat notifikasi...</div>
        ) : errorMsg ? (
          <div className="py-6 text-center text-xs text-red-500">{errorMsg}</div>
        ) : notifications.length === 0 ? (
          <div className="py-10 text-center">
            <span className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-300">
              <Icons.Bell />
            </span>
            <p className="text-xs text-slate-400">Belum ada notifikasi.</p>
          </div>
        ) : (
          preview.map((notif) => {
            const isTerlambat = notif.type === "TERLAMBAT";
            const nomorRm = extractNomorRm(notif);
            return (
              <button
                key={notif.id}
                type="button"
                onClick={() => void handleNotificationClick(notif)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition cursor-pointer ${
                  isTerlambat
                    ? "bg-red-50/80 hover:bg-red-100/70"
                    : "hover:bg-slate-50"
                } ${!notif.isRead ? "border-l-2 border-l-emerald-500" : ""}`}
              >
                {/* Icon */}
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    isTerlambat
                      ? "bg-red-100 text-red-600"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  <IconWarningTriangle />
                </span>
                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold leading-snug ${isTerlambat ? "text-red-800" : "text-slate-800"}`}>
                    Peminjaman RM {nomorRm}
                  </p>
                  <p className={`mt-0.5 text-[10px] font-medium ${isTerlambat ? "text-red-600" : "text-slate-500"}`}>
                    {isTerlambat ? "terlambat" : "jatuh tempo"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {formatNotifDateShort(notif.createdAt)}
                  </p>
                </div>
                {/* Unread dot */}
                {!notif.isRead && (
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Footer link */}
      <div className="border-t border-slate-100 px-4 py-3 text-center">
        <button
          type="button"
          id="btn-lihat-semua-notifikasi"
          onClick={() => {
            onNavigate("semua-notifikasi");
            onClose();
          }}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer transition"
        >
          Lihat Semua Notifikasi
        </button>
      </div>
    </div>
  );
}
