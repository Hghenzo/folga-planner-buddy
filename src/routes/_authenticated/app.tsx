import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CalendarDays,
  Plus,
  Settings,
  LogOut,
  KeyRound,
  Trash2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CalendarioView } from "@/components/calendario-view";
import { EsteiraBoard } from "@/components/esteira-board";
import {
  criarPlanejamento,
  excluirPlanejamento,
  listarPlanejamentos,
  obterPessoas,
  obterPlanejamento,
  usarCodigoAcesso,
} from "@/lib/planejamentos.functions";
import { distribuirNomes, esteiraVazia, normalizarEsteira } from "@/lib/esteira";
import { AvaliacoesTab } from "@/components/avaliacoes-tab";
import { ProducaoTab, RankingEquipesCard } from "@/components/producao-tab";


import { turmaDoDia, TURMAS } from "@/lib/folgas";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "Meus planejamentos — Escala de Folgas" },
      { name: "description", content: "Gerencie planejamentos da esteira e da escala de folgas." },
      { property: "og:title", content: "Planejamentos — Escala de Folgas" },
      { property: "og:description", content: "Esteira, calendário e planejamentos por turma." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppHome,
});

function AppHome() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 pb-24 sm:p-6">
      <Header />
      <Tabs defaultValue="planejamentos" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 rounded-2xl bg-card/60">
          <TabsTrigger value="planejamentos" className="rounded-xl text-[11px]">
            Planos
          </TabsTrigger>
          <TabsTrigger value="calendario" className="rounded-xl text-[11px]">
            Calendário
          </TabsTrigger>
          <TabsTrigger value="esteira" className="rounded-xl text-[11px]">
            Esteira
          </TabsTrigger>
          <TabsTrigger value="avaliacao" className="rounded-xl text-[11px]">
            Avaliação
          </TabsTrigger>
          <TabsTrigger value="producao" className="rounded-xl text-[11px]">
            Produção
          </TabsTrigger>
          <TabsTrigger value="ranking" className="rounded-xl text-[11px]">
            Ranking
          </TabsTrigger>
        </TabsList>
        <TabsContent value="planejamentos">
          <PlanejamentosLista />
        </TabsContent>
        <TabsContent value="calendario">
          <CalendarioView />
        </TabsContent>
        <TabsContent value="esteira">
          <EsteiraPreview />
        </TabsContent>
        <TabsContent value="avaliacao">
          <AvaliacoesTab />
        </TabsContent>
        <TabsContent value="producao">
          <ProducaoTab />
        </TabsContent>
        <TabsContent value="ranking">
          <RankingEquipesCard />
        </TabsContent>

      </Tabs>

    </div>
  );
}

