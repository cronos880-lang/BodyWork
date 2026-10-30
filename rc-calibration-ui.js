/* Non-destructive calibration drafts, local template files and a print check. */
(function(root){
'use strict';
function create(bridge){
 const $=id=>document.getElementById(id),dialog=$('calibration-dialog'),canvas=$('calibration-canvas'),ctx=canvas.getContext('2d');
 const edgeNames=['x0','x1','y0','y1'];let view='side',photo=null,image=null,rect=null,transform=null,gesture=null,ticket=0,busy=false,ready=false;
 const label=v=>v==='top'?'Superior':'Lateral';
 function status(message,error=false){$('calibration-status').textContent=message;$('calibration-status').dataset.error=String(error);}
 function controls(){for(const e of dialog.querySelectorAll('button,input,select'))e.disabled=busy;$('calibration-apply').disabled=busy||!ready;$('calibration-save').disabled=busy||!['top','side'].some(v=>bridge.image(v));}
 function summary(){
  const parts=['top','side'].map(v=>{const d=bridge.image(v),c=RCDim.calibration(v,d);return !d?label(v)+': sin foto':!c?label(v)+': falta calibrar':label(v)+': '+RCDim.format(c.width)+' × '+RCDim.format(c.height)+' mm'+(c.kind==='manual'?(c.verified?' · comprobada':' · probar en papel'):' · Lola VIP');});
  $('calibration-summary').textContent=parts.join(' / ');
  const manual=['top','side'].some(v=>RCDim.calibration(v,bridge.image(v))?.kind==='manual');$('pdf-calibration-note').hidden=!manual;
 }
 function paint(){
  ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#101923';ctx.fillRect(0,0,canvas.width,canvas.height);transform=null;
  if(!photo||!image)return;
  const f=Math.min((canvas.width-60)/photo.w,(canvas.height-60)/photo.h),ox=(canvas.width-photo.w*f)/2,oy=(canvas.height-photo.h*f)/2;transform={f,ox,oy};ctx.drawImage(image,ox,oy,photo.w*f,photo.h*f);
  if(!rect)return;const x=ox+rect.x0*f,y=oy+rect.y0*f,w=(rect.x1-rect.x0)*f,h=(rect.y1-rect.y0)*f;
  ctx.fillStyle='#359bf52b';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#65caff';ctx.lineWidth=2;ctx.setLineDash([7,4]);ctx.strokeRect(x,y,w,h);ctx.setLineDash([]);ctx.font='bold 17px Arial';ctx.fillStyle='#122335';ctx.fillRect(x,y-24,Math.max(100,Math.min(w,180)),24);ctx.fillStyle='#bfeaff';ctx.fillText('X · horizontal',x+5,y-6);ctx.fillStyle='#122335';ctx.fillRect(x+5,y+6,128,24);ctx.fillStyle='#bfeaff';ctx.fillText('Y · vertical',x+9,y+24);
  for(const [px,py] of [[x,y],[x+w,y],[x,y+h],[x+w,y+h]]){ctx.fillStyle='#fff';ctx.fillRect(px-4,py-4,8,8);ctx.strokeRect(px-4,py-4,8,8);}
 }
 function edges(){if(!rect)return;for(const k of edgeNames)$( 'calibration-'+k).value=String(Math.round(rect[k]*100)/100).replace('.',',');}
 async function load(){
  const n=++ticket;ready=false;photo=bridge.image(view);image=null;gesture=null;rect=null;$('calibration-checked').checked=false;
  $('calibration-empty').hidden=!!photo;$('calibration-editor').hidden=!photo;$('calibration-photo-label').textContent=photo?photo.name+' · '+photo.w+' × '+photo.h+' px':'Importa una foto de esta vista para empezar.';controls();paint();
  if(!photo){status('Puedes importar una foto o cargar una plantilla guardada.');return;}
  const c=RCDim.calibration(view,photo);rect=c?{x0:c.x0,x1:c.x1,y0:c.y0,y1:c.y1}:{x0:0,x1:photo.w,y0:0,y1:photo.h};
  $('calibration-name').value=c?.kind==='manual'?c.name:'Mi carrocería';$('calibration-width').value=c?RCDim.format(c.width):'';$('calibration-height').value=c?RCDim.format(c.height):'';$('calibration-checked').checked=c?.kind==='manual'&&c.verified===true;
  edges();status(c?'Calibración actual cargada. Los cambios solo se aplican con Aplicar calibración.':'Arrastra una referencia en la foto e indica sus dos medidas reales.');
  const img=new Image();img.src=photo.src;try{await img.decode();if(n!==ticket)return;image=img;ready=true;paint();controls();}catch(e){if(n===ticket)status('No se ha podido mostrar esta fotografía.',true);}
 }
 async function open(){if(bridge.loading()){bridge.toast('Espera a que termine la carga o exportación.');return;}if(!await bridge.finish())return;view=bridge.target();$('calibration-view').value=view;dialog.showModal();await load();}
 function point(e){const r=canvas.getBoundingClientRect(),t=transform;if(!t)return null;return {x:Math.max(0,Math.min(photo.w,((e.clientX-r.left)*canvas.width/r.width-t.ox)/t.f)),y:Math.max(0,Math.min(photo.h,((e.clientY-r.top)*canvas.height/r.height-t.oy)/t.f))};}
 canvas.onpointerdown=e=>{if(busy||!ready||e.button!==0)return;e.preventDefault();const p=point(e);gesture={p,prior:{...rect},pid:e.pointerId};canvas.setPointerCapture(e.pointerId);};
 canvas.onpointermove=e=>{if(!gesture)return;const p=point(e),a=gesture.p;rect={x0:Math.min(a.x,p.x),x1:Math.max(a.x,p.x),y0:Math.min(a.y,p.y),y1:Math.max(a.y,p.y)};edges();paint();};
 function finishGesture(cancel=false){if(!gesture)return;const g=gesture;gesture=null;if(canvas.hasPointerCapture(g.pid))canvas.releasePointerCapture(g.pid);if(cancel||rect.x1-rect.x0<10||rect.y1-rect.y0<10){rect=g.prior;if(!cancel)status('Marca una referencia de al menos 10 píxeles en cada eje.',true);}else{invalidateCheck();status('Referencia marcada. Introduce cuánto mide en realidad, horizontal y verticalmente.');}edges();paint();}
 canvas.onpointerup=()=>finishGesture();canvas.onpointercancel=()=>finishGesture(true);
 function invalidateCheck(){$('calibration-checked').checked=false;}
 for(const k of edgeNames)$('calibration-'+k).onchange=()=>{
  const next=Object.fromEntries(edgeNames.map(k=>[k,RCDim.number($('calibration-'+k).value)]));if(!photo||!Object.values(next).every(Number.isFinite)||next.x0<0||next.y0<0||next.x1>photo.w||next.y1>photo.h||next.x1-next.x0<10||next.y1-next.y0<10){status('Límites no válidos: deben quedar dentro de la foto y abarcar al menos 10 píxeles por eje.',true);invalidateCheck();return;}rect=next;invalidateCheck();paint();status('Límites ajustados. Comprueba las dos medidas reales.');
 };
 for(const k of ['width','height',...edgeNames])$('calibration-'+k).oninput=invalidateCheck;
 $('calibration-view').onchange=async()=>{view=$('calibration-view').value;await load();};
 $('calibration-import').onclick=()=>$('calibration-photo-file').click();
 $('calibration-photo-file').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;busy=true;controls();try{await bridge.import(view,file);await load();summary();}catch(e){status(e.message,true);}finally{busy=false;controls();}};
 $('calibration-full').onclick=()=>{if(!photo)return;rect={x0:0,y0:0,x1:photo.w,y1:photo.h};edges();invalidateCheck();paint();status('Referencia: foto completa. Usa las medidas reales que abarca toda la imagen, incluidos los márgenes.');};
 $('calibration-apply').onclick=async()=>{
  if(!ready||busy||gesture)return;busy=true;controls();try{
   if(bridge.image(view)!==photo)throw Error('La foto ha cambiado. Cierra el asistente y vuelve a abrirlo.');
   const inputRect=Object.fromEntries(edgeNames.map(k=>[k,RCDim.number($('calibration-'+k).value)]));
   const cal=RCCalibration.create(view,photo,inputRect,RCDim.number($('calibration-width').value),RCDim.number($('calibration-height').value),$('calibration-name').value,$('calibration-checked').checked);
   const x=(photo.w*cal.width/(cal.x1-cal.x0)),y=(photo.h*cal.height/(cal.y1-cal.y0));if(x*y*144>40000000||Math.max(x,y)*12>16000)throw Error('Esa escala requeriría una imagen de impresión demasiado grande. Comprueba las medidas y la referencia.');
   await bridge.apply(view,photo,cal);summary();status('Calibración aplicada a '+label(view)+'. '+(cal.verified?'Marcada por ti como comprobada.':'Imprime la hoja de prueba en papel y comprueba también una pegatina sobre la carrocería.'));
  }catch(e){status(e.message,true);}finally{busy=false;controls();}
 };
 $('calibration-test').onclick=async()=>{if(busy)return;busy=true;controls();try{await bridge.testSheet();status('Hoja de prueba solicitada. Imprime al 100 %, sin ajustar: mide ambas reglas y el rectángulo. Después prueba una pegatina sobre la carrocería.');}catch(e){status(e.message,true);}finally{busy=false;controls();}};
 $('calibration-save').onclick=async()=>{if(busy)return;busy=true;controls();try{const ok=await bridge.saveTemplate();if(ok)status('Plantilla guardada o descarga solicitada. Incluye las fotos y la calibración aplicada; no incluye tu diseño.');}catch(e){status(e.message,true);}finally{busy=false;controls();}};
 $('calibration-load').onclick=()=>$('template-file').click();
 $('template-file').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;busy=true;controls();try{const ok=await bridge.openTemplate(f);if(ok){view=bridge.target();$('calibration-view').value=view;await load();summary();status('Plantilla cargada. Empieza un diseño con sus fotos y escala. El diseño anterior queda en recuperación si está disponible.');}}catch(e){status(e.message,true);}finally{busy=false;controls();}};
 $('calibration-close').onclick=()=>{if(!busy){ticket++;dialog.close();}};dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();else ticket++;});dialog.addEventListener('close',()=>{finishGesture(true);ticket++;});
 $('calibration-open').onclick=()=>open().catch(e=>bridge.toast(e.message));summary();return Object.freeze({open,summary});
}
root.RCCalibrationUI=Object.freeze({create});
})(typeof window==='undefined'?globalThis:window);
