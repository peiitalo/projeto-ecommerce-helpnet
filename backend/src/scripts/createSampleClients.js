// backend/src/scripts/createSampleClients.js
import prisma from '../config/prisma.js';
import cryptoService from '../services/cryptoService.js';

const sampleClients = [
  // Pessoa Física
  {
    NomeCompleto: 'João Silva Santos',
    TipoPessoa: 'Física',
    CPF_CNPJ: '123.456.789-01',
    Email: 'joao.silva@email.com',
    TelefoneCelular: '(11) 99999-0001',
    senha: 'senha123',
    endereco: {
      CEP: '01000-000',
      Cidade: 'São Paulo',
      UF: 'SP',
      Bairro: 'Centro',
      Numero: '123',
      Complemento: 'Apto 45'
    }
  },
  // Pessoa Jurídica
  {
    NomeCompleto: 'Empresa ABC Ltda',
    TipoPessoa: 'Jurídica',
    CPF_CNPJ: '12.345.678/0001-90',
    Email: 'contato@empresaabc.com.br',
    TelefoneCelular: '(11) 99999-0002',
    RazaoSocial: 'Empresa ABC Ltda',
    senha: 'senha123',
    endereco: {
      CEP: '02000-000',
      Cidade: 'São Paulo',
      UF: 'SP',
      Bairro: 'Vila Mariana',
      Numero: '456',
      Complemento: 'Sala 101'
    }
  },
  // Pessoa Física
  {
    NomeCompleto: 'Maria Oliveira Costa',
    TipoPessoa: 'Física',
    CPF_CNPJ: '234.567.890-12',
    Email: 'maria.oliveira@email.com',
    TelefoneCelular: '(21) 99999-0003',
    senha: 'senha123',
    endereco: {
      CEP: '20000-000',
      Cidade: 'Rio de Janeiro',
      UF: 'RJ',
      Bairro: 'Copacabana',
      Numero: '789',
      Complemento: 'Bloco B'
    }
  },
  // Pessoa Jurídica
  {
    NomeCompleto: 'Tech Solutions S.A.',
    TipoPessoa: 'Jurídica',
    CPF_CNPJ: '23.456.789/0001-01',
    Email: 'admin@techsolutions.com.br',
    TelefoneCelular: '(21) 99999-0004',
    RazaoSocial: 'Tech Solutions S.A.',
    senha: 'senha123',
    endereco: {
      CEP: '21000-000',
      Cidade: 'Rio de Janeiro',
      UF: 'RJ',
      Bairro: 'Barra da Tijuca',
      Numero: '101',
      Complemento: 'Torre A'
    }
  },
  // Pessoa Física
  {
    NomeCompleto: 'Carlos Eduardo Lima',
    TipoPessoa: 'Física',
    CPF_CNPJ: '345.678.901-23',
    Email: 'carlos.lima@email.com',
    TelefoneCelular: '(31) 99999-0005',
    senha: 'senha123',
    endereco: {
      CEP: '30000-000',
      Cidade: 'Belo Horizonte',
      UF: 'MG',
      Bairro: 'Savassi',
      Numero: '202',
      Complemento: 'Casa'
    }
  },
  // Pessoa Jurídica
  {
    NomeCompleto: 'Comércio Geral Ltda',
    TipoPessoa: 'Jurídica',
    CPF_CNPJ: '34.567.890/0001-12',
    Email: 'vendas@comerciogeral.com.br',
    TelefoneCelular: '(31) 99999-0006',
    RazaoSocial: 'Comércio Geral Ltda',
    senha: 'senha123',
    endereco: {
      CEP: '31000-000',
      Cidade: 'Belo Horizonte',
      UF: 'MG',
      Bairro: 'Centro',
      Numero: '303',
      Complemento: 'Loja 5'
    }
  },
  // Pessoa Física
  {
    NomeCompleto: 'Ana Paula Rodrigues',
    TipoPessoa: 'Física',
    CPF_CNPJ: '456.789.012-34',
    Email: 'ana.rodrigues@email.com',
    TelefoneCelular: '(71) 99999-0007',
    senha: 'senha123',
    endereco: {
      CEP: '40000-000',
      Cidade: 'Salvador',
      UF: 'BA',
      Bairro: 'Pituba',
      Numero: '404',
      Complemento: 'Apto 67'
    }
  },
  // Pessoa Jurídica
  {
    NomeCompleto: 'Indústria XYZ Ltda',
    TipoPessoa: 'Jurídica',
    CPF_CNPJ: '45.678.901/0001-23',
    Email: 'rh@industriaxyz.com.br',
    TelefoneCelular: '(71) 99999-0008',
    RazaoSocial: 'Indústria XYZ Ltda',
    senha: 'senha123',
    endereco: {
      CEP: '41000-000',
      Cidade: 'Salvador',
      UF: 'BA',
      Bairro: 'Imbuí',
      Numero: '505',
      Complemento: 'Galpão 2'
    }
  },
  // Pessoa Física
  {
    NomeCompleto: 'Roberto Fernandes',
    TipoPessoa: 'Física',
    CPF_CNPJ: '567.890.123-45',
    Email: 'roberto.fernandes@email.com',
    TelefoneCelular: '(41) 99999-0009',
    senha: 'senha123',
    endereco: {
      CEP: '80000-000',
      Cidade: 'Curitiba',
      UF: 'PR',
      Bairro: 'Batel',
      Numero: '606',
      Complemento: 'Cobertura'
    }
  },
  // Pessoa Jurídica
  {
    NomeCompleto: 'Serviços Digitais Ltda',
    TipoPessoa: 'Jurídica',
    CPF_CNPJ: '56.789.012/0001-34',
    Email: 'suporte@servicosdigitais.com.br',
    TelefoneCelular: '(41) 99999-0010',
    RazaoSocial: 'Serviços Digitais Ltda',
    senha: 'senha123',
    endereco: {
      CEP: '81000-000',
      Cidade: 'Curitiba',
      UF: 'PR',
      Bairro: 'Centro Cívico',
      Numero: '707',
      Complemento: 'Andar 15'
    }
  }
];

