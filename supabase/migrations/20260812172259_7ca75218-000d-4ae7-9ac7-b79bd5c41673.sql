ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS esteira text NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS cargo text NOT NULL DEFAULT 'rep',
  ADD COLUMN IF NOT EXISTS turno text NOT NULL DEFAULT 'T1';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_esteira_check CHECK (esteira IN ('full','vermelha','amarela','verde')),
  ADD CONSTRAINT profiles_cargo_check CHECK (cargo IN ('ps','lider','rep')),
  ADD CONSTRAINT profiles_turno_check CHECK (turno IN ('T1','T2','T3','T4','T5'));

CREATE OR REPLACE FUNCTION public.pode_gerenciar(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _user_id AND p.cargo IN ('ps','lider')
  )
$$;

REVOKE ALL ON FUNCTION public.pode_gerenciar(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pode_gerenciar(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, esteira, cargo, turno)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'esteira', 'full'),
    COALESCE(NEW.raw_user_meta_data->>'cargo', 'rep'),
    COALESCE(NEW.raw_user_meta_data->>'turno', 'T1')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TABLE public.colaboradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, nome)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.colaboradores TO authenticated;
GRANT ALL ON public.colaboradores TO service_role;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "colaboradores select self" ON public.colaboradores
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "colaboradores insert gestor" ON public.colaboradores
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.pode_gerenciar(auth.uid()));
CREATE POLICY "colaboradores update gestor" ON public.colaboradores
  FOR UPDATE TO authenticated USING (auth.uid() = user_id AND public.pode_gerenciar(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.pode_gerenciar(auth.uid()));
CREATE POLICY "colaboradores delete gestor" ON public.colaboradores
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND public.pode_gerenciar(auth.uid()));

CREATE TRIGGER colaboradores_touch BEFORE UPDATE ON public.colaboradores
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

CREATE TABLE public.faltas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  colaborador_id uuid REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  nome text NOT NULL,
  data date NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('falta','atestado','licenca','banco_horas')),
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.faltas TO authenticated;
GRANT ALL ON public.faltas TO service_role;
ALTER TABLE public.faltas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faltas select self" ON public.faltas
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "faltas insert gestor" ON public.faltas
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.pode_gerenciar(auth.uid()));
CREATE POLICY "faltas update gestor" ON public.faltas
  FOR UPDATE TO authenticated USING (auth.uid() = user_id AND public.pode_gerenciar(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.pode_gerenciar(auth.uid()));
CREATE POLICY "faltas delete gestor" ON public.faltas
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND public.pode_gerenciar(auth.uid()));

CREATE TRIGGER faltas_touch BEFORE UPDATE ON public.faltas
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

CREATE INDEX idx_faltas_user_data ON public.faltas (user_id, data DESC);