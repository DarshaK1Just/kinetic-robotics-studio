/* Interactive original concept visualization: not a measured CAD model or photo. */
(function(root){'use strict';
const palette={ink:'#3f3658',purple:'#8971d1',light:'#f8f4ff',mint:'#a3dcca',peach:'#e6b79d'};
function art(kind='chip'){
 const start='<svg class="art" viewBox="0 0 300 180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="boardg" x2="1" y2="1"><stop stop-color="#b09ae9"/><stop offset="1" stop-color="#74619f"/></linearGradient></defs>';
 const end='</svg>';
 if(kind==='circuit')return start+'<path d="M50 95H101M182 95H248V139H50V95" fill="none" stroke="#9180b5" stroke-width="3"/><rect x="99" y="80" width="75" height="30" rx="10" fill="#ecd6ac" stroke="#977e4d"/><path d="M116 81V109M132 81V109M155 81V109" stroke="#94604f" stroke-width="7"/><circle cx="249" cy="73" r="22" fill="#d3b2ef"/><path d="M236 93V108M258 92V106" stroke="#8970aa" stroke-width="3"/><rect x="33" y="64" width="32" height="50" rx="9" fill="#72629a"/><path d="M43 81H55M49 75V87" stroke="white" stroke-width="2"/><circle cx="50" cy="140" r="5" fill="#9fd5bf"/><text x="129" y="137" fill="#756786" font-size="11" font-family="monospace">V = I R</text>'+end;
 if(kind==='arm')return start+'<ellipse cx="146" cy="153" rx="79" ry="12" fill="#9685b622"/><path d="M107 142L132 80L199 47L231 79" fill="none" stroke="#84719e" stroke-width="22" stroke-linecap="round"/><path d="M108 139L134 82L200 48" fill="none" stroke="#d1c0e7" stroke-width="12" stroke-linecap="round"/><circle cx="132" cy="80" r="17" fill="#f8f4fe" stroke="#837094" stroke-width="5"/><circle cx="199" cy="47" r="14" fill="#f8f4fe" stroke="#837094" stroke-width="5"/><path d="M222 76L219 97L230 101M237 76L245 90L239 101" fill="none" stroke="#6e5e85" stroke-width="7" stroke-linecap="round"/><rect x="76" y="135" width="64" height="23" rx="9" fill="#bba8d5"/><rect x="225" y="119" width="27" height="25" rx="5" fill="#dfa993"/>'+end;
 if(kind==='rover')return start+'<ellipse cx="148" cy="144" rx="82" ry="15" fill="#86739c22"/><rect x="77" y="80" width="23" height="65" rx="10" fill="#665d74"/><rect x="203" y="80" width="23" height="65" rx="10" fill="#665d74"/><path d="M94 90L185 64L211 91L211 128L112 151L94 124Z" fill="#c5b6d7"/><path d="M94 90L185 64L211 91L112 118Z" fill="#f1ebfa"/><rect x="132" y="72" width="49" height="32" rx="10" fill="#a1c7b8"/><ellipse cx="156" cy="73" rx="24" ry="9" fill="#deede3"/><ellipse cx="156" cy="69" rx="15" ry="7" fill="#665d74"/><path d="M154 56Q172 26 200 35M159 56Q178 40 193 45" fill="none" stroke="#9f82d3" stroke-width="2" stroke-dasharray="4 4"/>'+end;
 if(kind==='path'||kind==='rl')return start+'<g transform="translate(64 25) skewY(-7)"><rect width="172" height="129" rx="13" fill="#fff9"/>'+Array.from({length:30},(_,i)=>`<rect x="${10+i%6*26}" y="${10+Math.floor(i/6)*23}" width="21" height="18" rx="4" fill="${[8,9,15,21].includes(i)?'#a599bd':'#d5cbe6'}"/>`).join('')+'<path d="M20 20H150V112" fill="none" stroke="#8e68ce" stroke-width="5" stroke-linecap="round"/><circle cx="20" cy="20" r="10" fill="#7fbfa1"/><circle cx="150" cy="112" r="10" fill="#e7b57c"/></g>'+end;
 if(kind==='pid')return start+'<path d="M48 25V145H255" stroke="#9283a9" stroke-width="2" fill="none"/><path d="M49 71H253" stroke="#c6a16e" stroke-dasharray="5 5" stroke-width="2"/><path d="M50 139C75 136 77 34 105 39S137 99 163 83S194 63 212 71S238 71 252 71" fill="none" stroke="#9270c8" stroke-width="5" stroke-linecap="round"/><circle cx="252" cy="71" r="6" fill="#9dccaf"/><text x="65" y="168" fill="#877693" font-size="11" font-family="monospace">observe. correct. repeat.</text>'+end;
 return start+'<g transform="translate(86 37) rotate(-9 65 55)"><rect width="130" height="105" rx="13" fill="url(#boardg)"/>'+Array.from({length:8},(_,i)=>`<rect x="${8+i*16}" y="-7" width="6" height="15" rx="2" fill="#c0a66f"/><rect x="${8+i*16}" y="97" width="6" height="15" rx="2" fill="#c0a66f"/>`).join('')+'<rect x="38" y="25" width="58" height="56" rx="6" fill="#ddd7e4"/><rect x="48" y="35" width="38" height="36" rx="3" fill="#5b506a"/><path d="M10 25H25V56H38M96 56H113V83" stroke="#c3b3dc" fill="none" stroke-width="3"/><circle cx="17" cy="85" r="5" fill="#cceba7"/></g>'+end;
}
class RobotScene{
 constructor(canvas,{onPart=()=>{},motion=true,mode='shell'}={}){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.onPart=onPart;this.motion=motion;this.yaw=-.43;this.pitch=.17;this.explode=mode==='exploded'?1:0;this.target=this.explode;this.cutaway=mode==='inside';this.alive=true;this.hit=[];this.drag=false;this.last=0;this.hover='';this.handlers=[];
 this.listen(canvas,'pointerdown',e=>{this.drag=true;this.mx=e.clientX;canvas.setPointerCapture(e.pointerId);});
 this.listen(canvas,'pointermove',e=>{if(this.drag){this.yaw+=(e.clientX-this.mx)*.012;this.mx=e.clientX;}else{const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;const h=this.hit.find(p=>Math.hypot(x-p.x,y-p.y)<28);this.hover=h?.id||'';this.onPart(h||null);}});
 this.listen(canvas,'pointerup',()=>this.drag=false);this.listen(canvas,'pointercancel',()=>this.drag=false);this.listen(canvas,'pointerleave',()=>{if(!this.drag){this.hover='';this.onPart(null);}});
 this.listen(canvas,'keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();this.yaw+=e.key==='ArrowLeft'?-.15:.15;}if(e.key==='e'){this.setMode(this.target?'shell':'exploded');}});
 this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);this.resize();this.frame=this.frame.bind(this);this.raf=requestAnimationFrame(this.frame);
 }
 listen(el,e,fn){el.addEventListener(e,fn);this.handlers.push(()=>el.removeEventListener(e,fn));}
 resize(){const r=this.canvas.getBoundingClientRect();this.w=r.width||500;this.h=r.height||400;this.dpr=Math.min(window.devicePixelRatio||1,2);this.canvas.width=this.w*this.dpr;this.canvas.height=this.h*this.dpr;}
 setMode(mode){this.target=mode==='exploded'?1:0;this.cutaway=mode==='inside';if(!this.motion)this.explode=this.target;}
 destroy(){this.alive=false;cancelAnimationFrame(this.raf);this.resizeObserver.disconnect();this.handlers.forEach(fn=>fn());}
 frame(t){if(!this.alive)return;const dt=Math.min(.05,(t-this.last)/1000||.016);this.last=t;if(this.motion)this.explode+=(this.target-this.explode)*Math.min(1,dt*7);this.draw(t/1000);this.raf=requestAnimationFrame(this.frame);}
 draw(time){const ctx=this.ctx,w=this.w,h=this.h;ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.clearRect(0,0,w,h);
 const ex=this.explode,scale=Math.min(w*.20,h*.23)*(1-.22*ex),cx=w*.50,cy=h*.55+ex*h*.04;
 const yaw=this.yaw+(this.motion&&!this.drag?Math.sin(time*.4)*.035:0),co=Math.cos(yaw),si=Math.sin(yaw),cp=Math.cos(this.pitch),sp=Math.sin(this.pitch);
 const project=([x,y,z])=>{const xx=x*co+z*si,zz=-x*si+z*co;return {x:cx+xx*scale,y:cy-(y*cp-zz*sp)*scale,z:y*sp+zz*cp};};
 // Work-surface rings are orientation guides, not a physical dimension specification.
 ctx.save();ctx.translate(cx,cy+1.48*scale);ctx.scale(1,.26);for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(0,0,scale*(1.25+i*.39),scale*(1.25+i*.39),0,0,Math.PI*2);ctx.strokeStyle=i===0?'#a68bc750':'#ad98cc35';ctx.lineWidth=1;ctx.stroke();}
 const grd=ctx.createRadialGradient(0,0,4,0,0,1.4*scale);grd.addColorStop(0,'#76528e30');grd.addColorStop(1,'#76528e00');ctx.fillStyle=grd;ctx.fillRect(-scale*1.6,-scale*1.6,scale*3.2,scale*3.2);ctx.restore();
 const faces=[];
 const poly=(verts,color,stroke=null,id='',decal=false)=>{const p=verts.map(project);faces.push({p,z:p.reduce((a,v)=>a+v.z,0)/p.length,color,stroke,id,decal});};
 const box=(x,y,z,sx,sy,sz,colors,id='')=>{const a=x-sx/2,b=x+sx/2,c=y-sy/2,d=y+sy/2,e=z-sz/2,f=z+sz/2;const cs=typeof colors==='string'?[colors,colors,colors,colors,colors,colors]:colors;
  poly([[a,c,e],[b,c,e],[b,d,e],[a,d,e]],cs[0],null,id);poly([[a,c,f],[b,c,f],[b,d,f],[a,d,f]],cs[1],null,id);poly([[a,c,e],[a,c,f],[a,d,f],[a,d,e]],cs[2],null,id);poly([[b,c,e],[b,c,f],[b,d,f],[b,d,e]],cs[3],null,id);poly([[a,c,e],[b,c,e],[b,c,f],[a,c,f]],cs[4],null,id);poly([[a,d,e],[b,d,e],[b,d,f],[a,d,f]],cs[5],null,id);};
 const faceRound=(x,y,z,sx,sy,r,color)=>{r=Math.min(r,sx/2,sy/2);let pts=[];for(const [ox,oy,ang]of [[sx/2-r,sy/2-r,0],[-sx/2+r,sy/2-r,90],[-sx/2+r,-sy/2+r,180],[sx/2-r,-sy/2+r,270]])for(let i=0;i<=6;i++){const a=(ang+i*15)*Math.PI/180;pts.push([x+ox+r*Math.cos(a),y+oy+r*Math.sin(a),z]);}poly(pts,color,null,'',true);};
 const circle=(x,y,z,r,color)=>poly(Array.from({length:24},(_,i)=>[x+r*Math.cos(i*Math.PI/12),y+r*Math.sin(i*Math.PI/12),z]),color,null,'',true);
 const shell=['#cbbfdc','#faf7ff','#dfd5eb','#e6dcec','#bfb1d2','#fffaff'];
 const headY=.54+ex*1.6;
 // Weighted base and feet.
 box(0,-1.25,0,1.75,.28,1.2,['#baadcd','#e5d9f4','#cdbfe0','#d4c4e3','#baadcd','#f5eefc']);
 box(-.58,-1.43,.22,.52,.15,.77,'#afa0c4');box(.58,-1.43,.22,.52,.15,.77,'#afa0c4');
 if(!this.cutaway&&ex<.4)box(0,-.83,0,1.54,.65,1.05,shell,'body');
 else{box(0,-1.04,-.52,1.54,.55,.10,['#bca7d7','#e0cdec','#c0b0d6','#cdbbe4','#b3a0d0','#ece4f5']);box(-.73,-1.02,0,.09,.5,1.05,'#cdbde0');box(.73,-1.02,0,.09,.5,1.05,'#d8c8eb');}
 if(this.cutaway||ex>.1){
  const by=-.82+ex*.35;box(0,by,0,1.17,.07,.73,['#407665','#6ba78f','#3d7564','#55937f','#3a6a5a','#73b59a'],'controller');
  box(-.2,by+.11,.02,.48,.16,.44,['#929aa7','#dbe0e8','#aaaeb9','#d0d5df','#979aa6','#f0f0f5']);
  box(.4,by+.09,.10,.18,.11,.25,'#444254');
  for(let i=0;i<6;i++){box(-.46+i*.18,by+.07,.29,.06,.07,.04,'#d3bd7e');box(-.46+i*.18,by+.07,-.29,.06,.07,.04,'#d3bd7e');}
  if(ex>.1){box(-1.0*ex,by+.28,.48,.38,.07,.3,'#9f91c9','audio');box(.95*ex,by+.45,.2,.45,.09,.38,'#7fb6a1','sensor');}
 }
 // A yaw servo is separate from the conversational computer.
 box(0,-.26+ex*.75,0,.47,.48,.40,['#6b6ab5','#8585d6','#7272bc','#7a7ac7','#6767a4','#aaa6e5'],'servo');box(0,.02+ex*.75,0,.72,.06,.16,'#eee8f9');
 box(0,headY,0,1.56,1.07,1.04,shell,'display');
 // Front panel, eyes and microphone.
 faceRound(0,headY+.035,.53,1.31,.74,.13,'#282436');
 const blink=this.motion?(Math.sin(time*1.9)> .985?.07:1):1;
 faceRound(-.27,headY+.07,.54,.21,.26*blink,.045,'#c9f2e0');faceRound(.27,headY+.07,.54,.21,.26*blink,.045,'#c9f2e0');
 faceRound(0,headY-.13,.542,.18,.035,.015,'#a294bd');
 circle(.59,headY-.39,.54,.025,'#51435e');circle(-.59,headY-.39,.54,.025,'#b6e6a3');
 box(-.9,-.68,0,.25,.4,.32,shell);box(.9,-.68,0,.25,.4,.32,shell);
 if(!this.cutaway&&ex<.4){faceRound(0,-.84,.54,.85,.22,.08,'#e5dcef');for(let i=0;i<9;i++)faceRound(-.32+i*.08,-.84,.547,.023,.115,.01,'#a99dbd');}
 // Draw painter-sorted orthographic geometry. No claim of physically based materials.
 const surfaces=faces.filter(f=>!f.decal).sort((a,b)=>a.z-b.z);const decals=co>0?faces.filter(f=>f.decal):[];for(const f of [...surfaces,...decals]){ctx.beginPath();f.p.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=f.color;ctx.fill();ctx.strokeStyle=f.stroke||'#70618612';ctx.lineWidth=.5;ctx.stroke();}
 const pts=[{id:'display',name:'OLED display',text:'A small screen makes state visible: idle, listening, processing or offline.',p:[.64,headY+.3,.55],asset:'oled'},{id:'servo',name:'Yaw servo',text:'One limited axis turns the head. Use a suitable separate supply and common signal reference.',p:[.3,-.25+ex*.75,.25],asset:'servos'},{id:'controller',name:'ESP32 controller',text:'Reads inputs and runs the local state machine. The browser model is a concept, not a wiring specification.',p:[-.56,-.78+ex*.35,.4],asset:'esp'}];
 this.hit=pts.map(p=>({...p,...project(p.p)}));
 for(const p of this.hit){const active=p.id===this.hover;ctx.beginPath();ctx.arc(p.x,p.y,active?10:6,0,Math.PI*2);ctx.fillStyle=active?'#fff':'#ffffffc0';ctx.fill();ctx.beginPath();ctx.arc(p.x,p.y,active?4:2.5,0,Math.PI*2);ctx.fillStyle='#8c6ac9';ctx.fill();}
 }
}
root.Visuals={art,RobotScene};
})(window);
