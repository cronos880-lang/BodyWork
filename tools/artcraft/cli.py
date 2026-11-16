"""Run the project's pinned ArtCraft CLI without modifying account-wide PATH."""
import os,subprocess,sys
from pathlib import Path
VERSIONS={'vectorcraft':'0.24.1','photocraft':'0.23.1','figcraft':'0.18.1'}
if len(sys.argv)<2 or sys.argv[1] not in VERSIONS:
 raise SystemExit('Usage: python tools/artcraft/cli.py {vectorcraft|photocraft|figcraft} [arguments]')
name=sys.argv[1];home=Path(os.environ.get('BWORK_ARTCRAFT_HOME',Path(__file__).resolve().parents[3]/'work/artcraft-cli'))
binary=home/f'{name}-{VERSIONS[name]}-linux-x86_64/bin/{name}-cli'
if not binary.is_file():raise SystemExit('CLI missing. Run: python tools/artcraft/install_cli.py')
config=home/'runtime';config.mkdir(parents=True,exist_ok=True)
env=dict(os.environ,XDG_CONFIG_HOME=str(config/'config'),XDG_CACHE_HOME=str(config/'cache'),XDG_DATA_HOME=str(config/'data'),VECTORCRAFT_NO_PREFS='1')
raise SystemExit(subprocess.call([str(binary),*sys.argv[2:]],env=env))
