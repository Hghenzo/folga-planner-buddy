DROP POLICY IF EXISTS "planejamentos select" ON public.planejamentos;
CREATE POLICY "planejamentos select"
ON public.planejamentos FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.planejamento_shares s
    WHERE s.planejamento_id = planejamentos.id AND s.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "planejamentos update" ON public.planejamentos;
CREATE POLICY "planejamentos update"
ON public.planejamentos FOR UPDATE
TO authenticated
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.planejamento_shares s
    WHERE s.planejamento_id = planejamentos.id
      AND s.user_id = auth.uid()
      AND s.permissao = 'edit'
  )
)
WITH CHECK (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.planejamento_shares s
    WHERE s.planejamento_id = planejamentos.id
      AND s.user_id = auth.uid()
      AND s.permissao = 'edit'
  )
);

-- avoid policy recursion: shares are visible only to their recipient
DROP POLICY IF EXISTS "shares select" ON public.planejamento_shares;
CREATE POLICY "shares select"
ON public.planejamento_shares FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP FUNCTION IF EXISTS public.can_view_planejamento(uuid, uuid);
DROP FUNCTION IF EXISTS public.can_edit_planejamento(uuid, uuid);