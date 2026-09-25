(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)],T=window.MK97_TEMPLATES||[];
const canvas=$('#posterCanvas'),ctx=canvas.getContext('2d'),stage=$('#stage'),frame=$('#canvasFrame');
const store={get(k,d=null){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch{return d}},set(k,v){localStorage.setItem(k,JSON.stringify(v))}};
const uid=()=>Math.random().toString(36).slice(2,9),clone=o=>JSON.parse(JSON.stringify(o));
let state={w:1080,h:1350,bg:'#0a0e13',layers:[],selected:null,zoom:1,grid:false,guides:true,templateId:null,activeFilter:'cinematic'};
let history=[],future=[],drag=null,imageCache=new Map();
const sizes={portrait:[1080,1350],square:[1080,1080],story:[1080,1920]};

function toast(m){let t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),1500)}
function bump(k){const a=store.get('mk97.analytics',{templatesUsed:0,exports:0,projects:0,aiActions:0,videoEdits:0});a[k]=(a[k]||0)+1;store.set('mk97.analytics',a)}
function push(){history.push(clone(state));if(history.length>40)history.shift();future=[]}
function undo(){if(!history.length)return;future.push(clone(state));state=history.pop();syncAll()}
function redo(){if(!future.length)return;history.push(clone(state));state=future.pop();syncAll()}
function fontName(f){return /bebas/i.test(f)?'Impact':/playfair/i.test(f)?'Georgia':'Arial'}

function defaultTemplate(t){
  state.templateId=t.id;state.bg=t.palette[0];
  state.layers=[
    {id:uid(),type:'shape',name:'Gold Accent',x:720,y:80,w:400,h:1350,color:t.palette[1],opacity:.86,rotation:-12,visible:true,locked:false},
    {id:uid(),type:'image',name:'Player Batter',src:'fwcwl-logo.jpeg',x:160,y:260,w:760,h:760,opacity:1,rotation:0,visible:true,locked:false,brightness:105,contrast:125,saturation:115,hue:0,blur:0,sepia:0},
    {id:uid(),type:'text',name:'Category Tag',text:t.kicker||'MATCH DAY',x:80,y:120,w:850,h:70,font:fontName(t.font),size:42,weight:900,color:t.palette[2]||'#f59e0b',align:t.align||'left',opacity:1,rotation:0,visible:true,locked:false},
    {id:uid(),type:'text',name:'Match Headline',text:t.title||'MATCH DAY',x:80,y:480,w:880,h:390,font:fontName(t.font),size:Math.min(170,t.titleSize||130),weight:900,color:t.titleColor||'#ffffff',align:t.align||'left',opacity:1,rotation:0,visible:true,locked:false,stroke:'#000000',strokeWidth:3,shadow:20},
    {id:uid(),type:'text',name:'Match Details',text:t.detail||'FWCWL FINALS • LIVE AT 7:30 PM',x:80,y:1050,w:870,h:80,font:'Arial',size:36,weight:800,color:t.detailColor||'#d2d8dd',align:t.align||'left',opacity:1,rotation:0,visible:true,locked:false},
    {id:uid(),type:'text',name:'Watermark',text:t.cta||'MK97 CREATIVE STUDIO',x:80,y:1230,w:860,h:70,font:'Arial',size:28,weight:900,color:t.footerColor||t.palette[2],align:t.align||'left',opacity:1,rotation:0,visible:true,locked:false}
  ];
  state.selected=state.layers[3].id;
  syncAll();
}

function selected(){return state.layers.find(x=>x.id===state.selected)||null}
function getImage(src){if(imageCache.has(src))return imageCache.get(src);const im=new Image();im.onload=render;im.src=src;imageCache.set(src,im);return im}

function drawText(l){
  ctx.save();ctx.globalAlpha=l.opacity??1;ctx.translate(l.x+l.w/2,l.y+l.h/2);ctx.rotate((l.rotation||0)*Math.PI/180);ctx.translate(-(l.x+l.w/2),-(l.y+l.h/2));
  ctx.font=`${l.weight||700} ${l.size||60}px ${l.font||'Arial'}`;ctx.textAlign=l.align||'left';ctx.textBaseline='top';ctx.fillStyle=l.color||'#fff';
  const ax=l.align==='center'?l.x+l.w/2:l.align==='right'?l.x+l.w:l.x, lines=String(l.text||'').split('\n');let y=l.y;
  for(const line of lines){
    if(l.shadow){ctx.shadowColor='rgba(0,0,0,.75)';ctx.shadowBlur=l.shadow;ctx.shadowOffsetY=Math.round(l.shadow*.4)}
    if(l.strokeWidth){ctx.lineWidth=l.strokeWidth;ctx.strokeStyle=l.stroke||'#000';ctx.strokeText(line,ax,y)}
    ctx.fillText(line,ax,y);y+=(l.size||60)*1.02;
  }
  ctx.restore();
}

