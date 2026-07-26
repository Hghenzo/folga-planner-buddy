import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarDays, ChevronLeft, ChevronRight, Settings, Users } from "lucide-react";
import { obterPessoas } from "@/lib/planejamentos.functions";
import {
  TURMAS,
  TURMAS_CLASSES,
  TURMAS_LABEL,
  type Turma,
  type Pessoas,
  turmaDoDia,
  proximosDias,
} from "@/lib/folgas";


const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];
const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl border border-border/70 bg-[image:var(--gradient-card)] shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </div>
  );
}

function TurmaStat({ turma, pessoas }: { turma: Turma; pessoas: string[] }) {
  const cls = TURMAS_CLASSES[turma];
  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-black uppercase tracking-wider ${cls.text}`}>
          {TURMAS_LABEL[turma]}
        </span>
        <span className={`h-2.5 w-2.5 rounded-full ${cls.dot} shadow-[0_0_12px_currentColor]`} />
      </div>
      <div className="mt-2 text-2xl font-black text-foreground">{pessoas.length}</div>
      <div className="text-[11px] text-muted-foreground">pessoas</div>
    </Panel>
  );
}

export function CalendarioView() {
  const hoje = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(
    () => new Date(hoje.getFullYear(), hoje.getMonth(), 1),
  );
  const [selecionado, setSelecionado] = useState<Date | null>(null);
  const getPessoas = useServerFn(obterPessoas);
  const { data: pessoasData } = useQuery({
    queryKey: ["pessoas"],
    queryFn: () => getPessoas(),
  });
  const pessoas: Pessoas = pessoasData ?? { A: [], B: [], C: [], D: [] };


  const dias = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const leadingBlanks = first.getDay();
    const total = leadingBlanks + last.getDate();
    const rows = Math.ceil(total / 7);
    const cells: (Date | null)[] = [];
    for (let i = 0; i < rows * 7; i++) {
      const dayNum = i - leadingBlanks + 1;
      if (i < leadingBlanks || dayNum > last.getDate()) cells.push(null);
      else cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), dayNum));
    }
    return cells;
  }, [cursor]);

  const turmaHoje = turmaDoDia(hoje);
  const clsHoje = turmaHoje ? TURMAS_CLASSES[turmaHoje] : null;
  const proximos = useMemo(() => proximosDias(8, hoje), [hoje]);
  const turmaSel = selecionado ? turmaDoDia(selecionado) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 pb-24 sm:p-6">
      {/* Header */}
      <Panel className="p-4 sm:p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
              <CalendarDays className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate bg-[image:var(--gradient-primary)] bg-clip-text text-xl font-black text-transparent">
                Escala de Folgas
              </h1>
              <p className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
                {hoje.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })}
              </p>
            </div>
          </div>
          <Link to="/configuracoes">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Configurações"
              className="rounded-2xl border border-border/70 bg-card/60 hover:bg-accent/40"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </Panel>

      {/* Hero — Hoje */}
      <Panel className="relative overflow-hidden p-5">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background: turmaHoje
              ? `radial-gradient(circle at 20% 0%, var(--turma-${turmaHoje.toLowerCase()}) 0%, transparent 60%)`
              : "var(--gradient-primary)",
          }}
        />
        <div className="relative">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Folga de hoje
          </div>
          {turmaHoje && clsHoje ? (
            <>
              <div className="mt-2 flex items-center gap-3">
                <span className={`h-4 w-4 rounded-full ${clsHoje.dot} shadow-[0_0_16px_currentColor]`} />
                <span className={`text-3xl font-black ${clsHoje.text}`}>
                  {TURMAS_LABEL[turmaHoje]}
                </span>
              </div>
              <div className="mt-4 flex items-start gap-2 text-sm">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-foreground/90">
                  {pessoas[turmaHoje].length > 0
                    ? pessoas[turmaHoje].join(", ")
                    : "Nenhuma pessoa cadastrada"}
                </span>
              </div>
            </>
          ) : (
            <div className="mt-2 text-2xl font-black text-muted-foreground">
              Ninguém de folga
            </div>
          )}
        </div>
      </Panel>

      {/* Grid de turmas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TURMAS.map((t) => (
          <TurmaStat key={t} turma={t} pessoas={pessoas[t]} />
        ))}
      </div>

      {/* Calendário */}
      <Panel className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            aria-label="Mês anterior"
            className="rounded-xl"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-bold uppercase tracking-wider">
            {MESES[cursor.getMonth()]} {cursor.getFullYear()}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            aria-label="Próximo mês"
            className="rounded-xl"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {DIAS_SEMANA.map((d, i) => (
            <div key={i} className="py-1.5">{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1.5">
          {dias.map((d, i) => {
            if (!d) return <div key={i} className="aspect-square" />;
            const turma = turmaDoDia(d);
            const isHoje = sameDay(d, hoje);
            const cls = turma ? TURMAS_CLASSES[turma] : null;
            return (
              <button
                key={i}
                onClick={() => setSelecionado(d)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border text-sm transition-all active:scale-95 ${
                  cls
                    ? `${cls.bg} ${cls.border} ${cls.text} font-bold shadow-[0_0_18px_-4px_currentColor]`
                    : "border-border/50 bg-card/40 text-foreground/80 hover:border-border hover:bg-accent/30"
                } ${isHoje ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
              >
                <span>{d.getDate()}</span>
                {turma && (
                  <span className={`absolute bottom-1.5 h-1 w-1 rounded-full ${cls!.dot}`} />
                )}
              </button>
            );
          })}
        </div>
      </Panel>

      {/* Próximos dias */}
      <Panel className="p-4 sm:p-5">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Próximos dias
        </div>
        <div className="space-y-2">
          {proximos.slice(1).map(({ data, turma }) => {
            const cls = turma ? TURMAS_CLASSES[turma] : null;
            return (
              <div
                key={data.toISOString()}
                className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/50 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${cls?.dot ?? "bg-muted-foreground/30"} ${cls ? "shadow-[0_0_10px_currentColor]" : ""}`}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold capitalize">
                      {data.toLocaleDateString("pt-BR", {
                        weekday: "short",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {turma ? (pessoas[turma].join(", ") || "Sem pessoas") : "—"}
                    </div>
                  </div>
                </div>
                {turma && (
                  <span
                    className={`shrink-0 rounded-full border ${cls!.border} ${cls!.bg} px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${cls!.text}`}
                  >
                    {TURMAS_LABEL[turma]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      <Dialog open={!!selecionado} onOpenChange={(o) => !o && setSelecionado(null)}>
        <DialogContent className="rounded-3xl border-border/70">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {selecionado?.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </DialogTitle>
          </DialogHeader>
          {turmaSel && selecionado ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${TURMAS_CLASSES[turmaSel].dot} shadow-[0_0_14px_currentColor]`} />
                <span className={`text-xl font-black ${TURMAS_CLASSES[turmaSel].text}`}>
                  Folga {TURMAS_LABEL[turmaSel]}
                </span>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  De folga
                </div>
                <div className="mt-1 text-sm">
                  {pessoas[turmaSel].length > 0
                    ? pessoas[turmaSel].join(", ")
                    : "Nenhuma pessoa cadastrada"}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Ninguém de folga nesse dia.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
