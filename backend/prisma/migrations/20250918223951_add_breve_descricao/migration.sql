/*
  Warnings:

  - You are about to drop the column `Sobre` on the `Produto` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Produto" DROP COLUMN "Sobre",
ADD COLUMN     "VendedorID" INTEGER;

-- CreateTable
CREATE TABLE "public"."Favorito" (
    "ClienteID" INTEGER NOT NULL,
    "ProdutoID" INTEGER NOT NULL,
    "AdicionadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "public"."CarrinhoItem" (
    "CarrinhoItemID" SERIAL NOT NULL,
    "ClienteID" INTEGER NOT NULL,
    "ProdutoID" INTEGER NOT NULL,
    "Quantidade" INTEGER NOT NULL DEFAULT 1,
    "AdicionadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarrinhoItem_pkey" PRIMARY KEY ("CarrinhoItemID")
);

-- CreateTable
CREATE TABLE "public"."Avaliacao" (
    "AvaliacaoID" SERIAL NOT NULL,
    "ClienteID" INTEGER NOT NULL,
    "ProdutoID" INTEGER NOT NULL,
    "Nota" INTEGER NOT NULL,
    "Comentario" TEXT,
    "CriadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Avaliacao_pkey" PRIMARY KEY ("AvaliacaoID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Favorito_ClienteID_ProdutoID_key" ON "public"."Favorito"("ClienteID", "ProdutoID");

-- CreateIndex
CREATE UNIQUE INDEX "CarrinhoItem_ClienteID_ProdutoID_key" ON "public"."CarrinhoItem"("ClienteID", "ProdutoID");

-- CreateIndex
CREATE UNIQUE INDEX "Avaliacao_ClienteID_ProdutoID_key" ON "public"."Avaliacao"("ClienteID", "ProdutoID");

-- AddForeignKey
ALTER TABLE "public"."Produto" ADD CONSTRAINT "Produto_VendedorID_fkey" FOREIGN KEY ("VendedorID") REFERENCES "public"."Vendedor"("VendedorID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favorito" ADD CONSTRAINT "Favorito_ClienteID_fkey" FOREIGN KEY ("ClienteID") REFERENCES "public"."Cliente"("ClienteID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favorito" ADD CONSTRAINT "Favorito_ProdutoID_fkey" FOREIGN KEY ("ProdutoID") REFERENCES "public"."Produto"("ProdutoID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CarrinhoItem" ADD CONSTRAINT "CarrinhoItem_ClienteID_fkey" FOREIGN KEY ("ClienteID") REFERENCES "public"."Cliente"("ClienteID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CarrinhoItem" ADD CONSTRAINT "CarrinhoItem_ProdutoID_fkey" FOREIGN KEY ("ProdutoID") REFERENCES "public"."Produto"("ProdutoID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Avaliacao" ADD CONSTRAINT "Avaliacao_ClienteID_fkey" FOREIGN KEY ("ClienteID") REFERENCES "public"."Cliente"("ClienteID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Avaliacao" ADD CONSTRAINT "Avaliacao_ProdutoID_fkey" FOREIGN KEY ("ProdutoID") REFERENCES "public"."Produto"("ProdutoID") ON DELETE RESTRICT ON UPDATE CASCADE;
