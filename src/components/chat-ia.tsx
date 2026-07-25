import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User as UserIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { EsteiraState } from "@/lib/esteira";

type Msg = { role: "user" | "assistant"; content: string };

export function ChatIA({
  esteira,
  disponiveis,
  onEsteira,
  readOnly,
}: {
  esteira: EsteiraState;
  disponiveis: string[];
  onEsteira: (e: EsteiraState) => void;
  readOnly?: boolean;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Me diz o que fazer com a esteira. Ex: \"coloca o João na ilha 22 como bipador 1\", \"distribui o pessoal disponível\", \"tira a Maria de todos os lugares\".",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function enviar() {
    const message = input.trim();
    if (!message || loading || readOnly) return;
    setInput("");
    const historico = msgs.filter((_, i) => i > 0); // dropa boas-vindas
    setMsgs((m) => [...m, { role: "user", content: message }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, esteira, disponiveis, historico }),
      });
      if (!res.ok) {
        const t = await res.text();
        if (res.status === 402) throw new Error("Créditos de IA esgotados.");
        if (res.status === 429) throw new Error("Muitas requisições. Tenta de novo em uns segundos.");
        throw new Error(t || "Erro na IA");
      }
      const data = (await res.json()) as { resposta: string; esteira: EsteiraState };
      setMsgs((m) => [...m, { role: "assistant", content: data.resposta || "Feito." }]);
      if (data.esteira) onEsteira(data.esteira);
    } catch (err) {
      const m = err instanceof Error ? err.message : "Erro";
      toast.error(m);
      setMsgs((mm) => [...mm, { role: "assistant", content: `⚠️ ${m}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-2xl border border-border/70 bg-[image:var(--gradient-card)]">
      <div className="flex items-center gap-2 border-b border-border/60 p-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-[image:var(--gradient-primary)]">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <div className="text-sm font-bold">Assistente IA</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Edita a esteira por você
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && (
              <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/40">
                <Bot className="h-3.5 w-3.5" />
              </div>
            )}
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-primary/90 text-primary-foreground"
                  : "bg-card/70 text-foreground"
              }`}
            >
              {m.content}
            </div>
            {m.role === "user" && (
              <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/40">
                <UserIcon className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="text-xs text-muted-foreground">pensando…</div>
        )}
      </div>
      <div className="flex gap-2 border-t border-border/60 p-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={readOnly ? "Somente leitura" : "Descreva a mudança..."}
          disabled={loading || readOnly}
          onKeyDown={(e) => {
            if (e.key === "Enter") enviar();
          }}
          className="h-10 rounded-xl bg-input/60"
        />
        <Button
          onClick={enviar}
          disabled={loading || readOnly || !input.trim()}
          className="h-10 rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
