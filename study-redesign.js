(function(){
  function boot(){
    const section=document.getElementById('tab-study');
    const select=document.getElementById('study-topic-select');
    const content=document.getElementById('study-content');
    if(!section||!select||!content||!Array.isArray(window.TOPICS)||document.getElementById('study-redesign')) return;

    const topics=window.TOPICS;
    const shell=document.createElement('div');
    shell.id='study-redesign';
    shell.innerHTML=`
      <div class="study-hero">
        <div>
          <div class="study-eyebrow">PREPARACIÓN · TEMARIO</div>
          <h2>Estudiar</h2>
          <p>Explora los 23 temas, revisa los resúmenes y céntrate en aquello que necesitas dominar.</p>
        </div>
        <div class="study-count"><strong>${topics.length}</strong><span>temas</span></div>
      </div>
      <div class="study-layout">
        <aside class="study-sidebar">
          <div class="study-search-wrap"><input id="study-search" type="search" placeholder="Buscar tema..." aria-label="Buscar tema"></div>
          <div class="study-block-filter"><button class="study-filter active" data-block="all">Todos</button><button class="study-filter" data-block="Bloque I">Bloque I</button><button class="study-filter" data-block="Bloque II">Bloque II</button></div>
          <div id="study-topic-list" class="study-topic-list"></div>
        </aside>
        <div class="study-reader">
          <div id="study-reader-head" class="study-reader-head"><span class="study-placeholder-icon">📚</span><div><span class="study-eyebrow">SELECCIONA UN TEMA</span><h3>Comienza por cualquier tema del temario</h3><p>Selecciona un tema en la izquierda para abrir su resumen.</p></div></div>
          <div id="study-content-redesign" class="study-reader-content"></div>
        </div>
      </div>`;

    const oldCard=select.closest('.card');
    if(oldCard) oldCard.classList.add('study-legacy-config');
    section.insertBefore(shell, section.firstChild);
    content.classList.add('study-legacy-content');

    const list=document.getElementById('study-topic-list');
    const reader=document.getElementById('study-content-redesign');
    const head=document.getElementById('study-reader-head');
    const search=document.getElementById('study-search');
    let block='all';

    function filtered(){
      const q=(search.value||'').toLowerCase().trim();
      return topics.filter(t=>(block==='all'||t.block===block) && (!q||t.title.toLowerCase().includes(q)));
    }
    function renderList(){
      list.innerHTML=filtered().map(t=>`<button class="study-topic-item" data-id="${t.id}"><span class="study-topic-num">${String(t.id).replace('tema','').padStart(2,'0')}</span><span class="study-topic-copy"><b>${t.title.replace(/^Tema\s+\d+\.\s*/,'')}</b><small>${t.block}</small></span><span class="study-topic-arrow">›</span></button>`).join('') || '<div class="study-empty">No hay temas que coincidan con la búsqueda.</div>';
      list.querySelectorAll('.study-topic-item').forEach(btn=>btn.addEventListener('click',()=>openTopic(btn.dataset.id)));
    }
    function openTopic(id){
      select.value=id;
      if(typeof window.renderStudy==='function') window.renderStudy();
      const topic=topics.find(t=>t.id===id);
      if(!topic) return;
      list.querySelectorAll('.study-topic-item').forEach(x=>x.classList.toggle('selected',x.dataset.id===id));
      head.innerHTML=`<div class="study-reader-title"><span class="study-topic-pill">${topic.block}</span><h3>${topic.title}</h3><p>Resumen de estudio · revisa los conceptos clave antes de practicar con un test.</p></div><button class="study-test-btn" onclick="prepareTopicTest('${topic.id}')">Practicar este tema →</button>`;
      reader.innerHTML=content.innerHTML;
      reader.scrollIntoView({behavior:'smooth',block:'start'});
    }
    document.querySelectorAll('.study-filter').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.study-filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');block=b.dataset.block;renderList();}));
    search.addEventListener('input',renderList);
    renderList();
    if(topics[0]) openTopic(topics[0].id);
  }
  window.addEventListener('load',()=>setTimeout(boot,250));
  const obs=new MutationObserver(()=>{if(!document.getElementById('study-redesign')) boot();});
  obs.observe(document.body,{childList:true,subtree:true});
})();
