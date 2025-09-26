-- CreateTable
CREATE TABLE "public"."Administrador" (
    "AdminID" SERIAL NOT NULL,
    "Nome" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "SenhaHash" TEXT NOT NULL,
    "Cargo" TEXT,
    "NivelAcesso" INTEGER NOT NULL DEFAULT 1,
    "Ativo" BOOLEAN NOT NULL DEFAULT true,
    "CriadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Administrador_pkey" PRIMARY KEY ("AdminID")
);

-- CreateTable
CREATE TABLE "public"."Cliente" (
    "ClienteID" SERIAL NOT NULL,
    "CodigoCliente" SERIAL NOT NULL,
    "NomeCompleto" TEXT NOT NULL,
    "TipoPessoa" TEXT,
    "CPF_CNPJ" VARCHAR(20) NOT NULL,
    "TelefoneFixo" TEXT,
    "TelefoneCelular" TEXT,
    "Whatsapp" TEXT,
    "Email" TEXT NOT NULL,
    "InscricaoEstadual" TEXT,
    "InscricaoMunicipal" TEXT,
    "RazaoSocial" TEXT,
    "SenhaHash" TEXT NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("ClienteID")
);

-- CreateTable
CREATE TABLE "public"."Endereco" (
    "EnderecoID" SERIAL NOT NULL,
    "ClienteID" INTEGER NOT NULL,
    "Nome" TEXT NOT NULL,
    "Complemento" TEXT,
    "CEP" TEXT NOT NULL,
    "CodigoIBGE" TEXT,
    "Cidade" TEXT NOT NULL,
    "UF" TEXT NOT NULL,
    "TipoEndereco" TEXT NOT NULL DEFAULT 'Residencial',

    CONSTRAINT "Endereco_pkey" PRIMARY KEY ("EnderecoID")
);

-- CreateTable
CREATE TABLE "public"."Categoria" (
    "CategoriaID" SERIAL NOT NULL,
    "Nome" TEXT NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("CategoriaID")
);

-- CreateTable
CREATE TABLE "public"."Produto" (
    "ProdutoID" SERIAL NOT NULL,
    "Nome" TEXT NOT NULL,
    "Descricao" TEXT,
    "Preco" DOUBLE PRECISION NOT NULL,
    "Estoque" INTEGER NOT NULL DEFAULT 0,
    "CategoriaID" INTEGER NOT NULL,

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("ProdutoID")
);

-- CreateTable
CREATE TABLE "public"."Pedido" (
    "PedidoID" SERIAL NOT NULL,
    "ClienteID" INTEGER NOT NULL,
    "EnderecoID" INTEGER NOT NULL,
    "DataPedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Status" TEXT,
    "Total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("PedidoID")
);

-- CreateTable
CREATE TABLE "public"."ItensPedido" (
    "ItemID" SERIAL NOT NULL,
    "PedidoID" INTEGER NOT NULL,
    "ProdutoID" INTEGER NOT NULL,
    "Quantidade" INTEGER NOT NULL,
    "PrecoUnitario" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ItensPedido_pkey" PRIMARY KEY ("ItemID")
);

-- CreateTable
CREATE TABLE "public"."MetodoPagamento" (
    "MetodoID" SERIAL NOT NULL,
    "Nome" TEXT NOT NULL,
    "Ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MetodoPagamento_pkey" PRIMARY KEY ("MetodoID")
);

-- CreateTable
CREATE TABLE "public"."PagamentosPedido" (
    "PagamentoID" SERIAL NOT NULL,
    "PedidoID" INTEGER NOT NULL,
    "MetodoID" INTEGER NOT NULL,
    "ValorPago" DOUBLE PRECISION NOT NULL,
    "StatusPagamento" TEXT NOT NULL DEFAULT 'Pendente',
    "DataPagamento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PagamentosPedido_pkey" PRIMARY KEY ("PagamentoID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Administrador_Email_key" ON "public"."Administrador"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_CodigoCliente_key" ON "public"."Cliente"("CodigoCliente");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_CPF_CNPJ_key" ON "public"."Cliente"("CPF_CNPJ");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_Email_key" ON "public"."Cliente"("Email");

-- AddForeignKey
ALTER TABLE "public"."Endereco" ADD CONSTRAINT "Endereco_ClienteID_fkey" FOREIGN KEY ("ClienteID") REFERENCES "public"."Cliente"("ClienteID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Produto" ADD CONSTRAINT "Produto_CategoriaID_fkey" FOREIGN KEY ("CategoriaID") REFERENCES "public"."Categoria"("CategoriaID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Pedido" ADD CONSTRAINT "Pedido_ClienteID_fkey" FOREIGN KEY ("ClienteID") REFERENCES "public"."Cliente"("ClienteID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Pedido" ADD CONSTRAINT "Pedido_EnderecoID_fkey" FOREIGN KEY ("EnderecoID") REFERENCES "public"."Endereco"("EnderecoID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItensPedido" ADD CONSTRAINT "ItensPedido_PedidoID_fkey" FOREIGN KEY ("PedidoID") REFERENCES "public"."Pedido"("PedidoID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItensPedido" ADD CONSTRAINT "ItensPedido_ProdutoID_fkey" FOREIGN KEY ("ProdutoID") REFERENCES "public"."Produto"("ProdutoID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PagamentosPedido" ADD CONSTRAINT "PagamentosPedido_PedidoID_fkey" FOREIGN KEY ("PedidoID") REFERENCES "public"."Pedido"("PedidoID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PagamentosPedido" ADD CONSTRAINT "PagamentosPedido_MetodoID_fkey" FOREIGN KEY ("MetodoID") REFERENCES "public"."MetodoPagamento"("MetodoID") ON DELETE RESTRICT ON UPDATE CASCADE;
