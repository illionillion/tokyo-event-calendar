# 毎日の紹介動画

同じ内容を、縦 1080×1920（Instagram / YouTube）と横 1920×1080（X）で書き出します。横は縦を引き伸ばさず、サムネを左、日付・タイトル・場所を右に組み直します。ナレーションと BGM はありません。

アプリ本体の依存には入れません。`remotion/` は別の `package.json` と `pnpm-lock.yaml` を持ち、ルートの `pnpm install`（Next.js / Workers の CI）では Remotion もヘッドレスブラウザも入りません。

動画は毎日再生成します。公開パスは固定です。土曜の X 投稿（本編が LT、リプライがもくもく）は、下の URL を添付すれば最新の日次成果物になります。X の投稿頻度と文面は、このリポジトリの外で土曜の週次のままです。

## 2 種類 × 縦横

中身の週は、次の土曜投稿が案内する「来週」です。投稿本文は、サイトの週表示をキーワードで開いた件数を案内しています。

- 本投稿: 「LT」で絞り込んだ週表示
- リプライ: 「もくもく」で絞り込んだ週表示

動画も同じ語だけを使います。`lib/filters.ts` の `matchesKeyword` をそのまま呼ぶので、当たる範囲はサイトの `keyword=` と同じです（タイトル、キャッチ、説明、住所、会場、エリア、ハッシュタグへの部分一致。大文字小文字と全角半角は無視）。

| 動画        | キーワード | サイトで同じ一覧                                   | 縦                                      | 横                                                |
| ----------- | ---------- | -------------------------------------------------- | --------------------------------------- | ------------------------------------------------- |
| A. LT       | `LT`       | `/?view=week&keyword=LT&date=<その週の日曜>`       | `public/promo/videos/week-lt.mp4`       | `public/promo/videos/week-lt-landscape.mp4`       |
| B. もくもく | `もくもく` | `/?view=week&keyword=もくもく&date=<その週の日曜>` | `public/promo/videos/week-mokumoku.mp4` | `public/promo/videos/week-mokumoku-landscape.mp4` |

「発表」「登壇」「作業会」は足しません。足すと、投稿がリンクしている週表示の件数とずれます。タイトルが「作業会」だけで「もくもく」を含まないイベントは B に入りません。ハッシュタグが `もくもく会` のイベントは、部分一致なので入ります。

`LT` は説明文の `default` のように、語の一部にも当たります。サイトの検索と同じです。

中止（`cancelled`）のイベントは動画の件数にもカードにも入れません。サイトの週表示には残します。

### 週

サイトのミニカレンダーと同じ、日曜始まり〜土曜です（日本時間）。

基準日が土曜なら、その翌日の日曜から土曜まで。それ以外は、次の土曜の翌日の日曜から土曜まで。2026-10-24（土）なら 10 月 25 日〜31 日で、その日の投稿の「来週（10/25〜31）」と同じです。

画面上の「来週」は、この土曜投稿の言い方です。

並びは日付、同じ日の中では開始時刻、その次はタイトルです。1 本に載せるのは先頭 10 件です。オープニング 1.8 秒、カード 2 秒、エンディング 3 秒で、10 件のとき 24.8 秒です。件数が少なければその分短くなります。

## サムネ

レンダー前に `image_url`（https のみ）を `remotion/public/thumbs/` へ保存し、動画に焼き込みます。再生時にリモート画像は参照しません。URL が無い、失効している、画像でない、4MB を超える場合は、頭文字だけのカードにします。

connpass の画像 URL は時間が経つと失効します。スナップショット更新のあと、毎日のジョブで取り直します。

## コマンド

ルートで実行します。初回だけ Remotion 側を入れます。

```bash
pnpm promo:install
pnpm promo:studio
pnpm promo:prepare
pnpm promo:render
pnpm promo:type-check
```

