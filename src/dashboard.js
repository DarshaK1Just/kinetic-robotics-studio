/* Kinetic dashboard: original interactive UI, no network dependency.
 * Progress is self-reported; focus minutes measure a timer, not mastery.
 */
(function (root) {
  'use strict';

  const TRACKS = [
    { id: 'all', label: 'All modules', ids: null },
    { id: 'foundations', label: 'Foundations', ids: ['01','02','03','04','05','06'] },
    { id: 'autonomy', label: 'Robotics & autonomy', ids: ['07','08','09','10'] },
    { id: 'industry', label: 'Industry & research', ids: ['11','12'] },
    { id: 'saved', label: 'Saved', ids: null }
  ];
  const LESSON_TIME_NOTE = 'Reading estimate at 200 words per minute; practice takes longer.';
  const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0));
  const empty = () => ({ saved: [], filter: 'all', layout: 'grid', challenge: null, sessions: [], timer: { duration: 15, remaining: 900, deadline: 0 }, evidence: {} });
  function sanitize(input) {
    const d = empty(), o = input && typeof input === 'object' ? input : {};
    d.saved = [...new Set((Array.isArray(o.saved) ? o.saved : []).filter(v => /^(0[1-9]|1[0-2])$/.test(v)))].slice(0,12);
    d.filter = TRACKS.some(t => t.id === o.filter) ? o.filter : 'all';
    d.layout = o.layout === 'list' ? 'list' : 'grid';
    if (o.challenge && typeof o.challenge === 'object') {
      d.challenge = { passed: o.challenge.passed === true, resistance: clamp(o.challenge.resistance,100,1000), prediction: o.challenge.prediction === 'less' ? 'less' : 'more' };
    }
    d.sessions = (Array.isArray(o.sessions) ? o.sessions : []).filter(s => s && Number.isFinite(s.finishedAt) && Number.isFinite(s.minutes) && s.minutes > 0 && s.minutes <= 45).slice(-365).map(s => ({ finishedAt: s.finishedAt, minutes: s.minutes }));
    if (o.timer && typeof o.timer === 'object') {
      const duration = [15,25,45].includes(o.timer.duration) ? o.timer.duration : 15;
      d.timer = { duration, remaining: clamp(o.timer.remaining,0,duration*60), deadline: Number.isFinite(o.timer.deadline) && o.timer.deadline > 0 ? o.timer.deadline : 0 };
    }
    if (o.evidence && typeof o.evidence === 'object') Object.entries(o.evidence).slice(0,12).forEach(([k,v]) => {
      if (/^(0[1-9]|1[0-2])$/.test(k) && v && typeof v === 'object') d.evidence[k] = { note: String(v.note || '').slice(0,10000), checks: [0,1,2].map(i => !!v.checks?.[i]) };
    });
    return d;
  }
  function circuitCurrent(r, voltage=3.3, forward=2) {
    if (!Number.isFinite(r) || r <= 0) throw new RangeError('Resistance must be positive.');
    return Math.max(0, voltage - forward) / r * 1000;
  }
  function readingMinutes(html) {
    const words = String(html || '').replace(/<[^>]+>/g,' ').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  }
  function remainingSeconds(timer, now=Date.now()) {
    return timer.deadline ? Math.max(0,Math.ceil((timer.deadline-now)/1000)) : Math.max(0,Math.round(timer.remaining));
  }
  const bookmarkSVG = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4V3Z"/></svg>';
  const lightningSVG = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z"/></svg>';

  /* Schematic learning art. Intentionally not a hardware photograph. */
  function art(id, large=false) {
    const n = Number(id), stroke = '#6353b5', soft = '#b8a4f4';
    const prefix = 'ks-art-'+id+(large?'-lg':'');
    const start = `<svg viewBox="0 0 360 180" class="ks-art" aria-hidden="true"><defs><linearGradient id="${prefix}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eeeaff"/><stop offset="1" stop-color="#bdaaf2"/></linearGradient></defs><g fill="none" stroke="${stroke}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">`;
    const grid = '<path d="M32 145H327M58 32V153M108 32V153M158 32V153M208 32V153M258 32V153M308 32V153M32 45H327M32 95H327" stroke="currentColor" opacity=".07"/>';
    let body = '';
    if ([1,2,4].includes(n)) {
      body = '<path d="M62 95H116M200 95H280V140H62V95" stroke="#8e81ba" stroke-width="2.5"/><path class="ks-flow" d="M62 95H116M200 95H280V140H62V95" stroke="#7d63cf" stroke-dasharray="3 18" stroke-width="3"/><rect x="44" y="69" width="36" height="51" rx="9" fill="#f9f6ff"/><path d="M54 85H70M62 77V93M56 106H68"/><rect x="117" y="80" width="83" height="30" rx="13" fill="#f5d9aa" stroke="#b08f5e"/><path d="M134 81V109M146 81V109M181 81V109" stroke="#ac6b3d" stroke-width="5"/><path d="M270 74V102M291 74V101"/><path d="M269 74V58a11 11 0 0 1 23 0v16Z" fill="#a9dfbe" stroke="#64a680"/><path class="ks-light-ray" d="m267 43-7-7m35 7 7-7m-22 4V30" stroke="#77b58e"/><circle cx="62" cy="140" r="4" fill="#8670c4"/><text x="128" y="164" font-size="12" stroke="none" fill="#776a92" font-family="monospace">PREDICT. CONNECT. TEST.</text>';
      if(n===4) body='<rect x="124" y="46" width="110" height="91" rx="15" fill="#e2eef9" stroke="#7591af"/><rect x="147" y="67" width="65" height="48" rx="8" fill="#334960"/><circle cx="179" cy="91" r="15" fill="#a3cbdd" stroke="#d1e7f2"/><path d="m125 66-34-13m34 39H78m46 24-33 18m143-67 35-13m-35 39h48m-48 24 35 18" stroke="#83a5bd"/>'+Array.from({length:6},(_,i)=>`<path d="M${138+i*16} 137v12" stroke="#c5a66b" stroke-width="5"/>`).join('');
    } else if ([3,8].includes(n)) {
      body = `<rect x="91" y="40" width="178" height="104" rx="17" fill="url(#${prefix})"/><rect x="116" y="60" width="127" height="63" rx="9" fill="#38304e"/><path d="m138 78-10 12 10 12m83-24 10 12-10 12m-34-28-12 31" stroke="#d2c3ff" stroke-width="3"/>`+Array.from({length:8},(_,i)=>`<path d="M${111+i*20} 30v10M${111+i*20} 144v12" stroke="#b6a584" stroke-width="5"/>`).join('')+'<circle class="ks-light-ray" cx="253" cy="53" r="4" fill="#d6f5b5" stroke="none"/>';
    } else if ([5,7,11].includes(n)) {
      body = '<ellipse cx="180" cy="153" rx="88" ry="10" fill="#645386" opacity=".08" stroke="none"/><path d="M105 140 140 71 217 47 247 82" stroke="#8974bc" stroke-width="25"/><path d="M105 140 140 71 217 47" stroke="#e5dbfb" stroke-width="13"/><circle cx="140" cy="71" r="17" fill="#f7f4ff" stroke-width="4"/><circle cx="217" cy="47" r="14" fill="#f7f4ff" stroke-width="4"/><circle cx="140" cy="71" r="5" fill="#a797d0"/><path d="m238 82-7 19 11 5m14-24 7 19-9 5" stroke-width="7"/><rect x="75" y="136" width="65" height="20" rx="8" fill="#c7b6eb"/><rect x="238" y="124" width="28" height="25" rx="5" fill="#edc28e" stroke="#b98a51"/>';
    } else if ([6,9].includes(n)) {
      body = '<path d="M60 32V146H310" stroke="#a397b8"/><path d="M61 73H310" stroke="#bd9663" stroke-dasharray="5 6"/><path d="M62 139C91 139 93 30 128 36S170 105 207 85S248 65 277 73S297 73 308 73" stroke="#8160ce" stroke-width="4"/><path d="M62 139C91 139 93 30 128 36S170 105 207 85S248 65 277 73S297 73 308 73" stroke="#cdbcf5" stroke-width="7" opacity=".2"/><circle class="ks-light-ray" cx="308" cy="73" r="6" fill="#8bc6ac" stroke="none"/><text x="76" y="167" font-size="11" fill="#877497" stroke="none" font-family="monospace">SETPOINT / RESPONSE</text>';
    } else {
      body = '<g transform="translate(92 30)"><rect width="178" height="126" rx="15" fill="#f7f4fd" stroke="#c2b2dd"/>'+Array.from({length:24},(_,i)=>`<rect x="${10+i%6*27}" y="${10+Math.floor(i/6)*27}" width="22" height="22" rx="5" fill="${[8,9,15].includes(i)?'#b4a5d1':'#e5ddf2'}" stroke="none"/>`).join('')+'<path class="ks-flow" d="M21 21H156V102" stroke="#7d5ac6" stroke-width="3" stroke-dasharray="7 4"/><circle cx="21" cy="21" r="9" fill="#98d1b4"/><circle cx="156" cy="102" r="9" fill="#efca8d"/></g>';
    }
    return start+grid+body+'</g></svg>';
  }

  function create(api) {
    const { data:D, esc, icon, save, dialog, toast, reduced, robotMarkup } = api;
    let refresh = () => {}, timerHandle, observer, eventsBound=false, mountedView='home';
    let homeFilter='all', curriculumQuery='', challengeR=220, challengePrediction='', challengeChecked=false;
    const moduleById = id => D.modules.find(m=>m.id===id);
    const lesson = id => D.lessons.find(l=>l.id===id);
    const state = () => api.state();
    const dash = () => {
      if (!state().dashboard || typeof state().dashboard !== 'object') state().dashboard=empty();
      return state().dashboard;
    };
    state().dashboard = sanitize(state().dashboard);
    const allIds = D.lessons.map(l=>l.id);
    const done = ids => ids.filter(id=>state().complete[id]).length;
    const pct = ids => Math.round(done(ids)/Math.max(ids.length,1)*100);
    const labelTrack = id => Number(id)<=6 ? 'FOUNDATIONS' : Number(id)<=10 ? 'ROBOTICS & AUTONOMY' : 'INDUSTRY & RESEARCH';
    function nextLesson() {
      const last=lesson(state().lastLesson);
      if(last&&!state().complete[last.id])return last;
      return D.modules.flatMap(m=>m.lessons).map(lesson).find(l=>l&&!state().complete[l.id]) || D.lessons[0];
    }
    function ring(value,size=90,label='Reviewed') {
      const r=36,c=2*Math.PI*r;
      return `<div class="ks-ring" style="--ring-size:${size}px"><svg viewBox="0 0 90 90" aria-hidden="true"><circle cx="45" cy="45" r="${r}" class="ks-ring-track"/><circle cx="45" cy="45" r="${r}" class="ks-ring-value" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-value/100)}"/></svg><div><strong>${value}<small>%</small></strong><span>${label}</span></div></div>`;
    }
    function statsBar() {
      const quizCorrect = D.lessons.reduce((sum,l)=>sum+l.quizzes.filter((q,i)=>state().quizzes[l.id+'-'+i]===q.correct).length,0);
      return `<div class="ks-stats">${[
        [icon('learn'),done(allIds),'/ '+allIds.length,'Lessons reviewed','Self-reported reading progress'],
        [icon('check'),quizCorrect,'','Correct quiz answers','Your most recent saved answers'],
        [bookmarkSVG,dash().saved.length,'','Saved modules','Your personal study queue'],
        [icon('clock'),dash().sessions.reduce((n,s)=>n+s.minutes,0),'min','Completed focus time','Timer time, not a measure of attention']
      ].map(([ic,n,unit,title,hint])=>`<div class="ks-stat" title="${hint}"><span class="ks-stat-icon">${ic}</span><div><strong>${n}<small>${unit}</small></strong><span>${title}</span></div></div>`).join('')}</div>`;
    }
    function courseCard(m,i=0) {
      const current=done(m.lessons),value=pct(m.lessons),saved=dash().saved.includes(m.id);
      return `<article class="ks-course module-card" data-course="${m.id}" style="--card-order:${i%6}">
        <div class="ks-course-art ks-color-${m.color}"><a href="#/module/${m.id}" tabindex="-1" aria-hidden="true">${art(m.id)}</a><span class="ks-course-number">MODULE ${m.id}</span><button class="ks-bookmark ${saved?'is-saved':''}" data-ks="bookmark" data-id="${m.id}" aria-label="${saved?'Unsave':'Save'} ${esc(m.title)}" aria-pressed="${saved}">${bookmarkSVG}</button><span class="ks-course-format">${icon(m.sim==='circuit'?'chip':m.sim==='pid'?'lab':'grid')} Interactive module</span></div>
        <div class="ks-course-body"><span class="ks-label">${labelTrack(m.id)}</span><h3><a href="#/module/${m.id}">${esc(m.title)}</a></h3><p>${esc(m.subtitle)}</p><div class="ks-course-meta"><span>${icon('learn')} ${m.lessons.length} lessons</span><span>${icon('lab')} Live lab</span></div><div class="ks-course-progress"><span>${current?`${current} of ${m.lessons.length} reviewed`:'Ready when you are'}</span><span>${value}%</span></div><div class="progress-bar" aria-label="${value}% reviewed"><i style="width:${value}%"></i></div><div class="ks-course-foot"><a href="#/module/${m.id}">${current?'Continue module':'Explore module'} ${icon('arrow')}</a><span class="ks-duration" title="${LESSON_TIME_NOTE}">${m.lessons.reduce((n,id)=>n+readingMinutes(lesson(id)?.body),0)} min read</span></div></div>
      </article>`;
    }
    function home() {
      const next=nextLesson(),m=moduleById(next.module)||D.modules[0],progress=pct(allIds);
      return `<section class="ks-dashboard" aria-label="Learning dashboard">
        <div class="ks-page-top"><div><p class="ks-eyebrow">YOUR ROBOTICS WORKSPACE</p><h1>Good to see you, ${esc(state().name||'maker')}. <span class="ks-sparkle">${icon('spark')}</span></h1><p>One idea. One experiment. One step closer to building something real.</p></div><div class="ks-top-tools"><span class="ks-local">${icon('check')} Your personal workspace</span><a class="btn quiet small" href="#/settings">Personalize ${icon('settings')}</a></div></div>
        <div class="ks-dashboard-grid">
          <div class="ks-main-column">
            <section class="ks-hero"><div class="ks-hero-text"><span class="ks-hero-badge"><i></i> YOUR NEXT CHAPTER STARTS HERE</span><h2>Big ideas.<br>Small experiments.<br><em>Real robots.</em></h2><p>Go from "how does this work?" to "I built it." Your hands-on robotics journey starts with one small win.</p><div class="actions"><a class="btn primary ks-main-cta" href="#/lesson/${next.id}">${done(allIds)?'Continue learning':'Start learning'} ${icon('arrow')}</a><a class="ks-text-link" href="#/learn">See the learning path</a></div><div class="ks-hero-facts"><span><strong>${D.modules.length}</strong> connected modules</span><span><strong>${D.projects.length}</strong> build journeys</span><span><strong>6</strong> live labs</span></div></div><div class="ks-robot-stage">${robotMarkup()}<div class="ks-float-tag ks-float-one"><span class="ks-tag-icon">${icon('chip')}</span><div><strong>Meet your desk buddy</strong><span>Explore the idea from the inside</span></div></div><div class="ks-model-label">ORIGINAL CONCEPT MODEL &middot; NOT MANUFACTURING CAD</div></div></section>
            ${statsBar()}
            <div class="ks-section-heading"><div><span class="ks-label">YOUR LEARNING PATH</span><h2>A little progress, every day.</h2></div><a class="ks-text-link" href="#/learn">All ${D.modules.length} modules ${icon('arrow')}</a></div>
            <div class="ks-home-filters" role="group" aria-label="Featured module filters">${[['all','Recommended'],['foundations','Foundations'],['autonomy','Autonomy & AI'],['saved','Saved']].map(([id,label])=>`<button class="ks-filter ${homeFilter===id?'active':''}" data-ks="home-filter" data-value="${id}" aria-pressed="${homeFilter===id}">${id==='saved'?bookmarkSVG:''}${label}${id==='saved'?` <span data-saved-count>${dash().saved.length}</span>`:''}</button>`).join('')}</div>
            <div class="ks-course-grid" id="ks-featured-courses">${featuredCards()}</div>
            <div class="ks-section-heading"><div><span class="ks-label">LESS PASSIVE WATCHING. MORE DOING.</span><h2>Your next experiment awaits.</h2></div><a class="ks-text-link" href="#/sandbox">Open the playground ${icon('arrow')}</a></div>
            <div class="ks-lab-tiles">${[
              ['circuit','chip','Make electricity visible','See how one resistor changes the current.','mint'],
              ['pid','lab','Find the perfect balance','Tune feedback. Watch overshoot settle.','lilac'],
              ['arm','build','Put motion in your hands','Explore reach, angles and impossible targets.','peach']
            ].map(([id,ic,title,desc,color])=>`<a href="#/sandbox/${id}" class="ks-lab-tile ks-color-${color}"><span class="ks-lab-icon">${icon(ic)}</span><h3>${title}</h3><p>${desc}</p><span class="ks-lab-open">Try the experiment ${icon('arrow')}</span></a>`).join('')}</div>
            <section class="ks-project-banner"><div class="ks-project-mark">${icon('build')}</div><div><span class="ks-label">MAKE THE LEAP FROM IDEA TO BUILD</span><h2>Your first circuit. Your next robot.</h2><p>Outcome. Parts. Connections. Code. Validation. Follow all five stages.</p></div><a class="btn" href="#/build">Explore projects ${icon('arrow')}</a></section>
          </div>
          <aside class="ks-right-column" aria-label="Personal learning tools">
            <section class="ks-next-card"><div class="ks-card-heading"><span class="ks-label">PICK UP HERE</span><span class="ks-tiny-badge">MODULE ${m.id}</span></div><span class="ks-next-symbol">${icon('learn')}</span><h2>${esc(next.title)}</h2><p>${esc(next.intro)}</p><div class="ks-next-meta">${icon('clock')} ${readingMinutes(next.body)} min read <span>&middot;</span> ${esc(m.title)}</div><a class="btn primary" href="#/lesson/${next.id}">${done(allIds)?'Continue lesson':'Begin first lesson'} ${icon('arrow')}</a><div class="ks-next-progress"><span>Module progress</span><strong>${done(m.lessons)} / ${m.lessons.length}</strong></div><div class="progress-bar"><i style="width:${pct(m.lessons)}%"></i></div></section>
            ${challengeCard()}
            ${timerCard()}
            <section class="ks-mindset-card"><span class="ks-label">THE ENGINEER'S MINDSET</span><blockquote>Don't just ask,<br>"Does it work?"<br><em>Ask, "How do I know?"</em></blockquote><a class="ks-text-link" href="#/lesson/engineering-method">Build that habit ${icon('arrow')}</a></section>
          </aside>
        </div>
      </section>`;
    }
    function featuredCards() {
      let ms;
      if(homeFilter==='saved')ms=D.modules.filter(m=>dash().saved.includes(m.id));
      else if(homeFilter==='autonomy')ms=D.modules.filter(m=>['07','08','09','10'].includes(m.id));
      else if(homeFilter==='foundations')ms=D.modules.slice(0,6);
      else { const nextModule=nextLesson().module;ms=[...D.modules].sort((a,b)=>(a.id===nextModule?-1:b.id===nextModule?1:0)||(pct(a.lessons)===100?1:0)-(pct(b.lessons)===100?1:0)||Number(a.id)-Number(b.id)).slice(0,6); }
      return ms.length?ms.map(courseCard).join(''):emptyState('Your study queue starts here.','Save a module using its bookmark. It will appear here whenever you return.');
    }
    function emptyState(title,text) {return `<div class="ks-empty">${bookmarkSVG}<h3>${title}</h3><p>${text}</p></div>`;}
    function challengeCard() {
      return `<section class="ks-challenge-card"><div class="ks-card-heading"><span class="ks-label">A 2-MINUTE DISCOVERY</span>${lightningSVG}</div><h2>A brighter idea.</h2><p>Can you keep this LED below <strong>10 mA</strong>?</p><div class="ks-mini-circuit" aria-label="Illustrative 3.3 volt LED circuit"><svg viewBox="0 0 280 102" role="img" aria-label="A battery, resistor and LED in a series loop"><path d="M32 50H85M152 50H244V85H32V50" fill="none" stroke="#81769c" stroke-width="2"/><rect x="20" y="31" width="24" height="38" rx="6" fill="#7a65ac"/><path d="M27 41H37m-5-5v10m-4 13h8" stroke="#fff" stroke-width="1.5"/><rect x="85" y="39" width="67" height="22" rx="8" fill="#efd6a8" stroke="#b18c57"/><path d="M99 40V60m12-20v20m28-20v20" stroke="#a57048" stroke-width="4"/><circle class="ks-led-halo" cx="244" cy="36" r="25" fill="#89bc69" opacity=".15"/><path id="ks-led-bulb" d="M234 48V35a10 10 0 0 1 20 0v13Z" fill="#9bc981" stroke="#699358"/><path d="M236 48v12m16-12v12" stroke="#6f657d"/><text x="12" y="19" fill="#756783" font-size="10" font-family="monospace">3.3 V</text><text x="219" y="19" fill="#756783" font-size="10" font-family="monospace">Vf 2.0 V</text></svg></div><div class="ks-challenge-value"><span>Estimated current</span><output id="ks-current">${circuitCurrent(challengeR).toFixed(2)} <small>mA</small></output></div><label class="ks-range-label" for="ks-resistance">Resistance <strong id="ks-resistance-value">${challengeR} &Omega;</strong></label><input type="range" id="ks-resistance" min="100" max="1000" step="10" value="${challengeR}" aria-describedby="ks-circuit-note"><div class="ks-range-extents"><span>100 &Omega;</span><span>1,000 &Omega;</span></div><fieldset class="ks-prediction"><legend>More resistance means...</legend><label><input type="radio" name="ks-predict" value="less" ${challengePrediction==='less'?'checked':''}> Less current</label><label><input type="radio" name="ks-predict" value="more" ${challengePrediction==='more'?'checked':''}> More current</label></fieldset><button class="btn ks-challenge-check" data-ks="check-challenge">Check my reasoning ${icon('arrow')}</button><div id="ks-challenge-feedback" class="ks-feedback" role="status" hidden></div><p id="ks-circuit-note" class="ks-micro">Teaching calculation, not a wiring safety guarantee. Check your actual LED and board limits.</p></section>`;
    }
    function timerCard() {
      const t=dash().timer;
      return `<section class="ks-timer-card"><div class="ks-card-heading"><span class="ks-label">MAKE ROOM FOR CURIOSITY</span>${icon('clock')}</div><div class="ks-timer-face"><strong id="ks-timer-display">${formatTime(remainingSeconds(t))}</strong><span id="ks-timer-caption">${t.deadline?'Focus session in progress':'A little focused time goes a long way.'}</span></div><div class="ks-timer-presets" role="group" aria-label="Focus session duration">${[15,25,45].map(n=>`<button data-ks="timer-duration" data-value="${n}" aria-pressed="${t.duration===n}" class="${t.duration===n?'active':''}">${n} min</button>`).join('')}</div><div class="ks-timer-actions"><button class="btn" data-ks="timer-toggle">${icon(t.deadline?'pause':'play')}<span>${t.deadline?'Pause session':'Start focus session'}</span></button><button class="icon-btn" data-ks="timer-reset" aria-label="Reset focus timer">${icon('reset')}</button></div><p class="ks-micro">A personal timer. Time elapsed is not proof of learning.</p></section>`;
    }
    const formatTime = n => `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
    function learn() {
      const ids=allIds;
      return `<section class="ks-curriculum"><div class="ks-page-top"><div><p class="ks-eyebrow">THE COMPLETE LEARNING PATH</p><h1>Understand the whole robot.</h1><p>From your first circuit to systems you can design, test and explain.</p></div><button class="btn" data-action="scope">${icon('grid')} Curriculum map</button></div><section class="ks-path-overview"><div><span class="ks-label">A CONNECTED CURRICULUM</span><h2>Follow your curiosity.<br><em>Keep the fundamentals.</em></h2><p>Learn the idea, run an experiment, build something, and explain the evidence. Every module connects to the next.</p><div class="ks-path-steps"><span><b>01</b> Understand</span><i></i><span><b>02</b> Experiment</span><i></i><span><b>03</b> Build</span><i></i><span><b>04</b> Explain</span></div></div><div class="ks-path-progress">${ring(pct(ids),138)}<p><strong>${done(ids)} of ${ids.length}</strong> lessons reviewed<br><span>Reading progress, not certification.</span></p><a href="#/lesson/${nextLesson().id}" class="btn primary">${done(ids)?'Continue learning':'Start at the beginning'} ${icon('arrow')}</a></div></section>
        <div class="ks-course-toolbar"><div class="ks-home-filters" role="group" aria-label="Learning track">${TRACKS.map(t=>`<button class="ks-filter ${dash().filter===t.id?'active':''}" data-ks="filter" data-value="${t.id}" aria-pressed="${dash().filter===t.id}">${t.id==='saved'?bookmarkSVG:''}${t.label}</button>`).join('')}</div><div class="ks-catalog-tools"><label class="ks-module-search">${icon('search')}<input id="ks-module-query" type="search" value="${esc(curriculumQuery)}" placeholder="Find a module..." aria-label="Search curriculum modules"></label><div class="ks-view-switch" role="group" aria-label="Course layout"><button class="${dash().layout==='grid'?'active':''}" data-ks="layout" data-value="grid" aria-label="Grid layout" aria-pressed="${dash().layout==='grid'}">${icon('grid')}</button><button class="${dash().layout==='list'?'active':''}" data-ks="layout" data-value="list" aria-label="List layout" aria-pressed="${dash().layout==='list'}"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h13M8 12h13M8 19h13M3 5h.1M3 12h.1M3 19h.1"/></svg></button></div></div></div><p class="ks-results-count" id="ks-result-count" role="status"></p><div class="ks-course-grid ks-catalog-grid ${dash().layout==='list'?'ks-list-view':''}" id="ks-catalog"></div><div class="quality-note"><strong>Build evidence, not just a completion badge.</strong> This is a guided learning platform, not an accredited degree. Hardware practice, independent experiments and design reviews remain essential.</div></section>`;
    }
    function moduleView(id,tab='lessons') {
      const m=moduleById(id)||D.modules[0],ids=m.lessons.filter(lesson),next=ids.find(id=>!state().complete[id])||ids[0];
      const active=['lessons','practice','evidence'].includes(tab)?tab:'lessons';
      const saved=dash().saved.includes(m.id), p=D.projects.filter(p=>p.module===m.id);
      let body='';
      if(active==='lessons')body=`<div class="ks-lesson-path"><div class="ks-list-head"><h2>Small steps. Lasting understanding.</h2><span>${ids.length} lessons</span></div>${ids.map((id,i)=>{const l=lesson(id),complete=state().complete[id];return `<a class="ks-path-lesson ${complete?'is-complete':''} ${id===next?'is-next':''}" href="#/lesson/${id}"><span class="ks-step-number">${complete?icon('check'):String(i+1).padStart(2,'0')}</span><div><div class="ks-lesson-type">${l.kind==='project'?'GUIDED BUILD':'LESSON'} ${id===next&&!complete?'<span>UP NEXT</span>':''}</div><h3>${esc(l.title)}</h3><p>${esc(l.intro)}</p><div class="ks-lesson-foot"><span title="${LESSON_TIME_NOTE}">${icon('clock')} ${readingMinutes(l.body)} min read</span><span>${l.quizzes.length?'Knowledge check included':'Reflection & practice'}</span></div></div><span class="ks-row-arrow">${icon(complete?'check':'arrow')}</span></a>`;}).join('')}</div>`;
      if(active==='practice')body=`<div class="ks-practice-intro"><span class="ks-label">FROM A CONCEPT TO A RESULT</span><h2>Predict first. Then press play.</h2><p>Change one input. Observe the result. Explain why your prediction held up, or what you missed.</p><div class="ks-practice-art">${art(m.id,true)}<a href="#/sandbox/${m.sim}" class="btn primary">Open the ${m.sim==='rl'?'Q-learning':m.sim} lab ${icon('arrow')}</a></div><div class="ks-practice-prompts">${[['01','Make a prediction','Write what you expect, with units, before changing anything.'],['02','Change one variable','Keep the other inputs unchanged so you can explain the effect.'],['03','Keep the evidence','Record the inputs, result, and one limitation of this model.']].map(([n,t,d])=>`<div><b>${n}</b><h3>${t}</h3><p>${d}</p></div>`).join('')}</div>${p.length?`<h3>Build on the idea</h3>${p.map(p=>`<a class="ks-related-project" href="#/project/${p.id}/0">${icon('build')}<span><strong>${esc(p.title)}</strong><small>5 guided stages &middot; ${esc(p.level)}</small></span>${icon('arrow')}</a>`).join('')}`:''}<p class="ks-micro">Browser labs are simplified teaching models. Native simulators and physical hardware require their own setup and validation.</p></div>`;
      if(active==='evidence') {
        const ev=dash().evidence[m.id]||{note:'',checks:[]};
        body=`<div class="ks-evidence"><span class="ks-label">YOUR MODULE EXIT TASK</span><h2>Show what you understand.</h2><p class="ks-evidence-gate">${esc(m.gate)}</p><fieldset class="ks-evidence-checks"><legend>Self-review checklist</legend>${['I can explain the idea in plain language.','I reproduced one result and recorded its inputs and units.','I can describe one failure mode or limitation.'].map((t,i)=>`<label><input type="checkbox" data-ks-evidence="${m.id}" data-index="${i}" ${ev.checks[i]?'checked':''}>${t}</label>`).join('')}</fieldset><label for="ks-evidence-note" class="ks-label">YOUR RESULT, EXPLANATION & LIMITATIONS</label><textarea id="ks-evidence-note" data-ks-note="${m.id}" rows="10" placeholder="What I predicted...\nWhat I observed...\nThe evidence...\nWhat could invalidate my conclusion...">${esc(ev.note)}</textarea><div class="ks-evidence-actions"><span class="ks-micro" id="ks-evidence-status" role="status">Saved locally as you type. This is not automatically graded.</span><button class="btn" data-ks="export-evidence" data-id="${m.id}">${icon('download')} Export evidence</button></div></div>`;
      }
      return `<section class="ks-module-view"><a class="ks-back-link" href="#/learn">${icon('back')} All modules</a><section class="ks-module-hero ks-color-${m.color}"><div><span class="ks-label">MODULE ${m.id} &middot; ${labelTrack(m.id)}</span><h1>${esc(m.title)}</h1><p>${esc(m.subtitle)}</p><div class="ks-module-facts"><span>${icon('learn')} ${ids.length} lessons</span><span>${icon('lab')} Interactive lab</span><span>${icon('flag')} Evidence-based exit task</span></div><div class="actions"><a class="btn primary" href="#/lesson/${next}">${done(ids)?'Continue module':'Start module'} ${icon('arrow')}</a><button class="btn ks-save-module ${saved?'is-saved':''}" data-ks="bookmark" data-id="${m.id}" aria-pressed="${saved}">${bookmarkSVG} ${saved?'Saved to your queue':'Save for later'}</button></div></div><div class="ks-module-art">${art(m.id,true)}<span>CONCEPT ILLUSTRATION</span></div></section><div class="ks-module-layout"><div class="ks-module-content"><div class="ks-module-tabs" role="tablist" aria-label="Module sections">${[['lessons','Lessons',ids.length],['practice','Experiment',null],['evidence','My evidence',null]].map(([id,title,count])=>`<button id="ks-tab-${id}" role="tab" aria-selected="${active===id}" tabindex="${active===id?0:-1}" aria-controls="ks-module-panel" data-ks="module-tab" data-module="${m.id}" data-value="${id}">${title}${count?` <span>${count}</span>`:''}</button>`).join('')}</div><section id="ks-module-panel" role="tabpanel" aria-labelledby="ks-tab-${active}" tabindex="0">${body}</section></div><aside class="ks-module-aside"><section class="ks-module-progress"><div class="ks-card-heading"><span class="ks-label">YOUR PROGRESS</span>${icon('flag')}</div>${ring(pct(ids),130)}<h3>${done(ids)} of ${ids.length} lessons reviewed</h3><p>Mark lessons reviewed as you work. A finished experiment matters more than a full progress bar.</p><div class="progress-bar"><i style="width:${pct(ids)}%"></i></div></section><section class="ks-module-goal"><span class="ks-label">BY THE END, AIM TO...</span><h3>${esc(m.gate)}</h3><a class="ks-text-link" href="#/module/${m.id}/evidence">Keep your evidence ${icon('arrow')}</a></section><a href="#/atlas" class="ks-atlas-shortcut">${icon('photo')}<span><strong>See the real hardware</strong><small>Source photographs & annotations</small></span>${icon('arrow')}</a></aside></div></section>`;
    }
    function updateCatalog() {
      const el=document.querySelector('#ks-catalog');if(!el)return;
      const track=TRACKS.find(t=>t.id===dash().filter)||TRACKS[0];
      const q=curriculumQuery.toLowerCase().trim();
      const ms=D.modules.filter(m=>(!track.ids||track.ids.includes(m.id))&&(track.id!=='saved'||dash().saved.includes(m.id))&&(!q||`${m.title} ${m.subtitle} ${m.gate}`.toLowerCase().includes(q)));
      el.classList.toggle('ks-list-view',dash().layout==='list');
      el.innerHTML=ms.length?ms.map(courseCard).join(''):emptyState('Nothing here just yet.',q?'Try a different keyword or another learning track.':'Bookmark a module to build your personal learning queue.');
      document.querySelector('#ks-result-count').textContent=`${ms.length} ${ms.length===1?'module':'modules'} ${q?'matching your search':'to explore'}`;
    }
    function updateChallenge() {
      const current=circuitCurrent(challengeR),el=document.querySelector('#ks-current');if(!el)return;
      el.innerHTML=`${current.toFixed(2)} <small>mA</small>`;
      el.classList.toggle('over-limit',current>10);
      document.querySelector('#ks-resistance-value').innerHTML=`${challengeR} &Omega;`;
      const bulb=document.querySelector('#ks-led-bulb');bulb.style.fill=current>10?'#e9a07d':'#9bc981';
      document.querySelector('.ks-led-halo').style.opacity=String(clamp(current/55,.04,.3));
      if(challengeChecked)document.querySelector('#ks-challenge-feedback').hidden=true;
    }
    function checkChallenge() {
      const el=document.querySelector('#ks-challenge-feedback');if(!el)return;
      el.hidden=false;challengeChecked=true;
      if(!challengePrediction){el.className='ks-feedback';el.textContent='Make your prediction first: what happens when resistance increases?';return;}
      const ma=circuitCurrent(challengeR),passed=ma<=10&&challengePrediction==='less';
      el.className='ks-feedback '+(passed?'is-correct':'is-retry');
      el.textContent=passed?`Exactly. (3.3 - 2.0) / ${challengeR} = ${ma.toFixed(2)} mA. More resistance means less current. Your estimate is under the 10 mA target.`:challengePrediction!=='less'?'Try again: current = voltage difference / resistance. Increasing the denominator reduces the current.':`${ma.toFixed(2)} mA is above the target. Increase resistance and check again.`;
      dash().challenge={passed,resistance:challengeR,prediction:challengePrediction};save();
      if(passed&&!reduced()){el.animate([{transform:'translateY(5px)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:280,easing:'ease-out'});}
    }
    function tickTimer() {
      const t=dash().timer,n=remainingSeconds(t);
      if(t.deadline&&n===0){dash().sessions.push({finishedAt:Date.now(),minutes:t.duration});dash().sessions=dash().sessions.slice(-365);t.deadline=0;t.remaining=0;save();const stats=document.querySelector('.ks-stats');if(stats)stats.outerHTML=statsBar();toast('Focus session complete. Write down one thing you learned.');}
      const display=document.querySelector('#ks-timer-display');if(display)display.textContent=formatTime(n);
      const caption=document.querySelector('#ks-timer-caption');if(caption)caption.textContent=n===0?'Session complete. Save one useful observation.':t.deadline?'Focus session in progress':'A little focused time goes a long way.';
      const btn=document.querySelector('[data-ks="timer-toggle"]');if(btn){btn.innerHTML=`${icon(t.deadline?'pause':'play')}<span>${t.deadline?'Pause session':n===0?'Start another session':'Start focus session'}</span>`;}
      document.querySelectorAll('[data-ks="timer-duration"]').forEach(b=>{b.classList.toggle('active',Number(b.dataset.value)===t.duration);b.setAttribute('aria-pressed',String(Number(b.dataset.value)===t.duration));});
    }
    function updateBookmark(id) {
      if(!moduleById(id))return;
      const list=dash().saved,saved=!list.includes(id);dash().saved=saved?[...list,id]:list.filter(x=>x!==id);save();
      document.querySelectorAll(`[data-ks="bookmark"][data-id="${id}"]`).forEach(b=>{
        b.classList.toggle('is-saved',saved);b.setAttribute('aria-pressed',String(saved));
        if(b.classList.contains('ks-bookmark'))b.setAttribute('aria-label',`${saved?'Unsave':'Save'} ${moduleById(id).title}`);
        else b.innerHTML=bookmarkSVG+(saved?' Saved to your queue':' Save for later');
      });
      document.querySelectorAll('[data-saved-count]').forEach(el=>el.textContent=dash().saved.length);
      const stats=document.querySelector('.ks-stats');if(stats)stats.outerHTML=statsBar();
      if(mountedView==='learn'&&dash().filter==='saved')updateCatalog();
      if(mountedView==='home'&&homeFilter==='saved'){const c=document.querySelector('#ks-featured-courses');if(c)c.innerHTML=featuredCards();}
      toast(saved?'Module saved to your learning queue.':'Module removed from your learning queue.');
    }
    function evidence(id) {
      if(!dash().evidence[id])dash().evidence[id]={note:'',checks:[false,false,false]};
      return dash().evidence[id];
    }
    function bind() {
      if(eventsBound)return;eventsBound=true;
      document.addEventListener('click',e=>{
        const b=e.target.closest('[data-ks]');if(!b)return;
        const a=b.dataset.ks,v=b.dataset.value;
        if(a==='bookmark')updateBookmark(b.dataset.id);
        if(a==='home-filter'){homeFilter=v;document.querySelectorAll('[data-ks="home-filter"]').forEach(el=>{el.classList.toggle('active',el===b);el.setAttribute('aria-pressed',String(el===b));});document.querySelector('#ks-featured-courses').innerHTML=featuredCards();}
        if(a==='filter'){dash().filter=v;save();document.querySelectorAll('[data-ks="filter"]').forEach(el=>{el.classList.toggle('active',el===b);el.setAttribute('aria-pressed',String(el===b));});updateCatalog();}
        if(a==='layout'){dash().layout=v;save();document.querySelectorAll('[data-ks="layout"]').forEach(el=>{el.classList.toggle('active',el===b);el.setAttribute('aria-pressed',String(el===b));});updateCatalog();}
        if(a==='check-challenge')checkChallenge();
        if(a==='timer-toggle'){const t=dash().timer;if(t.deadline){t.remaining=remainingSeconds(t);t.deadline=0;}else{if(t.remaining<=0)t.remaining=t.duration*60;t.deadline=Date.now()+t.remaining*1000;}save();tickTimer();}
        if(a==='timer-reset'){const t=dash().timer;t.deadline=0;t.remaining=t.duration*60;save();tickTimer();}
        if(a==='timer-duration'){const t=dash().timer;t.duration=Number(v);t.remaining=Number(v)*60;t.deadline=0;save();tickTimer();}
        if(a==='module-tab'){const mod=b.dataset.module,scroll=window.scrollY;location.hash='/module/'+mod+'/'+v;requestAnimationFrame(()=>requestAnimationFrame(()=>{window.scrollTo({top:scroll,behavior:'instant'});document.querySelector('#ks-tab-'+v)?.focus({preventScroll:true});}));}
        if(a==='export-evidence'){
          const id=b.dataset.id,m=moduleById(id),ev=evidence(id);
          const text=`# Module ${id}: ${m.title}\n\n## Exit task\n${m.gate}\n\n## Self-review\n${['Explain','Reproduce','Identify a limitation'].map((t,i)=>`- [${ev.checks[i]?'x':' '}] ${t}`).join('\n')}\n\n## Evidence\n${ev.note}\n\nSelf-reported learning record; not an automatically verified assessment.\n`;
          const url=URL.createObjectURL(new Blob([text],{type:'text/markdown'})),link=document.createElement('a');link.href=url;link.download=`kinetic-module-${id}-evidence.md`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
        }
      });
      document.addEventListener('input',e=>{
        if(e.target.id==='ks-resistance'){challengeR=Number(e.target.value);updateChallenge();}
        if(e.target.id==='ks-module-query'){curriculumQuery=e.target.value;updateCatalog();}
        if(e.target.dataset.ksNote){evidence(e.target.dataset.ksNote).note=e.target.value.slice(0,10000);save();const status=document.querySelector('#ks-evidence-status');if(status)status.textContent='Saved on this device. Export to keep a separate copy.';}
      });
      document.addEventListener('change',e=>{
        if(e.target.name==='ks-predict'){challengePrediction=e.target.value;if(challengeChecked)document.querySelector('#ks-challenge-feedback').hidden=true;}
        if(e.target.dataset.ksEvidence){evidence(e.target.dataset.ksEvidence).checks[Number(e.target.dataset.index)]=e.target.checked;save();}
      });
      document.addEventListener('keydown',e=>{
        const tabs=e.target.closest('.ks-module-tabs');if(!tabs||!e.target.matches('[role="tab"]'))return;
        const list=[...tabs.querySelectorAll('[role="tab"]')],index=list.indexOf(e.target);
        let i;if(e.key==='ArrowRight')i=(index+1)%list.length;else if(e.key==='ArrowLeft')i=(index-1+list.length)%list.length;else if(e.key==='Home')i=0;else if(e.key==='End')i=list.length-1;else return;
        e.preventDefault();list.forEach((b,j)=>b.tabIndex=j===i?0:-1);list[i].focus();
      });
      document.addEventListener('visibilitychange',()=>{
        // Pause automatically rather than count unattended background time.
        if(document.hidden&&dash().timer.deadline){const t=dash().timer;t.remaining=remainingSeconds(t);t.deadline=0;save();}
        else tickTimer();
      });
    }
    function mount(view,rerender) {
      mountedView=view;refresh=rerender;bind();updateCatalog();updateChallenge();
      tickTimer();timerHandle=setInterval(tickTimer,500);
      document.querySelectorAll('.ks-course,.ks-lab-tile').forEach(el=>{
        el.addEventListener('pointermove',e=>{if(reduced()||e.pointerType==='touch')return;const r=el.getBoundingClientRect();el.style.setProperty('--pointer-x',`${e.clientX-r.left}px`);el.style.setProperty('--pointer-y',`${e.clientY-r.top}px`);});
      });
      return()=>{clearInterval(timerHandle);observer?.disconnect();};
    }
    return { home, learn, moduleView, mount, sanitize, art, state:dash };
  }
  const exports={create,sanitize,circuitCurrent,readingMinutes,remainingSeconds};
  if(typeof module!=='undefined'&&module.exports)module.exports=exports;
  root.KineticDashboard=exports;
})(typeof window!=='undefined'?window:globalThis);
