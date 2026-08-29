-- CreateEnum
CREATE TYPE "RoleCode" AS ENUM ('SYSTEM_ADMIN', 'OWNER', 'MASTER', 'BRANCH_ADMIN', 'COUNTER', 'CASHIER', 'WAREHOUSE_ORIGIN', 'WAREHOUSE_DESTINATION', 'ACCOUNTANT');

-- CreateEnum
CREATE TYPE "TransportMode" AS ENUM ('AIR', 'SEA');

-- CreateEnum
CREATE TYPE "CarrierType" AS ENUM ('AIRLINE', 'SHIPPING_LINE', 'CONSOLIDATOR', 'CUSTOMS_BROKER', 'LAST_MILE');

-- CreateEnum
CREATE TYPE "BenefitScope" AS ENUM ('FREIGHT', 'STORAGE', 'HOME_DELIVERY');

-- CreateEnum
CREATE TYPE "ClaimType" AS ENUM ('DAMAGE', 'LOSS', 'BILLING_ERROR', 'DELAY', 'WRONG_DELIVERY');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SETTLED');

-- CreateEnum
CREATE TYPE "TransportServiceStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CashSessionStatus" AS ENUM ('OPEN', 'RECONCILING', 'CLOSED', 'AUTO_CLOSED_PENDING_REVIEW', 'AUTO_CLOSED', 'PERMANENTLY_CLOSED');

