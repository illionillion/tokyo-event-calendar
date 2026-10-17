/**
 * 検索エンジンと SNS のリンクプレビューのクローラー。
 * これらには `/` の代わりに、軽い一覧からサーバーで描くページ（/crawler）を返す（middleware.ts）。
 */
const BOT_PATTERN = new RegExp(
  [
    "googlebot",
    "google-inspectiontool",
    "googleother",
    "adsbot-google",
    "mediapartners-google",
    "apis-google",
    "bingbot",
    "bingpreview",
    "msnbot",
    "adidxbot",
    "duckduckbot",
    "duckassistbot",
    "yandex(bot|images)",
    "baiduspider",
    "applebot",
    "slurp",
    "petalbot",
    "naverbot|yeti",
    "seznambot",
    "twitterbot",
    "facebookexternalhit",
    "facebot",
    "meta-externalagent",
    "linkedinbot",
    "slackbot",
    "slack-imgproxy",
    "discordbot",
    "telegrambot",
    "whatsapp",
    "line-poker",
    "skypeuripreview",
    "pinterestbot",
    "pinterest/0\\.2",
    "embedly",
    "hatena",
    "mastodon",
    "bluesky",
    "cardyb",
  ].join("|"),
  "i"
);

export function isCrawler(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return BOT_PATTERN.test(userAgent);
}

/** クローラー向けページのパス。middleware が `/` から書き換える先。 */
export const CRAWLER_PATH = "/crawler";
