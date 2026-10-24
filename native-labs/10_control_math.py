"""Standard-library robotics calculations and a deliberately simple dynamic plant."""
from dataclasses import dataclass
from math import sin,cos,isfinite

def led_resistance(voltage:float,forward_drop:float,current_a:float)->float:
    if not all(map(isfinite,(voltage,forward_drop,current_a))) or current_a<=0 or voltage<=forward_drop:
        raise ValueError('Require finite supply > LED drop and positive current.')
    return (voltage-forward_drop)/current_a

def wheel_speeds(v:float,yaw_rate:float,radius:float,track:float):
    if radius<=0 or track<=0: raise ValueError('Radius and track must be positive.')
    return ((v-yaw_rate*track/2)/radius,(v+yaw_rate*track/2)/radius)

def forward_2link(l1:float,l2:float,q1:float,q2:float):
    if l1<=0 or l2<=0: raise ValueError('Link lengths must be positive.')
    return (l1*cos(q1)+l2*cos(q1+q2),l1*sin(q1)+l2*sin(q1+q2))

def stopping_distance(speed:float,delay_s:float,deceleration:float)->float:
    if speed<0 or delay_s<0 or deceleration<=0: raise ValueError('Invalid motion parameters.')
    return speed*delay_s+speed**2/(2*deceleration)

@dataclass
class PID:
    kp:float=1.5; ki:float=1.0; kd:float=0.0
    limit:float=3.0; integral:float=0.0; previous_error:float=0.0
    def update(self,target:float,measured:float,dt:float)->float:
        if dt<=0: raise ValueError('dt must be positive.')
        e=target-measured
        proposed=self.integral+e*dt
        raw=self.kp*e+self.ki*proposed+self.kd*(e-self.previous_error)/dt
        out=max(-self.limit,min(self.limit,raw))
        # Conditional integration prevents further windup into a saturated direction.
        if abs(raw)<self.limit or (raw>self.limit and e<0) or (raw<-self.limit and e>0):
            self.integral=proposed
        self.previous_error=e
        return out

def response(seconds=6.0,dt=0.01):
    controller=PID(); x=0.0; rows=[]
    for k in range(round(seconds/dt)):
        u=controller.update(1.0,x,dt)
        x += dt*((-x+u)/0.35) # First-order toy plant, not a specific real motor.
        rows.append(((k+1)*dt,x,u))
    return rows

if __name__=='__main__':
    import csv
    with open('pid_response.csv','w',newline='') as f:
        w=csv.writer(f); w.writerow(['time_s','measurement','command']); w.writerows(response())
    print('Wrote pid_response.csv; simulated toy plant, not hardware data.')
