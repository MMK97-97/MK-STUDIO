
(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const T=window.MK97_TEMPLATES||[];
const store={
  get(k,d=null){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch{return d}},
  set(k,v){localStorage.setItem(k,JSON.stringify(v))}
};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
function toast(msg){
  let t=$('.toast'); if(t)t.remove();
  t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);
  setTimeout(()=>t.remove(),1700);
}
window.MK97={store,toast,templates:T,bump(k){const a=store.get('mk97.analytics',{templatesUsed:0,exports:0,projects:0,aiActions:0,videoEdits:0});a[k]=(a[k]||0)+1;store.set('mk97.analytics',a)}};
function nav(){
 const active=document.body.dataset.nav||'';
 const items=[
   ['index.html','⌂','Home','home',''],
   ['templates.html','▦','Templates','templates',''],
   ['#create','＋','Create','create','create'],
   ['projects.html','▧','Projects','projects',''],
   ['analytics.html','📊','Analytics','analytics','']
 ];
 return `<nav class="bottomnav">${items.map(([h,i,l,k,c])=>`<a href="${h}" class="navitem ${active===k?'active':''} ${c}" ${c==='create'?'data-open-create':''}><span>${i}</span>${l}</a>`).join('')}</nav>`;
}
$$('[data-bottomnav]').forEach(x=>x.innerHTML=nav());
function templateCard(t){
 const logoSrc = esc(t.logo || 'fwcwl-logo.jpeg');
 const aspectTag = t.aspect === 'square' ? '1:1 POST' : (t.aspect === 'story' ? '9:16 FLYER' : '4:5 CARD');
 const titleHtml = esc(t.title || t.name).replaceAll('\n', '<br>');
 return `<a class="template-box-card" href="template-detail.html?id=${encodeURIComponent(t.id)}" title="${esc(t.name)}">
  <div class="template-box-art" style="--a:${t.palette?.[0]||'#08121e'};--b:${t.palette?.[1]||'#1e293b'}">
   <div class="card-top-row">
    <img class="card-logo" src="${logoSrc}" alt="FWCWL">
    <span class="card-kicker-pill">${esc(t.kicker||'FWCWL')}</span>
    <span class="template-crown">👑</span>
   </div>
   <div class="card-center-stage">
    <div class="card-main-title">${titleHtml}</div>
    <div class="card-sub-info">${esc(t.detail||'')}</div>
   </div>
   <div class="card-bottom-pill">
    <span>${aspectTag}</span>
    <span>★ PRO</span>
   </div>
  </div>
  <div class="template-box-meta">
   <strong>${esc(t.name)}</strong>
   <span class="meta-tag">${esc((t.category||'cricket').toUpperCase())}</span>
  </div>
 </a>`;
}
window.MK97.templateCard=templateCard;
const trending=$('#trendingTemplates'); if(trending)trending.innerHTML=T.slice(0,8).map(templateCard).join('');
const grid=$('#templateGrid'),search=$('#templateSearch'),chips=$('#categoryChips'),count=$('#templateCount');
if(grid){
 let cat='all'; const cats=['all',...new Set(T.map(x=>x.category))];
 chips.innerHTML=cats.map(c=>`<button class="chip ${c==='all'?'active':''}" data-cat="${esc(c)}">${c==='all'?'All':c.replace(/(^|-)\w/g,m=>m.toUpperCase())}</button>`).join('');
 const render=()=>{const q=(search?.value||'').trim().toLowerCase();const list=T.filter(t=>(cat==='all'||t.category===cat)&&(!q||`${t.name} ${t.title} ${t.kicker} ${t.detail} ${t.style}`.toLowerCase().includes(q)));grid.innerHTML=list.map(templateCard).join('');if(count)count.textContent=`${list.length} templates`;};
 search?.addEventListener('input',render);
 chips?.addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(!b)return;cat=b.dataset.cat;$$('.chip',chips).forEach(x=>x.classList.toggle('active',x===b));render();});
 render();
}
if($('#templateDetail')){
 const id=new URLSearchParams(location.search).get('id')||store.get('mk97.selectedTemplate','fwcwl-matchday-broadcast');
 const t=T.find(x=>x.id===id)||T[0];
 if(t){
   $('#detailName').textContent=t.name;$('#detailCategory').textContent=t.category.toUpperCase();
   $('#detailPreview').innerHTML=templateCard(t);
   const useBtn=$('#useTemplate');
   if(useBtn){
     useBtn.href='poster-editor.html?id='+encodeURIComponent(t.id);
     useBtn.addEventListener('click',()=>{store.set('mk97.selectedTemplate',t.id);window.MK97.bump('templatesUsed')});
   }
   $('#similarTemplates').innerHTML=T.filter(x=>x.category===t.category&&x.id!==t.id).slice(0,4).map(templateCard).join('');
 }
}
const intro=$('.logo-transition');
if(intro){
 if(sessionStorage.getItem('mk97.introSeen'))intro.remove();
 else setTimeout(()=>{intro.classList.add('hide');sessionStorage.setItem('mk97.introSeen','1');setTimeout(()=>intro.remove(),750)},1700);
}
if($('#mediaUpload')){
 const p=store.get('mk97.pendingImage');if(p&&$('#uploadedPreview')){$('#uploadedPreview').src=p;$('#uploadedPreview').classList.remove('hidden')}
 $('#mediaUpload').addEventListener('change',e=>{
   const f=e.target.files?.[0];if(!f)return;if(f.size>3000000){toast('Use an image under 3 MB for cross-page transfer.');return}
   const r=new FileReader();r.onload=()=>{store.set('mk97.pendingImage',r.result);if($('#uploadedPreview')){$('#uploadedPreview').src=r.result;$('#uploadedPreview').classList.remove('hidden')}toast('Image ready for Poster Studio');};r.readAsDataURL(f);
 });
}
if($('#brandForm')){
 const b=store.get('mk97.brand',{name:'FWCWL',accent:'#f3c95b',background:'#080d13',showLogo:true});
 $('#brandName').value=b.name;$('#brandAccent').value=b.accent;$('#brandBackground').value=b.background;$('#brandLogo').checked=b.showLogo;
 $('#saveBrand').onclick=()=>{b.name=$('#brandName').value;b.accent=$('#brandAccent').value;b.background=$('#brandBackground').value;b.showLogo=$('#brandLogo').checked;store.set('mk97.brand',b);toast('Brand kit saved');};
}
if($('#aiUpload')){
 let src=null;
 $('#aiUpload').addEventListener('change',e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{src=r.result;$('#aiOriginal').src=src;$('#aiOriginal').classList.remove('hidden')};r.readAsDataURL(f)});
 $('#removeBackground').onclick=()=>{if(!src){toast('Upload an image first');return}
   const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0);const d=x.getImageData(0,0,c.width,c.height),p=d.data,pts=[[2,2],[c.width-3,2],[2,c.height-3],[c.width-3,c.height-3]];let rr=0,gg=0,bb=0;for(const [px,py] of pts){const i=(py*c.width+px)*4;rr+=p[i];gg+=p[i+1];bb+=p[i+2]}rr/=4;gg/=4;bb/=4;for(let i=0;i<p.length;i+=4){const dist=Math.hypot(p[i]-rr,p[i+1]-gg,p[i+2]-bb)/1.732;if(dist<32)p[i+3]=0;else if(dist<62)p[i+3]=Math.round(p[i+3]*(dist-32)/30)}x.putImageData(d,0,0);const url=c.toDataURL('image/png');$('#aiResult').src=url;$('#aiResult').classList.remove('hidden');store.set('mk97.pendingImage',url);window.MK97.bump('aiActions');toast('Cutout ready for Poster Studio');};img.src=src;
 };
}
if($('#projectGrid')){
 const projects=store.get('mk97.projects',[]);
 $('#projectGrid').innerHTML=projects.length?projects.slice().reverse().map(p=>`<article class="project-card"><div class="template-art" style="--a:#07131b;--b:#402026;--accent:#f3c95b;aspect-ratio:4/3"><div class="template-copy"><span>${esc(p.type||'PROJECT')}</span><h3>${esc(p.name||'MK97 Project')}</h3><small>${esc(p.saved||'')}</small></div></div></article>`).join(''):`<div class="panel empty" style="grid-column:1/-1">No saved projects yet.<br><a href="poster-editor.html" class="gold-btn" style="margin-top:14px">Create a project</a></div>`;
}
if($('#analyticsMetrics')){
 const a=store.get('mk97.analytics',{templatesUsed:0,exports:0,projects:0,aiActions:0,videoEdits:0});
 $('#analyticsMetrics').innerHTML=[['Templates Used',a.templatesUsed],['Exports',a.exports],['Saved Projects',a.projects],['AI Actions',a.aiActions]].map(([l,v])=>`<div class="metric"><strong>${v||0}</strong><span>${l}</span></div>`).join('');
}
if($('#saveSchedule'))$('#saveSchedule').onclick=()=>{store.set('mk97.schedule',{date:$('#scheduleDate').value,time:$('#scheduleTime').value,platform:$('#schedulePlatform').value});toast('Schedule saved locally')};

