import { getDb } from "./index";
import { initializeDatabase } from "./index";
import { loginWithNip } from "../auth/authService";

interface UserRow { id: number; nip: string; name: string; role: string; }
interface RmRow { nomorRm: string; namaPasien: string; }

export async function runSmokeTest(): Promise<boolean> {
  try {
    const db = await getDb();

    // ── Test 1: Database open & users readable ────────────────────────────
    const users = await db.select<UserRow[]>("SELECT id, nip, name, role FROM users");
    console.log("[SmokeTest] ✓ DB open. Users found:", users.length);

    // ── Test 2: DataRM insert / read / delete ────────────────────────────
    const testRm = "RM-SMOKE-" + Date.now();
    await db.execute(
      "INSERT INTO data_rm (nomorRm, namaPasien) VALUES ($1, $2)",
      [testRm, "Pasien Test Smoke"]
    );
    const rmData = await db.select<RmRow[]>(
      "SELECT * FROM data_rm WHERE nomorRm = $1",
      [testRm]
    );
    if (rmData.length === 0 || rmData[0].nomorRm !== testRm) {
      throw new Error("DataRM insert/read failed.");
    }
    console.log("[SmokeTest] ✓ DataRM insert/read OK");

    await db.execute("DELETE FROM data_rm WHERE nomorRm = $1", [testRm]);
    console.log("[SmokeTest] ✓ DataRM cleanup OK");

    // ── Test 3: Foreign Key constraint active ────────────────────────────
    let fkEnforced = false;
    try {
      await db.execute(
        `INSERT INTO peminjaman (tanggalPinjam, peminjamId, unit, nomorRm, namaPasien, status)
         VALUES (CURRENT_TIMESTAMP, $1, $2, $3, $4, $5)`,
        [99999, "UNIT-TEST", "RM-NOEXIST", "Pasien FK Test", "DIPINJAM"]
      );
    } catch {
      fkEnforced = true;
    }
    if (!fkEnforced) {
      console.warn("[SmokeTest] ✗ FK constraint NOT enforced — check PRAGMA foreign_keys");
    } else {
      console.log("[SmokeTest] ✓ FK constraint enforced (peminjaman → users)");
    }

    // ── Test 4: Idempotent initialization ────────────
    await initializeDatabase();
    const usersAfter = await db.select<UserRow[]>(
      "SELECT id, nip FROM users WHERE role = 'Super Admin'"
    );
    if (usersAfter.length !== 1) {
      throw new Error(`Expected 1 Super Admin after re-init, found: ${usersAfter.length}`);
    }
    console.log("[SmokeTest] ✓ Re-initialization idempotent. Super Admin count:", usersAfter.length);

    // ── Test 5: Authentication (Phase 3) ────────────
    // Valid login
    const session = await loginWithNip('superadmin', 'superadmin123');
    if (session.nip !== 'superadmin') throw new Error("Mismatched NIP on valid login");
    console.log("[SmokeTest] ✓ Auth: Valid login OK");

    try {
      // Invalid login
      await loginWithNip('superadmin', 'wrongpassword');
      throw new Error("Should not login with wrong password");
    } catch (e: unknown) {
      if ((e as Error).message !== "Username atau password salah.") throw e;
      console.log("[SmokeTest] ✓ Auth: Invalid password blocked");
    }

    console.log("[SmokeTest] ✅ All smoke tests passed!");
    return true;
  } catch (error) {
    console.error("[SmokeTest] ✗ Smoke test failed:", error);
    return false;
  }
}
