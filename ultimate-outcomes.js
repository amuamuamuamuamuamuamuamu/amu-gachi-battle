(()=>{
  const key='nekosagasi-layout-v1';
  const items=['おはぎ.png','お通し.png','下痢止め.png','便器ブラシ.png','原子模型.png','名刺.png','宇宙人の角.png','拳銃.png','栄養剤.png','氷.png','液体の入ったフラスコ.png','温泉の素.png','話せる実.png','謎の培養カプセル.png','謎の菌がいる培養シャーレ.png','骨.png','黄色い大きいカプセル.png','３Dプリンター.png'];
  const read=()=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}};
  const write=data=>localStorage.setItem(key,JSON.stringify(data));
  const fillTargets=(select,type,data,value)=>{select.replaceChildren(new Option(type?'対象を選ぶ':'なし',''));if(type==='item')items.forEach(x=>select.add(new Option(x.replace('.png',''),x)));if(type==='building')(data.buildings||[]).forEach(x=>select.add(new Option(x.graphic||x.id,x.id)));if(type==='npc')for(let i=1;i<=30;i++){const id='npc'+String(i).padStart(2,'0');select.add(new Option('NPC '+String(i).padStart(2,'0'),id))}select.value=value||''};
  const addFields=(card,outcomes,data)=>{
    if(card.querySelector('.ultimate-outcome-fields'))return;
    const section=document.createElement('section');section.className='ultimate-outcome-fields';
    const title=document.createElement('b');title.textContent='画像の後に出すもの';section.append(title);
    ['A','B'].forEach((answer,index)=>{
      const outcome=outcomes[index]??(outcomes[index]={type:'',value:''});
      const row=document.createElement('label');row.className='ultimate-outcome-row';row.append('回答'+answer+'：');
      const type=document.createElement('select');type.innerHTML='<option value="">なし</option><option value="item">アイテム取得</option><option value="building">建築物を表示</option><option value="npc">NPCを表示</option>';type.value=outcome.type||'';
      const target=document.createElement('select');fillTargets(target,outcome.type,data,outcome.value);
      type.onchange=()=>{outcome.type=type.value;outcome.value='';fillTargets(target,outcome.type,data,'');write(data)};
      target.onchange=()=>{outcome.value=target.value;write(data)};
      row.append(type,target);section.append(row);
    });
    card.append(section);
  };
  const mount=()=>{
    const panel=document.querySelector('.ultimate-editor-panel'),picker=document.querySelector('#npcEventPicker');
    if(!panel||!picker?.value)return;
    const cards=[...panel.querySelectorAll('.npc-registration')];if(!cards.length)return;
    const data=read();data.npcDefinitions??={};const def=data.npcDefinitions[picker.value]??={};
    def.ultimates??=[];while(def.ultimates.length<cards.length)def.ultimates.push({id:'ultimate-'+Date.now()+'-'+def.ultimates.length,outcomes:[{type:'',value:''},{type:'',value:''}]});
    cards.forEach((card,index)=>{const entry=def.ultimates[index];entry.outcomes??=[{type:'',value:''},{type:'',value:''}];addFields(card,entry.outcomes,data)});
    write(data);
  };
  new MutationObserver(mount).observe(document.documentElement,{childList:true,subtree:true});
  setInterval(mount,500);
})();
