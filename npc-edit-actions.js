/* 編集画面の保存・削除操作を共通化する。 */
(()=>{
 const key='nekosagasi-layout-v1';
 const read=()=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}};
 const removeCurrent=async root=>{
  const id=root.dataset.editingId||new URLSearchParams(location.search).get('eventEdit');
  if(!id||!confirm('本当に削除しますか？'))return;
  const data=read();
  delete data.npcDefinitions?.[id];
  for(const field of ['objects','placedObjects'])if(Array.isArray(data[field]))data[field]=data[field].filter(item=>!(item.kind==='npc'&&item.npc===id));
  localStorage.setItem(key,JSON.stringify(data));
  const response=await fetch('/api/layout',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(data)});
  if(!response.ok){alert('削除を保存できませんでした。');return}
  location.assign(location.pathname+'?editor=npcs');
 };
 const refresh=()=>document.querySelectorAll('.event-npc-editor-v2').forEach(root=>{
  root.querySelectorAll('[data-delete]').forEach(button=>button.remove());
  const form=root.querySelector('.event-npc-form'),editing=form?.querySelector('h3')?.textContent==='登録内容を編集',save=form?.querySelector('.event-save'),cancel=form?.querySelector('.event-cancel');
  if(!form||!save)return;
  if(!editing){save.textContent='登録する';if(cancel)cancel.hidden=false;form.querySelector('.npc-edit-delete')?.remove();return}
  save.textContent='保存する';if(cancel)cancel.hidden=true;
  if(!form.querySelector('.npc-edit-delete')){const button=document.createElement('button');button.type='button';button.className='npc-edit-delete';button.textContent='削除する';save.after(button)}
 });
 document.addEventListener('click',event=>{const edit=event.target.closest?.('.event-npc-editor-v2 [data-edit]');if(edit)edit.closest('.event-npc-editor-v2').dataset.editingId=edit.dataset.edit},true);
 document.addEventListener('click',event=>{const button=event.target.closest?.('.npc-edit-delete');if(!button)return;event.preventDefault();event.stopImmediatePropagation();removeCurrent(button.closest('.event-npc-editor-v2'))},true);
 setInterval(refresh,250);document.addEventListener('DOMContentLoaded',refresh);
})();
