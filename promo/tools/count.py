"""post.md の投稿文を X の重み付け（全角=2、URL=23）で数える。使い方: python3 tools/count.py"""
import re
from pathlib import Path

POST = Path(__file__).resolve().parent.parent / "post.md"
URL="https://tokyo-event-calendar.illionillion.workers.dev/"
def w(t):
    t=re.sub(r"https?://\S+","U"*23,t)
    n=0
    for ch in t:
        cp=ord(ch)
        if ch=="U": n+=1; continue
        # twitter-text: these ranges weight 1, others 2
        if cp<=0x10FF or 0x2000<=cp<=0x200D or 0x2010<=cp<=0x201F or 0x2032<=cp<=0x2037: n+=1
        else: n+=2
    return n
for name,t in [(a,b) for a,b in re.findall(r"<!--(\w+)-->\n(.*?)\n<!--end-->",POST.read_text(encoding='utf-8'),re.S)]:
    print(name, w(t), "/280")