function drawLayer(l){
  if(l.visible===false)return;
  if(l.type==='shape'){ctx.save();ctx.globalAlpha=l.opacity??1;ctx.translate(l.x+l.w/2,l.y+l.h/2);ctx.rotate((l.rotation||0)*Math.PI/180);ctx.fillStyle=l.color||'#fff';ctx.fillRect(-l.w/2,-l.h/2,l.w,l.h);ctx.restore()}
  if(l.type==='text')drawText(l);
  if(l.type==='image'){
    const im=getImage(l.src);if(!im.complete)return;
    ctx.save();ctx.globalAlpha=l.opacity??1;ctx.translate(l.x+l.w/2,l.y+l.h/2);ctx.rotate((l.rotation||0)*Math.PI/180);
    ctx.filter=`brightness(${l.brightness||100}%) contrast(${l.contrast||100}%) saturate(${l.saturation||100}%) blur(${l.blur||0}px) hue-rotate(${l.hue||0}deg) sepia(${l.sepia||0}%)`;
    const r=Math.max(l.w/im.naturalWidth,l.h/im.naturalHeight),dw=im.naturalWidth*r,dh=im.naturalHeight*r;
    ctx.beginPath();ctx.rect(-l.w/2,-l.h/2,l.w,l.h);ctx.clip();ctx.drawImage(im,-dw/2,-dh/2,dw,dh);ctx.restore();
  }
}

function drawSelection(l){
  if(!l||l.visible===false)return;
  ctx.save();
  ctx.strokeStyle='#38bdf8';
  ctx.lineWidth=3;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(l.x,l.y,l.w,l.h);
  ctx.setLineDash([]);

  // Handles: 4 corners + 4 edge middles (Matching Image 5)
  const pts=[
    [l.x,l.y],[l.x+l.w/2,l.y],[l.x+l.w,l.y],
    [l.x,l.y+l.h/2],[l.x+l.w,l.y+l.h/2],
    [l.x,l.y+l.h],[l.x+l.w/2,l.y+l.h],[l.x+l.w,l.y+l.h]
  ];
  for(const [x,y] of pts){
    ctx.fillStyle='#38bdf8';
    ctx.fillRect(x-5,y-5,10,10);
    ctx.strokeStyle='#040507';
    ctx.lineWidth=2;
    ctx.strokeRect(x-5,y-5,10,10);
  }
  ctx.restore();
}

function render(){
  canvas.width=state.w;canvas.height=state.h;ctx.clearRect(0,0,state.w,state.h);ctx.fillStyle=state.bg;ctx.fillRect(0,0,state.w,state.h);
  
  if(state.grid){
    ctx.save();ctx.strokeStyle='rgba(255,255,255,.06)';ctx.lineWidth=1;
    for(let x=0;x<state.w;x+=90){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,state.h);ctx.stroke()}
    for(let y=0;y<state.h;y+=90){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(state.w,y);ctx.stroke()}
    ctx.restore();
  }

  if(state.guides){
    ctx.save();ctx.strokeStyle='rgba(56, 189, 248, 0.25)';ctx.lineWidth=1;ctx.setLineDash([4, 4]);
    // Rule of thirds guides
    ctx.beginPath();ctx.moveTo(state.w/3, 0);ctx.lineTo(state.w/3, state.h);ctx.stroke();
    ctx.beginPath();ctx.moveTo(state.w*2/3, 0);ctx.lineTo(state.w*2/3, state.h);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0, state.h/3);ctx.lineTo(state.w, state.h/3);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0, state.h*2/3);ctx.lineTo(state.w, state.h*2/3);ctx.stroke();
    ctx.restore();
  }

  for(const l of state.layers)drawLayer(l);
  drawSelection(selected());
  fitCss();
  $('#quickSelected').classList.toggle('show',!!selected());
}

function fitCss(){
  const maxW=Math.max(220,stage.clientWidth-30),maxH=Math.max(260,stage.clientHeight-30),fit=Math.min(maxW/state.w,maxH/state.h),s=fit*state.zoom;
  canvas.style.width=`${state.w*s}px`;canvas.style.height=`${state.h*s}px`;frame.style.width=`${state.w*s}px`;frame.style.height=`${state.h*s}px`;
}

