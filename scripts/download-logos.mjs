/**
 * Baixa as logos reais dos times a partir do Wikipedia (API images + imageinfo) para
 * public/logos/<id>.<ext>. Uso pessoal/fan (projeto não-comercial).
 * Rodar: node scripts/download-logos.mjs
 *
 * Estratégia: na página do time, escolhe o arquivo de imagem cujo NOME contém a keyword do
 * time (ex.: "vitality"), evitando logos de outros torneios/jogos e ícones do Commons.
 * Times sem match são pulados (o jogo usa o emblema procedural do TeamCrest como fallback).
 * Já pula ids cujo arquivo existe em public/logos (re-rodar só completa o que falta).
 */
import { writeFile, mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Diretório de saída resolvido relativo a ESTE arquivo (funciona de qualquer cwd)
const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'logos');

// [id no realTeams, título da página Wikipedia EN, keyword que deve estar no nome do arquivo]
const TEAMS = [
  ['furia', 'Furia Esports', 'furia'],
  ['pain', 'PaiN Gaming', 'pain'],
  ['mibr', 'Made in Brazil (esports)', 'made in brazil'],
  ['imperial', 'Imperial Esports', 'imperial'],
  ['legacy', 'Legacy (Brazilian esports)', 'legacy'],
  ['red_canids', 'RED Canids', 'canids'],
  ['vitality', 'Team Vitality', 'vitality'],
  ['navi', 'Natus Vincere', 'natus'],
  ['faze', 'FaZe Clan', 'faze'],
  ['g2', 'G2 Esports', 'g2 esports'],
  ['mouz', 'Mousesports', 'mouz'],
  ['spirit', 'Team Spirit (esports)', 'spirit'],
  ['falcons', 'Team Falcons', 'falcons'],
  ['liquid', 'Team Liquid', 'liquid'],
  ['complexity', 'Complexity Gaming', 'complexity'],
  ['astralis', 'Astralis', 'astralis'],
  ['virtus_pro', 'Virtus.pro', 'virtus'],
  ['heroic', 'Heroic (esports)', 'heroic'],
  ['nip', 'Ninjas in Pyjamas', 'ninjas'],
  ['fnatic', 'Fnatic', 'fnatic'],
  ['big', 'BIG (esports)', 'big'],
  ['ence', 'ENCE', 'ence'],
  ['cloud9', 'Cloud9', 'cloud9'],
  ['gamerlegion', 'GamerLegion', 'gamerlegion'],
  ['mongolz', 'The MongolZ', 'mongolz'],
  ['eternal_fire', 'Eternal Fire', 'eternal'],
  ['9z', '9z Team', '9z'],
  ['loud', 'Loud (esports)', 'loud'],
  // --- times da expansão (Onda +times) ---
  ['kru', 'KRÜ Esports', 'kru'],
  ['intz', 'INTZ', 'intz'],
  ['isurus', 'Isurus Gaming', 'isurus'],
  ['keyd', 'Vivo Keyd', 'keyd'],
  ['nouns', 'Nouns (esports)', 'nouns'],
  ['alliance', 'Alliance (esports)', 'alliance'],
  ['bad_news_eagles', 'Bad News Eagles', 'bad news'],
  ['fire_flux', 'Fire Flux Esports', 'fire flux'],
  ['nemiga', 'Nemiga Gaming', 'nemiga'],
  ['sashi', 'Sashi Esport', 'sashi'],
  ['metizport', 'Metizport', 'metizport'],
  ['endpoint', 'Endpoint (esports)', 'endpoint'],
  ['boss', 'BOSS (esports)', 'boss'],
  ['iberian_soul', 'Iberian Soul', 'iberian'],
  ['rooster', 'Rooster (esports)', 'rooster'],
  ['mindfreak', 'Mindfreak', 'mindfreak'],
  ['sampi', 'Sampi', 'sampi'],
];

const API = 'https://en.wikipedia.org/w/api.php';
const UA = { 'User-Agent': 'ProStrikeManagerBot/1.0 (https://github.com/gika; fan project, personal use)' };
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const getJson = async (params) => {
  const url = `${API}?${new URLSearchParams({ format: 'json', ...params })}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(url, { headers: UA });
    const text = await r.text();
    try { return JSON.parse(text); } catch { await sleep(3000 * (attempt + 1)); }
  }
  throw new Error('rate-limited (sem JSON após retries)');
};

// Acha o arquivo de logo: precisa conter a KEYWORD do time E "logo"/imagem, e NÃO ser ícone genérico.
const findLogoFile = async (pageTitle, keyword) => {
  const data = await getJson({ action: 'query', titles: pageTitle, prop: 'images', imlimit: '60', redirects: '1' });
  const page = Object.values(data?.query?.pages ?? {})[0];
  if (!page || !page.images) return null;
  const files = page.images.map((i) => i.title);
  const lixo = /medal|icon|wiki|commons|edit|red x|question|ambox|cruz|increase|decrease|steady|flag of/i;
  const img = (t) => /\.(svg|png)$/i.test(t) && !lixo.test(t);
  const kw = keyword.toLowerCase();
  // 1ª escolha: contém a keyword do time. 2ª: contém keyword + "logo".
  return files.find((t) => img(t) && t.toLowerCase().includes(kw)) ?? null;
};

const getFileUrl = async (fileTitle) => {
  const data = await getJson({ action: 'query', titles: fileTitle, prop: 'imageinfo', iiprop: 'url' });
  const page = Object.values(data?.query?.pages ?? {})[0];
  return page?.imageinfo?.[0]?.url ?? null;
};

const run = async () => {
  await mkdir(OUT_DIR, { recursive: true });
  const existentes = new Set((await readdir(OUT_DIR)).map((f) => f.replace(/\.[^.]+$/, '')));
  const okIds = [];
  for (const [id, title, keyword] of TEAMS) {
    if (existentes.has(id)) { console.log(`JÁ TEM ${id}`); continue; }
    await sleep(1200);
    try {
      const file = await findLogoFile(title, keyword);
      if (!file) { console.log(`SKIP  ${id} (sem logo "${keyword}" em "${title}")`); continue; }
      const url = await getFileUrl(file);
      if (!url) { console.log(`SKIP  ${id} (sem url p/ ${file})`); continue; }
      const ext = (url.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
      const bin = await fetch(url, { headers: UA });
      const buf = Buffer.from(await bin.arrayBuffer());
      if (buf.length < 200) { console.log(`SKIP  ${id} (vazio)`); continue; }
      await writeFile(resolve(OUT_DIR, `${id}.${ext}`), buf);
      console.log(`OK    ${id}.${ext}  (${buf.length} bytes)  <- ${file}`);
      okIds.push(`${id}.${ext}`);
    } catch (e) {
      console.log(`ERRO  ${id}: ${e.message}`);
    }
  }
  console.log(`\nNovas: ${okIds.length} -> ${okIds.join(', ')}`);
};

run();
