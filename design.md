# Design Specification

## 1. Design Direction

### Concept

**connpass をベースにした、より見やすいイベントカレンダー UI。**

完全に独自のデザインシステムを作るのではなく、connpass の持つ

* シンプルさ
* 情報密度
* ITイベントサービスらしさ
* 赤系のブランドカラー
* 情報を中心としたUI

を参考にする。

一方で、connpass に存在しない UI は本サービス独自に設計する。

---

# 2. Design Principles

## 2.1 Information First

装飾よりもイベント情報の視認性を優先する。

イベント数が多くても一覧性を損なわない。

## 2.2 Familiar

connpass を利用したことがあるユーザーが見たときに、

> 「connpassのイベントを見るためのサービスだな」

と直感的に理解できる UI にする。

## 2.3 Simple

不要な装飾・アニメーション・グラデーション等は避ける。

## 2.4 Dense but Readable

東京のイベントは数が多いため、情報量は確保する。

ただし、情報を詰め込みすぎて読みにくくならないようにする。

---

# 3. Brand / Color

## Primary

connpass を想起させる**赤系**を基本カラーとして使用する。

用途:

* Primary button
* Selected date
* Active filter
* Link
* Important accent

具体的な色コードは実装時に決定する。

---

## Background

基本は明るい背景。

```text
Page background
→ white / very light gray

Card
→ white

Border
→ light gray

Secondary surface
→ very light gray
```

---

## Text

```text
Primary
→ dark gray / near black

Secondary
→ medium gray

Muted
→ light gray
```

黒をそのまま使用するより、少し柔らかいダークグレーを基本とする。

---

# 4. Typography

日本語を読みやすい sans-serif を使用する。

基本的な情報階層:

```text
Page title
↓
Date
↓
Event title
↓
Event metadata
↓
Tags / secondary information
```

### Event Title

イベント一覧の中で最も重要な情報の一つ。

* 過度に大きくしない
* 太さで優先度を出す
* 長いタイトルは適切に省略する
* 一覧性を優先する

### Metadata

以下はタイトルより小さくする。

* 開催時間
* 会場
* 開催形式
* タグ

---

# 5. Layout

## Desktop

基本構造:

```text
┌────────────────────────────────────────────┐
│ Header                                     │
├────────────────────────────────────────────┤
│                                            │
│ Date Navigation                            │
│                                            │
├───────────────┬────────────────────────────┤
│               │                            │
│ Mini Calendar │ Event List                │
│               │                            │
│ Filters       │ Event Card                │
│               │ Event Card                │
│               │ Event Card                │
│               │ ...                        │
│               │                            │
└───────────────┴────────────────────────────┘
```

Desktopではイベント一覧を主役にする。

ミニカレンダーやフィルターは補助的な位置づけ。

---

# 6. Mobile

Mobileではイベント一覧を最優先する。

```text
Header
↓
Date Navigation
↓
Filters
↓
Event List
```

Desktop用のサイドバーをそのまま縮小するのではなく、横幅に合わせてUIを再構成する。

ミニカレンダーは基本的に非表示。

---

# 7. Header

シンプルなヘッダー。

基本要素:

* サービス名 / ロゴ
* 必要最小限のナビゲーション

MVPではユーザーアカウント関連のUIを配置しない。

---

# 8. Date Navigation

本サービスの主要UI。

例:

```text
<   21   22   23   [24]   25   26   27   >
```

### Selected Date

Primary color を使用して明確にする。

### Today

今日であることを明確に識別できるようにする。

### Past / Future

過去・未来の日付は selected date より弱い視覚的優先度にする。

---

# 9. Mini Calendar

Desktopのみ表示する。

目的:

* 特定の日付へのジャンプ
* 月単位でのイベント探索
* 現在位置の把握

Date Navigationとの役割を重複させない。

```text
Date Navigation
→ 近い日付を見る

Mini Calendar
→ 離れた日付へ移動する
```

---

# 10. Filters

## Area

区・市単位で表示する。

例:

