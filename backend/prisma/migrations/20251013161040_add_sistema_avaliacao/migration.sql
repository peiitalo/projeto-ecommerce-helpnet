-- CreateTable
CREATE TABLE "public"."SistemaAvaliacao" (
    "AvaliacaoID" SERIAL NOT NULL,
    "Nome" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "Estrelas" INTEGER NOT NULL,
    "Comentario" TEXT NOT NULL,
    "Aprovado" BOOLEAN NOT NULL DEFAULT false,
    "ExibirLanding" BOOLEAN NOT NULL DEFAULT false,
    "CriadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SistemaAvaliacao_pkey" PRIMARY KEY ("AvaliacaoID")
);

-- CreateIndex
CREATE INDEX "SistemaAvaliacao_Aprovado_idx" ON "public"."SistemaAvaliacao"("Aprovado");

-- CreateIndex
CREATE INDEX "SistemaAvaliacao_ExibirLanding_idx" ON "public"."SistemaAvaliacao"("ExibirLanding");

-- CreateIndex
CREATE INDEX "SistemaAvaliacao_CriadoEm_idx" ON "public"."SistemaAvaliacao"("CriadoEm");
