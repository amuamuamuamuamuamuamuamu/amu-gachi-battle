// メイン9自体の入口は、新設した9枚目（インデックス8）に残す。
const api='https://nekosagasi.pages.dev/api/layout';
const response=await fetch(api,{cache:'no-store'});
if(!response.ok)throw new Error(`layout read failed: ${response.status}`);
const payload=await response.json(),layout=payload.layout||{};
const main9Ids=new Set(['restored-m9-left','restored-m9-top']);
let updated=0;
for(const item of layout.objects||[]){
  if(main9Ids.has(item.id)){item.map=8;updated++}
}
if(updated!==2)throw new Error(`main9 gateway count is ${updated}, expected 2`);
const saved=await fetch(api,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(layout)});
if(!saved.ok)throw new Error(`layout save failed: ${saved.status}`);
console.log(JSON.stringify({updated,main9Map:8,link:12}));
