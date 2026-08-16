(function(){
  function boot(){
    const section=document.getElementById('tab-study');
    const select=document.getElementById('study-topic-select');
    const content=document.getElementById('study-content');
    if(!section||!select||!content||document.getElementById('study-redesign')) return;

    const options=Array.from(select.options).filter(o=>o.value);
    if(!options.length) return;

    const shell=document.createElement('div');
    shell.id='study-redesign';
    shell.innerHTML=`
      <div class="study-hero">
        <div>
          <div class="study-eyebrow">PREPARACIÓN · TEMARIO</div>
          <h2>Estudiar</h2>
          <p>Explora los 23 temas, revisa los resúmenes y céntrate en aquello que necesitas dominar.</p>
        </div>
        <div class="study-count"><strong>${options.length}</strong><span>temas</span></div>
      </div>
      <div class="study-layout">
        <aside class="study-sidebar">
          <div class="study-search-wrap"><input id="study-search" type="search" placeholder="Buscar tema..." aria-label="Buscar tema"></div>
          <div class="study-block-filter"><button class="study-filter active" data-block="all">Todos</button><button class="study-filter" data-block="Bloque I">Bloque I</button><button class="study-filter" data-block="Bloque II">Bloque II</button></div>
          <div id="study-topic-list" class="study-topic-list"></div>
        </aside>
        <div class="study-reader">
          <div id="study-reader-head" class="study-reader-head"></div>
          <div id="study-content-redesign" class="study-reader-content"></div>
        </div>
      </div>`;

    const oldCard=select.closest('.card');
    if(oldCard) oldCard.classList.add('study-legacy-config');
    content.classList.add('study-legacy-content');
    section.insertBefore(shell,section.firstChild);

    const list=document.getElementById('study-topic-list');
    const reader=document.getElementById('study-content-redesign');
    const head=document.getElementById('study-reader-head');
    const search=document.getElementById('study-search');
    let block='all';

    function blockOf(text){
      return /9\.|10\.|11\.|12\.|13\.|14\.|15\.|16\.|17\.|18\.|19\.|20\.|21\.|22\.|23\./.test(text) ? 'Bloque II' : 'Bloque I';
    }
    function filtered(){
      const q=(search.value||'').toLowerCase().trim();
      return options.filter(o=>{
        const b=blockOf(o.textContent||'');
        return (block==='all'||b===block) && (!q||(o.textContent||'').toLowerCase().includes(q));
      });
    }
    function renderList(){
      list.innerHTML=filtered().map(o=>{
        const text=(o.textContent||'').trim();
        const m=text.match(/^(?:Tema\s*)?(\d+)/i);
        const num=m?m[1]:'';
        const title=text.replace(/^Tema\s*\d+[.\-:]?\s*/i,'');
        const b=blockOf(text);
        return `<button class="study-topic-item" data-id="${o.value}"><span class="study-topic-num">${String(num).padStart(2,'0')}</span><span class="study-topic-copy"><b>${title}</b><small>${b}</small></span><span class="study-topic-arrow">›</span></button>`;
      }).join('') || '<div class="study-empty">No hay temas que coincidan con la búsqueda.</div>';
      list.querySelectorAll('.study-topic-item').forEach(btn=>btn.addEventListener('click',()=>openTopic(btn.dataset.id)));
    }
    function openTopic(id){
      select.value=id;
      select.dispatchEvent(new Event('change',{bubbles:true}));
      const opt=options.find(o=>o.value===id);
      if(!opt) return;
      const text=(opt.textContent||'').trim();
      const b=blockOf(text);
      const title=text.replace(/^Tema\s*\d+[.\-:]?\s*/i,'');
      list.querySelectorAll('.study-topic-item').forEach(x=>x.classList.toggle('selected',x.dataset.id===id));
      head.innerHTML=`<div class="study-reader-title"><span class="study-topic-pill">${b}</span><h3>${title}</h3><p>Resumen de estudio · revisa los conceptos clave antes de practicar.</p></div><button class="study-test-btn" type="button">Practicar este tema →</button>`;
      reader.innerHTML=content.innerHTML;
      head.querySelector('.study-test-btn').addEventListener('click',()=>{
        if(typeof window.prepareTopicTest==='function') window.prepareTopicTest(id);
        else if(typeof window.startTestForTopic==='function') window.startTestForTopic(id);
        else if(typeof select.closest('form')?.requestSubmit==='function') select.closest('form').requestSubmit();
      });
      reader.scrollIntoView({behavior:'smooth',block:'start'});
    }
    document.querySelectorAll('.study-filter').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.study-filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');block=b.dataset.block;renderList();}));
    search.addEventListener('input',renderList);
    renderList();
    openTopic(options[0].value);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,100));
  else setTimeout(boot,100);
})();
