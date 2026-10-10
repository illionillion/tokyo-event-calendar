#!/usr/bin/env bash
# slides.md を PNG に書き出し、../public/promo/promo-0N-*.png に置く。
# 使い方: promo/ で `bash tools/render.sh`（Node.js が必要。Marp CLI は npx で取得）
set -euo pipefail

cd "$(dirname "$0")/.."

out_dir="../public/promo"
names=(promo-01-problem promo-02-intro promo-03-features promo-04-cta)
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

# 設定は .marprc.yml（html / allowLocalFiles / imageScale）
npx --yes @marp-team/marp-cli@4.5.1 --no-stdin slides.md --images png --output "$tmp_dir/slide.png"

mkdir -p "$out_dir"
for index in "${!names[@]}"; do
  source_file="$(printf '%s/slide.%03d.png' "$tmp_dir" "$((index + 1))")"
  if [[ ! -f "$source_file" ]]; then
    echo "スライド $((index + 1)) の PNG が見つかりません: $source_file" >&2
    exit 1
  fi
  mv "$source_file" "$out_dir/${names[$index]}.png"
done

echo "${#names[@]} 枚を $out_dir に書き出しました"
