import { createFileRoute } from "@tanstack/react-router";
import { esteiraVazia, TODAS_ILHAS } from "@/lib/esteira";

type ChatBody = {
  message?: string;
  esteira?: unknown;
  disponiveis?: string[];
  historico?: { role: "user" | "assistant"; content: string }[];
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatBody;
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const esteira = body.esteira ?? esteiraVazia();
        const sys = `Você é um assistente que edita um planejamento de esteira de trabalho.
Estrutura da esteira (JSON): { ilhas: Record<string, { pescador, bipador_1, bipador_2 }>, goleiros: [g1, g2], inducao, onda_negra: { pesca, monta } }.
IDs de ilhas válidos: ${TODAS_ILHAS.join(", ")}.
Cada slot é uma string com um nome (vazio "" se desocupado).
Pessoas disponíveis: ${(body.disponiveis ?? []).join(", ") || "(nenhuma)"}.
Esteira atual: ${JSON.stringify(esteira)}.

Ao receber uma instrução do usuário, responda SEMPRE em JSON puro (sem markdown), no formato:
{ "resposta": "texto curto explicando o que foi feito", "esteira": <esteira atualizada completa> }
Não invente pessoas fora da lista disponíveis, exceto se o usuário citar explicitamente o nome.`;

        const messages = [
          { role: "system", content: sys },
          ...(body.historico ?? []),
          { role: "user", content: body.message ?? "" },
        ];

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "Lovable-API-Key": key,
          },
          body: JSON.stringify({
            model: "google/gemini-3.6-flash",
            messages,
            response_format: { type: "json_object" },
          }),
        });
        if (!res.ok) {
          const t = await res.text();
          return new Response(t, { status: res.status });
        }
        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const content = data.choices?.[0]?.message?.content ?? "{}";
        let parsed: { resposta?: string; esteira?: unknown } = {};
        try {
          parsed = JSON.parse(content);
        } catch {
          parsed = { resposta: content, esteira };
        }
        return Response.json({
          resposta: parsed.resposta ?? "",
          esteira: parsed.esteira ?? esteira,
        });
      },
    },
  },
});
