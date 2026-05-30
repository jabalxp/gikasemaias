import { Player, PlayerAttributes } from '../../types';

const BR_FIRST_NAMES = ['Gabriel', 'Lucas', 'Felipe', 'Matheus', 'João', 'Pedro', 'Rodrigo', 'Henrique', 'Vinicius', 'Thiago', 'Bruno', 'Arthur', 'Gustavo', 'Leonardo', 'Rafael', 'Caio', 'Guilherme', 'Nicolas', 'Felipe', 'Eduardo'];
const BR_LAST_NAMES = ['Silva', 'Santos', 'Souza', 'Oliveira', 'Pereira', 'Lima', 'Carvalho', 'Costa', 'Ribeiro', 'Gomes', 'Martins', 'Rodrigues', 'Ferreira', 'Alves', 'Rocha', 'Mendes', 'Teixeira', 'Almeida', 'Cardoso', 'Barros'];

const INTL_FIRST_NAMES = ['Alexander', 'John', 'Dmitry', 'Marcus', 'Lukas', 'Ivan', 'Nikolai', 'David', 'Peter', 'Oliver', 'Christian', 'Daniel', 'Emil', 'Viktor', 'Sebastian', 'Robin', 'Ismail', 'Mathieu', 'Antoine', 'Fatih'];
const INTL_LAST_NAMES = ['Smith', 'Johnson', 'Sokolov', 'Larsen', 'Müller', 'Ivanov', 'Novak', 'Williams', 'Kovač', 'Andersen', 'Nielsen', 'Hansen', 'Kool', 'Dörtkardeş', 'Osipov', 'Herbaut', 'Madesclaire', 'Kryshkovets', 'Osipov', 'Kostyliev'];

const NICK_PREFIXES = ['Cold', 'Bolt', 'Shock', 'Vortex', 'Fire', 'Blade', 'Frost', 'Hyper', 'Cyber', 'Star', 'Clutch', 'Glow', 'Drop', 'Slayer', 'Ghost', 'Storm', 'Shadow', 'Neo', 'Nexus', 'Bullet'];
const NICK_SUFFIXES = ['zera', 'x', 'y', 'z', 'inho', '1', 'god', 'king', 'lord', 'boy', 'strike', 'shot', 'aim', 'trigger', 'force', 'storm', 'steel', 'r', 'wave', 'flux'];

const PERSONALITIES: Player['personality'][] = ['Calmo', 'Explosivo', 'Líder', 'Focado', 'Inconsistente', 'Estrela'];
const ROLES: Player['role'][] = ['AWPer', 'Rifler', 'Entry Fragger', 'Lurker', 'Support', 'IGL', 'Clutcher', 'Star Player'];

const NATIONALITIES = ['Brasil', 'Argentina', 'Estados Unidos', 'França', 'Ucrânia', 'Rússia', 'Alemanha', 'Dinamarca', 'Suécia', 'Portugal', 'Mongólia', 'Turquia', 'Polônia', 'Finlândia'];

// Auxiliar para gerar ID único
const generateId = () => Math.random().toString(36).substr(2, 9);

// Escolhe elemento aleatório de array
const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Gera número no range
const randomRange = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

