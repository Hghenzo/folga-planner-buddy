import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ConfigForm } from "@/components/config-form";
import { carregarPessoas, type Pessoas } from "@/lib/folgas";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Pessoas por turma — Escala de Folgas" },
      {
        name: "description",
        content: "Cadastre os nomes das pessoas de cada turma (A, B, C e D).",
      },
      { property: "og:title", content: "Pessoas por turma" },
      { property: "og:description", content: "Cadastre os nomes por turma." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConfigPage,
});

function ConfigPage() {
  const [pessoas, setPessoas] = useState<Pessoas | null>(null);

  useEffect(() => {
    setPessoas(carregarPessoas());
  }, []);

  if (!pessoas) return null;
  return <ConfigForm inicial={pessoas} />;
}
