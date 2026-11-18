"""Finish approved V1.13.3 artwork with PhotoCraft, keeping legacy resources.

Python 3.12 and Pillow 12.3.0. Sources are isolated transparent renditions of the concept
sheet approved by the user, not SVG recreations of that sheet. The native
PhotoCraft intermediate and CLI log live outside the repository.
"""
from pathlib import Path
from PIL import Image
import base64, hashlib, json, os, subprocess

ROOT = Path(__file__).resolve().parents[2]
HOME = Path(os.environ.get('BWORK_ARTCRAFT_HOME', ROOT.parent/'work/artcraft-cli'))
WORK = ROOT.parent/'work/bodywork-v1133/artcraft'
ART = [('badge_panther', 'Pantera · Felino'),
       ('badge_chicane', 'Chicane · Racing'),
       ('badge_finish', 'Meta · Banderas')]

def main():
    WORK.mkdir(parents=True, exist_ok=True)
    target = ROOT/'assets/emblemas/v1133'
    target.mkdir(parents=True, exist_ok=True)
    env = dict(os.environ, XDG_CONFIG_HOME=str(WORK/'config'),
               XDG_CACHE_HOME=str(WORK/'cache'), XDG_DATA_HOME=str(WORK/'data'))
    binary = HOME/'photocraft-0.23.1-linux-x86_64/bin/photocraft-cli'
    log = []
    def cli(*args):
        result = subprocess.run([str(binary), *map(str, args)], env=env,
                                capture_output=True, text=True, check=True)
        log.append(dict(args=list(map(str, args)), stdout=result.stdout, stderr=result.stderr))
    for id, name in ART:
        source = ROOT/f'tools/artcraft/sources/v1133/{id}.png'
        native = WORK/(id+'.pcraft')
        cli('run', source, '--no-gpu', '--cmd', 'image.trim', '--params',
            '{"basedOn":"transparent"}', '--out', native, '--metadata', 'none')
        cli('convert', native, target/(id+'.png'))
        path = target/(id+'.png')
        with Image.open(path) as source_image:
            image = source_image.convert('RGBA')
        # Remove nearly invisible fringe and make solid metal fully opaque.
        alpha = image.getchannel('A').point(lambda a: 0 if a <= 2 else 255 if a >= 250 else a)
        image.putalpha(alpha)
        image.crop(alpha.getbbox()).save(path, optimize=True)
        print('PhotoCraft transparent trim/export:', id, flush=True)
    module = ROOT/'rc-graphics.js'
    text = module.read_text()
    start = text.index('badges:Object.freeze(')+len('badges:Object.freeze(')
    badges, _ = json.JSONDecoder().raw_decode(text[start:])
    current = [b for b in badges if b['id'] not in {id for id, _ in ART}]
    for b in current:
        if b['id'] in ['badge_torque', 'badge_crown']:
            b['retired'] = True
    for id, name in ART:
        path = target/(id+'.png')
        current.append(dict(id=id, name=name, url=str(path.relative_to(ROOT)),
                            uri='data:image/png;base64,'+base64.b64encode(path.read_bytes()).decode()))
    module.write_text(text[:text.index('return Object.freeze(')]+
        'return Object.freeze({designs:Object.freeze(designs),badges:Object.freeze('+
        json.dumps(current, ensure_ascii=False, separators=(',', ':'))+'),filter});\n})();\n')
    outputs = [ROOT/f'tools/artcraft/sources/v1133/{id}.png' for id, _ in ART]
    outputs += [target/(id+'.png') for id, _ in ART]
    receipt = dict(tool='PhotoCraft CLI 0.23.1', commands=log,
                   outputs={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in outputs})
    (WORK/'receipt.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
