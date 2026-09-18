import { LoginLog } from "../types";
import { Badge } from "../components/ui/Badge";

export function LogLogin({ logs }: { logs: LoginLog[] }) {
  return (
    <div className="logs-container">
      <div className="logs-card">
        <h3>Log Aktivitas Login (In-Memory)</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="logs-table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center">Belum ada aktivitas.</td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <tr key={index}>
                    <td>{log.time}</td>
                    <td>{log.username}</td>
                    <td>{log.role}</td>
                    <td>
                      <Badge variant={log.status === 'Berhasil' ? 'success' : 'danger'}>
                        {log.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
