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
function fontName(f){return f || 'Montserrat'}

function defaultTemplate(t){
  state.templateId=t.id;
  state.bg=t.palette?.[0]||'#0a0e13';
  const aspect=t.aspect||'portrait';
  const dim=sizes[aspect]||sizes.portrait;
  state.w=dim[0];
  state.h=dim[1];
  const sizeSelect=$('#canvasSize');
  if(sizeSelect) sizeSelect.value=aspect;

  if(Array.isArray(t.customLayers) && t.customLayers.length){
    state.layers=t.customLayers.map(l=>Object.assign({}, l, {id:uid()}));
    state.selected=state.layers[state.layers.length-1]?.id||null;
  } else {
    state.layers=[
      {id:uid(),type:'shape',name:'Accent Glow',x:Math.round(state.w*0.6),y:80,w:Math.round(state.w*0.4),h:state.h,color:t.palette?.[1]||'#1e293b',opacity:.86,rotation:-12,visible:true,locked:false},
      {id:uid(),type:'image',name:'FWCWL Feature',src:t.logo||'fwcwl-logo.jpeg',x:Math.round(state.w*0.15),y:Math.round(state.h*0.2),w:Math.round(state.w*0.7),h:Math.round(state.h*0.45),opacity:1,rotation:0,visible:true,locked:false,brightness:105,contrast:125,saturation:115,hue:0,blur:0,sepia:0},
      {id:uid(),type:'text',name:'Category Tag',text:t.kicker||'FWCWL • MATCH DAY',x:80,y:80,w:state.w-160,h:60,font:fontName(t.font),size:36,weight:900,color:t.kickerColor||t.palette?.[2]||'#f59e0b',align:t.align||'left',opacity:1,rotation:0,visible:true,locked:false},
      {id:uid(),type:'text',name:'Match Headline',text:t.title||'MATCH DAY',x:80,y:Math.round(state.h*0.35),w:state.w-160,h:320,font:fontName(t.font),size:Math.min(160,t.titleSize||120),weight:900,color:t.titleColor||'#ffffff',align:t.align||'left',opacity:1,rotation:0,visible:true,locked:false,stroke:'#000000',strokeWidth:3,shadow:20},
      {id:uid(),type:'text',name:'Match Details',text:t.detail||'FWCWL FINALS • LIVE AT 7:30 PM',x:80,y:state.h-240,w:state.w-160,h:80,font:'Arial',size:32,weight:800,color:t.detailColor||'#d2d8dd',align:t.align||'left',opacity:1,rotation:0,visible:true,locked:false},
      {id:uid(),type:'text',name:'Watermark',text:t.cta||'FWCWL • MK97 STUDIO',x:80,y:state.h-120,w:state.w-160,h:60,font:'Arial',size:26,weight:900,color:t.footerColor||t.palette?.[2]||'#f59e0b',align:t.align||'left',opacity:1,rotation:0,visible:true,locked:false}
    ];
    state.selected=state.layers[3].id;
  }
  syncAll();
}

function selected(){return state.layers.find(x=>x.id===state.selected)||null}
function getImage(src){if(imageCache.has(src))return imageCache.get(src);const im=new Image();im.onload=render;im.src=src;imageCache.set(src,im);return im}

function drawText(l){
  ctx.save();
  ctx.globalAlpha=l.opacity??1;
  if(l.blendMode) ctx.globalCompositeOperation=l.blendMode;
  ctx.translate(l.x+l.w/2,l.y+l.h/2);
  ctx.rotate((l.rotation||0)*Math.PI/180);
  ctx.translate(-(l.x+l.w/2),-(l.y+l.h/2));
  const fontFam = l.font ? `"${l.font}", Impact, "Arial Black", sans-serif` : '"Montserrat", Impact, sans-serif';
  ctx.font=`${l.weight||900} ${l.size||60}px ${fontFam}`;
  ctx.textAlign=l.align||'left';ctx.textBaseline='top';ctx.fillStyle=l.color||'#fff';
  const ax=l.align==='center'?l.x+l.w/2:l.align==='right'?l.x+l.w:l.x, lines=String(l.text||'').split('\n');let y=l.y;
  const lineH=(l.size||60)*(l.lineHeight||1.12);
  for(const line of lines){
    if(l.shadow){ctx.shadowColor='rgba(0,0,0,.85)';ctx.shadowBlur=l.shadow;ctx.shadowOffsetY=Math.round(l.shadow*.4)}
    if(l.strokeWidth){ctx.lineWidth=l.strokeWidth;ctx.strokeStyle=l.stroke||'#000';ctx.strokeText(line,ax,y)}
    ctx.fillText(line,ax,y);y+=lineH;
  }
  ctx.restore();
}

