# Tokyo Event Calendar

東京都と神奈川県・埼玉県・千葉県の connpass イベントを、日付・場所・キーワードから視覚的に探しやすくするイベントカレンダーです。

## Getting Started

```bash
pnpm install
pnpm dev
```

[http://localhost:3000](http://localhost:3000) を開いて確認してください。

イベントは `data/events.json` のスナップショットから表示します。中身は [connpass API v2](https://connpass.com/about/api/v2/) のイベント一覧レスポンスと同じ形で、開催日は API の日時のままです。検索条件は URL に保持します。

### 検索条件の URL

| パラメーター | 例                    | 説明                                                                                                                                                               |
| ------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `date`       | `date=2026-10-10`     | 表示する日（日本時間）。無い・不正なときは今日                                                                                                                     |
| `area`       | `area=北区&area=港区` | エリア（区・市・県）。選んだ数だけ `area` を繰り返し、いずれかに当たるイベントを出す（OR）。無ければすべて。1 つだけの `area=渋谷区`（以前の形式）もそのまま使える |
| `format`     | `format=online`       | 開催形態（`online` / `offline`）。無ければすべて                                                                                                                   |
| `keyword`    | `keyword=React, LT`   | キーワード。`,` `、` で区切った語をすべて含むイベントを出す（AND）                                                                                                 |

## イベントデータの更新

サイトからは connpass API を呼びません（利用者のアクセスで API を呼ぶことはありません）。API を呼ぶのは、スナップショットを更新するとき（GitHub Actions の定期実行・手動実行、または手元の `pnpm fetch:events` / `pnpm fetch:events:local`）だけです。

1. `.github/workflows/update-events.yml` が 1 日 1 回（UTC 18:00 = 日本時間 3:00、手動実行も可）動く
2. `scripts/fetch-connpass-events.ts` が connpass API v2 のイベント一覧（`GET /api/v2/events/`）から、東京都・神奈川県・埼玉県・千葉県（`prefecture=tokyo`, `kanagawa`, `saitama`, `chiba`）で今月から 3 か月分のイベントを開催日時順に 100 件ずつ取得する。続けて `data/connpass-supplements.json` の subdomain と event_id も、都道府県なし・同じ年月で取得し、イベント ID で足す（重複は除く）。都道府県・補完・429 の再試行は、同じレートリミッタで 12.5 秒以上あける。フリープランは 12 秒につき 1 リクエスト、1 日 100 リクエストまで（2026-11-04 から。[API の利用について](https://help.connpass.com/api/)）。定期実行は 1 日 1 回で、同じ日の手動実行を 1 回まで見込むと 1 バッチ 50 回まで。2026-11-11 の取得結果は重複除去後 541 件で、見込みは約 7 回（都道府県 6 + subdomain 1 + event_id 0）なので、1 日 14 回で 100 回を下回る。上限を超えるリクエストは送らず、取り切れていなければ `data/events.json` を書き出さない。根拠は `lib/connpass-rate-limit.ts`
3. 終了から 7 日を超えて経過したイベントは、スナップショットにもサイトの表示（ビルド時の日別 JSON と軽い一覧）にも残さない。ちょうど 7 日は残す。終了時刻が無いときは開始時刻を終了時刻として同じ基準で除く。取得に失敗したときも `data/events.json` は書き出さない
4. 主催者のニックネーム・表示名・ID は落とし、`image_url` はそのまま `data/events.json` に書き出す。カードは URL があるときその画像を表示する。API リファレンスでは、この URL はある程度の時間で失効し、外部サイトでの直接参照は控えるよう記載されている
5. 変更があれば `main` に commit・push し、アプリはその JSON を読む。表示用の JSON を作るときにも、終了から 7 日を超えたイベントを除く

API キーは GitHub の Environment `workflow` の secret `CONNPASS_API_KEY` に置き、ワークフローから `pnpm fetch:events` で参照します。手元では `.env` にキーを書いて `pnpm fetch:events:local`（`tsx --env-file=.env` 経由）。CI と同じ渡し方なら `CONNPASS_API_KEY=... pnpm fetch:events` でも可（キーはログに出しません）。

API の利用条件は [connpass API利用規約](https://help.connpass.com/api/api-term) と [API リファレンス](https://connpass.com/about/api/v2/) に従います。

### 都道府県の検索に載らないイベント

都道府県（`prefecture`）の検索だけでは拾えないイベントがあります。`event_id` や `subdomain` では API から返るのに、上の 4 県の和集合に含まれないものです。おすすめとしての優遇ではありません。

`data/connpass-supplements.json` は `subdomains` と `event_ids` だけを持ちます。初期値は subdomain `dmm` です。足すときは、その JSON に subdomain（`https://dmm.connpass.com/` なら `dmm`）か event_id を書いて、次の `pnpm fetch:events` か Actions の定期実行を待ちます。subdomain はそのグループの、同じ 3 か月のイベントを都道府県に関係なく足します。対象のカレンダーに載せたいグループだけを書いてください。event_id は、その ID のイベントが同じ 3 か月の窓にあるときだけ足します。

カレンダーに出ていない connpass のイベントは、[表示されていないイベント](https://github.com/illionillion/tokyo-event-calendar/issues/new?template=missing_event.yml) の Issue、または作者への [DM（X）](https://x.com/Sei_engineer) で知らせてください。確認できれば、この設定に足して表示されるようにします。connpass 以外で申し込むイベントは対象外です。

## Scripts

| Command                   | Description                           |
| ------------------------- | ------------------------------------- |
| `pnpm dev`                | 開発サーバー起動                      |
| `pnpm build`              | 本番ビルド                            |
| `pnpm start`              | 本番サーバー起動                      |
| `pnpm lint`               | ESLint                                |
| `pnpm type-check`         | TypeScript 型チェック                 |
| `pnpm format`             | Prettier で整形                       |
| `pnpm format:check`       | Prettier チェック                     |
| `pnpm test`               | Vitest（watch）                       |
| `pnpm test:run`           | Vitest（一回実行）                    |
| `pnpm test:coverage`      | Vitest + coverage                     |
| `pnpm fetch:events`       | スナップショット取得（CI 用）         |
| `pnpm fetch:events:local` | 同上（`.env` を読む）                 |
| `pnpm promo:install`      | Remotion の依存を入れる               |
| `pnpm promo:studio`       | 紹介動画のプレビュー                  |
| `pnpm promo:prepare`      | 実データで props とサムネだけ作る     |
| `pnpm promo:render`       | 紹介動画 4 本（縦横）を固定パスへ書く |
| `pnpm promo:type-check`   | Remotion 側の型チェック               |

## 毎日の紹介動画

LT ともくもく会の動画を、Remotion で `data/events.json` から書き出します。中身は同じで、縦（1080×1920、Instagram / YouTube）と横（1920×1080、X）を出します。ナレーションと BGM はありません。詳細な絞り込みとライセンスは [remotion/README.md](remotion/README.md) にあります。

対象は、基準日の次の土曜が案内する「来週」（日曜〜土曜、日本時間）です。動画は毎日再生成します。公開パスは固定なので、土曜の X 投稿（LT の本編と、もくもくのリプライ）はこの URL を付ければ、その時点の最新の動画になります。X の投稿頻度と文面は、このリポジトリの外で土曜の週次のままです。

| 動画        | 向き         | ファイル                                          | 絞り込み                                 |
| ----------- | ------------ | ------------------------------------------------- | ---------------------------------------- |
| A. LT       | 縦 1080×1920 | `public/promo/videos/week-lt.mp4`                 | サイトの週表示 `keyword=LT` と同じ       |
| A. LT       | 横 1920×1080 | `public/promo/videos/week-lt-landscape.mp4`       | 同上                                     |
| B. もくもく | 縦 1080×1920 | `public/promo/videos/week-mokumoku.mp4`           | サイトの週表示 `keyword=もくもく` と同じ |
| B. もくもく | 横 1920×1080 | `public/promo/videos/week-mokumoku-landscape.mp4` | 同上                                     |

各動画は日付と開始時刻の順で最大 10 件、尺は約 25 秒までです。`.github/workflows/promo-videos.yml` が毎日 UTC 19:00（日本時間 4:00。イベントスナップショットは毎日 UTC 18:00）に 4 本と `manifest.json` を書いて `main` に commit します。このワークフローは `ci.yml` と別で、失敗しても lint・テスト・ビルドは止まりません。

公開 URL（パスは固定。日次の更新がデプロイされると中身が入れ替わる）:

- https://tokyo-event-calendar.illionillion.workers.dev/promo/videos/week-lt.mp4
- https://tokyo-event-calendar.illionillion.workers.dev/promo/videos/week-lt-landscape.mp4
- https://tokyo-event-calendar.illionillion.workers.dev/promo/videos/week-mokumoku.mp4
- https://tokyo-event-calendar.illionillion.workers.dev/promo/videos/week-mokumoku-landscape.mp4

手元では `pnpm promo:install` のあと `pnpm promo:studio`（サンプル）か `pnpm promo:render`（実データ）です。

Remotion は [Remotion Free License](https://www.remotion.dev/docs/license) で使っています。個人、および従業員 3 人までの組織は無償です。

## Development tooling

- **Lint / Format**: ESLint + Prettier
- **Test**: Vitest + Testing Library
- **Git hooks**: lefthook（pre-commit / commit-msg）
- **Commit message**: Conventional Commits（commitlint）
- **CI**: GitHub Actions（`.github/workflows/ci.yml`）
