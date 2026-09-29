(function(){
  var root=document.getElementById('app');
  var search=location.search||'';
  function param(name){var m=new RegExp('[?&]'+name+'=([^&]*)').exec(search);return m?decodeURIComponent(m[1]):''}
  var room=param('room'),key='amu-gachi-'+(room||'1'),state;
  try{state=JSON.parse(localStorage.getItem(key)||'null')}catch(e){}
  state=state||{user:'',monsters:[],selected:null,history:[]};
  function save(){localStorage.setItem(key,JSON.stringify(state))}
  function admin(){var html='<h1>あむガチバトル 管理画面</h1><p class="center">部屋を選んでください。</p>';for(var i=1;i<=10;i++)html+='<a class="btn gold compat-link" href="?room='+i+'">部屋 '+i+' に入る</a>';root.innerHTML=html}
  function register(){root.innerHTML='<h1>トレーナー登録</h1><p class="center">トレーナー名を入力してください。</p><input id="compatName" maxlength="12" placeholder="トレーナー名"><button id="compatStart" class="btn pink">登録してゲームを始める</button><a class="btn" href="?admin=1">管理画面</a>';document.getElementById('compatStart').onclick=function(){var name=document.getElementById('compatName').value.replace(/^\s+|\s+$/g,'');if(!name)return;state.user=name;save();main()}}
  function main(){root.innerHTML='<h1>あむガチバトル</h1><p class="center">トレーナー：'+state.user+'</p><p class="center">ゲームに入りました。</p><div class="actions"><button class="btn pink" onclick="location.reload()">ゲーム本体を読み直す</button><a class="btn" href="?admin=1">管理画面</a></div>'}
  function backButton(){return '<button id="compatBack" class="close">×</button>'}
  function openSimple(title,body){root.innerHTML=backButton()+'<h1>'+title+'</h1>'+body;document.getElementById('compatBack').onclick=main}
  main=function(){root.innerHTML='<h1>あむガチバトル</h1><p class="center">トレーナー：'+state.user+'</p><div class="actions"><button id="compatIssue" class="btn pink">モンスターを発行</button><button id="compatWarehouse" class="btn gold">モンスター倉庫</button><button id="compatBattle" class="btn purple">対戦する</button><button id="compatHistory" class="btn gold">対戦履歴</button><button id="compatCore" class="btn">モンスターのコア画像を見る</button><a class="btn" href="?admin=1">管理画面に戻る</a></div>';document.getElementById('compatIssue').onclick=function(){openSimple('モンスター発行画面','<p class="center">通常版を読み込んでいます。画面を再読み込みしてください。</p><button class="btn pink" onclick="location.reload()">再読み込み</button>')};document.getElementById('compatWarehouse').onclick=function(){openSimple('モンスター倉庫','<p class="center">保存されているモンスターはありません。</p><button class="btn gold" onclick="location.reload()">決定</button>')};document.getElementById('compatBattle').onclick=function(){openSimple('番号読み取り画面','<input inputmode="numeric" maxlength="5" placeholder="相手の5桁の数字"><button class="btn gold">この数字で対戦</button>')};document.getElementById('compatHistory').onclick=function(){openSimple('対戦履歴','<p class="center">まだ対戦履歴はありません。</p>')};document.getElementById('compatCore').onclick=function(){openSimple('モンスターのコア画像','<p class="center">表示するモンスターがありません。</p>')}};
  if(param('admin')||!room)admin();else if(state.user)main();else register();
})();