```text
東京都
├── 渋谷区
├── 新宿区
├── 豊島区
├── 北区
└── ...
```

駅名そのものでは分類しない。

イベント会場の住所を基準にする。

---

## Event Type

```text
All
Online
Offline
```

---

## Keyword

イベント情報を対象に検索する。

検索ボックスは過度に大きくせず、イベント一覧を邪魔しない。

---

# 11. Event Card

イベント発見体験の中心となるコンポーネント。

基本構造:

```text
┌─────────────────────────────────────┐
│                                     │
│ [Thumbnail]                         │
│             19:00 - 21:00           │
│             React LT Night           │
│             📍渋谷区                 │
│             #React #LT               │
│                                     │
└─────────────────────────────────────┘
```

### Required Information

* Thumbnail
* Time
* Title
* Venue
* Available tags / metadata

---

## Card Priority

視覚的優先順位:

```text
Title
↓
Time / Venue
↓
Tags / secondary information
```

---

## Thumbnail

イベントごとの視覚的な違いを出すために利用する。

ただし、サムネイルが主役になりすぎないようにする。

画像が存在しない場合の fallback UI を用意する。

---

## Card Interaction

カード全体をクリック可能にする。

クリック先:

**connpass event page**

本サービス内にイベント詳細ページは作らない。

---

# 12. Tags

connpass から取得できるタグ等を表示する。

独自カテゴリーを大量に作らない。

例:

```text
#React
#TypeScript
#AI
#Go
```

タグは情報補助として扱い、カードの主役にはしない。

---

# 13. Buttons

基本的にシンプルなボタン。

Primary:

* 赤系
* 白文字

Secondary:

* 白 / light gray
* Border

過剰なshadowや装飾は使用しない。

---

# 14. Border / Radius

基本は控えめ。

```text
Card radius
→ 8px程度

Button radius
→ 6px程度

Input radius
→ 6px程度
```

角丸を大きくしすぎて、モバイルアプリのような雰囲気にはしない。

---

# 15. Hover / Interaction

Desktopでは hover を利用してクリック可能な要素を示す。

例:

* Card background の変化
* Border の変化
* 軽い shadow
* Link color の変化

ただし派手なアニメーションは使用しない。

---

# 16. Responsive

## Desktop

* イベント一覧を広く取る
* ミニカレンダーを表示
* フィルターを常時表示可能

## Tablet

* サイド要素を縮小
* イベント一覧を優先

## Mobile

* イベント一覧を最優先
* ミニカレンダーを非表示
* フィルターをコンパクトにする
* カードを縦方向中心にする
* 日付ナビゲーションを横スクロール可能にする

---

# 17. Empty State

イベントが存在しない場合。

例:

```text
この日のイベントはありません
```

必要に応じて、

* 前日
* 翌日
* フィルター解除

などの導線を提供する。

---

# 18. Loading State

イベント取得中は skeleton 等を利用する。

レイアウトシフトを避ける。

---

# 19. Error State

イベントデータ取得に失敗した場合、

```text
イベントを取得できませんでした。
しばらくしてから再度お試しください。
```

など、原因を過度に説明せずユーザーが理解できる状態にする。

---

# 20. Visual Reference

基本的な視覚的リファレンスとして connpass を利用する。

ただし、

* ロゴ
* 商標
* 独自画像
* 固有アイコン
* 画面の完全なコピー

などはそのまま複製しない。

**「connpassらしい情報設計・色調を参考にしつつ、本サービス独自のイベント探索UIを構築する」**ことを基本方針とする。

---

# 21. Implementation Principle

Pen.dev 等で完全なデザインを事前に作り込むことは必須としない。

基本方針:

```text
Design Spec
    ↓
Implementation
    ↓
Playwright Screenshot
    ↓
Visual Review
    ↓
Adjustment
```

実装後のスクリーンショットを確認しながら、余白・情報密度・視認性・レスポンシブを調整する。

デザインの完成度よりも、**実際のイベントデータを大量に表示した状態で使いやすいこと**を優先する。
