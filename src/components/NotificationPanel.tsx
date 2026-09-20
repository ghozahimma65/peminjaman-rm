import { useState, useEffect } from "react";
import { Icons } from "./Icons";
import { NotificationRow, getNotifications, markAsRead } from "../lib/database/notificationService";

interface NotificationPanelProps {
  onClose: () => void;
  onNavigate: (page: string) => void;
  onRead: () => void;
}

export function NotificationPanel({ onClose, onNavigate, onRead }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const data = await getNotifications();
        setNotifications(data);
      } catch (err: unknown) {
        setErrorMsg((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  const handleNotificationClick = async (notif: NotificationRow) => {
    if (!notif.isRead) {
      try {
        await markAsRead(notif.id);
        onRead();
        // Update local state to reflect read visually
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      } catch (err) {
        console.error("Failed to mark as read", err);
      }
    }
    
    // Navigate to relevant page
    onNavigate("daftar-peminjaman");
    onClose();
  };

  return (
    <div className="notification-panel">
      <div className="notification-header">
        <h4>Notifikasi</h4>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>
      <div className="notification-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>Memuat notifikasi...</div>
        ) : errorMsg ? (
          <div style={{ padding: '16px', textAlign: 'center', color: '#ef4444' }}>Gagal memuat: {errorMsg}</div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>Belum ada notifikasi.</div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              role="button"
              tabIndex={0}
              title="Klik untuk membuka Daftar Peminjaman"
              className={`notification-item ${notif.type === 'TERLAMBAT' ? 'danger' : 'warning'}`}
              style={{
                opacity: notif.isRead ? 0.6 : 1,
                cursor: 'pointer',
                borderLeft: notif.isRead ? '4px solid #d1d5db' : (notif.type === 'TERLAMBAT' ? '4px solid #ef4444' : '4px solid #f59e0b'),
                transition: 'background 0.15s',
              }}
              onClick={() => handleNotificationClick(notif)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleNotificationClick(notif); }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#f8fafc'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
            >
              <div className="notification-icon">
                <Icons.AlertCircle />
              </div>
              <div className="notification-content">
                <p style={{ margin: 0 }}>
                  <strong>{notif.type === 'TERLAMBAT' ? 'Terlambat: ' : 'Reminder: '}</strong> 
                  {notif.message}
                </p>
                <span className="time">{new Date(notif.createdAt).toLocaleString('id-ID')}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
