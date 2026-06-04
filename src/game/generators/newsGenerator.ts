import { NewsItem, Player, Team } from '../../types';

let newsIdCounter = 0;
const generateId = () => `news_${(newsIdCounter++).toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

export const generateTransferNews = (player: Player, oldTeamName: string, newTeamName: string, week: number): NewsItem => {
  const titles = [
    `BOMBA NO MERCADO: ${player.nickname} assina com a equipe do ${newTeamName}!`,
    `Reforço de peso: ${newTeamName} oficializa a contratação de ${player.nickname}.`,
    `Nova era: ${player.nickname} deixa o ${oldTeamName} para vestir a camisa do ${newTeamName}.`,
    `Transferência fechada! ${player.nickname} reforça o elenco do ${newTeamName} esta semana.`
  ];

  const contents = [
    `Em uma negociação relâmpago que surpreendeu os torcedores, a equipe do ${newTeamName} fechou o acordo para trazer ${player.nickname} (Overall ${player.overall}) para seu elenco ativo. A transação custou por volta de $${player.value.toLocaleString()} aos cofres da equipe. O ex-jogador do ${oldTeamName} chega sob grandes expectativas de carregar a equipe nas próximas rodadas competitivas.`,
    `O cenário internacional de e-sports acaba de receber uma grande movimentação. ${player.nickname} foi oficialmente anunciado como novo jogador do ${newTeamName}. O manager da organização expressou enorme entusiasmo com a vinda do atleta de ${player.age} anos, destacando que sua mira afiada e experiência tática trarão a liderança que o time tanto precisava para subir nos rankings.`
  ];

  return {
    id: generateId(),
    title: titles[Math.floor(Math.random() * titles.length)],
    content: contents[Math.floor(Math.random() * contents.length)],
    category: 'transfers',
    week,
    dateStr: `Semana ${week}`
  };
};

export const generateMatchNews = (
  teamWinner: Team,
  teamLoser: Team,
  scoreWinner: number,
  scoreLoser: number,
  mvp: Player,
  mapName: string,
  week: number
): NewsItem => {
  const wasStomp = scoreWinner - scoreLoser >= 8;
  const wasClose = scoreWinner - scoreLoser <= 2;

  let title = '';
  let content = '';

  if (wasStomp) {
    title = `DOMÍNIO COMPLETO: ${teamWinner.name} atropela ${teamLoser.name} na de_${mapName.toLowerCase()}!`;
    content = `A equipe do ${teamWinner.name} não tomou conhecimento do ${teamLoser.name} e fechou a partida com um placar elástico de ${scoreWinner} a ${scoreLoser}. O grande destaque do confronto foi o astro ${mvp.nickname}, que liderou a pontuação de abates na partida com um rating impecável. Analistas apontam que a tática de avanço rápido e a sinergia defensiva do ${teamWinner.name} anularam qualquer tentativa de reação adversária.`;
  } else if (wasClose) {
    title = `JOGO DO ANO: ${teamWinner.name} vence ${teamLoser.name} no limite pelo placar de ${scoreWinner}x${scoreLoser}!`;
    content = `Os fãs de e-sports presenciaram um espetáculo tático e emocional. Em uma partida decidida nos detalhes mais finos em ${mapName}, o ${teamWinner.name} bateu o ${teamLoser.name} por ${scoreWinner} a ${scoreLoser}. O clã vencedor contou com clutches sensacionais de ${mvp.nickname} nos rounds finais, assegurando a vitória decisiva e adicionando pontos valiosos ao ranking mundial.`;
  } else {
    title = `Vitória importante: ${teamWinner.name} supera ${teamLoser.name} por ${scoreWinner}x${scoreLoser} em ${mapName}.`;
    content = `Em uma partida consistente do início ao fim, o ${teamWinner.name} garantiu a vitória sobre o ${teamLoser.name} na de_${mapName.toLowerCase()}. Com grande atuação de ${mvp.nickname}, a equipe soube controlar a economia da partida e neutralizar os armados adversários. Com este resultado, a comissão técnica respira aliviada e foca nos próximos desafios semanais.`;
  }

  return {
    id: generateId(),
    title,
    content,
    category: 'results',
    week,
    dateStr: `Semana ${week}`
  };
};

export const generateYouthNews = (player: Player, teamName: string, week: number): NewsItem => {
  return {
    id: generateId(),
    title: `JOIA REVELADA: Jovem talento ${player.nickname} chama a atenção na base do ${teamName}!`,
    content: `Com apenas ${player.age} anos, o promissor ${player.nickname} foi o principal destaque nos treinos internos das categorias de base da organização ${teamName}. Classificado por scouts como um "fenômeno" com potencial projetado de ${player.potential}, o jovem atleta de função ${player.role} apresenta mecânicas de mira impressionantes e já atrai especulações sobre uma possível promoção ao elenco profissional em breve.`,
    category: 'base',
    week,
    dateStr: `Semana ${week}`
  };
};

export const generateGeneralNews = (title: string, content: string, week: number): NewsItem => {
  return {
    id: generateId(),
    title,
    content,
    category: 'general',
    week,
    dateStr: `Semana ${week}`
  };
};
