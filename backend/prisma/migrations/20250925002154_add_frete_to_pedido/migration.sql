-- CreateEnum
CREATE TYPE "public"."PedidoStatusPagamento" AS ENUM ('PENDENTE', 'PARCIAL', 'PAGO', 'EXPIRADO');

-- AlterTable
ALTER TABLE "public"."Pedido" ADD COLUMN     "ExpiraEm" TIMESTAMP(3),
ADD COLUMN     "Frete" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "StatusPagamento" "public"."PedidoStatusPagamento" NOT NULL DEFAULT 'PENDENTE',
ADD COLUMN     "TotalPago" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."DistribuicaoPagamentoPedido" (
    "DistribuicaoID" SERIAL NOT NULL,
    "PedidoID" INTEGER NOT NULL,
    "MetodoID" INTEGER NOT NULL,
    "ValorAlocado" DOUBLE PRECISION NOT NULL,
    "ValorPagoAcumulado" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "DistribuicaoPagamentoPedido_pkey" PRIMARY KEY ("DistribuicaoID")
);

-- CreateTable
CREATE TABLE "public"."Notificacao" (
    "NotificacaoID" SERIAL NOT NULL,
    "Titulo" TEXT NOT NULL,
    "Mensagem" TEXT NOT NULL,
    "Tipo" TEXT NOT NULL DEFAULT 'info',
    "VendedorID" INTEGER,
    "ClienteID" INTEGER,
    "Lida" BOOLEAN NOT NULL DEFAULT false,
    "CriadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "produtoProdutoID" INTEGER,

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("NotificacaoID")
);

-- CreateTable
CREATE TABLE "public"."ClienteVendedor" (
    "ClienteVendedorID" SERIAL NOT NULL,
    "ClienteID" INTEGER NOT NULL,
    "VendedorID" INTEGER NOT NULL,
    "AdicionadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UltimoPedidoEm" TIMESTAMP(3),
    "TotalPedidos" INTEGER NOT NULL DEFAULT 0,
    "ValorTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "ClienteVendedor_pkey" PRIMARY KEY ("ClienteVendedorID")
);

-- CreateTable
CREATE TABLE "public"."Entrega" (
    "EntregaID" SERIAL NOT NULL,
    "PedidoID" INTEGER NOT NULL,
    "Transportadora" TEXT,
    "CodigoRastreio" TEXT,
    "StatusEntrega" TEXT NOT NULL DEFAULT 'AguardandoEnvio',
    "DataEnvio" TIMESTAMP(3),
    "DataEntrega" TIMESTAMP(3),
    "PrevisaoEntrega" TIMESTAMP(3),
    "Observacoes" TEXT,
    "CriadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "AtualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entrega_pkey" PRIMARY KEY ("EntregaID")
);

-- CreateTable
CREATE TABLE "public"."Rastreamento" (
    "RastreamentoID" SERIAL NOT NULL,
    "EntregaID" INTEGER NOT NULL,
    "Status" TEXT NOT NULL,
    "Local" TEXT,
    "DataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Observacoes" TEXT,

    CONSTRAINT "Rastreamento_pkey" PRIMARY KEY ("RastreamentoID")
);

-- CreateTable
CREATE TABLE "public"."PasswordResetToken" (
    "TokenID" SERIAL NOT NULL,
    "ClienteID" INTEGER NOT NULL,
    "Token" TEXT NOT NULL,
    "ExpiresAt" TIMESTAMP(3) NOT NULL,
    "Used" BOOLEAN NOT NULL DEFAULT false,
    "CriadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("TokenID")
);

-- CreateIndex
CREATE INDEX "DistribuicaoPagamentoPedido_PedidoID_idx" ON "public"."DistribuicaoPagamentoPedido"("PedidoID");

-- CreateIndex
CREATE UNIQUE INDEX "DistribuicaoPagamentoPedido_PedidoID_MetodoID_key" ON "public"."DistribuicaoPagamentoPedido"("PedidoID", "MetodoID");

-- CreateIndex
CREATE INDEX "Notificacao_VendedorID_idx" ON "public"."Notificacao"("VendedorID");

-- CreateIndex
CREATE INDEX "Notificacao_ClienteID_idx" ON "public"."Notificacao"("ClienteID");

-- CreateIndex
CREATE INDEX "Notificacao_Lida_idx" ON "public"."Notificacao"("Lida");

-- CreateIndex
CREATE INDEX "ClienteVendedor_ClienteID_idx" ON "public"."ClienteVendedor"("ClienteID");

-- CreateIndex
CREATE INDEX "ClienteVendedor_VendedorID_idx" ON "public"."ClienteVendedor"("VendedorID");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteVendedor_ClienteID_VendedorID_key" ON "public"."ClienteVendedor"("ClienteID", "VendedorID");

-- CreateIndex
CREATE UNIQUE INDEX "Entrega_CodigoRastreio_key" ON "public"."Entrega"("CodigoRastreio");

-- CreateIndex
CREATE INDEX "Entrega_PedidoID_idx" ON "public"."Entrega"("PedidoID");

-- CreateIndex
CREATE INDEX "Entrega_StatusEntrega_idx" ON "public"."Entrega"("StatusEntrega");

