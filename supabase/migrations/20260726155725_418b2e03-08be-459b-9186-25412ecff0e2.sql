DROP POLICY IF EXISTS "planejamentos select" ON public.planejamentos;
CREATE POLICY "planejamentos select" ON public.planejamentos
FOR SELECT TO authenticated
USING (owner_id = auth.uid() OR public.can_view_planejamento(id, auth.uid()));

DROP POLICY IF EXISTS "planejamentos update" ON public.planejamentos;
CREATE POLICY "planejamentos update" ON public.planejamentos
FOR UPDATE TO authenticated
USING (owner_id = auth.uid() OR public.can_edit_planejamento(id, auth.uid()))
WITH CHECK (owner_id = auth.uid() OR public.can_edit_planejamento(id, auth.uid()));