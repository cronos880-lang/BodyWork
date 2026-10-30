/* Calibrated editor coordinates and non-destructive precision transforms. */
(function(root){
'use strict';
const known={
 top:{w:878,h:768,signature:'761326:46dbb0b4',x0:177,x1:695,y0:16,y1:751,width:235,height:450},
 side:{w:1167,h:768,signature:'847490:91679530',x0:20,x1:1140,y0:209,y1:535,width:450,height:124}
};
const calibrationCache=new WeakMap();
function calibration(view,d){
 if(!d)return null;const saved=calibrationCache.get(d);
 if(saved&&saved.view===view&&saved.src===d.src&&saved.w===d.w&&saved.h===d.h&&saved.manual===d.calibration)return saved.result;
 const k=known[view];let result=null;
 if(d.calibration){try{const c=RCCalibration.validate(view,d.calibration,d);result={...c,kind:'manual',mmX:c.width/(c.x1-c.x0),mmY:c.height/(c.y1-c.y0)};}catch(e){result=null;}}
 else if(k&&d.w===k.w&&d.h===k.h){let hash=2166136261;const src=d.src||'';for(let i=0;i<src.length;i+=97)hash=Math.imul(hash^src.charCodeAt(i),16777619)>>>0;
  if(src.length+':'+hash.toString(16)===k.signature)result={...k,kind:'builtin',name:'Lola VIP',verified:true,mmX:k.width/(k.x1-k.x0),mmY:k.height/(k.y1-k.y0)};
 }
 calibrationCache.set(d,{view,src:d.src,w:d.w,h:d.h,manual:d.calibration,result});return result;
}
function validScale(value){return value&&typeof value==='object'&&!Array.isArray(value)&&['x','y'].every(k=>Number.isFinite(value[k])&&value[k]>=.00001&&value[k]<=1000);}
function number(value){const text=String(value).trim();if(!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(text))return NaN;return Number(text.replace(',','.'));}
function format(value){return Number.isFinite(value)?(Math.round(value*10)/10).toFixed(1).replace('.',','):'';}
function photoToMM(c,x,y){return {x:(x-c.x0)*c.mmX,y:(y-c.y0)*c.mmY};}
function mmToPhoto(c,x,y){return {x:c.x0+x/c.mmX,y:c.y0+y/c.mmY};}
// D^-1 R D: a Euclidean rotation in calibrated millimetres, represented in
// photograph pixels. Without this, the unequal photo scales stretch a logo
// when it is turned through 90 degrees.
function rotation(angle,c){const a=angle*Math.PI/180,co=Math.cos(a),si=Math.sin(a);return {a:co,b:si*c.mmX/c.mmY,c:-si*c.mmY/c.mmX,d:co};}
function inverse(m,x,y){const det=m.a*m.d-m.b*m.c;return {x:(m.d*x-m.c*y)/det,y:(m.a*y-m.b*x)/det};}
function shifted(box,dx,dy){return {left:box.left+dx,right:box.right+dx,top:box.top+dy,bottom:box.bottom+dy};}
function union(boxes){if(!boxes.length)return null;return {left:Math.min(...boxes.map(b=>b.left)),right:Math.max(...boxes.map(b=>b.right)),top:Math.min(...boxes.map(b=>b.top)),bottom:Math.max(...boxes.map(b=>b.bottom))};}
function snap(box,targets,tolerance,limits){
 const result={x:0,y:0,guides:[]};
 for(const [axis,lo,hi] of [['x','left','right'],['y','top','bottom']]){
  let best=null;const moving=[box[lo],(box[lo]+box[hi])/2,box[hi]];
  for(const target of targets){const values=[target.box[lo],(target.box[lo]+target.box[hi])/2,target.box[hi]];
   for(let i=0;i<3;i++)for(let j=0;j<3;j++){
    const delta=values[j]-moving[i];if(Math.abs(delta)>tolerance[axis]||delta<limits[axis][0]-1e-8||delta>limits[axis][1]+1e-8)continue;
    const score=Math.abs(delta)+(i===j?0:.0001)+(target.reference?0:.00001);
    if(!best||score<best.score)best={delta,value:values[j],label:target.label,score};
   }
  }
  if(best){result[axis]=best.delta;result.guides.push({axis,value:best.value,label:best.label});}
 }
 return result;
}
root.RCDim=Object.freeze({calibration,validScale,number,format,photoToMM,mmToPhoto,rotation,inverse,shifted,union,snap});
})(typeof window==='undefined'?globalThis:window);
