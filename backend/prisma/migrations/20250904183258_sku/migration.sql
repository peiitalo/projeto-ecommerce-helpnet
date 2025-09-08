/*
  Warnings:

  - A unique constraint covering the columns `[SKU]` on the table `Produto` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `SKU` to the `Produto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Produto" ADD COLUMN     "SKU" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Produto_SKU_key" ON "public"."Produto"("SKU");
