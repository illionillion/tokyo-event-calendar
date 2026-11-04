export type PromoCard = {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  placeLabel: string;
  /** `remotion/public` からの相対パス。無いときは文字だけのカード。 */
  thumb: string | null;
  cancelled: boolean;
  index: number;
  total: number;
};

export type PromoProps = {
  headline: string;
  weekLabel: string;
  siteName: string;
  /** 末尾スラッシュ付きの公開 URL。 */
  siteUrl: string;
  /** 上限を切る前の件数。 */
  matched: number;
  cards: PromoCard[];
};
