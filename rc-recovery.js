/* Local recovery with atomic IndexedDB snapshots, shared photo assets and
 * independent drafts per tab. No network, no writes to the user's rcbody file. */
(function(root){
'use strict';
const DB='RCBodyworkRecovery',VERSION=1,KEEP_VERSIONS=20,KEEP_DOCUMENTS=10;
const uid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
const request=req=>new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
function open(){return new Promise((resolve,reject)=>{
 if(!globalThis.indexedDB)return reject(Error('El navegador no permite guardar la recuperación local.'));
 const req=indexedDB.open(DB,VERSION);
 req.onupgradeneeded=()=>{const db=req.result;db.createObjectStore('assets',{keyPath:'key'});const store=db.createObjectStore('snapshots',{keyPath:'id'});store.createIndex('docId','docId');};
 req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>db.close();resolve(db);};
 req.onerror=()=>reject(req.error);req.onblocked=()=>reject(Error('Cierra otra pestaña antigua para activar la recuperación.'));
});}
class Recovery{
 constructor(bridge){
  this.bridge=bridge;this.sessionId=uid();this.docId=uid();this.revision=0;this.savedRevision=0;this.last=new Map();this.checkpoints=new Map();this.assetCache=new Map();this.queue=Promise.resolve();this.timer=null;this.maxTimer=null;
  this.ready=open();this.ready.catch(e=>this.fail(e));
 }
 fail(error){this.bridge.status({state:'error',message:'Autoguardado no disponible: '+(error?.message||'almacenamiento lleno o bloqueado')+'. Guarda un archivo .rcbody.'});}
 newDocument(id){clearTimeout(this.timer);clearTimeout(this.maxTimer);this.timer=this.maxTimer=null;this.docId=id||uid();this.revision++;this.bridge.available([]);this.bridge.status({state:'ready',message:'Autoguardado local activo'});}
 pending(){return this.savedRevision!==this.revision;}
 schedule(){
  this.revision++;clearTimeout(this.timer);this.bridge.status({state:'pending',message:'Cambios pendientes de autoguardado…'});
  this.timer=setTimeout(()=>this.flush().catch(()=>{}),1200);
  if(!this.maxTimer)this.maxTimer=setTimeout(()=>this.flush().catch(()=>{}),5000);
 }
 flush(kind='automatic',force=false){
  clearTimeout(this.timer);clearTimeout(this.maxTimer);this.timer=this.maxTimer=null;
  let captured;
  try{captured=this.bridge.capture();if(!captured?.project||!Object.values(captured.project.images||{}).some(Boolean))return Promise.resolve(null);
   // Capture immediately, before any asynchronous storage work or image load.
   captured=JSON.parse(JSON.stringify(captured));
  }catch(e){this.fail(e);return Promise.reject(e);}
  const docId=this.docId,revision=this.revision;
  const operation=this.queue.catch(()=>{}).then(()=>this.write(captured,docId,revision,kind,force));
  this.queue=operation;operation.catch(e=>this.fail(e));return operation;
 }
 async assetKey(src){
  if(this.assetCache.has(src))return this.assetCache.get(src);
  let key;
  if(globalThis.crypto?.subtle){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(src));key=Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,'0')).join('');}
  else{let a=2166136261,b=5381;for(let i=0;i<src.length;i++){a=Math.imul(a^src.charCodeAt(i),16777619);b=Math.imul(b,33)^src.charCodeAt(i);}key=src.length+'-'+(a>>>0).toString(16)+'-'+(b>>>0).toString(16);}
  if(this.assetCache.size>=8)this.assetCache.delete(this.assetCache.keys().next().value);this.assetCache.set(src,key);return key;
 }
 async write(captured,docId,revision,kind,force){
  const db=await this.ready,text=JSON.stringify(captured),draftId='draft-'+docId+'-'+this.sessionId;
  let signature=uid();
  if(globalThis.crypto?.subtle){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));signature=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');}
  if(!force&&this.last.get(docId)===signature){this.savedRevision=revision;if(revision===this.revision)this.bridge.status({state:'saved',message:'Recuperación local al día'});return draftId;}
  this.bridge.status({state:'saving',message:'Guardando recuperación local…'});
  const project=captured.project,assets=[];
  for(const which of ['top','side'])if(project.images?.[which]){
   const photo=project.images[which],src=photo.src;if(typeof src!=='string')throw Error('Foto no válida para recuperación.');
   let key=await this.assetKey(src);
   // Even the non-cryptographic fallback never aliases distinct photos.
   const prior=await request(db.transaction('assets','readonly').objectStore('assets').get(key));
   if(prior&&prior.src!==src){key+='-'+uid();this.assetCache.set(src,key);}
   assets.push({key,src});delete photo.src;photo.assetKey=key;
  }
  const now=Date.now(),checkpoint=force||!this.checkpoints.has(docId)||now-this.checkpoints.get(docId)>=60000;
  const record={format:1,id:draftId,docId,sessionId:this.sessionId,kind:'draft',date:now,name:String(project.name||'Sin nombre').slice(0,96),dirty:!!captured.dirty,project,history:captured.history||[],prefs:captured.prefs||{},assets:assets.map(a=>a.key)};
  await new Promise((resolve,reject)=>{
   const tx=db.transaction(['assets','snapshots'],'readwrite');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error||Error('No se pudo completar el guardado local.'));tx.onerror=()=>{};
   // Put in the same transaction as the snapshot: concurrent tab cleanup cannot
   // remove an asset between its existence check and its new reference.
   for(const a of assets){const store=tx.objectStore('assets'),check=store.get(a.key);check.onsuccess=()=>{if(!check.result)store.put(a);else if(check.result.src!==a.src)tx.abort();};}
   tx.objectStore('snapshots').put(record);
   if(checkpoint)tx.objectStore('snapshots').put({...record,id:'version-'+uid(),kind:kind==='file'?'file':kind==='manual'?'manual':'automatic'});
  });
  this.last.set(docId,signature);if(this.last.size>KEEP_DOCUMENTS)this.last.delete(this.last.keys().next().value);if(checkpoint)this.checkpoints.set(docId,now);if(this.checkpoints.size>KEEP_DOCUMENTS)this.checkpoints.delete(this.checkpoints.keys().next().value);
  await this.prune(db);
  this.savedRevision=revision;if(revision===this.revision)this.bridge.status({state:'saved',date:now,message:'Autoguardado local · '+new Date(now).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit',second:'2-digit'})});
  return draftId;
 }
 async prune(db){
  await new Promise((resolve,reject)=>{
   const tx=db.transaction(['snapshots','assets'],'readwrite'),snap=tx.objectStore('snapshots'),assets=tx.objectStore('assets');
   tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error||Error('No se pudo mantener el historial.'));tx.onerror=()=>{};
   const req=snap.getAll();req.onsuccess=()=>{
    const records=req.result.sort((a,b)=>b.date-a.date||a.id.localeCompare(b.id)),docs=[...new Set(records.map(r=>r.docId))].slice(0,KEEP_DOCUMENTS),counts=new Map(),referenced=new Set();
    for(const r of records){const key=r.docId+(r.kind==='draft'?':draft':':version'),count=counts.get(key)||0,limit=r.kind==='draft'?3:KEEP_VERSIONS;
     if(!docs.includes(r.docId)||count>=limit){snap.delete(r.id);continue;}counts.set(key,count+1);for(const k of r.assets||[])referenced.add(k);
    }
    const cursor=assets.openKeyCursor();cursor.onsuccess=()=>{const c=cursor.result;if(!c)return;if(!referenced.has(c.key))assets.delete(c.key);c.continue();};
   };
  });
 }
 async list(){
  const db=await this.ready,records=await request(db.transaction('snapshots','readonly').objectStore('snapshots').getAll());
  return records.sort((a,b)=>b.date-a.date||Number(b.kind==='draft')-Number(a.kind==='draft')||a.id.localeCompare(b.id)).map(({id,docId,date,name,kind,dirty})=>({id,docId,date,name,kind,dirty}));
 }
 async get(id){
  const db=await this.ready;
  return new Promise((resolve,reject)=>{
   const tx=db.transaction(['snapshots','assets'],'readonly');let result=null,problem=null;
   tx.oncomplete=()=>problem?reject(problem):resolve(result);tx.onabort=()=>reject(tx.error||Error('No se pudo leer la versión local.'));tx.onerror=()=>{};
   const req=tx.objectStore('snapshots').get(id);req.onsuccess=()=>{
    const record=req.result;if(!record||record.format!==1){problem=Error('Esta versión ya no está disponible.');return;}
    result=record;
    for(const which of ['top','side'])if(record.project.images?.[which]){
     const photo=record.project.images[which],asset=tx.objectStore('assets').get(photo.assetKey);
     asset.onsuccess=()=>{if(!asset.result?.src){problem=Error('Falta una foto de la recuperación.');return;}photo.src=asset.result.src;delete photo.assetKey;};
    }
   };
  });
 }
 async recover(id){
  const record=await this.get(id);if(await this.bridge.beforeTransition?.()===false)throw Error('Corrige la medida pendiente antes de recuperar otra versión.');await this.flush('manual',true);
  const ok=await this.bridge.restore(record);if(!ok)throw Error('No se pudo recuperar el proyecto. Se conserva la versión local.');
  this.newDocument(record.docId);this.schedule();await this.flush('manual',true);return true;
 }
 async download(id){const record=await this.get(id);this.bridge.download(record.project);}
 async init(){const records=await this.list();this.bridge.available(records);this.bridge.status({state:'ready',message:'Autoguardado local activo'});return records;}
}
root.RCRecovery=Object.freeze({create:bridge=>new Recovery(bridge),limits:Object.freeze({versions:KEEP_VERSIONS,documents:KEEP_DOCUMENTS})});
})(typeof window==='undefined'?globalThis:window);
