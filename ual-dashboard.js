(function(){
  const KEY='oposadmual_progress_v2';
  const ACT='oposadmual_activity_v2';
  const defaults=()=>({attempts:0,correct:0,wrong:0,topics:{},sessions:[]});
  const get=()=>{try{return Object.assign(defaults(),JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){return defaults()}};
  const save=d=>{try{localStorage.setItem(KEY,JSON.stringify(d))}catch(e){}};
  const esc=s=>String(s||'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  let lastAnswered='';

  function record(){
    const q=document.querySelector('#q-text')?.textContent?.trim()||'';
    const t=document.querySelector('#q-topic-label')?.textContent?.trim()||'Sin tema';
    if(!q||t==='Sin tema') return;
    const correct=!!document.querySelector('#q-options .option.correct');
    const wrong=!!document.querySelector('#q-options .option.incorrect');
    if(!correct&&!wrong) return;
    const sig=t+'|'+q;
    if(sig===lastAnswered) return;
    lastAnswered=sig;
    const d=get();
    d.attempts++; if(correct)d.correct++;else d.wrong++;
    d.topics[t] ||= {attempts:0,correct:0,wrong:0};
    d.topics[t].attempts++; if(correct)d.topics[t].correct++;else d.topics[t].wrong++;
    save(d); renderHome();
  }

  function totals(){const d=get();return {...d,pct:d.attempts?Math.round(d.correct/d.attempts*100):0}}
  function topicRows(){
    return Object.entries(get().topics).filter(([k])=>k!=='Sin tema').map(([k,v])=>({k,v,p:v.attempts?Math.round(v.correct/v.attempts*100):0}));
  }
  function blockStats(){
    if(!window.TOPICS)return [];
    return [...new Set(TOPICS.map(t=>t.block))].map(block=>{
      const ts=TOPICS.filter(t=>t.block===block);let a=0,c=0;
      ts.forEach(t=>{const key=t.title;const s=get().topics[key];if(s){a+=s.attempts;c+=s.correct}});
      return {block,a,c,p:a?Math.round(c/a*100):0};
    });
  }

  function replaceHeader(){
    const header=document.querySelector('header');
    if(!header||header.dataset.redesigned)return;
    header.dataset.redesigned='1';
    header.className='app-header';
    header.innerHTML=`<div class="header-brand"><img src="assets/ual-logo-original.svg" alt="Universidad de Almería" class="ual-logo"><div class="header-copy"><div class="eyebrow">PREPARACIÓN DE OPOSICIONES</div><h1>Auxiliar Administrativa · C2</h1><p>Universidad de Almería · Convocatoria 2026</p></div></div>`;
  }

  function replaceNav(){
    const nav=document.querySelector('nav.tabs');
    if(!nav||nav.dataset.redesigned)return;
    nav.dataset.redesigned='1';
    nav.className='tabs app-nav';
    nav.innerHTML=`<button id="tab-home-btn" class="active" onclick="showTab('home')"><span>⌂</span> Inicio</button><button id="tab-study-btn" onclick="showTab('study')"><span>▣</span> Estudiar</button><button id="tab-test-btn" onclick="showTab('test')"><span>✓</span> Test</button><button id="tab-supuestos-btn" onclick="showTab('supuestos')"><span>◇</span> Supuestos</button><button id="tab-progress-btn" onclick="showTab('progress')"><span>◔</span> Progreso</button>`;
  }

  function injectHome(){
    if(document.querySelector('#tab-home'))return;
    const main=document.querySelector('main'), study=document.querySelector('#tab-study');
    if(!main||!study)return;
    const sec=document.createElement('section');sec.id='tab-home';
    sec.innerHTML=`<div class="welcome-row"><div><div class="eyebrow dark">PANEL DE PREPARACIÓN</div><h2>Tu preparación, de un vistazo.</h2><p class="home-lead">Consulta tu rendimiento, detecta qué temas necesitas reforzar y continúa exactamente donde lo dejaste.</p></div><button class="btn hero-btn" onclick="showTab('test')">Empezar un test →</button></div><div class="dashboard-grid stats-grid"><div class="metric-card metric-main"><div class="metric-label">DOMINIO GLOBAL</div><div class="donut-wrap"><div id="home-donut" class="donut"><div><strong id="home-pct">—</strong><span>aciertos</span></div></div></div><div id="home-domain-note" class="metric-note">Haz tu primer test para empezar a medir tu dominio</div></div><div class="metric-card"><div class="metric-label">PREGUNTAS</div><div id="home-attempted" class="metric-number">0</div><div class="metric-note">respondidas</div></div><div class="metric-card"><div class="metric-label">ACIERTOS</div><div id="home-correct" class="metric-number good-text">0</div><div class="metric-note">respuestas correctas</div></div><div class="metric-card"><div class="metric-label">TEMAS</div><div id="home-mastered" class="metric-number">0/23</div><div class="metric-note">con ≥ 70% de acierto</div></div></div><div class="dashboard-grid two-col"><div class="dashboard-card"><div class="card-heading"><div><div class="eyebrow dark">RENDIMIENTO</div><h3>Dominio por bloques</h3></div><span class="card-icon">↗</span></div><div id="home-blocks" class="block-bars"></div></div><div class="dashboard-card"><div class="card-heading"><div><div class="eyebrow dark">PRÓXIMO PASO</div><h3>Qué haría ahora</h3></div><span class="card-icon">→</span></div><div id="home-recommendation" class="recommendation"></div></div></div><div class="dashboard-grid two-col"><div class="dashboard-card"><div class="card-heading"><div><div class="eyebrow dark">TEMAS</div><h3>Necesitan refuerzo</h3></div><button class="link-btn" onclick="showTab('progress')">Ver todos →</button></div><div id="home-weak" class="topic-mini-list"></div></div><div class="dashboard-card"><div class="card-heading"><div><div class="eyebrow dark">ACTIVIDAD</div><h3>Últimas sesiones</h3></div></div><div id="home-activity" class="activity-empty">Completa tu primer test y aquí verás un resumen de tu actividad.</div></div></div>`;
    main.insertBefore(sec,study);
  }

  function injectSupuestos(){
    if(document.querySelector('#tab-supuestos'))return;
    const main=document.querySelector('main'), progress=document.querySelector('#tab-progress');if(!main||!progress)return;
    const sec=document.createElement('section');sec.id='tab-supuestos';sec.className='hidden';
    sec.innerHTML=`<div class="section-hero"><div class="eyebrow dark">BLOQUE II · NORMATIVA UNIVERSITARIA</div><h2>Supuestos prácticos</h2><p>Entrena la aplicación de la normativa universitaria a situaciones administrativas concretas.</p><span class="coming-badge">MÓDULO EN PREPARACIÓN</span></div><div class="dashboard-card placeholder-card"><div class="placeholder-icon">◇</div><h3>Próximamente</h3><p>Prepararemos supuestos de hasta 15 preguntas y, después, simulacros de 2 supuestos como en la convocatoria.</p><button class="btn secondary" onclick="showTab('test')">Mientras tanto, hacer test →</button></div>`;
    main.insertBefore(sec,progress);
  }

  function renderHome(){
    const box=document.querySelector('#tab-home');if(!box)return;
    const d=totals(), rows=topicRows();
    const attempted=document.querySelector('#home-attempted'),correct=document.querySelector('#home-correct'),pct=document.querySelector('#home-pct'),mastered=document.querySelector('#home-mastered');
    if(attempted)attempted.textContent=d.attempts;if(correct)correct.textContent=d.correct;if(pct)pct.textContent=d.attempts?d.pct+'%':'—';
    const masteredN=rows.filter(r=>r.p>=70).length;if(mastered)mastered.textContent=`${masteredN}/23`;
    const note=document.querySelector('#home-domain-note');if(note)note.textContent=d.attempts?`${d.correct} aciertos de ${d.attempts} respuestas`:'Haz tu primer test para empezar a medir tu dominio';
    const donut=document.querySelector('#home-donut');if(donut)donut.style.background=`conic-gradient(var(--brand) ${d.pct*3.6}deg,#e7edf2 0deg)`;
    const blocks=document.querySelector('#home-blocks');if(blocks)blocks.innerHTML=blockStats().map(b=>`<div class="bar-row"><div class="bar-label">${esc(b.block)}</div><div class="bar-track"><div class="bar-fill" style="width:${b.p}%"></div></div><div class="bar-value">${b.a?b.p+'%':'—'}</div></div>`).join('');
    const weak=rows.sort((a,b)=>a.p-b.p).slice(0,3), wl=document.querySelector('#home-weak');
    if(wl)wl.innerHTML=weak.length?weak.map(r=>`<div class="topic-mini"><div class="topic-mini-name">${esc(r.k)}</div><div class="mini-track"><div class="mini-fill" style="width:${r.p}%"></div></div><div class="mini-pct">${r.p}%</div></div>`).join(''):'<div class="activity-empty">Todavía no hay datos. Haz un test para empezar a construir tu mapa de preparación.</div>';
    const rec=document.querySelector('#home-recommendation');
    if(rec){const r=weak[0];rec.innerHTML=r?`<div class="rec-title">Refuerza este tema</div><div class="rec-text"><b>${esc(r.k)}</b> es tu área con menor rendimiento (${r.p}%).</div><button class="btn" onclick="showTab('test')">Entrenar ahora →</button>`:`<div class="rec-title">Empieza con 20 preguntas</div><div class="rec-text">Tu primer test nos permitirá construir tu mapa de preparación.</div><button class="btn" onclick="showTab('test')">Hacer mi primer test →</button>`}
    const act=document.querySelector('#home-activity');if(act){const a=get().sessions||[];act.innerHTML=a.length?a.slice(0,4).map(x=>`<div class="topic-mini"><div class="topic-mini-name">${esc(x.label)}</div><div class="metric-note">${x.pct}% · ${x.total} preguntas</div><div class="mini-pct">✓</div></div>`).join(''):'Completa tu primer test y aquí verás un resumen de tu actividad.'}
  }

  function renderProgressV2(){
    const d=totals();const overall=document.querySelector('#progress-overall'),list=document.querySelector('#progress-list');if(!overall||!list)return;
    overall.innerHTML=`<div class="progress-hero"><div><div class="eyebrow dark">DOMINIO GLOBAL</div><div class="score-num">${d.attempts?d.pct+'%':'—'}</div><div class="score-sub">${d.correct} de ${d.attempts} preguntas correctas</div></div><div class="progress-summary"><div><b>${d.attempts}</b><span>preguntas</span></div><div><b>${d.wrong}</b><span>fallos</span></div></div></div>`;
    const rows=topicRows().sort((a,b)=>a.p-b.p);
    list.innerHTML=rows.length?rows.map(r=>`<div class="progress-topic-row"><div class="progress-topic-name">${esc(r.k)}</div><div class="progress-bar-outer"><div class="progress-bar-inner" style="width:${r.p}%;background:${r.p>=70?'var(--good)':r.p>=40?'var(--yellow)':'var(--bad)'}"></div></div><div class="progress-pct">${r.p}%</div><div class="progress-count">${r.v.attempts} preguntas · ${r.v.wrong} fallos</div></div>`).join(''):'<p class="topic-meta">Todavía no has completado ningún test.</p>';
  }

  window.showTab=function(name){
    ['home','study','test','supuestos','progress'].forEach(n=>{const el=document.getElementById('tab-'+n);if(el)el.classList.toggle('hidden',n!==name);const b=document.getElementById('tab-'+n+'-btn');if(b)b.classList.toggle('active',n===name)});
    if(name==='home')renderHome();
    if(name==='progress')renderProgressV2();
  };

  function inject(){
    replaceHeader();replaceNav();injectHome();injectSupuestos();renderHome();
    if(window.renderProgress===undefined||!window.renderProgress.__v2){const fn=renderProgressV2;fn.__v2=true;window.renderProgress=fn}
    showTab('home');
  }

  const observer=new MutationObserver(()=>{record()});
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  window.addEventListener('load',()=>{inject();setTimeout(inject,250)});
  setTimeout(inject,50);
})();
