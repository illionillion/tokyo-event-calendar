export const MAX_THUMB_BYTES = 4_000_000;

/** Content-Length が無い、または数値でないときは、本文を読みながら上限を見る。 */
export function contentLengthWithin(header: string | null, maxBytes: number): boolean {
  if (header === null || header.trim() === "") return true;
  const declared = Number(header);
  if (!Number.isFinite(declared)) return true;
  return declared <= maxBytes;
}

/**
 * 上限を超えたチャンクは結果に積まず、読み込みを打ち切る。
 * 全部バッファしてから長さを見る、ということはしない。
 */
export async function readBodyUpTo(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number
): Promise<Uint8Array | null> {
  if (!body) return null;

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value || value.byteLength === 0) continue;
      if (received + value.byteLength > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return null;
      }
      chunks.push(value);
      received += value.byteLength;
    }
  } catch {
    await reader.cancel().catch(() => undefined);
    return null;
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export type ThumbExtension = "jpg" | "png" | "webp" | "gif";

/** マジックバイトで画像か判断する。Content-Type は失効 URL の HTML を信じない。 */
export function imageExtension(bytes: Uint8Array): ThumbExtension | null {
  if (bytes.length < 12 || bytes.length > MAX_THUMB_BYTES) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "png";
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "gif";
  const riff = String.fromCharCode(bytes[0] ?? 0, bytes[1] ?? 0, bytes[2] ?? 0, bytes[3] ?? 0);
  const webp = String.fromCharCode(bytes[8] ?? 0, bytes[9] ?? 0, bytes[10] ?? 0, bytes[11] ?? 0);
  if (riff === "RIFF" && webp === "WEBP") return "webp";
  return null;
}

export function isHttpsUrl(value: string | null): value is string {
  if (!value) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
