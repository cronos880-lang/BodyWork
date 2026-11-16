"""Install official Linux x86_64 CLI packages in the development workspace only.
No sudo, account PATH changes, project dependency or executable added to Git.
"""
import hashlib,os,platform,tarfile,urllib.request
from pathlib import Path
HOME_TOOLS=Path(os.environ.get('BWORK_ARTCRAFT_HOME',Path(__file__).resolve().parents[3]/'work/artcraft-cli'))
PINS={
 'vectorcraft':('0.24.1','a090514252fde145495ac6fc65d6ff1311d698998e57ba434d5d0896c3d1fbfa'),
 'photocraft':('0.23.1','4383aef67a07cc370ad250a6ed60015205d3e6c463faf3ff4b0f67b8178ccfc8'),
 'figcraft':('0.18.1','8276d2ac55c6f77f7af3a411a9b00415d3feb0b59607a54523311340e653fc19')}
if platform.system()!='Linux' or platform.machine()!='x86_64':raise SystemExit('This installer is for the Codex Linux x86_64 workspace, not Windows. See README.md.')
HOME_TOOLS.mkdir(parents=True,exist_ok=True)
for name,(version,sha) in PINS.items():
 file=f'{name}-{version}-linux-x86_64.tar.gz';archive=HOME_TOOLS/file
 if not archive.exists():
  temporary=archive.with_suffix('.download')
  with urllib.request.urlopen(f'https://github.com/storytold/{name}/releases/download/v{version}/{file}',timeout=180) as r,temporary.open('wb') as out:
   while chunk:=r.read(1024*1024):out.write(chunk)
  temporary.rename(archive)
 if hashlib.file_digest(archive.open('rb'),'sha256').hexdigest()!=sha:raise SystemExit('SHA-256 mismatch: '+file+'; nothing extracted. Retain for diagnosis.')
 destination=HOME_TOOLS/f'{name}-{version}-linux-x86_64'
 if destination.exists():
  print('Already present; archive verified:',destination)
  continue
 with tarfile.open(archive) as bundle:bundle.extractall(HOME_TOOLS,filter='data')
 print('Installed:',destination)
