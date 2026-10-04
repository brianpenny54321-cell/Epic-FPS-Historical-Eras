(()=>{
const app=document.querySelector('#app');
app.innerHTML=`
<canvas id="view"></canvas>
<div id="boot"><div class="boot-card"><div class="kicker">PROJECT CHRONOS // FLIGHT BUILD</div><h1>OPERATION <span>TIDEBREAKER</span></h1><p>6DOF A-10 combat over the Persian Gulf</p><button id="fly">FLY NOW</button><small>W/S PITCH · A/D ROLL · MOUSE / ARROWS YAW · SPACE BOOST · F FIRE</small></div></div>
<div id="hud">
 <div class="topbar"><div><b>A-10C THUNDERBOLT II</b><span>GULF THEATER // KHARG SECTOR</span></div><div class="mission">MISSION 01 <strong>STRAIT DEFENSE</strong></div></div>
 <div class="telemetry"><div><small>AIRSPEED</small><b id="speed">000</b><em>KT</em></div><div><small>ALTITUDE</small><b id="alt">0000</b><em>FT</em></div><div><small>G</small><b id="g">1.0</b></div></div>
 <div class="ladder" id="ladder"></div><div class="reticle"></div>
 <div class="rwr"><span>RWR</span><i></i><i></i><i></i><i></i></div>
 <div class="weapon-readout"><small>GAU-8 AVENGER</small><b id="gun">∞</b><button id="gunBtn">30MM</button><button id="missileBtn">MISSILE</button><button id="boostBtn">BOOST</button></div>
 <div class="comms" id="comms">AWACS OVERLORD <span>— VISUAL ON HOSTILES. YOU ARE CLEARED HOT.</span></div>
 <div class="mobile-stick" id="stick"><div id="knob"></div><label>FLIGHT STICK</label></div>
 <div class="mobile-look" id="look">DRAG TO YAW</div>
 <div class="mobile-exit"><button id="exitBtn">EXIT</button></div>
 <div class="cross-info"><span>SPD</span><span>ALT</span><span>GUN READY</span></div>
</div>`;
const c=document.querySelector('#view'),ctx=c.getContext('2d');let W=0,H=0,D=1;
function resize(){D=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;c.width=W*D;c.height=H*D;c.style.width=W+'px';c.style.height=H+'px';ctx.setTransform(D,0,0,D,0,0)}addEventListener('resize',resize);resize();
const mobile=matchMedia('(pointer:coarse)').matches||'ontouchstart'in window;
const keys=new Set();addEventListener('keydown',e=>{keys.add(e.key.toLowerCase());if(e.key===' '){boost=true;e.preventDefault()}if(e.key.toLowerCase()==='f')fire()});addEventListener('keyup',e=>{keys.delete(e.key.toLowerCase());if(e.key===' ')boost=false});
let running=false,boost=false,shooting=false,gunHeat=0,missiles=4,score=0,last=performance.now(),shake=0;
const p={x:0,y:105,z:700, pitch:0,roll:0,yaw:0,vx:0,vy:0,vz:-115};
const input={pitch:0,roll:0,yaw:0};let stickId=null,lookId=null,lastLookX=0;
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
function angNorm(a){return Math.atan2(Math.sin(a),Math.cos(a))}
function basis(){
 const cp=Math.cos(p.pitch),sp=Math.sin(p.pitch),cr=Math.cos(p.roll),sr=Math.sin(p.roll),cy=Math.cos(p.yaw),sy=Math.sin(p.yaw);
 const f={x:sy*cp,y:sp,z:-cy*cp};
 const r={x:cy*cr+sy*sp*sr,y:-cp*sr,z:sy*cr-cy*sp*sr};
 const u={x:-cy*sr+sy*sp*cr,y:cp*cr,z:-sy*sr-cy*sp*cr};
 return {f,r,u};
}
function proj(v){
 const camX=p.x+v.x,camY=p.y+v.y,camZ=p.z+v.z;const b=basis(),dx=camX-p.x,dy=camY-p.y,dz=camZ-p.z;
 const x=dx*b.r.x+dy*b.r.y+dz*b.r.z,y=dx*b.u.x+dy*b.u.y+dz*b.u.z,z=dx*b.f.x+dy*b.f.y+dz*b.f.z;
 if(z<=4)return null;const f=Math.min(W,H)*.86;return {x:W/2+x*f/z,y:H/2-y*f/z,z};
}
function line3(a,b,fill,w=1){const A=proj(a),B=proj(b);if(!A||!B)return;ctx.strokeStyle=fill;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke()}
function poly3(points,fill,stroke='rgba(255,255,255,.15)'){const q=points.map(proj);if(q.some(x=>!x))return;ctx.fillStyle=fill;ctx.beginPath();q.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.stroke()}}
function worldPoint(x,y,z){return{x,y,z}}
function cloud(x,y,z,s){const blobs=[];for(let i=0;i<6;i++)blobs.push({x:x+(i-2.5)*s*.28,y:y+Math.sin(i)*s*.12,z:z+(i%2-.5)*s*.35,r:s*(.24+(i%3)*.06)});blobs.sort((a,b)=>b.z-a.z).forEach(b=>{const q=proj(b);if(q){ctx.fillStyle='rgba(235,242,238,.18)';ctx.beginPath();ctx.arc(q.x,q.y,Math.max(3,b.r*75/q.z),0,Math.PI*2);ctx.fill()}})}
const clouds=Array.from({length:28},(_,i)=>({x:(i*877%5600)-2800,y:80+(i*37%80),z:(i*1291%6000)-3000,s:100+(i%5)*35}));
function drawTerrain(){
 ctx.fillStyle='#5c8b8b';ctx.fillRect(0,0,W,H);
 const seaY=20;
 for(let gx=-3000;gx<=3000;gx+=300)for(let gz=-3000;gz<=3000;gz+=300){
   const wave=Math.sin(gx*.01+p.z*.0007)+Math.cos(gz*.012+p.x*.0005);
   const a={x:gx,y:seaY+wave*3,z:gz},b={x:gx+300,y:seaY+wave*3,z:gz},d={x:gx+300,y:seaY+wave*3,z:gz+300},e={x:gx,y:seaY+wave*3,z:gz+300};
   poly3([a,b,d,e],wave>0?'rgba(31,112,126,.55)':'rgba(24,93,109,.55)',null);
 }
 // runway
 poly3([{x:-130,y:23,z:1050},{x:130,y:23,z:1050},{x:150,y:23,z:-850},{x:-150,y:23,z:-850}],'#34383a',null);
 for(let z=-750;z<950;z+=100)line3({x:-8,y:25,z},{x:8,y:25,z},'rgba(255,255,255,.75)',5);
 // airfield buildings
 for(let i=0;i<8;i++){const x=-650+(i%4)*420,z=500+Math.floor(i/4)*250;poly3([{x:x-130,y:25,z:z-70},{x:x+130,y:25,z:z-70},{x:x+130,y:180,z:z-70},{x:x-130,y:180,z:z-70}], '#495056');poly3([{x:x-130,y:180,z:z-70},{x:x+130,y:180,z:z-70},{x:x+110,y:205,z:z-70},{x:x-110,y:205,z:z-70}], '#30363a')}
 // Kharg island
 poly3([{x:950,y:18,z:-1500},{x:2450,y:18,z:-1450},{x:2700,y:18,z:-650},{x:2050,y:20,z:-300},{x:1100,y:18,z:-700}],'#766c56',null);
 for(let i=0;i<7;i++){const x=1200+i*180,z=-1100+(i%2)*160;for(let j=0;j<3;j++){const r=90;const pts=[];for(let k=0;k<12;k++)pts.push({x:x+Math.cos(k*Math.PI/6)*r,y:20+j*65,z:z+Math.sin(k*Math.PI/6)*r});poly3(pts,'#6b4c38',null)}}
 // mountains
 for(let i=0;i<10;i++){const x=-2500+i*520,z=-2500-(i%3)*250,h=250+(i%4)*100;poly3([{x:x-300,y:20,z:z},{x:x+300,y:20,z:z},{x:x,y:h,z:z-100}],'#56605b',null)}
}
function drawClouds(){clouds.forEach(o=>cloud(o.x,o.y,o.z,o.s))}
function drawAircraft(){
 const b=basis(),pos={x:p.x+b.f.x*18,y:p.y+b.f.y*18,z:p.z+b.f.z*18};
 const pts=(x,y,z)=>({x:pos.x+b.r.x*x+b.u.x*y+b.f.x*z,y:pos.y+b.r.y*x+b.u.y*y+b.f.y*z,z:pos.z+b.r.z*x+b.u.z*y+b.f.z*z});
 // fuselage
 poly3([pts(-18,0,-45),pts(18,0,-45),pts(14,0,55),pts(-14,0,55)],'#5b684d',null);
 poly3([pts(-14,0,35),pts(14,0,35),pts(8,8,48),pts(-8,8,48)],'rgba(35,55,58,.95)',null);
 // wings
 poly3([pts(-18,0,15),pts(-170,0,-4),pts(-170,0,-30),pts(-10,0,-2)],'#4c5943',null);
 poly3([pts(18,0,15),pts(170,0,-4),pts(170,0,-30),pts(10,0,-2)],'#4c5943',null);
 // engines
 poly3([pts(-62,0,-22),pts(-28,0,-22),pts(-28,-18,-58),pts(-70,-18,-58)],'#3d443a',null);
 poly3([pts(28,0,-22),pts(62,0,-22),pts(70,-18,-58),pts(28,-18,-58)],'#3d443a',null);
 line3(pts(-70,-18,-58),pts(-28,-18,-58),'#ff9a35',5);line3(pts(70,-18,-58),pts(28,-18,-58),'#ff9a35',5);
 // tail
 poly3([pts(-14,0,-38),pts(-9,0,-72),pts(-9,45,-72),pts(-14,0,-48)],'#505d47',null);
 poly3([pts(14,0,-38),pts(9,0,-72),pts(9,45,-72),pts(14,0,-48)],'#505d47',null);
 // GAU-8
 line3(pts(0,-2,54),pts(0,-2,85),'#292d2c',8);
}
function drawLadder(){
 const el=document.querySelector('#ladder');let html='';for(let n=-30;n<=30;n+=10){const y=H/2+n*5+p.pitch*180;const w=n===0?180:90;html+=`<div class="ladder-line" style="top:${y}px;width:${w}px;transform:translateX(-50%) rotate(${-p.roll*57.3}deg)"><span>${Math.abs(n)}</span></div>`}el.innerHTML=html;el.style.transform=`translateX(${p.roll*180}px)`}
function hud(){
 const sp=Math.hypot(p.vx,p.vy,p.vz)*1.94384,alt=p.y*3.28084;document.querySelector('#speed').textContent=String(Math.round(sp)).padStart(3,'0');document.querySelector('#alt').textContent=String(Math.max(0,Math.round(alt))).padStart(4,'0');document.querySelector('#g').textContent=(1+Math.abs(input.pitch)*1.8).toFixed(1);drawLadder();
}
function fire(){if(!running||gunHeat>0)return;gunHeat=.09;shooting=true;shake=3;score+=10;document.querySelector('#gun').textContent='GAU-8';setTimeout(()=>shooting=false,70)}
function launch(){if(missiles<=0)return;missiles--;score+=150;const el=document.querySelector('#comms');el.innerHTML='WEAPON RELEASE <span>— MAVERICK AWAY. IMPACT TRACKING.</span>';setTimeout(()=>el.innerHTML='AWACS OVERLORD <span>— VISUAL ON HOSTILES. YOU ARE CLEARED HOT.</span>',1200)}
function start(){running=true;document.querySelector('#boot').classList.add('gone');if(!mobile)c.requestPointerLock?.()}
document.querySelector('#fly').onclick=start;document.querySelector('#gunBtn').onpointerdown=fire;document.querySelector('#missileBtn').onpointerdown=launch;document.querySelector('#boostBtn').onpointerdown=()=>boost=true;document.querySelector('#boostBtn').onpointerup=()=>boost=false;document.querySelector('#exitBtn').onclick=()=>{running=false;document.querySelector('#boot').classList.remove('gone')};
c.addEventListener('mousemove',e=>{if(running&&!mobile&&document.pointerLockElement===c)input.yaw=clamp(e.movementX*.003,-.12,.12)});
c.addEventListener('mousedown',e=>{if(e.button===0)fire()});
function setStick(e){const r=document.querySelector('#stick').getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),m=r.width*.34,d=Math.hypot(dx,dy),k=d>m?m/d:1;input.roll=clamp(dx*k/m,-1,1);input.pitch=clamp(-dy*k/m,-1,1);document.querySelector('#knob').style.transform=`translate(${dx*k}px,${dy*k}px)`}
const stick=document.querySelector('#stick');stick.onpointerdown=e=>{stickId=e.pointerId;stick.setPointerCapture(e.pointerId);setStick(e)};stick.onpointermove=e=>{if(e.pointerId===stickId)setStick(e)};stick.onpointerup=stick.onpointercancel=()=>{stickId=null;input.roll=input.pitch=0;document.querySelector('#knob').style.transform='translate(0,0)'};
const look=document.querySelector('#look');
look.onpointerdown=e=>{if(!running)return;lookId=e.pointerId;lastLookX=e.clientX;look.setPointerCapture(e.pointerId);look.classList.add('active');e.preventDefault()};
look.onpointermove=e=>{if(e.pointerId===lookId){input.yaw=clamp((e.clientX-lastLookX)*.012,-.35,.35);lastLookX=e.clientX;e.preventDefault()}};
look.onpointerup=look.onpointercancel=()=>{lookId=null;input.yaw=0;look.classList.remove('active')};
function update(dt){
 let pitch=((keys.has('s')?1:0)-(keys.has('w')?1:0));let roll=((keys.has('d')?1:0)-(keys.has('a')?1:0));if(Math.abs(input.pitch)>.01)pitch=input.pitch;if(Math.abs(input.roll)>.01)roll=input.roll;
 p.pitch+=pitch*dt*0.85;p.roll+=roll*dt*1.35;p.yaw+=input.yaw*dt*1.8;
 if(!pitch)p.pitch*=Math.pow(.08,dt);if(!roll)p.roll*=Math.pow(.018,dt);p.pitch=clamp(p.pitch,-.9,.9);p.roll=clamp(p.roll,-1.3,1.3);
 // coordinated yaw from bank, plus deliberate mouse/drag yaw
 p.yaw+=Math.sin(p.roll)*dt*.95;
 // Keep a small amount of forward momentum visible on the HUD and camera-facing world even when the pilot releases the stick.
 const b=basis(),target=boost?310:210,vel=Math.hypot(p.vx,p.vy,p.vz),acc=target-vel;
 p.vx+=b.f.x*acc*dt*.9;p.vy+=b.f.y*acc*dt*.9;p.vz+=b.f.z*acc*dt*.9;
 p.vx*=Math.pow(.985,dt*60);p.vy*=Math.pow(.985,dt*60);p.vz*=Math.pow(.985,dt*60);
 p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;
 if(p.y<35){p.y=35;p.vy=Math.abs(p.vy)*.3}
 p.x=clamp(p.x,-2950,2950);p.z=clamp(p.z,-2950,2950);
 gunHeat=Math.max(0,gunHeat-dt);shake=Math.max(0,shake-dt*15);hud();
}
function render(){
 ctx.save();ctx.clearRect(0,0,W,H);const grd=ctx.createLinearGradient(0,0,0,H);grd.addColorStop(0,'#79a6ba');grd.addColorStop(.48,'#b8c6bd');grd.addColorStop(.49,'#587e7c');grd.addColorStop(1,'#203d43');ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
 ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);drawTerrain();drawClouds();drawAircraft();
 if(shooting){ctx.fillStyle='rgba(255,170,50,.9)';ctx.beginPath();ctx.arc(W/2,H/2,10+Math.random()*12,0,Math.PI*2);ctx.fill()}
 ctx.restore();
}
function loop(t){const dt=Math.min(.033,(t-last)/1000);last=t;if(running)update(dt);render();requestAnimationFrame(loop)}hud();requestAnimationFrame(loop);
window.__flightReady=true;document.querySelector('#preflight')?.remove();
})();