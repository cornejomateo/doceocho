ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public select budgets"
ON public.budgets
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Public insert budgets"
ON public.budgets
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Public delete budgets"
ON public.budgets
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Public update budgets"
ON public.budgets
FOR UPDATE
TO authenticated
USING (true);

ALTER TABLE public.folder_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public select folder_budgets"
ON public.folder_budgets
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Public insert folder_budgets"
ON public.folder_budgets
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Public delete folder_budgets"
ON public.folder_budgets
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Public update folder_budgets"
ON public.folder_budgets
FOR UPDATE
TO authenticated
USING (true);
