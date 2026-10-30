/* The panel measures the very same calibrated, complete artwork used by PDF.
 * Editor guides never enter the sticker renderer or the printing pipeline. */
(function(root){
'use strict';
function create(bridge){
 const $=id=>document.getElementById(id),fields=['width','height','x','y'],cache=new WeakMap(),warming=new Set(),invalid=new Set();
 let timer=null,ticket=0,busy=false,pending=Promise.resolve(),guides=false,magnet=false,lines={top:[],side:[]},lastSelection=null;
 const shapeKey=s=>{const {x,y,id,visible,locked,layerName,groupId,groupName,metricLock,...shape}=s;return JSON.stringify(shape);};
 const selection=()=>bridge.selection();
 function message(text,error=false){$('metric-status').textContent=text;$('metric-status').dataset.error=String(error);}
 function map(d){const c=RCDim.calibration(d.calibration?.view||(['top','side'].find(v=>bridge.image(v)===d)),d);let item=cache.get(d);if(!item||item.calibration!==c){item={calibration:c,values:new Map()};cache.set(d,item);}return item.values;}
 function probe(which,s,angle){
  const image=bridge.render(which,{...s,visible:true,angle}),w=image.width,h=image.height,data=image.getContext('2d').getImageData(0,0,w,h).data;
  let x0=w,y0=h,x1=-1,y1=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>=12){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  image.width=1;image.height=1;if(x1<0)throw Error('La capa no contiene dibujo medible a esta escala.');
  const l=(x0-w/2)/12,r=(x1+1-w/2)/12,t=(y0-h/2)/12,b=(y1+1-h/2)/12;
  return which==='top'?{left:t,right:b,top:-r,bottom:-l}:{left:l,right:r,top:t,bottom:b};
 }
 function absolute(c,d,s,value){
  const anchor=RCDim.photoToMM(c,s.x*d.w,s.y*d.h),box=RCDim.shifted(value.box,anchor.x,anchor.y);
  return {width:value.width,height:value.height,x:(box.left+box.right)/2,y:(box.top+box.bottom)/2,box};
 }
 function cached(which,s){const d=bridge.image(which),c=RCDim.calibration(which,d);if(!c)return null;const entry=map(d).get(shapeKey(s));return entry?absolute(c,d,s,entry):null;}
 async function measure(which,s){
  const d=bridge.image(which),c=RCDim.calibration(which,d);if(!c)throw Error('Esta fotografía necesita calibración. Abre Calibración y plantillas para indicar sus medidas reales.');
  const key=shapeKey(s),saved=map(d).get(key);if(saved)return absolute(c,d,s,saved);
  await bridge.ready(which,s);if(bridge.image(which)!==d||RCDim.calibration(which,d)!==c)throw Error('La fotografía ha cambiado. Vuelve a seleccionar la capa.');
  const base=probe(which,s,0),box=s.angle?probe(which,s,s.angle):base;
  const value={width:base.right-base.left,height:base.bottom-base.top,box};map(d).set(key,value);if(map(d).size>256)map(d).delete(map(d).keys().next().value);
  return absolute(c,d,s,value);
 }
 function disable(value){for(const e of document.querySelectorAll('#metric-panel input,#metric-panel button'))e.disabled=value;}
 async function refresh(force=false){
  const n=++ticket,ctx=selection();$('metric-panel').hidden=!ctx?.s;if(!ctx?.s)return;
  if(lastSelection!==ctx.s){lastSelection=ctx.s;invalid.clear();for(const name of fields)$('metric-'+name).removeAttribute('aria-invalid');}
  const {which,d,s}=ctx,c=RCDim.calibration(which,d);
  $('metric-lock').checked=s.metricLock!==false;$('metric-guides').checked=guides;$('metric-snap').checked=magnet;
  if(!c){disable(true);for(const name of fields)$('metric-'+name).value='';$('metric-note').textContent='Fotografía sin calibración.';message('Abre Calibración y plantillas para preparar esta foto. Los controles porcentuales siguen disponibles.',true);return;}
  $('metric-note').textContent=(which==='top'?'Superior':'Lateral')+' · X: '+RCDim.format(c.width)+' mm · Y: '+RCDim.format(c.height)+' mm. '+(c.kind==='manual'?(c.verified?'Comprobada por ti en papel.':'Calibración manual: comprueba primero en papel.'):'Referencia Lola VIP.');
  if(!cached(which,s))disable(true);
  try{
   const value=await measure(which,{...s});if(n!==ticket||selection()?.s!==s)return;
   for(const name of fields){const el=$('metric-'+name);if((force||document.activeElement!==el)&&!invalid.has(name))el.value=RCDim.format(value[name]);}
   disable(busy||!!s.locked);$('metric-guides').disabled=busy;$('metric-snap').disabled=busy;
   if(!busy&&!invalid.size)message(s.locked?'Capa bloqueada. Desbloquéala en su fila.':bridge.members(which,s).length>1?'Tamaño: capa activa. Posición y alineación: selección/grupo.':'Tamaño y centro del dibujo completo. Confirma con Intro o al salir del campo.');
   if(guides)warm(which);
  }catch(e){if(n===ticket){disable(true);message(e.message+(e.message.includes('memoria')?' Reduce Tamaño global (%) en los controles anteriores.':''),true);}}
 }
 function request(){if(timer)return;timer=setTimeout(()=>{timer=null;refresh().catch(()=>{});},70);}
 function checkCenter(s){if(!Number.isFinite(s.x)||!Number.isFinite(s.y)||s.x< -1e-9||s.x>1+1e-9||s.y< -1e-9||s.y>1+1e-9)throw Error('La posición deja el centro de la capa fuera de la fotografía.');s.x=Math.max(0,Math.min(1,s.x));s.y=Math.max(0,Math.min(1,s.y));}
 function translation(which,members,dx,dy){
  if(members.some(s=>s.locked))throw Error('La selección contiene una capa bloqueada.');
  const d=bridge.image(which),c=RCDim.calibration(which,d);
  return members.map(s=>{const next={...s,x:s.x+dx/(d.w*c.mmX),y:s.y+dy/(d.h*c.mmY)};checkCenter(next);return {s,next};});
 }
 function commit(changes,ctx,original){
  if(selection()?.s!==ctx.s||bridge.image(ctx.which)!==ctx.d||JSON.stringify(ctx.s)!==original)throw Error('La capa ha cambiado durante el cálculo. Repite la medida.');
  bridge.undo();for(const {s,next} of changes)Object.assign(s,next);bridge.changed();
 }
 function perform(task){
  if(busy)return pending;busy=true;invalid.delete('operation');disable(true);
  pending=(async()=>{try{await task();}catch(e){invalid.add('operation');message(e.message,true);throw e;}finally{busy=false;await refresh(true);}})();
  pending.catch(()=>{});return pending;
 }
 function apply(name){return perform(async()=>{
  const ctx=selection();if(!ctx?.s||ctx.s.locked)throw Error('Selecciona una capa desbloqueada.');const {s,which,d}=ctx;
  const value=RCDim.number($('metric-'+name).value);if(!Number.isFinite(value)||((name==='width'||name==='height')&&(value<.1||value>1000))){invalid.add(name);$('metric-'+name).setAttribute('aria-invalid','true');throw Error('Introduce un número válido; ancho y alto deben estar entre 0,1 y 1000 mm.');}
  invalid.delete(name);$('metric-'+name).removeAttribute('aria-invalid');const original=JSON.stringify(s),before=await measure(which,{...s});
  if(Math.abs(value-before[name])<((name==='x'||name==='y')?1e-8:.049)&&((name==='x'||name==='y')||s.metricScale))return;
  message('Calculando la medida sobre el dibujo imprimible…');
  if(name==='x'||name==='y'){
   const members=bridge.members(which,s),changes=translation(which,members,name==='x'?value-before.x:0,name==='y'?value-before.y:0);commit(changes,ctx,original);return;
  }
  let next=JSON.parse(original),best=null;if(!next.metricScale)next.metricScale={x:1,y:1};
  for(let iteration=0;iteration<8;iteration++){
   const actual=await measure(which,next),error=Math.abs(actual[name]-value);
   if(!best||error<best.error)best={next:JSON.parse(JSON.stringify(next)),error,actual};
   if(error<=.09)break;
   const ratio=value/actual[name],scale=next.metricScale||{x:1,y:1};
   next.metricScale={x:scale.x*(name==='width'||s.metricLock!==false?ratio:1),y:scale.y*(name==='height'||s.metricLock!==false?ratio:1)};
   if(!RCDim.validScale(next.metricScale))throw Error('Esta medida supera el rango de escala permitido.');
  }
  if(!best||best.error>.18)throw Error('No se alcanza esa medida con la resolución de impresión. Prueba un tamaño algo mayor.');
  next=best.next;const c=RCDim.calibration(which,d);
  next.x+=(before.x-best.actual.x)/(d.w*c.mmX);next.y+=(before.y-best.actual.y)/(d.h*c.mmY);checkCenter(next);
  commit([{s,next}],ctx,original);invalid.clear();message('Medida aplicada. La resolución del PDF es 0,083 mm por píxel.');
 });}
 function align(action){return perform(async()=>{
  const ctx=selection();if(!ctx?.s)throw Error('Selecciona una capa.');const original=JSON.stringify(ctx.s),c=RCDim.calibration(ctx.which,ctx.d);if(!c)throw Error('La fotografía necesita calibración.');
  const members=bridge.members(ctx.which,ctx.s);if(members.some(s=>s.locked))throw Error('La selección contiene una capa bloqueada.');
  const values=await Promise.all(members.filter(s=>s.visible!==false).map(s=>measure(ctx.which,{...s}))),box=RCDim.union(values.map(v=>v.box));if(!box)throw Error('La selección no contiene dibujo visible.');
  const dx=action==='left'?-box.left:action==='right'?c.width-box.right:action==='centerX'?c.width/2-(box.left+box.right)/2:0;
  const dy=action==='top'?-box.top:action==='bottom'?c.height-box.bottom:action==='centerY'?c.height/2-(box.top+box.bottom)/2:0;
  if(Math.abs(dx)<1e-8&&Math.abs(dy)<1e-8)return;commit(translation(ctx.which,members,dx,dy),ctx,original);
 });}
 async function warm(which){
  if(warming.has(which))return;warming.add(which);
  try{let count=0;for(const s of bridge.items(which)){if(!guides)break;if(s.visible===false||cached(which,s))continue;try{await measure(which,{...s});}catch(e){}if(++count%2===0)await new Promise(resolve=>setTimeout(resolve,0));}}
  finally{warming.delete(which);}
 }
 function snapDrag(which,members){
  lines[which]=[];if(!magnet)return;const d=bridge.image(which),c=RCDim.calibration(which,d);if(!c)return;
  const visible=members.filter(s=>s.visible!==false),values=visible.map(s=>cached(which,s));if(!values.length||values.some(v=>!v))return;
  const box=RCDim.union(values.map(v=>v.box)),ids=new Set(members.map(s=>s.id));
  const targets=[{reference:true,label:'Referencia',box:{left:0,right:c.width,top:0,bottom:c.height}}];
  for(const s of bridge.items(which)){if(s.visible===false||ids.has(s.id))continue;const value=cached(which,s);if(value)targets.push({label:'Capa',box:value.box});}
  const scale=bridge.screenScale(which),tolerance={x:Math.min(3,6/scale*c.mmX),y:Math.min(3,6/scale*c.mmY)};
  const limits={x:[-Math.min(...members.map(s=>s.x))*d.w*c.mmX,(1-Math.max(...members.map(s=>s.x)))*d.w*c.mmX],y:[-Math.min(...members.map(s=>s.y))*d.h*c.mmY,(1-Math.max(...members.map(s=>s.y)))*d.h*c.mmY]};
  const result=RCDim.snap(box,targets,tolerance,limits);for(const s of members){s.x+=result.x/(d.w*c.mmX);s.y+=result.y/(d.h*c.mmY);}lines[which]=result.guides;
 }
 function draw(ctx,which,d,dragging){
  if(!guides||bridge.mode()!=='stickers')return;const c=RCDim.calibration(which,d);if(!c)return;
  const scale=bridge.screenScale(which);ctx.save();ctx.strokeStyle='rgba(102,203,255,.6)';ctx.lineWidth=1/scale;ctx.setLineDash([6/scale,4/scale]);
  ctx.strokeRect(c.x0,c.y0,c.x1-c.x0,c.y1-c.y0);ctx.beginPath();ctx.moveTo((c.x0+c.x1)/2,c.y0);ctx.lineTo((c.x0+c.x1)/2,c.y1);ctx.moveTo(c.x0,(c.y0+c.y1)/2);ctx.lineTo(c.x1,(c.y0+c.y1)/2);ctx.stroke();
  if(dragging){ctx.setLineDash([]);ctx.strokeStyle='#ff91e4';ctx.fillStyle='#ffb0eb';ctx.font=`${11/scale}px Arial`;
   for(const line of lines[which]){const p=RCDim.mmToPhoto(c,line.axis==='x'?line.value:0,line.axis==='y'?line.value:0);ctx.beginPath();if(line.axis==='x'){ctx.moveTo(p.x,c.y0);ctx.lineTo(p.x,c.y1);ctx.stroke();ctx.fillText(RCDim.format(line.value)+' mm',p.x+4/scale,c.y0+14/scale);}else{ctx.moveTo(c.x0,p.y);ctx.lineTo(c.x1,p.y);ctx.stroke();ctx.fillText(RCDim.format(line.value)+' mm',c.x0+4/scale,p.y-4/scale);}}
  }
  ctx.restore();
 }
 for(const name of fields){const input=$('metric-'+name);input.addEventListener('change',()=>{apply(name).catch(()=>{});});input.addEventListener('keydown',e=>{
  if(e.key==='Enter'){e.preventDefault();e.stopPropagation();apply(name).then(()=>input.blur()).catch(()=>{});}
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();invalid.delete(name);invalid.delete('operation');input.removeAttribute('aria-invalid');const ctx=selection(),v=ctx&&cached(ctx.which,ctx.s);if(v)input.value=RCDim.format(v[name]);input.blur();refresh(true);}
 });}
 $('metric-lock').onchange=()=>{const ctx=selection();if(!ctx?.s||ctx.s.locked)return;bridge.undo();ctx.s.metricLock=$('metric-lock').checked;bridge.changed();};
 for(const b of document.querySelectorAll('[data-align]'))b.onclick=()=>align(b.dataset.align).catch(()=>{});
 $('metric-guides').onchange=()=>{guides=$('metric-guides').checked;if(!guides)magnet=false;bridge.preferencesChanged();bridge.redraw();request();};
 $('metric-snap').onchange=()=>{magnet=$('metric-snap').checked;if(magnet)guides=true;bridge.preferencesChanged();bridge.redraw();request();};
 request();
 return Object.freeze({measure,cached,apply,align,snapDrag,draw,request,refresh,clear:()=>{lines={top:[],side:[]};},get busy(){return busy;},get pending(){return pending;},prefs:()=>({guides,snap:magnet}),restorePrefs:p=>{guides=p?.guides===true;magnet=guides&&p?.snap===true;request();bridge.redraw();}});
}
root.RCMetricEditor=Object.freeze({create});
})(typeof window==='undefined'?globalThis:window);
