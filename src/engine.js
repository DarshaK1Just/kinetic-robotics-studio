/* Kinetic teaching engines. Units: SI unless a function documents otherwise.
   These are explicit educational models, NOT native Gazebo / MuJoCo / Isaac. */
(function(root){
'use strict';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const finite=(...v)=>v.every(Number.isFinite);
function ohms(v=3.3,r=220,vf=2,closed=true){
 if(!finite(v,r,vf)||r<=0||v<0||vf<0)throw Error('Use finite nonnegative voltages and positive resistance.');
 const amps=closed?Math.max(0,v-vf)/r:0;
 return {amps,milliamps:amps*1000,power:amps*amps*r,warning:amps>0.012};
}
function ik(x,y,l1=.15,l2=.11,elbow=1){
 if(!finite(x,y,l1,l2)||l1<=0||l2<=0)throw Error('Link lengths must be positive and inputs finite.');
 const r=Math.hypot(x,y),reachable=r<=l1+l2+1e-10&&r>=Math.abs(l1-l2)-1e-10;
 if(!reachable)return {reachable:false,r};
 const c=clamp((r*r-l1*l1-l2*l2)/(2*l1*l2),-1,1);
 const q2=(elbow>=0?1:-1)*Math.acos(c);
 const q1=Math.atan2(y,x)-Math.atan2(l2*Math.sin(q2),l1+l2*Math.cos(q2));
 return {reachable:true,q1,q2,elbow:[l1*Math.cos(q1),l1*Math.sin(q1)],tip:[l1*Math.cos(q1)+l2*Math.cos(q1+q2),l1*Math.sin(q1)+l2*Math.sin(q1+q2)]};
}
function drive(s,vl,vr,base,dt){
 if(!finite(s.x,s.y,s.theta,vl,vr,base,dt)||base<=0||dt<0)throw Error('Invalid differential-drive inputs.');
 const v=(vr+vl)/2,w=(vr-vl)/base;
 let x,y;
 if(Math.abs(w)<1e-9){x=s.x+v*Math.cos(s.theta)*dt;y=s.y+v*Math.sin(s.theta)*dt;}
 else{x=s.x+v/w*(Math.sin(s.theta+w*dt)-Math.sin(s.theta));y=s.y-v/w*(Math.cos(s.theta+w*dt)-Math.cos(s.theta));}
 return {x,y,theta:Math.atan2(Math.sin(s.theta+w*dt),Math.cos(s.theta+w*dt)),v,w};
}
class Motor{
 constructor(p={}){this.p={kp:10,ki:1,kd:3,inertia:.5,damping:.4,target:1,limit:5,...p};this.reset();}
 reset(){this.theta=0;this.omega=0;this.integral=0;this.t=0;this.history=[];this.peak=0;}
 step(dt=.005,disturbance=0){
  const p=this.p;if(!finite(dt,disturbance)||dt<=0||dt>.05)throw Error('Time step must be in (0,0.05] seconds.');
  if(p.inertia<=0)throw Error('Inertia must be positive.');
  const error=p.target-this.theta;
  const unsat=p.kp*error+p.ki*this.integral-p.kd*this.omega;
  const u=clamp(unsat,-p.limit,p.limit);
  if(Math.abs(unsat)<=p.limit||Math.sign(error)!==Math.sign(unsat))this.integral+=error*dt;
  const a=(u+disturbance-p.damping*this.omega)/p.inertia;
  this.omega+=a*dt;this.theta+=this.omega*dt;this.t+=dt;this.peak=Math.max(this.peak,this.theta);
  const row={t:this.t,position:this.theta,target:p.target,velocity:this.omega,torque:u,error:p.target-this.theta};
  this.history.push(row);if(this.history.length>12000)this.history.shift();return row;
 }
}
function pid(p={}){const m=new Motor(p);const n=Math.min(20000,Math.max(1,Math.round((p.seconds||8)/.005)));for(let i=0;i<n;i++)m.step();return m.history;}
function astar(width,height,walls,start,goal){
 const inside=(p)=>Array.isArray(p)&&p.length===2&&Number.isInteger(p[0])&&Number.isInteger(p[1])&&p[0]>=0&&p[1]>=0&&p[0]<width&&p[1]<height;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>100000||!inside(start)||!inside(goal))throw Error('Invalid grid or endpoint.');
 const key=p=>p[0]+','+p[1],wall=new Set(Array.from(walls||[],w=>Array.isArray(w)?key(w):w));
 if(wall.has(key(start))||wall.has(key(goal)))return {path:[],visited:[],cost:Infinity};
 const h=p=>Math.abs(p[0]-goal[0])+Math.abs(p[1]-goal[1]);
 const open=[{p:start,g:0,f:h(start)}],g=new Map([[key(start),0]]),parent=new Map(),closed=new Set(),visited=[];
 while(open.length){open.sort((a,b)=>a.f-b.f||a.g-b.g);const cur=open.shift(),k=key(cur.p);if(closed.has(k))continue;closed.add(k);visited.push(cur.p);
  if(k===key(goal)){const path=[];let t=k;while(t!==undefined){path.push(t.split(',').map(Number));t=parent.get(t);}return {path:path.reverse(),visited,cost:cur.g};}
  for(const [dx,dy]of [[1,0],[0,1],[-1,0],[0,-1]]){const p=[cur.p[0]+dx,cur.p[1]+dy],q=key(p),ng=cur.g+1;
   if(inside(p)&&!wall.has(q)&&!closed.has(q)&&ng<(g.get(q)??Infinity)){g.set(q,ng);parent.set(q,k);open.push({p,g:ng,f:ng+h(p)});}
  }
 }
 return {path:[],visited,cost:Infinity};
}
function rng(seed=42){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
class GridLearner{
 constructor(seed=42){this.n=6;this.goal=35;this.walls=new Set([8,9,15,21,25]);this.seed=seed;this.random=rng(seed);this.q=Array.from({length:36},()=>[0,0,0,0]);this.history=[];this.episodes=0;this.alpha=.2;this.gamma=.95;this.epsilon=.25;}
 next(s,a){let x=s%this.n,y=Math.floor(s/this.n);const d=[[1,0],[0,1],[-1,0],[0,-1]][a];const nx=x+d[0],ny=y+d[1],ns=ny*this.n+nx;if(nx<0||ny<0||nx>=this.n||ny>=this.n||this.walls.has(ns))return {s,r:-1,done:false};return {s:ns,r:ns===this.goal?10:-.05,done:ns===this.goal};}
 greedy(s,random=this.random){const best=Math.max(...this.q[s]),ties=[0,1,2,3].filter(a=>Math.abs(this.q[s][a]-best)<1e-10);return ties[Math.floor(random()*ties.length)];}
 train(count=1){for(let i=0;i<count;i++){let s=0,total=0,success=false;for(let t=0;t<100;t++){const a=this.random()<this.epsilon?Math.floor(this.random()*4):this.greedy(s);const tr=this.next(s,a);const target=tr.r+(tr.done?0:this.gamma*Math.max(...this.q[tr.s]));this.q[s][a]+=this.alpha*(target-this.q[s][a]);total+=tr.r;s=tr.s;if(tr.done){success=true;break;}}this.episodes++;this.history.push({episode:this.episodes,reward:total,success});}return this.history;}
 evaluate(randomPolicy=false,trials=100){const random=rng(123456);const starts=Array.from({length:35},(_,i)=>i).filter(i=>!this.walls.has(i));let success=0,total=0;for(let i=0;i<trials;i++){let s=starts[Math.floor(random()*starts.length)];for(let t=0;t<100;t++){const a=randomPolicy?Math.floor(random()*4):this.greedy(s,random),tr=this.next(s,a);s=tr.s;total+=tr.r;if(tr.done){success++;break;}}}return {success,trials,rate:success/trials,meanReward:total/trials};}
 rollout(start=0){const random=rng(100),path=[start];let s=start;for(let i=0;i<50;i++){const tr=this.next(s,this.greedy(s,random));s=tr.s;path.push(s);if(tr.done)break;}return path;}
}
const engine={clamp,ohms,ik,drive,Motor,pid,astar,rng,GridLearner};
if(typeof module!=='undefined'&&module.exports)module.exports=engine;else root.Engine=engine;
})(typeof self!=='undefined'?self:globalThis);
