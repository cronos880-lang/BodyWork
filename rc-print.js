'use strict';
// Offline, dependency-free print geometry and lossless PDF codec.
window.RCPrint=(()=>{
const RC_PDF_PPM=12,RC_A4_W=297,RC_A4_H=210;
async function rcEncodePdfPage(canvas){
 const rgba=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
 const rgb=new Uint8Array(canvas.width*canvas.height*3);
 for(let i=0,j=0;i<rgba.length;i+=4){rgb[j++]=rgba[i];rgb[j++]=rgba[i+1];rgb[j++]=rgba[i+2];}
 if(typeof CompressionStream!=='function')throw Error('Este navegador no admite PDF sin pérdidas. Usa una versión actual de Chrome o Edge.');
 const stream=new Blob([rgb]).stream().pipeThrough(new CompressionStream('deflate'));
 return {pixels:new Uint8Array(await new Response(stream).arrayBuffer()),width:canvas.width,height:canvas.height};
}

function rcOrientPdfPiece(image){
 // Row endpoints describe the exact convex envelope of all printable ink.
 const w=image.width,h=image.height,data=image.getContext('2d').getImageData(0,0,w,h).data,points=[];
 for(let y=0;y<h;y++){let lo=-1,hi=-1;for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>=12){if(lo<0)lo=x;hi=x;}
  if(lo>=0){points.push([lo,y],[hi+1,y],[lo,y+1],[hi+1,y+1]);}}
 let best=null;
 for(let angle=0;angle<180;angle++){
  const rad=angle*Math.PI/180,c=Math.cos(rad),s=Math.sin(rad);let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for(const [x,y] of points){const xx=x*c-y*s,yy=x*s+y*c;x0=Math.min(x0,xx);x1=Math.max(x1,xx);y0=Math.min(y0,yy);y1=Math.max(y1,yy);}
  const ww=(x1-x0)/RC_PDF_PPM+.9,hh=(y1-y0)/RC_PDF_PPM+.9;
  if(ww>283||hh>196)continue;
  const cost=ww*hh+angle*.01;
  if(!best||cost<best.cost)best={angle,cost};
 }
 const angle=best?.angle||0;return {image:rcRotate(image,angle),angle};
}


function rcCanvas(w,h){const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c;}

function rcCropAlpha(c,paddingMM=1.2){
 const w=c.width,h=c.height,ctx=c.getContext('2d',{willReadFrequently:true});
 const d=ctx.getImageData(0,0,w,h).data;let minx=w,miny=h,maxx=-1,maxy=-1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(d[(y*w+x)*4+3]<12)continue;
   if(x<minx)minx=x;if(y<miny)miny=y;if(x>maxx)maxx=x;if(y>maxy)maxy=y;
 }
 if(maxx<0)return null;
 const pad=Math.ceil(paddingMM*RC_PDF_PPM),x0=Math.max(0,minx-pad),y0=Math.max(0,miny-pad),x1=Math.min(w,maxx+1+pad),y1=Math.min(h,maxy+1+pad);
 const trimmed=rcCanvas(x1-x0,y1-y0),t=trimmed.getContext('2d');
 t.drawImage(c,x0,y0,trimmed.width,trimmed.height,0,0,trimmed.width,trimmed.height);
 // Exclude barely visible artefacts around shapes.
 const pixels=t.getImageData(0,0,trimmed.width,trimmed.height);for(let i=3;i<pixels.data.length;i+=4)if(pixels.data[i]<12)pixels.data[i]=0;
 t.putImageData(pixels,0,0);
 return {image:trimmed,x:x0,y:y0,widthMM:trimmed.width/RC_PDF_PPM,heightMM:trimmed.height/RC_PDF_PPM};
}

function rcRotate(c,angle){if(!angle)return c;
 const a=angle*Math.PI/180,ca=Math.abs(Math.cos(a)),sa=Math.abs(Math.sin(a));
 const w=Math.ceil(c.width*(ca<1e-10?0:ca)+c.height*(sa<1e-10?0:sa)),h=Math.ceil(c.width*(sa<1e-10?0:sa)+c.height*(ca<1e-10?0:ca)),r=rcCanvas(w,h),cx=r.getContext('2d');
 cx.imageSmoothingEnabled=true;cx.imageSmoothingQuality='high';cx.translate(w/2,h/2);cx.rotate(a);cx.drawImage(c,-c.width/2,-c.height/2);return r;
}

