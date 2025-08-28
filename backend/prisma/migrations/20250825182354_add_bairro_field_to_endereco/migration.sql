/*
  Warnings:

  - Added the required column `Bairro` to the `Endereco` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Endereco" ADD COLUMN     "Bairro" TEXT NOT NULL;
