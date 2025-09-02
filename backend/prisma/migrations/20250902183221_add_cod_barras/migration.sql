/*
  Warnings:

  - You are about to drop the column `DataNascimento` on the `Cliente` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[CodBarras]` on the table `Produto` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `CodBarras` to the `Produto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Cliente" DROP COLUMN "DataNascimento",
ADD COLUMN     "DataCadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."Endereco" ADD COLUMN     "Obrigatorio" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Produto" ADD COLUMN     "CodBarras" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Produto_CodBarras_key" ON "public"."Produto"("CodBarras");