| コマンド                | 動き                                                                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm promo:install`    | `remotion/` で `pnpm install --frozen-lockfile`                                                                                   |
| `pnpm promo:studio`     | サンプルカードで Remotion Studio を開く。縦は `WeeklyLt` / `WeeklyMokumoku`、横は `WeeklyLtLandscape` / `WeeklyMokumokuLandscape` |
| `pnpm promo:prepare`    | 実データで props とサムネだけ作る。動画は書かない                                                                                 |
| `pnpm promo:render`     | 縦横 4 本を `public/promo/videos/` の固定パスへ書く                                                                               |
| `pnpm promo:type-check` | `remotion/` の `tsc --noEmit`                                                                                                     |

実データで Studio を見るとき:

```bash
pnpm promo:prepare
pnpm --dir remotion exec remotion studio src/index.ts --props=props/generated/lt.json
```

もくもくは `props/generated/mokumoku.json` です。`--props` は開いているコンポジションの入力を置き換えます。

基準日と片方だけ:

```bash
pnpm promo:render -- --date 2026-10-24
pnpm promo:render -- --only lt
```

`--date` は「今日」の代わりになる基準日です。`--only` のときは `manifest.json` を更新しません。

初回のレンダーで Remotion がヘッドレスブラウザを取得します。Linux では Chrome 用の共有ライブラリが要ることがあります（CI の `promo-videos.yml` と同じパッケージ）。

## CI

`.github/workflows/promo-videos.yml` だけが動画を作ります。`ci.yml` には入っていません。失敗しても ESLint、型チェック、テスト、Next のビルドは続き、このジョブだけが失敗します。

- 定期: 毎日・スナップショット後。UTC 19:00（日本時間 4:00）。スナップショット更新は毎日 UTC 18:00（日本時間 3:00）。GitHub の schedule は遅れることがあります
- 手動: `workflow_dispatch`。入力 `date` は基準日（空なら実行日）。次の土曜投稿が案内する来週を書き出す
- 打ち切り: ジョブ 30 分。並列は `PROMO_CONCURRENCY=2`
- 成功すると artifact `promo-videos` を 14 日残し、`main` では 4 本の MP4 と `manifest.json` を commit して push する
- push は `GITHUB_TOKEN` です。イベントスナップショットの更新と同じく、この push では Cloudflare のデプロイが走らないことがあります。公開 URL に載るのは、その後のデプロイです

出力は Workers の `public/` から配ります。

- https://tokyo-event-calendar.illionillion.workers.dev/promo/videos/week-lt.mp4
- https://tokyo-event-calendar.illionillion.workers.dev/promo/videos/week-lt-landscape.mp4
- https://tokyo-event-calendar.illionillion.workers.dev/promo/videos/week-mokumoku.mp4
- https://tokyo-event-calendar.illionillion.workers.dev/promo/videos/week-mokumoku-landscape.mp4
- https://tokyo-event-calendar.illionillion.workers.dev/promo/videos/manifest.json

手元の開発サーバーなら `http://localhost:3000/promo/videos/week-lt.mp4` です。

## 容量

CRF 28、最大 2500k、音声なしです。スクリプトは 1 本が 20MB を超えると失敗します。Workers の静的アセットは 1 ファイルおおよそ 25MB が上限になるためです。Git LFS は使っていません。毎日、同じパスを上書きします。ファイルを消すだけのジョブは置いていません。履歴はその差分の分だけ増えます。

## ライセンス

[Remotion Free License](https://www.remotion.dev/docs/license) です。個人、および従業員 3 人までの組織は無償で、ライセンスキーは不要です。会社の規模が超えたら Remotion の会社向けライセンスが必要です。

フォントは Noto Sans JP（SIL Open Font License）です。本文は `remotion/public/fonts/OFL.txt` にあります。

## 音声を足す場所

`src/WeeklyPromo.tsx` の先頭コメントが差し込み口です。VOICEVOX の wav を `public/voice/narration.wav` に置いて `<Audio>` を足し、レンダーコマンドの `--muted` を外します。BGM も同じコメントの位置です。