function hit(x,y){
  for(let i=state.layers.length-1;i>=0;i--){
    const l=state.layers[i];
    if(l.visible!==false&&x>=l.x&&x<=l.x+l.w&&y>=l.y&&y<=l.y+l.h)return l;
  }
  return null;
}

function pt(e){
  const r=canvas.getBoundingClientRect();
  return{x:(e.clientX-r.left)*state.w/r.width,y:(e.clientY-r.top)*state.h/r.height};
}

canvas.addEventListener('pointerdown',e=>{
  const p=pt(e),l=hit(p.x,p.y);
  if(l){
    state.selected=l.id;renderLayers();renderInspector();render();
    if(!l.locked){push();drag={id:l.id,sx:p.x,sy:p.y,x:l.x,y:l.y}}
  }else{
    state.selected=null;renderLayers();renderInspector();render();
  }
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove',e=>{
  if(!drag)return;
  const p=pt(e),l=selected();if(!l)return;
  l.x=Math.round(drag.x+p.x-drag.sx);
  l.y=Math.round(drag.y+p.y-drag.sy);
  render();
});
canvas.addEventListener('pointerup',()=>drag=null);

function renderTemplates(){
  const q=($('#editorTemplateSearch').value||'').toLowerCase(),list=T.filter(t=>`${t.name} ${t.title} ${t.category}`.toLowerCase().includes(q));
  $('#editorTemplateCount').textContent=`${list.length} templates`;
  $('#editorTemplateGrid').innerHTML=list.map(t=>`<button class="template-mini" data-id="${t.id}"><div class="art" style="--a:${t.palette[0]};--b:${t.palette[1]}"><div class="copy">${t.title.replaceAll('\n','<br>')}</div></div><strong>${t.name}</strong></button>`).join('');
}
$('#editorTemplateSearch').oninput=renderTemplates;
$('#editorTemplateGrid').onclick=e=>{
  const b=e.target.closest('[data-id]');if(!b)return;push();
  const t=T.find(x=>x.id===b.dataset.id);
  if(t){defaultTemplate(t);store.set('mk97.selectedTemplate',t.id);bump('templatesUsed');closeSheets()}
};

// Render Both Floating Layer List (Image 5) and Sheet Layer List
function renderLayers(){
  const list=[...state.layers].reverse();
  const html=list.map(l=>{
    const isAct=l.id===state.selected;
    const thumb=l.type==='image'?`<img src="${l.src}">`:(l.type==='text'?'T':'❖');
    return `
      <div class="floating-layer-row ${isAct?'active':''}" data-id="${l.id}">
        <span class="fl-eye" data-act="vis">${l.visible===false?'○':'◉'}</span>
        <div class="fl-thumb">${thumb}</div>
        <div class="fl-name">${l.name||l.type}</div>
        <span class="fl-more">⋮</span>
      </div>
    `;
  }).join('');
  
  const fList=$('#floatingLayerList');
  if(fList)fList.innerHTML=html;

  const sList=$('#layerList');
  if(sList)sList.innerHTML=list.map(l=>`<div class="layer-row ${l.id===state.selected?'active':''}" data-id="${l.id}"><span class="type">${l.type==='text'?'T':l.type==='image'?'▧':'◆'}</span><div><b>${l.name||l.type}</b><small>${l.visible===false?'Hidden':l.locked?'Locked':'Editable'}</small></div><div><button data-act="vis">${l.visible===false?'○':'◉'}</button><button data-act="lock">${l.locked?'🔒':'🔓'}</button></div></div>`).join('');
}

function handleLayerClick(e){
  const row=e.target.closest('[data-id]');if(!row)return;
  const l=state.layers.find(x=>x.id===row.dataset.id),act=e.target.dataset.act;
  if(act==='vis'){
    push();l.visible=l.visible===false?true:false;renderLayers();render();return;
  }
  if(act==='lock'){
    push();l.locked=!l.locked;renderLayers();return;
  }
  state.selected=l.id;renderLayers();renderInspector();render();
}

const fListEl=$('#floatingLayerList');if(fListEl)fListEl.onclick=handleLayerClick;
const sListEl=$('#layerList');if(sListEl)sListEl.onclick=handleLayerClick;

