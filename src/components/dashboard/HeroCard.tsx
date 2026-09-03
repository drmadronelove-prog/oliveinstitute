import Image from "next/image";
import { withBasePath } from "@/lib/basePath";

export function HeroCard({
  title,
  subtext,
  imageSrc,
  imageAlt = "",
  imageClassName = "object-cover",
  imageAspectRatio = "3 / 2",
}: {
  title: string;
  subtext: string;
  imageSrc?: string;
  imageAlt?: string;
  imageClassName?: string;
  /** CSS aspect-ratio for the image panel, so the whole photo fits with no cropping. */
  imageAspectRatio?: string;
}) {
  // next/image does not prefix basePath onto a `public/` src, and the image
  // optimizer then fetches a path the server doesn't serve. Remote sources
  // are passed through untouched.
  const resolvedImageSrc = imageSrc?.startsWith("/")
    ? withBasePath(imageSrc)
    : imageSrc;

  return (
    <div
      className="grid grid-cols-1 items-stretch overflow-hidden rounded-lg shadow-[0_14px_30px_rgba(15,33,23,0.3)] sm:grid-cols-[1fr_340px]"
      style={{
        backgroundImage:
          "linear-gradient(to bottom right, var(--color-sage), var(--color-olive))",
      }}
    >
      <div className="flex flex-col justify-center gap-[14px] px-8 py-8 sm:px-10">
        <h1 className="font-heading text-[42px] font-medium leading-[1.05] tracking-[-0.01em] text-[var(--color-ivory)]">
          {title}
        </h1>
        <div className="h-[2px] w-[52px] bg-[var(--color-gold)]" />
        <p className="max-w-[44ch] font-body text-[14.5px] text-[var(--color-ivory)]/[0.76]">
          {subtext}
        </p>
      </div>

      <div
        className="relative w-full sm:border-l-2 sm:border-[var(--color-gold)]"
        style={{ aspectRatio: imageAspectRatio }}
      >
        {resolvedImageSrc ? (
          <Image
            src={resolvedImageSrc}
            alt={imageAlt}
            fill
            sizes="(min-width: 640px) 340px, 100vw"
            className={imageClassName}
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background:
                "repeating-linear-gradient(135deg, rgba(200, 154, 74, 0.16) 0px, rgba(200, 154, 74, 0.16) 4px, rgba(255, 255, 255, 0.03) 4px, rgba(255, 255, 255, 0.03) 8px)",
            }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}
