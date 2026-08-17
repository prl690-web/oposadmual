(function(){
  const TOKEN_KEY='oposadmual_gh_token';
  const GIST_ID_KEY='oposadmual_gist_id';
  const PROGRESS_KEY='oposadmual_progress_v2';
  const GIST_FILENAME='oposadmual-progress.json';
  const GIST_DESC='oposadmual-progress-sync (no borrar)';
  let autoSyncedOnce=false;
  let lastPushedSig='';

  function getToken(){ return localStorage.getItem(TOKEN_KEY)||''; }
  function setToken(t){ if(t) localStorage.setItem(TOKEN_KEY,t); else localStorage.removeItem(TOKEN_KEY); }
  function getGistId(){ return localStorage.getItem(GIST_ID_KEY)||''; }
  function setGistId(id){ if(id) localStorage.setItem(GIST_ID_KEY,id); else localStorage.removeItem(GIST_ID_KEY); }

  function readLocalProgress(){
    try{ return JSON.parse(localStorage.getItem(PROGRESS_KEY)||'{}'); }catch(e){ return {}; }
  }
  function writeLocalProgress(d){ localStorage.setItem(PROGRESS_KEY, JSON.stringify(d)); }

  async function ghFetch(url, opts){
    opts=opts||{};
    const res=await fetch(url, {
      ...opts,
      headers:{
        'Authorization':'token '+getToken(),
        'Accept':'application/vnd.github+json',
        ...(opts.headers||{})
      }
    });
    if(!res.ok){
      let msg='';
      try{ msg=(await res.json()).message||''; }catch(e){}
      const err=new Error('GitHub API '+res.status+(msg?': '+msg:''));
      err.status=res.status;
      throw err;
    }
    return res.json();
  }

  async function findExistingGist(){
    const gists=await ghFetch('https://api.github.com/gists?per_page=100');
    const match=gists.find(g=>g.description===GIST_DESC);
    return match?match.id:null;
  }

  async function pushProgress(){
    const d=readLocalProgress();
    d.updatedAt=Date.now();
    writeLocalProgress(d);
    const content=JSON.stringify(d);

    let gistId=getGistId();
    if(!gistId){ gistId=await findExistingGist(); if(gistId) setGistId(gistId); }

    if(gistId){
      await ghFetch('https://api.github.com/gists/'+gistId, {
        method:'PATCH',
        body:JSON.stringify({files:{[GIST_FILENAME]:{content}}})
      });
    } else {
      const created=await ghFetch('https://api.github.com/gists', {
        method:'POST',
        body:JSON.stringify({description:GIST_DESC, public:false, files:{[GIST_FILENAME]:{content}}})
      });
      setGistId(created.id);
    }
    lastPushedSig=content;
    return d.updatedAt;
  }

  async function pullProgress(){
    let gistId=getGistId();
    if(!gistId){ gistId=await findExistingGist(); if(gistId) setGistId(gistId); }
    if(!gistId) return null;
    const gist=await ghFetch('https://api.github.com/gists/'+gistId);
    const file=gist.files&&gist.files[GIST_FILENAME];
    if(!file||!file.content) return null;
    try{ return JSON.parse(file.content); }catch(e){ return null; }
  }

  // last-write-wins by updatedAt timestamp; avoids double-counting from merging
  // per-topic numbers across two devices that might have practiced offline.
  async function syncNow(direction){
    if(!getToken()) throw new Error('No hay token configurado');
    const local=readLocalProgress();
    let remote=null;
    try{ remote=await pullProgress(); }catch(e){ if(direction!=='pull') { /* fall through to push */ } else throw e; }

    if(direction==='pull'){
      if(remote){ writeLocalProgress(remote); refreshUI(); return 'pulled'; }
      return 'sin-datos-remotos';
    }
    if(direction==='push'){ await pushProgress(); return 'pushed'; }

    // auto
    if(!remote){ await pushProgress(); return 'pushed'; }
    const localTime=local.updatedAt||0, remoteTime=remote.updatedAt||0;
    if(remoteTime>localTime){ writeLocalProgress(remote); refreshUI(); return 'pulled'; }
    if(localTime>remoteTime){ await pushProgress(); return 'pushed'; }
    return 'al-dia';
  }

  function refreshUI(){
    if(typeof window.showTab!=='function') return;
    const active=['home','study','test','supuestos','progress'].find(n=>{
      const el=document.getElementById('tab-'+n);
      return el && !el.classList.contains('hidden');
    });
    window.showTab(active||'home');
  }

  function fmtTime(ts){
    if(!ts) return 'nunca';
    const d=new Date(ts);
    return d.toLocaleString('es-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  }

  function render(){
    const box=document.getElementById('sync-card');
    if(!box) return;
    const token=getToken();
    const local=readLocalProgress();
    const tokenUrl='https://github.com/settings/tokens/new?scopes=gist&description=oposadmual-progress';

    if(!token){
      box.innerHTML=`
        <div class="card-heading"><div><div class="eyebrow dark">SINCRONIZAR</div><h3>Progreso entre dispositivos</h3></div></div>
        <p class="topic-meta">Conecta un token de GitHub (solo permiso "gist") para guardar automáticamente tu progreso en un gist privado de tu cuenta y recuperarlo desde cualquier otro dispositivo.</p>
        <p class="topic-meta"><a href="${tokenUrl}" target="_blank" rel="noopener">Crear un token nuevo en GitHub →</a> (se abre con el permiso "gist" ya marcado; solo tienes que ponerle un nombre y pulsar "Generate token")</p>
        <div class="row" style="gap:8px;margin-top:10px;">
          <input type="password" id="sync-token-input" placeholder="Pega aquí tu token (ghp_...)" style="flex:1;min-width:220px;padding:9px 11px;border:1px solid var(--border);border-radius:9px;font-family:inherit;">
          <button class="btn" id="sync-connect-btn" type="button">Conectar</button>
        </div>
        <div id="sync-status" class="topic-meta" style="margin-top:8px;"></div>
      `;
      document.getElementById('sync-connect-btn').addEventListener('click', async ()=>{
        const val=document.getElementById('sync-token-input').value.trim();
        if(!val){ setStatus('Pega un token antes de conectar.', true); return; }
        setToken(val);
        setStatus('Conectando…');
        try{
          const res=await syncNow('auto');
          setStatus('Conectado. Estado: '+res+'.');
          render();
        }catch(e){
          setToken('');
          setStatus('No se pudo conectar: '+e.message, true);
        }
      });
    } else {
      box.innerHTML=`
        <div class="card-heading"><div><div class="eyebrow dark">SINCRONIZAR</div><h3>Progreso entre dispositivos</h3></div></div>
        <p class="topic-meta">Conectado. Última sincronización local: <b>${esc(fmtTime(local.updatedAt))}</b>.</p>
        <div class="row" style="gap:8px;margin-top:10px;">
          <button class="btn" id="sync-now-btn" type="button">Sincronizar ahora</button>
          <button class="btn secondary" id="sync-disconnect-btn" type="button">Desconectar</button>
        </div>
        <div id="sync-status" class="topic-meta" style="margin-top:8px;"></div>
      `;
      document.getElementById('sync-now-btn').addEventListener('click', async ()=>{
        setStatus('Sincronizando…');
        try{
          const res=await syncNow('auto');
          setStatus('Sincronizado (' + res + ') · '+fmtTime(Date.now()));
          render();
        }catch(e){
          setStatus('Error al sincronizar: '+e.message, true);
        }
      });
      document.getElementById('sync-disconnect-btn').addEventListener('click', ()=>{
        setToken(''); setGistId('');
        setStatus('Desconectado. Tu progreso sigue guardado en este navegador; el gist remoto no se ha borrado.');
        render();
      });
    }
  }

  function esc(s){ return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function setStatus(msg, isError){
    const el=document.getElementById('sync-status');
    if(el){ el.textContent=msg; el.style.color=isError?'var(--bad)':''; }
  }

  function injectCard(){
    const section=document.getElementById('tab-progress');
    if(!section || document.getElementById('sync-card')) return false;
    const oldCard=section.querySelector('.card');
    if(oldCard){
      const oldNote=oldCard.querySelector('p.topic-meta');
      if(oldNote && oldNote.textContent.includes('no se guarda')){
        oldNote.textContent='Tu progreso se guarda automáticamente en este navegador y persiste aunque cierres la pestaña o recargues la página.';
      }
    }
    const card=document.createElement('div');
    card.id='sync-card';
    card.className='dashboard-card';
    card.style.marginBottom='18px';
    section.insertBefore(card, section.firstChild);
    render();
    return true;
  }

  function maybeAutoSync(){
    if(autoSyncedOnce) return;
    if(!getToken()) return;
    autoSyncedOnce=true;
    syncNow('auto').then(()=>render()).catch(()=>render());
  }

  function boot(){
    if(!injectCard()) return false;
    maybeAutoSync();
    return true;
  }

  function poll(){ if(!boot()) setTimeout(poll,200); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(poll,150));
  else setTimeout(poll,150);
})();
