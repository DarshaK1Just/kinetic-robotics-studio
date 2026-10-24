"""USB-camera red-target tracker. It NEVER sends motor commands."""
import argparse, time
import cv2
import numpy as np

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--camera',type=int,default=0)
    parser.add_argument('--min-area',type=float,default=300.0)
    args=parser.parse_args()
    cap=cv2.VideoCapture(args.camera)
    if not cap.isOpened(): raise SystemExit('Camera did not open. Check index, permissions and cable.')
    previous=time.monotonic()
    try:
        while True:
            ok, frame=cap.read()
            if not ok: raise RuntimeError('Camera frame lost; no target/action may be assumed.')
            hsv=cv2.cvtColor(frame,cv2.COLOR_BGR2HSV)
            mask=(cv2.inRange(hsv,np.array([0,100,60]),np.array([10,255,255])) |
                  cv2.inRange(hsv,np.array([170,100,60]),np.array([179,255,255])))
            contours,_=cv2.findContours(mask,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
            target=max(contours,key=cv2.contourArea) if contours else None
            label='NO TARGET'
            if target is not None and cv2.contourArea(target)>=args.min_area:
                x,y,w,h=cv2.boundingRect(target); cx=x+w/2
                error=(cx-frame.shape[1]/2)/(frame.shape[1]/2)
                cv2.rectangle(frame,(x,y),(x+w,y+h),(0,255,0),2)
                label=f'normalized horizontal error={error:+.2f}'
            now=time.monotonic(); dt=now-previous; previous=now
            cv2.putText(frame,label,(12,30),cv2.FONT_HERSHEY_SIMPLEX,0.6,(255,255,255),2)
            cv2.putText(frame,f'frame interval {dt*1000:.1f} ms',(12,58),cv2.FONT_HERSHEY_SIMPLEX,0.5,(255,255,255),1)
            cv2.imshow('Real camera - software-only tracking',frame)
            if cv2.waitKey(1)&0xFF in (27,ord('q')): break
    finally:
        cap.release(); cv2.destroyAllWindows()
if __name__=='__main__': main()
