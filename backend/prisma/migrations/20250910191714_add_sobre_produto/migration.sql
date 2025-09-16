-- AlterTable
ALTER TABLE "public"."Produto" ADD COLUMN     "Sobre" TEXT;

-- CreateIndex
CREATE INDEX "Produto_CategoriaID_idx" ON "public"."Produto"("CategoriaID");

-- CreateIndex
CREATE INDEX "Produto_Ativo_idx" ON "public"."Produto"("Ativo");

-- CreateIndex
CREATE INDEX "Produto_criadoEm_idx" ON "public"."Produto"("criadoEm");

-- CreateIndex
CREATE INDEX "Produto_CategoriaID_Ativo_criadoEm_idx" ON "public"."Produto"("CategoriaID", "Ativo", "criadoEm");
