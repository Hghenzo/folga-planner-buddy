import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { salvarPessoas as salvarPessoasCloud } from "@/lib/planejamentos.functions";
import {
  TURMAS,
  TURMAS_CLASSES,
  TURMAS_LABEL,
  type Turma,
  type Pessoas,
} from "@/lib/folgas";

type Props = { inicial: Pessoas };

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl border border-border/70 bg-[image:var(--gradient-card)] shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </div>
  );
}

export function ConfigForm({ inicial }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const salvar = useServerFn(salvarPessoasCloud);
  const [salvando, setSalvando] = useState(false);
  const [texto, setTexto] = useState<Record<Turma, string>>(() =>
    TURMAS.reduce((acc, t) => {
      acc[t] = inicial[t].join(", ");
      return acc;
    }, {} as Record<Turma, string>),
  );

  async function handleSalvar() {
    const p = TURMAS.reduce((acc, t) => {
      acc[t] = texto[t].split(",").map((s) => s.trim()).filter(Boolean);
      return acc;
    }, {} as Pessoas);
    setSalvando(true);
    try {
      await salvar({ data: { pessoas: p } });
      qc.invalidateQueries({ queryKey: ["pessoas"] });
      toast.success("Nomes salvos na sua conta!");
      navigate({ to: "/app" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }


  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 pb-24 sm:p-6">
      <Panel className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <Link to="/app">
            <Button variant="ghost" size="icon" className="rounded-2xl border border-border/70 bg-card/60">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="bg-[image:var(--gradient-primary)] bg-clip-text text-xl font-black text-transparent">
              Pessoas por turma
            </h1>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              A escala do calendário já está pronta — só cadastre os nomes.
            </p>
          </div>
        </div>
      </Panel>

      {TURMAS.map((t) => {
        const cls = TURMAS_CLASSES[t];
        return (
          <Panel key={t} className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${cls.dot} shadow-[0_0_14px_currentColor]`} />
              <span className={`text-lg font-black ${cls.text}`}>{TURMAS_LABEL[t]}</span>
            </div>
            <div className="mt-4">
              <Label
                htmlFor={`pessoas-${t}`}
                className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
              >
                Pessoas (separadas por vírgula)
              </Label>
              <Input
                id={`pessoas-${t}`}
                value={texto[t]}
                onChange={(e) => setTexto((p) => ({ ...p, [t]: e.target.value }))}
                placeholder="João, Maria, Pedro"
                className="mt-2 h-11 rounded-xl border-border/70 bg-input/60"
              />
            </div>
          </Panel>
        );
      })}

      <Button
        onClick={handleSalvar}
        disabled={salvando}

        className="h-12 w-full rounded-2xl bg-[image:var(--gradient-primary)] text-base font-bold text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-95"
      >
        <Save className="mr-2 h-4 w-4" />
        Salvar
      </Button>
    </div>
  );
}