-- CreateIndex
CREATE INDEX "Rastreamento_EntregaID_idx" ON "public"."Rastreamento"("EntregaID");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_Token_key" ON "public"."PasswordResetToken"("Token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_ClienteID_idx" ON "public"."PasswordResetToken"("ClienteID");

-- CreateIndex
CREATE INDEX "PasswordResetToken_Token_idx" ON "public"."PasswordResetToken"("Token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_ExpiresAt_idx" ON "public"."PasswordResetToken"("ExpiresAt");

-- CreateIndex
CREATE INDEX "Avaliacao_ClienteID_idx" ON "public"."Avaliacao"("ClienteID");

-- CreateIndex
CREATE INDEX "Avaliacao_ProdutoID_idx" ON "public"."Avaliacao"("ProdutoID");

-- CreateIndex
CREATE INDEX "CarrinhoItem_ClienteID_idx" ON "public"."CarrinhoItem"("ClienteID");

-- CreateIndex
CREATE INDEX "CarrinhoItem_ProdutoID_idx" ON "public"."CarrinhoItem"("ProdutoID");

-- CreateIndex
CREATE INDEX "Cliente_Email_idx" ON "public"."Cliente"("Email");

-- CreateIndex
CREATE INDEX "Cliente_DataCadastro_idx" ON "public"."Cliente"("DataCadastro");

-- CreateIndex
CREATE INDEX "Cliente_role_idx" ON "public"."Cliente"("role");

-- CreateIndex
CREATE INDEX "Empresa_Ativo_idx" ON "public"."Empresa"("Ativo");

-- CreateIndex
CREATE INDEX "Empresa_CriadoEm_idx" ON "public"."Empresa"("CriadoEm");

-- CreateIndex
CREATE INDEX "Favorito_ClienteID_idx" ON "public"."Favorito"("ClienteID");

-- CreateIndex
CREATE INDEX "Favorito_ProdutoID_idx" ON "public"."Favorito"("ProdutoID");

-- CreateIndex
CREATE INDEX "ItensPedido_PedidoID_idx" ON "public"."ItensPedido"("PedidoID");

-- CreateIndex
CREATE INDEX "ItensPedido_ProdutoID_idx" ON "public"."ItensPedido"("ProdutoID");

-- CreateIndex
CREATE INDEX "PagamentosPedido_PedidoID_idx" ON "public"."PagamentosPedido"("PedidoID");

-- CreateIndex
CREATE INDEX "PagamentosPedido_MetodoID_idx" ON "public"."PagamentosPedido"("MetodoID");

-- CreateIndex
CREATE INDEX "Pedido_ClienteID_idx" ON "public"."Pedido"("ClienteID");

-- CreateIndex
CREATE INDEX "Pedido_Status_idx" ON "public"."Pedido"("Status");

-- CreateIndex
CREATE INDEX "Pedido_StatusPagamento_idx" ON "public"."Pedido"("StatusPagamento");

-- CreateIndex
CREATE INDEX "Vendedor_EmpresaID_idx" ON "public"."Vendedor"("EmpresaID");

-- CreateIndex
CREATE INDEX "Vendedor_Ativo_idx" ON "public"."Vendedor"("Ativo");

-- CreateIndex
CREATE INDEX "Vendedor_CriadoEm_idx" ON "public"."Vendedor"("CriadoEm");

-- AddForeignKey
ALTER TABLE "public"."DistribuicaoPagamentoPedido" ADD CONSTRAINT "DistribuicaoPagamentoPedido_MetodoID_fkey" FOREIGN KEY ("MetodoID") REFERENCES "public"."MetodoPagamento"("MetodoID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DistribuicaoPagamentoPedido" ADD CONSTRAINT "DistribuicaoPagamentoPedido_PedidoID_fkey" FOREIGN KEY ("PedidoID") REFERENCES "public"."Pedido"("PedidoID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notificacao" ADD CONSTRAINT "Notificacao_VendedorID_fkey" FOREIGN KEY ("VendedorID") REFERENCES "public"."Vendedor"("VendedorID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notificacao" ADD CONSTRAINT "Notificacao_ClienteID_fkey" FOREIGN KEY ("ClienteID") REFERENCES "public"."Cliente"("ClienteID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notificacao" ADD CONSTRAINT "Notificacao_produtoProdutoID_fkey" FOREIGN KEY ("produtoProdutoID") REFERENCES "public"."Produto"("ProdutoID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClienteVendedor" ADD CONSTRAINT "ClienteVendedor_ClienteID_fkey" FOREIGN KEY ("ClienteID") REFERENCES "public"."Cliente"("ClienteID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClienteVendedor" ADD CONSTRAINT "ClienteVendedor_VendedorID_fkey" FOREIGN KEY ("VendedorID") REFERENCES "public"."Vendedor"("VendedorID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Entrega" ADD CONSTRAINT "Entrega_PedidoID_fkey" FOREIGN KEY ("PedidoID") REFERENCES "public"."Pedido"("PedidoID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Rastreamento" ADD CONSTRAINT "Rastreamento_EntregaID_fkey" FOREIGN KEY ("EntregaID") REFERENCES "public"."Entrega"("EntregaID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_ClienteID_fkey" FOREIGN KEY ("ClienteID") REFERENCES "public"."Cliente"("ClienteID") ON DELETE RESTRICT ON UPDATE CASCADE;
