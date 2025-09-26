// backend/src/config/prisma.js
import { PrismaClient } from "@prisma/client";

let url = process.env.DATABASE_URL || "";

try {
  if (url) {
    const u = new URL(url);

    const hostname = u.hostname || "";
    const isSupabase = hostname.endsWith("supabase.com");
    const isPooler = hostname.includes("pooler.supabase.com");

    // Se for Supabase, garanta SSL
    if (isSupabase && !u.searchParams.has("sslmode")) {
      u.searchParams.set("sslmode", "require");
    }

    // Se for o host de Pooler da Supabase, use porta 6543 e adicione flags de PgBouncer
    if (isPooler) {
      if (u.port !== "6543") {
        u.port = "6543"; // porta do pooler
      }
      if (!u.searchParams.has("pgbouncer")) {
        u.searchParams.set("pgbouncer", "true");
      }
      // Limite de conexões recomendado para Prisma + PgBouncer
      if (!u.searchParams.has("connection_limit")) {
        u.searchParams.set("connection_limit", "1");
      }
    }

    url = u.toString();
  }
} catch (e) {
  // Se a URL não puder ser parseada, mantém como está
}

const prisma = new PrismaClient({
  datasources: { db: { url } },
  log: ["query", "info", "warn", "error"],
});

export default prisma;
