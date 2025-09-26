/*
  Warnings:

  - A unique constraint covering the columns `[CodBarras]` on the table `Produto` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Produto" ADD COLUMN     "Ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "CodBarras" TEXT,
ADD COLUMN     "Condicao" TEXT DEFAULT 'Novo',
ADD COLUMN     "Cor" TEXT,
ADD COLUMN     "CriadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "Desconto" INTEGER DEFAULT 0,
ADD COLUMN     "Dimensoes" TEXT,
ADD COLUMN     "FreteGratis" BOOLEAN DEFAULT false,
ADD COLUMN     "Garantia" TEXT,
ADD COLUMN     "Imagens" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "Marca" TEXT,
ADD COLUMN     "Modelo" TEXT,
ADD COLUMN     "Origem" TEXT DEFAULT 'Nacional',
ADD COLUMN     "Peso" DOUBLE PRECISION,
ADD COLUMN     "PrazoEntrega" TEXT,
ADD COLUMN     "PrecoOriginal" DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "Produto_CodBarras_key" ON "public"."Produto"("CodBarras");
