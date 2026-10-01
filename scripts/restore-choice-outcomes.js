const api = 'https://nekosagasi.pages.dev/api/layout';
const response = await fetch(api, { cache: 'no-store' });
if (!response.ok) throw new Error(`layout read failed: ${response.status}`);
const payload = await response.json();
const layout = payload.layout || {};
const choice = layout.npcDefinitions?.['event-dfdd1ecc-1a5b-41ed-879b-1fc05f530bb0'];
if (!choice?.ultimates?.[0]) throw new Error('two-choice NPC was not found');

const question = choice.ultimates[0];
question.question = 'あなたはレバーを引いて線路を切り替えられます。どちらを助けますか。';
question.questionArt = '026';
question.choices = ['おじいさん４人', '美人'];
question.resultArts = ['027', '028'];
question.resultTexts = ['めっちゃお金もらった', '付き合ったものの超わがままだった'];
question.outcomes = [
  { item: '', card: '', building: '', buildingMode: 'show', npc: 'event-220f84e1-7da9-4d51-aea0-195be2500575', npcMode: 'show' },
  { item: '下痢止め.png', card: '', building: '', buildingMode: 'show', npc: '', npcMode: 'show' },
];

// 多数派の質問配列は、先祖返りさせず現在の31問をそのまま保存する。
const survey = layout.npcDefinitions?.['event-ea553f0e-6b54-4e2f-9973-e15ee85a066b'];
if (!survey?.surveys?.length) throw new Error('majority NPC questions were not found');

const save = await fetch(api, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(layout) });
if (!save.ok) throw new Error(`layout save failed: ${save.status}`);
console.log(JSON.stringify({ choiceRestored: true, majorityQuestionsKept: survey.surveys.length }));
