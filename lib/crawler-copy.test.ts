import { describe, expect, it } from "vitest";
import { crawlerPageMeta, crawlerSubject, describeFilters } from "@/lib/crawler-copy";
import { buildCrawlerView } from "@/lib/crawler-view";
import { siteDescription, siteTitle } from "@/lib/site-metadata";
import type { Filters } from "@/lib/types";

function filters(partial: Partial<Filters> = {}): Filters {
  return {
    date: "2026-10-19",
    areas: [],
    format: "all",
    keyword: "",
    view: "month",
    ...partial,
  };
}

describe("crawler copy", () => {
  it("絞り込みが無い日は日付だけの主題になる", () => {
    const selected = filters();
    const heading = buildCrawlerView([], selected).heading;
    expect(describeFilters(selected)).toBe("");
    expect(crawlerSubject(heading, selected)).toBe("10月19日（月）のイベント");
    expect(crawlerPageMeta(heading, selected)).toEqual({
      title: `10月19日（月）のイベント | ${siteTitle}`,
      description: `10月19日（月）のイベント。${siteDescription}`,
      url: "/?date=2026-10-19",
    });
  });

  it("週・エリア・キーワードをタイトルと説明に入れる", () => {
    const selected = filters({ areas: ["港区"], keyword: "LT", view: "week" });
    const heading = buildCrawlerView([], selected).heading;
    expect(crawlerSubject(heading, selected)).toBe("2026年10月18日〜24日の港区・「LT」のイベント");
    const page = crawlerPageMeta(heading, selected);
    expect(page.title).toBe(`2026年10月18日〜24日の港区・「LT」のイベント | ${siteTitle}`);
    expect(page.description).toContain("港区");
    expect(page.description).toContain("「LT」");
    expect(page.description).toContain(siteDescription);
    expect(page.url).toBe("/?date=2026-10-19&area=%E6%B8%AF%E5%8C%BA&keyword=LT&view=week");
  });

  it("複数エリアと形式も主題に残す", () => {
    const selected = filters({ areas: ["港区", "渋谷区"], format: "offline", keyword: "LT" });
    expect(describeFilters(selected)).toBe("港区・渋谷区・オフライン・「LT」の");
  });
});
