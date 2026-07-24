import { createFileRoute } from "@tanstack/react-router";
import { CalendarioView } from "@/components/calendario-view";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Escala de Folgas — Calendário por turma" },
      {
        name: "description",
        content:
          "Veja qual turma (A, B, C ou D) está de folga hoje e nos próximos dias. Calendário 2026 já pronto.",
      },
      { property: "og:title", content: "Escala de Folgas" },
      {
        property: "og:description",
        content: "Calendário 2026 com a escala de folgas por turma.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CalendarioView,
});
