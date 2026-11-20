-- 1. Create the new OrderingMode enum if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrderingMode') THEN
        CREATE TYPE "OrderingMode" AS ENUM ('QUEUE_ORDER', 'SELF_ORDER');
    END IF;
END $$;

-- 2. Add ordering_mode column to orders with default SELF_ORDER
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "ordering_mode" "OrderingMode" NOT NULL DEFAULT 'SELF_ORDER';

-- 3. Historical Data Migration: Map old order_type values to ordering_mode if order_type column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'order_type'
    ) THEN
        UPDATE "orders"
        SET "ordering_mode" = CASE
            WHEN "order_type"::text = 'PRE_ORDER' THEN 'QUEUE_ORDER'::"OrderingMode"
            ELSE 'SELF_ORDER'::"OrderingMode"
        END;

        ALTER TABLE "orders" DROP COLUMN "order_type";
    END IF;
END $$;

-- 4. Drop old OrderType enum if it exists
DROP TYPE IF EXISTS "OrderType";

-- 5. Historical Data Migration: Update legacy payment modes to ONLINE
UPDATE "orders"
SET "payment_mode" = 'ONLINE'
WHERE "payment_mode"::text IN ('PAY_AT_COUNTER', 'COD');

-- 6. Safely recreate PaymentMode enum with only ONLINE
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_enum
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
        WHERE pg_type.typname = 'PaymentMode' AND pg_enum.enumlabel IN ('PAY_AT_COUNTER', 'COD')
    ) THEN
        CREATE TYPE "PaymentMode_new" AS ENUM ('ONLINE');
        ALTER TABLE "orders" ALTER COLUMN "payment_mode" DROP DEFAULT;
        ALTER TABLE "orders" ALTER COLUMN "payment_mode" TYPE "PaymentMode_new" USING ("payment_mode"::text::"PaymentMode_new");
        ALTER TABLE "orders" ALTER COLUMN "payment_mode" SET DEFAULT 'ONLINE';
        DROP TYPE "PaymentMode";
        ALTER TYPE "PaymentMode_new" RENAME TO "PaymentMode";
    END IF;
END $$;

-- 7. Historical Data Migration: Update legacy PAID_OFFLINE status to PAID
UPDATE "orders"
SET "payment_status" = 'PAID'
WHERE "payment_status"::text = 'PAID_OFFLINE';

-- 8. Safely recreate PaymentStatus enum without PAID_OFFLINE
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_enum
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
        WHERE pg_type.typname = 'PaymentStatus' AND pg_enum.enumlabel = 'PAID_OFFLINE'
    ) THEN
        CREATE TYPE "PaymentStatus_new" AS ENUM ('PENDING', 'PAID', 'REFUNDED', 'FAILED');
        ALTER TABLE "orders" ALTER COLUMN "payment_status" DROP DEFAULT;
        ALTER TABLE "orders" ALTER COLUMN "payment_status" TYPE "PaymentStatus_new" USING ("payment_status"::text::"PaymentStatus_new");
        ALTER TABLE "orders" ALTER COLUMN "payment_status" SET DEFAULT 'PENDING';
        DROP TYPE "PaymentStatus";
        ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
    END IF;
END $$;

-- 9. Add new order context columns
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "idempotency_key" VARCHAR(100);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "restaurant_plan" VARCHAR(50);

-- 10. Drop deprecated columns and composite index
DROP INDEX IF EXISTS "orders_restaurant_id_order_status_priority_idx";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "priority";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "coupon_code";

-- 11. Add new indexes
CREATE UNIQUE INDEX IF NOT EXISTS "orders_idempotency_key_key" ON "orders"("idempotency_key");
CREATE INDEX IF NOT EXISTS "orders_queue_entry_id_idx" ON "orders"("queue_entry_id");
CREATE INDEX IF NOT EXISTS "orders_payment_id_idx" ON "orders"("payment_id");
