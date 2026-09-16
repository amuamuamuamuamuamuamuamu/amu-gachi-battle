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
  if(param('admin')||!room)admin();else if(state.user)main();else register();
})();
