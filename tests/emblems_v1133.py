"""Approved artwork, retired-resource compatibility and packaged-app smoke test.
Python 3.12 / Playwright / Chromium; all outputs go to --out.
"""
from pathlib import Path
from urllib.parse import urlparse, unquote
from playwright.sync_api import sync_playwright
import argparse, json, mimetypes, runpy
ROOT = Path(__file__).resolve().parents[1]
BRIDGE = runpy.run_path(str(ROOT/'tests/logos_v1133.py'))['BRIDGE']
NEW = ['badge_panther', 'badge_chicane', 'badge_finish']
OLD = ['badge_torque', 'badge_crown']

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--root', type=Path, default=ROOT)
    ap.add_argument('--baseline', type=Path, required=True)
    ap.add_argument('--out', type=Path, required=True)
    a=ap.parse_args(); a.out.mkdir(parents=True, exist_ok=True)
    result={'checks':[], 'errors':[], 'root':str(a.root)}
    def check(ok, label):
        assert ok, label
        result['checks'].append(label);print('PASS', label, flush=True)
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
        def page_for(folder):
            page=browser.new_page(viewport={'width':1600,'height':1050})
            page.on('pageerror',lambda e:result['errors'].append(str(e)))
            page.on('dialog',lambda d:d.accept())
            def route(r):
                f=(folder/unquote(urlparse(r.request.url).path).lstrip('/')).resolve()
                if not f.is_relative_to(folder.resolve()) or not f.is_file():r.fulfill(status=404);return
                data=f.read_bytes()
                if f.name=='RC_Bodywork.html':data=data.decode().replace('start();\n})();',BRIDGE+'start();\n})();').encode()
                r.fulfill(body=data,content_type=mimetypes.guess_type(f)[0] or 'application/octet-stream')
            page.route('http://localhost/**',route);page.goto('http://localhost/RC_Bodywork.html')
            return page
        old=page_for(a.baseline);page=page_for(a.root)
        fixture=json.loads((a.root/'examples/Lola_VIP_Edu.rcbody').read_text())
        for image in fixture['images'].values():
            if image:image['stickers']=[]
        def open_project(pg, project):
            return pg.evaluate('async s=>__test.projectOpen(new File([s],"test.rcbody"))',json.dumps(project))
        check(open_project(old,fixture) and open_project(page,fixture),'historical example opens in both versions')
        # Construct an actual V1.13.2 project containing both retired designs.
        old.evaluate("__test.setTargetView('side');__test.setTool('logo')")
        for id in OLD:
            old.evaluate('id=>{__test.setVariant(id);__test.addCentered("side");}',id)
        legacy=old.evaluate('__test.project()')
        expected=old.evaluate('__test.logoHashes',OLD)
        check(open_project(page,legacy),'V1.13.2 project with Torque and Corona opens')
        check([s['variant'] for s in page.evaluate('__test.layers("side")')]==OLD,'retired IDs are preserved, never replaced')
        check(page.evaluate('__test.logoHashes',OLD)==expected,'retired emblems retain identical rendered pixels in three palettes')
        check(page.evaluate('__test.project().images')==legacy['images'],'legacy project photos, layers and calibration remain identical')
        page.locator('#mode-stickers').click();page.locator('#target-side').click();page.locator('[data-tool=logo]').click()
        visible=page.locator('#variant-grid [data-variant]').evaluate_all('(els)=>els.map(e=>e.dataset.variant)')
        check(all(id in visible for id in NEW) and all(id not in visible for id in OLD),'approved replacements visible; Torque and Corona hidden from catalogue')
        check(len([id for id in visible if id.startswith('badge_')])==8,'exactly eight active emblems')
        check(len([id for id in visible if id.startswith('logo_')])==12,'all twelve original logos remain visible')
        # Validate transparency and silver on every pixel, including alpha=254.
        stats=page.evaluate('''async ids=>{const rows=[];for(const id of ids){const im=__test.originalLogo(id);await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);const a=x.getImageData(0,0,c.width,c.height).data;const b=__test.logoTinted({variant:id,color:'#00ff00',accent:'#0044ff',logoTintEnabled:true}).getContext('2d').getImageData(0,0,c.width,c.height).data;let transparent=0,solid=0,silver=0,changedSilver=0,red=0,dark=0;for(let i=0;i<a.length;i+=4){if(!a[i+3])transparent++;if(a[i+3]>240){solid++;const lum=(a[i]+a[i+1]+a[i+2])/3,isRed=a[i]>a[i+1]+25&&a[i]>a[i+2]+20;if(isRed)red++;else if(lum<85)dark++;else{silver++;if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])changedSilver++;}}}rows.push({id,width:im.width,height:im.height,transparent,solid,silver,changedSilver,red,dark});}return rows;}''',NEW)
        result['artwork']=stats
        for row in stats:
            check(row['transparent']>1000 and row['solid']>10000 and row['silver']>1000 and row['changedSilver']==0 and row['red']>500 and row['dark']>500,row['id']+': transparent silhouette, two paint zones, unchanged silver')
        # New assets survive save/reopen, while the old app safely rejects them.
        page.evaluate('__test.clear()')
        for id in NEW:page.evaluate('id=>{__test.setVariant(id);__test.addCentered("side");}',id)
        saved=page.evaluate('__test.project()')
        check(saved['version']=='1.13.3-rc-bodywork' and open_project(page,saved),'new project format saves and reopens')
        check([s['variant'] for s in page.evaluate('__test.layers("side")')]==NEW,'all three new identifiers survive reopening')
        check(not open_project(old,saved),'V1.13.2 rejects unknown resource format safely')
        check(old.evaluate('__test.project().images')==legacy['images'],'old application keeps its current project after rejection')
        page.locator('details').evaluate_all('(els)=>els.forEach(e=>e.open=false)')
        page.locator('[data-tool=logo]').click()
        page.screenshot(path=str(a.out/'catalogue.png'))
        # Render the exact delivered PNG bytes on a checkerboard for inspection.
        preview=browser.new_page(viewport={'width':1500,'height':650},device_scale_factor=1)
        artwork=page.evaluate('RCGraphics.badges.filter(b=>'+json.dumps(NEW)+'.includes(b.id)).map(b=>({name:b.name,uri:b.uri}))')
        html='<style>body{margin:0;background:#e7ebef;font:22px Arial;color:#172433}h1{text-align:center;font-size:28px}.row{display:flex;gap:20px;padding:25px}.item{width:470px;text-align:center}.tile{height:460px;background:repeating-conic-gradient(#eee 0% 25%,#fff 0% 50%) 0/24px 24px;border-radius:12px;display:flex;align-items:center;justify-content:center}img{max-width:95%;max-height:95%}</style><h1>RC Bodywork V1.13.3 · Emblemas incorporados</h1><div class="row">'
        for item in artwork:html+='<div class="item"><div class="tile"><img src="'+item['uri']+'"></div><p>'+item['name']+'</p></div>'
        preview.set_content(html+'</div>');preview.locator('img').evaluate_all('els=>Promise.all(els.map(e=>e.decode()))')
        preview.screenshot(path=str(a.out/'NUEVOS_EMBLEMAS.png'))
        check(not result['errors'],'no JavaScript errors')
        result.update(status='passed',browser=browser.version)
        browser.close()
    (a.out/'results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
