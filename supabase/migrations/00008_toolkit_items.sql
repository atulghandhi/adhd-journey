-- Toolkit items: tracks which completed tasks the user wants to retain as strategies
CREATE TABLE public.toolkit_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  journey_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  status text NOT NULL DEFAULT 'keep' CHECK (status IN ('keep', 'maybe_later', 'not_for_me')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, task_id, journey_id)
);

CREATE INDEX idx_toolkit_items_user_status ON public.toolkit_items(user_id, status);

CREATE TRIGGER set_toolkit_items_updated_at
BEFORE UPDATE ON public.toolkit_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.toolkit_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "toolkit_items_select_own"
ON public.toolkit_items
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "toolkit_items_insert_own"
ON public.toolkit_items
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "toolkit_items_update_own"
ON public.toolkit_items
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "toolkit_items_delete_own"
ON public.toolkit_items
FOR DELETE
USING (user_id = auth.uid());
