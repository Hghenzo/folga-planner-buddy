import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  compartilharPorEmail,
  gerarCodigoAcesso,
} from "@/lib/planejamentos.functions";

export function CompartilharDialog({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [permissao, setPermissao] = useState<"view" | "edit">("view");
  const [codigo, setCodigo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const compartilharFn = useServerFn(compartilharPorEmail);
  const gerarFn = useServerFn(gerarCodigoAcesso);

  async function compartilhar() {
    if (!email) return;
    setLoading(true);
    try {
      await compartilharFn({ data: { id, email, permissao } });
      toast.success("Compartilhado!");
      setEmail("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  async function gerarCodigo() {
    setLoading(true);
    try {
      const r = await gerarFn({ data: { id, permissao } });
      setCodigo(r.codigo);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-border/60 bg-card/60"
        aria-label="Compartilhar"
      >
        <Share2 className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl border-border/70">
          <DialogHeader>
            <DialogTitle>Compartilhar planejamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Permissão
              </Label>
              <RadioGroup
                value={permissao}
                onValueChange={(v) => setPermissao(v as "view" | "edit")}
                className="mt-2 grid grid-cols-2 gap-2"
              >
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border/60 bg-card/60 p-3">
                  <RadioGroupItem value="view" id="p-view" />
                  <span className="text-sm">Somente ver</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border/60 bg-card/60 p-3">
                  <RadioGroupItem value="edit" id="p-edit" />
                  <span className="text-sm">Pode editar</span>
                </label>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
                Por email
              </Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colega@empresa.com"
                  className="h-10 rounded-xl bg-input/60"
                />
                <Button onClick={compartilhar} disabled={loading || !email} className="rounded-xl">
                  Enviar
                </Button>
              </div>
            </div>

            <div className="border-t border-border/50 pt-4">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Ou gere um código
              </Label>
              {codigo ? (
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 p-3">
                  <div className="flex-1 text-2xl font-black tracking-widest">{codigo}</div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(codigo);
                      toast.success("Copiado");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={gerarCodigo}
                  disabled={loading}
                  variant="outline"
                  className="mt-2 w-full rounded-xl"
                >
                  Gerar código de 6 dígitos
                </Button>
              )}
              <p className="mt-2 text-[11px] text-muted-foreground">
                O código expira em 7 dias.
              </p>
            </div>
          </div>
          <DialogFooter />
        </DialogContent>
      </Dialog>
    </>
  );
}