function rcFlipHorizontal(c){const r=rcCanvas(c.width,c.height),ctx=r.getContext('2d');ctx.translate(c.width,0);ctx.scale(-1,1);ctx.drawImage(c,0,0);return r;}

function rcPackTopSheets(items,maxSheets=3){
 const W=283,H=196,bins=[];
 const fits=(a,b)=>a.w<=b.w+.005&&a.h<=b.h+.005;
 const within=(a,b)=>a.x>=b.x-.005&&a.y>=b.y-.005&&a.x+a.w<=b.x+b.w+.005&&a.y+a.h<=b.y+b.h+.005;
 const intersects=(a,b)=>a.x<b.x+b.w-.005&&a.x+a.w>b.x+.005&&a.y<b.y+b.h-.005&&a.y+a.h>b.y+.005;
 function addFree(bin,used){
  let next=[];
  for(const rect of bin.free){
   if(!intersects(rect,used)){next.push(rect);continue;}
   if(used.x>rect.x+.005)next.push({x:rect.x,y:rect.y,w:used.x-rect.x,h:rect.h});
   if(used.x+used.w<rect.x+rect.w-.005)next.push({x:used.x+used.w,y:rect.y,w:rect.x+rect.w-(used.x+used.w),h:rect.h});
   if(used.y>rect.y+.005)next.push({x:rect.x,y:rect.y,w:rect.w,h:used.y-rect.y});
   if(used.y+used.h<rect.y+rect.h-.005)next.push({x:rect.x,y:used.y+used.h,w:rect.w,h:rect.y+rect.h-(used.y+used.h)});
  }
  bin.free=next.filter((a,i)=>a.w>.05&&a.h>.05&&!next.some((b,j)=>i!==j&&within(a,b)&&(!within(b,a)||i>j)));
 }
 const pieces=[...items].sort((a,b)=>b.w*b.h-a.w*a.h);
 for(const item of pieces){
  let options=[{image:item.image,w:item.w,h:item.h,rotation:0}];
  // Turn a decal through 90 degrees if this is needed for genuine A4 fit.
  {
   const rot=rcCropAlpha(rcRotate(item.image,90),0);
   if(rot)options.push({image:rot.image,w:rot.widthMM,h:rot.heightMM,rotation:90});
  }
  options=options.filter(o=>o.w<=W+.005&&o.h<=H+.005);
  if(!options.length)throw Error('La pegatina superior '+item.id+' mide '+item.w.toFixed(1)+' x '+item.h.toFixed(1)+' mm y no entra en una hoja A4 manteniendo escala 1:1 y margenes de 7 mm.');
  let selected=null;
  for(let ib=0;ib<bins.length;ib++)for(const free of bins[ib].free)for(const o of options){
   if(!fits(o,free))continue;
   const waste=free.w*free.h-o.w*o.h;
   const score=[ib,waste,Math.min(free.w-o.w,free.h-o.h),o.rotation];
   if(!selected||score[0]<selected.score[0]||(score[0]===selected.score[0]&&(score[1]<selected.score[1]||score[1]===selected.score[1]&&score[2]<selected.score[2])))
    selected={ib,free,o,score};
  }
  if(!selected){
   if(bins.length===maxSheets)throw Error('Las pegatinas superiores necesitan mas de '+maxSheets+' hojas A4 a tamaño real. No se han recortado ni reducido. Revisa las medidas o el numero de piezas.');
   bins.push({free:[{x:7,y:7,w:W,h:H}],placed:[]});
   const ib=bins.length-1;
   const o=options.sort((a,b)=>a.h-b.h)[0];
   selected={ib,free:bins[ib].free[0],o};
  }
  const bin=bins[selected.ib],o=selected.o;
  const placed={x:selected.free.x,y:selected.free.y,w:o.w,h:o.h};
  bin.placed.push({item,image:o.image,x:placed.x,y:placed.y,w:o.w,h:o.h,rotation:o.rotation});
  addFree(bin,placed);
 }
 return bins;
}
// With the instruction sheet removed, top printouts still need a 100 mm
// reference. Add it only to genuinely empty paper, never over the decal.

