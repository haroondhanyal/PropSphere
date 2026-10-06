ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DEVELOPER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'FINANCE';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'VENDOR';

ALTER TABLE "Vendor" ADD COLUMN "userId" TEXT;
CREATE UNIQUE INDEX "Vendor_userId_key" ON "Vendor"("userId");
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "VendorBill" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "maintenanceRequestId" TEXT NOT NULL,
  "invoiceReference" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DECIMAL(15,2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  CONSTRAINT "VendorBill_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VendorBill_maintenanceRequestId_key" ON "VendorBill"("maintenanceRequestId");
CREATE INDEX "VendorBill_organizationId_status_submittedAt_idx" ON "VendorBill"("organizationId", "status", "submittedAt");
ALTER TABLE "VendorBill" ADD CONSTRAINT "VendorBill_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VendorBill" ADD CONSTRAINT "VendorBill_maintenanceRequestId_fkey" FOREIGN KEY ("maintenanceRequestId") REFERENCES "MaintenanceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "DevelopmentProject" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "address" TEXT,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PLANNING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DevelopmentProject_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DevelopmentProject_organizationId_status_idx" ON "DevelopmentProject"("organizationId", "status");

CREATE TABLE "DevelopmentUnit" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "unitNumber" TEXT NOT NULL,
  "floor" INTEGER NOT NULL DEFAULT 0,
  "bedrooms" INTEGER NOT NULL DEFAULT 0,
  "areaSqft" INTEGER NOT NULL,
  "price" DECIMAL(15,2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DevelopmentUnit_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DevelopmentUnit_projectId_unitNumber_key" ON "DevelopmentUnit"("projectId", "unitNumber");
CREATE INDEX "DevelopmentUnit_projectId_status_idx" ON "DevelopmentUnit"("projectId", "status");
ALTER TABLE "DevelopmentUnit" ADD CONSTRAINT "DevelopmentUnit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "DevelopmentProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Reservation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "unitId" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "customerEmail" TEXT NOT NULL,
  "customerPhone" TEXT,
  "deposit" DECIMAL(15,2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Reservation_organizationId_status_createdAt_idx" ON "Reservation"("organizationId", "status", "createdAt");
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "DevelopmentUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Installment" (
  "id" TEXT NOT NULL,
  "reservationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "amount" DECIMAL(15,2) NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DUE',
  "paidAt" TIMESTAMP(3),
  CONSTRAINT "Installment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Installment_reservationId_dueDate_idx" ON "Installment"("reservationId", "dueDate");
ALTER TABLE "Installment" ADD CONSTRAINT "Installment_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "StayListing" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "nightlyRate" DECIMAL(15,2) NOT NULL,
  "maxGuests" INTEGER NOT NULL DEFAULT 2,
  "bedrooms" INTEGER NOT NULL DEFAULT 1,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StayListing_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "StayListing_organizationId_active_city_idx" ON "StayListing"("organizationId", "active", "city");

CREATE TABLE "StayBooking" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "stayId" TEXT NOT NULL,
  "guestId" TEXT NOT NULL,
  "checkIn" TIMESTAMP(3) NOT NULL,
  "checkOut" TIMESTAMP(3) NOT NULL,
  "guests" INTEGER NOT NULL DEFAULT 1,
  "nightlyRate" DECIMAL(15,2) NOT NULL,
  "totalAmount" DECIMAL(15,2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'REQUESTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StayBooking_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "StayBooking_organizationId_checkIn_status_idx" ON "StayBooking"("organizationId", "checkIn", "status");
CREATE INDEX "StayBooking_guestId_createdAt_idx" ON "StayBooking"("guestId", "createdAt");
ALTER TABLE "StayBooking" ADD CONSTRAINT "StayBooking_stayId_fkey" FOREIGN KEY ("stayId") REFERENCES "StayListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Expense" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "propertyId" TEXT,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DECIMAL(15,2) NOT NULL,
  "incurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Expense_organizationId_incurredAt_idx" ON "Expense"("organizationId", "incurredAt");
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "OwnerPayout" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "amount" DECIMAL(15,2) NOT NULL,
  "period" TEXT NOT NULL,
  "reference" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OwnerPayout_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OwnerPayout_organizationId_ownerId_period_idx" ON "OwnerPayout"("organizationId", "ownerId", "period");

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "details" JSONB,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

CREATE TABLE "RiskFlag" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "entityType" TEXT,
  "entityId" TEXT,
  "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "createdById" TEXT NOT NULL,
  "resolvedById" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RiskFlag_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RiskFlag_organizationId_status_severity_idx" ON "RiskFlag"("organizationId", "status", "severity");

CREATE TABLE "OrganizationSetting" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrganizationSetting_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OrganizationSetting_organizationId_key_key" ON "OrganizationSetting"("organizationId", "key");
