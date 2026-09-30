import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { assertCatalog, availableChoices, changeSelection, emptySelection, selectedChoices, SENS_KEYS } from '../src/domain/recommendationsV1.js';
import { savePlayerProfile, loadPlayerProfile, emptyPlayerProfile } from '../src/domain/playerProfile.js';
import { createV1Plan, commitV1Plan, runV1Import, assertV1Target, assertV1Credential } from '../scripts/importRecommendationsV1.js';
const release = JSON.parse(await readFile(new URL('../src/data/recommendations-v1.json',import.meta.url)));
const devices = release.devices;
const env = { VITE_FIREBASE_PROJECT_ID:'fullhead---next', VITE_FULLHEAD_ENV:'next-testing', FULLHEAD_ENV:'next-testing' };
const device = model => devices.find(d => d.model === model);
function selection(d, profile, variantIndex=0) {
  return { ...emptySelection(), deviceId:d.id, variantId:d.variants[variantIndex].id, platform:d.variants[variantIndex].platform || d.platform || 'Android', profile, fingers:'2', objective:'Conforto' };
}
test('release has exactly 154 distinct identities, 189 distinct options and all original components', () => {
  assert.equal(assertCatalog(devices).length,154);
  assert.equal(devices.reduce((n,d)=>n+d.options.length,0),189);
  assert.equal(devices.reduce((n,d)=>n+d.huds.length,0),177);
  assert.equal(devices.reduce((n,d)=>n+d.configs.length,0),177);
  assert.equal(devices.reduce((n,d)=>n+d.legacyIds.sensibilidade.length,0),178);
  for(const d of devices) {
    assert.equal(d.activeOption,null);
    for(const o of d.options) {
      assert.equal(o.active,false); assert.equal(o.needsCalibration,true);
      assert.equal(o.revisadaPeloFullHead,false); assert.equal(o.testadaPorUsuarios,false);
      for(const k of SENS_KEYS) assert.ok(Number.isInteger(o.values[k]) && o.values[k]>=0 && o.values[k]<=200);
    }
  }
  const broken=structuredClone(devices);broken[0].options[0].values.general=201;
  assert.throws(()=>assertCatalog(broken),/Escala/);
  assert.throws(()=>assertCatalog(devices.slice(1)),/154/);
});
test('P0 conflicts remain independent and never selected implicitly', () => {
  for(const [model,count] of [['Redmi Note 12',6],['iPhone 16 Pro Max',3],['iPhone 17 Pro Max',3]]) {
    const d=device(model),s=selection(d,model.startsWith('iPhone')?'Pro':'Geral');
    s.fingers=String(d.options.find(o=>o.profile===s.profile)?.fingers || 2);
    assert.equal(d.options.length,count);assert.equal(d.variantRequired,true);
    assert.equal(selectedChoices(d,s).sensitivity,null);
    assert.equal(selectedChoices(d,s).hud,null);assert.equal(selectedChoices(d,s).config,null);
    assert.ok(availableChoices(d,s).sensitivities.length>=2);
  }
});
test('Redmi 4G/5G, platforms and exact Geral/Pro/iOS profiles never mix', () => {
  const d=device('Redmi Note 12'),s=selection(d,'Geral');
  const a=availableChoices(d,s);
  assert.ok(a.sensitivities.length>0);
  assert.ok(a.sensitivities.every(o=>o.variantId===d.variants[0].id && o.profile==='Geral'));
  const b=availableChoices(d,{...s,variantId:d.variants[1].id});
  assert.ok(b.sensitivities.every(o=>o.variantId===d.variants[1].id));
  assert.equal(availableChoices(d,{...s,platform:'iOS'}).sensitivities.length,0);
  assert.equal(availableChoices(d,{...s,variantId:''}).ready,false);
  assert.equal(availableChoices(d,{...s,profile:'iOS'}).sensitivities.length,0);
  const iphone=device('iPhone 15'), ios=selection(iphone,'iOS');
  assert.ok(availableChoices(iphone,ios).sensitivities.every(o=>o.profile==='iOS'));
  assert.ok(availableChoices(iphone,{...ios,profile:'Pro'}).sensitivities.every(o=>o.profile==='Pro'));
});
test('context changes clear dependent selections, even if their IDs still exist elsewhere', () => {
  const d=device('Redmi Note 12'),s={...selection(d,'Geral'),sensitivityId:d.options[0].id,hudId:d.huds[0].id,configId:d.configs[0].id};
  for(const [k,v] of [['variantId',d.variants[1].id],['platform','iOS'],['profile','Pro'],['fingers','3']]) {
    const next=changeSelection(s,k,v);for(const f of ['sensitivityId','hudId','configId'])assert.equal(next[f],'');
  }
  assert.equal(changeSelection(s,'deviceId',device('iPhone 11').id).variantId,'');
  assert.equal(selectedChoices(d,{...s,sensitivityId:'foreign'}).sensitivity,null);
});
test('existing local profile format survives and all V1 choices persist under the same per-account key', () => {
  const memory=new Map(),storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
  const d=device('Redmi Note 12'),s=selection(d,'Geral'),c=availableChoices(d,s);
  Object.assign(s,{sensitivityId:c.sensitivities[0].id,hudId:c.huds[0].id,configId:c.configs[0].id});
  const saved=savePlayerProfile(storage,'one',{...emptyPlayerProfile(),brand:d.brand,model:d.model,gameVersion:'OB54',selectionV1:s});
  assert.deepEqual(loadPlayerProfile(storage,'one'),saved);
  assert.deepEqual(loadPlayerProfile(storage,'two'),emptyPlayerProfile());
  for(const mode of ['sensibilidade','hud','config']) {
    assert.ok(mode);assert.equal(selectedChoices(d,loadPlayerProfile(storage,'one').selectionV1).sensitivity.id,s.sensitivityId);
  }
  assert.throws(()=>savePlayerProfile(storage,'one',{selectionV1:{...s,platform:'Other'}}),/Plataforma/);
  assert.equal(loadPlayerProfile(storage,'one').gameVersion,'OB54');
});
test('administrative dry-run is offline; destination and credentials are strictly limited', async () => {
  assert.deepEqual(await runV1Import({env,argv:['--dry-run']}),{mode:'dry-run',collection:'recommendations_v1',devices:154,options:189,written:0});
  for(const wrong of [{...env,VITE_FIREBASE_PROJECT_ID:'production'},{...env,FULLHEAD_ENV:'production'},{...env,FIRESTORE_EMULATOR_HOST:'localhost:8080'}])assert.throws(()=>assertV1Target(wrong));
  assert.throws(()=>assertV1Credential({type:'service_account',project_id:'another',client_email:'a@another.iam.gserviceaccount.com'}),/exclusivamente/);
  assert.doesNotThrow(()=>assertV1Credential({type:'service_account',project_id:'fullhead---next',client_email:'a@fullhead---next.iam.gserviceaccount.com'}));
  await assert.rejects(runV1Import({env,argv:['--write','--confirm-project=fullhead---next']}),/não configurada/);
});
test('import uses one create-only atomic batch; duplicate failure is propagated with no overwrite fallback', async () => {
  const plan=await createV1Plan();const staged=[];let commits=0;
  const db={collection:name=>({doc:id=>({name,id})}),batch:()=>({create:(ref,data)=>staged.push({ref,data}),commit:async()=>{commits++;throw Error('already-exists');}})};
  await assert.rejects(commitV1Plan(db,plan),/already-exists/);
  assert.equal(commits,1);assert.equal(staged.length,154);
  assert.ok(staged.every(x=>x.ref.name==='recommendations_v1'));
  const invalid=structuredClone(plan);invalid[0].collection='presets';
  await assert.rejects(commitV1Plan(db,invalid),/Coleção/);assert.equal(commits,1);
});
test('release has no historical raw notes or production resource names, rules deny client writes', async () => {
  assert.doesNotMatch(JSON.stringify(release),/private_key|BEGIN PRIVATE|panelfreefire-f90aa|dadosOriginaisNaoPublicos|projects\/|C:\\\\/);
  const rules=await readFile(new URL('../firestore.rules',import.meta.url),'utf8');
  assert.match(rules,/match \/recommendations_v1\/\{documentId\}\s*\{\s*allow read: if signedIn\(\);\s*allow write: if false;/);
  const app=await readFile(new URL('../src/App.jsx',import.meta.url),'utf8');
  for(const mode of ['sensibilidade','hud','config'])assert.ok(app.includes('RecommendationsV1 mode="'+mode+'"'));
});
