-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PackageStatus" ADD VALUE 'CONSOLIDATED';
ALTER TYPE "PackageStatus" ADD VALUE 'IN_TRANSIT';
ALTER TYPE "PackageStatus" ADD VALUE 'IN_CUSTOMS';
ALTER TYPE "PackageStatus" ADD VALUE 'AVAILABLE';
ALTER TYPE "PackageStatus" ADD VALUE 'DELIVERED';
ALTER TYPE "PackageStatus" ADD VALUE 'RETURNED';
ALTER TYPE "PackageStatus" ADD VALUE 'LOST';
ALTER TYPE "PackageStatus" ADD VALUE 'DAMAGED';

-- AlterTable
ALTER TABLE "SaleOrderLine" ADD COLUMN     "packageQuoteId" TEXT;

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "availableAt" TIMESTAMP(3),
ADD COLUMN     "currentBranchId" TEXT,
ADD COLUMN     "currentQuoteId" TEXT,
ADD COLUMN     "deliveredAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PackageQuote" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "rateCardId" TEXT,
    "mode" "TransportMode" NOT NULL,
    "pricePerLb" DECIMAL(65,30) NOT NULL,
    "chargeableLb" DECIMAL(65,30) NOT NULL,
    "volumetricLb" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "freightSubtotal" DECIMAL(65,30) NOT NULL,
    "storageAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "categoryAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'USD',
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "computedByUserId" TEXT,

    CONSTRAINT "PackageQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerAuthChallenge" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "requestIpHash" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerAuthChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounterVisit" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CounterVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PackageQuote_packageId_computedAt_idx" ON "PackageQuote"("packageId", "computedAt");

-- CreateIndex
CREATE INDEX "CustomerAuthChallenge_customerId_createdAt_idx" ON "CustomerAuthChallenge"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerAuthChallenge_expiresAt_idx" ON "CustomerAuthChallenge"("expiresAt");

-- CreateIndex
CREATE INDEX "CounterVisit_branchId_at_idx" ON "CounterVisit"("branchId", "at");

-- CreateIndex
CREATE INDEX "CounterVisit_customerId_at_idx" ON "CounterVisit"("customerId", "at");

-- CreateIndex
CREATE UNIQUE INDEX "Package_currentQuoteId_key" ON "Package"("currentQuoteId");

-- CreateIndex
CREATE INDEX "Package_currentBranchId_status_idx" ON "Package"("currentBranchId", "status");

-- AddForeignKey
ALTER TABLE "SaleOrderLine" ADD CONSTRAINT "SaleOrderLine_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrderLine" ADD CONSTRAINT "SaleOrderLine_packageQuoteId_fkey" FOREIGN KEY ("packageQuoteId") REFERENCES "PackageQuote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchTicketPackage" ADD CONSTRAINT "DispatchTicketPackage_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_currentBranchId_fkey" FOREIGN KEY ("currentBranchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_currentQuoteId_fkey" FOREIGN KEY ("currentQuoteId") REFERENCES "PackageQuote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageQuote" ADD CONSTRAINT "PackageQuote_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageQuote" ADD CONSTRAINT "PackageQuote_computedByUserId_fkey" FOREIGN KEY ("computedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAuthChallenge" ADD CONSTRAINT "CustomerAuthChallenge_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounterVisit" ADD CONSTRAINT "CounterVisit_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounterVisit" ADD CONSTRAINT "CounterVisit_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounterVisit" ADD CONSTRAINT "CounterVisit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