function ctrl(label,val,key,type='range',min=0,max=100,step=1){
  return `<label class="control"><span>${label}</span><input data-key="${key}" type="${type}" value="${val}" ${type==='range'?`min="${min}" max="${max}" step="${step}"`:''}></label>`
}

function renderInspector(){
  const l=selected(),box=$('#inspector');$('#inspectorTitle').textContent=l?(l.name||l.type):'Canvas Settings';
  if(!l){
    box.innerHTML=`
      <section class="inspector-section">
        <h4>Canvas Color & Ratio</h4>
        ${ctrl('Background',state.bg,'bg','color')}
        <div class="row3" style="margin-top:10px">
          <button class="small-btn" data-canvas="portrait">4:5</button>
          <button class="small-btn" data-canvas="story">9:16</button>
          <button class="small-btn" data-canvas="square">1:1</button>
        </div>
      </section>
    `;
    return;
  }
  let html=`<section class="inspector-section"><h4>Transform</h4><div class="row2">${ctrl('X',l.x,'x','number')}${ctrl('Y',l.y,'y','number')}</div><div class="row2">${ctrl('Width',l.w,'w','number')}${ctrl('Height',l.h,'h','number')}</div>${ctrl('Rotation',l.rotation||0,'rotation','range',-180,180,1)}${ctrl('Opacity',Math.round((l.opacity??1)*100),'opacity','range',0,100,1)}</section>`;
  if(l.type==='text')html+=`<section class="inspector-section"><h4>Text</h4><label class="control"><span>Content</span><textarea data-key="text">${l.text||''}</textarea></label><div class="row2">${ctrl('Size',l.size,'size','number')}${ctrl('Color',l.color,'color','color')}</div><div class="row2"><label class="control"><span>Font</span><select data-key="font"><option>Arial</option><option>Impact</option><option>Georgia</option><option>Trebuchet MS</option></select></label><label class="control"><span>Align</span><select data-key="align"><option>left</option><option>center</option><option>right</option></select></label></div>${ctrl('Shadow',l.shadow||0,'shadow','range',0,40,1)}<div class="row2">${ctrl('Stroke',l.stroke||'#000000','stroke','color')}${ctrl('Stroke width',l.strokeWidth||0,'strokeWidth','number')}</div></section>`;
  if(l.type==='shape')html+=`<section class="inspector-section"><h4>Shape</h4>${ctrl('Color',l.color,'color','color')}</section>`;
  if(l.type==='image')html+=`<section class="inspector-section"><h4>Color & Light Adjustments</h4>${ctrl('Brightness',l.brightness||100,'brightness','range',0,200,1)}${ctrl('Contrast',l.contrast||100,'contrast','range',0,200,1)}${ctrl('Saturation',l.saturation||100,'saturation','range',0,200,1)}${ctrl('Hue',l.hue||0,'hue','range',-180,180,1)}${ctrl('Blur',l.blur||0,'blur','range',0,20,.5)}${ctrl('Sepia',l.sepia||0,'sepia','range',0,100,1)}</section>`;
  box.innerHTML=html;
  $$('[data-key]',box).forEach(el=>{
    if(el.tagName==='SELECT'&&l[el.dataset.key]!=null)el.value=l[el.dataset.key];
    el.addEventListener(el.type==='range'||el.type==='color'?'input':'change',()=>{
      const k=el.dataset.key;push();let v=el.value;
      if(['x','y','w','h','rotation','size','shadow','strokeWidth','brightness','contrast','saturation','hue','blur','sepia'].includes(k))v=Number(v);
      if(k==='opacity')v=Number(v)/100;
      l[k]=v;render();renderLayers();
    });
  });
}

function addText(){
  push();
  const l={id:uid(),type:'text',name:'New Title',text:'CRICKET CREATOR',x:120,y:400,w:840,h:180,font:'Impact',size:110,weight:900,color:'#fcd34d',align:'center',opacity:1,rotation:0,visible:true,locked:false,stroke:'#000',strokeWidth:3,shadow:18};
  state.layers.push(l);state.selected=l.id;syncAll();toast('Text layer added');
}

function addShape(){
  push();
  const l={id:uid(),type:'shape',name:'Gold Banner',x:180,y:480,w:500,h:260,color:'#f59e0b',opacity:.88,rotation:0,visible:true,locked:false};
  state.layers.push(l);state.selected=l.id;syncAll();toast('Shape element added');
}

function addImage(src,name='Photo'){
  push();
  const l={id:uid(),type:'image',name,src,x:140,y:280,w:800,h:800,opacity:1,rotation:0,visible:true,locked:false,brightness:100,contrast:100,saturation:100,hue:0,blur:0,sepia:0};
  state.layers.push(l);state.selected=l.id;syncAll();toast('Photo added');
}

