---
marp: true
size: 16:9
paginate: false
style: |
  section {
    
    font-family: "Noto Sans CJK JP", sans-serif;
    background: #f5f6f7;
    color: #2c3034;
    padding: 56px 56px 56px 72px;
    font-size: 36px;
    line-height: 1.5;
  }
  h1 { font-size: 60px; font-weight: 900; color: #2c3034; margin: 0 0 28px; letter-spacing: 0.02em; }
  .accent { color: #c83e3a; }
  .bar { position: absolute; top: 0; left: 0; right: 0; height: 14px; background: #c83e3a; }
  .brand { position: absolute; top: 34px; right: 56px; font-size: 24px; color: #5e666e; font-weight: 700; }
  .q { background: #fff; border: 2px solid #e3e5e8; border-left: 12px solid #c83e3a; border-radius: 18px;
       padding: 22px 32px; margin: 0 0 24px; font-size: 40px; font-weight: 700; }
  .cols { display: flex; gap: 32px; align-items: center; width: 100%; }
  .cols > div { min-width: 0; }
  .cols img { display: block; max-width: 100%; height: auto; }
  .lead { font-size: 44px; font-weight: 900; line-height: 1.35; margin: 0 0 20px; }
  .sub { font-size: 32px; color: #2c3034; line-height: 1.55; }
  .shot { border-radius: 16px; border: 2px solid #e3e5e8; box-shadow: 0 8px 24px rgba(0,0,0,.12); background: #fff; }
  ul.feat { list-style: none; padding: 0; margin: 0; }
  ul.feat li { font-size: 34px; font-weight: 700; margin: 0 0 22px; padding-left: 52px; position: relative; line-height: 1.4; }
  ul.feat li::before { content: "✓"; position: absolute; left: 0; top: 0; width: 38px; height: 38px; border-radius: 50%;
       background: #c83e3a; color: #fff; font-size: 26px; text-align: center; line-height: 38px; }
  .small { font-size: 26px; color: #5e666e; font-weight: 500; }
  .sat { color: #2b62b0; } .sun { color: #b83a36; }
  .url { font-size: 34px; font-weight: 700; color: #2c3034; background: #fff; border: 2px solid #e3e5e8; border-radius: 12px; padding: 12px 18px; word-break: break-all; }
  .note { position: absolute; bottom: 28px; left: 72px; font-size: 24px; color: #5e666e; font-weight: 500; }
  .target { display: inline-block; background: #c83e3a; color: #fff; font-size: 30px; font-weight: 700; border-radius: 999px; padding: 6px 26px; margin: 0 0 14px; }
  .cta { font-size: 72px; font-weight: 900; color: #c83e3a; line-height: 1.25; margin: 0 0 24px; }
  .s1 .q { font-size: 31px; padding: 14px 26px; margin: 0 0 16px; white-space: nowrap; }
  h1.h1s { font-size: 50px; margin: 0 0 20px; white-space: nowrap; }
  .nw { white-space: nowrap; }
  ul.res { list-style: none; padding: 0; margin: 0; }
  ul.res li { font-size: 31px; font-weight: 700; margin: 0 0 20px; padding-left: 50px; position: relative; line-height: 1.38; }
  ul.res li::before { content: "✓"; position: absolute; left: 0; top: 2px; width: 36px; height: 36px; border-radius: 50%;
       background: #c83e3a; color: #fff; font-size: 24px; text-align: center; line-height: 36px; }
  ul.res li .tag { display: block; font-size: 22px; font-weight: 500; color: #5e666e; margin-top: 2px; }
  .url1 { font-size: 27px; font-weight: 700; color: #2c3034; background: #fff; border: 2px solid #e3e5e8; border-radius: 12px; padding: 10px 16px; white-space: nowrap; display: inline-block; }
  .links { margin: 0; }
  .link { background: #fff; border: 2px solid #e3e5e8; border-radius: 14px; padding: 12px 20px; margin: 0 0 14px; width: 680px; box-sizing: border-box; }
  .link .lb { display: block; font-size: 20px; font-weight: 700; color: #c83e3a; line-height: 1.4; }
  .link .lb span { color: #5e666e; font-weight: 500; }
  .link .u { display: block; font-size: 25px; font-weight: 700; color: #2c3034; white-space: nowrap; line-height: 1.4; }
  .repo { font-size: 23px; color: #2c3034; margin: 14px 0 0; line-height: 1.5; }
  .repo b { color: #2c3034; }

---

<div class="bar"></div>

<div class="cols">
<div style="flex: 1;">
<div class="target">connpass でイベントを探している人へ</div>
<h1 class="h1s">こんなこと、ありませんか？</h1>
<div class="s1">
<div class="q">「このイベント、今日予定空いてたから<br>行けたのに…」</div>
<div class="q">「気になる connpass のイベント、<br>自分はつい見逃しちゃう」</div>
<div class="q">「日付ごとに、パッと眺めて探したい」</div>
</div>
</div>
<div style="flex: 0 0 470px;">
<img src="img/illust-problem.svg" style="width: 470px;">
</div>
</div>

<div class="brand">東京イベントカレンダー（試作）</div>

---

<div class="bar"></div>

<div class="cols">
<div style="flex: 0 0 450px;">
<p class="lead">見やすい<br><span class="accent">カレンダー</span>を<br>作ってみました</p>
<p class="sub nw" style="font-size: 28px;">平日の空いてる日も土日も、<br>行きたいと思えるイベントを<br>見つけたくて、東京近郊の<br>connpass のイベントを<br>日付で一覧にしました。</p>
</div>
<div style="flex: 1;">
<img class="shot" src="img/screenshot-pc.png" style="width: 100%;">
</div>
</div>

<div class="note">connpass API のイベント情報を使った非公式の個人開発です</div>

---

<div class="bar"></div>

<div class="cols">
<div style="flex: 1;">
<h1 class="h1s">使うと、こう探せます</h1>
<ul class="res">
<li>来週の土曜に行けるイベントがすぐ分かる<span class="tag">日付ナビ・カレンダー／土曜は青、日曜・祝日は赤</span></li>
<li>北区・港区など、行きやすいエリアの<br>イベントだけ見られる<span class="tag">エリアの複数選択</span></li>
<li>React や LT など、気になるテーマだけ<br>オンライン／会場で探せる<span class="tag">キーワード・開催形態の絞り込み</span></li>
<li>スマホでも日付から探せる<span class="tag">カレンダーから日付を選択</span></li>
</ul>
<p class="small" style="margin: 6px 0 0; font-size: 22px;">東京・神奈川・埼玉・千葉の connpass のイベントを毎日自動更新</p>
</div>
<div style="flex: 0 0 320px;">
<img class="shot" src="img/screenshot-mobile.png" style="width: 320px;">
</div>
</div>

---

<div class="bar"></div>

<div class="cols" style="align-items: center;">
<div style="flex: 1;">
<p class="cta" style="font-size: 64px; margin: 0 0 14px;">使ってみて、<br>感想ください！</p>
<p class="sub nw" style="margin: 0 0 26px; font-size: 28px;">名前も機能もまだまだ試作中です。<br>感想・改善案は @Sei_engineer までリプ・DMで！</p>
<div class="links">
<div class="link"><span class="lb">サイト</span><span class="u">tokyo-event-calendar.illionillion.workers.dev</span></div>
<div class="link"><span class="lb">GitHub <span>（要望・不具合は Issue でも歓迎）</span></span><span class="u">github.com/illionillion/tokyo-event-calendar</span></div>
</div>
</div>
<div style="flex: 0 0 320px; text-align: center;">
<img src="img/qr.png" style="width: 320px; border-radius: 16px; border: 2px solid #e3e5e8;">
<p class="small" style="margin: 8px 0 0;">サイトを開く QR</p>
</div>
</div>

<div class="note">※ connpass API のイベント情報を使った非公式の個人開発です</div>
