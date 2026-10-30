/* Conservative, full-size A4 nesting. A grid cell is occupied if ANY source
 * alpha is present. Rotations are exact quarter turns, never resampling. */
(function(root){
'use strict';
const PPM=12,STEP=12,W=283,H=196,GAP=2;
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
function shape(item,index){
 const source=item.image,w=source.width,h=source.height;
 const orientations=[0,90,180,270].map(rotation=>{
  const pw=rotation%180?h:w,ph=rotation%180?w:h,gw=Math.ceil(pw/STEP),gh=Math.ceil(ph/STEP);
  return {rotation,pw,ph,w:gw,h:gh,stride:Math.ceil(gw/32),grid:new Uint32Array(gh*Math.ceil(gw/32))};
 });
 const data=source.getContext('2d').getImageData(0,0,w,h).data;let ink=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  if(!data[(y*w+x)*4+3])continue;ink++;
  const coords=[[x,y],[h-1-y,x],[w-1-x,h-1-y],[y,w-1-x]];
  for(let k=0;k<4;k++){const o=orientations[k],xx=Math.floor(coords[k][0]/STEP),yy=Math.floor(coords[k][1]/STEP);o.grid[yy*o.stride+(xx>>>5)]|=1<<(xx&31);}
 }
 for(const o of orientations){
  o.rows=[];
  for(let y=0;y<o.h;y++){
   const words=[];let weight=0;
   for(let x=0;x<o.stride;x++){const bits=o.grid[y*o.stride+x];if(bits){words.push([x,bits]);let n=bits;while(n){n&=n-1;weight++;}}}
   if(words.length)o.rows.push({y,words,weight});
  }
  // Dense rows reject collisions early, while retaining every occupied cell.
  o.rows.sort((a,b)=>b.weight-a.weight||a.y-b.y);
 }
 return {item,index,ink,area:w*h,long:Math.max(w,h),short:Math.min(w,h),orientations:orientations.filter(o=>o.pw<=W*PPM&&o.ph<=H*PPM)};
}
const STRIDE=Math.ceil((W+GAP*2)/32);
function bin(){return {bits:new Uint32Array((H+GAP*2)*STRIDE),placed:[],usedX:0,usedY:0};}
function collides(b,o,x,y){
 x+=GAP;y+=GAP;const word=x>>>5,shift=x&31;
 for(const row of o.rows){const base=(y+row.y)*STRIDE+word;
  for(const [k,bits] of row.words){
   if((b.bits[base+k]&(bits<<shift))||(shift&&(b.bits[base+k+1]&(bits>>>(32-shift)))))return true;
  }
 }
 return false;
}
function occupy(b,o,x,y){
 // A two-cell (2 mm) Chebyshev expansion guarantees a cutting gap, including
 // diagonal neighbours. The bin has a padding halo so edges remain bounded.
 for(const row of o.rows)for(const [k,bits] of row.words){
  let n=bits;
  while(n){const low=n&-n,bit=31-Math.clz32(low),cx=x+GAP+k*32+bit,cy=y+GAP+row.y;n=(n&~low)>>>0;
   for(let dy=-GAP;dy<=GAP;dy++)for(let dx=-GAP;dx<=GAP;dx++){const xx=cx+dx;b.bits[(cy+dy)*STRIDE+(xx>>>5)]|=1<<(xx&31);}
  }
 }
 b.usedX=Math.max(b.usedX,x+o.w);b.usedY=Math.max(b.usedY,y+o.h);
}
function less(a,b){for(let i=0;i<a.length;i++)if(a[i]!==b[i])return a[i]<b[i];return false;}
function run(items,order){
 const bins=[];
 for(const piece of order){
  let chosen=null;
  for(let ib=0;ib<bins.length&&!chosen;ib++){
   const b=bins[ib];let best=null;
   for(const o of piece.orientations){
    const mx=Math.floor((W*PPM-o.pw)/STEP),my=Math.floor((H*PPM-o.ph)/STEP);
    let found=false;
    for(let y=0;y<=my&&!found;y++){
     if(best&&Math.max(b.usedY,y+o.h)>best.score[0])break;
     for(let x=0;x<=mx;x++)if(!collides(b,o,x,y)){
      const score=[Math.max(b.usedY,y+o.h),y,Math.max(b.usedX,x+o.w),x,o.rotation];
      if(!best||less(score,best.score))best={ib,o,x,y,score,piece};found=true;break;
     }
    }
   }
   chosen=best;
  }
  if(!chosen){
   const o=[...piece.orientations].sort((a,b)=>a.h-b.h||a.w-b.w||a.rotation-b.rotation)[0];
   if(!o)return null;
   bins.push(bin());chosen={ib:bins.length-1,o,x:0,y:0,piece};
  }
  const b=bins[chosen.ib];occupy(b,chosen.o,chosen.x,chosen.y);
  b.placed.push({item:piece.item,index:piece.index,x:chosen.x*STEP+7*PPM,y:chosen.y*STEP+7*PPM,rotation:chosen.o.rotation,w:chosen.o.pw,h:chosen.o.ph});
 }
 return bins;
}
async function pack(items,{onProgress=()=>{}}={}){
 const shapes=[];
 for(let i=0;i<items.length;i++){const s=shape(items[i],i);if(!s.orientations.length)return null;shapes.push(s);if(i%4===3)await tick();}
 const keys=[p=>p.area,p=>p.ink,p=>p.long,p=>p.short,p=>p.item.image.height,p=>p.item.image.width];
 const orders=keys.map(key=>[...shapes].sort((a,b)=>key(b)-key(a)||b.area-a.area||a.index-b.index));
 if(items.length<=40){
  for(const seed of [19,73])orders.push([...shapes].sort((a,b)=>((Math.imul(a.index+seed,2654435761)>>>0)-(Math.imul(b.index+seed,2654435761)>>>0))));
 }
 let best=null,score=null,attempts=0;
 for(const order of orders){
  onProgress(++attempts,orders.length);await tick();const bins=run(items,order);if(!bins)continue;
  const current=[bins.length,bins.reduce((n,b)=>n+b.usedY,0),bins.reduce((n,b)=>n+b.usedX,0)];
  if(!score||less(current,score)){best=bins;score=current;}
 }
 return best?{bins:best,attempts,clearanceMM:GAP,gridMM:STEP/PPM,inkMM2:shapes.reduce((n,p)=>n+p.ink/(PPM*PPM),0)}:null;
}
function draw(ctx,placement){
 const {item,x,y,rotation}=placement,src=item.image,w=src.width,h=src.height;ctx.save();
 if(rotation===90)ctx.setTransform(0,1,-1,0,x+h,y);
 else if(rotation===180)ctx.setTransform(-1,0,0,-1,x+w,y+h);
 else if(rotation===270)ctx.setTransform(0,-1,1,0,x,y+w);
 else ctx.setTransform(1,0,0,1,x,y);
 ctx.drawImage(src,0,0);ctx.restore();
}
root.RCPack=Object.freeze({pack,draw,clearanceMM:GAP});
})(typeof window==='undefined'?globalThis:window);
