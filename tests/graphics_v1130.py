"""V1.13.0 graphics and regression checks. Python 3.12 + Playwright + Chromium.
Usage: python tests/graphics_v1130.py --baseline /path/to/V1.12.1 --out /path/to/scratch
No test bridge is shipped in the application; the route injects it in browser memory only.
"""
import argparse, hashlib, json, mimetypes
from pathlib import Path
from urllib.parse import urlparse, unquote
from playwright.sync_api import sync_playwright

BRIDGE = """window.__test={project,projectOpen,setTool,setTargetView,setMode,addCentered,undoAction,refreshStickerUI,redrawAll,
 layers:w=>imgs[w]?.stickers,
 selected:()=>selected,
 clear:()=>{for(const w of ['top','side'])if(imgs[w])imgs[w].stickers=[];selected=null;redrawAll();},
 lock:flag=>{const s=imgs[selected.which].stickers.find(s=>s.id===selected.id);s.locked=flag;refreshStickerUI();},
 pdf:async(mirror)=>{const pages=await rcBuildPdfPages(mirror);const b=await rcPdfFromPageCanvases(pages).arrayBuffer();return {pages:pages.length,hash:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b))).map(x=>x.toString(16).padStart(2,'0')).join('')};},
 pixels:()=>Object.fromEntries(['top','side'].filter(w=>imgs[w]).map(w=>[w,document.getElementById('canvas-'+w).toDataURL()])),
 recovery:async()=>{await autosaver.flush('manual',true);},
 recoveryHistory,
 logoPixels:async()=>{const out={};for(let n=1;n<=12;n++){const id='logo_'+String(n).padStart(2,'0');await LOGO_IMAGES[id].decode();const c=document.createElement('canvas');c.width=600;c.height=240;renderSticker(c.getContext('2d'),{type:'logo',variant:id,x:.5,y:.5,size:80,sx:100,sy:100,angle:0,color:'#171a22',accent:'#f42c38',logoTintEnabled:false},600,240);out[id]=c.toDataURL();}return out;}
};\n"""

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--baseline',type=Path,required=True);ap.add_argument('--out',type=Path,required=True);ap.add_argument('--project-version',default='1.13.0-rc-bodywork')
    args=ap.parse_args();root=Path(__file__).resolve().parents[1];args.out.mkdir(parents=True,exist_ok=True)
    result={'version':'1.13.0','checks':[],'errors':[],'limits':['Chromium/Linux software checks; no native Windows or physical printing validation.','New-body calibration/cotas remains pending user verification.']}
    def check(condition,name):
        assert condition,name
        result['checks'].append(name)
        print('PASS',name,flush=True)
    def page_for(browser,folder):
        context=browser.new_context(viewport={'width':1366,'height':900},device_scale_factor=2)
        page=context.new_page()
        page.on('pageerror',lambda e:result['errors'].append(str(e)))
        page.on('dialog',lambda dialog:dialog.accept())
        def route(r):
            path=(folder/unquote(urlparse(r.request.url).path).lstrip('/')).resolve()
            if not path.is_relative_to(folder.resolve()) or not path.is_file():r.fulfill(status=404,body='not found');return
            body=path.read_bytes()
            if path.name=='RC_Bodywork.html':
                s=body.decode();assert 'start();\n})();' in s
                body=s.replace('start();\n})();',BRIDGE+'start();\n})();').encode()
            r.fulfill(body=body,content_type=mimetypes.guess_type(path)[0] or 'application/octet-stream')
        page.route('http://localhost/**',route)
        page.goto('http://localhost/RC_Bodywork.html');page.wait_for_function('window.__test && window.RCVector')
        return context,page
    def open_project(page,data):
        ok=page.evaluate('async s=>await __test.projectOpen(new File([s],"test.rcbody",{type:"application/json"}))',data)
        assert ok,'projectOpen failed'
        page.evaluate('async()=>{await RCText.ready();await new Promise(r=>setTimeout(r,100));}')
    def vector_hashes(page):
        return page.evaluate('''async()=>{const out={};for(const v of RCVector.designs){const c=document.createElement('canvas');c.width=600;c.height=600;const x=c.getContext('2d');x.translate(300,300);const scale=Math.min(560/v.width,560/v.height);RCVector.draw(x,{variant:v.id,color:'#1641b8',accent:'#00d5ed'},v.width*scale,v.height*scale);out[v.id]=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',x.getImageData(0,0,600,600).data))).map(x=>x.toString(16).padStart(2,'0')).join('');}return out;}''')
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        result['browser']=browser.version
        oldctx,old=page_for(browser,args.baseline)
        ctx,page=page_for(browser,root)
        oldhash=vector_hashes(old);newhash=vector_hashes(page)
        check(all(newhash[k]==v for k,v in oldhash.items()),f'{len(oldhash)} legacy vector renders pixel-identical')
        check(len(newhash)-len(oldhash)==18,'18 additional vector designs')
        check(old.evaluate('__test.logoPixels()')==page.evaluate('__test.logoPixels()'),'12 original logos render pixel-identical')
        # SVG source and Canvas produce the same geometry, allowing alpha edge rounding.
        coverage=page.evaluate('''async()=>{const rows=[];for(const v of RCGraphics.designs){const c=document.createElement('canvas');c.width=v.width;c.height=v.height;const x=c.getContext('2d');x.translate(v.width/2,v.height/2);RCVector.draw(x,{variant:v.id,color:'#171a22',accent:'#f42c38'},v.width,v.height);const a=x.getImageData(0,0,c.width,c.height).data;let ink=0,border=0,hit=0;for(let y=0;y<c.height;y++)for(let z=0;z<c.width;z++){const alpha=a[(y*c.width+z)*4+3];if(alpha>0){ink++;if(!y||!z||y===c.height-1||z===c.width-1)border++;if(alpha===255&&RCVector.contains({variant:v.id},z+.5-c.width/2,y+.5-c.height/2,c.width,c.height))hit++;}}const im=new Image();im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(RCVector.svg(v.id,'#171a22','#f42c38'));await im.decode();const s=document.createElement('canvas');s.width=c.width;s.height=c.height;s.getContext('2d').drawImage(im,0,0);const b=s.getContext('2d').getImageData(0,0,c.width,c.height).data;let differing=0;for(let i=0;i<a.length;i++)if(Math.abs(a[i]-b[i])>1)differing++;rows.push({id:v.id,ink,border,hit,differing});}return rows;}''')
        result['newVectorCoverage']=coverage
        check(all(x['ink']>100 and x['border']==0 and x['hit']>100 for x in coverage),'18 paths nonempty, not clipped at border, hit-test works')
        check(all(x['differing']==0 for x in coverage),'18 SVG exports match Canvas at source size (1 channel level tolerance)')
        page.locator('#mode-stickers').click();page.locator('[data-tool=vector]').click()
        page.locator('#graphics-search').fill('ÁPEX')
        check(page.locator('#variant-grid .variant-btn').count()==3,'accent-insensitive search')
        page.locator('#graphics-search').fill('no-such-design')
        check(page.locator('.graphics-empty').is_visible(),'empty search explains reset')
        page.locator('#graphics-reset').click();page.locator('#graphics-family').select_option('Pulse')
        check(page.locator('#variant-grid .variant-btn').count()==3,'family filter lateral')
        page.locator('#target-top').click()
        check(page.locator('#variant-grid .variant-btn').count()==3,'family filter superior incl mirrored pair and center')
        page.locator('#graphics-background').select_option('dark')
        check(page.locator('#variant-grid').get_attribute('data-background')=='dark','preview-only background switch')
        for width in [1920,1366,1024,780,600]:
            page.set_viewport_size({'width':width,'height':900})
            check(page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'no horizontal document overflow at {width}px')
            check(page.locator('#graphics-search').is_visible(),f'catalogue accessible at {width}px')
        page.set_viewport_size({'width':1366,'height':900})
        data=(root/'examples/Lola_VIP_Edu.rcbody').read_text()
        open_project(old,data);open_project(page,data)
        # Exclude selection decoration and compare actual old editor output.
        old.evaluate('__test.setMode("paint")');page.evaluate('__test.setMode("paint")')
        check(old.evaluate('__test.pixels()')==page.evaluate('__test.pixels()'),'legacy Lola editor views pixel-identical')
        result['legacyPdf']=[]
        for scope in ['visible','complete']:
            for layout in ['legacy','optimized']:
                for mirror in [False,True]:
                    for pg in [old,page]:pg.evaluate('o=>{document.getElementById("pdf-scope").value=o.scope;document.getElementById("pdf-layout").value=o.layout;}',dict(scope=scope,layout=layout))
                    a=old.evaluate('__test.pdf',mirror);b=page.evaluate('__test.pdf',mirror)
                    check(a==b,f'legacy Lola PDF byte-identical: {scope}/{layout}/mirror={mirror}')
                    result['legacyPdf'].append(dict(scope=scope,layout=layout,mirror=mirror,**b))
        incompatible=json.loads(data);incompatible['version']=args.project_version
        check(old.evaluate('async s=>await __test.projectOpen(new File([s],"new.rcbody"))',json.dumps(incompatible)) is False,'V1.12.1 rejects V1.13.0 projects explicitly')
        oldctx.close()
        page.evaluate('__test.clear();__test.setMode("stickers");__test.setTargetView("side");__test.setTool("vector")')
        page.locator('#graphics-reset').click()
        page.locator('[data-variant=v113_apex_side_1]').click();page.locator('#add-selected-view').click()
        check(page.evaluate('__test.layers("side").length')==1,'add new vector through UI')
        before=page.evaluate('JSON.stringify(__test.layers("side"))')
        page.get_by_role('button',name='Azul eléctrico ·',exact=False).click()
        check(page.evaluate('__test.layers("side")[0].color')=='#1641b8','palette recolours selected vector')
        page.evaluate('__test.undoAction()')
        check(page.evaluate('JSON.stringify(__test.layers("side"))')==before,'one undo restores entire two-colour palette')
        page.evaluate('__test.lock(true)')
        locked=page.evaluate('JSON.stringify(__test.layers("side"))')
        page.get_by_role('button',name='Lima ·',exact=False).click()
        check(page.evaluate('JSON.stringify(__test.layers("side"))')==locked,'locked layer palette cannot alter project')
        page.evaluate('__test.lock(false)')
        before=page.evaluate('JSON.stringify(__test.project().images)')
        page.locator('#graphics-search').fill('Facet');page.locator('#graphics-background').select_option('light')
        check(page.evaluate('JSON.stringify(__test.project().images)')==before,'catalogue search/background do not mutate photos or layers')
        creation=page.evaluate('''()=>{const d=__test.project().images.side;const photo=new Image();photo.src=d.src;const known=(t,id)=>t==='vector'&&!!RCVector.get(id);const ref={width:1167,height:768};const b=RCSticker.make(d.stickers,d.stickers.map(s=>s.id),'side',ref,'Apex test',known);return RCSticker.parse(JSON.stringify(b),known);}''')
        check(creation['items'][0]['variant']=='v113_apex_side_1','new vector rcsticker make/parse preserves variant')
        saved=page.evaluate('JSON.stringify(__test.project())')
        check(json.loads(saved)['version']==args.project_version,'new projects identify their resource format explicitly')
        open_project(page,saved)
        check(json.loads(page.evaluate('JSON.stringify(__test.project().images)'))==json.loads(before),'new vector project save/reopen lossless')
        result['newPdf']=[]
        for scope in ['visible','complete']:
            page.evaluate('v=>{document.getElementById("pdf-scope").value=v;document.getElementById("pdf-layout").value="optimized";}',scope)
            for mirror in [False,True]:
                pdf=page.evaluate('__test.pdf',mirror);check(pdf['pages']>0,f'new vector real PDF: {scope}/mirror={mirror}')
                result['newPdf'].append(dict(scope=scope,mirror=mirror,**pdf))
        # Processed emblems are actual transparent PNGs, not placeholders.
        page.evaluate('__test.clear();__test.setMode("stickers");__test.setTargetView("side");__test.setTool("logo")')
        for id in ['badge_apex','badge_pulse','badge_facet']:
            page.locator('[data-variant='+id+']').click();page.locator('#add-selected-view').click()
        check(page.evaluate('__test.layers("side").map(x=>x.variant)')==['badge_apex','badge_pulse','badge_facet'],'add 3 PhotoCraft emblems through catalogue UI')
        alpha=page.evaluate("""async()=>{const out=[];for(const v of RCGraphics.badges){const im=new Image();im.src=v.url;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);const a=x.getImageData(0,0,c.width,c.height).data;let transparent=0,opaque=0,semi=0;for(let i=3;i<a.length;i+=4){if(a[i]===0)transparent++;else if(a[i]===255)opaque++;else semi++;}out.push({id:v.id,w:c.width,h:c.height,transparent,opaque,semi});}return out;}""")
        result['processedEmblems']=alpha
        check(all(x['transparent']>100 and x['opaque']>100 and x['semi']>0 and x['w']>900 for x in alpha),'3 high-resolution emblems retain transparent antialiased edges')
        emblems=page.evaluate('JSON.stringify(__test.project())');open_project(page,emblems)
        check(page.evaluate('__test.layers("side").map(x=>x.variant)')==['badge_apex','badge_pulse','badge_facet'],'processed emblems save and reopen')
        for mirror in [False,True]:
            pdf=page.evaluate('__test.pdf',mirror)
            check(pdf['pages']>0,f'processed emblems real PDF mirror={mirror}')
        # All new resources survive sanitizing/open, both views, both palettes.
        bundle=json.loads(saved)
        for view in ['side','top']:
            template=json.loads(saved)['images']['side']['stickers'][0]
            ids=page.evaluate('view=>RCGraphics.designs.filter(v=>v.view===view).map(v=>v.id)',view)
            bundle['images'][view]['stickers']=[dict(template,id=i+100,variant=id,x=.5,y=.5) for i,id in enumerate(ids)]
        open_project(page,json.dumps(bundle))
        check(page.evaluate('[__test.layers("side").length,__test.layers("top").length]')==[9,9],'all 18 new variants survive project loading')
        page.evaluate('__test.setMode("stickers");__test.setTargetView("side");__test.setTool("vector")')
        page.locator('#graphics-reset').click()
        page.screenshot(path=str(args.out/'catalogue.png'))
        page.locator('#graphics-family').select_option('Apex')
        page.locator('#variant-grid').scroll_into_view_if_needed()
        page.locator('#variant-grid').screenshot(path=str(args.out/'apex.png'))
        expected_images=page.evaluate('__test.project().images')
        page.evaluate('__test.recovery()')
        page.reload();page.wait_for_function('window.__test && window.RCVector')
        page.locator('#recovery-resume').wait_for(state='visible')
        page.locator('#recovery-resume').click()
        page.wait_for_function('__test.layers("side")?.length===9 && __test.layers("top")?.length===9')
        check(page.evaluate('__test.project().images')==expected_images,'18 new vector layers recover after page reload with photos intact')
        check(not result['errors'],'no unexpected JavaScript errors')
        ctx.close();browser.close()
    result['status']='passed'
    (args.out/'results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    print('RESULT',args.out/'results.json',flush=True)

if __name__=='__main__':main()
