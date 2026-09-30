import test from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createRequire } from 'node:module';
import { fileURLToPath,pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { build } from 'esbuild';
import { savePlayerProfile } from '../src/domain/playerProfile.js';
import { emptySelection,availableChoices } from '../src/domain/recommendationsV1.js';
const require=createRequire(import.meta.url);
const bundle=await build({
  stdin:{contents:'export {default as View} from "./src/components/RecommendationsV1.jsx"; export {PlayerProfileProvider} from "./src/context/PlayerProfileContext.jsx";',resolveDir:fileURLToPath(new URL('../',import.meta.url))},
  bundle:true,write:false,format:'esm',platform:'node',jsx:'automatic',
  plugins:[{name:'offline-v1',setup(b){
    b.onResolve({filter:/^react(?:-dom|-router-dom)?(?:\/|$)/},a=>({path:pathToFileURL(require.resolve(a.path)).href,external:true}));
    b.onResolve({filter:/(?:^firebase\/|\/firebase(?:\.js)?$)/},()=>({path:'firebase',namespace:'mock'}));
    b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:'export const db={};export const collection=()=>{throw Error("network prohibited");};export const getDocs=collection;'}));
    b.onLoad({filter:/\.css$/},()=>({contents:'',loader:'js'}));
  }}],
});
const ui=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const release=JSON.parse(await readFile(new URL('../src/data/recommendations-v1.json',import.meta.url)));
function render(mode, selection){
  const memory=new Map(), storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
  if(selection)savePlayerProfile(storage,'p',{model:release.devices.find(d=>d.id===selection.deviceId).model,selectionV1:selection});
  const prev=globalThis.window;globalThis.window={localStorage:storage};
  try{return renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(ui.PlayerProfileProvider,{userId:'p'},React.createElement(ui.View,{mode}))));}
  finally{if(prev===undefined)delete globalThis.window;else globalThis.window=prev;}
}
test('actual V1 UI has 154 device choices, accessible explicit selectors, neutral copy and no badges',()=>{
  const html=render('sensibilidade');
  assert.match(html,/154 aparelhos/);assert.match(html,/189 opções/);
  for(const d of release.devices)assert.ok(html.includes('value="'+d.id+'"'));
  for(const text of ['Recomendação inicial FullHead','Ajuste inicial personalizável','Selecione a variante do aparelho','Salvar perfil localmente','Opção de HUD','Quantidade de dedos','Objetivo pessoal'])assert.ok(html.includes(text));
  assert.doesNotMatch(html,/não confiável|não testado|sem validação registrada|Testada por usuários|Revisada pelo FullHead|garantid/i);
  assert.match(html,/aria-live="polite"/);assert.match(html,/<label/);
  assert.doesNotMatch(html,/class="v1-values"/);
});
test('saved independent choices render across the three real V1 views, iOS excludes Android DPI',()=>{
  const d=release.devices.find(d=>d.model==='iPhone 16 Pro Max');
  const s={...emptySelection(),deviceId:d.id,variantId:d.variants[0].id,platform:'iOS',profile:'Pro',fingers:'2',objective:'Conforto'};
  const c=availableChoices(d,s);
  Object.assign(s,{sensitivityId:c.sensitivities[1].id,hudId:c.huds[0].id,configId:c.configs[1].id});
  for(const mode of ['sensibilidade','hud','config']){
    const html=render(mode,s);
    assert.ok(html.includes(s.sensitivityId));assert.ok(html.includes(s.hudId));assert.ok(html.includes(s.configId));
    assert.match(html,/Versão:.*1.0.0-offline/);
    assert.doesNotMatch(html,/DPI é opcional|não confiável|não testado|sem validação registrada|garantid/i);
  }
  assert.match(render('sensibilidade',s),new RegExp('<dd>'+c.sensitivities[1].values.general+'</dd>'));
});
test('changing to an incompatible platform hides even a previously persisted numeric selection',()=>{
  const d=release.devices.find(d=>d.model==='Redmi Note 12');
  const html=render('sensibilidade',{...emptySelection(),deviceId:d.id,variantId:d.variants[0].id,platform:'iOS',profile:'Geral',fingers:'2',sensitivityId:d.options[0].id});
  assert.doesNotMatch(html,/class="v1-values"/);
});
