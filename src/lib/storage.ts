import { mkdir, writeFile } from "fs/promises";
import path from "path";

export interface StorageService {
  /** Saves a file under a course-scoped key and returns the URL to fetch it and the storage key. */
  saveFile(
    courseId: string,
    file: File,
  ): Promise<{ url: string; storageKey: string }>;
}

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? "./uploads";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "_").slice(-150);
}

const DANGEROUS_EXTENSIONS = new Set([
  "exe", "bat", "cmd", "com", "scr", "msi", "dll", "ps1", "vbs", "vbe",
  "js", "jse", "wsf", "wsh", "sh", "bash", "jar", "app", "apk", "deb",
  "rpm", "html", "htm", "svg",
]);

/** True if the filename's extension is one we refuse to store (executables, scripts, and markup that could be rendered/executed if ever served). */
export function hasDangerousExtension(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase();
  return !!ext && DANGEROUS_EXTENSIONS.has(ext);
}

class LocalDiskStorage implements StorageService {
  async saveFile(courseId: string, file: File) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const key = `${courseId}/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;
    const fullPath = path.join(/*turbopackIgnore: true*/ UPLOADS_DIR, key);

    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, bytes);

    return { url: `/api/files/${key}`, storageKey: key };
  }
}

// Swap this for an S3StorageService (returning signed URLs) when moving off local disk.
export const storage: StorageService = new LocalDiskStorage();
