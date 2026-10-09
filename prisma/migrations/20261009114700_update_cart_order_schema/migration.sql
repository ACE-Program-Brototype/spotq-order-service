-- AlterTable
ALTER TABLE "orders" ADD COLUMN "priority" SMALLINT NOT NULL DEFAULT 3;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "carts_expires_at_idx" ON "carts"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "cart_item_addons_cart_item_id_addon_id_key" ON "cart_item_addons"("cart_item_id", "addon_id");

-- CreateIndex
CREATE INDEX "orders_restaurant_id_order_status_priority_idx" ON "orders"("restaurant_id", "order_status", "priority");

-- CreateIndex
CREATE INDEX "orders_restaurant_id_created_at_idx" ON "orders"("restaurant_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_table_id_idx" ON "orders"("table_id");

-- CreateIndex
CREATE INDEX "orders_payment_id_idx" ON "orders"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_item_addons_order_item_id_addon_id_key" ON "order_item_addons"("order_item_id", "addon_id");
