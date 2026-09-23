# 13 — Arsitektur Sistem

---

## Gambaran Arsitektur

```
┌────────────────────────────────────────────────────────────────┐
│                      TAURI 2 APPLICATION                       │
│                                                                │
│  ┌──────────────────────────────────┐   ┌───────────────────┐  │
│  │        FRONTEND (WebView)         │   │  RUST BACKEND     │  │
│  │                                  │   │                   │  │
│  │  ┌──────────────────────────┐    │   │  ┌─────────────┐  │  │
│  │  │       React 19           │    │   │  │  Tauri Core │  │  │
│  │  │  + TypeScript 5.8        │    │   │  │  (Rust)     │  │  │
│  │  │  + Tailwind CSS 4        │    │   │  └──────┬──────┘  │  │
│  │  └──────────┬───────────────┘    │   │         │         │  │
│  │             │                    │   │  ┌──────▼──────┐  │  │
│  │  ┌──────────▼───────────────┐    │   │  │   Plugins   │  │  │
│  │  │     Tauri JS API         │◄───┼───►  │  - SQL      │  │  │
│  │  │  (@tauri-apps/*)         │    │   │  │  - Store    │  │  │
│  │  └──────────────────────────┘    │   │  │  - FS       │  │  │
│  │                                  │   │  │  - Dialog   │  │  │
│  │  ┌──────────────────────────┐    │   │  │  - Opener   │  │  │
│  │  │   Service Layer (TS)     │    │   │  └──────┬──────┘  │  │
│  │  │  authService.ts          │    │   │         │         │  │
│  │  │  peminjamanService.ts    │    │   │  ┌──────▼──────┐  │  │
│  │  │  pengembalianService.ts  │    │   │  │   SQLite DB │  │  │
│  │  │  notificationService.ts  │    │   │  │ rekam_medis │  │  │
│  │  │  laporanService.ts       │    │   │  │    .db      │  │  │
│  │  │  exportService.ts        │    │   │  └─────────────┘  │  │
│  │  └──────────────────────────┘    │   │                   │  │
│  └──────────────────────────────────┘   └───────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## Pola Arsitektur

### 1. Desktop Application (Tauri)

Tauri adalah framework yang menggabungkan:
- **Rust** sebagai backend native (sistem operasi, file, database)
- **WebView** (browser engine bawaan OS) sebagai frontend renderer

Keunggulan: ukuran build jauh lebih kecil dari Electron karena menggunakan browser engine OS.

### 2. Layered Architecture (Frontend)

```
src/
├── pages/          ← UI Layer (React components per halaman)
├── components/     ← Shared UI components
├── context/        ← State Management (React Context)
├── lib/
│   ├── auth/       ← Auth Service Layer
│   ├── database/   ← Database Service Layer
│   ├── statusHelper.ts ← Business Logic
│   └── exportService.ts ← Export Logic
├── types/          ← Type definitions
└── constants.ts    ← App constants
```

### 3. State Management

Tidak menggunakan library state management eksternal (Redux, Zustand, dll.).
Menggunakan **React Context API**:
- `AuthContext`: menyimpan state user yang sedang login
- State lokal `useState` di setiap halaman untuk data UI

### 4. Routing / Navigation

Tidak menggunakan React Router. Navigasi menggunakan **state-based rendering** di `App.tsx`:
```typescript
const [activePage, setActivePage] = useState("dashboard");
// Setiap komponen menerima onNavigate prop
```

### 5. Database Access Pattern

```typescript
// Singleton pattern untuk koneksi database
let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = await Database.load(DB_PATH);
  }
  return dbInstance;
}
```

---

## Aliran Data dalam Aplikasi

```
User Action (UI)
    ↓
React Component (pages/)
    ↓
Service Function (lib/database/ atau lib/auth/)
    ↓
Tauri SQL Plugin (@tauri-apps/plugin-sql)
    ↓
SQLite Database (rekam_medis.db)
    ↑
Response (TypeScript typed rows)
    ↑
State Update (setState)
    ↑
UI Re-render
```

---

## Teknologi per Layer

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| Desktop Framework | Tauri | 2.x |
| UI Framework | React | 19.x |
| Bahasa | TypeScript | 5.8.x |
| CSS | Tailwind CSS | 4.x |
| Build Tool | Vite | 7.x |
| Database | SQLite (via Tauri plugin) | - |
| ORM | Tidak ada (raw SQL) | - |
| Auth Hashing | bcryptjs | 3.0.x |
| Excel Export | ExcelJS | 4.4.x |
| PDF Export | jsPDF + jspdf-autotable | 4.2.x + 5.0.x |
| Session Store | @tauri-apps/plugin-store | 2.4.x |
| File Dialog | @tauri-apps/plugin-dialog | 2.7.x |
| File Write | @tauri-apps/plugin-fs | 2.5.x |
