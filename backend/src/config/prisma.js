// backend/src/config/prisma.js
import { PrismaClient } from "@prisma/client";

let url = process.env.DATABASE_URL || "";

// Se estiver usando o host "pooler" do Supabase, forçamos a porta de sessão (6543)
// para evitar problemas com prepared statements em modo transacional.
if (url.includes(":5432")) {
  url = url.replace(":5432", ":6543");
}

// Para uso com PgBouncer, desabilita prepared statements no Prisma.
// Isso evita erros do tipo: "prepared statement \"sX\" already exists".
if (url) {
  url += url.includes("?") ? "&pgbouncer=true" : "?pgbouncer=true";
}

const prisma = new PrismaClient({
  datasources: { db: { url } },
  log: ["query", "info", "warn", "error"],
});

export default prisma;
