/*
  Warnings:

  - You are about to drop the `SistemaAvaliacao` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TipoDesconto" AS ENUM ('PERCENTUAL', 'VALOR_FIXO', 'FRETE_GRATIS');

-- CreateEnum
CREATE TYPE "TipoDistribuicao" AS ENUM ('PUBLICO', 'VENDEDOR_ESPECIFICO');

-- CreateEnum
CREATE TYPE "StatusParceria" AS ENUM ('PENDENTE', 'ATIVA', 'RECUSADA', 'ENCERRADA');

-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "CupomID" INTEGER,
ADD COLUMN     "DescontoCupom" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "DescontoVista" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "public"."SistemaAvaliacao";

-- CreateTable
CREATE TABLE "Cupom" (
    "CupomID" SERIAL NOT NULL,
    "Nome" TEXT NOT NULL,
    "Codigo" TEXT NOT NULL,
    "Tipo" TEXT NOT NULL DEFAULT 'publico',
    "DescontoTipo" TEXT NOT NULL,
    "DescontoValor" DOUBLE PRECISION NOT NULL,
    "DataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "DataExpiracao" TIMESTAMP(3),
    "LimiteUso" INTEGER,
    "UsoPorCliente" INTEGER DEFAULT 1,
    "Ativo" BOOLEAN NOT NULL DEFAULT true,
    "CriadoPor" INTEGER NOT NULL,
    "CriadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Restricoes" JSONB,
    "UsosAtuais" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Cupom_pkey" PRIMARY KEY ("CupomID")
);

-- CreateTable
CREATE TABLE "CupomCliente" (
    "CupomClienteID" SERIAL NOT NULL,
    "CupomID" INTEGER NOT NULL,
    "ClienteID" INTEGER NOT NULL,
    "RecebidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Resgatado" BOOLEAN NOT NULL DEFAULT false,
    "DataResgate" TIMESTAMP(3),
    "Usado" BOOLEAN NOT NULL DEFAULT false,
    "DataUso" TIMESTAMP(3),
    "PedidoID" INTEGER,
    "UsosCliente" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CupomCliente_pkey" PRIMARY KEY ("CupomClienteID")
);

-- CreateTable
CREATE TABLE "MensagemSuporte" (
    "MensagemID" SERIAL NOT NULL,
    "ClienteID" INTEGER NOT NULL,
    "Tipo" TEXT NOT NULL,
    "Assunto" TEXT NOT NULL,
    "Mensagem" TEXT NOT NULL,
    "Status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "Resposta" TEXT,
    "RespondidoPor" INTEGER,
    "RespondidoEm" TIMESTAMP(3),
    "CriadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MensagemSuporte_pkey" PRIMARY KEY ("MensagemID")
);

-- CreateTable
CREATE TABLE "AvaliacaoPlataforma" (
    "AvaliacaoID" SERIAL NOT NULL,
    "ClienteID" INTEGER NOT NULL,
    "Nota" INTEGER NOT NULL,
    "Comentario" TEXT,
    "ExibirSite" BOOLEAN NOT NULL DEFAULT false,
    "CriadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvaliacaoPlataforma_pkey" PRIMARY KEY ("AvaliacaoID")
);

-- CreateTable
CREATE TABLE "ParceriaVendedor" (
    "ParceriaID" SERIAL NOT NULL,
    "SolicitanteID" INTEGER NOT NULL,
    "ConvidadoID" INTEGER NOT NULL,
    "Status" "StatusParceria" NOT NULL DEFAULT 'PENDENTE',
    "PercentualSolicitante" DOUBLE PRECISION NOT NULL,
    "PercentualConvidado" DOUBLE PRECISION NOT NULL,
    "Mensagem" TEXT,
    "DataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "DataAceitacao" TIMESTAMP(3),
    "DataEncerramento" TIMESTAMP(3),

    CONSTRAINT "ParceriaVendedor_pkey" PRIMARY KEY ("ParceriaID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cupom_Codigo_key" ON "Cupom"("Codigo");

-- CreateIndex
CREATE INDEX "Cupom_CriadoPor_idx" ON "Cupom"("CriadoPor");

-- CreateIndex
CREATE INDEX "Cupom_Ativo_idx" ON "Cupom"("Ativo");

-- CreateIndex
CREATE INDEX "Cupom_DataExpiracao_idx" ON "Cupom"("DataExpiracao");

-- CreateIndex
CREATE INDEX "Cupom_Tipo_idx" ON "Cupom"("Tipo");

-- CreateIndex
CREATE INDEX "CupomCliente_CupomID_idx" ON "CupomCliente"("CupomID");

-- CreateIndex
CREATE INDEX "CupomCliente_ClienteID_idx" ON "CupomCliente"("ClienteID");

-- CreateIndex
CREATE INDEX "CupomCliente_PedidoID_idx" ON "CupomCliente"("PedidoID");

-- CreateIndex
CREATE INDEX "CupomCliente_Resgatado_idx" ON "CupomCliente"("Resgatado");

-- CreateIndex
CREATE INDEX "CupomCliente_Usado_idx" ON "CupomCliente"("Usado");

-- CreateIndex
CREATE UNIQUE INDEX "CupomCliente_CupomID_ClienteID_key" ON "CupomCliente"("CupomID", "ClienteID");

-- CreateIndex
CREATE INDEX "MensagemSuporte_ClienteID_idx" ON "MensagemSuporte"("ClienteID");

-- CreateIndex
CREATE INDEX "MensagemSuporte_Tipo_idx" ON "MensagemSuporte"("Tipo");

-- CreateIndex
CREATE INDEX "MensagemSuporte_Status_idx" ON "MensagemSuporte"("Status");

-- CreateIndex
CREATE INDEX "MensagemSuporte_CriadoEm_idx" ON "MensagemSuporte"("CriadoEm");

-- CreateIndex
CREATE INDEX "AvaliacaoPlataforma_ClienteID_idx" ON "AvaliacaoPlataforma"("ClienteID");

-- CreateIndex
CREATE INDEX "AvaliacaoPlataforma_Nota_idx" ON "AvaliacaoPlataforma"("Nota");

-- CreateIndex
CREATE INDEX "AvaliacaoPlataforma_ExibirSite_idx" ON "AvaliacaoPlataforma"("ExibirSite");

-- CreateIndex
CREATE INDEX "AvaliacaoPlataforma_CriadoEm_idx" ON "AvaliacaoPlataforma"("CriadoEm");

-- CreateIndex
CREATE INDEX "ParceriaVendedor_SolicitanteID_idx" ON "ParceriaVendedor"("SolicitanteID");

-- CreateIndex
CREATE INDEX "ParceriaVendedor_ConvidadoID_idx" ON "ParceriaVendedor"("ConvidadoID");

-- CreateIndex
CREATE INDEX "ParceriaVendedor_Status_idx" ON "ParceriaVendedor"("Status");

-- CreateIndex
CREATE UNIQUE INDEX "ParceriaVendedor_SolicitanteID_ConvidadoID_key" ON "ParceriaVendedor"("SolicitanteID", "ConvidadoID");

-- CreateIndex
CREATE INDEX "Pedido_CupomID_idx" ON "Pedido"("CupomID");

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_CupomID_fkey" FOREIGN KEY ("CupomID") REFERENCES "Cupom"("CupomID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cupom" ADD CONSTRAINT "Cupom_CriadoPor_fkey" FOREIGN KEY ("CriadoPor") REFERENCES "Vendedor"("VendedorID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CupomCliente" ADD CONSTRAINT "CupomCliente_CupomID_fkey" FOREIGN KEY ("CupomID") REFERENCES "Cupom"("CupomID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CupomCliente" ADD CONSTRAINT "CupomCliente_ClienteID_fkey" FOREIGN KEY ("ClienteID") REFERENCES "Cliente"("ClienteID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CupomCliente" ADD CONSTRAINT "CupomCliente_PedidoID_fkey" FOREIGN KEY ("PedidoID") REFERENCES "Pedido"("PedidoID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemSuporte" ADD CONSTRAINT "MensagemSuporte_ClienteID_fkey" FOREIGN KEY ("ClienteID") REFERENCES "Cliente"("ClienteID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemSuporte" ADD CONSTRAINT "MensagemSuporte_RespondidoPor_fkey" FOREIGN KEY ("RespondidoPor") REFERENCES "Administrador"("AdminID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoPlataforma" ADD CONSTRAINT "AvaliacaoPlataforma_ClienteID_fkey" FOREIGN KEY ("ClienteID") REFERENCES "Cliente"("ClienteID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParceriaVendedor" ADD CONSTRAINT "ParceriaVendedor_SolicitanteID_fkey" FOREIGN KEY ("SolicitanteID") REFERENCES "Vendedor"("VendedorID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParceriaVendedor" ADD CONSTRAINT "ParceriaVendedor_ConvidadoID_fkey" FOREIGN KEY ("ConvidadoID") REFERENCES "Vendedor"("VendedorID") ON DELETE RESTRICT ON UPDATE CASCADE;
