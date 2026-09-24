import { useCallback, useEffect, useState } from "react";
import { Icons } from "../../components/Icons";
import {
  NotificationRowWithRm,
  getNotificationsWithRm,
  markAsRead,
  markAllAsRead,
} from "../../lib/database/notificationService";

type FilterType = "SEMUA" | "REMINDER" | "TERLAMBAT";

function formatNotifDate(createdAt: string): string {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return createdAt;
  const tanggal = d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const jam = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  return `${tanggal} • ${jam} WIB`;
}

function extractNomorRm(notif: NotificationRowWithRm): string {
  if (notif.nomorRm) return notif.nomorRm;
  const match = notif.message.match(/RM\s+([\w-]+)/i);
  return match ? match[1] : "-";
}

function getDaysLate(createdAt: string, type: string): number | null {
  if (type !== "TERLAMBAT") return null;
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const diff = Math.floor((now - created) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 1;
}

function IconWarningTriangle({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconCheckAll() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

interface SemuaNotifikasiProps {
  onNavigate: (page: string, nomorRm?: string) => void;
}

export function SemuaNotifikasi({ onNavigate }: SemuaNotifikasiProps) {
  const [notifications, setNotifications] = useState<NotificationRowWithRm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("SEMUA");
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const data = await getNotificationsWithRm();
      setNotifications(data);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Gagal memuat notifikasi.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => { await loadNotifications(); })().catch(console.error);
  }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Gagal tandai semua dibaca:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkOneRead = async (notif: NotificationRowWithRm) => {
    if (!notif.isRead) {
      try {
        await markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error("Gagal tandai dibaca:", err);
      }
    }
  };

  const handleDetail = async (notif: NotificationRowWithRm) => {
    await handleMarkOneRead(notif);
    onNavigate("daftar-peminjaman");
  };

  const handleKembalikan = async (notif: NotificationRowWithRm) => {
    await handleMarkOneRead(notif);
    const rm = extractNomorRm(notif);
    onNavigate("proses-pengembalian", rm !== "-" ? rm : "");
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const countSemua = notifications.length;
  const countReminder = notifications.filter((n) => n.type === "REMINDER").length;
  const countTerlambat = notifications.filter((n) => n.type === "TERLAMBAT").length;

  const filtered =
    activeFilter === "SEMUA"
      ? notifications
      : notifications.filter((n) => n.type === activeFilter);

  const FILTERS: { key: FilterType; label: string; count: number }[] = [
    { key: "SEMUA", label: "Semua", count: countSemua },
    { key: "REMINDER", label: "Jatuh Tempo", count: countReminder },
    { key: "TERLAMBAT", label: "Terlambat", count: countTerlambat },
  ];

  return (
    <div className="min-h-full space-y-4 pb-8 text-slate-800">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Icons.Bell />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Semua Notifikasi</h1>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600">
                  {unreadCount} Baru
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Pemberitahuan berkas dan peminjaman rekam medis
            </p>
          </div>
        </div>
        <button
          type="button"
          id="btn-tandai-semua-dibaca"
          onClick={() => void handleMarkAllRead()}
          disabled={markingAll || unreadCount === 0}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          <IconCheckAll />
          Tandai Semua Dibaca
        </button>
      </div>

      {/* Main Card */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-100 px-4 py-3">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              id={`filter-notif-${f.key.toLowerCase()}`}
              onClick={() => setActiveFilter(f.key)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                activeFilter === f.key
                  ? "bg-emerald-700 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {f.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                  activeFilter === f.key
                    ? "bg-white/25 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        <div className="divide-y divide-slate-50">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Memuat notifikasi...
            </div>
          ) : errorMsg ? (
            <div className="py-8 text-center text-xs text-red-500">{errorMsg}</div>
          ) : filtered.length === 0 ? (
            <div className="py-14 text-center">
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-300">
                <Icons.Bell />
              </span>
              <p className="text-sm font-semibold text-slate-500">Tidak ada notifikasi</p>
              <p className="mt-1 text-xs text-slate-400">
                {activeFilter === "SEMUA"
                  ? "Belum ada notifikasi saat ini."
                  : activeFilter === "REMINDER"
                  ? "Tidak ada notifikasi jatuh tempo."
                  : "Tidak ada notifikasi terlambat."}
              </p>
            </div>
          ) : (
            filtered.map((notif) => {
              const isTerlambat = notif.type === "TERLAMBAT";
              const nomorRm = extractNomorRm(notif);
              const daysLate = getDaysLate(notif.createdAt, notif.type);

              return (
                <div
                  key={notif.id}
                  className={`flex flex-wrap items-center gap-4 px-5 py-4 transition sm:flex-nowrap ${
                    isTerlambat
                      ? "bg-red-50/70 hover:bg-red-100/50"
                      : "hover:bg-slate-50"
                  } ${!notif.isRead ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-transparent"}`}
                >
                  {/* Icon */}
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      isTerlambat
                        ? "bg-red-100 text-red-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    <IconWarningTriangle />
                  </span>

                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-semibold ${isTerlambat ? "text-red-800" : "text-slate-800"}`}>
                        Peminjaman RM {nomorRm}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          isTerlambat
                            ? "bg-red-100 text-red-600"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {isTerlambat
                          ? daysLate
                            ? `terlambat ${daysLate} hari`
                            : "terlambat"
                          : "jatuh tempo"}
                      </span>
                      {!notif.isRead && (
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {formatNotifDate(notif.createdAt)}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex shrink-0 items-center gap-2">
                    {isTerlambat ? (
                      <button
                        type="button"
                        id={`btn-kembalikan-${notif.id}`}
                        onClick={() => void handleKembalikan(notif)}
                        className="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-[10px] font-semibold text-white transition hover:bg-red-700 cursor-pointer"
                      >
                        <Icons.Pengembalian />
                        Segera Kembalikan
                      </button>
                    ) : (
                      <>
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                          Jatuh Tempo
                        </span>
                        <button
                          type="button"
                          id={`btn-detail-${notif.id}`}
                          onClick={() => void handleDetail(notif)}
                          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer"
                        >
                          Detail
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <span className="text-[10px] text-slate-400">
            Menampilkan {filtered.length} notifikasi
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Sinkronisasi Realtime
          </span>
        </div>
      </div>
    </div>
  );
}
