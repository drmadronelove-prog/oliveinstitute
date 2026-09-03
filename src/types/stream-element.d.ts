import type { DetailedHTMLProps, HTMLAttributes } from "react";

/**
 * Cloudflare's Stream Player web component (`<stream>`), loaded via
 * https://embed.cloudflarestream.com/embed/sdk.latest.js. It behaves like
 * an HTMLMediaElement — `currentTime`, `duration`, `playbackRate`,
 * `play()`/`pause()`, and standard media events — but it isn't a
 * browser-standard element, so both its JSX shape and its DOM interface
 * need declaring by hand.
 *
 * `autoplay` is deliberately not in the attribute list below. This app
 * never autoplays video; leaving it out of the type is a small extra guard
 * against a future accidental `<stream autoplay>`.
 */
export interface StreamElement extends HTMLElement {
  currentTime: number;
  duration: number;
  paused: boolean;
  muted: boolean;
  playbackRate: number;
  play(): Promise<void>;
  pause(): void;
}

type StreamElementAttributes = HTMLAttributes<StreamElement> & {
  src?: string;
  controls?: boolean;
  muted?: boolean;
  loop?: boolean;
  preload?: "auto" | "metadata" | "none";
  poster?: string;
  height?: string | number;
  width?: string | number;
  "primary-color"?: string;
  "letterbox-color"?: string;
  "default-text-track"?: string;
};

// React 19's automatic JSX runtime resolves the `JSX` namespace from the
// "react" module itself (react/jsx-runtime re-exports it), not from a bare
// global `JSX` namespace — so augmenting `declare global { namespace JSX }`
// here would be silently ignored. This has to target the module instead.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      stream: DetailedHTMLProps<StreamElementAttributes, StreamElement>;
    }
  }
}
