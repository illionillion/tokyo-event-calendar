# MVP Specification

## 1. Overview

### Concept

東京の connpass イベントを、connpass よりも**日付・場所・キーワードから視覚的に探しやすくするイベントカレンダー**。

イベント情報そのものを提供する新しいプラットフォームではなく、既存の connpass イベントを**「眺めて発見するためのビューア」**として提供する。

### Core Value

> 東京の大量の connpass イベントを、一覧性の高い UI で素早く眺め、気になるイベントを見つけられる。

---

## 2. Target

- 東京で IT / エンジニア系イベントを探している人
- connpass を利用している人
- 「connpassにはイベントが大量にあるが、探しづらい」と感じている人

---

## 3. MVP Scope

### Area

MVPでは**東京のみ**を対象とする。

将来的に他地域への展開を妨げない設計にはするが、初期段階では東京に限定する。

### Event Source

connpass のイベント情報を利用する。

MVPでは connpass 以外のイベントプラットフォームは扱わない。

### User Account

不要。

- ログインなし
- 会員登録なし
- ユーザー情報を保持しない

---

## 4. Core UX

### 4.1 Date Navigation

今日を中心とした日付ナビゲーションを表示する。

例:

```text
<   21   22   23   [24]   25   26   27   >
```

- 過去3日
- 今日
- 未来3日
- 前後へ移動するナビゲーション

今日を明確に識別できるようにする。

### 4.2 Month Selection

月を選択して、任意の月へ移動できる。

### 4.3 Event List

選択した日付のイベントを一覧表示する。

イベントカードには最低限以下を表示する。

- サムネイル
- 開催時間
- イベントタイトル
- 会場
- connpass から取得できるタグ等のメタ情報

イベントカードをクリックすると、connpass のイベントページへ遷移する。

詳細なイベント説明、参加者情報、主催者情報などは connpass 側で確認する。

---

# 5. P1 Features

MVPとして実装する。

## 5.1 Mini Calendar

Desktopではイベント一覧の補助としてミニカレンダーを表示する。

用途:

- 日付ナビゲーションから離れた日付へジャンプ
- 月単位でイベントの存在を把握
- 特定の日付を直接選択

Mobileでは基本的に非表示とする。

### UX Principle

- 日付ナビゲーション = 近い日付を移動する
- ミニカレンダー = 遠い日付へジャンプする

同じ機能を二重にするのではなく、役割を分ける。

---

## 5.2 Area Filter

イベントの開催場所によるフィルタリング。

イベント名やコミュニティ名に含まれる駅名などから分類するのではなく、**実際の会場住所をもとに区・市レベルで扱う**。

例:

- 赤羽 → 北区
- 池袋 → 豊島区
- 渋谷 → 渋谷区

オンラインイベントは地域とは別に扱う。

---

## 5.3 Online / Offline Filter

イベントの開催形態をフィルタリングできる。

- Online
- Offline
- All

---

## 5.4 Keyword Search

イベント情報から検索可能な文字列を対象としてキーワード検索する。

例:

- React
- TypeScript
- AI
- Go
- LT
- Ruby

MVPでは独自のカテゴリー体系を作らない。

---

# 6. P2 / Future Features

MVPでは優先度を下げる。

## 6.1 Connpass Tags

connpass 由来のタグ・ハッシュタグ等を検索条件として利用する。

将来的にはタグをクリックすることで検索条件へ遷移できるようにする。

---

## 6.2 URL State

検索条件を URL に保持する。

例:

```text
/events?date=2026-09-26
/events?area=渋谷区
/events?keyword=React
/events?date=2026-09-26&area=渋谷区&keyword=React
```

これにより検索結果を URL で共有できる。

---

## 6.3 Combined Filters

日付・地域・オンライン・キーワード等を組み合わせた検索。

---

# 7. Non-goals

MVPでは以下を作らない。

- イベント作成
- イベント参加申し込み
- 独自イベント管理
- ブックマーク
- フォロー
- 通知
- ユーザーアカウント
- AIによるイベントレコメンド
- AIによるイベント分類
- 手動によるイベントキュレーション
- 主催者向け機能
- connpass 以外のイベントサイトとの統合
- 独自のイベント詳細ページ
- 独自コミュニティ機能

---

# 8. Architecture

仕様は以下を参考にデータ構造などを定義する

https://connpass.com/about/api/v2/

```text
connpass API
     │
     ▼
GitHub Actions
     │
     ▼
events.json
     │
     ▼
Next.js
     │
     ▼
Cloudflare Workers
     │
     ▼
User
```

### Data Fetching

connpass APIから定期的にイベント情報を取得する。

ユーザーアクセスのたびに connpass API を直接呼び出す方式にはしない。

GitHub Actions 等で定期的に取得し、正規化した JSON データを生成する。

### Storage

MVPではDBを使用しない。

イベントデータは JSON として扱う。

### Backend

MVPでは独自バックエンドAPIを作らない。

### Authentication

不要。

---

# 9. Technology

- Next.js
- TypeScript
- Cloudflare Workers
- GitHub Actions
- JSON

Frontendは Next.js / TypeScript を利用する。

Cloudflare Pagesではなく Cloudflare Workers を利用する。

---

# 10. Success Criteria

MVPの成功条件は機能数ではなく、以下。

> **東京の connpass イベントを探すとき、connpass を直接開くよりも、このサービスを開いた方がイベントを一覧して探しやすい。**

特に以下を重視する。

- 今日〜今週のイベントを素早く把握できる
- 大量のイベントを一覧で眺められる
- 日付を簡単に切り替えられる
- 開催場所で絞り込める
- キーワードで探せる
- 気になったイベントからすぐ connpass に移動できる

---

# 11. MVP Priority

### P0

- connpass イベント取得
- 東京イベント
- 日付ナビ
- 月選択
- イベント一覧
- イベントカード
- connpassへの遷移
- Responsive UI

### P1

- ミニカレンダー
- 区・市フィルター
- Online / Offline フィルター
- キーワード検索

### P2

- タグ検索
- URL state
- 複合フィルター
- その他の利便性向上

---

# 12. Product Principle

機能を増やすことよりも、

> **「東京の大量のITイベントを、いかに気持ちよく眺めて発見できるか」**

を優先する。

MVPでは機能を増やしすぎず、イベント発見体験の改善に集中する。
