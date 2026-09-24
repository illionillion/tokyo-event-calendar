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

type EventCardProps = {
  event: Event;
  now: string;
};

export function EventCard({ event, now }: EventCardProps) {
  const ended = hasEnded(event.endedAt, now);
  const thumb = thumbnailStyle(event.id);
  const initial = Array.from(event.title)[0] ?? "イ";

  return (
    <a
      href={event.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 rounded-lg border border-border bg-card p-3 hover:border-primary hover:bg-primary-soft hover:shadow-sm"
    >
      <span
        aria-hidden="true"
        className="flex size-16 shrink-0 items-center justify-center rounded-md text-lg font-semibold sm:size-[72px]"
        style={{ backgroundColor: thumb.background, color: thumb.foreground }}
      >
        {initial}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="text-[13px] text-secondary tabular-nums">
            {event.start}–{event.end}
          </span>
          <span className={cn("text-[12px] tabular-nums", ended ? "text-muted" : "text-secondary")}>
            {ended ? "終了" : formatCapacity(event.accepted, event.limit)}
          </span>
        </span>
        <span className="mt-1 block text-[15px] leading-5 font-semibold text-pretty text-foreground line-clamp-2">
          {event.title}
          <span className="sr-only">（connpassで開く）</span>
        </span>
        <span className="mt-1 block truncate text-[13px] text-secondary">
          {formatPlace(event)}
          {event.format === "online" ? "" : ` ${event.venueName}`}
        </span>
        {event.tags.length > 0 ? (
          <span className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1">
            {event.tags.map((tag) => (
              <span key={tag} className="text-[12px] text-muted">
                #{tag}
              </span>
            ))}
          </span>
        ) : null}
      </span>
    </a>
  );
}
