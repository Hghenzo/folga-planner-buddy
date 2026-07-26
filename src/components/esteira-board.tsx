import { useMemo, useState } from "react";
import type { EsteiraState, IlhaSlots } from "@/lib/esteira";
import { ILHAS_ESQ, ILHAS_DIR, normalizarEsteira } from "@/lib/esteira";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, AlertTriangle } from "lucide-react";

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
  const folga = v.length > 0 && ctx.emFolga.some((n) => norm(n) === v);
  const desconhecido =
    v.length > 0 && !folga && ctx.disponiveis.length > 0 && !ctx.disponiveis.some((n) => norm(n) === v);

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

/** 11–16 vermelho neon · 21–27 amarelo neon · 31–40 verde neon */
function neonDaIlha(id: string) {
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
}: {
  id: string;
  slots: IlhaSlots;
  onChange: (s: IlhaSlots) => void;
  disabled?: boolean;
  ctx: Ctx;
}) {
  const montadores = slots.montadores ?? [];
  const cor = neonDaIlha(id);
  return (
    <div className={`overflow-hidden rounded-xl border bg-card/60 ${cor.wrap}`}>
      <div className={`h-1 w-full ${cor.bar}`} />
      <div className="p-2.5">
        <div className="mb-1.5 flex items-center justify-between">
          <div className={`text-xs font-black ${cor.text}`}>Ilha {id}</div>
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
}: {
  value: EsteiraState;
  onChange: (e: EsteiraState) => void;
  readOnly?: boolean;
  disponiveis?: string[];
  emFolga?: string[];
}) {
  const [e, setE] = useState<EsteiraState>(() => normalizarEsteira(value));
  const ctx: Ctx = disponiveis.length || emFolga.length ? { disponiveis, emFolga } : CtxVazio;

  // Keep local + parent in sync when value prop changes
  if (e !== value && JSON.stringify(e) !== JSON.stringify(value)) {
    setE(normalizarEsteira(value));
  }
  function upd(next: EsteiraState) {
    setE(next);
    onChange(next);
  }
  function updIlha(id: string, s: IlhaSlots) {
    upd({ ...e, ilhas: { ...e.ilhas, [id]: s } });
  }

  return (
    <div className="space-y-3">
      {/* INDUÇÃO + ONDA NEGRA em cima */}
      <div className="rounded-2xl border border-border/70 bg-[image:var(--gradient-card)] p-3">
        <div className="mb-2 text-center text-[11px] font-black uppercase tracking-widest text-brand-purple">
          Indução
        </div>
        <Slot
          label="Indutor"
          ctx={ctx}
          value={e.inducao}
          disabled={readOnly}
          onChange={(v) => upd({ ...e, inducao: v })}
        />
        <div className="mt-3 rounded-xl border border-dashed border-brand-purple/60 bg-brand-purple/5 p-3">
          <div className="mb-2 text-center text-[11px] font-black uppercase tracking-widest text-brand-purple">
            Onda Negra
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Slot
              label="Pesca"
              ctx={ctx}
              value={e.onda_negra.pesca}
              disabled={readOnly}
              onChange={(v) => upd({ ...e, onda_negra: { ...e.onda_negra, pesca: v } })}
            />
            <Slot
              label="Monta"
              ctx={ctx}
              value={e.onda_negra.monta}
              disabled={readOnly}
              onChange={(v) => upd({ ...e, onda_negra: { ...e.onda_negra, monta: v } })}
            />
          </div>
        </div>
      </div>

      {/* Esteira principal */}
      <div className="rounded-2xl border border-border/70 bg-[image:var(--gradient-card)] p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <div className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Esquerdo
            </div>
            {ILHAS_ESQ.map((id) => (
              <IlhaCard
                key={id}
                id={id}
                ctx={ctx}
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
            {ILHAS_DIR.map((id) => (
              <IlhaCard
                key={id}
                id={id}
                ctx={ctx}
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
        <div className="grid grid-cols-2 gap-2">
          <Slot
            label="Goleiro 1"
            ctx={ctx}
            value={e.goleiros[0]}
            disabled={readOnly}
            onChange={(v) => upd({ ...e, goleiros: [v, e.goleiros[1]] })}
          />
          <Slot
            label="Goleiro 2"
            ctx={ctx}
            value={e.goleiros[1]}
            disabled={readOnly}
            onChange={(v) => upd({ ...e, goleiros: [e.goleiros[0], v] })}
          />
        </div>
      </div>
    </div>
  );
}

