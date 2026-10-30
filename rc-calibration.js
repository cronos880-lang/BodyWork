/* Photo-bound, independent X/Y calibration. No artwork or network required. */
(function(root){
'use strict';
const fingerprints=new WeakMap();
const clone=v=>JSON.parse(JSON.stringify(v));
function sourceKey(d){
 if(!d||typeof d.src!=='string')throw Error('Falta la fotografía de referencia.');
 const old=fingerprints.get(d);if(old?.src===d.src)return old.key;
 let a=2166136261,b=5381;for(let i=0;i<d.src.length;i++){const n=d.src.charCodeAt(i);a=Math.imul(a^n,16777619);b=Math.imul(b,33)^n;}
 const key=d.src.length+':'+(a>>>0).toString(16)+':'+(b>>>0).toString(16);fingerprints.set(d,{src:d.src,key});return key;
}
function validReference(r){return r&&typeof r==='object'&&['top','side'].includes(r.view)&&/^\d+:[a-f0-9]{1,8}:[a-f0-9]{1,8}$/.test(r.signature||'')&&['w','h'].every(k=>Number.isInteger(r[k])&&r[k]>=2&&r[k]<=1400)&&['x0','x1','y0','y1','width','height'].every(k=>typeof r[k]==='number'&&Number.isFinite(r[k]))&&r.x0>=0&&r.y0>=0&&r.x1<=r.w&&r.y1<=r.h&&r.x1-r.x0>=10&&r.y1-r.y0>=10&&r.width>=10&&r.width<=1200&&r.height>=10&&r.height<=1200;}
function validate(view,value,d=null){
 if(!value||value.format!==1||!validReference(value)||value.view!==view||typeof value.name!=='string'||!value.name.trim()||value.name.length>64||typeof value.verified!=='boolean')throw Error('Calibración no válida. Marca una referencia de al menos 10 píxeles y medidas de 10 a 1200 mm.');
 if(d&&(value.w!==d.w||value.h!==d.h||value.signature!==sourceKey(d)))throw Error('La calibración pertenece a otra fotografía. Vuelve a calibrar esta vista.');
 const out={format:1,name:value.name.trim(),verified:value.verified};for(const k of ['view','signature','w','h','x0','x1','y0','y1','width','height'])out[k]=value[k];return out;
}
function create(view,d,rect,width,height,name,verified=false){return validate(view,{format:1,view,w:d.w,h:d.h,signature:sourceKey(d),...rect,width,height,name:String(name||'Mi carrocería').trim().slice(0,64),verified:!!verified},d);}
function reference(value){const r={};for(const k of ['view','signature','w','h','x0','x1','y0','y1','width','height'])r[k]=value[k];if(!validReference(r))throw Error('Referencia de plantilla no válida.');return r;}
function sameReference(a,b){return validReference(a)&&validReference(b)&&JSON.stringify(reference(a))===JSON.stringify(reference(b));}
function makeTemplate(name,photos){
 const images={};for(const view of ['top','side']){
  const d=photos[view];if(!d){images[view]=null;continue;}
  const calibration=d.calibration?validate(view,d.calibration,d):null;
  images[view]={src:d.src,name:d.name||'Fotografía',...(calibration?{calibration}:{} )};
 }
 if(!Object.values(images).some(Boolean))throw Error('Importa y calibra una fotografía antes de guardar la plantilla.');
 return {app:'RC_Bodywork_Template',format:1,createdWith:'1.12.0',name:String(name||'Mi carrocería').trim().slice(0,64),images};
}
function parseTemplate(text){
 if(typeof text!=='string'||text.length>90e6)throw Error('La plantilla supera 90 MB.');let p;try{p=JSON.parse(text);}catch(e){throw Error('La plantilla no contiene JSON válido.');}
 if(p?.app!=='RC_Bodywork_Template'||p.format!==1||typeof p.name!=='string'||!p.name.trim()||!p.images||!['top','side'].some(v=>p.images[v]))throw Error('No es una plantilla .rctemplate compatible.');
 const images={};for(const view of ['top','side']){const d=p.images[view];if(!d){images[view]=null;continue;}if(typeof d.src!=='string'||!/^data:image\/(png|jpeg|webp);base64,/.test(d.src))throw Error('Fotografía de plantilla no válida.');images[view]={src:d.src,name:String(d.name||'Fotografía').slice(0,128),...(d.calibration?{calibration:validate(view,d.calibration)}:{})};}
 return {app:'RC_Bodywork_Template',format:1,createdWith:'1.12.0',name:p.name.trim().slice(0,64),images};
}
root.RCCalibration=Object.freeze({sourceKey,validReference,validate,create,reference,sameReference,makeTemplate,parseTemplate});
})(typeof window==='undefined'?globalThis:window);
