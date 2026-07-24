export type CorFolga = "azul" | "roxa" | "amarela" | "vermelha";

export const CORES: CorFolga[] = ["azul", "roxa", "amarela", "vermelha"];

export const CORES_LABEL: Record<CorFolga, string> = {
  azul: "Azul",
  roxa: "Roxa",
  amarela: "Amarela",
  vermelha: "Vermelha",
};

export const CORES_CLASSES: Record<
  CorFolga,
  { bg: string; text: string; border: string; dot: string }
> = {
  azul: {
    bg: "bg-folga-azul/10",
    text: "text-folga-azul",
    border: "border-folga-azul/50",
    dot: "bg-folga-azul text-folga-azul",
  },
  roxa: {
    bg: "bg-folga-roxa/10",
    text: "text-folga-roxa",
    border: "border-folga-roxa/50",
    dot: "bg-folga-roxa text-folga-roxa",
  },
  amarela: {
    bg: "bg-folga-amarela/10",
    text: "text-folga-amarela",
    border: "border-folga-amarela/50",
    dot: "bg-folga-amarela text-folga-amarela",
  },
  vermelha: {
    bg: "bg-folga-vermelha/10",
    text: "text-folga-vermelha",
    border: "border-folga-vermelha/50",
    dot: "bg-folga-vermelha text-folga-vermelha",
  },
};

export type GrupoConfig = {
  pessoas: string[];
  /** ISO yyyy-mm-dd de um dia conhecido de folga */
  ancora: string;
};

export type Config = {
  intervalo: number; // dias entre folgas
  grupos: Record<CorFolga, GrupoConfig>;
};

const STORAGE_KEY = "folgas-config-v1";

export function carregarConfig(): Config | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Config;
    if (!parsed?.grupos || !parsed?.intervalo) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function salvarConfig(cfg: Config) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export function limparConfig() {
  window.localStorage.removeItem(STORAGE_KEY);
}

/** Diferença em dias inteiros entre duas datas (ignora hora/timezone) */
function diffDias(a: Date, b: Date): number {
  const ms = 24 * 60 * 60 * 1000;
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ua - ub) / ms);
}

export function parseIsoLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function toIsoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function corDoDia(dia: Date, cfg: Config): CorFolga | null {
  for (const cor of CORES) {
    const g = cfg.grupos[cor];
    if (!g?.ancora) continue;
    const anc = parseIsoLocal(g.ancora);
    const diff = diffDias(dia, anc);
    const mod = ((diff % cfg.intervalo) + cfg.intervalo) % cfg.intervalo;
    if (mod === 0) return cor;
  }
  return null;
}

export function proximosDias(cfg: Config, n = 7, base = new Date()) {
  const start = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const out: { data: Date; cor: CorFolga | null }[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push({ data: d, cor: corDoDia(d, cfg) });
  }
  return out;
}