function Header() {
  const navigate = useNavigate();
  async function sair() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }
  return (
    <div className="rounded-3xl border border-border/70 bg-[image:var(--gradient-card)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
            <CalendarDays className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate bg-[image:var(--gradient-primary)] bg-clip-text text-lg font-black text-transparent">
              Escala de Folgas
            </h1>
            <p className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
              Planejamento em nuvem
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <Link to="/configuracoes">
            <Button size="icon" variant="ghost" className="rounded-xl border border-border/60 bg-card/60">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            size="icon"
            variant="ghost"
            onClick={sair}
            className="rounded-xl border border-border/60 bg-card/60"
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function PlanejamentosLista() {
  const qc = useQueryClient();
  const listar = useServerFn(listarPlanejamentos);
  const excluir = useServerFn(excluirPlanejamento);
  const usarCodigo = useServerFn(usarCodigoAcesso);
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState("");

  const { data: planos = [], isLoading } = useQuery({
    queryKey: ["planejamentos"],
    queryFn: () => listar(),
  });

  async function apagar(id: string) {
    if (!confirm("Excluir esse planejamento?")) return;
    try {
      await excluir({ data: { id } });
      toast.success("Excluído");
      qc.invalidateQueries({ queryKey: ["planejamentos"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  async function entrarComCodigo() {
    if (!/^\d{6}$/.test(codigo)) return toast.error("Código de 6 dígitos");
    try {
      const r = await usarCodigo({ data: { codigo } });
      toast.success("Acesso concedido");
      navigate({ to: "/planejamentos/$id", params: { id: r.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }


  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <NovoPlanejamentoDialog />
        <div className="flex flex-1 gap-2">
          <Input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Código"
            className="h-11 rounded-xl bg-input/60"
          />
          <Button
            onClick={entrarComCodigo}
            variant="outline"
            className="h-11 rounded-xl"
            aria-label="Entrar com código"
          >
            <KeyRound className="mr-2 h-4 w-4" /> Entrar
          </Button>
        </div>
      </div>

      <SugestaoHoje planos={planos} />


      {isLoading && (
        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 text-center text-sm text-muted-foreground">
          carregando…
        </div>
      )}
      {!isLoading && planos.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
          <Sparkles className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            Nenhum planejamento ainda. Crie o primeiro!
          </div>
        </div>
      )}
      {planos.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between rounded-2xl border border-border/60 bg-[image:var(--gradient-card)] p-4"
        >
          <Link
            to="/planejamentos/$id"
            params={{ id: p.id }}
            className="min-w-0 flex-1"
          >
            <div className="truncate text-sm font-bold">{p.nome}</div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {new Date(p.data + "T00:00:00").toLocaleDateString("pt-BR", {
                weekday: "short",
                day: "2-digit",
                month: "short",
              })}
            </div>
          </Link>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => apagar(p.id)}
            className="rounded-xl text-destructive"
            aria-label="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function NovoPlanejamentoDialog() {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [autoDistribuir, setAutoDistribuir] = useState(false);
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const criar = useServerFn(criarPlanejamento);
  const getPessoas = useServerFn(obterPessoas);

  async function criarPlano() {
    setLoading(true);
    try {
      let esteira = esteiraVazia();
      if (autoDistribuir) {
        const pessoas = await getPessoas();
        const dia = new Date(data + "T00:00:00");
        const turmaFolga = turmaDoDia(dia);
        const disponiveis: string[] = [];
        for (const t of TURMAS) {
          if (t === turmaFolga) continue;
          disponiveis.push(...(pessoas[t] ?? []));
        }
        esteira = distribuirNomes(esteira, disponiveis);
      }
      const r = await criar({
        data: { nome: nome || `Escala ${data}`, data, esteira },
      });
      qc.invalidateQueries({ queryKey: ["planejamentos"] });
      setOpen(false);
      navigate({ to: "/planejamentos/$id", params: { id: r.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="h-11 rounded-xl bg-[image:var(--gradient-primary)] font-bold text-primary-foreground"
      >
        <Plus className="mr-2 h-4 w-4" /> Novo
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl border-border/70">
          <DialogHeader>
            <DialogTitle>Novo planejamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Turno da tarde"
                className="mt-1.5 h-11 rounded-xl bg-input/60"
              />
            </div>
            <div>
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="mt-1.5 h-11 rounded-xl bg-input/60"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoDistribuir}
                onChange={(e) => setAutoDistribuir(e.target.checked)}
              />
              Distribuir automaticamente (deixa a turma de folga fora)
            </label>
          </div>
          <DialogFooter>
            <Button
              onClick={criarPlano}
              disabled={loading}
              className="rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground"
            >
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Nomes que trabalham e nomes de folga em um dia. */
export function usarEscalaDoDia(iso: string) {
  const getPessoas = useServerFn(obterPessoas);
  const { data: pessoas } = useQuery({ queryKey: ["pessoas"], queryFn: () => getPessoas() });
  const dia = new Date(iso + "T00:00:00");
  const turmaFolga = turmaDoDia(dia);
  const disponiveis: string[] = [];
  const emFolga: string[] = [];
  for (const t of TURMAS) {
    const lista = pessoas?.[t] ?? [];
    if (t === turmaFolga) emFolga.push(...lista);
    else disponiveis.push(...lista);
  }
  return { disponiveis, emFolga, turmaFolga };
}

function EsteiraPreview() {
  const hojeIso = new Date().toISOString().slice(0, 10);
  const [e, setE] = useState(esteiraVazia());
  const [salvando, setSalvando] = useState(false);
  const { disponiveis, emFolga, turmaFolga } = usarEscalaDoDia(hojeIso);
  const criar = useServerFn(criarPlanejamento);
  const qc = useQueryClient();
  const navigate = useNavigate();

  function gerar() {
    if (!disponiveis.length) {
      toast.error("Cadastre os nomes das turmas em Configurações");
      return;
    }
    setE(distribuirNomes(esteiraVazia(), disponiveis));
    toast.success("Planejamento gerado");
  }

  async function salvar() {
    setSalvando(true);
    try {
      const r = await criar({ data: { nome: `Escala ${hojeIso}`, data: hojeIso, esteira: e } });
      qc.invalidateQueries({ queryKey: ["planejamentos"] });
      toast.success("Planejamento salvo");
      navigate({ to: "/planejamentos/$id", params: { id: r.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-4 text-center text-xs text-muted-foreground">
        Prévia da esteira (folga de hoje: <b>Turma {turmaFolga ?? "—"}</b>).
      </div>
      <div className="flex gap-2">
        <Button
          onClick={gerar}
          className="h-11 flex-1 rounded-xl bg-[image:var(--gradient-primary)] font-bold text-primary-foreground"
        >
          <Sparkles className="mr-2 h-4 w-4" /> Gerar planejamento
        </Button>
        <Button
          onClick={salvar}
          disabled={salvando}
          variant="outline"
          className="h-11 rounded-xl"
        >
          <Plus className="mr-2 h-4 w-4" /> Salvar
        </Button>
      </div>
      <EsteiraBoard
        value={e}
        onChange={setE}
        disponiveis={disponiveis}
        emFolga={emFolga}
      />
    </div>
  );
}



type PlanoResumo = { id: string; nome: string; data: string };

function isoDe(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/** Sugestão automática: um planejamento novo por dia, reaproveitando o do dia anterior
 *  quando a folga é da mesma turma dois dias seguidos. */
function SugestaoHoje({ planos }: { planos: PlanoResumo[] }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const criar = useServerFn(criarPlanejamento);
  const obter = useServerFn(obterPlanejamento);
  const [loading, setLoading] = useState(false);

  const hoje = new Date();
  const ontem = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 1);
  const isoHoje = isoDe(hoje);
  const isoOntem = isoDe(ontem);
  const turmaHoje = turmaDoDia(hoje);
  const turmaOntem = turmaDoDia(ontem);
  const mesmaFolga = turmaHoje != null && turmaHoje === turmaOntem;
  const planoHoje = planos.find((p) => p.data === isoHoje);
  const planoOntem = planos.find((p) => p.data === isoOntem);
  const { disponiveis } = usarEscalaDoDia(isoHoje);

  async function gerar() {
    setLoading(true);
    try {
      let esteira = esteiraVazia();
      if (mesmaFolga && planoOntem) {
        const anterior = await obter({ data: { id: planoOntem.id } });
        esteira = normalizarEsteira(anterior.esteira);
      } else {
        esteira = distribuirNomes(esteira, disponiveis);
      }
      const r = await criar({
        data: { nome: `Escala ${isoHoje}`, data: isoHoje, esteira },
      });
      qc.invalidateQueries({ queryKey: ["planejamentos"] });
      navigate({ to: "/planejamentos/$id", params: { id: r.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  if (planoHoje) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-border/60 bg-card/50 p-3 text-xs text-muted-foreground">
        <span>
          Planejamento de hoje já criado · folga <b>Turma {turmaHoje ?? "—"}</b>
        </span>
        <Link to="/planejamentos/$id" params={{ id: planoHoje.id }}>
          <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs">
            Abrir
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-cyan/40 bg-brand-cyan/5 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-widest text-brand-cyan">
            Sugestão de hoje
          </div>
          <div className="text-[11px] text-muted-foreground">
            Folga da Turma {turmaHoje ?? "—"}
            {mesmaFolga && planoOntem
              ? " · segundo dia da mesma folga: vou copiar o planejamento de ontem"
              : " · vou distribuir quem está trabalhando"}
          </div>
        </div>
        <Button
          onClick={gerar}
          disabled={loading}
          size="sm"
          className="h-9 shrink-0 rounded-xl bg-[image:var(--gradient-primary)] text-xs text-primary-foreground"
        >
          <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Gerar
        </Button>
      </div>
    </div>
  );
}
