/*
  Warnings:

  - Added the required column `addon_name` to the `cart_item_addons` table without a default value. This is not possible if the table is not empty.
  - Added the required column `menu_item_name` to the `cart_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_price` to the `cart_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit_price` to the `cart_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cart_item_addons" ADD COLUMN     "addon_name" VARCHAR(100) NOT NULL,
ADD COLUMN     "price" DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE "cart_items" ADD COLUMN     "menu_item_name" VARCHAR(255) NOT NULL,
ADD COLUMN     "total_price" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "unit_price" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "variant_name" VARCHAR(100);
