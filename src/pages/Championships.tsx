import React, { useMemo, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { realMaps } from '../game/data/realMaps';
import { TeamCrest } from '../components/ui/TeamCrest';
import {
  Trophy,
  Crown,
  DollarSign,
  Swords,
  ListOrdered,
  Flag,
  BarChart3,
  MapPin,
  History as HistoryIcon,
} from 'lucide-react';
import { Tournament, TournamentMatch, Player, Team } from '../types';

/** Cor de borda/destaque por tier do torneio (espelha Calendar.tsx). */
const TIER_ACCENT: Readonly<Record<Tournament['tier'], string>> = {
  1: 'border-brand-cyan/50 text-brand-cyan',
  2: 'border-brand-purple/50 text-brand-purple',
  3: 'border-brand-success/40 text-brand-success',
  4: 'border-brand-border text-slate-400',
} as const;

/** Formata a premiação de forma compacta (ex.: $1.2M, $250K). */
function formatPrize(prizePool: number): string {
  if (prizePool >= 1_000_000) return `$${(prizePool / 1_000_000).toFixed(1)}M`;
  if (prizePool >= 1_000) return `$${Math.round(prizePool / 1_000)}K`;
  return `$${prizePool}`;
}

/** Resolve o nome do mapa a partir do id (fallback: id sem o prefixo de_). */
const MAP_NAME_BY_ID: Readonly<Record<string, string>> = Object.fromEntries(
  realMaps.map(m => [m.id, m.name]),
);
function mapName(mapId?: string): string {
  if (!mapId) return '—';
  return MAP_NAME_BY_ID[mapId] ?? mapId.replace('de_', '');
}

type ChampTab = 'standings' | 'matches' | 'campaign' | 'stats';

const TABS: ReadonlyArray<{ readonly id: ChampTab; readonly label: string; readonly icon: typeof ListOrdered }> = [
  { id: 'standings', label: 'Classificação', icon: ListOrdered },
  { id: 'matches', label: 'Jogos', icon: Swords },
  { id: 'campaign', label: 'Minha Campanha', icon: Flag },
  { id: 'stats', label: 'Estatísticas', icon: BarChart3 },
] as const;

/** É um torneio de bracket (mata-mata) — usa visão de chave em vez de tabela. */
const isBracketFormat = (t: Tournament): boolean =>
  t.engineFormat === 'singleElim' || t.engineFormat === 'gsl' || t.format === 'bracket';

/** Agrupa matches preservando a ordem de primeira aparição da chave (roundName/stage). */
function groupMatches(matches: readonly TournamentMatch[]): ReadonlyArray<readonly [string, readonly TournamentMatch[]]> {
  const groups = new Map<string, TournamentMatch[]>();
  for (const match of matches) {
    const key = match.roundName || match.stage || 'Fase Única';
    const bucket = groups.get(key) ?? [];
    bucket.push(match);
    groups.set(key, bucket);
  }
  return [...groups.entries()];
}

export const Championships: React.FC = () => {
  const { tournaments, teams, players, userTeamId, historicoTemporadas } = useGameStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<ChampTab>('standings');
  const [showHistory, setShowHistory] = useState(false);

  // Torneios ordenados por tier (elite primeiro), depois por semana agendada.
  const sortedTournaments = useMemo(
    () =>
      Object.values(tournaments).sort(
        (a, b) => a.tier - b.tier || a.weekScheduled - b.weekScheduled,
      ),
    [tournaments],
  );

  const selected = selectedId ? tournaments[selectedId] : undefined;

  // Histórico de campeões (sala de troféus) — reaproveita historicoTemporadas (CHAMP-10).
  const pastSeasons = useMemo(
    () => [...historicoTemporadas].sort((a, b) => b.season - a.season),
    [historicoTemporadas],
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-brand-card border border-brand-border p-5 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Trophy className="w-5 h-5 text-brand-cyan" />
            <span>Campeonatos</span>
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Acompanhe as competições da temporada: classificação, chaves, jogos e estatísticas. Selecione um torneio para ver os detalhes.
          </p>
        </div>
        <button
          onClick={() => setShowHistory(v => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all border ${
            showHistory
              ? 'bg-brand-warning/10 border-brand-warning/40 text-brand-warning'
              : 'border-brand-border text-slate-400 hover:text-white'
          }`}
        >
          <HistoryIcon className="w-4 h-4" />
          <span>Sala de Troféus</span>
        </button>
      </div>

      {/* SALA DE TROFÉUS (Histórico de campeões por temporada) */}
      {showHistory && (
        <div className="bg-brand-card border border-brand-warning/30 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-brand-warning flex items-center gap-2">
            <Crown className="w-4 h-4" /> Campeões das Temporadas Encerradas
          </h3>
          {pastSeasons.length > 0 ? (
            pastSeasons.map(season => (
              <div key={season.season}>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                  Temporada {season.season}
                </p>
                {season.champions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {season.champions.map(champion => {
                      const champTeam = teams[champion.championId];
                      const isUser = champion.championId === userTeamId;
                      return (
                        <div
                          key={champion.tournamentId}
                          className={`rounded-xl p-3 flex items-center gap-3 border ${
                            isUser ? 'border-brand-warning/50 bg-brand-warning/5' : 'border-brand-border bg-zinc-900/40'
                          }`}
                        >
                          {champTeam ? (
                            <TeamCrest team={champTeam} size={32} />
                          ) : (
                            <Crown className="w-5 h-5 text-slate-500 shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">
                              {champion.tournamentName}
                            </p>
                            <p className="text-sm font-bold text-white truncate">
                              {champion.championName} <span className="text-slate-600">[{champion.championTag}]</span>
                            </p>
                          </div>
                          {isUser && (
                            <span className="text-[9px] font-black uppercase tracking-widest text-brand-warning shrink-0">Você!</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-slate-500">Nenhum campeão registrado.</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm font-semibold text-slate-500 text-center py-4">
              Nenhuma temporada encerrada ainda. Avance até a virada de temporada para registrar os campeões.
            </p>
          )}
        </div>
      )}

      {/* LISTA DE TORNEIOS (cards por tier) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sortedTournaments.map(tournament => {
          const champTeam = tournament.championId ? teams[tournament.championId] : undefined;
          const isUserIn = tournament.teamIds.includes(userTeamId);
          const isSelected = selectedId === tournament.id;
          return (
            <button
              key={tournament.id}
              onClick={() => {
                setSelectedId(tournament.id);
                setTab(isBracketFormat(tournament) && (tournament.standings?.length ?? 0) === 0 ? 'matches' : 'standings');
              }}
              className={`text-left rounded-2xl p-4 border transition-all ${
                isSelected
                  ? 'border-brand-cyan glow-cyan bg-brand-cyan/5'
                  : isUserIn
                    ? 'border-brand-cyan/40 bg-brand-card hover:border-brand-cyan/70'
                    : 'border-brand-border bg-brand-card hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-black text-white truncate">{tournament.name}</p>
                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${TIER_ACCENT[tournament.tier]}`}>
                  T{tournament.tier}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] font-bold text-brand-success flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {formatPrize(tournament.prizePool)}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Semana {tournament.weekScheduled}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-brand-border/50 flex items-center justify-between gap-2">
                {tournament.isFinished && champTeam ? (
                  <span className="flex items-center gap-1.5 min-w-0">
                    <TeamCrest team={champTeam} size={22} />
                    <span className="text-[11px] font-black text-brand-warning truncate flex items-center gap-1">
                      <Crown className="w-3 h-3" /> {champTeam.tag}
                    </span>
                  </span>
                ) : (
                  <span className={`text-[10px] font-black uppercase tracking-wider ${tournament.matches.length > 0 ? 'text-brand-cyan' : 'text-slate-500'}`}>
                    {tournament.matches.length > 0 ? 'Em andamento' : 'A disputar'}
                  </span>
                )}
                {isUserIn && (
                  <span className="text-[9px] font-black uppercase tracking-widest text-brand-cyan shrink-0">Inscrito</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* DETALHE DO TORNEIO SELECIONADO */}
      {selected && (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-5">
          {/* Cabeçalho do detalhe */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-brand-border">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">{selected.name}</h3>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                {selected.teamIds.length} times · {formatPrize(selected.prizePool)} em premiação · Formato: {selected.engineFormat ?? selected.format}
              </p>
            </div>
            {selected.isFinished && selected.championId && teams[selected.championId] && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-brand-warning/40 bg-brand-warning/5">
                <Crown className="w-4 h-4 text-brand-warning" />
                <TeamCrest team={teams[selected.championId] as Team} size={24} />
                <span className="text-sm font-black text-brand-warning">{teams[selected.championId]?.name}</span>
              </div>
            )}
          </div>

          {selected.matches.length === 0 ? (
            <p className="text-sm font-semibold text-slate-500 text-center py-8">
              Este torneio ainda não foi disputado. Volte após a semana {selected.weekScheduled}.
            </p>
          ) : (
            <>
              {/* ABAS */}
              <div className="flex flex-wrap items-center gap-1.5 bg-zinc-950/50 border border-brand-border rounded-2xl p-1.5 w-fit">
                {TABS.map(t => {
                  const Icon = t.icon;
                  const isActive = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all ${
                        isActive ? 'bg-gradient-to-r from-brand-cyan to-brand-purple text-brand-dark' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* CONTEÚDO DA ABA */}
              {tab === 'standings' && <StandingsTab tournament={selected} teams={teams} userTeamId={userTeamId} />}
              {tab === 'matches' && <MatchesTab tournament={selected} teams={teams} userTeamId={userTeamId} />}
              {tab === 'campaign' && <CampaignTab tournament={selected} teams={teams} userTeamId={userTeamId} />}
              {tab === 'stats' && <StatsTab tournament={selected} teams={teams} players={players} userTeamId={userTeamId} />}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ===================== ABA: CLASSIFICAÇÃO =====================
interface TabProps {
  readonly tournament: Tournament;
  readonly teams: Record<string, Team>;
  readonly userTeamId: string;
}

const StandingsTab: React.FC<TabProps> = ({ tournament, teams, userTeamId }) => {
  const standings = tournament.standings ?? [];
  // RR/Swiss/GSL com tabela materializada → renderiza TABELA ordenada por V, depois saldo.
  if (!isBracketFormat(tournament) && standings.length > 0) {
    const sorted = [...standings].sort(
      (a, b) => b.wins - a.wins || (b.roundsFor - b.roundsAgainst) - (a.roundsFor - a.roundsAgainst),
    );
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-brand-border text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <th className="py-3 px-2 w-12">Pos</th>
              <th className="py-3 px-4">Time</th>
              <th className="py-3 px-4 text-center">V-D</th>
              <th className="py-3 px-4 text-right pr-4">Saldo (Mapas)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border text-xs font-semibold">
            {sorted.map((row, idx) => {
              const team = teams[row.teamId];
              const isUser = row.teamId === userTeamId;
              const diff = row.roundsFor - row.roundsAgainst;
              return (
                <tr
                  key={row.teamId}
                  className={`hover:bg-zinc-900/40 transition-colors ${isUser ? 'bg-brand-cyan/5 border-l-4 border-brand-cyan' : 'text-slate-300'}`}
                >
                  <td className="py-3 px-2 text-slate-500 font-bold">#{idx + 1}</td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-2">
                      {team && <TeamCrest team={team} size={24} />}
                      <span className="font-bold text-white truncate">{team?.name ?? row.teamId}</span>
                      {isUser && <span className="text-[8px] bg-brand-cyan/20 text-brand-cyan uppercase font-extrabold tracking-widest px-1.5 py-0.5 rounded">Seu Time</span>}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-black text-white tabular-nums">
                    <span className="text-brand-success">{row.wins}</span>
                    <span className="text-slate-600">-</span>
                    <span className="text-brand-danger">{row.losses}</span>
                  </td>
                  <td className={`py-3 px-4 text-right pr-4 font-black tabular-nums ${diff >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                    {diff > 0 ? `+${diff}` : diff} <span className="text-slate-600 font-bold">({row.roundsFor}/{row.roundsAgainst})</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Bracket: visão de chave — colunas por rodada com os placares.
  return <BracketView tournament={tournament} teams={teams} userTeamId={userTeamId} />;
};

/** Visão de chave (bracket) em colunas por rodada/stage. */
const BracketView: React.FC<TabProps> = ({ tournament, teams, userTeamId }) => {
  const groups = groupMatches(tournament.matches);
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {groups.map(([roundName, matches]) => (
        <div key={roundName} className="min-w-[240px] flex-1 space-y-2.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-purple text-center">{roundName}</p>
          {matches.map(match => (
            <MatchRow key={match.matchId} match={match} teams={teams} userTeamId={userTeamId} compact />
          ))}
        </div>
      ))}
    </div>
  );
};

// ===================== ABA: JOGOS =====================
const MatchesTab: React.FC<TabProps> = ({ tournament, teams, userTeamId }) => {
  const groups = groupMatches(tournament.matches);
  return (
    <div className="space-y-5">
      {groups.map(([roundName, matches]) => (
        <div key={roundName}>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">{roundName}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {matches.map(match => (
              <MatchRow key={match.matchId} match={match} teams={teams} userTeamId={userTeamId} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/** Linha/cartão de um confronto: crests, placar em mapas, BoX e mapa. */
const MatchRow: React.FC<{
  readonly match: TournamentMatch;
  readonly teams: Record<string, Team>;
  readonly userTeamId: string;
  readonly compact?: boolean;
}> = ({ match, teams, userTeamId, compact = false }) => {
  const teamA = teams[match.teamAId];
  const teamB = teams[match.teamBId];
  const aWon = match.winnerId === match.teamAId;
  const involvesUser = match.teamAId === userTeamId || match.teamBId === userTeamId;
  return (
    <div
      className={`rounded-xl border p-2.5 ${
        involvesUser ? 'border-brand-cyan/40 bg-brand-cyan/5' : 'border-brand-border bg-zinc-900/40'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`flex items-center gap-2 min-w-0 flex-1 ${aWon ? 'text-white' : 'text-slate-500'}`}>
          {teamA && <TeamCrest team={teamA} size={20} />}
          <span className="text-xs font-bold truncate">{teamA?.tag ?? match.teamAId}</span>
        </span>
        <span className="text-sm font-black tabular-nums shrink-0">
          <span className={aWon ? 'text-brand-success' : 'text-slate-500'}>{match.scoreA}</span>
          <span className="text-slate-600 mx-1">-</span>
          <span className={!aWon ? 'text-brand-success' : 'text-slate-500'}>{match.scoreB}</span>
        </span>
        <span className={`flex items-center gap-2 min-w-0 flex-1 justify-end ${!aWon ? 'text-white' : 'text-slate-500'}`}>
          <span className="text-xs font-bold truncate text-right">{teamB?.tag ?? match.teamBId}</span>
          {teamB && <TeamCrest team={teamB} size={20} />}
        </span>
      </div>
      {!compact && (
        <div className="flex items-center justify-between mt-2 text-[9px] font-bold uppercase tracking-wider text-slate-600">
          <span>Bo{match.bestOf}</span>
          <span className="flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5" /> {mapName(match.mapId)}
          </span>
        </div>
      )}
    </div>
  );
};

// ===================== ABA: MINHA CAMPANHA =====================
const CampaignTab: React.FC<TabProps> = ({ tournament, teams, userTeamId }) => {
  const userMatches = tournament.matches.filter(
    m => m.teamAId === userTeamId || m.teamBId === userTeamId,
  );

  if (userMatches.length === 0) {
    return (
      <p className="text-sm font-semibold text-slate-500 text-center py-8">
        {tournament.teamIds.includes(userTeamId)
          ? 'Seu time está inscrito mas ainda não disputou partidas neste torneio.'
          : 'Seu time não participa deste torneio.'}
      </p>
    );
  }

  const userWon = tournament.isFinished && tournament.championId === userTeamId;
  // Próximo adversário se o torneio estiver em andamento (sequência pré-computada de oponentes).
  const nextOpponentId = !tournament.isFinished
    ? tournament.userOpponents?.[Math.min(tournament.currentRound, (tournament.userOpponents.length || 1) - 1)]
    : undefined;
  const nextOpponent = nextOpponentId && nextOpponentId !== userTeamId ? teams[nextOpponentId] : undefined;
  const alreadyPlayedNext = userMatches.some(
    m => m.teamAId === nextOpponentId || m.teamBId === nextOpponentId,
  );

  return (
    <div className="space-y-3">
      {userWon && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-brand-warning/40 bg-brand-warning/5">
          <Crown className="w-5 h-5 text-brand-warning" />
          <span className="text-sm font-black text-brand-warning uppercase tracking-wide">Você foi CAMPEÃO deste torneio!</span>
        </div>
      )}

      <div className="space-y-2">
        {userMatches.map(match => {
          const isTeamA = match.teamAId === userTeamId;
          const oppId = isTeamA ? match.teamBId : match.teamAId;
          const opp = teams[oppId];
          const won = match.winnerId === userTeamId;
          const myScore = isTeamA ? match.scoreA : match.scoreB;
          const oppScore = isTeamA ? match.scoreB : match.scoreA;
          return (
            <div
              key={match.matchId}
              className={`rounded-xl border p-3 flex items-center gap-3 ${
                won ? 'border-brand-success/40 bg-brand-success/5' : 'border-brand-danger/40 bg-brand-danger/5'
              }`}
            >
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${won ? 'bg-brand-success/20 text-brand-success' : 'bg-brand-danger/20 text-brand-danger'}`}>
                {won ? 'V' : 'D'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider truncate">{match.roundName || match.stage}</p>
                <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                  vs {opp ? <TeamCrest team={opp} size={18} /> : null} {opp?.name ?? oppId}
                </p>
              </div>
              <span className="text-sm font-black tabular-nums shrink-0">
                <span className={won ? 'text-brand-success' : 'text-brand-danger'}>{myScore}</span>
                <span className="text-slate-600 mx-1">-</span>
                <span className="text-slate-400">{oppScore}</span>
              </span>
              <span className="text-[9px] font-bold uppercase text-slate-600 shrink-0 hidden sm:flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" /> {mapName(match.mapId)}
              </span>
            </div>
          );
        })}
      </div>

      {!tournament.isFinished && nextOpponent && !alreadyPlayedNext && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-brand-cyan/40 bg-brand-cyan/5">
          <Swords className="w-5 h-5 text-brand-cyan shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Próximo Adversário</p>
            <p className="text-sm font-bold text-white truncate flex items-center gap-2">
              <TeamCrest team={nextOpponent} size={20} /> {nextOpponent.name}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ===================== ABA: ESTATÍSTICAS =====================
const StatsTab: React.FC<TabProps & { readonly players: Record<string, Player> }> = ({
  tournament,
  teams,
  players,
  userTeamId,
}) => {
  // Mapa mais jogado — derivado contando mapId dos matches do torneio.
  const mostPlayedMap = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of tournament.matches) {
      if (!m.mapId) continue;
      counts.set(m.mapId, (counts.get(m.mapId) ?? 0) + 1);
    }
    let bestId: string | null = null;
    let bestCount = 0;
    for (const [id, count] of counts) {
      if (count > bestCount) {
        bestId = id;
        bestCount = count;
      }
    }
    return bestId ? { name: mapName(bestId), count: bestCount } : null;
  }, [tournament.matches]);

  // Top fraggers do evento: jogadores dos times participantes ordenados por rating de carreira.
  const topFraggers = useMemo(() => {
    const teamIdSet = new Set(tournament.teamIds);
    return Object.values(players)
      .filter(p => teamIdSet.has(p.teamId) && p.stats.mapsPlayed > 0)
      .sort((a, b) => b.stats.rating - a.stats.rating)
      .slice(0, 5);
  }, [players, tournament.teamIds]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-brand-border bg-zinc-900/40 p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-brand-purple/15 flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6 text-brand-purple" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mapa Mais Jogado</p>
            <p className="text-base font-black text-white">{mostPlayedMap?.name ?? '—'}</p>
            {mostPlayedMap && <p className="text-[10px] font-semibold text-slate-500">{mostPlayedMap.count} partidas</p>}
          </div>
        </div>
        <div className="rounded-xl border border-brand-border bg-zinc-900/40 p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-brand-cyan/15 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-brand-cyan" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Top Fragger do Evento</p>
            <p className="text-base font-black text-white">{topFraggers[0]?.nickname ?? '—'}</p>
            {topFraggers[0] && (
              <p className="text-[10px] font-semibold text-brand-cyan">Rating {topFraggers[0].stats.rating.toFixed(2)} (carreira)</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">
          Top 5 Jogadores por Rating <span className="text-slate-600 normal-case font-semibold">(rating de carreira acumulado)</span>
        </p>
        {topFraggers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-2 w-10">#</th>
                  <th className="py-2.5 px-3">Jogador</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3 text-right">Rating</th>
                  <th className="py-2.5 px-3 text-right pr-3">K-D-A</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-xs font-semibold">
                {topFraggers.map((p, idx) => {
                  const team = teams[p.teamId];
                  const isUser = p.teamId === userTeamId;
                  return (
                    <tr key={p.id} className={isUser ? 'bg-brand-cyan/5 border-l-4 border-brand-cyan' : 'text-slate-300'}>
                      <td className="py-2.5 px-2 text-slate-500 font-bold">#{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-white truncate">{p.nickname}</td>
                      <td className="py-2.5 px-3">
                        <span className="flex items-center gap-1.5">
                          {team && <TeamCrest team={team} size={20} />}
                          <span className="text-slate-400 font-bold">{team?.tag ?? '—'}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-neon-cyan">{p.stats.rating.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right pr-3 text-slate-300 font-bold tabular-nums">
                        {p.stats.kills}-{p.stats.deaths}-{p.stats.assists}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs font-semibold text-slate-500">Sem estatísticas de jogadores disponíveis para este evento.</p>
        )}
      </div>
    </div>
  );
};
