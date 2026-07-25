import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ConfigForm } from "@/components/config-form";
import { obterPessoas } from "@/lib/planejamentos.functions";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Pessoas por turma — Escala de Folgas" },
      { name: "description", content: "Cadastre os nomes das pessoas de cada turma (A, B, C e D)." },
      { property: "og:title", content: "Pessoas por turma" },
      { property: "og:description", content: "Cadastre os nomes por turma." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConfigPage,
});

function ConfigPage() {
  const getPessoas = useServerFn(obterPessoas);
  const { data, isLoading } = useQuery({
    queryKey: ["pessoas"],
    queryFn: () => getPessoas(),
  });
  if (isLoading || !data) {
    return <div className="p-6 text-center text-sm text-muted-foreground">carregando…</div>;
  }
  return <ConfigForm inicial={data} />;
}
