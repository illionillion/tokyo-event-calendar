# Tokyo Event Calendar

東京の connpass イベントを、日付・場所・キーワードから視覚的に探しやすくするイベントカレンダーです。

## Getting Started

```bash
pnpm install
pnpm dev
```

[http://localhost:3000](http://localhost:3000) を開いて確認してください。

connpass API のキーが無い間は、`data/events.json` のモックを表示します。日付は東京の今日からの相対日です。検索条件は URL に保持します。

## Scripts

| Command              | Description           |
| -------------------- | --------------------- |
| `pnpm dev`           | 開発サーバー起動      |
| `pnpm build`         | 本番ビルド            |
| `pnpm start`         | 本番サーバー起動      |
| `pnpm lint`          | ESLint                |
| `pnpm type-check`    | TypeScript 型チェック |
| `pnpm format`        | Prettier で整形       |
| `pnpm format:check`  | Prettier チェック     |
| `pnpm test`          | Vitest（watch）       |
| `pnpm test:run`      | Vitest（一回実行）    |
| `pnpm test:coverage` | Vitest + coverage     |

## Development tooling

- **Lint / Format**: ESLint + Prettier
- **Test**: Vitest + Testing Library
- **Git hooks**: lefthook（pre-commit / commit-msg）
- **Commit message**: Conventional Commits（commitlint）
- **CI**: GitHub Actions（`.github/workflows/ci.yml`）
