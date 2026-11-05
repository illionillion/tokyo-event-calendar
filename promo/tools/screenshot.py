"""公開中のサイトのスクリーンショットを promo/shots/ に撮る（img/ の素材の元）。

使い方: promo/ で venv を作り `pip install playwright` のうえ `python tools/screenshot.py`。
Chrome は /usr/bin/google-chrome を使う（環境に合わせて CHROME_PATH で変更できる）。
エリア絞り込みの画面は、日本時間で次の土曜日を表示する（SHOT_DATE=YYYY-MM-DD で変更できる）。
"""
import asyncio
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from playwright.async_api import async_playwright

SHOTS = Path(__file__).resolve().parent.parent / "shots"
CHROME = os.environ.get("CHROME_PATH", "/usr/bin/google-chrome")
BASE="https://tokyo-event-calendar.illionillion.workers.dev/"


def next_saturday() -> str:
    today = datetime.now(timezone(timedelta(hours=9))).date()
    return (today + timedelta(days=(5 - today.weekday()) % 7 or 7)).isoformat()


SHOT_DATE = os.environ.get("SHOT_DATE") or next_saturday()
async def main():
    SHOTS.mkdir(exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        pc = await b.new_context(viewport={"width":1440,"height":900}, device_scale_factor=2, locale="ja-JP", timezone_id="Asia/Tokyo")
        pg = await pc.new_page()
        await pg.goto(BASE, wait_until="load", timeout=90000); await pg.wait_for_timeout(4000)
        await pg.screenshot(path=str(SHOTS / "pc-home@2x.png"))
        await pg.goto(BASE+f"?date={SHOT_DATE}&area=%E5%8C%97%E5%8C%BA&area=%E6%B8%AF%E5%8C%BA", wait_until="load", timeout=90000); await pg.wait_for_timeout(4000)
        await pg.screenshot(path=str(SHOTS / "pc-areas@2x.png"))
        sp = await b.new_context(viewport={"width":390,"height":844}, device_scale_factor=3, locale="ja-JP", timezone_id="Asia/Tokyo", is_mobile=True, has_touch=True)
        m = await sp.new_page()
        await m.goto(BASE, wait_until="load", timeout=90000); await m.wait_for_timeout(4000)
        await m.screenshot(path=str(SHOTS / "sp-home@3x.png"))
        await m.get_by_text("カレンダーから日付を選ぶ").click(); await m.wait_for_timeout(800)
        await m.screenshot(path=str(SHOTS / "sp-calendar@3x.png"))
        await b.close()
asyncio.run(main())
