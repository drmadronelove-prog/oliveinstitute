import { withBasePath } from "@/lib/basePath";
import { formatDuration } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";

/**
 * Base URL of the video host, e.g. "https://player.example.com/embed". A
 * lesson's `videoUid` is appended to it. Left unset until a provider is
 * chosen, in which case the preview says so rather than rendering a
 * broken frame.
 */
const VIDEO_EMBED_BASE = process.env.NEXT_PUBLIC_VIDEO_EMBED_BASE?.replace(
  /\/$/,
  "",
);

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
 */
export function LessonPreview({ lesson }: { lesson: PreviewLesson }) {
  const hostedEmbed =
    VIDEO_EMBED_BASE && lesson.videoUid
      ? `${VIDEO_EMBED_BASE}/${lesson.videoUid}`
      : null;

  const linkedVideo = lesson.resources.find(
    (resource) => resource.type === "VIDEO" && youTubeEmbedUrl(resource.url),
  );
  const embedUrl =
    hostedEmbed ??
    (linkedVideo ? youTubeEmbedUrl(linkedVideo.url) : null);

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

      {embedUrl ? (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          <iframe
            src={embedUrl}
            title={lesson.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : lesson.type === "VIDEO" ? (
        <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-[var(--color-sage-pale)] px-6 text-center">
          <p className="font-body text-sm text-[var(--color-ink-muted)]">
            This preview has no video host configured yet. Set
            <code className="mx-1">NEXT_PUBLIC_VIDEO_EMBED_BASE</code>
            to play it inline.
          </p>
        </div>
      ) : null}

      {lesson.body ? (
        <p className="mt-4 whitespace-pre-wrap font-body text-sm text-[var(--color-ink-muted)]">
          {lesson.body}
        </p>
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
