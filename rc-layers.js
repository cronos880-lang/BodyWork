'use strict';
window.RCLayers=(()=>{
const clone=v=>JSON.parse(JSON.stringify(v));
const text=v=>String(v||'').trim().slice(0,64);
function operate(input,ids,action,options={}){
 const selected=new Set(ids),layers=clone(input),items=layers.filter(s=>selected.has(s.id));
 if(!items.length)throw Error('Selecciona al menos una capa.');
 if(['delete','duplicate','up','down','front','back'].includes(action)&&items.some(s=>s.locked))throw Error('Desbloquea las capas seleccionadas antes de modificarlas.');
 switch(action){
 case 'visible':for(const s of items)s.visible=Boolean(options.value);break;
 case 'locked':for(const s of items)s.locked=Boolean(options.value);break;
 case 'rename':for(const s of items)s.layerName=text(options.name)||'Capa';break;
 case 'group':{
  if(items.length<2)throw Error('Selecciona dos o más capas para agrupar.');
  const id=options.newGroupId();for(const s of items){s.groupId=id;s.groupName=text(options.name)||'Grupo';}break;
 }
 case 'ungroup':for(const s of items){delete s.groupId;delete s.groupName;}break;
 case 'delete':return {layers:layers.filter(s=>!selected.has(s.id)),ids:[]};
 case 'duplicate':{
  const groups=new Map(),copies=items.map(s=>{const c=clone(s);c.id=options.newId();c.layerName=(text(s.layerName)||'Capa')+' copia';c.layerName=c.layerName.slice(0,64);
   if(c.groupId){if(!groups.has(c.groupId))groups.set(c.groupId,options.newGroupId());c.groupId=groups.get(c.groupId);}return c;});
  const dx=Math.min(.015,1-Math.max(...copies.map(s=>s.x))),dy=Math.min(.015,1-Math.max(...copies.map(s=>s.y)));
  for(const c of copies){c.x+=dx;c.y+=dy;}
  return {layers:[...layers,...copies],ids:copies.map(s=>s.id)};
 }
 case 'front':return {layers:[...layers.filter(s=>!selected.has(s.id)),...items],ids:[...selected]};
 case 'back':return {layers:[...items,...layers.filter(s=>!selected.has(s.id))],ids:[...selected]};
 case 'up':for(let i=layers.length-2;i>=0;i--)if(selected.has(layers[i].id)&&!selected.has(layers[i+1].id))[layers[i],layers[i+1]]=[layers[i+1],layers[i]];break;
 case 'down':for(let i=1;i<layers.length;i++)if(selected.has(layers[i].id)&&!selected.has(layers[i-1].id))[layers[i],layers[i-1]]=[layers[i-1],layers[i]];break;
 default:throw Error('Acción de capas no válida.');
 }
 return {layers,ids:items.map(s=>s.id)};
}
function panel(host,bridge){
 function button(label,action){const b=document.createElement('button');b.type='button';b.className='layer-action';b.textContent=label;b.dataset.layerAction=action;b.onclick=()=>bridge.action(action);return b;}
 const info=document.createElement('p');info.className='layer-summary';host.append(info);
 const toolbar=document.createElement('div');toolbar.className='layer-toolbar';
 for(const [label,action] of [['Al frente','front'],['Al fondo','back'],['Duplicar','duplicate'],['Agrupar','group'],['Separar','ungroup'],['Eliminar','delete'],['Guardar pegatina','saveCreation'],['Cargar pegatina','loadCreation']])toolbar.append(button(label,action));host.append(toolbar);
 const list=document.createElement('div');list.className='layer-list';list.setAttribute('aria-label','Capas, del frente al fondo');host.append(list);
 const hint=document.createElement('p');hint.className='variant-help';hint.textContent='Selecciona capas o un grupo para guardar una pegatina reutilizable. Visible y Bloqueada se controlan en cada fila. Los ajustes de tamaño y color afectan a la capa activa.';host.append(hint);
 function render(){
  const state=bridge.state(),ids=new Set(state.ids);info.textContent=(state.view==='top'?'Superior':'Lateral')+' · '+state.layers.length+' capas · '+ids.size+' seleccionadas';list.replaceChildren();
  for(const b of toolbar.querySelectorAll('button'))b.disabled=b.dataset.layerAction!=='loadCreation'&&(!ids.size||(b.dataset.layerAction==='group'&&ids.size<2));
  if(!state.layers.length){const empty=document.createElement('p');empty.textContent='Añade una pegatina para crear una capa.';list.append(empty);return;}
  for(const s of [...state.layers].reverse()){
   const row=document.createElement('div');row.className='layer-row'+(ids.has(s.id)?' active':'');row.dataset.layerId=s.id;
   const check=document.createElement('input');check.type='checkbox';check.checked=ids.has(s.id);check.setAttribute('aria-label','Seleccionar '+bridge.name(s));check.onchange=()=>bridge.select(s.id,true);row.append(check);
   const center=document.createElement('div');center.className='layer-center';
   const name=document.createElement('input');name.type='text';name.value=s.layerName||bridge.name(s);name.maxLength=64;name.className='layer-name';name.setAttribute('aria-label','Nombre de capa');name.onchange=()=>bridge.rename(s.id,name.value);name.onkeydown=e=>{if(e.key==='Enter')name.blur();if(e.key==='Escape'){name.value=s.layerName||bridge.name(s);name.blur();}};center.append(name);
   const caption=document.createElement('button');caption.type='button';caption.className='layer-caption';caption.textContent=s.groupId?'Grupo: '+(s.groupName||'Grupo'):bridge.kind(s);caption.title=s.groupId?'Seleccionar el grupo completo':'Seleccionar capa';caption.onclick=()=>bridge.select(s.id,false,true);center.append(caption);row.append(center);
   const controls=document.createElement('div');controls.className='layer-switches';
   for(const [action,label,value] of [['visible',s.visible===false?'Oculta':'Visible',s.visible===false],['locked',s.locked?'Bloqueada':'Libre',!s.locked]]){
    const b=document.createElement('button');b.type='button';b.className='layer-switch';b.textContent=label;b.dataset.layerAction=action;b.setAttribute('aria-pressed',String(action==='visible'?s.visible!==false:!!s.locked));b.onclick=()=>bridge.action(action,[s.id],{value});controls.append(b);
   }
   row.append(controls);list.append(row);
  }
 }
 return {render};
}
return Object.freeze({operate,panel});
})();
