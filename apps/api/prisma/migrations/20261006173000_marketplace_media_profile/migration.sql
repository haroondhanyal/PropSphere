ALTER TABLE "User"
  ADD COLUMN "accountType" TEXT NOT NULL DEFAULT 'OWNER',
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "avatarUrl" TEXT;

ALTER TABLE "Property"
  ADD COLUMN "streetAddress" TEXT,
  ADD COLUMN "floors" INTEGER;
