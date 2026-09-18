import bcrypt from "bcryptjs";
import { getDb } from "../database/index";

export interface SessionUser {
  id: number;
  nip: string;
  name: string;
  email: string | null;
  role: string;
}

export async function loginWithNip(nip: string, passwordPlain: string): Promise<SessionUser> {
  const db = await getDb();

  // Cari user berdasarkan NIP
  const users = await db.select<(SessionUser & { passwordHash: string })[]>(
    "SELECT id, nip, name, email, role, passwordHash FROM users WHERE nip = $1",
    [nip]
  );

  if (users.length === 0) {
    // Log failed
    await logLogin(null, nip, "FAILED");
    throw new Error("Username atau password salah."); // Pesan generik demi keamanan
  }

  const user = users[0];

  // Verifikasi hash
  const isValid = await bcrypt.compare(passwordPlain, user.passwordHash);

  if (!isValid) {
    // Log failed
    await logLogin(user.id, nip, "FAILED");
    throw new Error("Username atau password salah.");
  }

  // Log success
  await logLogin(user.id, nip, "SUCCESS");

  return {
    id: user.id,
    nip: user.nip,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function logLogin(userId: number | null, nip: string, status: "SUCCESS" | "FAILED"): Promise<void> {
  try {
    const db = await getDb();
    await db.execute(
      "INSERT INTO login_logs (userId, nip, status) VALUES ($1, $2, $3)",
      [userId, nip, status]
    );
  } catch (error) {
    console.error("[Auth] Failed to log login attempt:", error);
  }
}

export async function updateUserProfile(id: number, name: string, email: string | null): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE users SET name = $1, email = $2, updatedAt = CURRENT_TIMESTAMP WHERE id = $3",
    [name, email, id]
  );
}
