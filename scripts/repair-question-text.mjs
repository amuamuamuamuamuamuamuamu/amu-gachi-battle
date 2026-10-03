import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const endpoint = 'https://nekosagasi.pages.dev/api/layout';
const source = await readFile(new URL('../app-card-battle-v2.js', import.meta.url), 'utf8');
const start = source.indexOf('const surveyImageFiles=');
const end = source.indexOf('const gameItemSrc=');
if (start < 0 || end < start) throw new Error('Question defaults were not found');
const { surveyImageFiles, quizTriviaDefaults } = new Function(
  `${source.slice(start, end)}\nreturn {surveyImageFiles,quizTriviaDefaults};`,
)();
const defaultQuizzes = quizTriviaDefaults();
const imagesOnly = process.argv.includes('--images-only');
if (defaultQuizzes.length !== 100 || surveyImageFiles.length !== 30) {
  throw new Error('Unexpected question defaults');
}
const surveyOrder = [
  ...surveyImageFiles.filter(name => /^架空(女性|男性[1-5]$)/.test(name)),
  ...surveyImageFiles.filter(name => !/^架空(女性|男性[1-5]$)/.test(name)),
];
if (surveyOrder.length !== 30) throw new Error('Unexpected survey image order');

function surveyText(imageFile) {
  if (/^架空女性/.test(imageFile)) return {
    question: 'この人はかわいいと思う？', choices: ['かわいい', 'かわいくない'],
  };
  if (/^架空男性全身/.test(imageFile)) return {
    question: 'この人の服装は好き？', choices: ['好き', '好きじゃない'],
  };
  if (/^架空男性/.test(imageFile)) return {
    question: 'この人はイケメンだと思う？', choices: ['イケメンだ', 'イケメンじゃない'],
  };
  if (imageFile === 'ジュース入りコップ') return {
    question: 'このジュースを飲んでみたい？', choices: ['飲んでみたい', '飲みたくない'],
  };
  if (/^動物|^架空の犬|^架空の猫/.test(imageFile)) return {
    question: 'この動物はかわいい？', choices: ['かわいい', 'かわいくない'],
  };
  if (/キノコ|実|チョコバー/.test(imageFile)) return {
    question: 'これを食べてみたい？', choices: ['食べてみたい', '食べたくない'],
  };
  return { question: 'これは好き？', choices: ['好き', '好きじゃない'] };
}

const response = await fetch(endpoint, { cache: 'no-store' });
if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
  throw new Error(`Could not read shared layout: ${response.status}`);
}
const payload = await response.json();
const layout = payload.layout;
if (!layout?.npcDefinitions) throw new Error('Shared NPC definitions were not found');
const before = JSON.stringify(layout);
let repairedQuizzes = 0;
let repairedSurveys = 0;
for (const definition of Object.values(layout.npcDefinitions)) {
  if (!definition || typeof definition !== 'object') continue;
  if (!imagesOnly && Array.isArray(definition.quizzes)) definition.quizzes.forEach((quiz, index) => {
    const idIndex = /^quiz(\d{3})$/.exec(String(quiz?.id || ''));
    const original = defaultQuizzes[idIndex ? Number(idIndex[1]) - 1 : index];
    if (!original || !quiz || !/[?？]{2,}/.test(`${quiz.question} ${quiz.choices?.join(' ')}`)) return;
    quiz.question = original.question;
    quiz.choices = [...original.choices];
    quiz.answer = original.answer;
    repairedQuizzes++;
  });
  if (Array.isArray(definition.surveys) && definition.surveys.length >= 30) {
    const firstImage = String(definition.surveys[0]?.imageFile || '');
    const images = firstImage === '?????????' || firstImage === 'ジュース入りコップ'
      ? surveyImageFiles : surveyOrder;
    definition.surveys.forEach((survey, index) => {
      if (!/[?？]{2,}/.test(`${survey.question} ${survey.choices?.join(' ')} ${survey.imageFile} ${survey.subject || ''}`)) return;
      if (index < images.length) {
        const imageFile = images[index];
        if (imagesOnly) {
          if (survey.imageFile === imageFile) return;
          survey.imageFile = imageFile;
          if (survey.id?.startsWith('survey-image-')) survey.id = `survey-image-${imageFile}`;
          repairedSurveys++;
          return;
        }
        const replacement = surveyText(imageFile);
        if (images === surveyOrder && index === 8) {
          replacement.question = 'Android派？ iPhone派？';
          replacement.choices = ['Android', 'iPhone'];
        }
        survey.imageFile = imageFile;
        survey.question = replacement.question;
        survey.choices = replacement.choices;
        if (survey.id?.startsWith('survey-image-')) survey.id = `survey-image-${imageFile}`;
      } else if (!imagesOnly) {
        survey.imageFile = '';
        survey.subject = '休日の過ごし方';
        survey.question = '休日はどう過ごしたい？';
        survey.choices = ['家でのんびり', '外へ出かける'];
      }
      if (!imagesOnly) repairedSurveys++;
    });
  }
}
const after = JSON.stringify(layout);
console.log(JSON.stringify({ repairedQuizzes, repairedSurveys, changed: before !== after,
  firstSurveyImage: layout.npcDefinitions.npc01?.surveys?.[0]?.imageFile }));
if (process.argv.includes('--prepare')) {
  const directory = new URL('../.repair-backups/', import.meta.url);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL(imagesOnly ? 'layout-before-images-only.json' : 'layout-before-text-only.json', directory), before);
  await writeFile(new URL(imagesOnly ? 'repaired-layout-images.json' : 'repaired-layout-text.json', directory), after);
  process.exit(0);
}
if (!process.argv.includes('--apply')) process.exit(0);
if (!repairedQuizzes && !repairedSurveys) throw new Error('No affected questions were found');
const backupDirectory = new URL('../.repair-backups/', import.meta.url);
await mkdir(backupDirectory, { recursive: true });
const backupPath = new URL(`shared-layout-before-question-text-${Date.now()}.json`, backupDirectory);
await writeFile(backupPath, before, { flag: 'wx' });
const saved = await fetch(endpoint, {
  method: 'PUT',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: after,
});
if (!saved.ok || !(await saved.json()).ok) throw new Error(`Could not save repaired layout: ${saved.status}`);
console.log(`Saved repaired layout. Backup: ${join('.repair-backups', backupPath.pathname.split('/').at(-1))}`);
