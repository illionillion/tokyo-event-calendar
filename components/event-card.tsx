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
      className="flex flex-col overflow-hidden rounded-lg border border-border bg-card hover:border-primary hover:bg-primary-soft hover:shadow-sm md:flex-row md:items-stretch"
    >
      <span className="relative block aspect-[16/9] w-full shrink-0 overflow-hidden md:aspect-auto md:min-h-40 md:w-72 md:self-stretch">
        {event.imageUrl ? (
          // connpass の image_url は期限付きで、最適化プロキシに載せない
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.imageUrl} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center text-3xl font-semibold"
            style={{ backgroundColor: thumb.background, color: thumb.foreground }}
          >
            {initial}
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center px-3 py-3 md:px-4">
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
