// Estrutura da esteira (baseada no print e na descrição do usuário)

export const ILHAS_ESQ = ["11", "13", "15", "31", "32", "33", "34", "35", "36", "40"] as const;
export const ILHAS_DIR = ["12", "14", "16", "21", "22", "23", "24", "25", "26", "27"] as const;
export const TODAS_ILHAS = [...ILHAS_ESQ, ...ILHAS_DIR];

export type IlhaSlots = {
  pescador: string;
  bipador_1: string;
  bipador_2: string;
};

export type EsteiraState = {
  ilhas: Record<string, IlhaSlots>;
  goleiros: [string, string];
  inducao: string;
  onda_negra: { pesca: string; monta: string };
};

export function esteiraVazia(): EsteiraState {
  const ilhas: Record<string, IlhaSlots> = {};
  for (const id of TODAS_ILHAS) {
    ilhas[id] = { pescador: "", bipador_1: "", bipador_2: "" };
  }
  return {
    ilhas,
    goleiros: ["", ""],
    inducao: "",
    onda_negra: { pesca: "", monta: "" },
  };
}

/** Contagem total de slots preenchidos. */
export function contarPreenchidos(e: EsteiraState): number {
  let n = 0;
  for (const id of TODAS_ILHAS) {
    if (e.ilhas[id]?.pescador) n++;
    if (e.ilhas[id]?.bipador_1) n++;
    if (e.ilhas[id]?.bipador_2) n++;
  }
  if (e.goleiros[0]) n++;
  if (e.goleiros[1]) n++;
  if (e.inducao) n++;
  if (e.onda_negra.pesca) n++;
  if (e.onda_negra.monta) n++;
  return n;
}

export function totalSlots(): number {
  return TODAS_ILHAS.length * 3 + 2 + 1 + 2;
}

/** Distribui uma lista de nomes disponíveis nos slots vazios da esteira, na ordem. */
export function distribuirNomes(base: EsteiraState, nomes: string[]): EsteiraState {
  const e: EsteiraState = JSON.parse(JSON.stringify(base));
  const fila = [...nomes];
  const proximo = () => fila.shift() ?? "";

  // Preenche primeiro indução, goleiros, onda negra, depois ilhas alternando lados
  if (!e.inducao) e.inducao = proximo();
  if (!e.goleiros[0]) e.goleiros[0] = proximo();
  if (!e.goleiros[1]) e.goleiros[1] = proximo();
  if (!e.onda_negra.pesca) e.onda_negra.pesca = proximo();
  if (!e.onda_negra.monta) e.onda_negra.monta = proximo();

  const ordem: string[] = [];
  const maxLen = Math.max(ILHAS_ESQ.length, ILHAS_DIR.length);
  for (let i = 0; i < maxLen; i++) {
    if (ILHAS_ESQ[i]) ordem.push(ILHAS_ESQ[i]);
    if (ILHAS_DIR[i]) ordem.push(ILHAS_DIR[i]);
  }

  // Passa 1: pescador de cada ilha
  for (const id of ordem) {
    if (!e.ilhas[id].pescador && fila.length) e.ilhas[id].pescador = proximo();
  }
  // Passa 2 e 3: bipadores
  for (const id of ordem) {
    if (!e.ilhas[id].bipador_1 && fila.length) e.ilhas[id].bipador_1 = proximo();
  }
  for (const id of ordem) {
    if (!e.ilhas[id].bipador_2 && fila.length) e.ilhas[id].bipador_2 = proximo();
  }

  return e;
}
