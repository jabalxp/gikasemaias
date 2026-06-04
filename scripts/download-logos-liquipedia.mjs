/**
 * Baixa logos dos times via API da Liquipedia (MediaWiki) — cobre praticamente todos os times
 * de CS, inclusive tier 3/4. Uso pessoal/fan (projeto não-comercial).
 * Respeita a ToS: User-Agent identificável, gzip (o fetch do Node envia/descomprime sozinho)
 * e rate limit (~2.5s entre requests).
 * Rodar: node scripts/download-logos-liquipedia.mjs
 *
 * Pula ids cujo arquivo já existe em public/logos (ex.: os já baixados do Wikipedia).
 * Lê a lista de times de scripts/_teamlist.json ([{id,name,tag}]).
 */
import { writeFile, mkdir, readdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public', 'logos');
const API = 'https://liquipedia.net/counterstrike/api.php';
const UA = { 'User-Agent': 'ProStrikeManagerBot/1.0 (https://github.com/gika; personal fan project)', 'Accept-Encoding': 'gzip' };
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// alguns times têm nome de página diferente do nome no jogo (redirect cobre a maioria)
const PAGE_OVERRIDES = {
  keyd: 'Vivo Keyd Stars',
  mibr: 'MIBR',
  navi: 'Natus Vincere',
  mongolz: 'The MongolZ',
  '9z': '9z Team',
  pain: 'paiN Gaming',
  red_canids: 'RED Canids',
  bad_news_eagles: 'Bad News Eagles',
  virtus_pro: 'Virtus.pro',
  nip: 'Ninjas in Pyjamas',
  mouz: 'MOUZ',
};

const getJson = async (params) => {
  const url = `${API}?${new URLSearchParams({ format: 'json', ...params })}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(url, { headers: UA });
    const text = await r.text();
    try { return JSON.parse(text); } catch { await sleep(3000 * (attempt + 1)); }
  }
  throw new Error('rate-limited (sem JSON após retries)');
};

// keyword principal do time (primeira palavra significativa do nome)
const keywordOf = (name, tag) => {
  const stop = new Set(['the', 'team', 'esports', 'esport', 'gaming', 'club', 'e-sports']);
  const w = name.toLowerCase().replace(/[.]/g, '').split(/\s+/).filter((x) => x && !stop.has(x));
  return (w[0] || tag.toLowerCase()).replace(/[^a-z0-9]/g, '');
};

// fora: torneios, ícones e SUB-TIMES (academy/female/youth) que poluiriam o match
const lixoTorneio = /premier|major|iem|esl|blast|cup|league|tournament|icon|championship|circuit|qualifier|cct|pgl|gamers club|esea|flag of|medal|commons-logo|academy|female|\bfe\b|\bfem\b|women|youth|junior|\.jpg|\.jpeg/i;

const findLogoFile = async (pageTitle, keyword, tag) => {
  const data = await getJson({ action: 'query', titles: pageTitle, prop: 'images', imlimit: '200', redirects: '1' });
  const page = Object.values(data?.query?.pages ?? {})[0];
  if (!page || !page.images) return null;
  const files = page.images.map((i) => i.title);
  const kw = keyword.toLowerCase();
  const tg = tag.toLowerCase().replace(/[^a-z0-9]/g, '');
  const isImg = (t) => /\.(png|svg)$/i.test(t) && !lixoTorneio.test(t);
  const matchTeam = (t) => { const l = t.toLowerCase(); return l.includes(kw) || (tg.length >= 3 && l.includes(tg)); };
  // por modo: entre os candidatos, escolhe o nome mais curto (logo canônico tem menos palavras extras)
  for (const mode of ['allmode', 'darkmode', 'lightmode', 'logo']) {
    const cands = files.filter((t) => isImg(t) && matchTeam(t) && t.toLowerCase().includes(mode));
    if (cands.length) return cands.sort((a, b) => a.length - b.length)[0];
  }
  const fallback = files.filter((t) => isImg(t) && matchTeam(t));
  return fallback.length ? fallback.sort((a, b) => a.length - b.length)[0] : null;
};

const getFileUrl = async (fileTitle) => {
  const data = await getJson({ action: 'query', titles: fileTitle, prop: 'imageinfo', iiprop: 'url' });
  const page = Object.values(data?.query?.pages ?? {})[0];
  return page?.imageinfo?.[0]?.url ?? null;
};

const run = async () => {
  await mkdir(OUT_DIR, { recursive: true });
  const existentes = new Set((await readdir(OUT_DIR)).map((f) => f.replace(/\.[^.]+$/, '')));
  const teams = JSON.parse(readFileSync(resolve(ROOT, 'scripts', '_teamlist.json'), 'utf8'));
  const okIds = [];
  for (const { id, name, tag } of teams) {
    if (existentes.has(id)) continue;
    await sleep(2500);
    try {
      const pageTitle = PAGE_OVERRIDES[id] ?? name;
      const kw = keywordOf(name, tag);
      const file = await findLogoFile(pageTitle, kw, tag);
      if (!file) { console.log(`SKIP ${id} (sem logo "${kw}" em "${pageTitle}")`); continue; }
      await sleep(2500);
      const url = await getFileUrl(file);
      if (!url) { console.log(`SKIP ${id} (sem url)`); continue; }
      const ext = (url.split('?')[0].split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
      const bin = await fetch(url, { headers: UA });
      const buf = Buffer.from(await bin.arrayBuffer());
      if (buf.length < 200) { console.log(`SKIP ${id} (vazio ${buf.length}b)`); continue; }
      await writeFile(resolve(OUT_DIR, `${id}.${ext}`), buf);
      console.log(`OK   ${id}.${ext} (${buf.length}b) <- ${file}`);
      okIds.push(`${id}.${ext}`);
    } catch (e) {
      console.log(`ERRO ${id}: ${String(e.message).slice(0, 60)}`);
    }
  }
  console.log(`\nNovas via Liquipedia: ${okIds.length}\n${okIds.join(', ')}`);
};

run();
