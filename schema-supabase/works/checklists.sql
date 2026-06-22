ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public select checklists"
ON public.checklists
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Public insert checklists"
ON public.checklists
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Public delete checklists"
ON public.checklists
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Public update checklists"
ON public.checklists
FOR UPDATE
TO authenticated
USING (true);