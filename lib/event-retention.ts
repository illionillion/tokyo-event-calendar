/**
 * 終了から 7 日を超えて経過したイベントは、スナップショットにもサイトの表示にも残さない。
 *
 * 監査（2026-11-11）: 取得は開催月（今月を含む 3 か月）だけで、終了からの日数では除いていなかった。
 * 月初に終わったイベントが `data/events.json` と、そこから作る日別 JSON・軽い一覧に残っていた。
 * ちょうど 7 日は残す。7 日より長いときだけ除く（ミリ秒で比較する）。
 * 終了時刻が無いイベントは、画面と同じく開始時刻を終了時刻として扱う。どちらも読めないものは除かない。
 */

export const ENDED_EVENT_RETENTION_DAYS = 7;
export const ENDED_EVENT_RETENTION_MS = ENDED_EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export type EventEndSource = {
  ended_at: string | null;
  started_at: string | null;
};

/** 終了時刻。無ければ開始時刻。どちらも日時として読めなければ null。 */
export function eventEndMs(event: EventEndSource): number | null {
  const raw = event.ended_at ?? event.started_at;
  if (raw === null || raw === "") return null;
  const ms = Date.parse(raw);
  return Number.isNaN(ms) ? null : ms;
}

/** 終了から保持日数を超えている。ちょうど保持日数のときは false。 */
export function isPastEndedRetention(
  event: EventEndSource,
  now: Date,
  retentionMs = ENDED_EVENT_RETENTION_MS
): boolean {
  const end = eventEndMs(event);
  if (end === null) return false;
  return now.getTime() - end > retentionMs;
}

export function omitEventsEndedBeyondRetention<T extends EventEndSource>(
  events: readonly T[],
  now: Date
): T[] {
  return events.filter((event) => !isPastEndedRetention(event, now));
}
