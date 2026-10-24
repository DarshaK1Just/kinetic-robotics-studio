"""MuJoCo 3.x pendulum experiment. Requires mujoco; not run in this workspace."""
import argparse,csv,time
from pathlib import Path

def main():
    p=argparse.ArgumentParser(); p.add_argument('--headless',action='store_true')
    p.add_argument('--seconds',type=float,default=8.0); p.add_argument('--kd',type=float,default=0.08)
    a=p.parse_args()
    if a.seconds<=0 or a.kd<0: raise SystemExit('Use positive duration and nonnegative damping.')
    import mujoco
    model=mujoco.MjModel.from_xml_path(str(Path(__file__).with_name('11_mujoco_pendulum.xml')))
    data=mujoco.MjData(model); data.qpos[0]=0.6; mujoco.mj_forward(model,data)
    rows=[]
    def step():
        data.ctrl[0]=max(-0.4,min(0.4,-a.kd*float(data.qvel[0])))
        mujoco.mj_step(model,data)
        rows.append((float(data.time),float(data.qpos[0]),float(data.qvel[0]),float(data.ctrl[0])))
    if a.headless:
        while data.time<a.seconds: step()
    else:
        import mujoco.viewer
        with mujoco.viewer.launch_passive(model,data) as viewer:
            while viewer.is_running() and data.time<a.seconds:
                start=time.monotonic()
                with viewer.lock(): step()
                viewer.sync()
                time.sleep(max(0,model.opt.timestep-(time.monotonic()-start)))
    with open('pendulum.csv','w',newline='') as f:
        w=csv.writer(f); w.writerow(['time_s','angle_rad','velocity_radps','torque_Nm']); w.writerows(rows)
    print('Saved pendulum.csv. In passive mode this Python loop owns stepping; UI pause is not a safety stop.')
if __name__=='__main__': main()
