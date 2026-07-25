import { useState } from "react";
import type { EsteiraState, IlhaSlots } from "@/lib/esteira";
import { ILHAS_ESQ, ILHAS_DIR } from "@/lib/esteira";
import { Input } from "@/components/ui/input";

function Slot({
  value,
  onChange,
  label,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <Input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        className="mt-0.5 h-8 rounded-md border-border/50 bg-input/40 px-2 text-xs"
      />
    </div>
  );
}

function IlhaCard({
  id,
  slots,
  onChange,
  disabled,
  side,
}: {
  id: string;
  slots: IlhaSlots;
  onChange: (s: IlhaSlots) => void;
  disabled?: boolean;
  side: "esq" | "dir";
}) {
  return (
    <div
      className={`rounded-xl border border-border/60 bg-card/60 p-2.5 ${side === "esq" ? "border-l-4 border-l-brand-cyan" : "border-r-4 border-r-brand-purple"}`}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <div className="text-xs font-black">Ilha {id}</div>
      </div>
      <div className="space-y-1.5">
        <Slot
          label="Pescador"
          value={slots.pescador}
          disabled={disabled}
          onChange={(v) => onChange({ ...slots, pescador: v })}
        />
        <Slot
          label="Bipador 1"
          value={slots.bipador_1}
          disabled={disabled}
          onChange={(v) => onChange({ ...slots, bipador_1: v })}
        />
        <Slot
          label="Bipador 2"
          value={slots.bipador_2}
          disabled={disabled}
          onChange={(v) => onChange({ ...slots, bipador_2: v })}
        />
      </div>
    </div>
  );
}

export function EsteiraBoard({
  value,
  onChange,
  readOnly,
}: {
  value: EsteiraState;
  onChange: (e: EsteiraState) => void;
  readOnly?: boolean;
}) {
  const [e, setE] = useState<EsteiraState>(value);
  // Keep local + parent in sync when value prop changes
  if (e !== value && JSON.stringify(e) !== JSON.stringify(value)) {
    setE(value);
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
      {/* GOLEIRO em cima */}
      <div className="rounded-2xl border border-border/70 bg-[image:var(--gradient-card)] p-3">
        <div className="mb-2 text-center text-[11px] font-black uppercase tracking-widest text-brand-cyan">
          Goleiro
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Slot
            label="Goleiro 1"
            value={e.goleiros[0]}
            disabled={readOnly}
            onChange={(v) => upd({ ...e, goleiros: [v, e.goleiros[1]] })}
          />
          <Slot
            label="Goleiro 2"
            value={e.goleiros[1]}
            disabled={readOnly}
            onChange={(v) => upd({ ...e, goleiros: [e.goleiros[0], v] })}
          />
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
                slots={e.ilhas[id]}
                onChange={(s) => updIlha(id, s)}
                disabled={readOnly}
                side="esq"
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
                slots={e.ilhas[id]}
                onChange={(s) => updIlha(id, s)}
                disabled={readOnly}
                side="dir"
              />
            ))}
          </div>
        </div>

        {/* Onda Negra */}
        <div className="mt-3 rounded-xl border border-dashed border-brand-purple/60 bg-brand-purple/5 p-3">
          <div className="mb-2 text-center text-[11px] font-black uppercase tracking-widest text-brand-purple">
            Onda Negra
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Slot
              label="Pesca"
              value={e.onda_negra.pesca}
              disabled={readOnly}
              onChange={(v) => upd({ ...e, onda_negra: { ...e.onda_negra, pesca: v } })}
            />
            <Slot
              label="Monta"
              value={e.onda_negra.monta}
              disabled={readOnly}
              onChange={(v) => upd({ ...e, onda_negra: { ...e.onda_negra, monta: v } })}
            />
          </div>
        </div>
      </div>

      {/* INDUÇÃO embaixo */}
      <div className="rounded-2xl border border-border/70 bg-[image:var(--gradient-card)] p-3">
        <div className="mb-2 text-center text-[11px] font-black uppercase tracking-widest text-brand-purple">
          Indução
        </div>
        <Slot
          label="Indutor"
          value={e.inducao}
          disabled={readOnly}
          onChange={(v) => upd({ ...e, inducao: v })}
        />
      </div>
    </div>
  );
}
