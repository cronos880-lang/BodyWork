"""Build original Bodywork resources with pinned official ArtCraft CLIs.
Python 3.12 stdlib only. Run in the source checkout, never on user photos/projects.
BWORK_ARTCRAFT_HOME selects the verified CLI packages (default: ../work/artcraft-cli).
"""
from pathlib import Path
import base64,hashlib,json,os,subprocess,xml.etree.ElementTree as ET
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
badge_art.extend([
 ('badge_turbo','Turbo · Turbina', '<circle cx="450" cy="300" r="260" fill="url(#silver)"/><circle cx="450" cy="300" r="215" fill="#172433"/><path d="M450 110 C620 105 675 220 650 295 L520 240 Z M635 365 C585 525 460 540 390 485 L470 365 Z M310 450 C155 365 170 225 245 180 L360 275 Z" fill="url(#paint)"/><circle cx="450" cy="300" r="85" fill="url(#silver)"/><circle cx="450" cy="300" r="48" fill="#172433"/>'),
 ('badge_phoenix','Fénix · Alas', '<path d="M450 60 L515 175 L810 100 L735 210 L625 260 L790 235 L680 335 L540 360 L450 550 L360 360 L220 335 L110 235 L275 260 L165 210 L90 100 L385 175 Z" fill="url(#silver)"/><path d="M450 135 L500 220 L715 155 L615 245 L525 270 L660 275 L550 320 L450 460 L350 320 L240 275 L375 270 L285 245 L185 155 L400 220 Z" fill="#172433"/><path d="M450 180 L490 250 L600 220 L520 300 L480 305 L450 395 L420 305 L380 300 L300 220 L410 250 Z" fill="url(#paint)"/>'),
 ('badge_torque','Torque · Pistón', '<path d="M280 55 L620 55 L790 300 L620 545 L280 545 L110 300 Z" fill="url(#silver)"/><path d="M300 100 L600 100 L735 300 L600 500 L300 500 L165 300 Z" fill="#172433"/><path d="M325 155 L575 155 L575 270 L510 305 L510 390 L545 425 L510 460 L390 460 L355 425 L390 390 L390 305 L325 270 Z" fill="url(#paint)"/><path d="M335 180 L565 180 L565 200 L335 200 Z M335 220 L565 220 L565 240 L335 240 Z M425 325 L475 325 L475 390 L425 390 Z" fill="url(#silver)"/>'),
 ('badge_crown','Corona · Racing', '<path d="M130 165 L310 250 L450 60 L590 250 L770 165 L690 460 L210 460 Z" fill="url(#silver)"/><path d="M200 235 L325 300 L450 145 L575 300 L700 235 L650 405 L250 405 Z" fill="#172433"/><path d="M265 280 L340 330 L450 205 L560 330 L635 280 L605 370 L295 370 Z" fill="url(#paint)"/><path d="M240 480 L660 480 L660 530 L240 530 Z" fill="#172433"/><path d="M240 480 L300 480 L300 505 L240 505 Z M360 480 L420 480 L420 505 L360 505 Z M480 480 L540 480 L540 505 L480 505 Z M600 480 L660 480 L660 505 L600 505 Z M300 505 L360 505 L360 530 L300 530 Z M420 505 L480 505 L480 530 L420 530 Z M540 505 L600 505 L600 530 L540 530 Z" fill="url(#silver)"/>')])
folder=ROOT/'assets/emblemas/v113';folder.mkdir(parents=True,exist_ok=True)
for id,name,art in badge_art:
 svg=WORK/(id+'.svg')
 svg.write_text('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600"><defs><linearGradient id="silver" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#f8fcff"/><stop offset=".3" stop-color="#7d9ebc"/><stop offset=".48" stop-color="#f7fdff"/><stop offset=".54" stop-color="#526f8c"/><stop offset="1" stop-color="#c8def0"/></linearGradient><linearGradient id="paint" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#ff824b"/><stop offset=".5" stop-color="#ee3548"/><stop offset="1" stop-color="#a51043"/></linearGradient></defs>'+art+'</svg>')
 cli('vectorcraft','--safe-mode','convert',svg,WORK/(id+'-raw.png'),'--scale','2')
 cli('photocraft','run',WORK/(id+'-raw.png'),'--no-gpu','--cmd','layer.layerStyle.bevelEmboss','--params','{"style":"inner","technique":"smooth","depth":140,"size":5,"soften":1,"angle":125,"altitude":35}','--cmd','image.trim','--params','{"basedOn":"transparent"}','--out',WORK/(id+'.pcraft'),'--metadata','none')
 target=folder if id in ['badge_apex','badge_pulse','badge_facet'] else ROOT/'assets/emblemas/v1132';target.mkdir(parents=True,exist_ok=True)
 cli('photocraft','convert',WORK/(id+'.pcraft'),target/(id+'.png'))
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
badges=[]
for id,name,_ in badge_art:
 relative=f'assets/emblemas/{"v113" if id in ["badge_apex","badge_pulse","badge_facet"] else "v1132"}/{id}.png'
 badges.append({'id':id,'name':name,'url':relative,'uri':'data:image/png;base64,'+base64.b64encode((ROOT/relative).read_bytes()).decode('ascii')})
a=s.index('return Object.freeze(')
s=s[:a]+'return Object.freeze({designs:Object.freeze(designs),badges:Object.freeze('+json.dumps(badges,ensure_ascii=False,separators=(',',':'))+'),filter});\n})();\n'
p.write_text(s)
outputs=[*sorted((ROOT/'assets/vectoriales/v113').glob('*.svg')),*sorted((ROOT/'assets/emblemas').glob('*/*.png')),*sorted(ui.glob('*.svg'))]
receipt={'tools':VERSIONS,'commands':LOG,'outputs':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in outputs}}
(WORK/'receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2))
print('CLI build complete:',WORK/'receipt.json')

# Preserve the approved V1.13.3 artwork and legacy compatibility in full rebuilds.
import runpy
runpy.run_path(str(ROOT/"tools/artcraft/build_approved_badges.py"), run_name="__main__")
