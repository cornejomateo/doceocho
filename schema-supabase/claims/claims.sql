ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public select claims"
ON public.claims
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Public insert claims"
ON public.claims
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Public delete claims"
ON public.claims
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Public update claims"
ON public.claims
FOR UPDATE
TO authenticated
USING (true);