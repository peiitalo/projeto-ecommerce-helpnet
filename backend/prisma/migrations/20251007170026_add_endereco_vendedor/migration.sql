-- CreateTable
CREATE TABLE "public"."EnderecoVendedor" (
    "EnderecoVendedorID" SERIAL NOT NULL,
    "VendedorID" INTEGER NOT NULL,
    "Nome" TEXT NOT NULL,
    "Complemento" TEXT,
    "CEP" TEXT NOT NULL,
    "CodigoIBGE" TEXT,
    "Cidade" TEXT NOT NULL,
    "UF" TEXT NOT NULL,
    "TipoEndereco" TEXT NOT NULL DEFAULT 'Comercial',
    "Numero" TEXT,
    "Bairro" TEXT NOT NULL,

    CONSTRAINT "EnderecoVendedor_pkey" PRIMARY KEY ("EnderecoVendedorID")
);

-- AddForeignKey
ALTER TABLE "public"."EnderecoVendedor" ADD CONSTRAINT "EnderecoVendedor_VendedorID_fkey" FOREIGN KEY ("VendedorID") REFERENCES "public"."Vendedor"("VendedorID") ON DELETE RESTRICT ON UPDATE CASCADE;
