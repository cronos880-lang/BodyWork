'use strict';
// Reusable creations contain relative layer geometry, never project photographs.
window.RCSticker=(()=>{
const fields=['type','variant','x','y','size','sx','sy','angle','color','accent','text','logoTintEnabled','tintEnabled','rasterCrop','cutRect','eraseRects','parts','visible','locked','layerName','metricScale','metricLock'];
const clone=v=>JSON.parse(JSON.stringify(v));
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const text=v=>String(v||'').trim().slice(0,64);
const types=new Set(['logo','text','kit','stripe','tribal','vector']);
function rectangle(r,min=0,limit=1.00001){return r&&['x','y','w','h'].every(k=>finite(r[k]))&&r.x>=0&&r.y>=0&&r.w>min&&r.h>min&&r.x+r.w<=limit&&r.y+r.h<=limit;}
function validate(bundle,known){
 if(!bundle||bundle.app!=='RC_Bodywork_Sticker'||![1,2,3].includes(bundle.format))throw Error('No es una pegatina .rcsticker compatible.');
 if(!['top','side'].includes(bundle.view))throw Error('La pegatina no indica una vista compatible.');
 const ref=bundle.reference;if(!ref||!['width','height'].every(k=>Number.isInteger(ref[k])&&ref[k]>0&&ref[k]<=20000))throw Error('Referencia de tamaño de la pegatina no válida.');
 if(bundle.format===3&&(!RCCalibration.validReference(ref.calibration)||ref.calibration.view!==bundle.view||ref.calibration.w!==ref.width||ref.calibration.h!==ref.height))throw Error('Esta pegatina necesita una referencia de calibración válida.');
 if(bundle.format!==3&&ref.calibration)throw Error('La pegatina necesita el formato de plantillas de V1.12.0.');
 if(!Array.isArray(bundle.items)||bundle.items.length<1||bundle.items.length>100)throw Error('La pegatina debe contener entre 1 y 100 capas.');
 const items=bundle.items.map(s=>{
  if(!s||!types.has(s.type)||typeof s.variant!=='string'||!known(s.type,s.variant))throw Error('La pegatina utiliza un diseño que no está disponible en este programa.');
  if(!finite(s.x)||!finite(s.y)||Math.abs(s.x)>1||Math.abs(s.y)>1)throw Error('Posiciones relativas de la pegatina no válidas.');
  for(const [key,lo,hi] of [['size',5,115],['sx',40,180],['sy',40,180],['angle',-36000,36000]])if(!finite(s[key])||s[key]<lo||s[key]>hi)throw Error('Medida o rotación no válida: '+key+'.');
  for(const key of ['color','accent'])if(!/^#[0-9a-f]{6}$/i.test(s[key]||''))throw Error('Color de pegatina no válido.');
  for(const key of ['logoTintEnabled','tintEnabled','rasterCrop','visible','locked','metricLock'])if(s[key]!=null&&typeof s[key]!=='boolean')throw Error('Estado de capa no válido: '+key+'.');
  if(s.metricScale!=null&&(!s.metricScale||typeof s.metricScale!=='object'||!['x','y'].every(k=>finite(s.metricScale[k])&&s.metricScale[k]>=.00001&&s.metricScale[k]<=1000)))throw Error('Escala de milímetros no válida.');
  if(s.metricScale!=null&&![2,3].includes(bundle.format))throw Error('Esta pegatina necesita el formato de medidas de V1.11.0.');
  if(s.parts!=null&&(typeof s.parts!=='object'||Array.isArray(s.parts)))throw Error('Ajustes de piezas no válidos.');
  if(s.cutRect!=null&&!rectangle(s.cutRect,.0099,1.001))throw Error('Recorte de pegatina no válido.');
  if(s.eraseRects!=null&&(!Array.isArray(s.eraseRects)||s.eraseRects.length>200||!s.eraseRects.every(r=>rectangle(r))))throw Error('Borrados de pegatina no válidos.');
  const item={};for(const key of fields)if(Object.prototype.hasOwnProperty.call(s,key))item[key]=clone(s[key]);
  if(item.layerName!=null)item.layerName=text(item.layerName);
  if(item.text!=null)item.text=String(item.text).slice(0,24);
  return item;
 });
 if(Math.max(...items.map(s=>s.x))-Math.min(...items.map(s=>s.x))>1||Math.max(...items.map(s=>s.y))-Math.min(...items.map(s=>s.y))>1)throw Error('La composición no cabe en su referencia de colocación.');
 return {app:'RC_Bodywork_Sticker',format:bundle.format,createdWith:'1.12.0',name:text(bundle.name)||'Mi pegatina',view:bundle.view,reference:{width:ref.width,height:ref.height,...(bundle.format===3?{calibration:RCCalibration.reference(ref.calibration)}:{})},items};
}
function make(layers,ids,view,reference,name,known){
 const wanted=new Set(ids),items=layers.filter(s=>wanted.has(s.id));if(!items.length)throw Error('Selecciona las capas o el grupo que quieres guardar.');
 const anchor={x:(Math.min(...items.map(s=>s.x))+Math.max(...items.map(s=>s.x)))/2,y:(Math.min(...items.map(s=>s.y))+Math.max(...items.map(s=>s.y)))/2};
 const relative=items.map(s=>{const item={};for(const key of fields)if(Object.prototype.hasOwnProperty.call(s,key))item[key]=clone(s[key]);item.x-=anchor.x;item.y-=anchor.y;return item;});
 return validate({app:'RC_Bodywork_Sticker',format:reference.calibration?3:relative.some(s=>s.metricScale)?2:1,name,view,reference,items:relative},known);
}
function parse(source,known){if(typeof source!=='string'||source.length>5*1024*1024)throw Error('La pegatina supera el límite de 5 MB.');let data;try{data=JSON.parse(source);}catch(e){throw Error('El archivo de pegatina no contiene JSON válido.');}return validate(data,known);}
function place(bundle,reference,center,newId,newGroupId){
 if(bundle.format===3&&!RCCalibration.sameReference(bundle.reference.calibration,reference.calibration))throw Error('La pegatina pertenece a otra plantilla o escala. Carga su .rctemplate para conservar las medidas.');
 if(reference.width!==bundle.reference.width||reference.height!==bundle.reference.height)throw Error('La pegatina se creó en una foto de '+bundle.reference.width+' × '+bundle.reference.height+' px. Usa una plantilla de las mismas dimensiones para conservar su tamaño.');
 const minX=Math.min(...bundle.items.map(s=>s.x)),maxX=Math.max(...bundle.items.map(s=>s.x)),minY=Math.min(...bundle.items.map(s=>s.y)),maxY=Math.max(...bundle.items.map(s=>s.y));
 const cx=Math.max(-minX,Math.min(1-maxX,center.x)),cy=Math.max(-minY,Math.min(1-maxY,center.y));
 const group=bundle.items.length>1?newGroupId():null;
 return bundle.items.map(s=>{const item=clone(s);item.id=newId();item.x+=cx;item.y+=cy;if(group){item.groupId=group;item.groupName=bundle.name;}return item;});
}
return Object.freeze({make,parse,place});
})();
