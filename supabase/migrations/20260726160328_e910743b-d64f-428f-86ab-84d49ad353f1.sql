-- 1. profiles: restrict SELECT
DROP POLICY IF EXISTS "profiles select all authenticated" ON public.profiles;

CREATE POLICY "profiles select self or shared"
ON public.profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.planejamentos p
    WHERE p.owner_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.planejamento_shares s
        WHERE s.planejamento_id = p.id AND s.user_id = profiles.id
      )
  )
  OR EXISTS (
    SELECT 1 FROM public.planejamento_shares s
    WHERE s.user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.planejamentos p
        WHERE p.id = s.planejamento_id AND p.owner_id = profiles.id
      )
  )
);

-- 2. planejamento_shares: add WITH CHECK to update policy
DROP POLICY IF EXISTS "shares update owner" ON public.planejamento_shares;

CREATE POLICY "shares update owner"
ON public.planejamento_shares FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.planejamentos p
    WHERE p.id = planejamento_shares.planejamento_id AND p.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.planejamentos p
    WHERE p.id = planejamento_shares.planejamento_id AND p.owner_id = auth.uid()
  )
);

-- 3. revoke direct execution of SECURITY DEFINER helpers from API roles
REVOKE EXECUTE ON FUNCTION public.can_view_planejamento(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_edit_planejamento(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_touch_updated_at() FROM PUBLIC, anon, authenticated;