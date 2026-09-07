-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('PRE_ALERTED', 'RECEIVED_ORIGIN', 'ORPHAN');

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "trackingCode" TEXT NOT NULL,
    "customerId" TEXT,
    "status" "PackageStatus" NOT NULL,
    "mode" "TransportMode" NOT NULL,
    "originBranchId" TEXT,
    "originCarrier" TEXT,
    "originTrackingNumber" TEXT,
    "labelRecipientRaw" TEXT,
    "weightOriginLb" DECIMAL(65,30),
    "lengthIn" DECIMAL(65,30),
    "widthIn" DECIMAL(65,30),
    "heightIn" DECIMAL(65,30),
    "volumetricLb" DECIMAL(65,30),
    "chargeableLb" DECIMAL(65,30),
    "weightSource" TEXT,
    "weightCustomsLb" DECIMAL(65,30),
    "weightVariance" DECIMAL(65,30),
    "weightVarianceFlagged" BOOLEAN NOT NULL DEFAULT false,
    "quoteRateCardId" TEXT,
    "quotePricePerLb" DECIMAL(65,30),
    "quoteSubtotal" DECIMAL(65,30),
    "quoteCurrency" "CurrencyCode",
    "declaredValue" DECIMAL(65,30),
    "receivedAt" TIMESTAMP(3),
    "receivedByUserId" TEXT,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreAlert" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "mode" "TransportMode" NOT NULL,
    "originCarrier" TEXT,
    "originTrackingNumber" TEXT NOT NULL,
    "declaredValue" DECIMAL(65,30),
    "description" TEXT,
    "proofKey" TEXT,
    "matchedAt" TIMESTAMP(3),
    "packageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateCard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mode" "TransportMode" NOT NULL,
    "pricePerLb" DECIMAL(65,30) NOT NULL,
    "minimumCharge" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "volumetricDivisor" DECIMAL(65,30),
    "currency" "CurrencyCode" NOT NULL DEFAULT 'USD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "customerId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CargoTimelineEntry" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "payloadJson" JSONB,
    "actorUserId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CargoTimelineEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxDelivery" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "consumer" TEXT NOT NULL,
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerNotification" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'PENDING',
    "kind" TEXT NOT NULL,
    "subjectRef" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "CustomerNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceivingQueueItem" (
    "id" TEXT NOT NULL,
    "offlineClientId" TEXT NOT NULL,
    "capturedByUserId" TEXT NOT NULL,
    "originBranchId" TEXT,
    "rawBarcode" TEXT NOT NULL,
    "weightOriginLb" DECIMAL(65,30),
    "lengthIn" DECIMAL(65,30),
    "widthIn" DECIMAL(65,30),
    "heightIn" DECIMAL(65,30),
    "photoKey" TEXT,
    "labelRecipientRaw" TEXT,
    "weightSource" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_MATCH',
    "packageId" TEXT,
    "processedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReceivingQueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Package_trackingCode_key" ON "Package"("trackingCode");

-- CreateIndex
CREATE UNIQUE INDEX "Package_originTrackingNumber_key" ON "Package"("originTrackingNumber");

-- CreateIndex
CREATE INDEX "Package_customerId_status_idx" ON "Package"("customerId", "status");

-- CreateIndex
CREATE INDEX "Package_status_locationId_idx" ON "Package"("status", "locationId");

-- CreateIndex
CREATE INDEX "Package_originTrackingNumber_idx" ON "Package"("originTrackingNumber");

-- CreateIndex
CREATE INDEX "Package_status_createdAt_idx" ON "Package"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PreAlert_packageId_key" ON "PreAlert"("packageId");

-- CreateIndex
CREATE INDEX "PreAlert_originTrackingNumber_matchedAt_idx" ON "PreAlert"("originTrackingNumber", "matchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PreAlert_customerId_originTrackingNumber_key" ON "PreAlert"("customerId", "originTrackingNumber");

-- CreateIndex
CREATE INDEX "RateCard_mode_isActive_effectiveFrom_idx" ON "RateCard"("mode", "isActive", "effectiveFrom");

-- CreateIndex
CREATE INDEX "RateCard_customerId_mode_isActive_idx" ON "RateCard"("customerId", "mode", "isActive");

-- CreateIndex
CREATE INDEX "CargoTimelineEntry_packageId_occurredAt_idx" ON "CargoTimelineEntry"("packageId", "occurredAt");

-- CreateIndex
CREATE INDEX "CargoTimelineEntry_eventType_occurredAt_idx" ON "CargoTimelineEntry"("eventType", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "CargoTimelineEntry_packageId_seq_key" ON "CargoTimelineEntry"("packageId", "seq");

-- CreateIndex
CREATE INDEX "OutboxEvent_processedAt_occurredAt_idx" ON "OutboxEvent"("processedAt", "occurredAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_aggregateType_aggregateId_idx" ON "OutboxEvent"("aggregateType", "aggregateId");

-- CreateIndex
CREATE UNIQUE INDEX "OutboxDelivery_eventId_consumer_key" ON "OutboxDelivery"("eventId", "consumer");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerNotification_dedupeKey_key" ON "CustomerNotification"("dedupeKey");

-- CreateIndex
CREATE INDEX "CustomerNotification_customerId_status_idx" ON "CustomerNotification"("customerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ReceivingQueueItem_offlineClientId_key" ON "ReceivingQueueItem"("offlineClientId");

-- CreateIndex
CREATE INDEX "ReceivingQueueItem_status_capturedAt_idx" ON "ReceivingQueueItem"("status", "capturedAt");

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_originBranchId_fkey" FOREIGN KEY ("originBranchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_receivedByUserId_fkey" FOREIGN KEY ("receivedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreAlert" ADD CONSTRAINT "PreAlert_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreAlert" ADD CONSTRAINT "PreAlert_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateCard" ADD CONSTRAINT "RateCard_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateCard" ADD CONSTRAINT "RateCard_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CargoTimelineEntry" ADD CONSTRAINT "CargoTimelineEntry_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CargoTimelineEntry" ADD CONSTRAINT "CargoTimelineEntry_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboxDelivery" ADD CONSTRAINT "OutboxDelivery_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "OutboxEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerNotification" ADD CONSTRAINT "CustomerNotification_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceivingQueueItem" ADD CONSTRAINT "ReceivingQueueItem_capturedByUserId_fkey" FOREIGN KEY ("capturedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceivingQueueItem" ADD CONSTRAINT "ReceivingQueueItem_originBranchId_fkey" FOREIGN KEY ("originBranchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceivingQueueItem" ADD CONSTRAINT "ReceivingQueueItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE SET NULL ON UPDATE CASCADE;