function drawLayer(l){
  if(l.visible===false)return;
  if(l.type==='shape'){
    ctx.save();
    ctx.globalAlpha=l.opacity??1;
    if(l.blendMode) ctx.globalCompositeOperation=l.blendMode;
    ctx.translate(l.x+l.w/2,l.y+l.h/2);
    ctx.rotate((l.rotation||0)*Math.PI/180);
    ctx.fillStyle=l.color||'#fff';
    ctx.beginPath();
    if(l.borderRadius && ctx.roundRect){
      ctx.roundRect(-l.w/2,-l.h/2,l.w,l.h,l.borderRadius);
    } else {
      ctx.rect(-l.w/2,-l.h/2,l.w,l.h);
    }
    ctx.fill();
    if(l.strokeColor && l.strokeWidth){
      ctx.lineWidth=l.strokeWidth;
      ctx.strokeStyle=l.strokeColor;
      ctx.stroke();
    }
    ctx.restore();
  }
  if(l.type==='text')drawText(l);
  if(l.type==='image'){
    const im=getImage(l.src);if(!im.complete)return;
    ctx.save();
    ctx.globalAlpha=l.opacity??1;
    if(l.blendMode) ctx.globalCompositeOperation=l.blendMode;
    ctx.translate(l.x+l.w/2,l.y+l.h/2);
    ctx.rotate((l.rotation||0)*Math.PI/180);
    ctx.filter=`brightness(${l.brightness||100}%) contrast(${l.contrast||100}%) saturate(${l.saturation||100}%) blur(${l.blur||0}px) hue-rotate(${l.hue||0}deg) sepia(${l.sepia||0}%)`;
    const r=Math.max(l.w/im.naturalWidth,l.h/im.naturalHeight),dw=im.naturalWidth*r,dh=im.naturalHeight*r;
    ctx.beginPath();
    if(l.borderRadius && ctx.roundRect){
      ctx.roundRect(-l.w/2,-l.h/2,l.w,l.h,l.borderRadius);
    } else {
      ctx.rect(-l.w/2,-l.h/2,l.w,l.h);
    }
    ctx.clip();
    ctx.drawImage(im,-dw/2,-dh/2,dw,dh);
    if(l.borderColor && l.borderWidth){
      ctx.lineWidth=l.borderWidth;
      ctx.strokeStyle=l.borderColor;
      ctx.stroke();
    }
    ctx.restore();
  }
  if(l.type==='draw' && l.points && l.points.length){
    ctx.save();
    ctx.globalAlpha = l.opacity ?? 1;
    if(l.blendMode) ctx.globalCompositeOperation = l.blendMode;
    ctx.strokeStyle = l.color || '#f59e0b';
    ctx.lineWidth = l.size || 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(l.points[0].x, l.points[0].y);
    for(let i=1; i<l.points.length; i++){
      ctx.lineTo(l.points[i].x, l.points[i].y);
    }
    ctx.stroke();
    ctx.restore();
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
  const qs = $('#quickSelected');
  if(qs){
    const tray = $('#effectsSubTray');
    const isTrayOpen = tray && !tray.classList.contains('hidden');
    qs.style.bottom = isTrayOpen ? '195px' : '72px';
    qs.classList.toggle('show', !!selected());
  }
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

function hitHandle(l, px, py) {
  if (!l || l.locked) return false;
  const hx = l.x + l.w, hy = l.y + l.h;
  return Math.hypot(px - hx, py - hy) <= 24;
}

let drawMode = false;
let currentStroke = null;

canvas.addEventListener('pointerdown',e=>{
  const p=pt(e);
  if(drawMode){
    push();
    currentStroke = {
      id: uid(),
      type: 'draw',
      name: 'Brush Stroke',
      points: [{x: p.x, y: p.y}],
      color: '#f59e0b',
      size: 8,
      visible: true,
      locked: false
    };
    state.layers.push(currentStroke);
    state.selected = currentStroke.id;
    render();
    canvas.setPointerCapture(e.pointerId);
    return;
  }
  const cur=selected();
  if(cur && hitHandle(cur, p.x, p.y)){
    push();
    drag={id:cur.id,mode:'resize',sx:p.x,sy:p.y,w:cur.w,h:cur.h};
    canvas.setPointerCapture(e.pointerId);
    return;
  }
  const l=hit(p.x,p.y);
  if(l){
    state.selected=l.id;renderLayers();renderInspector();render();
    if(!l.locked){
      push();
      drag={id:l.id,mode:'move',sx:p.x,sy:p.y,x:l.x,y:l.y,origPoints:(l.type==='draw'&&l.points?clone(l.points):null)};
    }
  }else{
    state.selected=null;renderLayers();renderInspector();render();
  }
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove',e=>{
  const p=pt(e);
  if(drawMode && currentStroke){
    currentStroke.points.push({x: p.x, y: p.y});
    render();
    return;
  }
  if(!drag)return;
  const l=selected();if(!l)return;
  if(drag.mode==='resize'){
    l.w=Math.max(40, Math.round(drag.w+(p.x-drag.sx)));
    l.h=Math.max(20, Math.round(drag.h+(p.y-drag.sy)));
  }else{
    const dx = Math.round(p.x-drag.sx);
    const dy = Math.round(p.y-drag.sy);
    if(l.type==='draw' && l.points && drag.origPoints){
      l.points = drag.origPoints.map(pt => ({ x: pt.x + dx, y: pt.y + dy }));
    }
    l.x=Math.round(drag.x+dx);
    l.y=Math.round(drag.y+dy);
  }
  render();
});

canvas.addEventListener('pointerup',()=>{
  if(drawMode && currentStroke){
    if(currentStroke.points.length > 1){
      let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
      for(const pt of currentStroke.points){
        if(pt.x < minX) minX = pt.x;
        if(pt.y < minY) minY = pt.y;
        if(pt.x > maxX) maxX = pt.x;
        if(pt.y > maxY) maxY = pt.y;
      }
      currentStroke.x = minX;
      currentStroke.y = minY;
      currentStroke.w = Math.max(30, maxX - minX);
      currentStroke.h = Math.max(30, maxY - minY);
    }
    currentStroke = null;
    syncAll();
  }
  drag=null;
});

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
    const thumb=l.type==='image'?`<img src="${l.src}">`:(l.type==='text'?'T':(l.type==='draw'?'✎':'❖'));
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
  if(sList)sList.innerHTML=list.map(l=>`<div class="layer-row ${l.id===state.selected?'active':''}" data-id="${l.id}"><span class="type">${l.type==='text'?'T':l.type==='image'?'▧':(l.type==='draw'?'✎':'◆')}</span><div><b>${l.name||l.type}</b><small>${l.visible===false?'Hidden':l.locked?'Locked':'Editable'}</small></div><div><button data-act="vis">${l.visible===false?'○':'◉'}</button><button data-act="lock">${l.locked?'🔒':'🔓'}</button></div></div>`).join('');
}

function handleLayerClick(e){
  const row=e.target.closest('[data-id]');if(!row)return;
  const l=state.layers.find(x=>x.id===row.dataset.id);if(!l)return;
  const act=e.target.dataset.act;
  if(act==='vis'){
    push();l.visible=l.visible===false?true:false;renderLayers();render();return;
  }
  if(act==='lock'){
    push();l.locked=!l.locked;renderLayers();return;
  }
  if(e.target.closest('.fl-more')){
    state.selected=l.id;
    openEdit();
    return;
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
  if(l.type==='text')html+=`<section class="inspector-section"><h4>Text</h4><label class="control"><span>Content</span><textarea data-key="text">${l.text||''}</textarea></label><div class="row2">${ctrl('Size',l.size,'size','number')}${ctrl('Color',l.color,'color','color')}</div><div class="row2"><label class="control"><span>Font</span><select data-key="font"><option>Montserrat</option><option>Anton</option><option>Bebas Neue</option><option>Teko</option><option>Cinzel</option><option>Inter</option><option>Impact</option><option>Arial</option><option>Georgia</option></select></label><label class="control"><span>Align</span><select data-key="align"><option>left</option><option>center</option><option>right</option></select></label></div>${ctrl('Shadow',l.shadow||0,'shadow','range',0,40,1)}<div class="row2">${ctrl('Stroke',l.stroke||'#000000','stroke','color')}${ctrl('Stroke width',l.strokeWidth||0,'strokeWidth','number')}</div></section>`;
  if(l.type==='shape')html+=`<section class="inspector-section"><h4>Shape</h4>${ctrl('Color',l.color,'color','color')}</section>`;
  if(l.type==='draw')html+=`<section class="inspector-section"><h4>Brush Stroke</h4>${ctrl('Color',l.color||'#f59e0b','color','color')}${ctrl('Stroke Width',l.size||8,'size','range',1,50,1)}</section>`;
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

let isReplacing = false;
if($('#uploadImageBtn')) $('#uploadImageBtn').onclick=()=>{ isReplacing = false; $('#imageInput').click(); };
if($('#railAddPhoto')) $('#railAddPhoto').onclick=()=>{ isReplacing = false; $('#imageInput').click(); };

$('#imageInput').onchange=e=>{
  const f=e.target.files?.[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
    const cur = selected();
    if(isReplacing && cur && cur.type==='image'){
      push();
      cur.src = r.result;
      cur.name = f.name;
      imageCache.clear();
      syncAll();
      toast('Image replaced');
    } else {
      addImage(r.result, f.name);
      closeSheets();
    }
    isReplacing = false;
    e.target.value = '';
  };
  r.readAsDataURL(f);
};

// Left Rail Hookups (Image 5)
$$('.rail-btn').forEach(b=>{
  b.addEventListener('click',()=>{
    $$('.rail-btn').forEach(btn=>btn.classList.remove('active'));
    b.classList.add('active');
    const r=b.dataset.rail;
    if(r==='select'){
      drawMode = false;
      toast('Select mode active');
    }
    else if(r==='templates'){ drawMode = false; openAssetTab('templates'); }
    else if(r==='text'){ drawMode = false; addText(); }
    else if(r==='elements'){ drawMode = false; addShape(); }
    else if(r==='photos'){ drawMode = false; isReplacing = false; $('#imageInput').click(); }
    else if(r==='background'){ drawMode = false; state.selected=null; renderInspector(); openEdit(); }
    else if(r==='draw'){
      drawMode = !drawMode;
      b.classList.toggle('active', drawMode);
      toast(drawMode ? '✎ Freehand Brush active — draw on canvas' : 'Brush deactivated');
    }
    else if(r==='more'){ drawMode = false; openAssetTab('templates'); }
  });
});

if($('#mediaAddText')) $('#mediaAddText').onclick=()=>{addText();closeSheets()};
if($('#floatingAddLayerBtn')) $('#floatingAddLayerBtn').onclick=()=>{addText();};

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
$('#toolFilters').onclick=()=>{
  const tray=$('#effectsSubTray');
  if(tray) tray.classList.remove('hidden');
  switchCategory('color');
};
$('#toolEffects').onclick=()=>{
  const tray=$('#effectsSubTray');
  if(tray){
    tray.classList.toggle('hidden');
    if(!tray.classList.contains('hidden')) switchCategory('effects');
    render();
  }
};
$('#toolAiEnhance').onclick=()=>{
  let l=selected();
  if(!l) l=state.layers.find(x=>x.type==='image') || state.layers.find(x=>x.type==='text');
  if(!l){toast('Select a layer to enhance');return}
  push();
  if(l.type==='image'){
    l.contrast=Math.min(200, Math.round((l.contrast||100)*1.18));
    l.brightness=Math.min(200, Math.round((l.brightness||100)*1.06));
    l.saturation=Math.min(200, Math.round((l.saturation||100)*1.15));
  } else if(l.type==='text'){
    l.shadow=Math.min(40, (l.shadow||0)+10);
    l.strokeWidth=Math.max(1, (l.strokeWidth||0)+1);
  }
  render();
  toast('AI Smart Enhance applied');
};
$('#toolRemoveBg').onclick=()=>{
  let l=selected();
  if(!l||l.type!=='image') l=state.layers.find(x=>x.type==='image');
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

if($('#toolReplace')){
  $('#toolReplace').onclick=()=>{
    const l=selected();
    if(l && l.type==='text'){
      openEdit();
      toast('Edit text properties');
      return;
    }
    isReplacing = !!(l && l.type==='image');
    $('#imageInput').click();
  };
}
if($('#toolMask')){
  $('#toolMask').onclick=()=>{
    let l=selected();
    if(!l) l=state.layers.find(x=>x.type==='image');
    if(!l){toast('Select a layer to mask');return;}
    push();
    l.borderRadius = (l.borderRadius ? 0 : 40);
    render();
    toast(l.borderRadius ? 'Rounded mask applied' : 'Mask reset');
  };
}
if($('#toolBlend')){
  $('#toolBlend').onclick=()=>{
    let l=selected();
    if(!l) l=state.layers[state.layers.length-1];
    if(!l){toast('Select a layer to blend');return;}
    push();
    const modes=['source-over','screen','multiply','overlay','lighter'];
    const curIdx=modes.indexOf(l.blendMode||'source-over');
    l.blendMode=modes[(curIdx+1)%modes.length];
    render();
    toast(`Blend mode: ${l.blendMode}`);
  };
}

// 6 Category Presets System (Image 5)
const categoryPresets = {
  effects: [
    { id: 'none', name: 'None', icon: '⊘' },
    { id: 'cinematic', name: 'Cinematic', filter: 'contrast(125%) brightness(105%) saturate(115%)' },
    { id: 'stadium-glow', name: 'Stadium Glow', filter: 'contrast(110%) brightness(130%) sepia(20%)' },
    { id: 'golden-hour', name: 'Golden Hour', filter: 'contrast(115%) sepia(45%) saturate(140%)' },
    { id: 'epic-hdr', name: 'Epic HDR', filter: 'contrast(140%) brightness(110%) saturate(135%)' },
    { id: 'film-look', name: 'Film Look', filter: 'contrast(95%) sepia(25%) saturate(85%)' },
    { id: 'drama', name: 'Drama', filter: 'contrast(150%) brightness(90%) saturate(120%)' }
  ],
  color: [
    { id: 'vibrant', name: 'Vibrant', filter: 'saturate(180%) contrast(110%)' },
    { id: 'vintage', name: 'Vintage', filter: 'sepia(70%) contrast(90%)' },
    { id: 'mono', name: 'Monochrome', filter: 'grayscale(100%) contrast(130%)' },
    { id: 'cool-blue', name: 'Cool Cyan', filter: 'hue-rotate(180deg) saturate(130%)' },
    { id: 'fire-red', name: 'Fire Red', filter: 'hue-rotate(-40deg) saturate(160%)' },
    { id: 'cyber-neon', name: 'Cyber Neon', filter: 'saturate(200%) contrast(140%)' }
  ],
  light: [
    { id: 'bright', name: 'High Key', filter: 'brightness(135%) contrast(105%)' },
    { id: 'spotlight', name: 'Spotlight', filter: 'brightness(120%) contrast(135%)' },
    { id: 'moody', name: 'Low Key', filter: 'brightness(75%) contrast(140%)' },
    { id: 'soft-light', name: 'Soft Wash', filter: 'brightness(110%) contrast(85%)' },
    { id: 'backlight', name: 'Backlit', filter: 'brightness(95%) contrast(160%)' }
  ],
  shadow: [
    { id: 'deep-black', name: 'Deep Black', filter: 'contrast(160%) brightness(85%)' },
    { id: 'fade-shadow', name: 'Fade Shadow', filter: 'contrast(80%) brightness(115%)' },
    { id: 'rich-depth', name: 'Rich Depth', filter: 'contrast(130%)' },
    { id: 'matte-crush', name: 'Matte Crush', filter: 'sepia(15%) contrast(125%)' }
  ],
  glow: [
    { id: 'golden-aura', name: 'Gold Aura', filter: 'sepia(50%) brightness(125%) saturate(160%)' },
    { id: 'neon-cyan', name: 'Neon Cyan', filter: 'hue-rotate(170deg) brightness(120%)' },
    { id: 'stadium-beam', name: 'Stadium Beam', filter: 'brightness(145%) contrast(120%)' },
    { id: 'amber-fire', name: 'Amber Fire', filter: 'sepia(60%) hue-rotate(-20deg) brightness(115%)' }
  ],
  blur: [
    { id: 'crisp', name: 'Crisp (0px)', filter: 'none' },
    { id: 'soft-lens', name: 'Soft Lens', filter: 'blur(1px)' },
    { id: 'depth-focus', name: 'Depth Blur', filter: 'blur(3px)' },
    { id: 'heavy-blur', name: 'Heavy Blur', filter: 'blur(6px)' }
  ]
};

let currentTrayCategory = 'effects';
let activePresetId = 'cinematic';

function switchCategory(cat){
  currentTrayCategory = cat;
  $$('.tray-cat-tab').forEach(t=>t.classList.toggle('active', t.dataset.cat===cat));
  renderTrayPresets(cat);
}

function renderTrayPresets(cat = 'effects'){
  currentTrayCategory = cat;
  const scroll = $('#trayPresetsScroll');
  if(!scroll) return;
  const list = categoryPresets[cat] || categoryPresets.effects;
  scroll.innerHTML = list.map(item => `
    <div class="preset-card ${item.id === activePresetId ? 'active' : ''}" data-preset="${item.id}" data-cat="${cat}">
      <div class="preset-thumb">
        ${item.icon ? `<span style="font-size:22px;color:#64748b">${item.icon}</span>` : `<img src="fwcwl-logo.jpeg" alt="${item.name}" style="filter:${item.filter || 'none'}">`}
      </div>
      <span>${item.name}</span>
    </div>
  `).join('');

  $$('.preset-card', scroll).forEach(card => {
    card.onclick = () => {
      $$('.preset-card', scroll).forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      activePresetId = card.dataset.preset;
      applyUniversalPreset(activePresetId, cat);
    };
  });
}

function applyUniversalPreset(p, cat = 'effects'){
  push();
  let l = selected();
  if(!l){
    l = state.layers.find(x => x.type === 'image');
  }

  if(l && l.type === 'image'){
    if(p === 'none' || p === 'crisp'){
      l.brightness = 100; l.contrast = 100; l.saturation = 100; l.sepia = 0; l.hue = 0; l.blur = 0;
    } else if(p === 'cinematic'){
      l.brightness = 105; l.contrast = 130; l.saturation = 115; l.sepia = 10;
    } else if(p === 'stadium-glow'){
      l.brightness = 125; l.contrast = 120; l.saturation = 130; l.sepia = 15;
    } else if(p === 'golden-hour'){
      l.brightness = 110; l.contrast = 120; l.saturation = 145; l.sepia = 45;
    } else if(p === 'epic-hdr'){
      l.brightness = 115; l.contrast = 145; l.saturation = 140; l.sepia = 0;
    } else if(p === 'film-look'){
      l.brightness = 100; l.contrast = 95; l.saturation = 90; l.sepia = 25;
    } else if(p === 'drama'){
      l.brightness = 90; l.contrast = 155; l.saturation = 125; l.sepia = 5;
    } else if(p === 'vibrant'){
      l.saturation = 180; l.contrast = 115;
    } else if(p === 'vintage'){
      l.sepia = 70; l.contrast = 90; l.brightness = 105;
    } else if(p === 'mono'){
      l.saturation = 0; l.contrast = 135;
    } else if(p === 'cool-blue'){
      l.hue = 180; l.saturation = 120;
    } else if(p === 'fire-red'){
      l.hue = -40; l.saturation = 150;
    } else if(p === 'cyber-neon'){
      l.saturation = 190; l.contrast = 140;
    } else if(p === 'bright'){
      l.brightness = 135; l.contrast = 105;
    } else if(p === 'spotlight'){
      l.brightness = 120; l.contrast = 135;
    } else if(p === 'moody'){
      l.brightness = 75; l.contrast = 140;
    } else if(p === 'soft-light'){
      l.brightness = 110; l.contrast = 85;
    } else if(p === 'backlight'){
      l.brightness = 95; l.contrast = 160;
    } else if(p === 'deep-black'){
      l.contrast = 160; l.brightness = 85;
    } else if(p === 'fade-shadow'){
      l.contrast = 80; l.brightness = 115;
    } else if(p === 'rich-depth'){
      l.contrast = 130;
    } else if(p === 'matte-crush'){
      l.sepia = 15; l.contrast = 125;
    } else if(p === 'golden-aura'){
      l.sepia = 40; l.brightness = 125; l.saturation = 150;
    } else if(p === 'neon-cyan'){
      l.hue = 170; l.brightness = 118;
    } else if(p === 'stadium-beam'){
      l.brightness = 145; l.contrast = 120;
    } else if(p === 'amber-fire'){
      l.sepia = 50; l.hue = -20; l.brightness = 115;
    } else if(p === 'soft-lens'){
      l.blur = 1;
    } else if(p === 'depth-focus'){
      l.blur = 3;
    } else if(p === 'heavy-blur'){
      l.blur = 6;
    }
  } else if(l && l.type === 'text'){
    if(cat === 'glow' || cat === 'shadow'){
      l.shadow = p === 'none' ? 0 : 25;
      l.stroke = (p === 'neon-cyan' ? '#38bdf8' : (p === 'golden-aura' ? '#f59e0b' : '#000000'));
      l.strokeWidth = Math.max(2, l.strokeWidth || 3);
    } else if(cat === 'color'){
      if(p === 'vibrant' || p === 'golden-hour') l.color = '#fcd34d';
      else if(p === 'cool-blue') l.color = '#38bdf8';
      else if(p === 'fire-red') l.color = '#ef4444';
      else if(p === 'mono') l.color = '#ffffff';
      else if(p === 'cyber-neon') l.color = '#f43f5e';
    }
  } else if(l && l.type === 'shape'){
    if(cat === 'color' || cat === 'effects'){
      if(p === 'cool-blue') l.color = '#0284c7';
      else if(p === 'fire-red') l.color = '#dc2626';
      else if(p === 'mono') l.color = '#1e293b';
      else if(p === 'cyber-neon') l.color = '#8b5cf6';
      else if(p === 'golden-hour' || p === 'golden-aura') l.color = '#f59e0b';
    }
  } else {
    // Background tinting
    if(p === 'cool-blue') state.bg = '#051329';
    else if(p === 'fire-red') state.bg = '#1a0505';
    else if(p === 'cyber-neon') state.bg = '#130524';
    else if(p === 'golden-hour') state.bg = '#191104';
    else if(p === 'mono') state.bg = '#111827';
    else if(p === 'none') state.bg = '#040711';
  }

  render();
  renderInspector();
  toast(`Applied ${p} (${cat})`);
}

$$('.tray-cat-tab').forEach(tab=>{
  tab.onclick=()=>switchCategory(tab.dataset.cat);
});
renderTrayPresets('effects');

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
if($('#moreMenuBtn')) $('#moreMenuBtn').onclick=()=>openAssetTab('templates');

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
if(document.fonts) document.fonts.ready.then(render);
window.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo()}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'){e.preventDefault();dup()}
  if(e.key==='Delete'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))del()
});

renderTemplates();

// Initial load
const urlId=new URLSearchParams(location.search).get('id');
const chosen=T.find(x=>x.id===(urlId||store.get('mk97.selectedTemplate','fwcwl-matchday-broadcast')))||T.find(x=>x.id==='fwcwl-matchday-broadcast')||T[0];
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
