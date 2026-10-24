"""Small, reproducible Q-learning lab. It is NOT a Gazebo/Isaac simulation."""
import argparse,csv,random
SIZE=5; START=(0,0); GOAL=(4,4); BLOCKS={(1,1),(1,2),(3,3)}
ACTIONS=((1,0),(-1,0),(0,1),(0,-1))
def transition(state,action):
    dr,dc=ACTIONS[action]; candidate=(state[0]+dr,state[1]+dc)
    if not (0<=candidate[0]<SIZE and 0<=candidate[1]<SIZE) or candidate in BLOCKS:
        return state,-2.0,False
    return candidate,(20.0 if candidate==GOAL else -1.0),candidate==GOAL

def train(episodes=1500,seed=7):
    rng=random.Random(seed)
    q={(r,c):[0.0]*4 for r in range(SIZE) for c in range(SIZE) if (r,c) not in BLOCKS}
    log=[]
    for ep in range(episodes):
        state=START; total=0; done=False; steps=0
        epsilon=max(0.05,0.8*(1-ep/max(1,episodes)))
        for steps in range(1,101):
            action=rng.randrange(4) if rng.random()<epsilon else max(range(4),key=lambda a:q[state][a])
            nxt,reward,done=transition(state,action)
            target=reward+(0 if done else 0.95*max(q[nxt]))
            q[state][action]+=0.2*(target-q[state][action])
            state=nxt; total+=reward
            if done: break
        log.append((ep,total,steps,done))
    return q,log

def evaluate(q):
    state=START; route=[state]
    for _ in range(100):
        action=max(range(4),key=lambda a:q[state][a]); state,_,done=transition(state,action);route.append(state)
        if done:return route,True
    return route,False
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--seed',type=int,default=7);a=p.parse_args()
    q,log=train(seed=a.seed);route,ok=evaluate(q)
    with open('grid_training.csv','w',newline='') as f:
        w=csv.writer(f);w.writerow(['episode','return','steps','success']);w.writerows(log)
    print('Toy-grid greedy evaluation:',ok,'route:',route)
