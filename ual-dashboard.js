(function(){
  const KEY='oposadmual_progress_v1';
  const get=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{"attempts":0,"correct":0,"wrong":0,"topics":{}}')}catch(e){return {attempts:0,correct:0,wrong:0,topics:{}}}};
  const save=d=>localStorage.setItem(KEY,JSON.stringify(d));
  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const topicName=()=>document.querySelector('#q-topic-label')?.textContent?.trim()||'Sin tema';
  const question=()=>document.querySelector('#q-text')?.textContent?.trim()||'';
  let lastAnswered='';
  function record(){
    const q=question(), t=topicName(); if(!q) return;
    const correct=!!document.querySelector('#q-options .option.correct');
    const wrong=!!document.querySelector('#q-options .option.incorrect');
    if(!correct && !wrong) return;
    const sig=t+'|'+q; if(sig===lastAnswered) return; lastAnswered=sig;
    const d=get(); d.attempts++; correct?d.correct++:d.wrong++;
    d.topics[t] ||= {attempts:0,correct:0,wrong:0}; d.topics[t].attempts++; correct?d.topics[t].correct++:d.topics[t].wrong++;
    save(d); render();
  }
  function render(){
    const box=document.querySelector('#ual-dashboard'); if(!box) return;
    const d=get(), acc=d.attempts?Math.round(d.correct/d.attempts*100):0;
    const rows=Object.entries(d.topics).filter(([k])=>k!=='Sin tema').map(([k,v])=>({k,v,p:v.attempts?Math.round(v.correct/v.attempts*100):0})).sort((a,b)=>a.p-b.p).slice(0,5);
    box.innerHTML=`<div class="ual-home-head"><div><span class="ual-eyebrow">TU PREPARACIÓN</span><h2>Oposición Auxiliar Administrativa</h2><p>Universidad de Almería · C2</p></div><div class="ual-home-actions"><button class="btn" onclick="showTab('test')">Hacer test</button><button class="btn secondary" onclick="showTab('study')">Estudiar</button></div></div><div class="ual-metrics"><div><strong>${d.attempts}</strong><span>Preguntas realizadas</span></div><div><strong>${acc}%</strong><span>Aciertos</span></div><div><strong>${d.wrong}</strong><span>Fallos</span></div><div><strong>23</strong><span>Temas disponibles</span></div></div><div class="ual-home-grid"><div class="ual-home-card"><span class="ual-eyebrow">PRÓXIMO PASO</span><h3>Repasa lo que más te cuesta</h3><p>${rows.length?`Tu área más débil ahora es <b>${esc(rows[0].k)}</b> (${rows[0].p}% de aciertos).`:'Aún no hay suficiente actividad. Empieza con un test para construir tu mapa de progreso.'}</p><button class="btn" onclick="showTab('test')">Empezar entrenamiento</button></div><div class="ual-home-card"><span class="ual-eyebrow">ÁREAS A REFORZAR</span>${rows.length?rows.map(r=>`<div class="ual-weak"><div><b>${esc(r.k)}</b><span>${r.v.attempts} preguntas</span></div><div class="ual-mini-bar"><i style="width:${r.p}%"></i></div><strong>${r.p}%</strong></div>`).join(''):'<p class="topic-meta">Los temas aparecerán aquí a medida que practiques.</p>'}</div></div>`;
  }
  function inject(){
    if(document.querySelector('#ual-dashboard')) return;
    const nav=document.querySelector('nav.tabs'); if(!nav) return;
    const b=document.createElement('button'); b.id='tab-home-btn'; b.textContent='Inicio'; b.onclick=()=>showTab('home'); nav.insertBefore(b,nav.firstChild);
    const main=document.querySelector('main'); const study=document.querySelector('#tab-study');
    const sec=document.createElement('section'); sec.id='tab-home'; sec.innerHTML='<div class="card" id="ual-dashboard"></div>'; main.insertBefore(sec,study); render();
    const style=document.createElement('style'); style.textContent=`#tab-home{display:block}.ual-home-head{display:flex;justify-content:space-between;gap:24px;align-items:flex-end;margin-bottom:22px}.ual-eyebrow{display:block;font-size:.72rem;letter-spacing:.11em;font-weight:800;color:#00A99D;margin-bottom:5px}.ual-home-head h2{margin:0;font-size:2rem}.ual-home-head p{margin:3px 0 0;color:#64748B}.ual-home-actions{display:flex;gap:8px}.ual-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}.ual-metrics>div{background:#fff;border:1px solid #DCE4EC;border-radius:14px;padding:18px}.ual-metrics strong{display:block;font-size:1.9rem;color:#326195;line-height:1}.ual-metrics span{display:block;color:#64748B;font-size:.82rem;margin-top:6px}.ual-home-grid{display:grid;grid-template-columns:1fr 1.35fr;gap:16px}.ual-home-card{background:#fff;border:1px solid #DCE4EC;border-radius:16px;padding:22px;box-shadow:0 10px 30px rgba(31,64,96,.06)}.ual-home-card h3{margin:0 0 6px}.ual-home-card p{color:#64748B;line-height:1.5}.ual-weak{display:grid;grid-template-columns:minmax(150px,1fr) 1fr 48px;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #EDF1F5}.ual-weak span{display:block;color:#64748B;font-size:.75rem}.ual-mini-bar{height:7px;background:#E8EDF2;border-radius:8px;overflow:hidden}.ual-mini-bar i{display:block;height:100%;background:linear-gradient(90deg,#326195,#00A99D)}.ual-weak>strong{text-align:right;color:#326195}@media(max-width:720px){.ual-home-head{display:block}.ual-home-actions{margin-top:14px}.ual-metrics{grid-template-columns:repeat(2,1fr)}.ual-home-grid{grid-template-columns:1fr}.ual-home-head h2{font-size:1.55rem}}`; document.head.appendChild(style);
  }
  const obs=new MutationObserver(()=>{inject(); setTimeout(record,80);});
  obs.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  window.addEventListener('load',()=>{inject();render();});
})();
