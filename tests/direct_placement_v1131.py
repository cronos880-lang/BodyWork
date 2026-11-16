"""Real pointer creation on the photo followed by recolouring, both views.
Usage: python tests/direct_placement_v1131.py --out /path/to/scratch
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from urllib.parse import urlparse,unquote
import argparse,mimetypes,json,runpy
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--out',type=Path,required=True);out=parser.parse_args().out;out.mkdir(parents=True,exist_ok=True)
module=runpy.run_path(str(root/'tests/interaction_v1131.py'));bridge=module['BASE_BRIDGE']+module['EXTRA']
bridge+='''window.__test.surface=view=>{const d=imgs[view];let best=null,bestD=Infinity;for(let y=5;y<d.h-5;y+=5)for(let x=5;x<d.w-5;x+=5)if(d.bodyAlpha[(y*d.w+x)*4+3]>150){const dist=(x/d.w-.5)**2+(y/d.h-.5)**2;if(dist<bestD){bestD=dist;best={x:x/d.w,y:y/d.h};}}return best;};\n'''
fixture=json.loads((root/'examples/Lola_VIP_Edu.rcbody').read_text())
for im in fixture['images'].values():
 if im:im['stickers']=[]
result={'cases':[],'errors':[]}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);page=b.new_page(viewport={'width':1600,'height':1050})
 page.on('pageerror',lambda e:result['errors'].append(str(e)));page.on('dialog',lambda d:d.accept())
 def route(r):
  f=root/unquote(urlparse(r.request.url).path).lstrip('/')
  if not f.is_file():r.fulfill(status=404);return
  data=f.read_bytes()
  if f.name=='RC_Bodywork.html':data=data.decode().replace('start();\n})();',bridge+'start();\n})();').encode()
  r.fulfill(body=data,content_type=mimetypes.guess_type(f)[0] or 'application/octet-stream')
 page.route('http://localhost/**',route);page.goto('http://localhost/RC_Bodywork.html')
 assert page.evaluate('async s=>__test.projectOpen(new File([s],"fixture.rcbody"))',json.dumps(fixture))
 page.locator('#mode-stickers').click();page.locator('details').evaluate_all('(ds)=>ds.forEach(d=>d.open=false)')
 for view in ['side','top']:
  for kind,id in [('logo','badge_apex'),('logo','badge_pulse'),('logo','badge_facet'),('logo','logo_01'),('vector','v113_apex_side_1' if view=='side' else 'v113_apex_top_L'),('text',None),('kit',None)]:
   page.evaluate('__test.clear()');page.locator('#target-'+view).click();page.locator('[data-tool='+kind+']').click()
   if kind=='text':id=page.locator('#variant-grid .variant-btn').first.get_attribute('data-variant')
   if kind=='kit':id=page.evaluate('__test.rasterCatalogue',view)[0]
   page.locator('[data-variant='+id+']').click()
   surface=page.evaluate('__test.surface',view);pt=page.evaluate('o=>__test.point(o.view,o.x,o.y)',dict(view=view,**surface))
   page.mouse.move(pt['x'],pt['y']);page.mouse.down();page.mouse.move(pt['x']+10,pt['y']+6,steps=5);page.mouse.up()
   layers=page.evaluate('__test.layers',view)
   assert len(layers)==1 and layers[0]['variant']==id,(view,id,layers)
   assert abs(layers[0]['x']-surface['x']-10/pt['sx'])<.003 and abs(layers[0]['y']-surface['y']-6/pt['sy'])<.003,(view,id,'position')
   page.locator('#sticker-color').fill('#00ff00');page.locator('#sticker-accent').fill('#0000ff')
   assert page.evaluate('__test.pixels()')[view]
   result['cases'].append({'view':view,'type':kind,'variant':id,'clickAndDragPlacesExactlyOne':True,'recolourCanvasReadable':True})
   print('PASS direct canvas placement + colour',view,id,flush=True)
 assert not result['errors'],result['errors']
 b.close()
result['status']='passed';(out/'direct-placement-results.json').write_text(json.dumps(result,indent=2))
