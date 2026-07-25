import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/auth-form";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — Escala de Folgas" },
      { name: "description", content: "Entre ou crie sua conta para acessar planejamentos da escala." },
      { property: "og:title", content: "Entrar — Escala de Folgas" },
      { property: "og:description", content: "Acesse seus planejamentos de escala." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthForm,
});
