-- 1. Create RestaurantPlan enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RestaurantPlan') THEN
        CREATE TYPE "RestaurantPlan" AS ENUM ('QUEUE_PRO', 'SELF_PRO');
    END IF;
END $$;

-- 2. Migrate existing historical restaurant_plan text data safely to RestaurantPlan enum
UPDATE "orders"
SET "restaurant_plan" = 'SELF_PRO'
WHERE "restaurant_plan" = 'SELF_SERVICE_PRO';

UPDATE "orders"
SET "restaurant_plan" = NULL
WHERE "restaurant_plan" IS NOT NULL AND "restaurant_plan" NOT IN ('QUEUE_PRO', 'SELF_PRO');

-- 3. Alter restaurant_plan column type to RestaurantPlan enum
ALTER TABLE "orders"
ALTER COLUMN "restaurant_plan" TYPE "RestaurantPlan"
USING ("restaurant_plan"::text::"RestaurantPlan");

-- 4. Drop table_id index and column from orders
DROP INDEX IF EXISTS "orders_table_id_idx";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "table_id";

