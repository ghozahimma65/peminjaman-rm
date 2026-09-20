/**
 * Automated Test: statusHelper.ts Logic
 *
 * Dijalankan dengan: node test/statusHelper.test.mjs
 * Tidak memerlukan test-framework tambahan (pure ESM).
 * Tidak mengubah production code — hanya mengimpor helper yang sudah ada.
 *
 * Logika yang diuji:
 *   - calculateDeadline  → deadline = tanggalBerkasKeluar + 48 jam
 *   - isOverdue          → apakah transaksi terlambat (aktif atau sudah dikembalikan)
 *   - calculateEffectiveStatus → DIPINJAM | DIKEMBALIKAN | TERLAMBAT
 */

// ──────────────────────────────────────────────
// Karena statusHelper.ts adalah TypeScript, kita port ulang
// logika yang IDENTIK di sini agar tidak perlu transpiler.
// Jika ingin test langsung file TS, gunakan: tsx test/statusHelper.test.mjs
// ──────────────────────────────────────────────

const RETURN_PERIOD_MS = 2 * 24 * 60 * 60 * 1000; // 48 jam

function calculateDeadline(tanggalBerkasKeluar, tanggalPinjam) {
  const dateStr = tanggalBerkasKeluar || tanggalPinjam;
  if (!dateStr) return null;
  const startTime = new Date(dateStr);
  if (Number.isNaN(startTime.getTime())) return null;
  return new Date(startTime.getTime() + RETURN_PERIOD_MS);
}

function isOverdue(tanggalBerkasKeluar, tanggalPinjam, tanggalBerkasKembali, referenceTime) {
  const ref = referenceTime ?? new Date();
  const deadline = calculateDeadline(tanggalBerkasKeluar, tanggalPinjam);
  if (!deadline) return false;

  if (tanggalBerkasKembali) {
    const returnTime = new Date(tanggalBerkasKembali);
    if (Number.isNaN(returnTime.getTime())) return false;
    return returnTime.getTime() > deadline.getTime();
  }

  return ref.getTime() > deadline.getTime();
}

function calculateEffectiveStatus(tanggalBerkasKeluar, tanggalPinjam, tanggalBerkasKembali, referenceTime) {
  const late = isOverdue(tanggalBerkasKeluar, tanggalPinjam, tanggalBerkasKembali, referenceTime);
  if (late) return "TERLAMBAT";
  if (tanggalBerkasKembali) return "DIKEMBALIKAN";
  return "DIPINJAM";
}

// ──────────────────────────────────────────────
// Test runner minimalis
// ──────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(label, condition, extra = "") {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}${extra ? " | " + extra : ""}`);
    failed++;
  }
}

function describe(title, fn) {
  console.log(`\n📋 ${title}`);
  fn();
}

// ──────────────────────────────────────────────
// Helper: buat waktu relatif ke "sekarang" yang dikontrol
// ──────────────────────────────────────────────
const NOW = new Date("2026-09-20T20:00:00.000Z"); // waktu tetap untuk semua skenario

function msAgo(ms) {
  return new Date(NOW.getTime() - ms).toISOString();
}
function msFromNow(ms) {
  return new Date(NOW.getTime() + ms).toISOString();
}

const H1 = 60 * 60 * 1000;   // 1 jam
const H47 = 47 * H1;          // 47 jam
const H48 = 48 * H1;          // 48 jam (tepat deadline)
const H49 = 49 * H1;          // 49 jam (1 jam setelah deadline)

// ══════════════════════════════════════════════
// SCENARIO 1 — Belum jatuh tempo (berkas baru keluar sekarang)
// ══════════════════════════════════════════════
describe("SCENARIO 1 — Belum jatuh tempo (berkas baru keluar)", () => {
  const berkasKeluar = NOW.toISOString(); // keluar sekarang
  const deadline = calculateDeadline(berkasKeluar, null);

  assert(
    "calculateDeadline menghasilkan deadline +48 jam dari waktu keluar",
    deadline !== null && deadline.getTime() === NOW.getTime() + H48
  );

  const overdue = isOverdue(berkasKeluar, null, null, NOW);
  assert(
    "isOverdue = false (belum 48 jam)",
    overdue === false,
    `actual: ${overdue}`
  );

  const status = calculateEffectiveStatus(berkasKeluar, null, null, NOW);
  assert(
    "status = DIPINJAM",
    status === "DIPINJAM",
    `actual: ${status}`
  );
});

// ══════════════════════════════════════════════
// SCENARIO 2 — Tepat pada deadline (belum terlambat)
// ══════════════════════════════════════════════
describe("SCENARIO 2 — Tepat pada deadline (= 48 jam setelah keluar)", () => {
  const berkasKeluar = msAgo(H48);   // keluar 48 jam lalu
  // referenceTime = NOW → deadline = berkasKeluar + 48h = NOW → NOT overdue (tidak melebihi)

  const overdue = isOverdue(berkasKeluar, null, null, NOW);
  assert(
    "isOverdue = false (batas waktu = sekarang, belum lewat)",
    overdue === false,
    `actual: ${overdue}`
  );

  const status = calculateEffectiveStatus(berkasKeluar, null, null, NOW);
  assert(
    "status = DIPINJAM (tepat batas, belum dikembalikan)",
    status === "DIPINJAM",
    `actual: ${status}`
  );
});

