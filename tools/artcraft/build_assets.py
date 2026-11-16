"""Build original Bodywork resources with pinned official ArtCraft CLIs.
Python 3.12 stdlib only. Run in the source checkout, never on user photos/projects.
BWORK_ARTCRAFT_HOME selects the verified CLI packages (default: ../work/artcraft-cli).
"""
from pathlib import Path
import hashlib,json,os,subprocess,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[2]
TOOLS=Path(os.environ.get('BWORK_ARTCRAFT_HOME',ROOT.parent/'work/artcraft-cli'))
WORK=ROOT.parent/'work/artcraft-cli/build'
VERSIONS={'vectorcraft':'0.24.1','photocraft':'0.23.1','figcraft':'0.18.1'}
WORK.mkdir(parents=True,exist_ok=True)
ENV=dict(os.environ,XDG_CONFIG_HOME=str(WORK/'config'),XDG_CACHE_HOME=str(WORK/'cache'),XDG_DATA_HOME=str(WORK/'data'),VECTORCRAFT_NO_PREFS='1',FIGCRAFT_NO_SYSTEM_FONTS='1')
LOG=[]
def cli(name,*args):
 binary=TOOLS/f'{name}-{VERSIONS[name]}-linux-x86_64/bin/{name}-cli'
 result=subprocess.run([str(binary),*map(str,args)],env=ENV,capture_output=True,text=True,check=True)
 LOG.append({'tool':name,'version':VERSIONS[name],'args':list(map(str,args)),'stdout':result.stdout,'stderr':result.stderr})
 return result.stdout

def paths_from_svg(source):
 tree=ET.fromstring(source)
 out=[]
 def visit(node,fill='#000000'):
  if node.get('transform'):raise ValueError('Unexpected transform in CLI output')
  tag=node.tag.split('}')[-1];fill=node.get('fill',fill)
  if tag in ['title','defs','metadata']:return
  if tag in ['path','polygon']:
   assert node.get('fill-rule','nonzero')=='nonzero'
   if tag=='polygon':
    points=node.get('points').split();d='M'+' L'.join(points)+' Z'
   else:d=node.get('d')
   assert fill in ['#171a22','#f42c38'],fill
   out.append(['A' if fill=='#f42c38' else 'P',d])
  elif tag not in ['svg','g']:raise ValueError('Unexpected element '+tag)
  for child in node:visit(child,fill)
 visit(tree)
 assert out
 return out

source=json.loads((ROOT/'tools/artcraft/sources/vector-designs.json').read_text())
vectors=[]
for v in source:
 source_svg=WORK/(v['id']+'-input.svg')
 art=''.join(f'<path fill="{("#f42c38" if role=="A" else "#171a22")}" d="{d}"/>' for role,d in v['paths'])
 source_svg.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {v["width"]} {v["height"]}">{art}</svg>')
 out=WORK/(v['id']+'-expanded.svg')
 cli('vectorcraft','--safe-mode','run','--in',source_svg,'--cmd','select.all','--cmd','paint.setStroke','--params','{"color":"#171a22"}','--cmd','stroke.set','--params','{"weight":5,"join":"round"}','--cmd','object.expand','--params','{"fill":false,"stroke":true}','--export',WORK/(v['id']+'.vectorcraft'),'--export',out)
 new=dict(v,paths=paths_from_svg(out.read_text()))
 vectors.append(new)
 transform=f' transform="translate({v["width"]} 0) scale(-1 1)"' if v['mirror'] else ''
 art=''.join(f'<path fill="{("#f42c38" if role=="A" else "#171a22")}" d="{d}"/>' for role,d in new['paths'])
 (ROOT/'assets/vectoriales/v113'/f'{v["id"]}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {v["width"]} {v["height"]}"><title>{v["name"]}</title><g{transform}>{art}</g></svg>')
 print('VectorCraft expanded:',v['id'],flush=True)

# Original decorative badges: no photographs, brands, text fonts or generated AI content.
badge_art=[
 ('badge_apex','Apex · Escudo', '<path d="M450 40 L740 140 L700 370 L450 555 L200 370 L160 140 Z" fill="url(#silver)"/><path d="M450 85 L690 170 L652 345 L450 495 L248 345 L210 170 Z" fill="#172433"/><path d="M250 365 L405 150 L520 150 L425 285 L625 220 L440 425 L345 425 L435 315 Z" fill="url(#paint)"/>'),
 ('badge_pulse','Pulse · Alas', '<path d="M80 165 L350 205 L450 65 L550 205 L820 165 L690 290 L555 315 L450 535 L345 315 L210 290 Z" fill="url(#silver)"/><path d="M155 205 L365 240 L450 130 L535 240 L745 205 L665 255 L530 280 L450 450 L370 280 L235 255 Z" fill="#162331"/><path d="M230 235 L375 265 L450 180 L525 265 L670 235 L570 300 L495 305 L450 400 L405 305 L330 300 Z" fill="url(#paint)"/>'),
 ('badge_facet','Facet · Prisma', '<path d="M450 45 L765 220 L690 430 L450 555 L210 430 L135 220 Z" fill="url(#silver)"/><path d="M450 95 L710 240 L650 400 L450 505 L250 400 L190 240 Z" fill="#172433"/><path d="M450 150 L650 260 L450 450 L250 260 Z" fill="url(#paint)"/><path d="M450 150 L450 450 L250 260 Z" fill="#ecf4ff" opacity=".22"/>')]
