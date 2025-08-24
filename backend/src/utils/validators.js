const validator = require('validator');
const { cpf, cnpj } = require('cpf-cnpj-validator');

const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];
  if (password.length < minLength) errors.push(`Senha deve ter no mínimo ${minLength} caracteres`);
  if (!hasUpperCase) errors.push('Senha deve ter pelo menos uma letra maiúscula');
  if (!hasLowerCase) errors.push('Senha deve ter pelo menos uma letra minúscula');
  if (!hasNumbers) errors.push('Senha deve ter pelo menos um número');
  if (!hasSpecialChar) errors.push('Senha deve ter pelo menos um caractere especial');

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateDocument = (numero, tipo) => {
  const cleanDoc = numero.replace(/[^\d]/g, '');
  
  if (tipo === 'Física') {
    return {
      isValid: cpf.isValid(cleanDoc),
      formatted: cpf.format(cleanDoc),
      errors: cpf.isValid(cleanDoc) ? [] : ['CPF inválido']
    };
  } else {
    return {
      isValid: cnpj.isValid(cleanDoc),
      formatted: cnpj.format(cleanDoc),
      errors: cnpj.isValid(cleanDoc) ? [] : ['CNPJ inválido']
    };
  }
};

const validateEmail = (email) => {
  return {
    isValid: validator.isEmail(email),
    errors: validator.isEmail(email) ? [] : ['Email inválido']
  };
};

const validateCEP = (cep) => {
  const cleanCEP = cep.replace(/[^\d]/g, '');
  return {
    isValid: /^\d{8}$/.test(cleanCEP),
    formatted: cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2'),
    errors: /^\d{8}$/.test(cleanCEP) ? [] : ['CEP inválido']
  };
};

module.exports = {
  validatePassword,
  validateDocument,
  validateEmail,
  validateCEP
};