async function createSampleClients() {
  console.log('🚀 Iniciando criação de clientes de exemplo...');

  try {
    for (const [index, clientData] of sampleClients.entries()) {
      try {
        console.log(`\n📝 Criando cliente ${index + 1}: ${clientData.NomeCompleto}`);

        // Verificar se cliente já existe
        const clienteExistente = await prisma.cliente.findFirst({
          where: {
            OR: [
              { Email: clientData.Email },
              { CPF_CNPJ: clientData.CPF_CNPJ }
            ]
          }
        });

        if (clienteExistente) {
          console.log(`⚠️  Cliente ${clientData.Email} já existe, pulando...`);
          continue;
        }

        // Hash da senha
        const SenhaHash = await cryptoService.hashPassword(clientData.senha);

        // Gerar CodigoCliente incremental
        const ultimo = await prisma.cliente.findFirst({
          select: { CodigoCliente: true },
          orderBy: { CodigoCliente: 'desc' }
        });
        const CodigoCliente = (ultimo?.CodigoCliente ?? 1000) + 1;

        // Define role conforme tipo de pessoa
        const role = clientData.TipoPessoa === 'Jurídica' ? 'VENDEDOR' : 'CLIENTE';

        // Criar cliente
        const novoCliente = await prisma.cliente.create({
          data: {
            CodigoCliente,
            NomeCompleto: clientData.NomeCompleto.toUpperCase(),
            TipoPessoa: clientData.TipoPessoa,
            CPF_CNPJ: clientData.CPF_CNPJ,
            TelefoneCelular: clientData.TelefoneCelular,
            Email: clientData.Email.toLowerCase(),
            RazaoSocial: clientData.RazaoSocial ? clientData.RazaoSocial.toUpperCase() : null,
            SenhaHash,
            role,
          }
        });

        // Criar endereço
        await prisma.endereco.create({
          data: {
            ClienteID: novoCliente.ClienteID,
            Nome: 'Principal',
            CEP: clientData.endereco.CEP,
            Cidade: clientData.endereco.Cidade.toUpperCase(),
            UF: clientData.endereco.UF.toUpperCase(),
            Bairro: clientData.endereco.Bairro.toUpperCase(),
            Numero: clientData.endereco.Numero,
            Complemento: clientData.endereco.Complemento || null,
          }
        });

        console.log(`✅ Cliente criado com sucesso: ${clientData.NomeCompleto} (${role})`);

      } catch (error) {
        console.error(`❌ Erro ao criar cliente ${clientData.NomeCompleto}:`, error.message);
      }
    }

    console.log('\n🎉 Criação de clientes de exemplo concluída!');

    // Mostrar resumo
    const totalClientes = await prisma.cliente.count();
    const clientesFisicos = await prisma.cliente.count({ where: { TipoPessoa: 'Física' } });
    const clientesJuridicos = await prisma.cliente.count({ where: { TipoPessoa: 'Jurídica' } });

    console.log(`\n📊 Resumo:`);
    console.log(`Total de clientes: ${totalClientes}`);
    console.log(`Pessoas Físicas: ${clientesFisicos}`);
    console.log(`Pessoas Jurídicas: ${clientesJuridicos}`);

  } catch (error) {
    console.error('❌ Erro geral na criação de clientes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createSampleClients();
}

export default createSampleClients;