import { useMemo, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  CORES,
  CORES_CLASSES,
  CORES_LABEL,
  type Config,
  type CorFolga,
  salvarConfig,
  limparConfig,
  toIsoLocal,
} from "@/lib/folgas";

type Props = {
  inicial?: Config | null;
  onSalvar?: () => void;
};

function emptyGrupos() {
  const hoje = toIsoLocal(new Date());
  return CORES.reduce(
    (acc, c) => {
      acc[c] = { pessoas: [], ancora: hoje };
      return acc;
    },
    {} as Config["grupos"],
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

export function ConfigForm({ inicial, onSalvar }: Props) {
  const navigate = useNavigate();
  const [intervalo, setIntervalo] = useState<number>(inicial?.intervalo ?? 6);
  const [grupos, setGrupos] = useState<Config["grupos"]>(
    inicial?.grupos ?? emptyGrupos(),
  );
  const [pessoasInput, setPessoasInput] = useState<Record<CorFolga, string>>(
    () =>
      CORES.reduce(
        (acc, c) => {
          acc[c] = inicial?.grupos[c]?.pessoas.join(", ") ?? "";
          return acc;
        },
        {} as Record<CorFolga, string>,
      ),
  );

  const podeSalvar = useMemo(() => {
    if (!intervalo || intervalo < 1) return false;
    return CORES.every((c) => !!grupos[c]?.ancora);
  }, [intervalo, grupos]);

  function handleSalvar() {
    const finalGrupos = CORES.reduce(
      (acc, c) => {
        const pessoas = pessoasInput[c]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        acc[c] = { pessoas, ancora: grupos[c].ancora };
        return acc;
      },
      {} as Config["grupos"],
    );
    salvarConfig({ intervalo, grupos: finalGrupos });
    toast.success("Configuração salva!");
    onSalvar?.();
    navigate({ to: "/" });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 pb-24 sm:p-6">
      <Panel className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-2xl border border-border/70 bg-card/60">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="bg-[image:var(--gradient-primary)] bg-clip-text text-xl font-black text-transparent">
              Configurar folgas
            </h1>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Pessoas · Intervalo · Datas de referência
            </p>
          </div>
        </div>
      </Panel>

      <Panel className="p-4 sm:p-5">
        <Label htmlFor="intervalo" className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Intervalo do ciclo (dias)
        </Label>
        <Input
          id="intervalo"
          type="number"
          min={1}
          max={30}
          value={intervalo}
          onChange={(e) => setIntervalo(Number(e.target.value))}
          className="mt-2 h-11 w-32 rounded-xl border-border/70 bg-input/60 text-lg font-bold"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Escala 6x1 = 6. Semanal fixa = 7.
        </p>
      </Panel>

      {CORES.map((cor) => {
        const cls = CORES_CLASSES[cor];
        return (
          <Panel key={cor} className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${cls.dot} shadow-[0_0_14px_currentColor]`} />
              <span className={`text-lg font-black ${cls.text}`}>
                Folga {CORES_LABEL[cor]}
              </span>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <Label
                  htmlFor={`pessoas-${cor}`}
                  className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
                >
                  Pessoas (separadas por vírgula)
                </Label>
                <Input
                  id={`pessoas-${cor}`}
                  value={pessoasInput[cor]}
                  onChange={(e) =>
                    setPessoasInput((p) => ({ ...p, [cor]: e.target.value }))
                  }
                  placeholder="João, Maria, Pedro"
                  className="mt-2 h-11 rounded-xl border-border/70 bg-input/60"
                />
              </div>
              <div>
                <Label
                  htmlFor={`ancora-${cor}`}
                  className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
                >
                  Data de referência (uma folga conhecida)
                </Label>
                <Input
                  id={`ancora-${cor}`}
                  type="date"
                  value={grupos[cor].ancora}
                  onChange={(e) =>
                    setGrupos((g) => ({
                      ...g,
                      [cor]: { ...g[cor], ancora: e.target.value },
                    }))
                  }
                  className="mt-2 h-11 w-full rounded-xl border-border/70 bg-input/60"
                />
              </div>
            </div>
          </Panel>
        );
      })}

      <div className="grid grid-cols-[auto_1fr] items-center gap-3">
        <Button
          variant="ghost"
          onClick={() => {
            if (confirm("Apagar toda a configuração?")) {
              limparConfig();
              toast.success("Configuração apagada.");
              navigate({ to: "/" });
            }
          }}
          className="rounded-2xl text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Apagar tudo
        </Button>
        <Button
          disabled={!podeSalvar}
          onClick={handleSalvar}
          className="h-12 rounded-2xl bg-[image:var(--gradient-primary)] text-base font-bold text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-95"
        >
          <Save className="mr-2 h-4 w-4" />
          Salvar
        </Button>
      </div>
    </div>
  );
}
