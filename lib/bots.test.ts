import { describe, expect, it } from "vitest";
import { CRAWLER_PATH, isCrawler } from "@/lib/bots";

describe("isCrawler", () => {
  it.each([
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "Twitterbot/1.0",
    "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
    "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
  ])("クローラーと判定する: %s", (ua) => {
    expect(isCrawler(ua)).toBe(true);
  });

  it.each([
    null,
    undefined,
    "",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/122.0.0.0 Mobile Safari/537.36 NAVER(inapp; search; 1010; 11.0.0)",
  ])("通常のブラウザとは判定しない: %s", (ua) => {
    expect(isCrawler(ua)).toBe(false);
  });

  it("Naver のクローラーは判定し、アプリ内ブラウザとは分ける", () => {
    expect(
      isCrawler("Mozilla/5.0 (compatible; Naverbot/1.0; +https://help.naver.com/robots/)")
    ).toBe(true);
    expect(isCrawler("Mozilla/5.0 (compatible; Yeti/1.1; +https://naver.me/spd)")).toBe(true);
  });

  it("書き換える先は /crawler", () => {
    expect(CRAWLER_PATH).toBe("/crawler");
  });
});
