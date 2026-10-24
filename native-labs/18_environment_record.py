"""Record the local environment without installing anything."""
import importlib.metadata,json,platform,subprocess,sys
from pathlib import Path
out={'python':sys.version,'platform':platform.platform(),'packages':{},'commands':{}}
for name in ['mujoco','gymnasium','torch','lerobot','opencv-python','numpy']:
    try:out['packages'][name]=importlib.metadata.version(name)
    except importlib.metadata.PackageNotFoundError:out['packages'][name]='not installed'
for cmd in [['git','--version'],['nvidia-smi','--query-gpu=name,driver_version,memory.total','--format=csv,noheader']]:
    try:
        r=subprocess.run(cmd,capture_output=True,text=True,timeout=10)
        out['commands'][' '.join(cmd)]=(r.stdout or r.stderr).strip()
    except (FileNotFoundError,subprocess.TimeoutExpired) as exc:out['commands'][' '.join(cmd)]=str(exc)
Path('environment.json').write_text(json.dumps(out,indent=2))
print('Saved environment.json. Review before sharing; machine details may be private.')
