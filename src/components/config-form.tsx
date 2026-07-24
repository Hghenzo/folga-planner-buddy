import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="mx-auto max-w-2xl space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold">Configurar folgas</h1>
        <p className="text-sm text-muted-foreground">
          Configure o intervalo do ciclo, as pessoas de cada cor e uma data de
          referência (uma folga conhecida de cada grupo).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ciclo</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="intervalo">Intervalo entre folgas (dias)</Label>
          <Input
            id="intervalo"
            type="number"
            min={1}
            max={30}
            value={intervalo}
            onChange={(e) => setIntervalo(Number(e.target.value))}
            className="mt-2 w-32"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Escala 6x1 = 6. Escala semanal fixa = 7.
          </p>
        </CardContent>
      </Card>

      {CORES.map((cor) => {
        const cls = CORES_CLASSES[cor];
        return (
          <Card key={cor} className={`border-2 ${cls.border}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className={`h-4 w-4 rounded-full ${cls.dot}`} />
                Folga {CORES_LABEL[cor]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor={`pessoas-${cor}`}>
                  Pessoas (separadas por vírgula)
                </Label>
                <Input
                  id={`pessoas-${cor}`}
                  value={pessoasInput[cor]}
                  onChange={(e) =>
                    setPessoasInput((p) => ({ ...p, [cor]: e.target.value }))
                  }
                  placeholder="João, Maria, Pedro"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor={`ancora-${cor}`}>
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
                  className="mt-2 w-full"
                />
              </div>
            </CardContent>
          </Card>
        );
      })}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => {
            if (confirm("Apagar toda a configuração?")) {
              limparConfig();
              toast.success("Configuração apagada.");
              navigate({ to: "/" });
            }
          }}
        >
          Apagar tudo
        </Button>
        <Button disabled={!podeSalvar} onClick={handleSalvar}>
          Salvar
        </Button>
      </div>
    </div>
  );
}
