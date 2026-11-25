/**
 * 終了から 3 か月を超えて経過したイベントは、スナップショットにもサイトの表示にも残さない。
 *
 * connpass は 2026-11-25 に、開催終了後 3 か月までの保存を認めた。
 * それ以前は当初の申請どおり、終了から 7 日を超えたイベントを除いていた（#51）。
 * ちょうど 3 か月は残す。3 か月より長いときだけ除く（日本時間の暦月で足し、ミリ秒で比較する）。
 * 終了時刻が無いイベントは、画面と同じく開始時刻を終了時刻として扱う。どちらも読めないものは除かない。
 *
 * API の取得窓（今月から 3 か月分）は変えない。窓の外になった終了済みイベントは、
 * 既存スナップショットから引き継ぎ、3 か月を超えたものだけ毎日の更新で除く。
 */

const TOKYO_OFFSET_MS = 9 * 3_600_000;

export const ENDED_EVENT_RETENTION_MONTHS = 3;

export type EventEndSource = {
  ended_at: string | null;
  started_at: string | null;
};

export type IdentifiedEvent = EventEndSource & { id: number };

/** 終了時刻。無ければ開始時刻。どちらも日時として読めなければ null。 */
export function eventEndMs(event: EventEndSource): number | null {
  const raw = event.ended_at ?? event.started_at;
  if (raw === null || raw === "") return null;
  const ms = Date.parse(raw);
  return Number.isNaN(ms) ? null : ms;
}

/** 終了時刻に、日本時間の暦で `months` か月を足した瞬間。日が無い月は末日に合わせる。 */
export function endedEventRetentionDeadlineMs(
  endMs: number,
  months = ENDED_EVENT_RETENTION_MONTHS
): number {
  const tokyo = new Date(endMs + TOKYO_OFFSET_MS);
  const year = tokyo.getUTCFullYear();
  const month = tokyo.getUTCMonth();
  const day = tokyo.getUTCDate();
  const lastDay = new Date(Date.UTC(year, month + months + 1, 0)).getUTCDate();
  const clampedDay = Math.min(day, lastDay);

  return (
    Date.UTC(
      year,
      month + months,
      clampedDay,
      tokyo.getUTCHours(),
      tokyo.getUTCMinutes(),
      tokyo.getUTCSeconds(),
      tokyo.getUTCMilliseconds()
    ) - TOKYO_OFFSET_MS
  );
}

/** 終了から保持期間を超えている。ちょうど 3 か月のときは false。 */
export function isPastEndedRetention(event: EventEndSource, now: Date): boolean {
  const end = eventEndMs(event);
  if (end === null) return false;
  return now.getTime() > endedEventRetentionDeadlineMs(end);
}

export function omitEventsEndedBeyondRetention<T extends EventEndSource>(
  events: readonly T[],
  now: Date
): T[] {
  return events.filter((event) => !isPastEndedRetention(event, now));
}

/** 開始または終了の日本時間の年月（`yyyymm`）。読めなければ null。 */
export function eventYearMonth(raw: string | null): string | null {
  if (raw === null || raw === "") return null;
  const ms = Date.parse(raw);
  if (Number.isNaN(ms)) return null;
  const tokyo = new Date(ms + TOKYO_OFFSET_MS);
  return `${tokyo.getUTCFullYear()}${String(tokyo.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** 開始または終了の年月が、API の取得対象月に含まれるか。 */
export function eventOverlapsTargetMonths(
  event: EventEndSource,
  months: readonly string[]
): boolean {
  const set = new Set(months);
  for (const raw of [event.started_at, event.ended_at]) {
    const yearMonth = eventYearMonth(raw);
    if (yearMonth !== null && set.has(yearMonth)) return true;
  }
  return false;
}

/**
 * 今回の取得分を優先し、取得対象月の外にある終了済みイベントだけ既存スナップショットから引き継ぐ。
 * 取得対象月に入るのに返ってこなかったイベントは、connpass 上で消えたものとして引き継がない。
 * 終了から 3 か月を超えたイベントは、取得分からも既存分からも除く。
 */
export function mergeRetainedSnapshotEvents<T extends IdentifiedEvent>(
  fetched: readonly T[],
  previous: readonly T[],
  now: Date,
  targetMonths: readonly string[]
): T[] {
  const fetchedIds = new Set(fetched.map((event) => event.id));
  const carried = previous.filter(
    (event) =>
      !fetchedIds.has(event.id) &&
      !eventOverlapsTargetMonths(event, targetMonths) &&
      !isPastEndedRetention(event, now)
  );
  return omitEventsEndedBeyondRetention([...fetched, ...carried], now);
}
