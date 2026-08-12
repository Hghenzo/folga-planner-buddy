import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  CARGOS,
  ESTEIRAS,
  TURNOS,
  type Cargo,
  type EsteiraPerfil,
  type Turno,
} from "@/lib/perfil.functions";

type Modo = "login" | "cadastro";

const ROTULO_ESTEIRA: Record<EsteiraPerfil, string> = {
  full: "Esteira do Full",
  vermelha: "Esteira Vermelha",
  amarela: "Esteira Amarela",
  verde: "Esteira Verde",
};

const ROTULO_CARGO: Record<Cargo, string> = {
  ps: "PS",
  lider: "Líder",
  rep: "Rep",
};

export function AuthForm() {
  const [modo, setModo] = useState<Modo>("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [esteira, setEsteira] = useState<EsteiraPerfil>("full");
  const [cargo, setCargo] = useState<Cargo>("rep");
  const [turno, setTurno] = useState<Turno>("T1");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (modo === "cadastro") {
        const { error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              display_name: nome || email.split("@")[0],
              esteira,
              cargo,
              turno,
            },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Já pode entrar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        toast.success("Bem-vindo!");
        navigate({ to: "/app" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro na autenticação");
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-4">
      <div className="rounded-3xl border border-border/70 bg-[image:var(--gradient-card)] p-6 shadow-[var(--shadow-card)]">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
            <CalendarDays className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="bg-[image:var(--gradient-primary)] bg-clip-text text-xl font-black text-transparent">
              Escala de Folgas
            </h1>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {modo === "login" ? "Entrar na conta" : "Criar conta"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {modo === "cadastro" && (
            <>
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label>Esteira</Label>
                <Select value={esteira} onValueChange={(v) => setEsteira(v as EsteiraPerfil)}>
                  <SelectTrigger className="mt-1.5 h-11 rounded-xl bg-input/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTEIRAS.map((e) => (
                      <SelectItem key={e} value={e}>
                        {ROTULO_ESTEIRA[e]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Cargo</Label>
                  <Select value={cargo} onValueChange={(v) => setCargo(v as Cargo)}>
                    <SelectTrigger className="mt-1.5 h-11 rounded-xl bg-input/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CARGOS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {ROTULO_CARGO[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Turno</Label>
                  <Select value={turno} onValueChange={(v) => setTurno(v as Turno)}>
                    <SelectTrigger className="mt-1.5 h-11 rounded-xl bg-input/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TURNOS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              required
              minLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-xl bg-[image:var(--gradient-primary)] font-bold text-primary-foreground"
          >
            {loading ? "..." : modo === "login" ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setModo(modo === "login" ? "cadastro" : "login")}
          className="mt-4 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {modo === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </button>
      </div>
    </div>
  );
}
