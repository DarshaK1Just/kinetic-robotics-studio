from pathlib import Path
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads((ROOT/'src/content.json').read_text()); HTML=(ROOT/'index.html').read_text()
results=[];errors=[]
def check(name,fn):
 print('CHECK',name,flush=True)
 try:
  value=fn()
  if value is False:raise AssertionError('Returned False')
  results.append({'name':name,'status':'passed','detail':value})
 except Exception as e:results.append({'name':name,'status':'failed','detail':str(e)[:500]})
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':1440,'height':1000},accept_downloads=True)
 page.set_default_timeout(5000)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(HTML,wait_until='domcontentloaded');page.wait_for_timeout(200)
 def go(r):
  print('ROUTE',r,flush=True)
  page.evaluate('(r)=>location.hash=r',r);page.wait_for_timeout(50)
 failures=[]
 for l in DATA['lessons']:
  go('/lesson/'+l['id'])
  if not page.locator('#lesson-body').count() or len(page.locator('#lesson-body').inner_text())<40:failures.append(l['id'])
 check('All 61 lesson routes render their content',lambda:len(failures)==0)
 failedstages=[]
 for project in DATA['projects']:
  for stage in range(5):
   go('/project/'+project['id']+'/'+str(stage))
   if page.locator('.stage-panel').count()!=2 or not page.locator('.stage-steps a.active').count():failedstages.append([project['id'],stage])
 check('All 100 project-stage routes render',lambda:not failedstages)
 failedmodules=[]
 for m in DATA['modules']:
  go('/module/'+m['id'])
  if page.locator('.ks-path-lesson').count()!=len(m['lessons']):failedmodules.append(m['id'])
 check('All 12 modules have the intended lesson sequence',lambda:not failedmodules)
 go('/code')
 for preset in ['circuit','pid','planner','learning']:
  page.select_option('#code-preset',preset);page.click('[data-action=run-code]');page.wait_for_function('document.querySelector("#code-state").textContent!=="RUNNING"',timeout=8000)
  check('JavaScript preset executes: '+preset,lambda:'Execution complete.' in page.locator('#code-output').inner_text() and 'Error:' not in page.locator('#code-output').inner_text())
 go('/library')
 for clip in ['pid','arm','learning']:
  page.click('[data-local-video='+clip+']');page.wait_for_function('document.querySelector("video").readyState>=1',timeout=5000)
  check('Local video metadata: '+clip,lambda:abs(page.evaluate('document.querySelector("video").duration')-8)<.1)
  page.click('[data-close]')
 go('/sandbox/pid');page.click('[data-action=lab-focus]');check('Simulation focus uses full viewport',lambda:page.locator('#app.sim-focused').count()==1);page.keyboard.press('Escape');check('Escape exits simulation focus',lambda:page.locator('#app.sim-focused').count()==0)
 go('/project/project-01/0');page.click('[data-action=slideshow]');page.wait_for_timeout(15400)
 check('Guided slideshow advances to next stage',lambda:page.evaluate('location.hash.endsWith("/1")'))
 page.click('[data-action=slideshow]');check('Slideshow can be paused',lambda:'Guided slides' in page.locator('[data-action=slideshow]').inner_text())
 go('/settings');page.select_option('[data-setting=scale]','1.2');go('/lesson/math-foundations');check('Comfort typography fits desktop',lambda:page.evaluate('document.body.scrollWidth<=innerWidth+1'))
 # Exercise progress import using a file chooser. This tests application state restoration,
 # not persistence across reloads on a real browser origin.
 export={'version':1,'name':'Workshop Learner','theme':'ocean','mode':'light','motion':'reduced','scale':1,'rate':1,'path':'software','hours':9,'complete':{'engineering-method':True},'notes':{'math-foundations':'Observed 1 metre in 5 seconds; 0.2 m/s.'},'checks':{},'quizzes':{},'custom':[]}
 go('/settings')
 with page.expect_file_chooser() as fc:page.click('[data-action=import-progress]')
 fc.value.set_files({'name':'progress.json','mimeType':'application/json','buffer':json.dumps(export).encode()});page.wait_for_timeout(250)
 check('Progress JSON restores learner settings',lambda:page.evaluate('KineticDebug.state().name==="Workshop Learner"&&KineticDebug.state().hours===9'))
 check('Progress JSON restores notes and completion',lambda:page.evaluate('KineticDebug.state().complete["engineering-method"]&&KineticDebug.state().notes["math-foundations"].includes("0.2")'))
 go('/lesson/math-foundations/notes');check('Restored notebook is editable',lambda:'0.2 m/s' in page.locator('textarea[data-note="math-foundations"]').input_value())
 go('/settings')
 with page.expect_download(timeout=6000) as info:page.click('[data-action=export-progress]')
 dl=info.value;dl.save_as(str(ROOT/'qa/export-fixture.json'))
 exported=json.loads((ROOT/'qa/export-fixture.json').read_text())
 check('Progress export is a valid portable JSON file',lambda:exported.get('version')==1 and exported.get('name')=='Workshop Learner')
 # Final preview in the default palette with reduced decorative motion to avoid a blink frame.
 page.evaluate('KineticDebug.state().theme="violet";KineticDebug.state().name="Darshak";KineticDebug.state().scale=1;KineticDebug.state().motion="reduced";KineticDebug.state().complete={};')
 go('/settings');page.click('[data-theme-choice=violet]');go('/home');page.wait_for_timeout(350)
 page.screenshot(path=str(ROOT/'qa/final-home-viewport.png'))
 page.screenshot(path=str(ROOT/'qa/final-home-full.png'),full_page=True)
 go('/project/project-01/2');page.screenshot(path=str(ROOT/'qa/final-project.png'),full_page=True)
 go('/sandbox/arm');page.screenshot(path=str(ROOT/'qa/final-arm.png'),full_page=True)
 go('/sandbox/pid');page.evaluate('KineticDebug.lab().motor.history=Engine.pid({seconds:8});let a=KineticDebug.lab().motor;const r=a.history.at(-1);a.t=r.t;a.theta=r.position;a.peak=Math.max(...a.history.map(x=>x.position));KineticDebug.lab().updateMetrics();');page.wait_for_timeout(80);page.evaluate('scrollTo(0,0)');page.screenshot(path=str(ROOT/'qa/final-pid.png'),full_page=True)
 go('/code');page.select_option('#code-preset','learning');page.click('[data-action=run-code]');page.wait_for_timeout(250);page.evaluate('scrollTo(0,0)');page.screenshot(path=str(ROOT/'qa/final-code.png'),full_page=True)
 page.set_viewport_size({'width':390,'height':844});go('/home');page.screenshot(path=str(ROOT/'qa/final-mobile.png'),full_page=True)
 check('No uncaught error during full content sweep',lambda:len(errors)==0)
 b.close()
report={'environment':'Same headless local-content fixture as browser_smoke.py. Progress import/export was tested; origin-based reload persistence and external playback were not.','passed':sum(t['status']=='passed'for t in results),'failed':sum(t['status']=='failed'for t in results),'uncaught_errors':errors,'tests':results}
(ROOT/'qa/extended-results.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
