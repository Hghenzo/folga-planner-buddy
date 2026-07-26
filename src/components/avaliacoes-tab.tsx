import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, RefreshCw, Save } from "lucide-react";
import {
  CATEGORIAS,
  importarProdutividade,
  listarAvaliacoes,
  listarProdutividade,
  salvarAvaliacao,
  sincronizarMembros,
  type Avaliacao,
  type Categoria,
} from "@/lib/avaliacoes.functions";

const LABEL: Record<Categoria, string> = {
  pesca: "Pesca",
  inducao: "Indução",
  goleiro: "Goleiro",
  montagem: "Montagem",
  separacao_rk: "Sep. RK",
  expedicao: "Expedição",
};

function overall(a: Avaliacao) {
  return Math.round(CATEGORIAS.reduce((s, c) => s + (a[c] ?? 0), 0) / CATEGORIAS.length);
}

function corNota(n: number) {
  if (n >= 85) return "text-turma-c";
  if (n >= 70) return "text-turma-b";
  if (n >= 50) return "text-foreground";
  return "text-destructive";
}

function Carta({ a }: { a: Avaliacao }) {
  const qc = useQueryClient();
  const salvar = useServerFn(salvarAvaliacao);
  const [edit, setEdit] = useState(false);
  const [vals, setVals] = useState<Record<Categoria, number>>(() =>
    CATEGORIAS.reduce((acc, c) => ({ ...acc, [c]: a[c] }), {} as Record<Categoria, number>),
  );
  const ov = edit
    ? Math.round(CATEGORIAS.reduce((s, c) => s + (vals[c] || 0), 0) / CATEGORIAS.length)
    : overall(a);

  async function persistir() {
    try {
      await salvar({ data: { nome: a.nome, turma: a.turma, ...vals } });
      toast.success("Cartinha atualizada");
      setEdit(false);
      qc.invalidateQueries({ queryKey: ["avaliacoes"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-[image:var(--gradient-card)] p-3 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3">
        <div className={`text-3xl font-black leading-none ${corNota(ov)}`}>{ov}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">{a.nome}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {a.turma ? `Turma ${a.turma}` : "sem turma"}
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => (edit ? persistir() : setEdit(true))}
          className="h-8 rounded-lg border border-border/60 text-xs"
        >
          {edit ? <Save className="h-3.5 w-3.5" /> : "Editar"}
        </Button>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {CATEGORIAS.map((c) => (
          <div key={c} className="rounded-lg border border-border/50 bg-card/50 px-2 py-1">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{LABEL[c]}</div>
            {edit ? (
              <Input
                type="number"
                min={0}
                max={100}
                value={vals[c]}
                onChange={(e) =>
                  setVals((v) => ({ ...v, [c]: Math.max(0, Math.min(100, Number(e.target.value) || 0)) }))
                }
                className="h-7 rounded-md bg-input/40 px-1.5 text-xs"
              />
            ) : (
              <div className={`text-sm font-black ${corNota(a[c])}`}>{a[c]}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AvaliacoesTab() {
  const qc = useQueryClient();
  const listar = useServerFn(listarAvaliacoes);
  const sincronizar = useServerFn(sincronizarMembros);
  const importar = useServerFn(importarProdutividade);
  const listarProd = useServerFn(listarProdutividade);
  const fileRef = useRef<HTMLInputElement>(null);
  const [carregando, setCarregando] = useState(false);
  const [dataImport, setDataImport] = useState(() => new Date().toISOString().slice(0, 10));

  const { data: avaliacoes = [], isLoading } = useQuery({
    queryKey: ["avaliacoes"],
    queryFn: () => listar(),
  });
  const { data: prod = [] } = useQuery({
    queryKey: ["produtividade"],
    queryFn: () => listarProd(),
  });

  async function sync() {
    try {
      const r = await sincronizar({ data: undefined });
      toast.success(r.criados ? `${r.criados} cartinha(s) criada(s)` : "Tudo sincronizado");
      qc.invalidateQueries({ queryKey: ["avaliacoes"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  async function onFile(f: File) {
    setCarregando(true);
    try {
      const texto = await f.text();
      const r = await importar({ data: { conteudo: texto, data: dataImport } });
      toast.success(`${r.linhas} linha(s) lidas · ${r.atualizados} nota(s) de montagem ajustada(s)`);
      qc.invalidateQueries({ queryKey: ["avaliacoes"] });
      qc.invalidateQueries({ queryKey: ["produtividade"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao ler arquivo");
    } finally {
      setCarregando(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border/70 bg-[image:var(--gradient-card)] p-3">
        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Importar relatório de produtividade
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={dataImport}
            onChange={(e) => setDataImport(e.target.value)}
            className="h-10 w-40 rounded-xl bg-input/60 text-xs"
          />
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,.txt,text/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={carregando}
            className="h-10 rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground"
          >
            <Upload className="mr-2 h-4 w-4" />
            {carregando ? "Lendo…" : "Carregar arquivo"}
          </Button>
          <Button onClick={sync} variant="outline" className="h-10 rounded-xl">
            <RefreshCw className="mr-2 h-4 w-4" /> Sincronizar equipe
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          CSV/TXT com nome, montagens, tempo, produtividade líquida/efetiva e tempo ocioso. A IA lê e
          ajusta só a nota de <b>Montagem</b> de quem montou.
        </p>
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 text-center text-sm text-muted-foreground">
          carregando…
        </div>
      )}
      {!isLoading && avaliacoes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-6 text-center text-sm text-muted-foreground">
          Nenhuma cartinha ainda. Cadastre os nomes em Configurações e clique em “Sincronizar equipe”.
        </div>
      )}
      <div className="grid gap-2">
        {avaliacoes.map((a) => (
          <Carta key={a.id} a={a} />
        ))}
      </div>

      {prod.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-border/70 bg-[image:var(--gradient-card)] p-3">
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Últimos carregamentos
          </div>
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase text-muted-foreground">
              <tr>
                <th className="py-1 pr-2">Nome</th>
                <th className="py-1 pr-2">Data</th>
                <th className="py-1 pr-2">Mont.</th>
                <th className="py-1 pr-2">Líq.</th>
                <th className="py-1 pr-2">Efet.</th>
                <th className="py-1">Ocioso</th>
              </tr>
            </thead>
            <tbody>
              {prod.map((p, i) => (
                <tr key={i} className="border-t border-border/40">
                  <td className="py-1 pr-2 font-semibold">{p.nome}</td>
                  <td className="py-1 pr-2 text-muted-foreground">{p.data}</td>
                  <td className="py-1 pr-2">{p.montagens}</td>
                  <td className="py-1 pr-2">{p.produtividade_liquida}</td>
                  <td className="py-1 pr-2">{p.produtividade_efetiva}</td>
                  <td className="py-1">{p.tempo_ocioso}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
