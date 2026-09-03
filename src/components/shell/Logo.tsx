import Image from "next/image";

export function Logo({ size = 44 }: { size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-md border-2 border-[var(--color-gold)] bg-gradient-to-b from-[var(--color-logo-top)] to-[var(--color-cream)] p-1"
      style={{ width: size, height: size }}
    >
      <Image
        src="/brand/sati-logo.png"
        alt="Sati Center for Buddhist Studies"
        width={size}
        height={size}
        className="h-full w-full object-contain"
        priority
      />
    </div>
  );
}
