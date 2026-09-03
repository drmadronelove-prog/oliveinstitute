import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { withBasePath } from "@/lib/basePath";

export type ResourceItem = {
  id: string;
  type: "PDF" | "LINK" | "VIDEO";
  title: string;
  url: string;
  uploadedAt: Date;
};

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

export function ResourceList({
  resources,
  renderActions,
}: {
  resources: ResourceItem[];
  renderActions?: (resource: ResourceItem) => ReactNode;
}) {
  if (resources.length === 0) {
    return (
      <p className="font-body text-sm text-[var(--color-ink-muted)]">
        No resources have been added yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {resources.map((material) => {
        const embedUrl = material.type === "VIDEO" ? youTubeEmbedUrl(material.url) : null;
        // Uploaded files are stored as "/api/files/…"; external links are
        // absolute URLs and must not be prefixed.
        const href =
          material.type === "PDF" ? withBasePath(material.url) : material.url;

        return (
          <li key={material.id} className="rounded-lg bg-[var(--color-sage-pale)] p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Badge>{material.type}</Badge>
                <span className="font-body text-sm font-medium text-[var(--color-ink)]">
                  {material.title}
                </span>
              </div>
              {renderActions ? renderActions(material) : null}
            </div>

            {material.type === "PDF" ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-sm text-[var(--color-olive)] underline underline-offset-2"
              >
                View / download PDF ↗
              </a>
            ) : embedUrl ? (
              <div className="aspect-video w-full max-w-md overflow-hidden rounded-md">
                <iframe
                  src={embedUrl}
                  title={material.title}
                  className="h-full w-full"
                  allowFullScreen
                />
              </div>
            ) : (
              <a
                href={material.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-sm text-[var(--color-olive)] underline underline-offset-2"
              >
                {material.type === "VIDEO" ? "Watch video ↗" : "Open link ↗"}
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}