// Studio Selector Modal (POSTER EDITOR <> VIDEO EDITOR)
function initStudioModal() {
  if ($('#createStudioModal')) return;
  const modal = document.createElement('div');
  modal.id = 'createStudioModal';
  modal.className = 'create-select-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div class="create-modal-backdrop"></div>
    <div class="create-modal-card">
      <button class="create-modal-close" id="closeStudioModal" aria-label="Close">✕</button>
      <div class="create-modal-header">
        <div class="create-modal-badge">✨ MK97 CREATIVE WORKSPACE</div>
        <h2 class="create-modal-title">Create New Project</h2>
        <p class="create-modal-sub">Choose your creative workspace to begin</p>
      </div>

      <div class="create-studio-grid">
        <!-- 1. POSTER EDITOR -->
        <a href="poster-editor.html" class="studio-option-card poster-card" id="selectPosterStudio">
          <div class="studio-option-badge">GRAPHICS & FLYERS</div>
          <div class="studio-option-icon">🎨</div>
          <h3 class="studio-option-title">POSTER EDITOR</h3>
          <p class="studio-option-desc">Matchday graphics, tournament flyers, player cutouts, high-intensity stadium lights & pro typography.</p>
          <div class="studio-option-tags">
            <span>1:1 Post</span>
            <span>9:16 Story</span>
            <span>4:5 Card</span>
            <span>Ultra HD</span>
          </div>
          <div class="studio-option-btn">
            <span>Open Poster Studio</span>
            <span class="arrow">›</span>
          </div>
        </a>

        <!-- 2. VIDEO EDITOR -->
        <a href="video-editor.html" class="studio-option-card video-card" id="selectVideoStudio">
          <div class="studio-option-badge">MULTI-TRACK 4K</div>
          <div class="studio-option-icon">🎬</div>
          <h3 class="studio-option-title">VIDEO EDITOR</h3>
          <p class="studio-option-desc">Multi-track timeline, keyframing, beat sync, cinematic filters, auto captions & 4K 60FPS export.</p>
          <div class="studio-option-tags">
            <span>Multi-track</span>
            <span>Keyframes</span>
            <span>Auto Captions</span>
            <span>60 FPS</span>
          </div>
          <div class="studio-option-btn">
            <span>Open Video Studio</span>
            <span class="arrow">›</span>
          </div>
        </a>
      </div>

      <div class="create-modal-foot">
        <span>Need ready-made designs?</span>
        <a href="templates.html" class="foot-templates-link">Browse 170+ Cricket Templates ›</a>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const close = () => modal.classList.remove('open');
  modal.querySelector('.create-modal-backdrop').onclick = close;
  modal.querySelector('#closeStudioModal').onclick = close;
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) close();
  });
}

function openCreateModal() {
  initStudioModal();
  $('#createStudioModal').classList.add('open');
}

window.MK97.openCreateModal = openCreateModal;

document.addEventListener('click', e => {
  const trigger = e.target.closest('[data-open-create], a[href="#create"], .gold-cta-btn, #heroCreateBtn');
  if (trigger) {
    e.preventDefault();
    openCreateModal();
  }
});
})();
