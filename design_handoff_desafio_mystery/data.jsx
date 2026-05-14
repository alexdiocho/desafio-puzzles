// Mock data mirroring the real schema
const PHASES = [
  {
    id: 1,
    order: 1,
    name: "Fase 1 · Calentamiento",
    subtitle: "Puzzles independientes para calentar motores.",
    challenges: [
      {
        id: "c-faro",
        title: "El enigma del faro",
        description: "Un faro sin luz. Tres barcos. Una sola coordenada correcta.",
        status: "finished",
        end_time: "2026-05-10T02:24:00",
        winner: "Equipo Alfa",
        challenge_type: "single",
        number: 1,
      },
      {
        id: "c-camara",
        title: "La cámara de los espejos",
        description: "Lo que reflejas es lo que escondes. Encuentra el ángulo que no miente.",
        status: "active",
        end_time: "2026-05-17T00:24:00",
        challenge_type: "double",
        number: 2,
      },
      {
        id: "c-prueba",
        title: "Desafío prueba",
        description: "Descripción prueba — un acertijo en construcción.",
        status: "active",
        end_time: "2026-05-11T17:00:00",
        challenge_type: "double",
        number: 3,
      },
      {
        id: "c-wasd",
        title: "wasd",
        description: "asdsad",
        status: "active",
        end_time: "2026-05-11T23:44:00",
        challenge_type: "single",
        number: 4,
      },
    ],
  },
  {
    id: 2,
    order: 2,
    name: "Fase 2 · Puzzles conectados",
    subtitle: "Los puzzles guardan pistas entre sí. Resolver uno desvela información para el siguiente.",
    challenges: [],
  },
  {
    id: 99,
    order: 99,
    name: "Fase final · ?????",
    subtitle: "El último fragmento permanece sellado.",
    challenges: [],
    locked: true,
  },
];

const TEAMS = [
  { id: 1, name: "Equipo Alfa", points: 3 },
  { id: 2, name: "Equipo Delta", points: 1 },
  { id: 3, name: "Equipo Omega", points: 0 },
  { id: 4, name: "Equipo Sigma", points: 0 },
];

const AMBIENT_LINES = [
  "Una señal se filtra entre las grietas del archivo.",
  "Cada acertijo es una llave. Cada llave abre otra puerta.",
  "Los espejos no mienten — sólo eligen qué reflejar.",
  "El siguiente fragmento te espera. Pero no por mucho.",
  "Quien escucha bien, oye el cifrado en el silencio.",
];

window.MYSTERY_DATA = { PHASES, TEAMS, AMBIENT_LINES };
