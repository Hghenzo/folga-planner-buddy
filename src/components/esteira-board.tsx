import { useMemo, useState, type ReactNode } from "react";
import type { EsteiraKey, EsteiraState, IlhaSlots, MesaGrupo, PlanoEsteiras } from "@/lib/esteira";
import {
  ESTEIRAS,
  ILHAS_ESQ,
  ILHAS_DIR,
  distribuirComDiaristas,
  distribuirNomes,
  ehDiarista,
  esteiraDef,
  
  ilhasDe,
  normalizarEsteira,
  normalizarPlano,
} from "@/lib/esteira";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, X, AlertTriangle, Sparkles, Users } from "lucide-react";

type Ctx = {
  /** Nomes que estão trabalhando no dia (podem ser usados) */
  disponiveis: string[];
  /** Nomes que estão de folga no dia (não podem ser usados) */
  emFolga: string[];
};

const CtxVazio: Ctx = { disponiveis: [], emFolga: [] };

function norm(s: string) {
  return s.trim().toLowerCase();
}

function Slot({
  value,
  onChange,
  label,
  disabled,
  ctx,
  onRemove,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  disabled?: boolean;
  ctx: Ctx;
  onRemove?: () => void;
}) {
  const listId = useMemo(() => `pessoas-${Math.random().toString(36).slice(2, 8)}`, []);
  const v = norm(value);
  const diarista = ehDiarista(value);
  const folga = !diarista && v.length > 0 && ctx.emFolga.some((n) => norm(n) === v);
  const desconhecido =
    !diarista &&
    v.length > 0 &&
    !folga &&
    ctx.disponiveis.length > 0 &&
    !ctx.disponiveis.some((n) => norm(n) === v);

  const sugestoes = useMemo(() => {
    if (!folga && !desconhecido) return [];
    return ctx.disponiveis.filter((n) => norm(n).startsWith(v.slice(0, 2))).slice(0, 3);
  }, [folga, desconhecido, ctx.disponiveis, v]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        {onRemove && !disabled && (
          <button
            type="button"
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive"
            aria-label="Remover"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <Input
        value={value}
        disabled={disabled}
        list={listId}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        className={`mt-0.5 h-8 rounded-md px-2 text-xs ${
          folga
            ? "border-destructive bg-destructive/10 text-destructive"
            : desconhecido
              ? "border-turma-b/70 bg-turma-b/10 text-turma-b"
              : diarista
                ? "border-brand-cyan/60 bg-brand-cyan/10 text-brand-cyan"
                : "border-border/50 bg-input/40"
        }`}
      />
      <datalist id={listId}>
        {ctx.disponiveis.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      {(folga || desconhecido) && (
        <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[9px] text-destructive">
          <AlertTriangle className="h-3 w-3" />
          <span>{folga ? "está de folga" : "não está na escala do dia"}</span>
          {sugestoes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className="rounded bg-card/80 px-1 py-0.5 text-[9px] text-foreground hover:bg-card"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const NEON = {
  red: {
    wrap: "border-neon-red/50 shadow-[0_0_18px_-4px_var(--neon-red)]",
    bar: "bg-neon-red shadow-[0_0_12px_var(--neon-red)]",
    text: "text-neon-red",
  },
  yellow: {
    wrap: "border-neon-yellow/50 shadow-[0_0_18px_-4px_var(--neon-yellow)]",
    bar: "bg-neon-yellow shadow-[0_0_12px_var(--neon-yellow)]",
    text: "text-neon-yellow",
  },
  green: {
    wrap: "border-neon-green/50 shadow-[0_0_18px_-4px_var(--neon-green)]",
    bar: "bg-neon-green shadow-[0_0_12px_var(--neon-green)]",
    text: "text-neon-green",
  },
} as const;

type CorEsteira = "auto" | "red" | "yellow" | "green";

/** 11–16 vermelho neon · 21–27 amarelo neon · 31–40 verde neon */
function neonDaIlha(id: string, cor: CorEsteira = "auto") {
  if (cor !== "auto") return NEON[cor];
  const n = Number(id);
  if (n >= 31) return NEON.green;
  if (n >= 21) return NEON.yellow;
  return NEON.red;
}

function IlhaCard({
  id,
  slots,
  onChange,
  disabled,
  ctx,
  cor,
}: {
  id: string;
  slots: IlhaSlots;
  onChange: (s: IlhaSlots) => void;
  disabled?: boolean;
  ctx: Ctx;
  cor?: CorEsteira;
}) {
  const montadores = slots.montadores ?? [];
  const c = neonDaIlha(id, cor);
  return (
    <div className={`overflow-hidden rounded-xl border bg-card/60 ${c.wrap}`}>
      <div className={`h-1 w-full ${c.bar}`} />
      <div className="p-2.5">
        <div className="mb-1.5 flex items-center justify-between">
          <div className={`text-xs font-black ${c.text}`}>Ilha {id}</div>
        </div>

      <div className="space-y-1.5">
        <Slot
          label="Pescador"
          ctx={ctx}
          value={slots.pescador}
          disabled={disabled}
          onChange={(v) => onChange({ ...slots, pescador: v })}
        />
        <Slot
          label="Bipador 1"
          ctx={ctx}
          value={slots.bipador_1}
          disabled={disabled}
          onChange={(v) => onChange({ ...slots, bipador_1: v })}
        />
        <Slot
          label="Bipador 2"
          ctx={ctx}
          value={slots.bipador_2}
          disabled={disabled}
          onChange={(v) => onChange({ ...slots, bipador_2: v })}
        />
        {montadores.map((m, i) => (
          <Slot
            key={i}
            label={`Montador ${i + 1}`}
            ctx={ctx}
            value={m}
            disabled={disabled}
            onChange={(v) => {
              const next = [...montadores];
              next[i] = v;
              onChange({ ...slots, montadores: next });
            }}
            onRemove={() => onChange({ ...slots, montadores: montadores.filter((_, j) => j !== i) })}
          />
        ))}
        {!disabled && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onChange({ ...slots, montadores: [...montadores, ""] })}
            className="h-7 w-full rounded-md border border-dashed border-border/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
          >
            <Plus className="mr-1 h-3 w-3" /> Montador
          </Button>
        )}
        </div>
      </div>
    </div>
  );

}

export function EsteiraBoard({
  value,
  onChange,
  readOnly,
  disponiveis = [],
  emFolga = [],
  ilhasEsq = [...ILHAS_ESQ],
  ilhasDir = [...ILHAS_DIR],
  cor = "auto",
  ondaNegra = true,
  mesa = ["etiquetagem"],
}: {
  value: EsteiraState;
  onChange: (e: EsteiraState) => void;
  readOnly?: boolean;
  disponiveis?: string[];
  emFolga?: string[];
  ilhasEsq?: string[];
  ilhasDir?: string[];
  cor?: CorEsteira;
  ondaNegra?: boolean;
  mesa?: MesaGrupo[];
}) {
  const ids = useMemo(() => [...ilhasEsq, ...ilhasDir], [ilhasEsq, ilhasDir]);
  const e = useMemo(() => normalizarEsteira(value, ids), [value, ids]);
  const ctx: Ctx = disponiveis.length || emFolga.length ? { disponiveis, emFolga } : CtxVazio;

  function upd(next: EsteiraState) {
    onChange(next);
  }
  function updIlha(id: string, s: IlhaSlots) {
    upd({ ...e, ilhas: { ...e.ilhas, [id]: s } });
  }

  function ListaSlots({
    titulo,
    label,
    valores,
    onList,
    cols = 2,
  }: {
    titulo?: string;
    label: string;
    valores: string[];
    onList: (v: string[]) => void;
    cols?: number;
  }) {
    return (
      <div>
        {titulo && (
          <div className="mb-2 text-center text-[11px] font-black uppercase tracking-widest text-brand-purple">
            {titulo}
          </div>
        )}
        <div className={cols === 2 ? "grid grid-cols-2 gap-2" : "space-y-2"}>
          {valores.map((v, i) => (
            <Slot
              key={i}
              label={valores.length > 1 ? `${label} ${i + 1}` : label}
              ctx={ctx}
              value={v}
              disabled={readOnly}
              onChange={(nv) => onList(valores.map((x, j) => (j === i ? nv : x)))}
              onRemove={
                valores.length > 1 ? () => onList(valores.filter((_, j) => j !== i)) : undefined
              }
            />
          ))}
        </div>
        {!readOnly && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onList([...valores, ""])}
            className="mt-1.5 h-7 w-full rounded-md border border-dashed border-border/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
          >
            <Plus className="mr-1 h-3 w-3" /> {label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* INDUÇÃO + ONDA NEGRA em cima */}
      <div className="rounded-2xl border border-border/70 bg-[image:var(--gradient-card)] p-3">
        <ListaSlots
          titulo="Indução"
          label="Indutor"
          valores={e.inducao}
          onList={(v) => upd({ ...e, inducao: v })}
        />
        {ondaNegra && (
          <div className="mt-3 rounded-xl border border-dashed border-brand-purple/60 bg-brand-purple/5 p-3">
            <div className="mb-2 text-center text-[11px] font-black uppercase tracking-widest text-brand-purple">
              Onda Negra
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ListaSlots
                label="Pesca"
                cols={1}
                valores={e.onda_negra.pesca}
                onList={(v) => upd({ ...e, onda_negra: { ...e.onda_negra, pesca: v } })}
              />
              <ListaSlots
                label="Monta"
                cols={1}
                valores={e.onda_negra.monta}
                onList={(v) => upd({ ...e, onda_negra: { ...e.onda_negra, monta: v } })}
              />
            </div>
          </div>
        )}
        {mesa.length > 0 && (
          <div className="mt-3 rounded-xl border border-dashed border-brand-cyan/60 bg-brand-cyan/5 p-3">
            <div className="mb-2 text-center text-[11px] font-black uppercase tracking-widest text-brand-cyan">
              Mesa de ajuda
            </div>
            <div className={mesa.length > 1 ? "grid grid-cols-3 gap-2" : ""}>
              {mesa.map((g) => (
                <ListaSlots
                  key={g}
                  label={
                    g === "inducao" ? "Indução" : g === "etiquetagem" ? "Etiquetagem" : "Montador"
                  }
                  cols={1}
                  valores={e.mesa_ajuda[g]}
                  onList={(v) => upd({ ...e, mesa_ajuda: { ...e.mesa_ajuda, [g]: v } })}
                />
              ))}
            </div>
          </div>
        )}
      </div>


      {/* Esteira principal */}
      <div className="rounded-2xl border border-border/70 bg-[image:var(--gradient-card)] p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <div className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Esquerdo
            </div>
            {ilhasEsq.map((id) => (
              <IlhaCard
                key={id}
                id={id}
                ctx={ctx}
                cor={cor}
                slots={e.ilhas[id]}
                onChange={(s) => updIlha(id, s)}
                disabled={readOnly}
              />
            ))}
          </div>
          <div className="space-y-2">
            <div className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Direito
            </div>
            {ilhasDir.map((id) => (
              <IlhaCard
                key={id}
                id={id}
                ctx={ctx}
                cor={cor}
                slots={e.ilhas[id]}
                onChange={(s) => updIlha(id, s)}
                disabled={readOnly}
              />
            ))}
          </div>
        </div>
      </div>

      {/* GOLEIRO embaixo */}
      <div className="rounded-2xl border border-border/70 bg-[image:var(--gradient-card)] p-3">
        <div className="mb-2 text-center text-[11px] font-black uppercase tracking-widest text-brand-cyan">
          Goleiro
        </div>
        <ListaSlots label="Goleiro" valores={e.goleiros} onList={(v) => upd({ ...e, goleiros: v })} />
      </div>
    </div>
  );
}

/** As 4 esteiras (Full, Vermelha, Amarela, Verde) em sub-abas. */
export function EsteirasTabs({
  value,
  onChange,
  readOnly,
  disponiveis = [],
  emFolga = [],
  renderFooter,
}: {
  value: PlanoEsteiras;
  onChange: (p: PlanoEsteiras) => void;
  readOnly?: boolean;
  disponiveis?: string[];
  emFolga?: string[];
  renderFooter?: (args: {
    key: EsteiraKey;
    esteira: EsteiraState;
    setEsteira: (e: EsteiraState) => void;
  }) => ReactNode;
}) {
  const plano = useMemo(() => normalizarPlano(value), [value]);
  const [aba, setAba] = useState<EsteiraKey>("full");

  function setEsteira(key: EsteiraKey, e: EsteiraState) {
    onChange({ ...plano, [key]: e });
  }

  const qtdDiaristas = (k: EsteiraKey) =>
    k === "vermelha" || k === "amarela" || k === "verde" ? plano.diaristas[k] : 0;

  function gerar(key: EsteiraKey) {
    const def = esteiraDef(key);
    // mantém o que já foi preenchido manualmente; só completa os vazios
    const base = normalizarEsteira(plano[key], ilhasDe(key));
    const nova = def.diaristas
      ? distribuirComDiaristas(base, disponiveis, qtdDiaristas(key))
      : distribuirNomes(base, disponiveis);
    onChange({ ...plano, [key]: nova });
  }

  return (
    <Tabs value={aba} onValueChange={(v) => setAba(v as EsteiraKey)} className="space-y-3">
      <TabsList className="grid w-full grid-cols-4 rounded-2xl bg-card/60">
        {ESTEIRAS.map((d) => (
          <TabsTrigger key={d.key} value={d.key} className="rounded-xl text-[11px]">
            {d.nome}
          </TabsTrigger>
        ))}
      </TabsList>

      {ESTEIRAS.map((d) => (
        <TabsContent key={d.key} value={d.key} className="space-y-3">
          {!readOnly && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-card/50 p-3">
              {d.diaristas && (
                <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Diaristas na {d.nome.toLowerCase()}
                  <Input
                    type="number"
                    min={0}
                    max={50}
                    value={qtdDiaristas(d.key)}
                    onChange={(ev) =>
                      onChange({
                        ...plano,
                        diaristas: {
                          ...plano.diaristas,
                          [d.key]: Math.max(0, Math.min(50, Number(ev.target.value) || 0)),
                        },
                      })
                    }
                    className="h-9 w-20 rounded-lg bg-input/60 text-center text-sm font-bold"
                  />
                </label>
              )}
              <Button
                onClick={() => gerar(d.key)}
                className="ml-auto h-9 rounded-xl bg-[image:var(--gradient-primary)] text-xs font-bold text-primary-foreground"
              >
                <Sparkles className="mr-1.5 h-4 w-4" /> Gerar {d.nome.toLowerCase()}
              </Button>
            </div>
          )}
          {!readOnly && (
            <p className="px-1 text-[11px] text-muted-foreground">
              Gerar completa só os campos vazios — nomes já colocados não são trocados.
              {d.diaristas &&
                ` Os diaristas entram numerados (Diarista 1, 2, 3…) primeiro na pesca; o restante vai para a indução, nunca na montagem.`}
            </p>
          )}
          <EsteiraBoard
            value={plano[d.key]}
            onChange={(e) => setEsteira(d.key, e)}
            readOnly={readOnly}
            disponiveis={disponiveis}
            emFolga={emFolga}
            ilhasEsq={d.esq}
            ilhasDir={d.dir}
            cor={d.cor}
            ondaNegra={d.ondaNegra}
            mesa={d.mesa}
          />

          {renderFooter?.({
            key: d.key,
            esteira: plano[d.key],
            setEsteira: (e) => setEsteira(d.key, e),
          })}
        </TabsContent>
      ))}
    </Tabs>
  );
}
