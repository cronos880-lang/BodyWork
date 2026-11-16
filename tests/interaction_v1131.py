"""Regression: recolour, real pointer placement/drag and isolated-origin resource safety.
Python 3.12 / Playwright / Chromium. No disabling web security, no user browser profile.
"""
import argparse,base64,hashlib,json,mimetypes,runpy
from pathlib import Path
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
BASE_BRIDGE=runpy.run_path(str(ROOT/'tests/graphics_v1130.py'))['BRIDGE']
EXTRA='''window.__test.logoTinted=logoTinted;
window.__test.originalLogo=id=>LOGO_IMAGES[id];
window.__test.variant=id=>currentVariant[currentTool];
window.__test.rasterCatalogue=view=>kitCatalogForView(view).filter(v=>isRasterPiece(v.id)).map(v=>v.id);
window.__test.setVariant=setVariant;
window.__test.pose=(view,id)=>{const s=imgs[view].stickers.find(x=>x.id===id);return {x:s.x,y:s.y,angle:s.angle,size:s.size,sx:s.sx,sy:s.sy,color:s.color,accent:s.accent};};
window.__test.point=(view,nx,ny)=>{const d=imgs[view],r=document.getElementById('canvas-'+view).parentElement.getBoundingClientRect(),z=zoomState[view],scale=Math.min(r.width/d.w,r.height/d.h),ox=(r.width-d.w*scale)/2,oy=(r.height-d.h*scale)/2;return {x:r.left+r.width/2+(ox+nx*d.w*scale-r.width/2)*z.scale+z.x,y:r.top+r.height/2+(oy+ny*d.h*scale-r.height/2)*z.scale+z.y,sx:d.w*scale*z.scale,sy:d.h*scale*z.scale};};
window.__test.inkPoint=(view,id)=>{const d=imgs[view],s=d.stickers.find(x=>x.id===id),c=document.createElement('canvas');c.width=d.w;c.height=d.h;const x=c.getContext('2d');renderSticker(x,s,d.w,d.h);const a=x.getImageData(0,0,c.width,c.height).data;let best=null,bestDist=Infinity;for(let yy=2;yy<c.height;yy+=3)for(let xx=2;xx<c.width;xx+=3)if(a[(yy*c.width+xx)*4+3]>200){const dist=(xx-s.x*d.w)**2+(yy-s.y*d.h)**2;if(dist<bestDist){bestDist=dist;best={x:xx/d.w,y:yy/d.h};}}if(!best)throw Error('No opaque artwork for '+id);return best;};
window.__test.emptySelection=fixSelection;
window.__test.resetZoom=resetZoom;
window.__test.setZoom=setZoom;
window.__test.colorMatrix=async function(ids){
 const out=[];for(const id of ids){const im=LOGO_IMAGES[id];await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);const original=x.getImageData(0,0,c.width,c.height).data;
 for(const [primary,accent] of [['#00ff00','#0044ff'],['#ffffff','#000000'],['#000000','#ffffff'],['#ff0000','#00ffff'],['#6828ba','#ffb8de']]){
 const tinted=logoTinted({variant:id,color:primary,accent,logoTintEnabled:true});const a=tinted.getContext('2d').getImageData(0,0,c.width,c.height).data;let mismatch=0,changed=0,ink=0,silverChanged=0,silver=0;
 for(let i=0;i<a.length;i+=4){if(a[i+3]!==original[i+3])mismatch++;if(a[i+3]){ink++;const different=a[i]!==original[i]||a[i+1]!==original[i+1]||a[i+2]!==original[i+2];if(different)changed++;const lum=(original[i]+original[i+1]+original[i+2])/3,red=original[i]>original[i+1]+25&&original[i]>original[i+2]+20;if(id.startsWith('badge_')&&lum>=85&&!red&&original[i+3]===255){silver++;if(different)silverChanged++;}}}
 out.push({id,primary,accent,alphaMismatch:mismatch,ink,changed,silver,silverChanged});
 }}return out;
};
window.__test.logoHashes=async function(ids){const out={};for(const id of ids){const im=LOGO_IMAGES[id];await im.decode();for(const [co,ac] of [['#00ff00','#0044ff'],['#ffffff','#000000'],['#171a22','#f42c38']]){const c=logoTinted({variant:id,color:co,accent:ac,logoTintEnabled:true});out[id+co+ac]=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',c.getContext('2d').getImageData(0,0,c.width,c.height).data))).map(x=>x.toString(16).padStart(2,'0')).join('');}}return out;};
'''

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--baseline',type=Path,required=True);ap.add_argument('--out',type=Path,required=True);ap.add_argument('--only-extra',action='store_true',help='Run text and raster-kit pointer cases instead of the logo/vector cases');a=ap.parse_args();a.out.mkdir(parents=True,exist_ok=True)
 external_requests=[]
 result={'version':'1.13.1','checks':[],'errors':[],'limits':['file:// blocked by environment administrator; tested with cross-origin image URLs instead, with normal Canvas origin security.','Chromium/Linux only; native Windows, physical printing and new-body cotas remain unverified.']}
 def check(ok,name):
  assert ok,name
  result['checks'].append(name);print('PASS',name,flush=True)
 def make_page(browser,root):
  context=browser.new_context(viewport={'width':1600,'height':1050});page=context.new_page()
  page.on('pageerror',lambda e:result['errors'].append(str(e)));page.on('dialog',lambda d:d.accept())
  page.on('request',lambda r:external_requests.append(r.url) if r.url.startswith('http://127.0.0.1/assets/emblemas/') else None)
  def route(r):
   path=(root/unquote(urlparse(r.request.url).path).lstrip('/')).resolve()
   if not path.is_relative_to(root.resolve()) or not path.is_file():r.fulfill(status=404);return
   data=path.read_bytes()
   if path.name=='RC_Bodywork.html':data=data.decode().replace('start();\n})();',BASE_BRIDGE+EXTRA+'start();\n})();').encode()
   if path.name=='rc-graphics.js':data=data.decode().replace('"url":"assets/emblemas/','"url":"http://127.0.0.1/assets/emblemas/').encode()
   r.fulfill(body=data,content_type=mimetypes.guess_type(path)[0] or 'application/octet-stream')
  page.route('http://localhost/**',route);page.route('http://127.0.0.1/**',route)
  page.goto('http://localhost/RC_Bodywork.html');page.wait_for_function('typeof window.__test?.colorMatrix==="function"')
  return context,page
 data=json.loads((ROOT/'examples/Lola_VIP_Edu.rcbody').read_text())
 for photo in data['images'].values():
  if photo:photo['stickers']=[]
 def open_empty(page):
  assert page.evaluate('async s=>__test.projectOpen(new File([s],"empty.rcbody"))',json.dumps(data))
 def tool(page,kind):page.locator('[data-tool='+kind+']').click()
 def colour(page,id,value):page.locator('#'+id).fill(value)
 def drag(page,view,dx=28,dy=14):
  layers=page.evaluate('__test.layers',view);s=layers[-1];prior=page.evaluate('o=>__test.pose(o.view,o.id)',{'view':view,'id':s['id']})
  ink=page.evaluate('o=>__test.inkPoint(o.view,o.id)',dict(view=view,id=s['id']))
  p=page.evaluate('o=>__test.point(o.view,o.x,o.y)',dict(view=view,**ink))
  page.mouse.move(p['x'],p['y']);page.mouse.down();page.mouse.move(p['x']+dx,p['y']+dy,steps=6);page.mouse.up()
  now=page.evaluate('o=>__test.pose(o.view,o.id)',dict(view=view,id=s['id']))
  check(abs(now['x']-prior['x']-dx/p['sx'])<.003 and abs(now['y']-prior['y']-dy/p['sy'])<.003,f'real pointer drag {view}/{s["variant"]}/angle={s["angle"]}')
  check(len(page.evaluate('__test.layers',view))==len(layers),'drag selects existing layer without creating a duplicate')
  return now
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);result['browser']=b.version
  oldctx,old=make_page(b,a.baseline);ctx,page=make_page(b,ROOT)
  ids=['logo_'+str(n).zfill(2) for n in range(1,13)]
  check(old.evaluate('__test.logoHashes',ids)==page.evaluate('__test.logoHashes',ids),'36 recoloured legacy logo rasters match V1.12.1 byte for byte')
  matrix=page.evaluate('__test.colorMatrix',ids+['badge_apex','badge_pulse','badge_facet']);result['colourMatrix']=matrix
  check(all(r['alphaMismatch']==0 and r['ink']>0 and r['changed']>0 for r in matrix),'75 recolour cases retain every alpha value and visible ink')
  check(all(r['silverChanged']==0 for r in matrix if r['id'].startswith('badge_')),'emblem silver rims/highlights unchanged by either paint colour')
  oldctx.close();open_empty(page);page.locator('#mode-stickers').click()
  page.locator('details').evaluate_all('(ds)=>ds.forEach(d=>d.open=false)')
  # Real add/drag/recolour in each view, old and new resources, ordinary and zoomed views.
  cases=[('logo','badge_apex'),('logo','badge_pulse'),('logo','badge_facet'),('logo','logo_01'),('logo','logo_04'),('logo','logo_11'),('vector','vec_aero'),('vector','v113_apex_side_1')]
  if a.only_extra:cases=[('text','logo_racing'),('kit','first-raster')]
  for view in ['side','top']:
   for kind,id in cases:
    if view=='top' and kind=='vector':id='vec_blade_L' if id=='vec_aero' else 'v113_apex_top_L'
    page.evaluate('__test.clear()');page.locator('#target-'+view).click();tool(page,kind)
    if id=='first-raster':id=page.evaluate('__test.rasterCatalogue',view)[0]
    if kind=='text':
     id=page.locator('#variant-grid .variant-btn').first.get_attribute('data-variant')
    page.locator('[data-variant='+id+']').click();page.locator('#add-selected-view').click()
    check(len(page.evaluate('__test.layers',view))==1,f'UI places {view}/{id}')
    colour(page,'sticker-color','#00ff00');colour(page,'sticker-accent','#0044ff')
    check(bool(page.evaluate('__test.pixels()')[view]),f'{view}/{id} canvas remains readable after recolour')
    page.locator('#sticker-accent').blur()
    drag(page,view)
    layer=page.evaluate('__test.layers',view)[-1];ink=page.evaluate('o=>__test.inkPoint(o.view,o.id)',dict(view=view,id=layer['id']));anchor=page.evaluate('o=>__test.point(o.view,o.x,o.y)',dict(view=view,**ink))
    page.evaluate('o=>__test.setZoom(o.view,2,o.x,o.y)',dict(view=view,x=anchor['x'],y=anchor['y']));drag(page,view,18,-10)
    page.evaluate('view=>__test.resetZoom(view)',view)
    # A rotated recoloured layer must remain draggable, not become a new layer.
    page.locator('#sticker-angle').evaluate('(el)=>{el.value=37;el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));}')
    drag(page,view,18,8)
    page.evaluate('__test.emptySelection()')
    # Select the placed item again through the drawing, as a user does after Fix.
    s=page.evaluate('__test.layers',view)[0];ink=page.evaluate('o=>__test.inkPoint(o.view,o.id)',dict(view=view,id=s['id']));point=page.evaluate('o=>__test.point(o.view,o.x,o.y)',dict(view=view,**ink))
    page.mouse.click(point['x'],point['y'])
    check(len(page.evaluate('__test.layers',view))==1,f'Fix/reselect does not duplicate {view}/{id}')
    colour(page,'sticker-color','#ff00ff')
  # Mixed stack regression: a tinted emblem must not abort other layers' redraw.
  page.evaluate('__test.clear()');page.locator('#target-side').click();tool(page,'logo')
  page.locator('[data-variant=badge_apex]').click();page.locator('#add-selected-view').click();colour(page,'sticker-accent','#00ff00')
  tool(page,'vector');page.locator('[data-variant=v113_apex_side_1]').click();page.locator('#add-selected-view').click()
  tool(page,'text');page.locator('#add-selected-view').click();colour(page,'sticker-color','#ff00ff')
  check(len(page.evaluate('__test.layers("side")'))==3 and bool(page.evaluate('__test.pixels().side')),'mixed emblem/vector/text stack remains drawable and readable')
  saved=page.evaluate('JSON.stringify(__test.project())');before=page.evaluate('__test.project().images')
  assert page.evaluate('async s=>__test.projectOpen(new File([s],"tinted.rcbody"))',saved)
  check(page.evaluate('__test.project().images')==before,'recoloured mixed stack survives project save/reopen')
  page.evaluate('__test.recovery()');page.reload();page.locator('#recovery-resume').wait_for(state='visible');page.locator('#recovery-resume').click()
  page.wait_for_function('__test.layers("side")?.length===3')
  check(page.evaluate('__test.project().images')==before,'recoloured mixed stack recovers after browser page reload')
  result['pdfs']=[]
  for scope in ['visible','complete']:
   page.evaluate('s=>document.getElementById("pdf-scope").value=s',scope)
   for mirror in [False,True]:
    pdf=page.evaluate('__test.pdf',mirror);check(pdf['pages']>0,f'recoloured mixed stack PDF {scope}/mirror={mirror}');result['pdfs'].append(dict(scope=scope,mirror=mirror,**pdf))
  check(not external_requests,'emblem operations never request external PNG files')
  check(not result['errors'],'no uncaught JS/security errors across colour, placement, save, recovery or PDF')
  page.screenshot(path=str(a.out/'fixed.png'));ctx.close();b.close()
 result['status']='passed';(a.out/'results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print('RESULT',a.out/'results.json',flush=True)

if __name__=='__main__':main()
