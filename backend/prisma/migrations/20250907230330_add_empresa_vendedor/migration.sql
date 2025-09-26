-- AlterTable
ALTER TABLE "public"."Produto" ADD COLUMN     "EmpresaID" INTEGER;

-- CreateTable
CREATE TABLE "public"."Empresa" (
    "EmpresaID" SERIAL NOT NULL,
    "Nome" TEXT NOT NULL,
    "Documento" TEXT,
    "Email" TEXT,
    "Telefone" TEXT,
    "Ativo" BOOLEAN NOT NULL DEFAULT true,
    "CriadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("EmpresaID")
);

-- CreateTable
CREATE TABLE "public"."Vendedor" (
    "VendedorID" SERIAL NOT NULL,
    "Nome" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "SenhaHash" TEXT NOT NULL,
    "EmpresaID" INTEGER NOT NULL,
    "Ativo" BOOLEAN NOT NULL DEFAULT true,
    "CriadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vendedor_pkey" PRIMARY KEY ("VendedorID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_Documento_key" ON "public"."Empresa"("Documento");

-- CreateIndex
CREATE UNIQUE INDEX "Vendedor_Email_key" ON "public"."Vendedor"("Email");

-- AddForeignKey
ALTER TABLE "public"."Produto" ADD CONSTRAINT "Produto_EmpresaID_fkey" FOREIGN KEY ("EmpresaID") REFERENCES "public"."Empresa"("EmpresaID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Vendedor" ADD CONSTRAINT "Vendedor_EmpresaID_fkey" FOREIGN KEY ("EmpresaID") REFERENCES "public"."Empresa"("EmpresaID") ON DELETE RESTRICT ON UPDATE CASCADE;
