DO $$
BEGIN
  IF to_regclass('"Expense"') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Expense_organizationId_fkey') THEN
    ALTER TABLE "Expense" ADD CONSTRAINT "Expense_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
