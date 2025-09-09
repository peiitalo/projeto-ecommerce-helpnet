-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('CLIENTE', 'VENDEDOR');

-- AlterTable
ALTER TABLE "public"."Cliente" ADD COLUMN     "role" "public"."Role" NOT NULL DEFAULT 'CLIENTE';
