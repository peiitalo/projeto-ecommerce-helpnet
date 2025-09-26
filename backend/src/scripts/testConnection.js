import { PrismaClient } from '@prisma/client';

async function testConnection() {
  const prisma = new PrismaClient();

  try {
    console.log('Testing database connection...');

    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query execution successful:', result);

    console.log('Database connection test completed successfully!');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();