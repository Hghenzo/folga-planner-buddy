ALTER TABLE public.produtividade
  ADD COLUMN IF NOT EXISTS utilizacao numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unidades integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.equipes (
  user_id uuid PRIMARY KEY,
  nome text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipes TO authenticated;
GRANT ALL ON public.equipes TO service_role;

ALTER TABLE public.equipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "equipes manage self"
ON public.equipes FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_equipes_touch BEFORE UPDATE ON public.equipes
FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();