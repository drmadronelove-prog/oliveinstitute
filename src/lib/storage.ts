import { mkdir, writeFile } from "fs/promises";
import path from "path";

export interface StorageService {
  /** Saves a file under an owner-scoped key (a lessonId, in every current caller) and returns the URL to fetch it and the storage key. */
  saveFile(
    ownerId: string,
    file: File,
  ): Promise<{ url: string; storageKey: string }>;
  /**
   * Saves a course cover image under its own top-level prefix, served
   * publicly (no entitlement check) by GET /api/course-covers/[...key] —
   * unlike saveFile's /api/files, which is entitlement-gated per lesson.
   * A cover image is a marketing asset: it has to be visible to an
   * anonymous visitor and an Open Graph crawler, neither of which has an
   * entitlement to check.
   */
  saveCoverImage(courseId: string, file: File): Promise<{ storageKey: string }>;
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

async function writeUnderPrefix(
  prefix: string,
  ownerId: string,
  file: File,
): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const key = `${ownerId}/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;
  const fullPath = path.join(
    /*turbopackIgnore: true*/ UPLOADS_DIR,
    prefix,
    key,
  );

  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, bytes);

  return key;
}

class LocalDiskStorage implements StorageService {
  async saveFile(ownerId: string, file: File) {
    const key = await writeUnderPrefix("", ownerId, file);
    return { url: `/api/files/${key}`, storageKey: key };
  }

  async saveCoverImage(courseId: string, file: File) {
    const key = await writeUnderPrefix("course-covers", courseId, file);
    return { storageKey: key };
  }
}

// Swap this for an S3StorageService (returning signed URLs) when moving off local disk.
export const storage: StorageService = new LocalDiskStorage();
