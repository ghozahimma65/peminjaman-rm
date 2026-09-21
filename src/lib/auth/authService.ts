import bcrypt from "bcryptjs";
import { getDb } from "../database/index";

export interface SessionUser {
  id: number;
  nip: string;
  name: string;
  email: string | null;
  role: string;
  avatarPath?: string | null;
}

export async function loginWithNip(nip: string, passwordPlain: string): Promise<SessionUser> {
  const db = await getDb();

  // Cari user berdasarkan NIP
  const users = await db.select<(SessionUser & { passwordHash: string })[]>(
    "SELECT id, nip, name, email, role, avatarPath, passwordHash FROM users WHERE nip = $1",
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
    avatarPath: user.avatarPath || null,
  };
}

export async function registerUser(params: {
  nip: string;
  name: string;
  email: string;
  passwordPlain: string;
  avatarPath?: string | null;
}): Promise<SessionUser> {
  const db = await getDb();

  const nipTrimmed = params.nip.trim();
  const nameTrimmed = params.name.trim();
  const emailTrimmed = params.email.trim();

  // 1. Validasi Input
  if (!nipTrimmed) {
    throw new Error("NIP wajib diisi.");
  }
  if (!nameTrimmed) {
    throw new Error("Nama lengkap wajib diisi.");
  }
  if (!emailTrimmed) {
    throw new Error("Email wajib diisi.");
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailTrimmed)) {
    throw new Error("Format email tidak valid.");
  }
  if (!params.passwordPlain) {
    throw new Error("Password wajib diisi.");
  }

  // Cek duplikat NIP
  const existingNip = await db.select<{ id: number }[]>(
    "SELECT id FROM users WHERE nip = $1",
    [nipTrimmed]
  );
  if (existingNip.length > 0) {
    throw new Error("NIP sudah terdaftar dalam sistem.");
  }

  // Cek duplikat Email
  const existingEmail = await db.select<{ id: number }[]>(
    "SELECT id FROM users WHERE email = $1",
    [emailTrimmed]
  );
  if (existingEmail.length > 0) {
    throw new Error("Email sudah digunakan oleh akun lain.");
  }

  // 2. Hash Password (bcrypt)
  const hash = await bcrypt.hash(params.passwordPlain, 10);

  // 3. Insert User Baru (Role selalu 'PETUGAS')
  const result = await db.execute(
    "INSERT INTO users (nip, name, email, passwordHash, role, avatarPath) VALUES ($1, $2, $3, $4, $5, $6)",
    [nipTrimmed, nameTrimmed, emailTrimmed, hash, "PETUGAS", params.avatarPath || null]
  );

  const insertedUser = await db.select<{ id: number }[]>(
    "SELECT id FROM users WHERE nip = $1",
    [nipTrimmed]
  );

  return {
    id: insertedUser[0]?.id ?? result.lastInsertId ?? 0,
    nip: nipTrimmed,
    name: nameTrimmed,
    email: emailTrimmed,
    role: "PETUGAS",
    avatarPath: params.avatarPath || null,
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

export async function updateUserProfile(
  id: number,
  name: string,
  email: string | null,
  avatarPath?: string | null
): Promise<void> {
  const db = await getDb();

  if (email) {
    const existingEmail = await db.select<{ id: number }[]>(
      "SELECT id FROM users WHERE email = $1 AND id <> $2",
      [email, id]
    );
    if (existingEmail.length > 0) {
      throw new Error("Email sudah digunakan oleh akun lain.");
    }
  }

  if (avatarPath !== undefined) {
    await db.execute(
      "UPDATE users SET name = $1, email = $2, avatarPath = $3, updatedAt = CURRENT_TIMESTAMP WHERE id = $4",
      [name, email, avatarPath, id]
    );
  } else {
    await db.execute(
      "UPDATE users SET name = $1, email = $2, updatedAt = CURRENT_TIMESTAMP WHERE id = $3",
      [name, email, id]
    );
  }
}

export async function changeUserPassword(
  userId: number,
  oldPasswordPlain: string,
  newPasswordPlain: string
): Promise<void> {
  const db = await getDb();

  const users = await db.select<{ id: number; passwordHash: string }[]>(
    "SELECT id, passwordHash FROM users WHERE id = $1",
    [userId]
  );

  if (users.length === 0) {
    throw new Error("Pengguna tidak ditemukan.");
  }

  const isValid = await bcrypt.compare(oldPasswordPlain, users[0].passwordHash);
  if (!isValid) {
    throw new Error("Password lama tidak sesuai.");
  }

  const newHash = await bcrypt.hash(newPasswordPlain, 10);

  await db.execute(
    "UPDATE users SET passwordHash = $1, updatedAt = CURRENT_TIMESTAMP WHERE id = $2",
    [newHash, userId]
  );
}