-- CreateEnum
CREATE TYPE "OperationalDayLifecycle" AS ENUM ('ACTIVE', 'AWAITING_REVIEW', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OperationalDayReviewStatus" AS ENUM ('PENDING', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "SaleOrderStatus" AS ENUM ('DRAFT', 'PENDING_PAYMENT', 'PAID', 'DISPATCH_PENDING', 'DISPATCHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER', 'CREDIT', 'MIXED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('POSTED', 'VOIDED');

-- CreateEnum
CREATE TYPE "PaymentWorkflowMode" AS ENUM ('QUEUE_ONLY', 'DIRECT_ONLY', 'HYBRID');

-- CreateEnum
CREATE TYPE "DispatchWorkflowMode" AS ENUM ('DISABLED', 'ENABLED');

-- CreateEnum
CREATE TYPE "CashSessionOperatorRole" AS ENUM ('OWNER_OPERATOR', 'CASHIER_OPERATOR', 'SALES_DIRECT_OPERATOR', 'SUPERVISOR_OPERATOR');

-- CreateEnum
CREATE TYPE "CashMovementType" AS ENUM ('CASH_IN', 'CASH_OUT', 'CHANGE_IN', 'BANK_DEPOSIT_OUT', 'EXPENSE_OUT', 'REFUND_OUT', 'CORRECTION', 'CORRECTION_OUT');

-- CreateEnum
CREATE TYPE "DispatchStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DISPATCHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApprovalType" AS ENUM ('CLAIM_SETTLEMENT', 'PACKAGE_MEASURE_CORRECTION', 'PRICE_OVERRIDE', 'CREDIT_EXCEPTION', 'CASH_SESSION_DISCREPANCY', 'OPERATION_OVERRIDE');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXECUTED');

-- CreateEnum
CREATE TYPE "BrainDecisionStatus" AS ENUM ('OPEN', 'APPROVED', 'MANUAL_REVIEW', 'EXECUTING', 'EXECUTED', 'DISMISSED', 'SNOOZED', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "BrainDecisionCategory" AS ENUM ('PRICING', 'PRICING_CUSTOMER', 'CASH', 'SALES', 'DISPATCH', 'LOYALTY', 'CUSTOMS', 'STORAGE', 'SECURITY', 'AUDIT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "BrainDecisionSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "CreditScope" AS ENUM ('BRANCH_LOCAL', 'UNIVERSAL');

-- CreateEnum
CREATE TYPE "CurrencyCode" AS ENUM ('NIO', 'USD');

-- CreateEnum
CREATE TYPE "DocumentMode" AS ENUM ('DELIVERY_ORDER_ONLY', 'MANUAL_INVOICE_REQUIRED', 'MANUAL_INVOICE_REGISTERED');

-- CreateEnum
CREATE TYPE "ManualInvoiceStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'REGISTERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CustomerRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'BLOCKED');

-- CreateEnum
CREATE TYPE "PrinterMode" AS ENUM ('BROWSER_PRINT', 'QZ_TRAY', 'NETWORK_ESCPOS', 'PDF_ONLY');

-- CreateEnum
CREATE TYPE "PaperWidth" AS ENUM ('W58MM', 'W80MM', 'A4');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('DELIVERY_ORDER', 'PURCHASE_TICKET', 'PAYMENT_RECEIPT', 'PRODUCTION_ORDER');

-- CreateEnum
CREATE TYPE "InssRegime" AS ENUM ('INTEGRAL', 'IVM_RP');

-- CreateEnum
CREATE TYPE "BenefitAccrualMode" AS ENUM ('ACCRUE_MONTHLY', 'ON_PAYMENT');

-- CreateEnum
CREATE TYPE "PayrollDisbursementPeriod" AS ENUM ('FIRST_HALF', 'SECOND_HALF');

-- CreateEnum
CREATE TYPE "PayrollDisbursementStatus" AS ENUM ('PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('PAYROLL', 'UTILITIES', 'RENT', 'FOOD', 'MAINTENANCE', 'MARKETING', 'TAXES', 'OTHER', 'FREIGHT_PURCHASE', 'CUSTOMS_FEES', 'WAREHOUSE_ORIGIN', 'LAST_MILE');

-- CreateEnum
CREATE TYPE "ProrationMethod" AS ENUM ('BY_QUANTITY', 'BY_VALUE', 'BY_CHARGEABLE_WEIGHT', 'BY_VOLUME', 'BY_DECLARED_VALUE', 'MANUAL');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "CameraLocation" AS ENUM ('CAJA', 'DESPACHO', 'PATIO', 'PASILLO', 'OTRO');

-- CreateEnum
CREATE TYPE "CameraHealthState" AS ENUM ('OFFLINE', 'NO_STREAM', 'NO_FRAMES', 'FROZEN', 'BLACK', 'BLURRY', 'MOVED', 'DEGRADED', 'OK', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "CameraStatusSource" AS ENUM ('AGENT_REPORT', 'AGENT_UNREACHABLE', 'NVR_UNREACHABLE');

-- CreateEnum
CREATE TYPE "BranchCameraAgentStatus" AS ENUM ('ONLINE', 'STALE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "RetainedCashLocation" AS ENUM ('DRAWER', 'SAFE');

-- CreateEnum
CREATE TYPE "TreasuryAccountType" AS ENUM ('BANK', 'SETTLEMENT', 'CUSTODY', 'SAFE');

-- CreateEnum
CREATE TYPE "TreasuryCardType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "TreasuryEntryDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "TreasuryEntryType" AS ENUM ('SALE_TRANSFER', 'SALE_CARD', 'CARD_SETTLEMENT', 'CARD_FEE', 'DEPOSIT_DISPATCH', 'HANDOVER', 'RETAIN_TO_SAFE', 'DEPOSIT_CONFIRMED', 'SUPPLIER_PAYMENT', 'PAYROLL', 'EXPENSE', 'CUSTOMER_ADVANCE', 'RECONCILIATION');

-- CreateEnum
CREATE TYPE "TreasuryCounterpartyType" AS ENUM ('CUSTOMER', 'SUPPLIER', 'EMPLOYEE', 'ACQUIRER', 'INTERNAL', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefaultSupplier" BOOLEAN NOT NULL DEFAULT false,
    "cashFundAmount" DECIMAL(14,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "globalRole" "RoleCode",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "mfaRecoveryCodes" JSONB,
    "mfaEnabledAt" TIMESTAMP(3),
    "themePreference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPresence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "branchId" TEXT,
    "username" TEXT,
    "roleCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ONLINE',
    "currentPath" TEXT,
    "currentModule" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnectedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPresence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBranchRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "roleCode" "RoleCode" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBranchRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhysicalCashBox" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhysicalCashBox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashSession" (
    "id" TEXT NOT NULL,
    "physicalCashBoxId" TEXT NOT NULL,
    "operationalDayId" TEXT,
    "openedByUserId" TEXT NOT NULL,
    "closedByUserId" TEXT,
    "reviewedByUserId" TEXT,
    "status" "CashSessionStatus" NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "autoClosedAt" TIMESTAMP(3),
    "autoClosedReason" TEXT,
    "autoClosedBySystem" BOOLEAN NOT NULL DEFAULT false,
    "openingAmount" DECIMAL(65,30) NOT NULL,
    "closingAmount" DECIMAL(65,30),
    "expectedCashAmount" DECIMAL(65,30),
    "countedCashAmount" DECIMAL(65,30),
    "differenceAmount" DECIMAL(65,30),
    "requiresReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "notes" TEXT,
    "activeSessionKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashSessionOperator" (
    "id" TEXT NOT NULL,
    "cashSessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operatorRole" "CashSessionOperatorRole" NOT NULL,
    "assignedByUserId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CashSessionOperator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashMovement" (
    "id" TEXT NOT NULL,
    "cashSessionId" TEXT NOT NULL,
    "type" "CashMovementType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalDay" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "businessDate" TIMESTAMP(3) NOT NULL,
    "lifecycle" "OperationalDayLifecycle" NOT NULL DEFAULT 'ACTIVE',
    "reviewStatus" "OperationalDayReviewStatus" NOT NULL DEFAULT 'PENDING',
    "openedByUserId" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sweptAt" TIMESTAMP(3),
    "sweptBySystem" BOOLEAN NOT NULL DEFAULT false,
    "sweptByUserId" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "salesTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paidOrdersTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "pendingPaymentTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "expectedCashTotal" DECIMAL(65,30),
    "countedCashTotal" DECIMAL(65,30),
    "cashDifferenceTotal" DECIMAL(65,30),
    "openCashSessionsCount" INTEGER NOT NULL DEFAULT 0,
    "autoClosedPendingReviewCount" INTEGER NOT NULL DEFAULT 0,
    "pendingDispatchCount" INTEGER NOT NULL DEFAULT 0,
    "criticalBrainDecisionCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "checklistJson" JSONB,
    "summaryJson" JSONB,
    "reviewSummaryJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "taxId" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerBranchScope" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "isAllowed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerBranchScope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerCreditProfile" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "scope" "CreditScope" NOT NULL,
    "branchId" TEXT,
    "creditLimit" DECIMAL(65,30) NOT NULL,
    "creditUsed" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerCreditProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "operationalDayId" TEXT,
    "customerId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "status" "SaleOrderStatus" NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "requiresTransport" BOOLEAN NOT NULL DEFAULT false,
    "transportAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "saleOccurredAt" TIMESTAMP(3),
    "postedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3),
    "offlineClientId" TEXT,
    "documentMode" "DocumentMode" NOT NULL DEFAULT 'DELIVERY_ORDER_ONLY',
    "requiresManualInvoice" BOOLEAN NOT NULL DEFAULT false,
    "deliveryOrderNumber" TEXT,
    "deliveryOrderIssuedAt" TIMESTAMP(3),
    "deliveryOrderPrintedAt" TIMESTAMP(3),
    "manualInvoiceSeries" TEXT,
    "manualInvoiceNumber" TEXT,
    "manualInvoiceDate" TIMESTAMP(3),
    "manualInvoiceCustomerName" TEXT,
    "manualInvoiceCustomerRuc" TEXT,
    "manualInvoiceStatus" "ManualInvoiceStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "manualInvoiceRegisteredById" TEXT,
    "manualInvoiceRegisteredAt" TIMESTAMP(3),
    "manualInvoiceNotes" TEXT,

    CONSTRAINT "SaleOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleOrderLine" (
    "id" TEXT NOT NULL,
    "saleOrderId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "packageId" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "discountAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "lineSubtotal" DECIMAL(65,30) NOT NULL,
    "chargeableLb" DECIMAL(65,30),
    "rateCardTierId" TEXT,
    "freightAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "customsAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "storageAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaleOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "saleOrderId" TEXT NOT NULL,
    "cashSessionId" TEXT NOT NULL,
    "operationalDayId" TEXT,
    "receivedByUserId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'POSTED',
    "amount" DECIMAL(65,30) NOT NULL,
    "currencyCode" "CurrencyCode" NOT NULL DEFAULT 'NIO',
    "referenceNumber" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTender" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "operationalDayId" TEXT,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "receivedAmount" DECIMAL(65,30),
    "changeAmount" DECIMAL(65,30),
    "referenceNumber" TEXT,
    "bankAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentTender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchTicket" (
    "id" TEXT NOT NULL,
    "saleOrderId" TEXT,
    "branchId" TEXT NOT NULL,
    "operationalDayId" TEXT,
    "status" "DispatchStatus" NOT NULL DEFAULT 'PENDING',
    "preparedByUserId" TEXT,
    "dispatchedByUserId" TEXT,
    "dispatchedAt" TIMESTAMP(3),
    "recipientName" TEXT,
    "recipientIdNumber" TEXT,
    "signatureUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatchTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchTicketPackage" (
    "id" TEXT NOT NULL,
    "dispatchTicketId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,

    CONSTRAINT "DispatchTicketPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "type" "ApprovalType" NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'REQUESTED',
    "branchId" TEXT NOT NULL,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "payloadJson" JSONB,
    "requestedByUserId" TEXT NOT NULL,
    "resolvedByUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerCreditScore" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" "CustomerRiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "totalPurchases" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalReturns" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "returnRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "unpaidBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "latePaymentsCount" INTEGER NOT NULL DEFAULT 0,
    "creditNotesIssued" INTEGER NOT NULL DEFAULT 0,
    "manualInvoicesCount" INTEGER NOT NULL DEFAULT 0,
    "lastReviewAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerCreditScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportService" (
    "id" TEXT NOT NULL,
    "saleOrderId" TEXT,
    "customerId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "operationalDayId" TEXT,
    "addressId" TEXT,
    "driverUserId" TEXT,
    "truckId" TEXT,
    "reference" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "scheduledPaymentTime" TIMESTAMP(3),
    "status" "TransportServiceStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "TransportService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "claimNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "packageId" TEXT,
    "saleOrderId" TEXT,
    "branchId" TEXT NOT NULL,
    "type" "ClaimType" NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "claimedAmount" DECIMAL(65,30),
    "approvedAmount" DECIMAL(65,30),
    "settlementPaymentId" TEXT,
    "openedByUserId" TEXT NOT NULL,
    "resolvedByUserId" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimEvidence" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "caption" TEXT,
    "uploadedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerUser" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSession" (
    "id" TEXT NOT NULL,
    "customerUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lane" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mode" "TransportMode" NOT NULL,
    "originBranchId" TEXT,
    "destinationBranchId" TEXT,
    "originPortCode" TEXT,
    "destinationPortCode" TEXT,
    "transitDaysEstimate" INTEGER,
    "defaultAllocationMethod" "ProrationMethod" NOT NULL DEFAULT 'BY_CHARGEABLE_WEIGHT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lane_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Truck" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plate" TEXT,
    "fuelEfficiencyKmPerGallon" DECIMAL(65,30),
    "maintenanceCostPerKm" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Truck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "shipmentNumber" TEXT NOT NULL,
    "laneId" TEXT NOT NULL,
    "carrierId" TEXT,
    "mode" "TransportMode" NOT NULL,
    "masterAwb" TEXT,
    "billOfLading" TEXT,
    "containerNumber" TEXT,
    "etd" TIMESTAMP(3),
    "eta" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "shipmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "freightCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "customsCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "handlingCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "otherCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalShipmentCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "allocationMethod" "ProrationMethod" NOT NULL DEFAULT 'BY_CHARGEABLE_WEIGHT',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentLine" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "packageId" TEXT,
    "chargeableUnit" DECIMAL(65,30) NOT NULL,
    "lineValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "allocatedFreight" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "allocatedFreightPerUnit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "allocatedCustoms" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "allocatedHandling" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShipmentLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "monthlySalary" DECIMAL(65,30) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "applyIrRetention" BOOLEAN NOT NULL DEFAULT false,
    "inssSalary" DECIMAL(65,30),
    "nationalId" TEXT,
    "lastLiquidationAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeSalaryHistory" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "daysWorked" INTEGER NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "proratedSalary" DECIMAL(65,30) NOT NULL,
    "fullSalary" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeSalaryHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeLoan" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "principalAmount" DECIMAL(65,30) NOT NULL,
    "outstandingBalance" DECIMAL(65,30) NOT NULL,
    "installmentAmount" DECIMAL(65,30),
    "installmentFrequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeLoan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeLoanInstallment" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "payrollRunId" TEXT,
    "payrollLineId" TEXT,
    "dueYear" INTEGER NOT NULL,
    "dueMonth" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "deductedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeLoanInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRun" (
    "id" TEXT NOT NULL,
    "branchId" TEXT,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalGross" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalNet" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalEmployerCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "postedAt" TIMESTAMP(3),
    "postedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollLine" (
    "id" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "grossSalary" DECIMAL(65,30) NOT NULL,
    "loanDeductions" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "otherDeductions" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "inssLaboral" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "ir" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "inssPatronal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "inatec" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "provisions" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "aguinaldoAccrual" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "vacacionesAccrual" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "indemnizacionAccrual" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "absenceDays" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "absenceDeduction" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "netPay" DECIMAL(65,30) NOT NULL,
    "employerCost" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRateConfig" (
    "id" TEXT NOT NULL,
    "inssRegime" "InssRegime" NOT NULL DEFAULT 'INTEGRAL',
    "aguinaldoMode" "BenefitAccrualMode" NOT NULL DEFAULT 'ACCRUE_MONTHLY',
    "vacacionesMode" "BenefitAccrualMode" NOT NULL DEFAULT 'ACCRUE_MONTHLY',
    "indemnizacionMode" "BenefitAccrualMode" NOT NULL DEFAULT 'ACCRUE_MONTHLY',
    "salarioMinimoSectorial" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollRateConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VacationEntry" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "days" DECIMAL(65,30) NOT NULL,
    "kind" TEXT NOT NULL,
    "notes" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VacationEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeSettlement" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "causal" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aguinaldoPaid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "vacationDaysPaid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "vacationValuePaid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "indemnizacionPaid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "loanDeduction" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalPaid" DECIMAL(65,30) NOT NULL,
    "notes" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeAbsence" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "kind" TEXT NOT NULL,
    "notes" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeAbsence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRollCall" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "takenByUserId" TEXT,
    "presentCount" INTEGER NOT NULL DEFAULT 0,
    "absentCount" INTEGER NOT NULL DEFAULT 0,
    "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRollCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceMark" (
    "id" TEXT NOT NULL,
    "rollCallId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "arrivalAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceMark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployerContributionPayment" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidByUserId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployerContributionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollDisbursement" (
    "id" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "payrollLineId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "period" "PayrollDisbursementPeriod" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "PayrollDisbursementStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "paidByUserId" TEXT,
    "cashMovementId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollDisbursement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatingExpense" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "employeeId" TEXT,
    "isAutoCalculated" BOOLEAN NOT NULL DEFAULT false,
    "cashMovementId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatingExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Carrier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "commercialName" TEXT,
    "ruc" TEXT,
    "phone" TEXT,
    "phone2" TEXT,
    "email" TEXT,
    "address" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "accountHolder" TEXT,
    "paymentTerms" TEXT,
    "creditLimit" DECIMAL(65,30),
    "notes" TEXT,
    "category" TEXT,
    "defaultCurrency" TEXT,
    "leadTimeDays" INTEGER,
    "preferredPaymentMethod" TEXT,
    "carrierCode" TEXT,
    "carrierType" "CarrierType",
    "scacCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Carrier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "DiscountType" NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "benefitScope" "BenefitScope" NOT NULL DEFAULT 'FREIGHT',
    "targetTiers" TEXT,
    "targetSegments" TEXT,
    "targetMode" "TransportMode",
    "minPackages90d" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "branchId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchRoleConfig" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "role" "RoleCode" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedByUserId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchRoleConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedByUserId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" TEXT,
    "branchId" TEXT,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadataJson" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrainDecision" (
    "id" TEXT NOT NULL,
    "category" "BrainDecisionCategory" NOT NULL,
    "severity" "BrainDecisionSeverity" NOT NULL,
    "status" "BrainDecisionStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "branchId" TEXT,
    "customerId" TEXT,
    "userId" TEXT,
    "targetUserId" TEXT,
    "executedEntityType" TEXT,
    "executedEntityId" TEXT,
    "actionResultJson" JSONB,
    "confidenceScore" DECIMAL(65,30),
    "impactAmount" DECIMAL(65,30),
    "riskScore" DECIMAL(65,30),
    "priorityScore" DECIMAL(65,30),
    "proposedActionType" TEXT,
    "proposedActionJson" JSONB,
    "evidenceJson" JSONB,
    "sourceJson" JSONB,
    "fingerprint" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "firstDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUserId" TEXT,

    CONSTRAINT "BrainDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrainDecisionActionLog" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrainDecisionActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrainDecisionOutcome" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcomeType" TEXT NOT NULL,
    "expectedImpact" DECIMAL(65,30),
    "actualImpact" DECIMAL(65,30),
    "successScore" DECIMAL(65,30),
    "notes" TEXT,
    "metadataJson" JSONB,

    CONSTRAINT "BrainDecisionOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashClosure" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "closureDate" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closureType" TEXT NOT NULL,
    "totalSales" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "transactionCount" INTEGER NOT NULL DEFAULT 0,
    "cashTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cardTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "transferTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "creditTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "mixedTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "productsSold" INTEGER NOT NULL DEFAULT 0,
    "reportJson" JSONB,
    "isReopened" BOOLEAN NOT NULL DEFAULT false,
    "reopenedAt" TIMESTAMP(3),
    "reopenedByUserId" TEXT,
    "reopenCount" INTEGER NOT NULL DEFAULT 0,
    "emergencySalesCount" INTEGER NOT NULL DEFAULT 0,
    "maxEmergencySales" INTEGER NOT NULL DEFAULT 3,
    "isPermanentlyClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashClosure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashClosureLog" (
    "id" TEXT NOT NULL,
    "cashClosureId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedByUserId" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashClosureLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevokedSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "RevokedSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CsrfToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CsrfToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchModuleConfig" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "enableCashier" BOOLEAN NOT NULL DEFAULT true,
    "enableDispatch" BOOLEAN NOT NULL DEFAULT true,
    "paymentWorkflowMode" "PaymentWorkflowMode" NOT NULL DEFAULT 'HYBRID',
    "dispatchWorkflowMode" "DispatchWorkflowMode" NOT NULL DEFAULT 'ENABLED',
    "requireOpenCashSessionForDirectSale" BOOLEAN NOT NULL DEFAULT true,
    "allowSellerDirectPayment" BOOLEAN NOT NULL DEFAULT true,
    "allowCashierQueue" BOOLEAN NOT NULL DEFAULT true,
    "enableOriginWarehouse" BOOLEAN NOT NULL DEFAULT false,
    "enableCustoms" BOOLEAN NOT NULL DEFAULT false,
    "enableHomeDelivery" BOOLEAN NOT NULL DEFAULT true,
    "enableStorageFees" BOOLEAN NOT NULL DEFAULT true,
    "enableCustomerPortal" BOOLEAN NOT NULL DEFAULT false,
    "updatedByUserId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BranchModuleConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "grantedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintSettings" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "cashRegisterId" TEXT,
    "name" TEXT NOT NULL DEFAULT 'Configuracion principal',
    "printerName" TEXT,
    "printerMode" "PrinterMode" NOT NULL DEFAULT 'BROWSER_PRINT',
    "paperWidth" "PaperWidth" NOT NULL DEFAULT 'W80MM',
    "fontSize" INTEGER NOT NULL DEFAULT 12,
    "logoUrl" TEXT,
    "footerText" TEXT,
    "autoPrint" BOOLEAN NOT NULL DEFAULT false,
    "autoPrintDelivery" BOOLEAN NOT NULL DEFAULT false,
    "copies" INTEGER NOT NULL DEFAULT 1,
    "copiesDeliveryOrder" INTEGER NOT NULL DEFAULT 1,
    "cutPaper" BOOLEAN NOT NULL DEFAULT true,
    "openDrawer" BOOLEAN NOT NULL DEFAULT false,
    "showQr" BOOLEAN NOT NULL DEFAULT false,
    "businessName" TEXT,
    "businessLegalName" TEXT,
    "taxId" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "showPricesOnDeliveryOrder" BOOLEAN NOT NULL DEFAULT false,
    "showCostData" BOOLEAN NOT NULL DEFAULT false,
    "showCashierName" BOOLEAN NOT NULL DEFAULT true,
    "showCustomerData" BOOLEAN NOT NULL DEFAULT true,
    "ticketTemplate" TEXT,
    "deliveryTemplate" TEXT,
    "receiptTemplate" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrintSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "description" TEXT,
    "templateContent" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentPrintLog" (
    "id" TEXT NOT NULL,
    "saleOrderId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "printedById" TEXT NOT NULL,
    "printedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isReprint" BOOLEAN NOT NULL DEFAULT false,
    "reprintReason" TEXT,

    CONSTRAINT "DocumentPrintLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfaPendingToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MfaPendingToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityAlert" (
    "id" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actorUserId" TEXT,
    "branchId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadataJson" JSONB,
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "note" TEXT,

    CONSTRAINT "SecurityAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Camera" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" "CameraLocation" NOT NULL DEFAULT 'OTRO',
    "networkSegment" TEXT,
    "ipAddress" TEXT NOT NULL,
    "onvifPort" INTEGER NOT NULL DEFAULT 80,
    "rtspChannel" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "credentialsCiphertext" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Camera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchCameraAgent" (
    "branchId" TEXT NOT NULL,
    "agentVersion" TEXT NOT NULL,
    "targetAgentVersion" TEXT NOT NULL DEFAULT '0.1.0',
    "lastHeartbeatAt" TIMESTAMP(3),
    "nvrReachable" BOOLEAN NOT NULL DEFAULT false,
    "lastNvrCheckAt" TIMESTAMP(3),
    "status" "BranchCameraAgentStatus" NOT NULL DEFAULT 'OFFLINE',
    "agentTokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchCameraAgent_pkey" PRIMARY KEY ("branchId")
);

-- CreateTable
CREATE TABLE "CameraStatusHistory" (
    "id" TEXT NOT NULL,
    "cameraId" TEXT NOT NULL,
    "status" "CameraHealthState" NOT NULL,
    "source" "CameraStatusSource" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "CameraStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CameraHealthSnapshot" (
    "branchId" TEXT NOT NULL,
    "failingCount" INTEGER NOT NULL DEFAULT 0,
    "unknownCount" INTEGER NOT NULL DEFAULT 0,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CameraHealthSnapshot_pkey" PRIMARY KEY ("branchId")
);

-- CreateTable
CREATE TABLE "TreasuryAccount" (
    "id" TEXT NOT NULL,
    "type" "TreasuryAccountType" NOT NULL DEFAULT 'BANK',
    "code" TEXT,
    "bankName" TEXT NOT NULL,
    "accountAlias" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "currencyCode" "CurrencyCode" NOT NULL DEFAULT 'NIO',
    "branchId" TEXT,
    "holderUserId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "owner" TEXT,
    "acceptsCustomerPayments" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "openingBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "openingBalanceAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreasuryAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreasuryCard" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "brand" TEXT,
    "last4" TEXT,
    "cardType" "TreasuryCardType" NOT NULL DEFAULT 'DEBIT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreasuryCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankDeposit" (
    "id" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "depositedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedByUserId" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankDeposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashDepositPostponement" (
    "id" TEXT NOT NULL,
    "cashSessionId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "reason" TEXT,
    "postponedUntil" TIMESTAMP(3) NOT NULL,
    "declaredByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashDepositPostponement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashDestinationDeclaration" (
    "id" TEXT NOT NULL,
    "cashSessionId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "declaredByUserId" TEXT NOT NULL,
    "handOverAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "handOverUserId" TEXT,
    "depositAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "depositCarrierUserId" TEXT,
    "depositBankAccountId" TEXT,
    "retainAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "retainCashFundPortion" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "retainAwaitingDepositPortion" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "awaitingDepositLocation" "RetainedCashLocation" NOT NULL DEFAULT 'DRAWER',
    "isAutoDefaulted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashDestinationDeclaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreasuryEntry" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "direction" "TreasuryEntryDirection" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currencyCode" "CurrencyCode" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transferId" TEXT,
    "entryType" "TreasuryEntryType" NOT NULL,
    "counterpartyType" "TreasuryCounterpartyType" NOT NULL,
    "counterpartyName" TEXT,
    "cashMovementId" TEXT,
    "paymentTenderId" TEXT,
    "bankDepositId" TEXT,
    "expensePaymentId" TEXT,
    "cardId" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "intendedBankAccountId" TEXT,
    "intendedRecipientUserId" TEXT,

    CONSTRAINT "TreasuryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "fromCurrency" "CurrencyCode" NOT NULL,
    "toCurrency" "CurrencyCode" NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchDepositPolicy" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "thresholdAmount" DECIMAL(65,30) NOT NULL,
    "maxDaysHolding" INTEGER NOT NULL,
    "maxCashExpenseAmount" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchDepositPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Branch_code_key" ON "Branch"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_globalRole_isActive_idx" ON "User"("globalRole", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "UserPresence_userId_key" ON "UserPresence"("userId");

-- CreateIndex
CREATE INDEX "UserPresence_branchId_idx" ON "UserPresence"("branchId");

-- CreateIndex
CREATE INDEX "UserPresence_status_idx" ON "UserPresence"("status");

-- CreateIndex
CREATE INDEX "UserPresence_lastSeenAt_idx" ON "UserPresence"("lastSeenAt");

-- CreateIndex
CREATE INDEX "UserBranchRole_userId_isActive_idx" ON "UserBranchRole"("userId", "isActive");

-- CreateIndex
CREATE INDEX "UserBranchRole_branchId_roleCode_isActive_idx" ON "UserBranchRole"("branchId", "roleCode", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "UserBranchRole_userId_branchId_roleCode_key" ON "UserBranchRole"("userId", "branchId", "roleCode");

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalCashBox_branchId_code_key" ON "PhysicalCashBox"("branchId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "CashSession_activeSessionKey_key" ON "CashSession"("activeSessionKey");

-- CreateIndex
CREATE INDEX "CashSession_physicalCashBoxId_status_idx" ON "CashSession"("physicalCashBoxId", "status");

-- CreateIndex
CREATE INDEX "CashSession_operationalDayId_idx" ON "CashSession"("operationalDayId");

-- CreateIndex
CREATE INDEX "CashSession_status_requiresReview_idx" ON "CashSession"("status", "requiresReview");

-- CreateIndex
CREATE INDEX "CashSessionOperator_cashSessionId_isActive_idx" ON "CashSessionOperator"("cashSessionId", "isActive");

-- CreateIndex
CREATE INDEX "CashSessionOperator_userId_isActive_idx" ON "CashSessionOperator"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CashSessionOperator_cashSessionId_userId_key" ON "CashSessionOperator"("cashSessionId", "userId");

-- CreateIndex
CREATE INDEX "CashMovement_cashSessionId_createdAt_idx" ON "CashMovement"("cashSessionId", "createdAt");

-- CreateIndex
CREATE INDEX "CashMovement_type_idx" ON "CashMovement"("type");

-- CreateIndex
CREATE INDEX "OperationalDay_branchId_lifecycle_idx" ON "OperationalDay"("branchId", "lifecycle");

-- CreateIndex
CREATE INDEX "OperationalDay_reviewStatus_businessDate_idx" ON "OperationalDay"("reviewStatus", "businessDate");

-- CreateIndex
CREATE INDEX "OperationalDay_businessDate_idx" ON "OperationalDay"("businessDate");

-- CreateIndex
CREATE UNIQUE INDEX "OperationalDay_branchId_businessDate_key" ON "OperationalDay"("branchId", "businessDate");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_code_key" ON "Customer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerBranchScope_customerId_branchId_key" ON "CustomerBranchScope"("customerId", "branchId");

-- CreateIndex
CREATE INDEX "CustomerCreditProfile_customerId_scope_idx" ON "CustomerCreditProfile"("customerId", "scope");

-- CreateIndex
CREATE INDEX "CustomerCreditProfile_branchId_isActive_idx" ON "CustomerCreditProfile"("branchId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SaleOrder_orderNumber_key" ON "SaleOrder"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SaleOrder_offlineClientId_key" ON "SaleOrder"("offlineClientId");

-- CreateIndex
CREATE UNIQUE INDEX "SaleOrder_deliveryOrderNumber_key" ON "SaleOrder"("deliveryOrderNumber");

-- CreateIndex
CREATE INDEX "SaleOrder_branchId_status_idx" ON "SaleOrder"("branchId", "status");

-- CreateIndex
CREATE INDEX "SaleOrder_branchId_createdByUserId_status_idx" ON "SaleOrder"("branchId", "createdByUserId", "status");

-- CreateIndex
CREATE INDEX "SaleOrder_customerId_createdAt_idx" ON "SaleOrder"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "SaleOrder_deliveryOrderNumber_idx" ON "SaleOrder"("deliveryOrderNumber");

-- CreateIndex
CREATE INDEX "SaleOrder_manualInvoiceSeries_manualInvoiceNumber_idx" ON "SaleOrder"("manualInvoiceSeries", "manualInvoiceNumber");

-- CreateIndex
CREATE INDEX "SaleOrder_operationalDayId_idx" ON "SaleOrder"("operationalDayId");

-- CreateIndex
CREATE INDEX "SaleOrder_branchId_operationalDayId_status_idx" ON "SaleOrder"("branchId", "operationalDayId", "status");

-- CreateIndex
CREATE INDEX "SaleOrder_branchId_createdAt_idx" ON "SaleOrder"("branchId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SaleOrder_branchId_manualInvoiceSeries_manualInvoiceNumber_key" ON "SaleOrder"("branchId", "manualInvoiceSeries", "manualInvoiceNumber");

-- CreateIndex
CREATE INDEX "SaleOrderLine_saleOrderId_idx" ON "SaleOrderLine"("saleOrderId");

-- CreateIndex
CREATE INDEX "SaleOrderLine_packageId_idx" ON "SaleOrderLine"("packageId");

-- CreateIndex
CREATE INDEX "Payment_cashSessionId_paidAt_idx" ON "Payment"("cashSessionId", "paidAt");

-- CreateIndex
CREATE INDEX "Payment_operationalDayId_idx" ON "Payment"("operationalDayId");

-- CreateIndex
CREATE INDEX "Payment_cashSessionId_operationalDayId_idx" ON "Payment"("cashSessionId", "operationalDayId");

-- CreateIndex
CREATE INDEX "Payment_status_paidAt_idx" ON "Payment"("status", "paidAt");

-- CreateIndex
CREATE INDEX "PaymentTender_paymentId_idx" ON "PaymentTender"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentTender_method_idx" ON "PaymentTender"("method");

-- CreateIndex
CREATE INDEX "PaymentTender_operationalDayId_method_idx" ON "PaymentTender"("operationalDayId", "method");

-- CreateIndex
CREATE INDEX "PaymentTender_bankAccountId_idx" ON "PaymentTender"("bankAccountId");

-- CreateIndex
CREATE INDEX "DispatchTicket_branchId_status_idx" ON "DispatchTicket"("branchId", "status");

-- CreateIndex
CREATE INDEX "DispatchTicket_operationalDayId_idx" ON "DispatchTicket"("operationalDayId");

-- CreateIndex
CREATE INDEX "DispatchTicketPackage_packageId_idx" ON "DispatchTicketPackage"("packageId");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchTicketPackage_dispatchTicketId_packageId_key" ON "DispatchTicketPackage"("dispatchTicketId", "packageId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_branchId_status_type_idx" ON "ApprovalRequest"("branchId", "status", "type");

-- CreateIndex
CREATE INDEX "ApprovalRequest_referenceType_referenceId_idx" ON "ApprovalRequest"("referenceType", "referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerCreditScore_customerId_key" ON "CustomerCreditScore"("customerId");

-- CreateIndex
CREATE INDEX "CustomerCreditScore_riskLevel_idx" ON "CustomerCreditScore"("riskLevel");

-- CreateIndex
CREATE INDEX "CustomerCreditScore_updatedAt_idx" ON "CustomerCreditScore"("updatedAt");

-- CreateIndex
CREATE INDEX "TransportService_branchId_status_idx" ON "TransportService"("branchId", "status");

-- CreateIndex
CREATE INDEX "TransportService_saleOrderId_idx" ON "TransportService"("saleOrderId");

-- CreateIndex
CREATE INDEX "TransportService_customerId_idx" ON "TransportService"("customerId");

-- CreateIndex
CREATE INDEX "TransportService_operationalDayId_idx" ON "TransportService"("operationalDayId");

-- CreateIndex
CREATE UNIQUE INDEX "Claim_claimNumber_key" ON "Claim"("claimNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Claim_settlementPaymentId_key" ON "Claim"("settlementPaymentId");

-- CreateIndex
CREATE INDEX "Claim_customerId_status_idx" ON "Claim"("customerId", "status");

-- CreateIndex
CREATE INDEX "Claim_branchId_status_idx" ON "Claim"("branchId", "status");

-- CreateIndex
CREATE INDEX "Claim_packageId_idx" ON "Claim"("packageId");

-- CreateIndex
CREATE INDEX "ClaimEvidence_claimId_idx" ON "ClaimEvidence"("claimId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerUser_customerId_key" ON "CustomerUser"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerUser_email_key" ON "CustomerUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSession_tokenHash_key" ON "CustomerSession"("tokenHash");

-- CreateIndex
CREATE INDEX "CustomerSession_customerUserId_idx" ON "CustomerSession"("customerUserId");

-- CreateIndex
CREATE INDEX "CustomerSession_expiresAt_idx" ON "CustomerSession"("expiresAt");

-- CreateIndex
CREATE INDEX "Lane_mode_isActive_idx" ON "Lane"("mode", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_shipmentNumber_key" ON "Shipment"("shipmentNumber");

-- CreateIndex
CREATE INDEX "Shipment_laneId_status_idx" ON "Shipment"("laneId", "status");

-- CreateIndex
CREATE INDEX "Shipment_carrierId_idx" ON "Shipment"("carrierId");

-- CreateIndex
CREATE INDEX "ShipmentLine_shipmentId_idx" ON "ShipmentLine"("shipmentId");

-- CreateIndex
CREATE INDEX "ShipmentLine_packageId_idx" ON "ShipmentLine"("packageId");

-- CreateIndex
CREATE INDEX "Employee_branchId_idx" ON "Employee"("branchId");

-- CreateIndex
CREATE INDEX "Employee_isActive_idx" ON "Employee"("isActive");

-- CreateIndex
CREATE INDEX "EmployeeSalaryHistory_month_idx" ON "EmployeeSalaryHistory"("month");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeSalaryHistory_employeeId_month_key" ON "EmployeeSalaryHistory"("employeeId", "month");

-- CreateIndex
CREATE INDEX "EmployeeLoan_employeeId_status_idx" ON "EmployeeLoan"("employeeId", "status");

-- CreateIndex
CREATE INDEX "EmployeeLoan_branchId_status_idx" ON "EmployeeLoan"("branchId", "status");

-- CreateIndex
CREATE INDEX "EmployeeLoan_issuedAt_idx" ON "EmployeeLoan"("issuedAt");

-- CreateIndex
CREATE INDEX "EmployeeLoanInstallment_loanId_status_idx" ON "EmployeeLoanInstallment"("loanId", "status");

-- CreateIndex
CREATE INDEX "EmployeeLoanInstallment_dueYear_dueMonth_status_idx" ON "EmployeeLoanInstallment"("dueYear", "dueMonth", "status");

-- CreateIndex
CREATE INDEX "EmployeeLoanInstallment_payrollRunId_idx" ON "EmployeeLoanInstallment"("payrollRunId");

-- CreateIndex
CREATE INDEX "EmployeeLoanInstallment_payrollLineId_idx" ON "EmployeeLoanInstallment"("payrollLineId");

-- CreateIndex
CREATE INDEX "PayrollRun_year_month_status_idx" ON "PayrollRun"("year", "month", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollRun_branchId_year_month_key" ON "PayrollRun"("branchId", "year", "month");

-- CreateIndex
CREATE INDEX "PayrollLine_employeeId_idx" ON "PayrollLine"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollLine_payrollRunId_employeeId_key" ON "PayrollLine"("payrollRunId", "employeeId");

-- CreateIndex
CREATE INDEX "VacationEntry_employeeId_date_idx" ON "VacationEntry"("employeeId", "date");

-- CreateIndex
CREATE INDEX "EmployeeSettlement_employeeId_date_idx" ON "EmployeeSettlement"("employeeId", "date");

-- CreateIndex
CREATE INDEX "EmployeeAbsence_employeeId_date_idx" ON "EmployeeAbsence"("employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeAbsence_employeeId_date_key" ON "EmployeeAbsence"("employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRollCall_branchId_date_key" ON "AttendanceRollCall"("branchId", "date");

-- CreateIndex
CREATE INDEX "AttendanceMark_employeeId_idx" ON "AttendanceMark"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceMark_rollCallId_employeeId_key" ON "AttendanceMark"("rollCallId", "employeeId");

-- CreateIndex
CREATE INDEX "EmployerContributionPayment_year_month_idx" ON "EmployerContributionPayment"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "EmployerContributionPayment_year_month_kind_key" ON "EmployerContributionPayment"("year", "month", "kind");

-- CreateIndex
CREATE INDEX "PayrollDisbursement_branchId_status_scheduledDate_idx" ON "PayrollDisbursement"("branchId", "status", "scheduledDate");

-- CreateIndex
CREATE INDEX "PayrollDisbursement_payrollRunId_idx" ON "PayrollDisbursement"("payrollRunId");

-- CreateIndex
CREATE INDEX "PayrollDisbursement_cashMovementId_idx" ON "PayrollDisbursement"("cashMovementId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollDisbursement_payrollLineId_period_key" ON "PayrollDisbursement"("payrollLineId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "OperatingExpense_cashMovementId_key" ON "OperatingExpense"("cashMovementId");

-- CreateIndex
CREATE INDEX "OperatingExpense_branchId_isActive_idx" ON "OperatingExpense"("branchId", "isActive");

-- CreateIndex
CREATE INDEX "OperatingExpense_category_idx" ON "OperatingExpense"("category");

-- CreateIndex
CREATE INDEX "OperatingExpense_cashMovementId_idx" ON "OperatingExpense"("cashMovementId");

-- CreateIndex
CREATE UNIQUE INDEX "Carrier_ruc_key" ON "Carrier"("ruc");

-- CreateIndex
CREATE UNIQUE INDEX "Carrier_carrierCode_key" ON "Carrier"("carrierCode");

-- CreateIndex
CREATE INDEX "Carrier_name_idx" ON "Carrier"("name");

-- CreateIndex
CREATE INDEX "Carrier_isActive_idx" ON "Carrier"("isActive");

-- CreateIndex
CREATE INDEX "Discount_active_startDate_endDate_idx" ON "Discount"("active", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "Discount_branchId_idx" ON "Discount"("branchId");

-- CreateIndex
CREATE INDEX "BranchRoleConfig_branchId_idx" ON "BranchRoleConfig"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "BranchRoleConfig_branchId_role_key" ON "BranchRoleConfig"("branchId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "AuditLog_occurredAt_idx" ON "AuditLog"("occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_module_action_idx" ON "AuditLog"("module", "action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_occurredAt_idx" ON "AuditLog"("entityId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "BrainDecision_fingerprint_key" ON "BrainDecision"("fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "BrainDecision_idempotencyKey_key" ON "BrainDecision"("idempotencyKey");

-- CreateIndex
CREATE INDEX "BrainDecision_status_severity_category_idx" ON "BrainDecision"("status", "severity", "category");

-- CreateIndex
CREATE INDEX "BrainDecision_branchId_idx" ON "BrainDecision"("branchId");

-- CreateIndex
CREATE INDEX "BrainDecision_customerId_idx" ON "BrainDecision"("customerId");

-- CreateIndex
CREATE INDEX "BrainDecision_targetUserId_idx" ON "BrainDecision"("targetUserId");

-- CreateIndex
CREATE INDEX "BrainDecision_fingerprint_idx" ON "BrainDecision"("fingerprint");

-- CreateIndex
CREATE INDEX "BrainDecision_idempotencyKey_idx" ON "BrainDecision"("idempotencyKey");

-- CreateIndex
CREATE INDEX "BrainDecision_createdAt_idx" ON "BrainDecision"("createdAt");

-- CreateIndex
CREATE INDEX "BrainDecision_priorityScore_idx" ON "BrainDecision"("priorityScore");

-- CreateIndex
CREATE INDEX "BrainDecisionActionLog_decisionId_idx" ON "BrainDecisionActionLog"("decisionId");

-- CreateIndex
CREATE INDEX "BrainDecisionActionLog_actorUserId_idx" ON "BrainDecisionActionLog"("actorUserId");

-- CreateIndex
CREATE INDEX "BrainDecisionOutcome_decisionId_idx" ON "BrainDecisionOutcome"("decisionId");

-- CreateIndex
CREATE INDEX "BrainDecisionOutcome_outcomeType_idx" ON "BrainDecisionOutcome"("outcomeType");

-- CreateIndex
CREATE INDEX "BrainDecisionOutcome_measuredAt_idx" ON "BrainDecisionOutcome"("measuredAt");

-- CreateIndex
CREATE INDEX "CashClosure_branchId_closureDate_idx" ON "CashClosure"("branchId", "closureDate");

-- CreateIndex
CREATE INDEX "CashClosure_closureType_idx" ON "CashClosure"("closureType");

-- CreateIndex
CREATE UNIQUE INDEX "CashClosure_branchId_closureDate_key" ON "CashClosure"("branchId", "closureDate");

-- CreateIndex
CREATE INDEX "CashClosureLog_cashClosureId_createdAt_idx" ON "CashClosureLog"("cashClosureId", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_identifier_attemptedAt_idx" ON "LoginAttempt"("identifier", "attemptedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RevokedSession_tokenHash_key" ON "RevokedSession"("tokenHash");

-- CreateIndex
CREATE INDEX "RevokedSession_tokenHash_idx" ON "RevokedSession"("tokenHash");

-- CreateIndex
CREATE INDEX "RevokedSession_expiresAt_idx" ON "RevokedSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "CsrfToken_token_key" ON "CsrfToken"("token");

-- CreateIndex
CREATE INDEX "CsrfToken_token_idx" ON "CsrfToken"("token");

-- CreateIndex
CREATE INDEX "CsrfToken_expiresAt_idx" ON "CsrfToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "BranchModuleConfig_branchId_key" ON "BranchModuleConfig"("branchId");

-- CreateIndex
CREATE INDEX "UserPermission_userId_idx" ON "UserPermission"("userId");

-- CreateIndex
CREATE INDEX "UserPermission_permission_idx" ON "UserPermission"("permission");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_permission_key" ON "UserPermission"("userId", "permission");

-- CreateIndex
CREATE UNIQUE INDEX "PrintSettings_branchId_key" ON "PrintSettings"("branchId");

-- CreateIndex
CREATE INDEX "PrintSettings_branchId_isActive_idx" ON "PrintSettings"("branchId", "isActive");

-- CreateIndex
CREATE INDEX "DocumentTemplate_documentType_isActive_idx" ON "DocumentTemplate"("documentType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTemplate_name_key" ON "DocumentTemplate"("name");

-- CreateIndex
CREATE INDEX "DocumentPrintLog_saleOrderId_idx" ON "DocumentPrintLog"("saleOrderId");

-- CreateIndex
CREATE INDEX "DocumentPrintLog_printedById_printedAt_idx" ON "DocumentPrintLog"("printedById", "printedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MfaPendingToken_token_key" ON "MfaPendingToken"("token");

-- CreateIndex
CREATE INDEX "MfaPendingToken_token_idx" ON "MfaPendingToken"("token");

-- CreateIndex
CREATE INDEX "MfaPendingToken_expiresAt_idx" ON "MfaPendingToken"("expiresAt");

-- CreateIndex
CREATE INDEX "SecurityAlert_severity_status_idx" ON "SecurityAlert"("severity", "status");

-- CreateIndex
CREATE INDEX "SecurityAlert_createdAt_idx" ON "SecurityAlert"("createdAt");

-- CreateIndex
CREATE INDEX "SecurityAlert_type_idx" ON "SecurityAlert"("type");

-- CreateIndex
CREATE INDEX "SecurityAlert_actorUserId_idx" ON "SecurityAlert"("actorUserId");

-- CreateIndex
CREATE INDEX "Camera_branchId_isActive_idx" ON "Camera"("branchId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Camera_branchId_ipAddress_rtspChannel_key" ON "Camera"("branchId", "ipAddress", "rtspChannel");

-- CreateIndex
CREATE INDEX "CameraStatusHistory_cameraId_changedAt_idx" ON "CameraStatusHistory"("cameraId", "changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TreasuryAccount_code_key" ON "TreasuryAccount"("code");

-- CreateIndex
CREATE INDEX "TreasuryAccount_branchId_isActive_idx" ON "TreasuryAccount"("branchId", "isActive");

-- CreateIndex
CREATE INDEX "TreasuryAccount_type_isActive_idx" ON "TreasuryAccount"("type", "isActive");

-- CreateIndex
CREATE INDEX "TreasuryAccount_holderUserId_idx" ON "TreasuryAccount"("holderUserId");

-- CreateIndex
CREATE INDEX "TreasuryCard_accountId_isActive_idx" ON "TreasuryCard"("accountId", "isActive");

-- CreateIndex
CREATE INDEX "BankDeposit_branchId_depositedAt_idx" ON "BankDeposit"("branchId", "depositedAt");

-- CreateIndex
CREATE INDEX "BankDeposit_bankAccountId_depositedAt_idx" ON "BankDeposit"("bankAccountId", "depositedAt");

-- CreateIndex
CREATE INDEX "CashDepositPostponement_branchId_createdAt_idx" ON "CashDepositPostponement"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "CashDepositPostponement_cashSessionId_idx" ON "CashDepositPostponement"("cashSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "CashDestinationDeclaration_cashSessionId_key" ON "CashDestinationDeclaration"("cashSessionId");

-- CreateIndex
CREATE INDEX "CashDestinationDeclaration_branchId_createdAt_idx" ON "CashDestinationDeclaration"("branchId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TreasuryEntry_cashMovementId_key" ON "TreasuryEntry"("cashMovementId");

-- CreateIndex
CREATE UNIQUE INDEX "TreasuryEntry_paymentTenderId_key" ON "TreasuryEntry"("paymentTenderId");

-- CreateIndex
CREATE UNIQUE INDEX "TreasuryEntry_expensePaymentId_key" ON "TreasuryEntry"("expensePaymentId");

-- CreateIndex
CREATE INDEX "TreasuryEntry_accountId_occurredAt_createdAt_idx" ON "TreasuryEntry"("accountId", "occurredAt", "createdAt");

-- CreateIndex
CREATE INDEX "TreasuryEntry_transferId_idx" ON "TreasuryEntry"("transferId");

-- CreateIndex
CREATE INDEX "TreasuryEntry_entryType_occurredAt_idx" ON "TreasuryEntry"("entryType", "occurredAt");

-- CreateIndex
CREATE INDEX "TreasuryEntry_cardId_idx" ON "TreasuryEntry"("cardId");

-- CreateIndex
CREATE INDEX "TreasuryEntry_intendedBankAccountId_idx" ON "TreasuryEntry"("intendedBankAccountId");

-- CreateIndex
CREATE INDEX "TreasuryEntry_intendedRecipientUserId_idx" ON "TreasuryEntry"("intendedRecipientUserId");

-- CreateIndex
CREATE INDEX "ExchangeRate_fromCurrency_toCurrency_effectiveAt_idx" ON "ExchangeRate"("fromCurrency", "toCurrency", "effectiveAt");

-- CreateIndex
CREATE UNIQUE INDEX "BranchDepositPolicy_branchId_key" ON "BranchDepositPolicy"("branchId");

-- AddForeignKey
ALTER TABLE "UserPresence" ADD CONSTRAINT "UserPresence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPresence" ADD CONSTRAINT "UserPresence_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBranchRole" ADD CONSTRAINT "UserBranchRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBranchRole" ADD CONSTRAINT "UserBranchRole_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalCashBox" ADD CONSTRAINT "PhysicalCashBox_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashSession" ADD CONSTRAINT "CashSession_physicalCashBoxId_fkey" FOREIGN KEY ("physicalCashBoxId") REFERENCES "PhysicalCashBox"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashSession" ADD CONSTRAINT "CashSession_operationalDayId_fkey" FOREIGN KEY ("operationalDayId") REFERENCES "OperationalDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashSession" ADD CONSTRAINT "CashSession_openedByUserId_fkey" FOREIGN KEY ("openedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashSession" ADD CONSTRAINT "CashSession_closedByUserId_fkey" FOREIGN KEY ("closedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashSession" ADD CONSTRAINT "CashSession_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashSessionOperator" ADD CONSTRAINT "CashSessionOperator_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "CashSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashSessionOperator" ADD CONSTRAINT "CashSessionOperator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashSessionOperator" ADD CONSTRAINT "CashSessionOperator_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "CashSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalDay" ADD CONSTRAINT "OperationalDay_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalDay" ADD CONSTRAINT "OperationalDay_openedByUserId_fkey" FOREIGN KEY ("openedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalDay" ADD CONSTRAINT "OperationalDay_sweptByUserId_fkey" FOREIGN KEY ("sweptByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalDay" ADD CONSTRAINT "OperationalDay_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerBranchScope" ADD CONSTRAINT "CustomerBranchScope_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerBranchScope" ADD CONSTRAINT "CustomerBranchScope_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerCreditProfile" ADD CONSTRAINT "CustomerCreditProfile_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerCreditProfile" ADD CONSTRAINT "CustomerCreditProfile_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrder" ADD CONSTRAINT "SaleOrder_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrder" ADD CONSTRAINT "SaleOrder_operationalDayId_fkey" FOREIGN KEY ("operationalDayId") REFERENCES "OperationalDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrder" ADD CONSTRAINT "SaleOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrder" ADD CONSTRAINT "SaleOrder_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrder" ADD CONSTRAINT "SaleOrder_manualInvoiceRegisteredById_fkey" FOREIGN KEY ("manualInvoiceRegisteredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOrderLine" ADD CONSTRAINT "SaleOrderLine_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "SaleOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "SaleOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "CashSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_operationalDayId_fkey" FOREIGN KEY ("operationalDayId") REFERENCES "OperationalDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_receivedByUserId_fkey" FOREIGN KEY ("receivedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTender" ADD CONSTRAINT "PaymentTender_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTender" ADD CONSTRAINT "PaymentTender_operationalDayId_fkey" FOREIGN KEY ("operationalDayId") REFERENCES "OperationalDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTender" ADD CONSTRAINT "PaymentTender_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "TreasuryAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchTicket" ADD CONSTRAINT "DispatchTicket_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "SaleOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchTicket" ADD CONSTRAINT "DispatchTicket_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchTicket" ADD CONSTRAINT "DispatchTicket_operationalDayId_fkey" FOREIGN KEY ("operationalDayId") REFERENCES "OperationalDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchTicket" ADD CONSTRAINT "DispatchTicket_preparedByUserId_fkey" FOREIGN KEY ("preparedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchTicket" ADD CONSTRAINT "DispatchTicket_dispatchedByUserId_fkey" FOREIGN KEY ("dispatchedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchTicketPackage" ADD CONSTRAINT "DispatchTicketPackage_dispatchTicketId_fkey" FOREIGN KEY ("dispatchTicketId") REFERENCES "DispatchTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerCreditScore" ADD CONSTRAINT "CustomerCreditScore_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportService" ADD CONSTRAINT "TransportService_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "SaleOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportService" ADD CONSTRAINT "TransportService_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportService" ADD CONSTRAINT "TransportService_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportService" ADD CONSTRAINT "TransportService_operationalDayId_fkey" FOREIGN KEY ("operationalDayId") REFERENCES "OperationalDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportService" ADD CONSTRAINT "TransportService_driverUserId_fkey" FOREIGN KEY ("driverUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportService" ADD CONSTRAINT "TransportService_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportService" ADD CONSTRAINT "TransportService_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "SaleOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_openedByUserId_fkey" FOREIGN KEY ("openedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_settlementPaymentId_fkey" FOREIGN KEY ("settlementPaymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimEvidence" ADD CONSTRAINT "ClaimEvidence_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimEvidence" ADD CONSTRAINT "ClaimEvidence_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerUser" ADD CONSTRAINT "CustomerUser_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSession" ADD CONSTRAINT "CustomerSession_customerUserId_fkey" FOREIGN KEY ("customerUserId") REFERENCES "CustomerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lane" ADD CONSTRAINT "Lane_originBranchId_fkey" FOREIGN KEY ("originBranchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lane" ADD CONSTRAINT "Lane_destinationBranchId_fkey" FOREIGN KEY ("destinationBranchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_laneId_fkey" FOREIGN KEY ("laneId") REFERENCES "Lane"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentLine" ADD CONSTRAINT "ShipmentLine_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSalaryHistory" ADD CONSTRAINT "EmployeeSalaryHistory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLoan" ADD CONSTRAINT "EmployeeLoan_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLoan" ADD CONSTRAINT "EmployeeLoan_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLoanInstallment" ADD CONSTRAINT "EmployeeLoanInstallment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "EmployeeLoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLoanInstallment" ADD CONSTRAINT "EmployeeLoanInstallment_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLoanInstallment" ADD CONSTRAINT "EmployeeLoanInstallment_payrollLineId_fkey" FOREIGN KEY ("payrollLineId") REFERENCES "PayrollLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRun" ADD CONSTRAINT "PayrollRun_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollLine" ADD CONSTRAINT "PayrollLine_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollLine" ADD CONSTRAINT "PayrollLine_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VacationEntry" ADD CONSTRAINT "VacationEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSettlement" ADD CONSTRAINT "EmployeeSettlement_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeAbsence" ADD CONSTRAINT "EmployeeAbsence_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRollCall" ADD CONSTRAINT "AttendanceRollCall_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceMark" ADD CONSTRAINT "AttendanceMark_rollCallId_fkey" FOREIGN KEY ("rollCallId") REFERENCES "AttendanceRollCall"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceMark" ADD CONSTRAINT "AttendanceMark_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollDisbursement" ADD CONSTRAINT "PayrollDisbursement_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollDisbursement" ADD CONSTRAINT "PayrollDisbursement_payrollLineId_fkey" FOREIGN KEY ("payrollLineId") REFERENCES "PayrollLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollDisbursement" ADD CONSTRAINT "PayrollDisbursement_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollDisbursement" ADD CONSTRAINT "PayrollDisbursement_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollDisbursement" ADD CONSTRAINT "PayrollDisbursement_cashMovementId_fkey" FOREIGN KEY ("cashMovementId") REFERENCES "CashMovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatingExpense" ADD CONSTRAINT "OperatingExpense_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatingExpense" ADD CONSTRAINT "OperatingExpense_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatingExpense" ADD CONSTRAINT "OperatingExpense_cashMovementId_fkey" FOREIGN KEY ("cashMovementId") REFERENCES "CashMovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discount" ADD CONSTRAINT "Discount_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discount" ADD CONSTRAINT "Discount_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchRoleConfig" ADD CONSTRAINT "BranchRoleConfig_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchRoleConfig" ADD CONSTRAINT "BranchRoleConfig_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemSetting" ADD CONSTRAINT "SystemSetting_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrainDecision" ADD CONSTRAINT "BrainDecision_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrainDecision" ADD CONSTRAINT "BrainDecision_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrainDecision" ADD CONSTRAINT "BrainDecision_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrainDecision" ADD CONSTRAINT "BrainDecision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrainDecision" ADD CONSTRAINT "BrainDecision_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrainDecisionActionLog" ADD CONSTRAINT "BrainDecisionActionLog_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "BrainDecision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrainDecisionActionLog" ADD CONSTRAINT "BrainDecisionActionLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrainDecisionOutcome" ADD CONSTRAINT "BrainDecisionOutcome_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "BrainDecision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashClosure" ADD CONSTRAINT "CashClosure_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashClosureLog" ADD CONSTRAINT "CashClosureLog_cashClosureId_fkey" FOREIGN KEY ("cashClosureId") REFERENCES "CashClosure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchModuleConfig" ADD CONSTRAINT "BranchModuleConfig_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchModuleConfig" ADD CONSTRAINT "BranchModuleConfig_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintSettings" ADD CONSTRAINT "PrintSettings_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentPrintLog" ADD CONSTRAINT "DocumentPrintLog_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "SaleOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentPrintLog" ADD CONSTRAINT "DocumentPrintLog_printedById_fkey" FOREIGN KEY ("printedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Camera" ADD CONSTRAINT "Camera_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchCameraAgent" ADD CONSTRAINT "BranchCameraAgent_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CameraStatusHistory" ADD CONSTRAINT "CameraStatusHistory_cameraId_fkey" FOREIGN KEY ("cameraId") REFERENCES "Camera"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CameraHealthSnapshot" ADD CONSTRAINT "CameraHealthSnapshot_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryAccount" ADD CONSTRAINT "TreasuryAccount_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryAccount" ADD CONSTRAINT "TreasuryAccount_holderUserId_fkey" FOREIGN KEY ("holderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryCard" ADD CONSTRAINT "TreasuryCard_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "TreasuryAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankDeposit" ADD CONSTRAINT "BankDeposit_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "TreasuryAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankDeposit" ADD CONSTRAINT "BankDeposit_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankDeposit" ADD CONSTRAINT "BankDeposit_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashDepositPostponement" ADD CONSTRAINT "CashDepositPostponement_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "CashSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashDepositPostponement" ADD CONSTRAINT "CashDepositPostponement_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashDepositPostponement" ADD CONSTRAINT "CashDepositPostponement_declaredByUserId_fkey" FOREIGN KEY ("declaredByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashDestinationDeclaration" ADD CONSTRAINT "CashDestinationDeclaration_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "CashSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashDestinationDeclaration" ADD CONSTRAINT "CashDestinationDeclaration_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashDestinationDeclaration" ADD CONSTRAINT "CashDestinationDeclaration_declaredByUserId_fkey" FOREIGN KEY ("declaredByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashDestinationDeclaration" ADD CONSTRAINT "CashDestinationDeclaration_handOverUserId_fkey" FOREIGN KEY ("handOverUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashDestinationDeclaration" ADD CONSTRAINT "CashDestinationDeclaration_depositCarrierUserId_fkey" FOREIGN KEY ("depositCarrierUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashDestinationDeclaration" ADD CONSTRAINT "CashDestinationDeclaration_depositBankAccountId_fkey" FOREIGN KEY ("depositBankAccountId") REFERENCES "TreasuryAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryEntry" ADD CONSTRAINT "TreasuryEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "TreasuryAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryEntry" ADD CONSTRAINT "TreasuryEntry_intendedBankAccountId_fkey" FOREIGN KEY ("intendedBankAccountId") REFERENCES "TreasuryAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryEntry" ADD CONSTRAINT "TreasuryEntry_intendedRecipientUserId_fkey" FOREIGN KEY ("intendedRecipientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryEntry" ADD CONSTRAINT "TreasuryEntry_cashMovementId_fkey" FOREIGN KEY ("cashMovementId") REFERENCES "CashMovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryEntry" ADD CONSTRAINT "TreasuryEntry_paymentTenderId_fkey" FOREIGN KEY ("paymentTenderId") REFERENCES "PaymentTender"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryEntry" ADD CONSTRAINT "TreasuryEntry_bankDepositId_fkey" FOREIGN KEY ("bankDepositId") REFERENCES "BankDeposit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryEntry" ADD CONSTRAINT "TreasuryEntry_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "TreasuryCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryEntry" ADD CONSTRAINT "TreasuryEntry_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeRate" ADD CONSTRAINT "ExchangeRate_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchDepositPolicy" ADD CONSTRAINT "BranchDepositPolicy_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
