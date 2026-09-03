import { withBasePath } from "@/lib/basePath";
import { formatDuration } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { LessonBody } from "@/components/course/LessonBody";

function youTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed${parsed.pathname}`;
    }
    if (parsed.hostname.includes("youtube.com") && parsed.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${parsed.searchParams.get("v")}`;
    }
  } catch {
    return null;
  }
  return null;
}

export type PreviewLesson = {
  id: string;
  title: string;
  type: string;
  durationSeconds: number;
  videoUid: string | null;
  body: string | null;
  resources: Array<{ id: string; type: string; title: string; url: string }>;
};

/**
 * The free sample lesson, rendered inline on the sales page. Whether it may
 * be shown at all is decided by `canViewLesson` on the server — this
 * component only draws what it is handed.
 *
 * The lesson's own video (`videoUid`) plays through Cloudflare Stream, the
 * same `VideoPlayer` the full learner player uses, just without progress
 * tracking (there's no account to save a free preview's position against).
 * A linked YouTube resource is still embedded directly — that's an
 * instructor-pasted external link, not something hosted on Stream.
 */
export function LessonPreview({ lesson }: { lesson: PreviewLesson }) {
  const linkedVideo = lesson.resources.find(
    (resource) => resource.type === "VIDEO" && youTubeEmbedUrl(resource.url),
  );
  const youTubeUrl = linkedVideo ? youTubeEmbedUrl(linkedVideo.url) : null;

  return (
    <div className="rounded-xl bg-[var(--color-card)] p-6 shadow-sm ring-1 ring-black/5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge>Free preview</Badge>
        <span className="font-body text-sm font-medium text-[var(--color-ink)]">
          {lesson.title}
        </span>
        <span className="font-body text-xs text-[var(--color-ink-muted)]">
          {formatDuration(lesson.durationSeconds)}
        </span>
      </div>

      {lesson.videoUid ? (
        <VideoPlayer
          lessonId={lesson.id}
          videoUid={lesson.videoUid}
          initialPositionSeconds={0}
          trackProgress={false}
        />
      ) : youTubeUrl ? (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          <iframe
            src={youTubeUrl}
            title={lesson.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : lesson.type === "VIDEO" ? (
        <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-[var(--color-sage-pale)] px-6 text-center">
          <p className="font-body text-sm text-[var(--color-ink-muted)]">
            This preview has no video uploaded yet.
          </p>
        </div>
      ) : null}

      {lesson.body ? (
        <div className="mt-4">
          <LessonBody body={lesson.body} />
        </div>
      ) : null}

      {lesson.resources.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {lesson.resources.map((resource) => (
            <li key={resource.id}>
              <a
                href={
                  resource.type === "PDF"
                    ? withBasePath(resource.url)
                    : resource.url
                }
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-sm text-[var(--color-olive)] underline underline-offset-2"
              >
                {resource.title} ↗
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
