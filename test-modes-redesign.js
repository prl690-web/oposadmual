(function(){
  const PKEY='oposadmual_progress_v2';

  function injectStyles(){
    if(document.getElementById('mode-redesign-styles')) return;
    const style=document.createElement('style');
    style.id='mode-redesign-styles';
    style.textContent=`
      .mode-selector-card{margin-bottom:22px;padding-bottom:20px;border-bottom:1px solid var(--border);}
      .mode-selector-card .eyebrow{font-size:.72rem;letter-spacing:.11em;font-weight:800;color:var(--brand);margin-bottom:4px;}
      .mode-selector-card h3{margin:2px 0 4px;}
      .mode-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:14px;}
      .mode-card{text-align:left;border:1px solid var(--border);border-radius:14px;background:#fff;padding:16px;cursor:pointer;font-family:inherit;transition:.15s;display:flex;flex-direction:column;gap:4px;}
      .mode-card:hover{border-color:var(--brand);box-shadow:0 8px 20px rgba(31,63,91,.08);transform:translateY(-1px);}
      .mode-card .mode-icon{font-size:1.35rem;}
      .mode-card .mode-title{font-weight:800;color:var(--ink);font-size:.98rem;}
      .mode-card .mode-desc{color:var(--ink-soft);font-size:.8rem;line-height:1.4;}
      .mode-card.active{border-color:var(--brand);background:var(--brand-soft);}
      .mode-exam-sizes{display:flex;gap:8px;margin-top:6px;}
      .mode-exam-sizes button{flex:1;border:1px solid var(--border);background:#fff;border-radius:9px;padding:6px 4px;font-family:inherit;font-weight:700;font-size:.78rem;cursor:pointer;color:var(--brand-dark);}
      .mode-exam-sizes button:hover{border-color:var(--brand);background:var(--brand-soft);}
      .mode-note{font-size:.78rem;color:var(--ink-soft);margin-top:10px;}
      @media(max-width:850px){.mode-grid{grid-template-columns:1fr 1fr;}}
      @media(max-width:620px){.mode-grid{grid-template-columns:1fr;}}
    `;
    document.head.appendChild(style);
  }

  function getProgressTopics(){
    try{ return (JSON.parse(localStorage.getItem(PKEY)||'{}').topics)||{}; }catch(e){ return {}; }
  }

  // topics never attempted rank as "worse" than any attempted-and-scored topic,
  // since not knowing your level on a topic is itself a risk worth covering.
  function weakTopicIds(n){
    const stats=getProgressTopics();
    const rows=TOPICS.map(t=>{
      const s=stats[t.title];
      const attempts=s?s.attempts:0;
      const pct=attempts?Math.round(s.correct/attempts*100):-1;
      return {id:t.id, pct};
    });
    rows.sort((a,b)=>a.pct-b.pct);
    return rows.slice(0,n).map(r=>r.id);
  }

  function shuffle(arr){
    const a=arr.slice();
    for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a;
  }

  function setTopicIds(ids){
    document.querySelectorAll('#topic-checklist input[type=checkbox]').forEach(c=>{ c.checked = ids.includes(c.value); });
  }
  function setDiffs(vals){
    document.querySelectorAll('.diff-check').forEach(c=>{ c.checked = vals.includes(c.value); });
  }
  function setSelect(id,val){ const el=document.getElementById(id); if(el) el.value=val; }

  function applyMode(mode, opts){
    opts=opts||{};
    const allIds=TOPICS.map(t=>t.id);
    if(mode==='training'){
      setTopicIds(allIds);
      setDiffs(['fácil','medio','difícil']);
      setSelect('num-questions','20');
      setSelect('quiz-mode','drill');
      setSelect('timer-mode','off');
      const cfg=document.getElementById('test-config');
      if(cfg) cfg.scrollIntoView({behavior:'smooth',block:'start'});
      return;
    }
    if(mode==='reinforce'){
      let weak=weakTopicIds(6);
      if(!weak.length) weak=shuffle(allIds).slice(0,6);
      setTopicIds(weak);
      setDiffs(['fácil','medio','difícil']);
      setSelect('num-questions','20');
      setSelect('quiz-mode','drill');
      setSelect('timer-mode','off');
    }
    if(mode==='hard'){
      setTopicIds(allIds);
      setDiffs(['difícil']);
      setSelect('num-questions','20');
      setSelect('quiz-mode','drill');
      setSelect('timer-mode','off');
    }
    if(mode==='exam'){
      setTopicIds(allIds);
      setDiffs(['fácil','medio','difícil']);
      setSelect('num-questions', String(opts.n||20));
      setSelect('quiz-mode','exam');
      setSelect('timer-mode','on');
    }
    if(typeof startQuiz==='function') startQuiz();
  }

  function injectSelector(){
    const config=document.getElementById('test-config');
    if(!config || document.getElementById('mode-selector-card')) return;

    const card=document.createElement('div');
    card.id='mode-selector-card';
    card.className='mode-selector-card';
    card.innerHTML=`
      <div class="eyebrow">ELIGE CÓMO QUIERES ENTRENAR</div>
      <h3>Modo de test</h3>
      <p class="topic-meta">Cada modo prepara automáticamente los temas, la dificultad y el formato. "Entrenamiento" te deja elegir todo a mano, como hasta ahora.</p>
      <div class="mode-grid">
        <div class="mode-card" role="button" tabindex="0" data-mode="training">
          <span class="mode-icon">📚</span>
          <span class="mode-title">Entrenamiento</span>
          <span class="mode-desc">Preguntas por tema, elegidas por ti. Feedback inmediato.</span>
        </div>
        <div class="mode-card" role="button" tabindex="0" data-mode="reinforce">
          <span class="mode-icon">🎯</span>
          <span class="mode-title">Refuerzo</span>
          <span class="mode-desc">Selecciona automáticamente los temas donde peor rindes.</span>
        </div>
        <div class="mode-card" role="button" tabindex="0" data-mode="hard">
          <span class="mode-icon">🧠</span>
          <span class="mode-title">Difícil</span>
          <span class="mode-desc">Solo preguntas marcadas como difíciles, de todos los temas.</span>
        </div>
        <div class="mode-card" data-mode="exam">
          <span class="mode-icon">🏆</span>
          <span class="mode-title">Simulacro</span>
          <span class="mode-desc">Mezcla los 23 temas, feedback al final, cronometrado.</span>
          <div class="mode-exam-sizes">
            <button type="button" data-exam-size="20">20 preguntas</button>
            <button type="button" data-exam-size="30">30 preguntas</button>
          </div>
        </div>
      </div>
      <p class="mode-note">En Simulacro ni el tema ni la posición de la respuesta correcta siguen ningún patrón: se mezclan al generar el test.</p>
    `;
    config.insertBefore(card, config.firstChild);

    card.querySelectorAll('.mode-card[role="button"]').forEach(el=>{
      const trigger=()=>applyMode(el.dataset.mode);
      el.addEventListener('click', trigger);
      el.addEventListener('keydown', (e)=>{
        if(e.key==='Enter'||e.key===' '){ e.preventDefault(); trigger(); }
      });
    });
    card.querySelectorAll('[data-exam-size]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        applyMode('exam', {n: parseInt(btn.dataset.examSize,10)});
      });
    });
  }

  function ready(){
    return typeof TOPICS!=='undefined'
      && typeof startQuiz==='function'
      && document.getElementById('test-config')
      && document.getElementById('topic-checklist')
      && document.getElementById('topic-checklist').children.length>0;
  }

  function boot(){
    if(!ready()) return false;
    injectStyles();
    injectSelector();
    return true;
  }

  function poll(){ if(!boot()) setTimeout(poll,200); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(poll,100));
  else setTimeout(poll,100);
})();