function rcPdfFromPageCanvases(pages){
 // Self-contained offline PDF writer. Every page is A4 landscape in PDF points.
 const enc=new TextEncoder(),chunks=[];let bytes=0;
 function push(value){const b=typeof value==='string'?enc.encode(value):value;chunks.push(b);bytes+=b.length;}
 const offsets=[];
 function begin(n){offsets[n]=bytes;push(n+' 0 obj\n');}
 function end(){push('\nendobj\n');}
 function obj(n,body){begin(n);push(body);end();}
 const count=pages.length, pageIds=pages.map((_,i)=>6+i*3), max=4+pages.length*3;
 push('%PDF-1.4\n%RCBG\n');
 obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
 obj(2,`<< /Type /Pages /Kids [${pageIds.map(n=>n+' 0 R').join(' ')}] /Count ${count} >>`);
 obj(3,'<< /Producer (RC Bodywork - Printable Stickers) >>');
 obj(4,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
 pages.forEach((page,i)=>{
  const imageId=5+i*3,pageId=imageId+1,contentId=imageId+2;
  const pixels=page.pixels;
  begin(imageId);
  push(`<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${pixels.length} >>\nstream\n`);
  push(pixels);push('\nendstream');end();
  const content=`q 841.889764 0 0 595.275591 0 0 cm /Im${i} Do Q\n`;
  obj(pageId,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 841.889764 595.275591] /Resources << /XObject << /Im${i} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`);
  obj(contentId,`<< /Length ${enc.encode(content).length} >>\nstream\n${content}endstream`);
 });
 const xrefAt=bytes;
 push(`xref\n0 ${max+1}\n0000000000 65535 f \n`);
 for(let n=1;n<=max;n++)push(String(offsets[n]).padStart(10,'0')+' 00000 n \n');
 push(`trailer\n<< /Size ${max+1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`);
 return new Blob(chunks,{type:'application/pdf'});
}

// Plan by actual ink, never by the photograph's reference width. All coordinates
// stay in integer print pixels; every adjacent overlap is exactly 20 mm.
function rcPlanArtwork(source,limits={}){
 const ink=rcCropAlpha(source,0);if(!ink)throw Error('No hay tinta imprimible en esta composición.');
 const capX=Math.round((limits.widthMM||283)*RC_PDF_PPM),capY=Math.round((limits.heightMM||196)*RC_PDF_PPM),overlap=20*RC_PDF_PPM;
 if(capX<=overlap||capY<=overlap)throw Error('Área A4 no válida.');
 const count=(size,cap)=>size<=cap?1:Math.ceil((size-overlap)/(cap-overlap));
 let image=ink.image,rotation=0;
 const pages0=count(image.width,capX)*count(image.height,capY);
 const pages90=count(image.height,capX)*count(image.width,capY);
 if(pages90<pages0){image=rcRotate(image,90);rotation=90;}
 const w=image.width,h=image.height,rgba=image.getContext('2d').getImageData(0,0,w,h).data;
 const projectionX=new Float64Array(w),projectionY=new Float64Array(h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const a=rgba[(y*w+x)*4+3];if(a>=12){projectionX[x]+=a;projectionY[y]+=a;}}
 function axis(size,cap,projection){
  const spans=[],prefix=new Float64Array(size+1);for(let i=0;i<size;i++)prefix[i+1]=prefix[i]+projection[i];
  let start=0,n=count(size,cap);
  while(n>1){
   const remaining=size-start;
   const low=Math.max(overlap+1,remaining-(n-1)*(cap-overlap)),high=Math.min(cap,remaining-1);
   const ideal=(remaining+(n-1)*overlap)/n;
   let selected=null;
   for(let length=low;length<=high;length++){
    const end=start+length,mid=end-overlap/2;
    // Prefer an empty overlap; otherwise minimize ink at the assembly line.
    const band=prefix[end]-prefix[end-overlap];
    const cut=projection[Math.min(size-1,Math.floor(mid))];
    const score=cut*overlap+band;
    const distance=Math.abs(length-ideal);
    if(!selected||score<selected.score||score===selected.score&&distance<selected.distance)selected={length,score,distance};
   }
   if(!selected)throw Error('No se pudo planificar una unión A4 con solape de 20 mm.');
   spans.push({start,length:selected.length});start+=selected.length-overlap;n--;
  }
  spans.push({start,length:size-start});
  return spans;
 }
 const xs=axis(w,capX,projectionX),ys=axis(h,capY,projectionY),tiles=[];
 for(let row=0;row<ys.length;row++)for(let col=0;col<xs.length;col++){
  const x=xs[col].start,y=ys[row].start,tw=xs[col].length,th=ys[row].length;
  let nonempty=false;
  for(let yy=y;yy<y+th&&!nonempty;yy++)for(let xx=x;xx<x+tw;xx++)if(rgba[(yy*w+xx)*4+3]>=12){nonempty=true;break;}
  if(!nonempty)continue;
  const seamsX=[],seamsY=[];
  if(col>0)seamsX.push(x+overlap/2);
  if(col+1<xs.length)seamsX.push(x+tw-overlap/2);
  if(row>0)seamsY.push(y+overlap/2);
  if(row+1<ys.length)seamsY.push(y+th-overlap/2);
  tiles.push({x,y,w:tw,h:th,col,row,seamsX,seamsY});
 }
 return {image,rotation,tiles,columns:xs.length,rows:ys.length,xSpans:xs,ySpans:ys,overlap,crop:{x:ink.x,y:ink.y}};
}

// Non-destructive opt-in print cleanup. Components are measured in physical
// area; no project names, artwork IDs, colours or fixed image positions.
function rcCleanPrintIslands(source,minAreaMM2=0){
 if(!(minAreaMM2>0))return {image:source,removed:0,removedMM2:0};
 const w=source.width,h=source.height,ctx=source.getContext('2d'),pixels=ctx.getImageData(0,0,w,h),d=pixels.data;
 const runs=[],parent=[],areas=[];let prev=[];
 const find=i=>{let root=i;while(parent[root]!==root)root=parent[root];while(parent[i]!==i){const next=parent[i];parent[i]=root;i=next;}return root;};
 const join=(a,b)=>{a=find(a);b=find(b);if(a!==b)parent[b]=a;};
 for(let y=0;y<h;y++){
  const row=[];let previousIndex=0;
  for(let x=0;x<w;){if(d[(y*w+x)*4+3]<12){x++;continue;}
   const start=x;while(x<w&&d[(y*w+x)*4+3]>=12)x++;
   const run={start,end:x,y,id:runs.length};parent.push(run.id);areas.push(x-start);runs.push(run);row.push(run);
   while(previousIndex<prev.length&&prev[previousIndex].end<start)previousIndex++;
   for(let j=previousIndex;j<prev.length&&prev[j].start<=x;j++)join(run.id,prev[j].id);
  }
  prev=row;
 }
 const total=new Float64Array(runs.length);
 for(const run of runs)total[find(run.id)]+=areas[run.id];
 const limit=minAreaMM2*RC_PDF_PPM*RC_PDF_PPM;let removedPixels=0;const removedRoots=new Set();
 for(const run of runs){const root=find(run.id);if(total[root]>=limit)continue;removedRoots.add(root);
  for(let x=run.start;x<run.end;x++){d[(run.y*w+x)*4+3]=0;removedPixels++;}}
 if(!removedPixels)return {image:source,removed:0,removedMM2:0};
 const output=rcCanvas(w,h);output.getContext('2d').putImageData(pixels,0,0);
 return {image:output,removed:removedRoots.size,removedMM2:removedPixels/(RC_PDF_PPM*RC_PDF_PPM)};
}

return Object.freeze({rcCleanPrintIslands,rcPlanArtwork,rcEncodePdfPage,rcOrientPdfPiece,rcCanvas,rcCropAlpha,rcRotate,rcFlipHorizontal,rcPackTopSheets,rcPdfFromPageCanvases});
})();
