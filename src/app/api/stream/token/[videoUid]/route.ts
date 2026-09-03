import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewLesson } from "@/lib/entitlements";
import { mintPlaybackToken, streamConfigured } from "@/lib/video";

/**
 * Every lesson video is uploaded with requireSignedURLs, so nothing plays
 * without one of these — the Stream Player takes the token as its `src` in
 * place of the bare video uid. This route makes the same call canViewLesson
 * already makes everywhere else in the app; it never decides for itself who
 * may watch.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ videoUid: string }> },
) {
  const { videoUid } = await params;

  if (!streamConfigured) {
    return NextResponse.json(
      { error: "Video is not configured." },
      { status: 500 },
    );
  }

  const session = await auth();
  const userId = session?.user.id ?? null;

  const lesson = await prisma.lesson.findFirst({
    where: { videoUid },
    select: { id: true },
  });
  if (!lesson) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!(await canViewLesson(userId, lesson.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const token = await mintPlaybackToken(videoUid);
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json(
      { error: "Could not create a playback token." },
      { status: 502 },
    );
  }
}