folder=ROOT/'assets/emblemas/v113';folder.mkdir(parents=True,exist_ok=True)
for id,name,art in badge_art:
 svg=WORK/(id+'.svg')
 svg.write_text('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600"><defs><linearGradient id="silver" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#f8fcff"/><stop offset=".3" stop-color="#7d9ebc"/><stop offset=".48" stop-color="#f7fdff"/><stop offset=".54" stop-color="#526f8c"/><stop offset="1" stop-color="#c8def0"/></linearGradient><linearGradient id="paint" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#ff824b"/><stop offset=".5" stop-color="#ee3548"/><stop offset="1" stop-color="#a51043"/></linearGradient></defs>'+art+'</svg>')
 cli('vectorcraft','--safe-mode','convert',svg,WORK/(id+'-raw.png'),'--scale','2')
 cli('photocraft','run',WORK/(id+'-raw.png'),'--no-gpu','--cmd','layer.layerStyle.bevelEmboss','--params','{"style":"inner","technique":"smooth","depth":140,"size":5,"soften":1,"angle":125,"altitude":35}','--cmd','image.trim','--params','{"basedOn":"transparent"}','--out',WORK/(id+'.pcraft'),'--metadata','none')
 cli('photocraft','convert',WORK/(id+'.pcraft'),folder/(id+'.png'))
 (ROOT/'tools/artcraft/sources'/f'{id}.svg').write_text(svg.read_text())
 print('PhotoCraft bevel + alpha trim:',id,flush=True)

icons={
 'vector':'M3 21 L8 8 L21 3 L16 16 Z M8 8 L16 16 M10 13 A2 2 0 1 0 14 13 A2 2 0 1 0 10 13',
 'logo':'M12 2 L21 6 L19 16 L12 22 L5 16 L3 6 Z M7 15 L12 6 L17 15 M9 12 L15 12',
 'text':'M3 4 L21 4 M12 4 L12 21 M7 21 L17 21 M3 4 L3 8 M21 4 L21 8',
 'kit':'M2 17 L9 4 L14 4 L7 17 Z M10 20 L18 6 L23 6 L15 20 Z'}
ui=ROOT/'assets/ui/v113';ui.mkdir(parents=True,exist_ok=True)
for id,path in icons.items():
 script=WORK/(id+'-icon.json')
 script.write_text(json.dumps([{'command':'vector.create','params':{'path':path,'name':f'Bodywork {id}','props':{'fill':'none','stroke':'#b4d6ff','strokeWeight':1.5,'strokeJoin':'round','strokeCap':'round'}}}]))
 native=WORK/(id+'.figcraft')
 cli('figcraft','run',script,'--no-system-fonts','--out',native)
 cli('figcraft','export',native,'--out',ui/(id+'.svg'),'--format','svg')
 (ROOT/'tools/artcraft/sources'/f'{id}-icon.json').write_text(script.read_text())
 print('FigCraft icon:',id,flush=True)

# Preserve module API, replace only its original catalogue data, add badge metadata.
p=ROOT/'rc-graphics.js';s=p.read_text();a=s.index('const designs=')+len('const designs=');b=s.index(';\nconst normalize',a)
s=s[:a]+json.dumps(vectors,ensure_ascii=False,separators=(',',':'))+s[b:]
badges=[{'id':id,'name':name,'url':f'assets/emblemas/v113/{id}.png'} for id,name,_ in badge_art]
s=s.replace('designs:Object.freeze(designs),filter','designs:Object.freeze(designs),badges:Object.freeze('+json.dumps(badges,ensure_ascii=False,separators=(',',':'))+'),filter')
p.write_text(s)
outputs=[*sorted((ROOT/'assets/vectoriales/v113').glob('*.svg')),*sorted(folder.glob('*.png')),*sorted(ui.glob('*.svg'))]
receipt={'tools':VERSIONS,'commands':LOG,'outputs':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in outputs}}
(WORK/'receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2))
print('CLI build complete:',WORK/'receipt.json')
