# 告知用スライド

X での公開告知に使う画像 4 枚（1920x1080）と投稿文の素材です。書き出した画像は `public/promo/` に置きます。

| パス                  | 内容                                                                        |
| --------------------- | --------------------------------------------------------------------------- |
| `slides.md`           | スライドの元（[Marp](https://marp.app/)）                                   |
| `.marprc.yml`         | Marp CLI の設定（HTML とローカル画像を許可、1.5 倍で 1920x1080 に書き出し） |
| `img/`                | スライドで使う画像（サイトのスクリーンショット、サイトを開く QR、イラスト） |
| `post.md`             | X の投稿文の案                                                              |
| `tools/render.sh`     | `slides.md` を PNG に書き出して `../public/promo/` に置く                   |
| `tools/count.py`      | `post.md` の投稿文を X の重み付け（全角=2、URL=23）で数える                 |
| `tools/screenshot.py` | 公開中のサイトのスクリーンショットを `shots/` に撮る（`img/` の素材の元）   |
| `../public/promo/`    | 書き出した画像（`promo-01-problem.png` 〜 `promo-04-cta.png`）              |

## 画像の書き出し

Node.js と Chrome（または Chromium / Edge）が必要です。Marp CLI は `npx` で取得します。

```sh
cd promo
bash tools/render.sh
# 中身は次と同じ（出力ファイル名を promo-0N-*.png に付け替える）
# npx @marp-team/marp-cli@4.5.1 --no-stdin slides.md --images png --output <一時ディレクトリ>/slide.png
```

日本語は `Noto Sans CJK JP` で表示します。フォントが無い環境では見た目が変わります。

## 投稿文の文字数

```sh
cd promo
python3 tools/count.py
```

## スクリーンショットの撮り直し

Python の Playwright を使います。venv は `promo/.venv` に作り、コミットしません（`.gitignore` 済み）。

```sh
cd promo
python3 -m venv .venv
. .venv/bin/activate
pip install playwright
CHROME_PATH=/usr/bin/google-chrome python tools/screenshot.py
```

`shots/` に撮った画像（作業用、コミットしない）から、必要な部分を切り出して `img/screenshot-pc.png` / `img/screenshot-mobile.png` を差し替えます。切り出しは手作業です。
