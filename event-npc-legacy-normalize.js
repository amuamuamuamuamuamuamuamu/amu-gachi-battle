/* 旧形式の言葉イベントを、読み出し時だけ現在の配列形式へ変換する。 */
(()=>{
  const key='nekosagasi-layout-v1';
  const original=Storage.prototype.getItem;
  Storage.prototype.getItem=function(name){
    const value=original.call(this,name);
    if(name!==key||!value)return value;
    try{
      const data=JSON.parse(value);
      for(const definition of Object.values(data.npcDefinitions||{})){
        for(const field of ['word1','word2']){
          if(!Array.isArray(definition[field]))definition[field]=definition[field]?[String(definition[field])]:[''];
        }
        for(const field of ['itemRegistrations','ultimates','surveys','quizzes']){
          if(!Array.isArray(definition[field]))definition[field]=definition[field]&&typeof definition[field]==='object'?Object.values(definition[field]):[];
        }
        for(const registration of definition.itemRegistrations||[]){
          if(registration&&typeof registration==='object'&&!registration.outcome)registration.outcome={};
        }
        for(const ultimate of definition.ultimates||[]){
          if(!ultimate||typeof ultimate!=='object')continue;
          for(const field of ['choices','resultArts','resultTexts','outcomes'])if(!Array.isArray(ultimate[field]))ultimate[field]=ultimate[field]&&typeof ultimate[field]==='object'?Object.values(ultimate[field]):['',''];
        }
        for(const survey of definition.surveys||[])if(survey&&typeof survey==='object'&&!Array.isArray(survey.choices))survey.choices=survey.choices&&typeof survey.choices==='object'?Object.values(survey.choices):['',''];
        for(const quiz of definition.quizzes||[])if(quiz&&typeof quiz==='object'&&!Array.isArray(quiz.choices))quiz.choices=quiz.choices&&typeof quiz.choices==='object'?Object.values(quiz.choices):['',''];
      }
      return JSON.stringify(data);
    }catch{return value}
  };
})();