$('#uploadImageBtn').onclick=()=>$('#imageInput').click();
$('#imageInput').onchange=e=>{
  const f=e.target.files?.[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{addImage(r.result,f.name);closeSheets()};
  r.readAsDataURL(f);
};

// Left Rail Hookups (Image 5)
$$('.rail-btn').forEach(b=>{
  b.addEventListener('click',()=>{
    $$('.rail-btn').forEach(btn=>btn.classList.remove('active'));
    b.classList.add('active');
    const r=b.dataset.rail;
    if(r==='templates')openAssetTab('templates');
    else if(r==='text')addText();
    else if(r==='elements')addShape();
    else if(r==='photos')$('#uploadImageBtn').click();
    else if(r==='background'){state.selected=null;renderInspector();openEdit()}
    else if(r==='draw'){toast('Drawing mode active');}
  });
});

$('#railAddText').onclick=addText;
$('#railAddShape').onclick=addShape;
$('#mediaAddText').onclick=()=>{addText();closeSheets()};
$('#floatingAddLayerBtn').onclick=()=>{addText();};

// Toggle Floating Layer Panel
const toggleLpBtn=$('#toggleLayerPanelBtn');
const flPanel=$('#floatingLayerPanel');
const closeLpBtn=$('#closeLayerPanel');

if(toggleLpBtn&&flPanel){
  toggleLpBtn.onclick=()=>{
    flPanel.classList.toggle('collapsed');
    toggleLpBtn.classList.toggle('active',!flPanel.classList.contains('collapsed'));
  };
}
if(closeLpBtn&&flPanel){
  closeLpBtn.onclick=()=>{
    flPanel.classList.add('collapsed');
    if(toggleLpBtn)toggleLpBtn.classList.remove('active');
  };
}

// Action Bar Buttons
$('#undoBtn').onclick=undo;
$('#redoBtn').onclick=redo;
$('#gridBtn').onclick=()=>{
  state.grid=!state.grid;
  $('#gridBtn').classList.toggle('active',state.grid);
  render();
};
$('#guidesBtn').onclick=()=>{
  state.guides=!state.guides;
  $('#guidesBtn').classList.toggle('active',state.guides);
  render();
};
$('#saveBtn').onclick=()=>{
  store.set('mk97.savedPosterState',state);
  bump('projects');
  toast('Project saved to MK97 Cloud Local');
};
$('#previewBtn').onclick=()=>{
  state.selected=null;render();toast('Preview mode active');
};

// Bottom Tools Row
$('#toolAdjust').onclick=()=>{
  if(!selected()){state.selected=state.layers[state.layers.length-1]?.id||null}
  openEdit();
};
$('#toolFilters').onclick=()=>{openEdit()};
$('#toolEffects').onclick=()=>{
  $('#effectsSubTray').classList.toggle('hidden');
};
$('#toolAiEnhance').onclick=()=>{
  const l=selected();
  if(!l){toast('Select a layer to enhance');return}
  push();
  l.contrast=(l.contrast||100)*1.15;
  l.brightness=(l.brightness||100)*1.05;
  l.saturation=(l.saturation||100)*1.1;
  render();
  toast('AI Smart Enhance applied');
};
$('#toolRemoveBg').onclick=()=>{
  const l=selected();
  if(!l||l.type!=='image'){toast('Select an image layer first');return}
  const im=getImage(l.src);if(!im.complete){toast('Image loading...');return}
  push();
  const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;
  const x=c.getContext('2d',{willReadFrequently:true});
  x.drawImage(im,0,0);
  const d=x.getImageData(0,0,c.width,c.height),p=d.data;
  const rr=p[0],gg=p[1],bb=p[2];
  for(let i=0;i<p.length;i+=4){
    const dist=Math.hypot(p[i]-rr,p[i+1]-gg,p[i+2]-bb);
    if(dist<35)p[i+3]=0;else if(dist<65)p[i+3]=Math.round(p[i+3]*(dist-35)/30);
  }
  x.putImageData(d,0,0);
  l.src=c.toDataURL('image/png');
  imageCache.clear();
  render();renderLayers();
  toast('AI Background removed');
};

// Preset Cards Filter Grading (Image 5)
$$('.preset-card').forEach(card=>{
  card.addEventListener('click',()=>{
    $$('.preset-card').forEach(c=>c.classList.remove('active'));
    card.classList.add('active');
    const p=card.dataset.preset;
    applyPresetFilter(p);
  });
});

function applyPresetFilter(p){
  push();
  const l=selected();
  const target=l&&l.type==='image'?l:null;
  if(p==='none'){
    if(target){target.brightness=100;target.contrast=100;target.saturation=100;target.sepia=0;}
  }else if(p==='cinematic'){
    if(target){target.brightness=105;target.contrast=130;target.saturation=115;target.sepia=10;}
  }else if(p==='stadium-glow'){
    if(target){target.brightness=125;target.contrast=120;target.saturation=130;target.sepia=15;}
  }else if(p==='golden-hour'){
    if(target){target.brightness=110;target.contrast=120;target.saturation=145;target.sepia=45;}
  }else if(p==='epic-hdr'){
    if(target){target.brightness=115;target.contrast=145;target.saturation=140;target.sepia=0;}
  }else if(p==='film-look'){
    if(target){target.brightness=100;target.contrast=95;target.saturation=90;target.sepia=25;}
  }else if(p==='drama'){
    if(target){target.brightness=90;target.contrast=155;target.saturation=125;target.sepia=5;}
  }
  render();
  toast(`Applied ${p} filter`);
}

function del(){
  const i=state.layers.findIndex(x=>x.id===state.selected);
  if(i<0)return;push();state.layers.splice(i,1);state.selected=null;syncAll();
}

function dup(){
  const l=selected();if(!l)return;push();
  const n=clone(l);n.id=uid();n.name=(n.name||n.type)+' copy';
  n.x+=28;n.y+=28;state.layers.push(n);state.selected=n.id;syncAll();
}

$('#deleteBtn').onclick=del;
$('#duplicateBtn').onclick=dup;
$('#quickDelete').onclick=del;
$('#quickDuplicate').onclick=dup;
$('#quickEdit').onclick=()=>openEdit();

// Aspect Ratio Selector
$('#canvasSize').onchange=e=>{
  push();
  [state.w,state.h]=sizes[e.target.value]||[1080,1350];
  render();
  toast(`Canvas: ${state.w} × ${state.h}`);
};

function exportPoster(){
  const keep=state.selected;state.selected=null;render();
  const a=document.createElement('a');
  a.download='MK97-Cricket-Poster.png';
  a.href=canvas.toDataURL('image/png',1);
  a.click();
  state.selected=keep;render();
  bump('exports');
  toast('Poster exported in Ultra HD PNG');
}
$('#exportBtn').onclick=exportPoster;

function syncAll(){render();renderLayers();renderInspector()}
function closeSheets(){$$('.bottom-sheet').forEach(s=>s.classList.remove('open'));$('#sheetBackdrop').classList.remove('open')}
function openSheet(id){closeSheets();$(id).classList.add('open');$('#sheetBackdrop').classList.add('open')}
function openAssetTab(name){
  openSheet('#assetSheet');
  $$('.sheet-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));
  $$('[data-panel]').forEach(p=>p.classList.toggle('hidden',p.dataset.panel!==name));
}
function openEdit(){renderInspector();openSheet('#editSheet')}

$('#sheetBackdrop').onclick=closeSheets;
$$('[data-close]').forEach(b=>b.onclick=closeSheets);
$$('.sheet-tab').forEach(b=>b.onclick=()=>openAssetTab(b.dataset.tab));

window.addEventListener('resize',render);
window.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo()}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'){e.preventDefault();dup()}
  if(e.key==='Delete'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))del()
});

renderTemplates();

// Initial load
const chosen=T.find(x=>x.id===store.get('mk97.selectedTemplate','match-day'))||T[0];
defaultTemplate(chosen);

// Check if loaded from AI Match Poster Generator
if(new URLSearchParams(location.search).get('aiGenerate')){
  const gen=store.get('mk97.customMatchPoster');
  if(gen){
    state.layers.forEach(l=>{
      if(l.name==='Category Tag')l.text=gen.hl||'MATCH DAY';
      if(l.name==='Match Headline')l.text=`${gen.t1}\nVS\n${gen.t2}`;
      if(l.name==='Match Details')l.text=gen.v||'MELBOURNE CRICKET GROUND';
    });
    syncAll();
  }
}

// Check if pending photo loaded from AI Cutout
const pending=store.get('mk97.pendingImage');
if(pending){setTimeout(()=>addImage(pending,'AI Cutout'),80);store.set('mk97.pendingImage',null)}

})();
