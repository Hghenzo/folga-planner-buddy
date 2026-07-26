import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Save, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { EsteiraBoard } from "@/components/esteira-board";
import { ChatIA } from "@/components/chat-ia";
import { CompartilharDialog } from "@/components/compartilhar-dialog";
import {
  atualizarEsteira,
  obterPessoas,
  obterPlanejamento,
} from "@/lib/planejamentos.functions";
import {
  distribuirNomes,
  normalizarEsteira,
  type EsteiraState,
} from "@/lib/esteira";

import { turmaDoDia, TURMAS } from "@/lib/folgas";

export const Route = createFileRoute("/_authenticated/planejamentos/$id")({
  head: () => ({
    meta: [
      { title: "Planejamento — Escala de Folgas" },
      { name: "description", content: "Edite a esteira e converse com a IA para ajustar o planejamento." },
      { property: "og:title", content: "Planejamento — Escala" },
      { property: "og:description", content: "Edite a esteira do dia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlanoDetalhe,
});

function PlanoDetalhe() {
  const { id } = useParams({ from: "/_authenticated/planejamentos/$id" });
  const qc = useQueryClient();
  const obter = useServerFn(obterPlanejamento);
  const salvar = useServerFn(atualizarEsteira);
  const getPessoas = useServerFn(obterPessoas);

  const { data, isLoading } = useQuery({
    queryKey: ["planejamento", id],
    queryFn: () => obter({ data: { id } }),
  });
  const { data: pessoas } = useQuery({
    queryKey: ["pessoas"],
    queryFn: () => getPessoas(),
  });

  const [esteira, setEsteira] = useState<EsteiraState | null>(null);
  const [hidratadoId, setHidratadoId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const readOnly = data ? data.permissao === "view" : true;

  // hidrata (e reseta ao trocar de planejamento)
  if (data && hidratadoId !== id) {
    setEsteira(normalizarEsteira(data.esteira));
    setHidratadoId(id);
    setDirty(false);
  }


  async function salvarAgora() {
    if (!esteira) return;
    setSaving(true);
    try {
      await salvar({ data: { id, esteira } });
      setDirty(false);
      qc.invalidateQueries({ queryKey: ["planejamento", id] });
      toast.success("Salvo");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setSaving(false);
    }
  }

  function autoPreencher() {
    if (!esteira || !data || !pessoas) return;
    const dia = new Date(data.data + "T00:00:00");
    const turmaFolga = turmaDoDia(dia);
    const disp: string[] = [];
    for (const t of TURMAS) {
      if (t === turmaFolga) continue;
      disp.push(...(pessoas[t] ?? []));
    }
    setEsteira(distribuirNomes(esteira, disp));
    setDirty(true);
  }

  const { disponiveis, emFolga } = (() => {
    if (!data || !pessoas) return { disponiveis: [] as string[], emFolga: [] as string[] };
    const dia = new Date(data.data + "T00:00:00");
    const turmaFolga = turmaDoDia(dia);
    const out: string[] = [];
    const folga: string[] = [];
    for (const t of TURMAS) {
      if (t === turmaFolga) folga.push(...(pessoas[t] ?? []));
      else out.push(...(pessoas[t] ?? []));
    }
    return { disponiveis: out, emFolga: folga };
  })();


  if (isLoading || !data || !esteira) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">carregando…</div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 pb-24 sm:p-6">
      <div className="flex items-center justify-between gap-2 rounded-3xl border border-border/70 bg-[image:var(--gradient-card)] p-3">
        <Link to="/app">
          <Button size="icon" variant="ghost" className="rounded-xl border border-border/60 bg-card/60">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <div className="truncate text-sm font-bold">{data.nome}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {new Date(data.data + "T00:00:00").toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}
          </div>
        </div>
        <div className="flex gap-1">
          {data.permissao === "owner" && <CompartilharDialog id={id} />}
          {!readOnly && (
            <>
              <Button
                size="icon"
                variant="ghost"
                onClick={autoPreencher}
                title="Distribuir automaticamente"
                className="rounded-xl border border-border/60 bg-card/60"
              >
                <Wand2 className="h-4 w-4" />
              </Button>
              <Button
                onClick={salvarAgora}
                disabled={!dirty || saving}
                className="h-9 rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground"
              >
                <Save className="mr-1.5 h-4 w-4" /> Salvar
              </Button>
            </>
          )}
        </div>
      </div>

      {readOnly && (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-3 text-center text-xs text-muted-foreground">
          Modo somente leitura
        </div>
      )}

      <EsteiraBoard
        value={esteira}
        readOnly={readOnly}
        disponiveis={disponiveis}
        emFolga={emFolga}
        onChange={(e) => {
          setEsteira(e);
          setDirty(true);
        }}
      />


      {!readOnly && (
        <ChatIA
          esteira={esteira}
          disponiveis={disponiveis}
          onEsteira={(e) => {
            setEsteira(e);
            setDirty(true);
          }}
        />
      )}
    </div>
  );
}
