"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { hasEnded } from "@/lib/dates";
import { formatCapacity, formatPlace } from "@/lib/filters";
import type { Event } from "@/lib/types";

const THUMBNAILS = [
  { background: "#F6E7E6", foreground: "#A33A36" },
  { background: "#E7EEF5", foreground: "#3E5874" },
  { background: "#E7F1EA", foreground: "#2E684C" },
  { background: "#F4EFE4", foreground: "#7A5A32" },
];

function thumbnailStyle(id: string) {
  let index = 0;
  for (const char of id) index = (index + char.charCodeAt(0)) % THUMBNAILS.length;
  return THUMBNAILS[index] ?? THUMBNAILS[0];
}

function PlaceMark({ online }: { online: boolean }) {
  if (online) {
    return (
      <svg
        data-place-icon="online"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="mt-0.5 shrink-0 text-primary"
      >
        <rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M8 20h8M12 16v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg
      data-place-icon="venue"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="mt-0.5 shrink-0 text-foreground"
    >
      <path
        d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.25" fill="currentColor" />
    </svg>
  );
}

function placeLabel(event: Event): string {
  const place = formatPlace(event);
  if (event.format === "online") return place;
  const venue = event.venueName.trim();
  return venue ? `${place} ${venue}` : place;
}

/**
 * イベント画像。connpass の image_url は期限付きなので、読み込めなかったら頭文字のサムネに切り替える。
 * ハイドレーション前に失敗した画像は onError が届かないため、マウント時にも読み込み結果を確かめる。
 */
function EventThumbnail({ event }: { event: Event }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const thumb = thumbnailStyle(event.id);
  const initial = Array.from(event.title)[0] ?? "イ";

  useEffect(() => {
    const image = imageRef.current;
    if (event.imageUrl && image?.complete && image.naturalWidth === 0) {
      setFailedUrl(event.imageUrl);
    }
  }, [event.imageUrl]);

  if (event.imageUrl && failedUrl !== event.imageUrl) {
    return (
      // connpass の image_url は期限付きで、最適化プロキシに載せない
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={imageRef}
        src={event.imageUrl}
        alt=""
        className="absolute inset-0 size-full object-cover"
        onError={() => setFailedUrl(event.imageUrl)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center text-3xl font-semibold"
      style={{ backgroundColor: thumb.background, color: thumb.foreground }}
    >
      {initial}
    </span>
  );
}

type EventCardProps = {
  event: Event;
  now: string;
};

export function EventCard({ event, now }: EventCardProps) {
  const ended = hasEnded(event.endedAt, now);

  return (
    <a
      href={event.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full min-w-0 max-w-full flex-col overflow-hidden rounded-lg border border-border bg-card hover:border-primary hover:bg-primary-soft hover:shadow-sm lg:flex-row lg:items-stretch"
    >
      <span className="relative block aspect-[16/9] w-full shrink-0 overflow-hidden lg:aspect-auto lg:min-h-40 lg:w-72 lg:self-stretch">
        <EventThumbnail event={event} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center px-3 py-3 lg:px-4">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={cn(
              "text-[13px] font-semibold tabular-nums",
              ended ? "text-secondary" : "text-foreground"
            )}
          >
            {event.start}–{event.end}
          </span>
          <span
            className={cn(
              "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[13px] leading-4 font-semibold tabular-nums",
              ended
                ? "border-border bg-surface text-foreground"
                : "border-primary bg-card text-primary"
            )}
          >
            {formatCapacity(event.accepted, event.limit)}
          </span>
          {ended ? (
            <span className="inline-flex shrink-0 items-center rounded-full bg-surface px-2 py-0.5 text-[12px] leading-4 font-semibold text-foreground">
              終了
            </span>
          ) : null}
        </span>
        <span className="mt-1 block text-[15px] leading-5 font-semibold wrap-anywhere text-pretty text-foreground line-clamp-2">
          {event.title}
          <span className="sr-only">（connpassで開く）</span>
        </span>
        <span className="mt-1.5 flex min-w-0 items-start gap-1 text-[13px] leading-5 text-foreground">
          <PlaceMark online={event.format === "online"} />
          <span
            className={cn(
              "min-w-0 font-medium wrap-anywhere line-clamp-2",
              event.format === "online" && "text-primary"
            )}
          >
            {placeLabel(event)}
          </span>
        </span>
        {event.tags.length > 0 ? (
          <span className="mt-1.5 flex min-w-0 flex-wrap gap-1">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex max-w-full min-w-0 items-center rounded-md border border-border bg-surface px-1.5 py-0.5 text-[12px] leading-4 font-medium wrap-anywhere text-foreground"
              >
                #{tag}
              </span>
            ))}
          </span>
        ) : null}
      </span>
    </a>
  );
}
