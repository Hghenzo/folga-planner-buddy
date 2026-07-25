
-- ============ profiles ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles select all authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles insert self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles update self" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ pessoas_turma ============
CREATE TABLE public.pessoas_turma (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  turma TEXT NOT NULL CHECK (turma IN ('A','B','C','D')),
  nomes TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, turma)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pessoas_turma TO authenticated;
GRANT ALL ON public.pessoas_turma TO service_role;
ALTER TABLE public.pessoas_turma ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pessoas_turma manage self" ON public.pessoas_turma FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ planejamentos ============
CREATE TABLE public.planejamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  data DATE NOT NULL,
  esteira JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planejamentos TO authenticated;
GRANT ALL ON public.planejamentos TO service_role;
ALTER TABLE public.planejamentos ENABLE ROW LEVEL SECURITY;

-- ============ planejamento_shares ============
CREATE TABLE public.planejamento_shares (
  planejamento_id UUID NOT NULL REFERENCES public.planejamentos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permissao TEXT NOT NULL CHECK (permissao IN ('view','edit')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (planejamento_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planejamento_shares TO authenticated;
GRANT ALL ON public.planejamento_shares TO service_role;
ALTER TABLE public.planejamento_shares ENABLE ROW LEVEL SECURITY;

-- helper: can user view/edit planejamento?
CREATE OR REPLACE FUNCTION public.can_view_planejamento(_pid UUID, _uid UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.planejamentos p WHERE p.id = _pid AND p.owner_id = _uid
  ) OR EXISTS (
    SELECT 1 FROM public.planejamento_shares s WHERE s.planejamento_id = _pid AND s.user_id = _uid
  );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_planejamento(_pid UUID, _uid UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.planejamentos p WHERE p.id = _pid AND p.owner_id = _uid
  ) OR EXISTS (
    SELECT 1 FROM public.planejamento_shares s
    WHERE s.planejamento_id = _pid AND s.user_id = _uid AND s.permissao = 'edit'
  );
$$;

CREATE POLICY "planejamentos select" ON public.planejamentos FOR SELECT TO authenticated
  USING (public.can_view_planejamento(id, auth.uid()));
CREATE POLICY "planejamentos insert own" ON public.planejamentos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "planejamentos update" ON public.planejamentos FOR UPDATE TO authenticated
  USING (public.can_edit_planejamento(id, auth.uid()))
  WITH CHECK (public.can_edit_planejamento(id, auth.uid()));
CREATE POLICY "planejamentos delete owner" ON public.planejamentos FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "shares select" ON public.planejamento_shares FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.planejamentos p WHERE p.id = planejamento_id AND p.owner_id = auth.uid())
  );
CREATE POLICY "shares insert owner" ON public.planejamento_shares FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.planejamentos p WHERE p.id = planejamento_id AND p.owner_id = auth.uid()));
CREATE POLICY "shares update owner" ON public.planejamento_shares FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.planejamentos p WHERE p.id = planejamento_id AND p.owner_id = auth.uid()));
CREATE POLICY "shares delete owner or self" ON public.planejamento_shares FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.planejamentos p WHERE p.id = planejamento_id AND p.owner_id = auth.uid())
  );

-- ============ planejamento_codigos ============
CREATE TABLE public.planejamento_codigos (
  codigo TEXT PRIMARY KEY,
  planejamento_id UUID NOT NULL REFERENCES public.planejamentos(id) ON DELETE CASCADE,
  permissao TEXT NOT NULL CHECK (permissao IN ('view','edit')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.planejamento_codigos TO authenticated;
GRANT ALL ON public.planejamento_codigos TO service_role;
ALTER TABLE public.planejamento_codigos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "codigos select owner" ON public.planejamento_codigos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.planejamentos p WHERE p.id = planejamento_id AND p.owner_id = auth.uid()));
CREATE POLICY "codigos insert owner" ON public.planejamento_codigos FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (SELECT 1 FROM public.planejamentos p WHERE p.id = planejamento_id AND p.owner_id = auth.uid())
  );
CREATE POLICY "codigos delete owner" ON public.planejamento_codigos FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.planejamentos p WHERE p.id = planejamento_id AND p.owner_id = auth.uid()));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER planejamentos_touch BEFORE UPDATE ON public.planejamentos
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE TRIGGER pessoas_touch BEFORE UPDATE ON public.pessoas_turma
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
