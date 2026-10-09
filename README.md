# Tokyo Event Calendar

東京の connpass イベントを、日付・場所・キーワードから視覚的に探しやすくするイベントカレンダーです。

## Getting Started

```bash
pnpm install
pnpm dev
```

[http://localhost:3000](http://localhost:3000) を開いて確認してください。

イベントは `data/events.json` のスナップショットから表示します。中身は [connpass API v2](https://connpass.com/about/api/v2/) のイベント一覧レスポンスと同じ形で、開催日は API の日時のままです。検索条件は URL に保持します。

## イベントデータの更新

サイトからは connpass API を呼びません。API を呼ぶのは GitHub Actions の定期実行だけです。

1. `.github/workflows/update-events.yml` が 1 日 1 回（UTC 18:00 = 日本時間 3:00、手動実行も可）動く
2. `scripts/fetch-connpass-events.ts` が connpass API v2 のイベント一覧（`GET /api/v2/events/`）から、東京都・神奈川県・埼玉県・千葉県（`prefecture=tokyo`, `kanagawa`, `saitama`, `chiba`）で今月から 3 か月分のイベントを開催日時順に 100 件ずつ取得する。リクエストは 5 秒に 1 回まで
3. 主催者のニックネーム・表示名・ID は落とし、`image_url` はそのまま `data/events.json` に書き出す。カードは URL があるときその画像を表示する。API リファレンスでは、この URL はある程度の時間で失効し、外部サイトでの直接参照は控えるよう記載されている
4. 変更があれば `main` に commit・push し、アプリはその JSON を読む

API キーは GitHub の Environment `workflow` の secret `CONNPASS_API_KEY` に置き、ワークフローから `pnpm fetch:events` で参照します。手元では `.env` にキーを書いて `pnpm fetch:events:local`（`tsx --env-file=.env` 経由）。CI と同じ渡し方なら `CONNPASS_API_KEY=... pnpm fetch:events` でも可（キーはログに出しません）。

API の利用条件は [connpass API利用規約](https://help.connpass.com/api/api-term) と [API リファレンス](https://connpass.com/about/api/v2/) に従います。

## Scripts

| Command                   | Description                   |
| ------------------------- | ----------------------------- |
| `pnpm dev`                | 開発サーバー起動              |
| `pnpm build`              | 本番ビルド                    |
| `pnpm start`              | 本番サーバー起動              |
| `pnpm lint`               | ESLint                        |
| `pnpm type-check`         | TypeScript 型チェック         |
| `pnpm format`             | Prettier で整形               |
| `pnpm format:check`       | Prettier チェック             |
| `pnpm test`               | Vitest（watch）               |
| `pnpm test:run`           | Vitest（一回実行）            |
| `pnpm test:coverage`      | Vitest + coverage             |
| `pnpm fetch:events`       | スナップショット取得（CI 用） |
| `pnpm fetch:events:local` | 同上（`.env` を読む）         |

## Development tooling

- **Lint / Format**: ESLint + Prettier
- **Test**: Vitest + Testing Library
- **Git hooks**: lefthook（pre-commit / commit-msg）
- **Commit message**: Conventional Commits（commitlint）
- **CI**: GitHub Actions（`.github/workflows/ci.yml`）
