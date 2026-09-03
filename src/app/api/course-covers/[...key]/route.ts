import { NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";

/**
 * Serves a course cover image, publicly and without any entitlement check
 * — unlike /api/files, which is gated per lesson by canViewLesson. A cover
 * image is a marketing asset: the storefront and an Open Graph crawler
 * both need to load it without a session. It lives under its own
 * "course-covers" prefix, entirely separate from lesson resources, so this
 * route can never be tricked into serving one of those instead.
 */
const UPLOADS_DIR = process.env.UPLOADS_DIR ?? "./uploads";
const COVERS_PREFIX = "course-covers";

const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;

  if (
    key.length < 2 ||
    key.some((segment) => segment.includes("..") || segment.includes("/"))
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const relativePath = path.join(...key);
  const fullPath = path.join(
    /*turbopackIgnore: true*/ UPLOADS_DIR,
    COVERS_PREFIX,
    relativePath,
  );
  const resolvedCoversDir = path.resolve(
    /*turbopackIgnore: true*/ UPLOADS_DIR,
    COVERS_PREFIX,
  );
  if (!path.resolve(fullPath).startsWith(resolvedCoversDir)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const data = await readFile(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    const contentType =
      EXTENSION_CONTENT_TYPES[ext] ?? "application/octet-stream";

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        // Each key is a fresh random filename — replacing a cover image
        // uploads a new key rather than overwriting the old one, so a long
        // cache lifetime is safe.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
