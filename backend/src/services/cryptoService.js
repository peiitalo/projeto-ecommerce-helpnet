// backend/src/services/cryptoService.js
import bcrypt from 'bcryptjs';
const SALT_ROUNDS = 12;

const cryptoService = {
  async hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  },

  // Função para mascarar dados sensíveis (ex: CPF/CNPJ)
  maskSensitiveData(data, tipo) {
    if (!data) return '';
    
    if (tipo === 'cpf') {
      return data.replace(/(\d{3})\.(\d{3})\.(\d{3})-(\d{2})/, '$1.***.***-**');
    }
    if (tipo === 'cnpj') {
      return data.replace(/(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})-(\d{2})/, '$1.***.***/****-**');
    }
    return data;
  }
};

export default cryptoService;