/* 編集ボタンは端末差のないURL遷移でも開けるようにする。 */
(()=>{
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('.event-npc-editor-v2 [data-edit]');
    if(!button)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const url=new URL(location.href);
    url.searchParams.set('eventEdit',button.dataset.edit);
    location.assign(url.href);
  },true);
})();
