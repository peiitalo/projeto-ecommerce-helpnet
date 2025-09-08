/*
  Warnings:

  - You are about to drop the column `CriadoEm` on the `Produto` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Cliente" ADD COLUMN     "DataCadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."Produto" DROP COLUMN "CriadoEm",
ADD COLUMN     "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
