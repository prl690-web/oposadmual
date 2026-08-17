(function(){
  const MARK_KEY='oposadmual_flashcards_marked';

  function injectStyles(){
    if(document.getElementById('flashcards-redesign-styles')) return;
    const style=document.createElement('style');
    style.id='flashcards-redesign-styles';
    style.textContent=`
      .fc-toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:18px;}
      .fc-toolbar select{padding:9px 11px;border:1px solid var(--border);border-radius:9px;font-family:inherit;font-size:.88rem;background:#fff;color:var(--ink);min-width:260px;}
      .fc-toolbar .btn.secondary{white-space:nowrap;}
      .fc-toolbar label{display:flex;align-items:center;gap:6px;font-size:.82rem;color:var(--ink-soft);cursor:pointer;user-select:none;}
      .fc-progress{font-size:.82rem;color:var(--ink-soft);margin-left:auto;}
      .fc-stage{display:flex;flex-direction:column;align-items:center;gap:18px;}
      .flashcard{width:100%;max-width:620px;perspective:1400px;cursor:pointer;outline:none;}
      .flashcard-inner{position:relative;width:100%;transition:transform .45s cubic-bezier(.4,.2,.2,1);transform-style:preserve-3d;}
      .flashcard.flipped .flashcard-inner{transform:rotateY(180deg);}
      .flashcard-face{position:absolute;top:0;left:0;width:100%;min-height:100%;box-sizing:border-box;backface-visibility:hidden;border:1px solid var(--border);border-radius:18px;padding:28px 30px 46px;display:flex;flex-direction:column;box-shadow:0 10px 28px rgba(31,63,91,.08);background:#fff;}
      .flashcard-front{justify-content:center;min-height:260px;}
      .flashcard-back{transform:rotateY(180deg);justify-content:flex-start;background:var(--brand-soft);}
      .fc-eyebrow{font-size:.7rem;letter-spacing:.1em;font-weight:800;color:var(--brand);margin-bottom:10px;}
      .fc-question{font-size:1.18rem;font-weight:700;color:var(--ink);line-height:1.45;text-align:center;}
      .fc-answer{font-size:.98rem;color:var(--ink);line-height:1.55;white-space:pre-line;}
      .fc-hint{position:absolute;bottom:14px;left:0;right:0;text-align:center;font-size:.72rem;color:var(--ink-soft);}
      .fc-star{position:absolute;top:12px;right:14px;background:none;border:none;font-size:1.25rem;cursor:pointer;color:var(--ink-soft);line-height:1;padding:4px;z-index:2;}
      .fc-star.on{color:#e0a400;}
      .fc-nav{display:flex;gap:12px;align-items:center;}
      .fc-nav button{border:1px solid var(--border);background:#fff;border-radius:10px;padding:9px 18px;font-family:inherit;font-weight:700;font-size:.85rem;cursor:pointer;color:var(--brand-dark);}
      .fc-nav button:hover:not(:disabled){border-color:var(--brand);background:var(--brand-soft);}
      .fc-nav button:disabled{opacity:.4;cursor:default;}
      .fc-empty{text-align:center;color:var(--ink-soft);padding:40px 0;}
      @media(max-width:620px){.flashcard{max-width:100%;}.fc-toolbar select{min-width:0;flex:1;}.fc-progress{margin-left:0;width:100%;}}
    `;
    document.head.appendChild(style);
  }

  function esc(s){ return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function getMarks(){ try{ return JSON.parse(localStorage.getItem(MARK_KEY)||'{}'); }catch(e){ return {}; } }
  function setMarks(m){ try{ localStorage.setItem(MARK_KEY, JSON.stringify(m)); }catch(e){} }
  function isMarked(topicId, idx){ const m=getMarks(); return !!(m[topicId] && m[topicId].includes(idx)); }
  function toggleMark(topicId, idx){
    const m=getMarks();
    if(!m[topicId]) m[topicId]=[];
    const pos=m[topicId].indexOf(idx);
    if(pos>=0) m[topicId].splice(pos,1); else m[topicId].push(idx);
    setMarks(m);
  }

  function shuffle(arr){
    const a=arr.slice();
    for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a;
  }

  // state: topicId, order (array of original indices into deck), pos (position within order), flipped, onlyMarked
  const state={topicId:null, order:[], pos:0, flipped:false, onlyMarked:false, shuffled:false};

  function deckFor(topicId){
    const t=window.FLASHCARDS_DATA && window.FLASHCARDS_DATA[topicId];
    return t ? t.cards : [];
  }

  function buildOrder(topicId){
    const deck=deckFor(topicId);
    let idxs=deck.map((_,i)=>i);
    if(state.onlyMarked) idxs=idxs.filter(i=>isMarked(topicId,i));
    if(state.shuffled) idxs=shuffle(idxs);
    return idxs;
  }

  function setTopic(topicId){
    state.topicId=topicId;
    state.pos=0;
    state.flipped=false;
    state.order=buildOrder(topicId);
    render();
  }

  function topicOptions(){
    const data=window.FLASHCARDS_DATA||{};
    const ids=Object.keys(data).sort((a,b)=>{
      const na=parseInt(a.replace('tema',''),10), nb=parseInt(b.replace('tema',''),10);
      return na-nb;
    });
    const groups={'Bloque I':[], 'Bloque II':[]};
    ids.forEach(id=>{
      const t=data[id];
      (groups[t.block]||(groups[t.block]=[])).push({id, title:t.title});
    });
    return Object.keys(groups).map(block=>{
      const opts=groups[block].map(o=>`<option value="${o.id}">${esc(o.title)}</option>`).join('');
      return `<optgroup label="${esc(block)}">${opts}</optgroup>`;
    }).join('');
  }

  function render(){
    const box=document.getElementById('flashcards-body');
    if(!box) return;
    const deck=deckFor(state.topicId);
    const total=state.order.length;
    const markedCount=(getMarks()[state.topicId]||[]).length;

    let stageHtml;
    if(!total){
      stageHtml = state.onlyMarked
        ? `<div class="fc-empty">No tienes tarjetas marcadas en este tema todavía. Marca alguna con la ★ para repasarla luego.</div>`
        : `<div class="fc-empty">Este tema todavía no tiene flashcards.</div>`;
    } else {
      const cardIdx=state.order[state.pos];
      const card=deck[cardIdx];
      const marked=isMarked(state.topicId, cardIdx);
      stageHtml = `
        <div class="fc-stage">
          <div class="flashcard${state.flipped?' flipped':''}" id="fc-card" role="button" tabindex="0" aria-label="Tarjeta de repaso, pulsa para ver la respuesta">
            <div class="flashcard-inner">
              <div class="flashcard-face flashcard-front">
                <button class="fc-star${marked?' on':''}" id="fc-star-btn" title="Marcar para repasar" type="button">${marked?'★':'☆'}</button>
                <div class="fc-eyebrow">PREGUNTA</div>
                <div class="fc-question">${esc(card.q)}</div>
                <div class="fc-hint">Toca la tarjeta (o pulsa Espacio) para ver la respuesta</div>
              </div>
              <div class="flashcard-face flashcard-back">
                <button class="fc-star${marked?' on':''}" id="fc-star-btn-2" title="Marcar para repasar" type="button">${marked?'★':'☆'}</button>
                <div class="fc-eyebrow">RESPUESTA</div>
                <div class="fc-answer">${esc(card.a)}</div>
                <div class="fc-hint">Toca de nuevo para volver a la pregunta</div>
              </div>
            </div>
          </div>
          <div class="fc-nav">
            <button id="fc-prev" type="button" ${state.pos<=0?'disabled':''}>← Anterior</button>
            <span class="topic-meta">${state.pos+1} / ${total}</span>
            <button id="fc-next" type="button" ${state.pos>=total-1?'disabled':''}>Siguiente →</button>
          </div>
        </div>
      `;
    }

    box.innerHTML = `
      <div class="fc-toolbar">
        <select id="fc-topic-select">${topicOptions()}</select>
        <button class="btn secondary" id="fc-shuffle-btn" type="button">${state.shuffled?'🔀 Aleatorio: ON':'🔀 Aleatorio: OFF'}</button>
        <label><input type="checkbox" id="fc-onlymarked" ${state.onlyMarked?'checked':''}> Solo marcadas (${markedCount})</label>
        <span class="fc-progress">${window.FLASHCARDS_DATA && window.FLASHCARDS_DATA[state.topicId] ? esc(window.FLASHCARDS_DATA[state.topicId].title) : ''}</span>
      </div>
      ${stageHtml}
    `;

    const sel=document.getElementById('fc-topic-select');
    if(sel){ sel.value=state.topicId; sel.addEventListener('change', ()=>setTopic(sel.value)); }

    const shuffleBtn=document.getElementById('fc-shuffle-btn');
    if(shuffleBtn) shuffleBtn.addEventListener('click', ()=>{
      state.shuffled=!state.shuffled;
      state.pos=0; state.flipped=false;
      state.order=buildOrder(state.topicId);
      render();
    });

    const onlyMarked=document.getElementById('fc-onlymarked');
    if(onlyMarked) onlyMarked.addEventListener('change', ()=>{
      state.onlyMarked=onlyMarked.checked;
      state.pos=0; state.flipped=false;
      state.order=buildOrder(state.topicId);
      render();
    });

    const innerEl=document.querySelector('.flashcard-inner');
    if(innerEl){
      const front=innerEl.querySelector('.flashcard-front');
      const back=innerEl.querySelector('.flashcard-back');
      const h=Math.max(front?front.scrollHeight:0, back?back.scrollHeight:0, 260);
      innerEl.style.height=h+'px';
    }

    const cardEl=document.getElementById('fc-card');
    if(cardEl){
      const flip=()=>{ state.flipped=!state.flipped; cardEl.classList.toggle('flipped', state.flipped); };
      cardEl.addEventListener('click', (e)=>{
        if(e.target && (e.target.id==='fc-star-btn' || e.target.id==='fc-star-btn-2')) return;
        flip();
      });
      cardEl.addEventListener('keydown', (e)=>{
        if(e.key===' '||e.key==='Enter'){ e.preventDefault(); flip(); }
        if(e.key==='ArrowRight'){ e.preventDefault(); goNext(); }
        if(e.key==='ArrowLeft'){ e.preventDefault(); goPrev(); }
      });
    }
    ['fc-star-btn','fc-star-btn-2'].forEach(id=>{
      const btn=document.getElementById(id);
      if(btn) btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        const cardIdx=state.order[state.pos];
        toggleMark(state.topicId, cardIdx);
        render();
      });
    });
    const prevBtn=document.getElementById('fc-prev');
    if(prevBtn) prevBtn.addEventListener('click', goPrev);
    const nextBtn=document.getElementById('fc-next');
    if(nextBtn) nextBtn.addEventListener('click', goNext);
  }

  function goPrev(){ if(state.pos>0){ state.pos--; state.flipped=false; render(); } }
  function goNext(){ if(state.pos<state.order.length-1){ state.pos++; state.flipped=false; render(); } }

  function injectSection(){
    const progress=document.getElementById('tab-progress');
    if(!progress || document.getElementById('tab-flashcards')) return false;
    const sec=document.createElement('section');
    sec.id='tab-flashcards';
    sec.className='hidden';
    sec.innerHTML=`
      <div class="section-hero">
        <div class="eyebrow dark">REPASO RÁPIDO</div>
        <h2>Flashcards</h2>
        <p>Tarjetas conceptuales por tema: trámites completos, plazos y las ideas que más caen en examen. Toca una tarjeta para ver la respuesta.</p>
      </div>
      <div id="flashcards-body"></div>
    `;
    progress.parentNode.insertBefore(sec, progress);
    return true;
  }

  function injectNavButton(){
    const supBtn=document.getElementById('tab-supuestos-btn');
    if(!supBtn || !supBtn.parentNode || document.getElementById('tab-flashcards-btn')) return false;
    const btn=document.createElement('button');
    btn.id='tab-flashcards-btn';
    btn.innerHTML='<span>▤</span> Flashcards';
    btn.addEventListener('click', ()=>window.showTab('flashcards'));
    supBtn.parentNode.insertBefore(btn, supBtn.nextSibling);
    return true;
  }

  function ensureShowTabWrap(){
    const current=window.showTab;
    if(!current || current.__flashcardsWrapped) return;
    const wrapped=function(name){
      if(name==='flashcards'){
        ['tab-home','tab-study','tab-test','tab-supuestos','tab-progress','tab-flashcards'].forEach(id=>{
          const el=document.getElementById(id);
          if(el) el.classList.toggle('hidden', id!=='tab-flashcards');
        });
        ['tab-home-btn','tab-study-btn','tab-test-btn','tab-supuestos-btn','tab-progress-btn','tab-flashcards-btn'].forEach(id=>{
          const el=document.getElementById(id);
          if(el) el.classList.toggle('active', id==='tab-flashcards-btn');
        });
        if(!state.topicId) setTopic('tema1'); else render();
        return;
      }
      const fcSec=document.getElementById('tab-flashcards');
      if(fcSec) fcSec.classList.add('hidden');
      const fcBtn=document.getElementById('tab-flashcards-btn');
      if(fcBtn) fcBtn.classList.remove('active');
      current(name);
    };
    wrapped.__flashcardsWrapped=true;
    window.showTab=wrapped;
  }

  function ready(){
    return typeof window.FLASHCARDS_DATA==='object'
      && document.getElementById('tab-progress')
      && document.getElementById('tab-supuestos-btn');
  }

  function ensureUI(){
    if(!ready()) return false;
    injectStyles();
    injectSection();
    injectNavButton();
    ensureShowTabWrap();
    return true;
  }

  function poll(){
    ensureUI();
    setTimeout(poll, 400);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(poll,150));
  else setTimeout(poll,150);
})();
