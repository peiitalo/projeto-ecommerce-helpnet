// Script de manutenção: atualiza role para VENDEDOR onde TipoPessoa é Jurídica
// Uso: node src/scripts/updateRolesPJ.js

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import removerAcentos from 'remove-accents';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando atualização de roles para pessoas jurídicas...');

  // Busca clientes que ainda não são VENDEDOR e possuem TipoPessoa definido
  const clientes = await prisma.cliente.findMany({
    where: {
      NOT: { TipoPessoa: null },
    },
    select: { ClienteID: true, TipoPessoa: true, Email: true },
  });

  const juridicosIds = [];
  for (const c of clientes) {
    const tipoNorm = removerAcentos((c.TipoPessoa || '').toString()).toUpperCase();
    if (tipoNorm === 'JURIDICA') {
      juridicosIds.push(c.ClienteID);
    }
  }

  if (juridicosIds.length === 0) {
    console.log('Nenhum cliente PJ pendente de atualização encontrado.');
    return;
  }

  const res = await prisma.cliente.updateMany({
    where: { ClienteID: { in: juridicosIds } },
    data: { role: 'VENDEDOR' },
  });

  console.log(`Clientes PJ encontrados: ${juridicosIds.length}`);
  console.log(`Registros atualizados para VENDEDOR: ${res.count}`);
}

main()
  .catch((e) => {
    console.error('Erro ao atualizar roles:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });