"""User-visible logo colours: pre-placement, live preview, selected layer and restore.
Python 3.12 / Playwright / Chromium. Outputs only to --out.
"""
from pathlib import Path
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
import argparse,base64,hashlib,json,mimetypes,runpy
ROOT=Path(__file__).resolve().parents[1]
B=runpy.run_path(str(ROOT/'tests/interaction_v1131.py'))
BRIDGE=B['BASE_BRIDGE']+B['EXTRA']
BRIDGE+='''window.__test.logoState=id=>{const s=imgs[targetView].stickers.find(s=>s.id===id);const copy={...s,logoTintEnabled:false};const actual=logoTinted(s),original=logoTinted(copy),c=document.createElement('canvas');c.width=original.naturalWidth;c.height=original.naturalHeight;const x=c.getContext('2d');x.drawImage(original,0,0);const a=x.getImageData(0,0,c.width,c.height).data;x.clearRect(0,0,c.width,c.height);x.drawImage(actual,0,0);const b=x.getImageData(0,0,c.width,c.height).data;let diff=0,alpha=0;for(let i=0;i<a.length;i+=4){if(a[i+3]!==b[i+3])alpha++;if(a[i+3]>20&&(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2]))diff++;}return {diff,alpha,tint:s.logoTintEnabled,color:s.color,accent:s.accent,variant:s.variant};};'''

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--out',type=Path,required=True);ap.add_argument('--quick',action='store_true');a=ap.parse_args();a.out.mkdir(parents=True,exist_ok=True)
 result={'version':'1.13.2','checks':[],'errors':[],'limits':['Chromium/Linux only; native Windows/Chrome validation and new-body cotas remain pending.']}
 def check(ok,label):
  assert ok,label
  result['checks'].append(label);print('PASS',label,flush=True)
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);page=b.new_page(viewport={'width':1600,'height':1050});result['browser']=b.version
  page.on('pageerror',lambda e:result['errors'].append(str(e)));page.on('dialog',lambda d:d.accept())
  def route(r):
   f=(ROOT/unquote(urlparse(r.request.url).path).lstrip('/')).resolve()
   if not f.is_relative_to(ROOT) or not f.is_file():r.fulfill(status=404);return
   data=f.read_bytes()
   if f.name=='RC_Bodywork.html':data=data.decode().replace('start();\n})();',BRIDGE+'start();\n})();').encode()
   # Reproduce the cross-origin risk on paths; all emblems must actually use embedded bytes.
   if f.name=='rc-graphics.js':data=data.decode().replace('"url":"assets/emblemas/','"url":"http://127.0.0.1/assets/emblemas/').encode()
   r.fulfill(body=data,content_type=mimetypes.guess_type(f)[0] or 'application/octet-stream')
  page.route('http://localhost/**',route);page.route('http://127.0.0.1/**',route);page.goto('http://localhost/RC_Bodywork.html')
  data=json.loads((ROOT/'examples/Lola_VIP_Edu.rcbody').read_text())
  for photo in data['images'].values():
   if photo:photo['stickers']=[]
  assert page.evaluate('async s=>__test.projectOpen(new File([s],"empty.rcbody"))',json.dumps(data))
  page.locator('#mode-stickers').click();page.locator('details').evaluate_all('(ds)=>ds.forEach(d=>d.open=false)')
  originals=['logo_'+str(n).zfill(2) for n in range(1,13)]
  badges=page.evaluate('RCGraphics.badges.map(v=>v.id)');check(len(badges)==7,'7 relief emblems available (3 preserved + 4 new)')
  matrix=page.evaluate('__test.colorMatrix',originals+badges);result['colourMatrix']=matrix
  check(all(x['alphaMismatch']==0 and x['ink']>0 and x['changed']>0 for x in matrix),'95 palette cases preserve alpha and visibly recolour originals/emblems')
  check(all(x['silverChanged']==0 for x in matrix if x['id'].startswith('badge_')),'7 emblems retain silver rims and highlights')
  for view in ['side','top']:
   for variant in (['logo_01','logo_04','badge_turbo','badge_crown'] if a.quick else originals+badges):
    page.evaluate('__test.clear()');page.locator('#target-'+view).click();page.locator('[data-tool=logo]').click()
    page.locator('#logo-original-colors').click();page.locator('[data-variant='+variant+']').click()
    check(page.locator('#creation-tools').evaluate('el=>el.nextElementSibling.classList.contains("variant-card")'),f'{view}/{variant}: colour controls precede catalogue')
    preview=page.locator('[data-variant='+variant+'] canvas');raw=preview.evaluate('c=>c.toDataURL()')
    page.locator('#sticker-color').fill('#00ff00');check(page.evaluate('document.activeElement.id')=='sticker-color',f'{view}/{variant}: live preview keeps input focus');page.locator('#sticker-accent').fill('#0044ff')
    coloured=page.locator('[data-variant='+variant+'] canvas').evaluate('c=>c.toDataURL()')
    check(coloured!=raw,f'{view}/{variant}: preview changes before placing')
    check('personalizados' in page.locator('#logo-color-state').inner_text(),f'{view}/{variant}: visible colour state')
    page.locator('#add-selected-view').click();s=page.evaluate('__test.layers',view)[0]
    state=page.evaluate('__test.logoState',s['id'])
    check(state['tint'] and state['color']=='#00ff00' and state['accent']=='#0044ff' and state['diff']>0 and state['alpha']==0,f'{view}/{variant}: chosen colours applied to new layer')
    page.locator('#sticker-color').fill('#ff00ff');page.locator('#sticker-accent').fill('#00ffff')
    changed=page.evaluate('__test.logoState',s['id']);check(changed['diff']>0 and changed['alpha']==0,f'{view}/{variant}: selected layer also recolours')
    page.locator('#logo-original-colors').click();state=page.evaluate('__test.logoState',s['id'])
    check(not state['tint'] and state['diff']==0,f'{view}/{variant}: restore originals is exact')
    page.evaluate('__test.undoAction()');state=page.evaluate('__test.logoState',s['id'])
    check(state['tint'] and state['color']=='#ff00ff' and state['accent']=='#00ffff',f'{view}/{variant}: undo restores custom colours')
  # Independent primary/accent changes must have a visible effect on every original logo.
  role_changes=page.evaluate('''async()=>{const rows=[];for(let n=1;n<=12;n++){const id='logo_'+String(n).padStart(2,'0');const states=[['#171a22','#f42c38'],['#00ff00','#f42c38'],['#171a22','#0044ff']].map(([color,accent])=>__test.logoTinted({variant:id,color,accent,logoTintEnabled:true}));const pixels=states.map(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data);let primary=0,accent=0;for(let i=0;i<pixels[0].length;i+=4)if(pixels[0][i+3]>20){for(let j=0;j<3;j++){if(pixels[0][i+j]!==pixels[1][i+j]){primary++;break;}}for(let j=0;j<3;j++){if(pixels[0][i+j]!==pixels[2][i+j]){accent++;break;}}}rows.push({id,primary,accent});}return rows;}''')
  result['independentChannels']=role_changes;check(all(r['primary']>0 and r['accent']>0 for r in role_changes),'both colour channels independently alter every original JHR logo')
  # Explicit apply also works when the picker values themselves did not change.
  page.locator('#logo-original-colors').click()
  check(not page.evaluate('__test.logoState',s['id'])['tint'],'original mode before explicit apply')
  page.locator('#logo-apply-colors').click()
  check(page.evaluate('__test.logoState',s['id'])['tint'],'explicit apply enables selected layer without changing input values')
  page.evaluate('__test.clear()');page.locator('[data-tool=logo]').click();page.locator('[data-variant=logo_04]').click();page.locator('#logo-original-colors').click()
  page.locator('#logo-apply-colors').click();page.locator('#add-selected-view').click();added=page.evaluate('__test.layers("top")[0]')
  check(page.evaluate('__test.logoState',added['id'])['tint'],'explicit apply also prepares next original logo')
  # Lock protects both the painting and original-colour action.
  page.evaluate('__test.lock(true)')
  check(page.locator('#sticker-color').is_disabled() and page.locator('#sticker-accent').is_disabled() and page.locator('#logo-original-colors').is_disabled() and page.locator('#logo-apply-colors').is_disabled(),'locked layer disables colour changes and reset')
  page.evaluate('__test.lock(false)')
  saved=page.evaluate('JSON.stringify(__test.project())');check(json.loads(saved)['version']=='1.13.2-rc-bodywork','new resource version protects projects from older catalogues')
  before=page.evaluate('__test.project().images');assert page.evaluate('async s=>__test.projectOpen(new File([s],"custom.rcbody"))',saved)
  check(page.evaluate('__test.project().images')==before,'custom colours save and reopen intact')
  page.evaluate('__test.recovery()');page.reload();page.locator('#recovery-resume').wait_for(state='visible');page.locator('#recovery-resume').click();page.wait_for_function('__test.layers("top")?.length===1')
  check(page.evaluate('__test.project().images')==before,'custom colours recover after page reload')
  page.evaluate('__test.setTargetView("top");__test.setTool("logo")')
  # Show new emblems without mutating the layer for the preview capture.
  page.locator('details').evaluate_all('(ds)=>ds.forEach(d=>d.open=false)');page.evaluate("document.querySelector('.sticker-scroll').scrollTop=0")
  page.screenshot(path=str(a.out/'catalogue.png'))
  page.locator('[data-tool=vector]').click();check(page.locator('#creation-tools').evaluate('el=>el.previousElementSibling.classList.contains("variant-card")'),'other categories keep their existing control order')
  result['pdfs']=[]
  for mirror in [False,True]:
   pdf=page.evaluate('__test.pdf',mirror);check(pdf['pages']>0,f'new coloured emblem exports PDF mirror={mirror}');result['pdfs'].append(dict(mirror=mirror,**pdf))
  check(not result['errors'],'no unexpected JavaScript or Canvas origin errors')
  b.close()
 result['status']='passed';(a.out/'results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print('RESULT',a.out/'results.json',flush=True)

if __name__=='__main__':main()
