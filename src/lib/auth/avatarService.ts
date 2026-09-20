import { mkdir, writeFile, readFile, remove, BaseDirectory } from "@tauri-apps/plugin-fs";

/**
 * Saves a user's avatar image to local Tauri AppData directory (`BaseDirectory.AppData`).
 * Returns the relative path reference to store in SQLite (e.g., `avatars/avatar_123_1690000000.png`).
 */
export async function saveAvatarFile(file: File, userIdentifier: string | number): Promise<string> {
  // 1. Validation
  const maxSizeBytes = 5 * 1024 * 1024; // 5 MB limit
  if (file.size > maxSizeBytes) {
    throw new Error("Ukuran foto profil terlalu besar (maksimal 5 MB).");
  }

  if (!file.type || !file.type.startsWith("image/")) {
    throw new Error("Format file tidak didukung. Harap unggah file gambar (JPG, PNG, WEBP).");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const fileName = `avatar_${userIdentifier}_${Date.now()}.${ext}`;
  const relativePath = `avatars/${fileName}`;

  try {
    // 2. Ensure `avatars/` directory exists
    try {
      await mkdir("avatars", { baseDir: BaseDirectory.AppData, recursive: true });
    } catch (mkdirErr) {
      console.warn("[AvatarService] mkdir warning (folder may already exist):", mkdirErr);
    }

    // 3. Write binary data
    const arrayBuffer = await file.arrayBuffer();
    await writeFile(relativePath, new Uint8Array(arrayBuffer), { baseDir: BaseDirectory.AppData });

    return relativePath;
  } catch (err) {
    const detail = (err as Error)?.message || String(err);
    console.error("[AvatarService] Failed to save avatar:", err);
    // eslint-disable-next-line preserve-caught-error
    throw new Error(`Gagal menyimpan foto profil ke penyimpanan lokal: ${detail}`);
  }
}

/**
 * Deletes a user's avatar image from Tauri AppData directory.
 */
export async function deleteAvatarFile(avatarPath: string | null | undefined): Promise<void> {
  if (!avatarPath) return;
  try {
    await remove(avatarPath, { baseDir: BaseDirectory.AppData });
  } catch (err) {
    console.warn("[AvatarService] Could not remove old avatar file:", avatarPath, err);
  }
}

/**
 * Loads a user's avatar image from Tauri AppData directory and creates a Blob URL for rendering in <img>.
 */
export async function getAvatarDisplayUrl(avatarPath: string | null | undefined): Promise<string | null> {
  if (!avatarPath) return null;

  if (avatarPath.startsWith("data:") || avatarPath.startsWith("blob:")) {
    return avatarPath;
  }

  try {
    const bytes = await readFile(avatarPath, { baseDir: BaseDirectory.AppData });
    const ext = avatarPath.split(".").pop()?.toLowerCase() || "png";
    let mimeType = "image/png";
    if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";
    if (ext === "webp") mimeType = "image/webp";
    if (ext === "gif") mimeType = "image/gif";

    const blob = new Blob([bytes], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn("[AvatarService] Failed to read avatar file from AppData:", avatarPath, err);
    return null;
  }
}
