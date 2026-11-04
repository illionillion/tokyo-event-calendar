const MAX_THUMB_BYTES = 4_000_000;

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
