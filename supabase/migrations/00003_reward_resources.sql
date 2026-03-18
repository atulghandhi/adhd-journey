-- Milestone 10/14 - admin-managed reward resources

CREATE TABLE public.reward_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX idx_reward_resources_sort_order
ON public.reward_resources(sort_order);

CREATE TRIGGER set_reward_resources_updated_at
BEFORE UPDATE ON public.reward_resources
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.reward_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reward_resources_select_active"
ON public.reward_resources
FOR SELECT
USING ((auth.uid() IS NOT NULL AND is_active = true) OR public.is_admin());

CREATE POLICY "reward_resources_admin_insert"
ON public.reward_resources
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "reward_resources_admin_update"
ON public.reward_resources
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "reward_resources_admin_delete"
ON public.reward_resources
FOR DELETE
USING (public.is_admin());
