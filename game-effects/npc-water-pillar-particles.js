/*
 * NPC消滅用・水柱パーティクル（派手版）
 * 使い方: window.NpcWaterPillarParticles.play({host: characterNpcWrap, image: npc.image});
 */
(()=>{
  const play=({host,image,duration=2000})=>{
    if(!host||!image)return;
    const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),W=300,H=560,cx=W/2,base=H*.83,started=performance.now();
    canvas.width=W;canvas.height=H;canvas.className='npc-water-pillar-particles';canvas.setAttribute('aria-hidden','true');
    Object.assign(canvas.style,{position:'absolute',pointerEvents:'none',zIndex:'10',transform:'translate(0,0)'});
    const droplets=Array.from({length:56},(_,i)=>({
      delay:.1+(i%8)*.018,
      angle:-Math.PI/2+((i%14)-6.5)*.125,
      spread:92+(i%7)*20,
      lift:250+(i%9)*30,
      size:4+(i%5)*2
    }));
    const sparkles=Array.from({length:42},(_,i)=>({
      // 消滅した瞬間から黄色いきらめきを広げる。
      delay:0,
      angle:i*2.399,
      reach:45+(i%8)*18,
      rise:80+(i%6)*18,
      size:3+(i%4)*1.5
    }));
    host.append(canvas);
    const drawStar=(x,y,r,alpha)=>{
      ctx.fillStyle='rgba(255,221,58,'+alpha+')';ctx.beginPath();
      for(let i=0;i<8;i++){const a=-Math.PI/2+i*Math.PI/4,d=i%2?r*.34:r*1.5;const px=x+Math.cos(a)*d,py=y+Math.sin(a)*d;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}
      ctx.closePath();ctx.fill();
    };
    const paint=now=>{
      if(!canvas.isConnected)return;
      const t=Math.min(1,(now-started)/duration),style=image.style;
      canvas.style.left=style.left;canvas.style.top=style.top;canvas.style.width=style.width;canvas.style.height=style.height;
      ctx.clearRect(0,0,W,H);ctx.save();ctx.globalCompositeOperation='lighter';
      const ring=Math.min(1,t/.24),ringFade=Math.max(0,1-t/.58),radius=18+ring*142;
      ctx.strokeStyle='rgba(41,227,255,'+(ringFade*.96)+')';ctx.lineWidth=9*(1-t*.48);ctx.beginPath();ctx.ellipse(cx,base,radius,radius*.2,0,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='rgba(228,255,255,'+(ringFade*.85)+')';ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(cx,base,radius*.73,radius*.12,0,0,Math.PI*2);ctx.stroke();
      const jetPhase=Math.max(0,Math.min(1,(t-.09)/.62)),jetFade=Math.sin(jetPhase*Math.PI);
      if(jetPhase>0&&jetPhase<1){
        const jetHeight=390*Math.sin(jetPhase*Math.PI*.72),jetWidth=45+jetPhase*34;
        for(let i=0;i<9;i++){
          const lane=(i-4)/4,lean=lane*(42+jetPhase*55),topX=cx+lean,topY=base-jetHeight*(.82-Math.abs(lane)*.14);
          const gradient=ctx.createLinearGradient(cx,base,topX,topY);gradient.addColorStop(0,'rgba(20,183,255,'+(jetFade*.8)+')');gradient.addColorStop(.55,'rgba(89,240,255,'+(jetFade*.96)+')');gradient.addColorStop(1,'rgba(244,255,255,'+(jetFade*.92)+')');
          ctx.strokeStyle=gradient;ctx.lineWidth=Math.max(5,jetWidth*(.32-Math.abs(lane)*.035));ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx+lane*30,base);ctx.quadraticCurveTo(cx+lane*17,base-jetHeight*.47,topX,topY);ctx.stroke();
        }
      }
      droplets.forEach(drop=>{
        const p=Math.max(0,Math.min(1,(t-drop.delay)/.63));if(!p||p>=1)return;
        const fade=Math.sin(p*Math.PI),x=cx+Math.cos(drop.angle)*drop.spread*p,y=base-drop.lift*p+170*p*p,r=drop.size*(.7+fade*.72),gradient=ctx.createRadialGradient(x-r*.22,y-r*.32,1,x,y,r*1.5);
        gradient.addColorStop(0,'rgba(255,255,255,'+(fade*.98)+')');gradient.addColorStop(.38,'rgba(129,245,255,'+(fade*.96)+')');gradient.addColorStop(1,'rgba(0,152,255,0)');ctx.fillStyle=gradient;ctx.beginPath();ctx.ellipse(x,y,r*.72,r*1.7,drop.angle+Math.PI/2,0,Math.PI*2);ctx.fill();
      });
      sparkles.forEach(star=>{const p=Math.max(0,Math.min(1,(t-star.delay)/.5));if(!p||p>=1)return;const fade=Math.sin(p*Math.PI),x=cx+Math.cos(star.angle)*star.reach*p,y=base-64-Math.sin(star.angle)*star.rise*p;drawStar(x,y,star.size,fade)});
      ctx.restore();if(t<1)requestAnimationFrame(paint);else canvas.remove();
    };
    requestAnimationFrame(paint);
  };
  window.NpcWaterPillarParticles={play};
})();
