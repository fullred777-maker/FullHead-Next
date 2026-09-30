import { assertCatalog, SENS_KEYS } from '../src/domain/recommendationsV1.js';
const unique = values => [...new Set(values)];
const range = s => { const m = typeof s === 'string' && /(\d+)\s*[–-]\s*(\d+)%/.exec(s); return m ? { min: Number(m[1]), max: Number(m[2]) } : null; };
const asRange = v => Array.isArray(v) ? { min: v[0], max: v[1] } : null;
function hud(r) {
  const d = r.dadosOriginaisNaoPublicos;
  return { id: r.referenciaId, profile: r.perfilOriginal, fingers: /^([234]) dedos$/.test(d.fingers || '') ? Number(d.fingers[0]) : null,
    fire: range(/(?:Disparo|Tiro)\s*:\s*(\d+\s*[–-]\s*\d+%)/i.exec(d.steps || '')?.[1]),
    aim: range(/Mira\s*:\s*(\d+\s*[–-]\s*\d+%)/i.exec(d.steps || '')?.[1]), sourceId: r.procedencia.id };
}
function config(r) {
  const d = r.dadosOriginaisNaoPublicos;
  return { id: r.referenciaId, profile: r.perfilOriginal, graphics: d.graphics || null, shadows: d.shadow || null, filters: d.filters || null,
    fire: range(d.fireButton), aim: range(d.aimButton), fps: null, dpi: null, sourceId: r.procedencia.id };
}
// Whitelist public data. Never ship raw notes, paths, claims, credentials or production resource names.
export function adaptRecommendationsV1(source, sourceHash) {
  if (source.aparelhos?.length !== 154) throw Error('Esperados 154 aparelhos na fonte.');
  const sourceIds = new Map(source.fontesTecnicas.map(f => [f.id, f]));
  const devices = source.aparelhos.map(a => {
    if (a.opcaoAtiva !== null || a.revisadaPeloFullHead !== false || a.testadaPorUsuarios !== false) throw Error('Selos/seleção de origem inválidos.');
    const huds = a.referenciasLegadasIntegrais.hud.map(hud);
    const configs = a.referenciasLegadasIntegrais.configPro.map(config);
    for (const o of a.recomendacoes) {
      for (const h of o.HUDInicial.opcoes) {
        const target = huds.find(x => x.id === h.hudId);
        if (target) Object.assign(target, { fingers: h.quantidadeDedos, fire: asRange(h.tamanhoDisparoPercentual), aim: asRange(h.tamanhoMiraPercentual) });
      }
    }
    return {
      schemaVersion: 1, sourceHash, id: a.aparelhoId, brand: a.marca, model: a.modelo,
      platform: a.plataforma, variantRequired: a.variantRequired, activeOption: null,
      profiles: unique([...a.perfisEncontrados, ...a.perfisAssociados.map(p => p.perfilOriginal)]),
      variants: a.variantesPesquisadas.map(v => ({
        id: v.variantePesquisaId, name: v.modeloExatoNaFonte, platform: v.plataforma || a.plataforma,
        codes: v.codigosFabricante || [], region: v.regiaoFonte, connectivity: v.conectividadeMovel || [],
        chipset: v.chipset, gpu: v.gpu, hz: v.taxaAtualizacaoMaxHz,
      })),
      options: a.recomendacoes.map(o => {
        if (o.opcaoAtiva !== false || o.needsCalibration !== true || o.revisadaPeloFullHead !== false || o.testadaPorUsuarios !== false) throw Error('Opção ativa/selo inesperado.');
        return {
          id: o.recomendacaoId, deviceId: a.aparelhoId, variantId: o.variante?.variantePesquisaId || null,
          platform: o.plataforma, profile: o.perfil, fingers: o.quantidadeDedos, version: o.versaoRecomendacao,
          scale: { min: o.escala.min, max: o.escala.max }, values: Object.fromEntries(SENS_KEYS.map(k => [k, o[k]])),
          active: false, needsCalibration: true, revisadaPeloFullHead: false, testadaPorUsuarios: false,
          rule: o.origemDosNumeros.regra, origin: o.origemDosNumeros.tipo, confidence: o.confianca.numerica,
          anchors: o.ancorasPropriasPreservadas,
          origins: o.origemDosNumeros.referencias.map(r => ({ deviceId: r.aparelhoId, brand: r.marca, model: r.modelo, documentId: r.documentoId, weight: r.peso, values: r.valoresOriginais, hash: r.procedencia.sha256Arquivo })),
          sources: o.fontesTecnicas.map(id => { const f = sourceIds.get(id); if (!f || !/^https:\/\//.test(f.url)) throw Error('Fonte técnica inválida.'); return { id, title: f.tituloDescritivo, url: f.url }; }),
        };
      }),
      huds, configs,
      legacyIds: Object.fromEntries(Object.entries(a.referenciasLegadasIntegrais).map(([k, rs]) => [k, rs.map(r => r.procedencia.id)])),
      conflicts: a.conflitosPreservados.map(c => ({ type: c.tipo })),
    };
  });
  return assertCatalog(devices);
}
