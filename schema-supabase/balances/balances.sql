ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public select balances"
ON public.balances
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Public insert balances"
ON public.balances
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Public delete balances"
ON public.balances
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Public update balances"
ON public.balances
FOR UPDATE
TO authenticated
USING (true);

ALTER TABLE public.balance_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public select balance_transactions"
ON public.balance_transactions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Public insert balance_transactions"
ON public.balance_transactions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Public delete balance_transactions"
ON public.balance_transactions
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Public update balance_transactions"
ON public.balance_transactions
FOR UPDATE
TO authenticated
USING (true);