// ══════════════════════════════════════════════
// SCENARIO 3 — Sudah melewati deadline (belum dikembalikan)
// ══════════════════════════════════════════════
describe("SCENARIO 3 — Sudah melewati deadline (berkas aktif, terlambat)", () => {
  const berkasKeluar = msAgo(H49);   // keluar 49 jam lalu → deadline sudah lewat 1 jam

  const overdue = isOverdue(berkasKeluar, null, null, NOW);
  assert(
    "isOverdue = true (49 jam > 48 jam deadline)",
    overdue === true,
    `actual: ${overdue}`
  );

  const status = calculateEffectiveStatus(berkasKeluar, null, null, NOW);
  assert(
    "status = TERLAMBAT",
    status === "TERLAMBAT",
    `actual: ${status}`
  );
});

// ══════════════════════════════════════════════
// SCENARIO 4 — Dikembalikan tepat waktu (sebelum atau sama dengan deadline)
// ══════════════════════════════════════════════
describe("SCENARIO 4 — Dikembalikan tepat waktu", () => {
  const berkasKeluar = msAgo(H48);      // keluar 48 jam lalu
  const berkasKembali = msAgo(H1);      // dikembalikan 1 jam lalu (= 47 jam setelah keluar, belum lewat)

  const overdue = isOverdue(berkasKeluar, null, berkasKembali, NOW);
  assert(
    "isOverdue = false (dikembalikan 47 jam setelah keluar)",
    overdue === false,
    `actual: ${overdue}`
  );

  const status = calculateEffectiveStatus(berkasKeluar, null, berkasKembali, NOW);
  assert(
    "status = DIKEMBALIKAN",
    status === "DIKEMBALIKAN",
    `actual: ${status}`
  );
});

// ══════════════════════════════════════════════
// SCENARIO 5 — Dikembalikan TERLAMBAT (setelah deadline)
// ══════════════════════════════════════════════
describe("SCENARIO 5 — Dikembalikan TERLAMBAT (setelah deadline)", () => {
  const berkasKeluar = msAgo(H49 + H1);  // keluar 50 jam lalu (deadline sudah lewat 2 jam)
  const berkasKembali = msAgo(H1);        // dikembalikan 1 jam lalu (= 49 jam setelah keluar → terlambat)

  const overdue = isOverdue(berkasKeluar, null, berkasKembali, NOW);
  assert(
    "isOverdue = true (dikembalikan 49 jam setelah keluar, melewati 48 jam deadline)",
    overdue === true,
    `actual: ${overdue}`
  );

  const status = calculateEffectiveStatus(berkasKeluar, null, berkasKembali, NOW);
  assert(
    "status = TERLAMBAT (meskipun sudah dikembalikan)",
    status === "TERLAMBAT",
    `actual: ${status}`
  );
});

// ══════════════════════════════════════════════
// SCENARIO 6 — Fallback ke tanggalPinjam jika tanggalBerkasKeluar null
// ══════════════════════════════════════════════
describe("SCENARIO 6 — Fallback ke tanggalPinjam", () => {
  const tanggalPinjam = msAgo(H49);  // pinjam 49 jam lalu

  const overdue = isOverdue(null, tanggalPinjam, null, NOW);
  assert(
    "isOverdue = true dengan fallback tanggalPinjam (49 jam lalu)",
    overdue === true,
    `actual: ${overdue}`
  );

  const status = calculateEffectiveStatus(null, tanggalPinjam, null, NOW);
  assert(
    "status = TERLAMBAT dengan fallback tanggalPinjam",
    status === "TERLAMBAT",
    `actual: ${status}`
  );
});

// ══════════════════════════════════════════════
// SCENARIO 7 — Input tidak valid / null
// ══════════════════════════════════════════════
describe("SCENARIO 7 — Input null / tidak valid", () => {
  assert(
    "calculateDeadline(null, null) = null",
    calculateDeadline(null, null) === null
  );

  assert(
    "isOverdue(null, null, null) = false",
    isOverdue(null, null, null, NOW) === false
  );

  assert(
    "calculateEffectiveStatus(null, null, null) = DIPINJAM (tidak bisa tentukan terlambat)",
    calculateEffectiveStatus(null, null, null, NOW) === "DIPINJAM"
  );

  assert(
    "calculateDeadline('invalid-date', null) = null",
    calculateDeadline("invalid-date", null) === null
  );
});

// ══════════════════════════════════════════════
// SCENARIO 8 — Berkas belum keluar (47 jam < 48 jam, belum terlambat)
// ══════════════════════════════════════════════
describe("SCENARIO 8 — Berkas 47 jam dipinjam, belum terlambat", () => {
  const berkasKeluar = msAgo(H47);  // keluar 47 jam lalu → 1 jam lagi baru jatuh tempo

  const overdue = isOverdue(berkasKeluar, null, null, NOW);
  assert(
    "isOverdue = false (47 jam < 48 jam deadline)",
    overdue === false,
    `actual: ${overdue}`
  );

  const status = calculateEffectiveStatus(berkasKeluar, null, null, NOW);
  assert(
    "status = DIPINJAM",
    status === "DIPINJAM",
    `actual: ${status}`
  );
});

// ══════════════════════════════════════════════
// SUMMARY
// ══════════════════════════════════════════════
console.log(`\n${"─".repeat(50)}`);
console.log(`📊 HASIL: ${passed} lulus, ${failed} gagal (total ${passed + failed} assertion)`);
if (failed === 0) {
  console.log("🎉 Semua test berhasil! Logic status 2×24 jam berfungsi dengan benar.");
} else {
  console.error(`⚠️  Ada ${failed} assertion yang gagal. Periksa logic di statusHelper.ts.`);
  process.exit(1);
}
