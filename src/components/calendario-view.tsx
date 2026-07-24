import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Settings } from "lucide-react";
import {
  CORES_CLASSES,
  CORES_LABEL,
  type Config,
  corDoDia,
  proximosDias,
} from "@/lib/folgas";

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];
const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function CalendarioView({ cfg }: { cfg: Config }) {
  const hoje = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(
    () => new Date(hoje.getFullYear(), hoje.getMonth(), 1),
  );
  const [selecionado, setSelecionado] = useState<Date | null>(null);

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

  const corHoje = corDoDia(hoje, cfg);
  const proximos = useMemo(() => proximosDias(cfg, 8, hoje), [cfg, hoje]);
  const corSel = selecionado ? corDoDia(selecionado, cfg) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 pb-24">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Folgas</h1>
          <p className="text-xs text-muted-foreground">
            {hoje.toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}
          </p>
        </div>
        <Link to="/configuracoes">
          <Button variant="ghost" size="icon" aria-label="Configurações">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </header>

      {/* Hoje */}
      <Card
        className={
          corHoje
            ? `border-2 ${CORES_CLASSES[corHoje].border} ${CORES_CLASSES[corHoje].bg}`
            : ""
        }
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          {corHoje ? (
            <>
              <div className="flex items-center gap-2">
                <span
                  className={`h-3 w-3 rounded-full ${CORES_CLASSES[corHoje].dot}`}
                />
                <span
                  className={`text-lg font-bold ${CORES_CLASSES[corHoje].text}`}
                >
                  Folga {CORES_LABEL[corHoje]}
                </span>
              </div>
              <p className="mt-2 text-sm">
                {cfg.grupos[corHoje].pessoas.length > 0
                  ? cfg.grupos[corHoje].pessoas.join(", ")
                  : "Nenhuma pessoa cadastrada"}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ninguém de folga hoje.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Calendário */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
            }
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-base">
            {MESES[cursor.getMonth()]} {cursor.getFullYear()}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
            }
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {DIAS_SEMANA.map((d, i) => (
              <div key={i} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {dias.map((d, i) => {
              if (!d) return <div key={i} className="aspect-square" />;
              const cor = corDoDia(d, cfg);
              const isHoje = sameDay(d, hoje);
              const cls = cor ? CORES_CLASSES[cor] : null;
              return (
                <button
                  key={i}
                  onClick={() => setSelecionado(d)}
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-md border text-sm transition-colors ${
                    cls
                      ? `${cls.bg} ${cls.border} ${cls.text} font-semibold`
                      : "border-transparent hover:bg-muted"
                  } ${isHoje ? "ring-2 ring-ring ring-offset-1" : ""}`}
                >
                  <span>{d.getDate()}</span>
                  {cor && (
                    <span
                      className={`absolute bottom-1 h-1 w-1 rounded-full ${cls!.dot}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Próximos dias */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Próximos dias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {proximos.slice(1).map(({ data, cor }) => {
            const cls = cor ? CORES_CLASSES[cor] : null;
            return (
              <div
                key={data.toISOString()}
                className="flex items-center justify-between rounded-md border p-2"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${cls?.dot ?? "bg-muted-foreground/30"}`}
                  />
                  <div>
                    <div className="text-sm font-medium capitalize">
                      {data.toLocaleDateString("pt-BR", {
                        weekday: "short",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {cor
                        ? cfg.grupos[cor].pessoas.join(", ") || "Sem pessoas"
                        : "—"}
                    </div>
                  </div>
                </div>
                {cor && (
                  <span className={`text-xs font-semibold ${cls!.text}`}>
                    {CORES_LABEL[cor]}
                  </span>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog
        open={!!selecionado}
        onOpenChange={(o) => !o && setSelecionado(null)}
      >
        <DialogContent>
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
          {corSel && selecionado ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className={`h-3 w-3 rounded-full ${CORES_CLASSES[corSel].dot}`}
                />
                <span
                  className={`text-lg font-semibold ${CORES_CLASSES[corSel].text}`}
                >
                  Folga {CORES_LABEL[corSel]}
                </span>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">De folga:</div>
                <div className="mt-1 text-sm">
                  {cfg.grupos[corSel].pessoas.length > 0
                    ? cfg.grupos[corSel].pessoas.join(", ")
                    : "Nenhuma pessoa cadastrada"}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ninguém de folga nesse dia.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
