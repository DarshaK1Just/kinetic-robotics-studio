#!/usr/bin/env python3
"""Static content smoke checks; deliberately dependency-free."""
import sys,json,re
from pathlib import Path
root=Path(__file__).resolve().parents[1]
folder=Path(sys.argv[1]) if len(sys.argv)>1 else root
html=(folder/'index.html').read_text(encoding='utf-8')
assert '<title>Kinetic Robotics Studio</title>' in html
assert '<main ' in html
assert 'window.KINETIC_CONTENT=' in html
assert 'window.KINETIC_VIDEOS=' in html
assert 'window.KINETIC_CONTENT=__CONTENT__' not in html
assert len(html)>500_000
if (root/'src/content.json').exists():
 data=json.loads((root/'src/content.json').read_text())
 assert len(data['lessons'])>=50
 print('Lessons:',len(data['lessons']))
print('Site OK:',folder/'index.html', 'bytes:',len(html.encode()))