export const generatePlayer = (
  options: {
    minOverall?: number;
    maxOverall?: number;
    forceNationality?: string;
    teamId?: string;
    isYouth?: boolean; // Se for da base, gera com menos idade e potencial alto
  } = {}
): Player => {
  const isYouth = options.isYouth ?? false;
  const nationality = options.forceNationality ?? (Math.random() < 0.6 ? 'Brasil' : randomChoice(NATIONALITIES));
  
  let firstName = '';
  let lastName = '';
  if (nationality === 'Brasil') {
    firstName = randomChoice(BR_FIRST_NAMES);
    lastName = randomChoice(BR_LAST_NAMES);
  } else {
    firstName = randomChoice(INTL_FIRST_NAMES);
    lastName = randomChoice(INTL_LAST_NAMES);
  }

  const nickname = randomChoice(NICK_PREFIXES) + randomChoice(NICK_SUFFIXES);
  const age = isYouth ? randomRange(16, 19) : randomRange(19, 32);
  
  const minOv = options.minOverall ?? (isYouth ? 55 : 65);
  const maxOv = options.maxOverall ?? (isYouth ? 75 : 85);
  const overall = randomRange(minOv, maxOv);
  
  const potential = isYouth 
    ? randomRange(overall + 10, Math.min(99, overall + 25))
    : randomRange(overall, Math.min(99, overall + 10));

  const role = randomChoice(ROLES);
  const subRoles = [randomChoice(ROLES.filter(r => r !== role))];
  const personality = randomChoice(PERSONALITIES);

  // Atributos baseados no Overall
  const attributes: PlayerAttributes = {
    aim: randomRange(overall - 7, overall + 7),
    gamesense: randomRange(overall - 7, overall + 7),
    clutch: randomRange(overall - 7, overall + 7),
    utility: randomRange(overall - 7, overall + 7),
    igl: randomRange(overall - 10, overall + 5)
  };

  // Ajusta atributos conforme função
  if (role === 'AWPer') {
    attributes.aim = Math.min(99, attributes.aim + 10);
  } else if (role === 'IGL') {
    attributes.igl = Math.min(99, attributes.igl + 15);
    attributes.gamesense = Math.min(99, attributes.gamesense + 5);
  } else if (role === 'Clutcher') {
    attributes.clutch = Math.min(99, attributes.clutch + 15);
  } else if (role === 'Support') {
    attributes.utility = Math.min(99, attributes.utility + 12);
  } else if (role === 'Entry Fragger') {
    attributes.aim = Math.min(99, attributes.aim + 8);
  } else if (role === 'Star Player') {
    attributes.aim = Math.min(99, attributes.aim + 8);
    attributes.clutch = Math.min(99, attributes.clutch + 5);
  }

  // Clampa atributos entre 1 e 99
  Object.keys(attributes).forEach((key) => {
    const k = key as keyof PlayerAttributes;
    attributes[k] = Math.max(1, Math.min(99, attributes[k]));
  });

  // Recalcula o overall real com base na média aritmética ponderada dos atributos
  const calculatedOverall = Math.round(
    (attributes.aim + attributes.gamesense + attributes.clutch + attributes.utility + attributes.igl) / 5
  );

  // Valor de mercado ponderado: quanto mais jovem e com potencial maior, mais vale
  const ageFactor = Math.max(0.5, (35 - age) / 10); // Jovens multiplicam o valor
  const potentialFactor = Math.max(1.0, (potential - 50) / 10);
  const baseValue = Math.pow(calculatedOverall - 40, 3) * 0.15; // Escala exponencial
  const value = Math.max(5000, Math.round(baseValue * ageFactor * potentialFactor));

  // Salário semanal baseado no overall
  const salary = Math.max(500, Math.round(Math.pow(calculatedOverall - 45, 2) * 1.5 + randomRange(-100, 300)));

  return {
    id: generateId(),
    nickname,
    name: `${firstName} ${lastName}`,
    nationality,
    age,
    teamId: options.teamId ?? 'free_agents',
    role,
    subRoles,
    overall: calculatedOverall,
    potential,
    value,
    salary,
    contractMonths: options.teamId ? randomRange(6, 36) : 0,
    moral: randomRange(75, 90),
    form: randomRange(80, 95),
    energy: 100,
    personality,
    attributes,
    stats: {
      rating: 1.00,
      kills: 0,
      deaths: 0,
      assists: 0,
      adr: 70,
      kast: 70,
      hsPercentage: 40,
      clutchesWon: 0,
      firstKills: 0,
      firstDeaths: 0,
      mapsPlayed: 0,
      mvps: 0
    },
    status: options.teamId ? 'titular' : 'free_agent'
  };
};

// Gera múltiplos jogadores
export const generateMultiplePlayers = (count: number, options: Parameters<typeof generatePlayer>[0] = {}): Player[] => {
  const players: Player[] = [];
  for (let i = 0; i < count; i++) {
    players.push(generatePlayer(options));
  }
  return players;
};
