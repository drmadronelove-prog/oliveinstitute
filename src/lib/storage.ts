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
  /**
   * Saves a server-generated file (not a browser upload) under its own
   * "generated" prefix — currently just certificate PDFs. No public URL is
   * returned: unlike a cover image, a certificate is personal, so it's
   * served through its own owner-checked route rather than a bare
   * storage key anyone could guess.
   */
  saveGeneratedFile(
    ownerId: string,
    filename: string,
    data: Buffer,
  ): Promise<{ storageKey: string }>;
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

async function writeBufferUnderPrefix(
  prefix: string,
  ownerId: string,
  filename: string,
  bytes: Buffer,
): Promise<string> {
  const key = `${ownerId}/${crypto.randomUUID()}-${sanitizeFilename(filename)}`;
  const fullPath = path.join(
    /*turbopackIgnore: true*/ UPLOADS_DIR,
    prefix,
    key,
  );

  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, bytes);

  return key;
}

async function writeFileUnderPrefix(
  prefix: string,
  ownerId: string,
  file: File,
): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer());
  return writeBufferUnderPrefix(prefix, ownerId, file.name, bytes);
}

class LocalDiskStorage implements StorageService {
  async saveFile(ownerId: string, file: File) {
    const key = await writeFileUnderPrefix("", ownerId, file);
    return { url: `/api/files/${key}`, storageKey: key };
  }

  async saveCoverImage(courseId: string, file: File) {
    const key = await writeFileUnderPrefix("course-covers", courseId, file);
    return { storageKey: key };
  }

  async saveGeneratedFile(ownerId: string, filename: string, data: Buffer) {
    const key = await writeBufferUnderPrefix("generated", ownerId, filename, data);
    return { storageKey: key };
  }
}

// Swap this for an S3StorageService (returning signed URLs) when moving off local disk.
export const storage: StorageService = new LocalDiskStorage();
