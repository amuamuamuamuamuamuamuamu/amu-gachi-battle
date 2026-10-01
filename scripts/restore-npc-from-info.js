/* NPC情報.txt から、消えた共有NPCのイベント本文を復元する一度きりの補助スクリプト。 */
const fs=require('fs');
const endpoint='https://nekosagasi.pages.dev/api/layout';
const text=fs.readFileSync('NPC情報.txt','utf8');
const sections=text.split(/^={10,}\s*$/m);
const quoted=line=>[...line.matchAll(/"([^"]*)"/g)].map(m=>m[1]);
const emptyOutcome=()=>({item:'',card:'',building:'',buildingMode:'show',npc:'',npcMode:'show'});
const typeFor=value=>value.startsWith('クイズ')?'quiz':value.startsWith('多数派')?'survey':value.startsWith('究極の2択')?'ultimate':value.startsWith('物を渡す')?'item':'words';
const sectionFor=(source,title)=>{const start=source.indexOf('【'+title);if(start<0)return'';const rest=source.slice(start);const end=rest.search(/\n【/);return end<0?rest:rest.slice(0,end)};
const message=(source,label)=>{const match=source.match(new RegExp('^'+label+':\\s*"(.*)"$','m'));return match?match[1].replace(/\\n/g,'\n'):''};
const wordsFor=source=>{
 const content=sectionFor(source,'言葉を作る');
 const left=content.match(/^左側の言葉:\s*(.*)$/m),right=content.match(/^右側の言葉:\s*(.*)$/m);
 const word1=left?quoted(left[1]):[],word2=right?quoted(right[1]):[],events={};
 for(const match of content.matchAll(/^\s*組み合わせ\s+(\d+):(\d+):[\s\S]*?(?=^\s*組み合わせ\s+|\n【|(?![\s\S]))/gm)){
  const [,i,j]=match,part=match[0];
  const art=part.match(/結果画像:\s*(\d{3})\s*→/);
  const item=part.match(/アイテム取得:\s*([^\s]+\.png)/);
  const npc=part.match(/NPC表示:[^（]*（ID:\s*([^）]+)）/);
  const building=part.match(/建物表示:.*（ID:\s*([^）]+)）/);
  events[i+':'+j]={...emptyOutcome(),art:art?art[1]:'',item:item?item[1]:'',npc:npc?npc[1]:'',building:building?building[1]:''};
 }
 return {word1,word2,events};
};
const quizzesFor=source=>{
 const content=sectionFor(source,'クイズ');const out=[];
 for(const match of content.matchAll(/^\s*問題\s+\d+:\s*"([^"]*)"\s*\n\s*A:\s*"([^"]*)"(【正解】)?\s*\n\s*B:\s*"([^"]*)"(【正解】)?/gm)){
  const [,question,a,aOk,b,bOk]=match;out.push({question,choices:[a,b],answer:bOk?1:0,correctOutcome:emptyOutcome()});
 }
 return out;
};
const surveysFor=source=>{
 const content=sectionFor(source,'多数派');const out=[];
 for(const match of content.matchAll(/^\s*問題\s+\d+:\s*"([^"]*)"([\s\S]*?)(?=^\s*問題\s+\d+:|\n【|(?![\s\S]))/gm)){
  const [,question,part]=match;const image=part.match(/出題物画像:\s*([^（\n]+?)(?:\s*（|\s*$)/m);const subject=part.match(/出題物（文字）:\s*"([^"]*)"/);const a=part.match(/^\s*A:\s*"([^"]*)"/m),b=part.match(/^\s*B:\s*"([^"]*)"/m);
  if(a&&b)out.push({id:'survey-restored-'+out.length,imageFile:image?image[1].trim():'',subject:subject?subject[1]:'',question,choices:[a[1],b[1]],majorityOutcome:emptyOutcome()});
 }
 return out;
};
const ultimatesFor=source=>{
 const content=sectionFor(source,'究極の2択');const out=[];
 for(const match of content.matchAll(/^\s*問題\s+\d+:\s*(?:"([^"]*)"|（未設定）)([\s\S]*?)(?=^\s*問題\s+\d+:|\n【|(?![\s\S]))/gm)){
  const [,q,part]=match;const answers=[...part.matchAll(/^\s*[AB]:\s*"([^"]*)"([\s\S]*?)(?=^\s*[AB]:|$)/gm)];if(answers.length<2)continue;
  const arts=answers.map(x=>(x[2].match(/結果画像:\s*(\d{3})\s*→/ )||[])[1]||'');const texts=answers.map(x=>(x[2].match(/結果の言葉:\s*"([^"]*)"/)||[])[1]||'');
  out.push({id:'ultimate-restored-'+out.length,question:q||'',questionArt:(part.match(/問題画像:\s*(\d{3})\s*→/)||[])[1]||'',choices:answers.map(x=>x[1]),resultArts:arts,resultTexts:texts,outcomes:[emptyOutcome(),emptyOutcome()]});
 }
 return out;
};
const itemsFor=source=>{
 const content=sectionFor(source,'物を渡す');const out=[];
 for(const match of content.matchAll(/^\s*登録\s+\d+:\s*渡すアイテム\s+([^\s]+\.png|（未設定）)([\s\S]*?)(?=^\s*登録\s+\d+:|\n【|(?![\s\S]))/gm)){
  const [,item,part]=match;const art=(part.match(/結果画像:\s*(\d{3})\s*→/)||[])[1]||'';const receive=(part.match(/受け取り時の言葉:\s*"([\s\S]*?)"/)||[])[1]?.replace(/\\n/g,'\n')||'';
  out.push({requiredItem:item==='（未設定）'?'':item,itemArt:art,receiveMessage:receive,outcome:emptyOutcome()});
 }
 return out;
};
async function main(){
 const response=await fetch(endpoint);const {layout}=await response.json();const defs=layout.npcDefinitions||{};let restored=0;
 for(const source of sections){
  const header=source.match(/^\[(\d+)\]\s*(.+)$/m),id=source.match(/^登録ID:\s*(.+)$/m),profile=source.match(/^NPC画像:\s*npc-light\/(npc\d+)\.png/m),event=source.match(/^現在のイベント:\s*(.+)$/m);
  if(!header||!id||!profile||!event)continue;
  const type=typeFor(event[1]),key=id[1].startsWith('event-')?id[1]:'event-restored-'+id[1];const old=defs[key]||{};
  const data={...old,eventType:type,eventNpcName:header[2].trim(),profileId:profile[1],firstMessage:message(source,'最初の言葉')||old.firstMessage||'',afterEventAction:old.afterEventAction||'remove',cooldownCondition:old.cooldownCondition||'npc-events-2',cooldownMessage:old.cooldownMessage||''};
  Object.assign(data,wordsFor(source),{quizzes:quizzesFor(source),surveys:surveysFor(source),ultimates:ultimatesFor(source),itemRegistrations:itemsFor(source)});
  defs[key]=data;restored++;
 }
 layout.npcDefinitions=defs;const put=await fetch(endpoint,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(layout)});if(!put.ok)throw new Error('PUT '+put.status);
 const stats=Object.values(defs).reduce((a,d)=>(a[d.eventType]=(a[d.eventType]||0)+1,a),{});console.log(JSON.stringify({restored,total:Object.keys(defs).length,stats}));
}
main().catch(error=>{console.error(error);process.exitCode=1});
