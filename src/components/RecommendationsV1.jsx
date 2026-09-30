import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase.js';
import packaged from '../data/recommendations-v1.json';
import { usePlayerProfile } from '../hooks/usePlayerProfile.js';
import ProfileActive from './ProfileActive.jsx';
import { assertCatalog, changeSelection, selectedChoices, V1_COLLECTION, V1_COPY, SENS_KEYS, provenanceLabel } from '../domain/recommendationsV1.js';
import './RecommendationsV1.css';

const localCatalog = assertCatalog(packaged.devices);
const formatRange = value => value ? value.min + '–' + value.max + '%' : 'Ajustar no jogo';
const labels = { general: 'Geral', redDot: 'Red Dot', x2: 'Mira 2x', x4: 'Mira 4x', awm: 'AWM', freeLook: 'Olhadinha' };

function Select({ label, value, onChange, options, placeholder = 'Selecione', disabled = false }) {
  return <label className="v1-field">{label}<select className="fh-select" value={value} onChange={e => onChange(e.target.value)} disabled={disabled}>
    <option value="">{placeholder}</option>
    {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
  </select></label>;
}

export default function RecommendationsV1({ mode = 'sensibilidade' }) {
  const { profile, loadError, save, catalogSelection: s, setCatalogSelection } = usePlayerProfile();
  const [catalog, setCatalog] = useState(localCatalog);
  const [transport, setTransport] = useState('Catálogo V1 incluído no app');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  useEffect(() => {
    let live = true;
    // Reading is limited by firebase.js to the Next project. No client writes.
    getDocs(collection(db, V1_COLLECTION)).then(snapshot => {
      const remote = assertCatalog(snapshot.docs.map(d => {
        const value = d.data();
        if (d.id !== value.id || value.sourceHash !== packaged.sourceHash) throw Error('Versão diferente.');
        return value;
      }));
      // Accept only the exact release included in this build.
      if (remote.some(d => JSON.stringify(d) !== JSON.stringify(localCatalog.find(x => x.id === d.id)))) {
        // Firestore may reorder object keys; compare canonical structures.
        const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
          ? Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])])) : value;
        if (JSON.stringify(canonical([...remote].sort((a,b) => a.id.localeCompare(b.id)))) !== JSON.stringify(canonical([...localCatalog].sort((a,b) => a.id.localeCompare(b.id))))) throw Error('Versão diferente.');
      }
      if (live) { setCatalog(remote); setTransport('Catálogo V1 sincronizado'); }
    }).catch(() => { if (live) setTransport('Catálogo V1 incluído no app · sincronização disponível posteriormente'); });
    return () => { live = false; };
  }, []);
  const device = catalog.find(d => d.id === s.deviceId);
  const variant = device?.variants.find(v => v.id === s.variantId);
  const choices = selectedChoices(device, s);
  const { sensitivity, hud, config } = choices;
  const availablePlatform = variant?.platform || device?.platform;
  const platforms = availablePlatform ? [availablePlatform] : ['Android', 'iOS', 'Emulador'];
  const filtered = catalog.filter(d => (d.brand + ' ' + d.model).toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const shown = device && !filtered.some(d => d.id === device.id) ? [device, ...filtered] : filtered;
  function change(key, value) { setCatalogSelection(current => changeSelection(current, key, value)); setMessage(''); }
  function saveLocal() {
    try {
      if (!device || !variant || !choices.ready || !s.objective.trim()) throw Error('Selecione aparelho, variante, plataforma, perfil, dedos e objetivo.');
      if ((!s.sensitivityId && choices.sensitivities.length) || (!s.hudId && choices.huds.length) || (!s.configId && choices.configs.length)) throw Error('Escolha explicitamente as opções disponíveis dos três componentes.');
      if ((s.sensitivityId && !sensitivity) || (s.hudId && !hud) || (s.configId && !config)) throw Error('Atualize as escolhas para este contexto.');
      save({ ...profile, brand: device.brand, model: device.model, variant: variant.name.slice(0,80), fingers: Number(s.fingers), objective: s.objective, selectionV1: s });
      setMessage('Perfil salvo localmente. Suas escolhas acompanham as três telas.');
    } catch (error) { setMessage(error.message); }
  }
  const title = mode === 'hud' ? 'HUD' : mode === 'config' ? 'Config Pro' : 'Sensibilidade';
  return <div className="module-page">
    <header className="module-header"><Link className="module-back-btn" to="/" aria-label="Voltar ao início">←</Link><div><h1 className="module-title">{title}</h1><p className="module-subtitle">{V1_COPY.subtitle}</p></div></header>
    <main className="v1-content">
      <ProfileActive />
      <nav className="v1-tabs" aria-label="Recomendações compartilhadas">
        <Link to="/sensi" aria-current={mode === 'sensibilidade' ? 'page' : undefined}>Sensibilidade</Link>
        <Link to="/hud" aria-current={mode === 'hud' ? 'page' : undefined}>HUD</Link>
        <Link to="/configs" aria-current={mode === 'config' ? 'page' : undefined}>Config Pro</Link>
      </nav>
      <p className="v1-muted">{catalog.length} aparelhos · 189 opções · {transport}</p>
      <section className="v1-card" aria-label="Seleção do aparelho e contexto">
        <h2>Escolha seu contexto</h2>
        <label className="v1-field">Buscar aparelho<input className="fh-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Marca ou modelo" /></label>
        <div className="v1-grid">
          <Select label="Aparelho" value={s.deviceId} onChange={v => change('deviceId',v)} options={shown.map(d => ({ id:d.id,label:d.brand+' '+d.model }))} />
          <Select label="Variante" value={s.variantId} placeholder={V1_COPY.variant} disabled={!device} onChange={v => change('variantId',v)} options={(device?.variants || []).map(v => ({id:v.id,label:[v.name,v.region,v.chipset].filter(Boolean).join(' · ')}))} />
          <Select label="Plataforma" value={s.platform} disabled={!variant} onChange={v => change('platform',v)} options={platforms.map(p => ({id:p,label:p}))} />
          <Select label="Perfil" value={s.profile} disabled={!device} onChange={v => change('profile',v)} options={(device?.profiles || []).map(p => ({id:p,label:p}))} />
          <Select label="Quantidade de dedos" value={s.fingers} disabled={!s.profile} onChange={v => change('fingers',v)} options={['2','3','4'].map(p => ({id:p,label:p+' dedos'}))} />
          <label className="v1-field">Objetivo pessoal<input className="fh-input" value={s.objective} maxLength={120} onChange={e => change('objective',e.target.value)} placeholder="Ex.: conforto e controle de mira" /></label>
        </div>
        {device?.variantRequired && !s.variantId && <p role="status">{V1_COPY.variant}</p>}
        {variant && <p className="v1-muted">{variant.codes.length ? 'Códigos: '+variant.codes.join(', ') + '. ' : ''}Confira o modelo e a região do seu aparelho. {variant.hz ? 'Tela: até '+variant.hz+' Hz; FPS depende do jogo.' : ''}</p>}
        {!availablePlatform && variant && <p className="v1-muted">Informe a plataforma do seu aparelho para contextualizar as opções.</p>}
        {device && <p className="v1-muted">Geral, Pro e iOS são perfis distintos do catálogo. O objetivo pessoal fica salvo sem alterar os números.</p>}
      </section>
      <section className="v1-card" aria-label="Escolha independente das recomendações">
        <h2>Escolha cada componente</h2>
        <p>As alternativas podem ter números, dedos e tamanhos de botões diferentes. Cada escolha é independente; as demais continuam disponíveis.</p>
        <div className="v1-grid">
          <Select label="Opção de Sensibilidade" disabled={!choices.ready} value={s.sensitivityId} onChange={v => change('sensitivityId',v)} options={choices.sensitivities.map(o => ({id:o.id,label:o.profile+' · '+SENS_KEYS.map(k => o.values[k]).join('/')+' · '+o.id.slice(-5)}))} />
          <Select label="Opção de HUD" disabled={!choices.ready} value={s.hudId} onChange={v => change('hudId',v)} options={choices.huds.map(o => ({id:o.id,label:(o.fingers ? o.fingers+' dedos' : 'Dedos a definir')+' · Disparo '+formatRange(o.fire)+' · Mira '+formatRange(o.aim)+' · '+o.sourceId.slice(-6)}))} />
          <Select label="Opção de Config Pro" disabled={!choices.ready} value={s.configId} onChange={v => change('configId',v)} options={choices.configs.map(o => ({id:o.id,label:(o.graphics || 'Manter gráficos')+' · Disparo '+formatRange(o.fire)+' · Mira '+formatRange(o.aim)+' · '+o.sourceId.slice(-6)}))} />
        </div>
        {choices.ready && ((!choices.sensitivities.length || !choices.huds.length || !choices.configs.length)) && <p className="v1-muted">Para componentes sem opção neste contexto, mantenha seu ajuste atual ou escolha outro perfil/dedos. Nenhuma opção de outro perfil foi combinada automaticamente.</p>}
        <button className="btn-copy" type="button" onClick={saveLocal}>Salvar perfil localmente</button>
        <p role="status" aria-live="polite">{message || loadError}</p>
      </section>
      <section className="v1-card" aria-label="Resultado da recomendação">
        <h2>{V1_COPY.title}</h2><p>{V1_COPY.subtitle}</p><p className="v1-muted">{V1_COPY.calibration}</p>
        {mode === 'sensibilidade' && (sensitivity ? <>
          <p>Escala 0–200 · {sensitivity.profile}</p><dl className="v1-values">{SENS_KEYS.map(k => <div key={k}><dt>{labels[k]}</dt><dd>{sensitivity.values[k]}</dd></div>)}</dl>
          <p className="v1-muted">Procedência: {provenanceLabel(sensitivity)}. Confiança: {sensitivity.confidence === 'media' ? 'média' : 'baixa'}. Versão: {sensitivity.version}.</p>
          <details><summary>Referências dos números</summary><ul>{sensitivity.origins.map((r,i) => <li key={r.documentId+i}>{r.brand} {r.model} · documento {r.documentId} · peso {r.weight}</li>)}</ul>
            <ul>{sensitivity.sources.map(f => <li key={f.id}><a href={f.url} target="_blank" rel="noreferrer">{f.title}</a></li>)}</ul></details>
        </> : <p>Selecione uma opção de Sensibilidade para ver os valores.</p>)}
        {mode === 'hud' && (hud ? <><h3>{hud.fingers ? hud.fingers+' dedos' : 'Dedos a definir'}</h3><p>Disparo: {formatRange(hud.fire)} · Mira: {formatRange(hud.aim)}</p><p>Posicione os controles manualmente conforme o alcance dos seus dedos.</p><p className="v1-muted">Procedência: HUD legado {hud.sourceId}. Confiança: baixa. Versão: 1.0.0-offline.</p></> : <p>Selecione uma opção de HUD para ver os controles.</p>)}
        {mode === 'config' && (config ? <><p>Gráficos: {config.graphics || 'Manter atual'} · Sombras: {config.shadows || 'Manter atual'} · Filtros: {config.filters || 'Manter atual'}</p><p>Disparo: {formatRange(config.fire)} · Mira: {formatRange(config.aim)}</p><p>Use apenas opções disponíveis no menu. Mantenha o FPS atual até confirmar as opções do jogo.</p>{s.platform === 'Android' && <p>DPI é opcional; mantenha o ajuste atual do sistema.</p>}<p className="v1-muted">Procedência: Config Pro legada {config.sourceId}. Confiança: baixa. Versão: 1.0.0-offline.</p></> : <p>Selecione uma opção de Config Pro para ver os ajustes.</p>)}
      </section>
    </main>
  </div>;
}
