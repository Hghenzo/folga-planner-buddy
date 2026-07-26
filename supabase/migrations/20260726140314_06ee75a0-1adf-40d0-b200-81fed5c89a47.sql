-- Grants faltando (Data API)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planejamentos TO authenticated;
GRANT ALL ON public.planejamentos TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planejamento_shares TO authenticated;
GRANT ALL ON public.planejamento_shares TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planejamento_codigos TO authenticated;
GRANT ALL ON public.planejamento_codigos TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pessoas_turma TO authenticated;
GRANT ALL ON public.pessoas_turma TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Avaliações (cartinhas estilo FIFA)
CREATE TABLE public.avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  turma text,
  pesca int NOT NULL DEFAULT 50,
  inducao int NOT NULL DEFAULT 50,
  goleiro int NOT NULL DEFAULT 50,
  montagem int NOT NULL DEFAULT 50,
  separacao_rk int NOT NULL DEFAULT 50,
  expedicao int NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, nome)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avaliacoes TO authenticated;
GRANT ALL ON public.avaliacoes TO service_role;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "avaliacoes manage self" ON public.avaliacoes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_avaliacoes_touch BEFORE UPDATE ON public.avaliacoes
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- Produtividade importada de arquivo
CREATE TABLE public.produtividade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  data date NOT NULL,
  montagens int NOT NULL DEFAULT 0,
  tempo_min numeric NOT NULL DEFAULT 0,
  produtividade_liquida numeric NOT NULL DEFAULT 0,
  produtividade_efetiva numeric NOT NULL DEFAULT 0,
  tempo_ocioso numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, nome, data)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtividade TO authenticated;
GRANT ALL ON public.produtividade TO service_role;
ALTER TABLE public.produtividade ENABLE ROW LEVEL SECURITY;
CREATE POLICY "produtividade manage self" ON public.produtividade FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_produtividade_touch BEFORE UPDATE ON public.produtividade
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();