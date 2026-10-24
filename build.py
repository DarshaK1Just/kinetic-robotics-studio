"""Build one portable HTML page from editable source files and bundled clips."""
from pathlib import Path
import base64,json,argparse
ROOT=Path(__file__).parent
src=ROOT/'src'
def jsjson(obj):
 return json.dumps(obj,ensure_ascii=True,separators=(',',':')).replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026')
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--embed-media',action='store_true')
parser.add_argument('--output',type=Path,default=ROOT/'index.html')
args=parser.parse_args()
content_path=src/('content-embedded.json' if args.embed_media else 'content.json')
if not content_path.exists():parser.error('Run embed_media.py before using --embed-media.')
content=json.loads(content_path.read_text(encoding='utf-8'))
for lesson in content['lessons']:
 lesson['body']=lesson['body'].replace('numbered buttons on a photograph reveal an explanation','hover, focus or tap the highlighted regions of a photograph to reveal an explanation')
 lesson['body']=lesson['body'].replace('The companion package includes a local-image builder for your own connected computer.','The source package includes a localhost launcher and an optional media-embedding script for your own internet-connected computer.')
clips={p.stem:'data:video/mp4;base64,'+base64.b64encode(p.read_bytes()).decode() for p in sorted((ROOT/'assets').glob('*.mp4'))}
html='''<!DOCTYPE html>
<html lang="en" data-theme="violet" data-mode="light">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="theme-color" content="#f5f4fa">
<meta name="description" content="A local-first interactive robotics workshop: 12 learning modules, 20 project journeys, real-source component tours, six computed simulations, code experiments and an evidence notebook.">
<title>Kinetic Robotics Studio</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='11' fill='%237256e8'/%3E%3Cpath d='M12 9v22m16-22L12 21l16 10' fill='none' stroke='white' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E">
<style>__CSS__</style>
</head><body>
<a class="skip" href="#app">Skip to learning content</a>
<header class="topbar" id="header"></header>
<main class="shell" id="app" tabindex="-1"><div class="warmup"><h1>Your workshop is opening.</h1><p>The core studio runs locally. External reference photos and video services need internet.</p></div></main>
<dialog class="dialog" id="modal" aria-label="Learning studio dialog"></dialog>
<div class="toast" id="toast" role="status" hidden></div>
<noscript><section style="padding:40px"><h1>JavaScript is needed for this interactive studio.</h1><p>Enable JavaScript in a modern browser. Native source files and the reference document are available in the companion source package.</p></section></noscript>
<script>window.KINETIC_CONTENT=__CONTENT__;window.KINETIC_VIDEOS=__VIDEOS__;window.ENGINE_SOURCE=__ENGINESTRING__;</script>
<script>__ENGINE__</script>
<script>__SCENE__</script>
<script>__LABS__</script>
<script>__APP__</script>
</body></html>'''
for key,value in [('CSS',(src/'styles.css').read_text()),('CONTENT',jsjson(content)),('VIDEOS',jsjson(clips)),('ENGINESTRING',jsjson((src/'engine.js').read_text())),('ENGINE',(src/'engine.js').read_text()),('SCENE',(src/'scene.js').read_text()),('LABS',(src/'labs.js').read_text()),('APP',(src/'app.js').read_text())]:
 html=html.replace('__'+key+'__',value)
args.output.parent.mkdir(parents=True,exist_ok=True)
args.output.write_text(html,encoding='utf-8')
print('Built',len(html.encode()),'bytes;',len(content['lessons']),'lessons;',len(clips),'offline clips')
